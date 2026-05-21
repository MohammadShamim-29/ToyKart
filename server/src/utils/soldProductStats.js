import mongoose from "mongoose";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Product from "../models/Product.js";

const baseOrderMatch = { adminDeletedAt: { $exists: false } };

/** Delivered, not cancelled/refunded — base for a completed sale. */
const deliveredOrderMatch = {
  ...baseOrderMatch,
  status: "delivered"
};

const isRefundFinalized = (returnRow) => {
  if (!returnRow) return false;
  if (returnRow.status === "REFUND_PROCESSED") return true;
  if (returnRow.status === "REFUND_APPROVED") return false;
  if (returnRow.status === "COMPLETED" && returnRow.refundDetails?.processedAt) {
    return !returnRow.replacementDetails?.replacementOrder;
  }
  return false;
};

const isReplacementFulfilled = (returnRow) =>
  returnRow?.status === "REPLACEMENT_DELIVERED" ||
  (returnRow?.status === "COMPLETED" && Boolean(returnRow.replacementDetails?.replacementOrder));

const productIdStr = (id) => String(id?._id ?? id ?? "");

const mapKey = (productId) => productIdStr(productId);

function ensureBucket(map, productId, seed = {}) {
  const key = mapKey(productId);
  if (!map.has(key)) {
    map.set(key, {
      productId: key,
      unitsSold: 0,
      revenue: 0,
      name: seed.name || "",
      image: seed.image || "",
      sku: seed.sku || "",
      categoryId: seed.categoryId ? String(seed.categoryId) : "",
      categoryName: seed.categoryName || ""
    });
  }
  return map.get(key);
}

function addLine(map, { productId, name, qty, price, image, sku, categoryId, categoryName }) {
  const q = Number(qty) || 0;
  if (!productId || q <= 0) return;
  const row = ensureBucket(map, productId, { name, image, sku, categoryId, categoryName });
  if (name) row.name = name;
  row.unitsSold += q;
  row.revenue += q * (Number(price) || 0);
}

/**
 * Sold units = delivered order lines, minus finalized refunds/returns on that line,
 * plus replacement order lines when replacement was delivered (not refunded).
 */
export async function computeSoldProductStats({ overallLimit = 10, perCategoryLimit = 1 } = {}) {
  const [deliveredOrders, returns, products] = await Promise.all([
    Order.find(deliveredOrderMatch).select("_id orderItems").lean(),
    ReturnRequest.find()
      .select("order orderItem status refundDetails replacementDetails")
      .lean(),
    Product.find({ status: "active" })
      .select("name sku image category")
      .populate("category", "name slug")
      .lean()
  ]);

  const productMeta = new Map(
    products.map((p) => [
      mapKey(p._id),
      {
        name: p.name,
        sku: p.sku,
        image: p.image,
        categoryId: p.category?._id ? String(p.category._id) : "",
        categoryName: p.category?.name || "Uncategorized"
      }
    ])
  );

  const returnsByOrder = new Map();
  for (const r of returns) {
    const oid = productIdStr(r.order);
    if (!returnsByOrder.has(oid)) returnsByOrder.set(oid, []);
    returnsByOrder.get(oid).push(r);
  }

  const replacementOrderIds = [
    ...new Set(
      returns
        .filter((r) => isReplacementFulfilled(r) && r.replacementDetails?.replacementOrder)
        .map((r) => productIdStr(r.replacementDetails.replacementOrder))
    )
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));

  const replacementOrders =
    replacementOrderIds.length > 0
      ? await Order.find({
          _id: { $in: replacementOrderIds },
          ...deliveredOrderMatch
        })
          .select("_id orderItems")
          .lean()
      : [];

  const replacementOrderSet = new Set(replacementOrders.map((o) => productIdStr(o._id)));

  const soldMap = new Map();

  for (const order of deliveredOrders) {
    if (replacementOrderSet.has(productIdStr(order._id))) {
      continue;
    }

    const orderReturns = returnsByOrder.get(productIdStr(order._id)) || [];

    for (const item of order.orderItems || []) {
      const pid = mapKey(item.product);
      const meta = productMeta.get(pid) || {};
      let qty = Number(item.qty) || 0;

      for (const ret of orderReturns) {
        const retPid = mapKey(ret.orderItem?.product);
        if (retPid !== pid) continue;

        if (isReplacementFulfilled(ret) || isRefundFinalized(ret)) {
          qty = 0;
          break;
        }
      }

      if (qty > 0) {
        addLine(soldMap, {
          productId: pid,
          name: item.name || meta.name,
          qty,
          price: item.price,
          image: meta.image,
          sku: meta.sku,
          categoryId: meta.categoryId,
          categoryName: meta.categoryName
        });
      }
    }
  }

  for (const repOrder of replacementOrders) {
    for (const item of repOrder.orderItems || []) {
      const pid = mapKey(item.product);
      const meta = productMeta.get(pid) || {};
      addLine(soldMap, {
        productId: pid,
        name: item.name || meta.name,
        qty: item.qty,
        price: item.price,
        image: meta.image,
        sku: meta.sku,
        categoryId: meta.categoryId,
        categoryName: meta.categoryName
      });
    }
  }

  const allSold = [...soldMap.values()]
    .map((row) => {
      const meta = productMeta.get(row.productId) || {};
      return {
        ...row,
        name: row.name || meta.name || "Product",
        sku: row.sku || meta.sku || "",
        image: row.image || meta.image || "",
        categoryId: row.categoryId || meta.categoryId || "",
        categoryName: row.categoryName || meta.categoryName || "Uncategorized"
      };
    })
    .filter((r) => r.unitsSold > 0)
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

  const overallTop = allSold.slice(0, overallLimit).map((r) => ({
    id: r.productId,
    name: r.name,
    sku: r.sku,
    image: r.image,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    unitsSold: r.unitsSold,
    revenue: r.revenue
  }));

  const byCategory = new Map();
  for (const row of allSold) {
    const catKey = row.categoryId || row.categoryName || "uncategorized";
    if (!byCategory.has(catKey)) {
      byCategory.set(catKey, row);
    }
  }

  const topSoldByCategory = [...byCategory.values()]
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    .slice(0, perCategoryLimit * 50)
    .map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      product: {
        id: r.productId,
        name: r.name,
        sku: r.sku,
        image: r.image,
        unitsSold: r.unitsSold,
        revenue: r.revenue
      }
    }));

  return { overallTop, topSoldByCategory, allSoldCount: allSold.length };
}
