import mongoose from "mongoose";
import { randomUUID } from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ShippingCountry from "../models/ShippingCountry.js";
import ShippingDistrict from "../models/ShippingDistrict.js";
import {
  actorFromUser,
  appendAdminNote,
  derivePaymentStatus,
  ensureOrderLifecycleDefaults,
  humanOrderNumber,
  normalizeOrderStatus,
  setOrderStatus
} from "../utils/orderLifecycle.js";
import { sendOrderConfirmation, sendOrderCancelled } from "../utils/mailer.js";

const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

const DHAKA_SHIPPING_BDT = 60;
const OUTSIDE_DHAKA_SHIPPING_BDT = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SSL_PAYMENT_METHOD = "SSLCommerz";

const normalizeText = (value) => String(value ?? "").trim();
const isDhakaCity = (city) => normalizeText(city).toLowerCase() === "dhaka";
const calculateShippingPrice = ({ city, hasItems }) => {
  if (!hasItems) return 0;
  return isDhakaCity(city) ? DHAKA_SHIPPING_BDT : OUTSIDE_DHAKA_SHIPPING_BDT;
};
const withOptionalSession = (query, session) => (session ? query.session(session) : query);
const isTransactionsUnsupported = (error) =>
  typeof error?.message === "string" &&
  (error.message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
    error.message.toLowerCase().includes("replica set"));

const restoreOrderStock = async (order) => {
  if (!Array.isArray(order?.orderItems) || order.orderItems.length === 0) return;
  for (const item of order.orderItems) {
    if (!item?.product || !item?.qty) continue;
    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: Number(item.qty) || 0 } });
  }
};

const serializeOrder = (orderDoc) => {
  if (!orderDoc) return orderDoc;
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject({ virtuals: false }) : orderDoc;
  ensureOrderLifecycleDefaults(order);
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    paymentStatus: derivePaymentStatus(order),
    orderNumber: humanOrderNumber(order._id)
  };
};

const validateShippingAddress = async (shippingAddress, session) => {
  const firstName = normalizeText(shippingAddress?.firstName);
  const address = normalizeText(shippingAddress?.address);
  const country = normalizeText(shippingAddress?.country);
  const city = normalizeText(shippingAddress?.city);
  const phone = normalizeText(shippingAddress?.phone);
  const email = normalizeText(shippingAddress?.email);
  const orderNotes = normalizeText(shippingAddress?.orderNotes);
  const postalCode = normalizeText(shippingAddress?.postalCode);

  if (!firstName) throw badRequest("First name is required.");
  if (!address) throw badRequest("Street address is required.");
  if (!country) throw badRequest("Country is required.");
  if (!city) throw badRequest("District/City is required.");
  if (!phone) throw badRequest("Phone number is required.");
  if (email && !EMAIL_REGEX.test(email)) throw badRequest("Email address is invalid.");

  const countryDoc = await withOptionalSession(
    ShippingCountry.findOne({
      name: country,
      isEnabled: true
    }),
    session
  );
  if (!countryDoc) {
    throw badRequest("Selected country is not available for shipping.");
  }

  const districtDoc = await withOptionalSession(
    ShippingDistrict.findOne({
      country: countryDoc._id,
      name: city,
      isEnabled: true
    }),
    session
  );
  if (!districtDoc) {
    throw badRequest("Selected district/city is not available for shipping.");
  }

  return {
    firstName,
    address,
    country: countryDoc.name,
    city: districtDoc.name,
    phone,
    email,
    orderNotes,
    postalCode
  };
};

const createOrderInternal = async ({
  session,
  req,
  orderItems,
  shippingAddress,
  itemsPrice,
  taxPrice,
  shippingPrice,
  totalPrice
}) => {
  const normalizedShippingAddress = await validateShippingAddress(shippingAddress, session);
  const resolvedItems = [];

  for (const item of orderItems) {
    const product = await withOptionalSession(Product.findById(item.product), session);
    if (!product || product.status !== "active") {
      throw badRequest(`Product unavailable: ${item.name || item.product}`);
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > product.countInStock) {
      throw badRequest(`Insufficient stock for ${product.name}`);
    }
    if (Math.abs(Number(item.price) - Number(product.price)) > 0.01) {
      throw badRequest(`Price changed for ${product.name}. Refresh your cart.`);
    }

    product.countInStock -= qty;
    if (session) {
      await product.save({ session });
    } else {
      await product.save();
    }

    resolvedItems.push({
      name: product.name,
      qty: item.qty,
      image: item.image || product.image,
      price: product.price,
      product: product._id
    });
  }

  const computedItems = resolvedItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  if (Math.abs(computedItems - Number(itemsPrice)) > 0.01) {
    throw badRequest("Order totals do not match line items.");
  }

  const expectedShipping = calculateShippingPrice({
    city: normalizedShippingAddress.city,
    hasItems: resolvedItems.length > 0
  });
  if (Math.abs(Number(shippingPrice || 0) - expectedShipping) > 0.01) {
    throw badRequest("Shipping amount is invalid.");
  }

  const expectedTax = 0;
  if (Math.abs(Number(taxPrice || 0) - expectedTax) > 0.01) {
    throw badRequest("Tax amount is invalid.");
  }

  const computedTotal = computedItems + expectedTax + expectedShipping;
  if (Math.abs(computedTotal - Number(totalPrice)) > 0.01) {
    throw badRequest("Order total is incorrect.");
  }

  const actor = actorFromUser(req.user);
  const baseOrder = {
    user: req.user._id,
    orderItems: resolvedItems,
    shippingAddress: normalizedShippingAddress,
    paymentMethod: "CashOnDelivery",
    itemsPrice: computedItems,
    taxPrice: expectedTax,
    shippingPrice: expectedShipping,
    totalPrice: computedTotal,
    status: "pending",
    statusHistory: [
      {
        from: "pending",
        to: "pending",
        note: "Order placed by customer",
        changedBy: actor,
        changedAt: new Date()
      }
    ]
  };

  if (session) {
    const orders = await Order.create([baseOrder], { session });
    return orders[0];
  }

  return Order.create(baseOrder);
};

const createOrderWithTransactionFallback = async ({
  req,
  orderItems,
  shippingAddress,
  itemsPrice,
  taxPrice,
  shippingPrice,
  totalPrice
}) => {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      created = await createOrderInternal({
        session,
        req,
        orderItems,
        shippingAddress,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      });
    });
    return created;
  } catch (error) {
    if (!isTransactionsUnsupported(error)) {
      throw error;
    }

    // Local Mongo without replica set: run without transaction as fallback.
    return createOrderInternal({
      session: null,
      req,
      orderItems,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });
  } finally {
    session.endSession();
  }
};

const normalizeOrderIdParam = (raw) => {
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") return null;
  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
};

const getSslBaseUrl = () =>
  String(process.env.SSLCZ_IS_LIVE).toLowerCase() === "true"
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";

const resolveServerBaseUrl = (req) => {
  const fromEnv = normalizeText(process.env.SERVER_BASE_URL);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
};

const resolveClientBaseUrl = () => {
  const fromEnv = normalizeText(process.env.CLIENT_URL);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "http://localhost:5173";
};

const validateSslPayment = async (valId) => {
  const params = new URLSearchParams({
    val_id: valId,
    store_id: process.env.SSLCZ_STORE_ID || "",
    store_passwd: process.env.SSLCZ_STORE_PASSWORD || "",
    v: "1",
    format: "json"
  });
  const response = await fetch(`${getSslBaseUrl()}/validator/api/validationserverAPI.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`SSLCommerz validation failed with status ${response.status}`);
  }
  return response.json();
};

export const createOrder = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }
  if (paymentMethod && !["CashOnDelivery", SSL_PAYMENT_METHOD].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  try {
    const created = await createOrderWithTransactionFallback({
      req,
      orderItems,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    if (paymentMethod === SSL_PAYMENT_METHOD) {
      created.paymentMethod = SSL_PAYMENT_METHOD;
      await created.save();
    }

    sendOrderConfirmation(created, req.user);

    return res.status(201).json(serializeOrder(created));
  } catch (e) {
    if (e.statusCode === 400) {
      return res.status(400).json({ message: e.message });
    }
    console.error(e);
    return res.status(500).json({ message: "Could not create order" });
  }
};

export const initSslCommerzPayment = async (req, res) => {
  const id = normalizeOrderIdParam(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid order id" });

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to access this order" });
  }
  if (order.isPaid) return res.status(400).json({ message: "Order is already paid." });
  if (order.paymentMethod !== SSL_PAYMENT_METHOD) {
    return res.status(400).json({ message: "This order is not configured for SSLCommerz payment." });
  }

  if (!process.env.SSLCZ_STORE_ID || !process.env.SSLCZ_STORE_PASSWORD) {
    console.error("[SSLCommerz] Missing credentials at runtime", {
      hasStoreId: Boolean(process.env.SSLCZ_STORE_ID),
      hasStorePassword: Boolean(process.env.SSLCZ_STORE_PASSWORD),
      cwd: process.cwd()
    });
    return res.status(500).json({ message: "SSLCommerz credentials are missing in server environment." });
  }

  const tranId = order.paymentReference || `TOYKART_${order._id}_${randomUUID().slice(0, 8)}`;
  const serverBaseUrl = resolveServerBaseUrl(req);
  const clientBaseUrl = resolveClientBaseUrl();
  const payload = new URLSearchParams({
    store_id: process.env.SSLCZ_STORE_ID,
    store_passwd: process.env.SSLCZ_STORE_PASSWORD,
    total_amount: String(Number(order.totalPrice).toFixed(2)),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${serverBaseUrl}/api/orders/payment/sslcommerz/success`,
    fail_url: `${serverBaseUrl}/api/orders/payment/sslcommerz/fail`,
    cancel_url: `${serverBaseUrl}/api/orders/payment/sslcommerz/cancel`,
    ipn_url: `${serverBaseUrl}/api/orders/payment/sslcommerz/ipn`,
    shipping_method: "NO",
    product_name: "ToyKart Order",
    product_category: "Toys",
    product_profile: "general",
    cus_name: order.shippingAddress?.firstName || "Customer",
    cus_email: order.shippingAddress?.email || "customer@example.com",
    cus_add1: order.shippingAddress?.address || "N/A",
    cus_city: order.shippingAddress?.city || "N/A",
    cus_country: order.shippingAddress?.country || "Bangladesh",
    cus_phone: order.shippingAddress?.phone || "01700000000",
    value_a: String(order._id),
    value_b: String(order.user),
    value_c: `${clientBaseUrl}/checkout/thank-you`,
    value_d: ""
  });

  const response = await fetch(`${getSslBaseUrl()}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString()
  });
  if (!response.ok) {
    return res.status(502).json({ message: "Could not initiate payment session." });
  }

  const result = await response.json();
  if (!result?.GatewayPageURL) {
    return res.status(400).json({ message: result?.failedreason || "Payment gateway did not return a checkout URL." });
  }

  order.paymentReference = tranId;
  await order.save();
  return res.json({ redirectUrl: result.GatewayPageURL });
};

const applyValidatedPaymentToOrder = async (payload) => {
  const valId = normalizeText(payload?.val_id);
  const tranId = normalizeText(payload?.tran_id);
  if (!valId || !tranId) return null;

  const validation = await validateSslPayment(valId);
  if (!validation || String(validation.status).toUpperCase() !== "VALID") return null;

  const orderId = normalizeOrderIdParam(validation.value_a);
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;
  if (order.isPaid) return order;

  const amountMatches = Math.abs(Number(validation.amount) - Number(order.totalPrice)) <= 0.01;
  const tranMatches = normalizeText(order.paymentReference) === normalizeText(validation.tran_id);
  if (!amountMatches || !tranMatches) return null;

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentReference = normalizeText(validation.bank_tran_id) || normalizeText(validation.tran_id);
  await order.save();
  return order;
};

export const sslCommerzSuccess = async (req, res) => {
  const result = await applyValidatedPaymentToOrder(req.body);
  const clientBaseUrl = resolveClientBaseUrl();
  if (!result) {
    return res.redirect(`${clientBaseUrl}/checkout?payment=failed`);
  }
  return res.redirect(`${clientBaseUrl}/checkout/thank-you?payment=success`);
};

export const sslCommerzFail = async (req, res) => {
  const clientBaseUrl = resolveClientBaseUrl();
  return res.redirect(`${clientBaseUrl}/checkout?payment=failed`);
};

export const sslCommerzCancel = async (req, res) => {
  const clientBaseUrl = resolveClientBaseUrl();
  return res.redirect(`${clientBaseUrl}/checkout?payment=cancelled`);
};

export const sslCommerzIpn = async (req, res) => {
  try {
    await applyValidatedPaymentToOrder(req.body);
  } catch (error) {
    console.error("SSLCommerz IPN processing failed:", error);
  }
  return res.sendStatus(200);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id, customerDeletedAt: { $exists: false } }).sort({ createdAt: -1 });
  return res.json(orders.map((order) => serializeOrder(order)));
};

export const getMyOrderById = async (req, res) => {
  const id = normalizeOrderIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to access this order" });
  }

  ensureOrderLifecycleDefaults(order);
  return res.json(serializeOrder(order));
};

export const cancelMyOrder = async (req, res) => {
  const id = normalizeOrderIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to cancel this order" });
  }

  ensureOrderLifecycleDefaults(order);

  const current = normalizeOrderStatus(order.status);
  if (!["pending", "confirmed", "processing"].includes(current)) {
    return res.status(400).json({
      message: `Order cannot be cancelled after ${current}. Please contact support for help.`
    });
  }

  const reason = normalizeText(req.body?.reason);
  const actor = actorFromUser(req.user);

  setOrderStatus(order, {
    toStatus: "cancelled",
    actor,
    note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer"
  });



  order.cancelReason = reason || "Cancelled by customer";
  order.cancelledBy = actor;
  order.cancelledAt = new Date();

  appendAdminNote(order, {
    body: reason ? `Customer cancellation reason: ${reason}` : "Customer cancelled this order.",
    actor,
    isPrivate: false
  });

  await restoreOrderStock(order);
  await order.save();

  sendOrderCancelled(order, req.user, reason);

  return res.json(serializeOrder(order));
};

export const deleteMyOrderHistory = async (req, res) => {
  const id = normalizeOrderIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to modify this order" });
  }

  if (!order.customerDeletedAt) {
    order.customerDeletedAt = new Date();
    await order.save();
  }

  return res.json({ message: "Order removed from your history." });
};
