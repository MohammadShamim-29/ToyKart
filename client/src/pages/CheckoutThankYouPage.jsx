import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { FileDown, Home, Mail, Package, ShoppingBag, Truck } from "lucide-react";
import api from "../api";
import { formatBdt } from "../utils/formatCurrency";
import { clearCart } from "../app/cartSlice";
import { generateReceipt } from "../utils/generateReceipt";
import {
  orderNumberDisplay,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel
} from "../utils/orderDisplay";

const STORAGE_KEY = "checkout:lastOrder";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-BD", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const CheckoutThankYouPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const orderFromState = location.state?.order;
  const paymentStatus = searchParams.get("payment");
  const [order, setOrder] = useState(orderFromState ?? null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderFromState?._id) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orderFromState));
      setOrder(orderFromState);
    }
  }, [orderFromState]);

  useEffect(() => {
    if (paymentStatus === "success") {
      dispatch(clearCart());
    }
  }, [dispatch, paymentStatus]);

  useEffect(() => {
    const id = orderFromState?._id || order?._id;
    if (!id) {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?._id) setOrder(parsed);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      })
      .catch(() => {});
  }, [orderFromState?._id, order?._id]);

  const isOnlinePaid = paymentStatus === "success" || order?.isPaid;
  const isCod = order?.paymentMethod === "CashOnDelivery";

  const headline = useMemo(() => {
    if (isOnlinePaid) return "Payment successful!";
    if (isCod) return "Order placed successfully!";
    return "Thank you for your order!";
  }, [isOnlinePaid, isCod]);

  const subline = useMemo(() => {
    if (isOnlinePaid) {
      return "Your payment was received and your order is confirmed. We will prepare it for delivery soon.";
    }
    if (isCod) {
      return "We have received your order. Please keep cash ready when our delivery partner arrives.";
    }
    return "Your order has been submitted. We will keep you updated by email.";
  }, [isOnlinePaid, isCod]);

  const handleDownload = async () => {
    if (!order || downloading) return;
    setDownloading(true);
    try {
      await generateReceipt(order);
    } finally {
      setDownloading(false);
    }
  };

  const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const address = order?.shippingAddress || {};

  return (
    <section className="thank-you-page">
      <div className="container thank-you-layout">
        <motion.div
          className="thank-you-hero card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.div
            className="thank-you-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          >
            <motion.span
              className="thank-you-check-ring"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
            />
            <motion.span
              className="thank-you-check-icon"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.2 }}
            >
              <motion.svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
                />
              </motion.svg>
            </motion.span>
          </motion.div>

          <p className="thank-you-eyebrow">Order confirmed</p>
          <h1>{headline}</h1>
          <p className="thank-you-lead">{subline}</p>

          {order ? (
            <div className="thank-you-pills">
              <span className="thank-you-pill">#{orderNumberDisplay(order)}</span>
              <span className="thank-you-pill">{formatBdt(order.totalPrice || 0)}</span>
              <span className="thank-you-pill">{paymentMethodLabel(order.paymentMethod)}</span>
            </div>
          ) : null}
        </motion.div>

        {order ? (
          <motion.div
            className="thank-you-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="card thank-you-panel">
              <h2>Order summary</h2>
              <dl className="thank-you-facts">
                <div>
                  <dt>Order number</dt>
                  <dd>#{orderNumberDisplay(order)}</dd>
                </div>
                <div>
                  <dt>Placed on</dt>
                  <dd>{formatDateTime(order.createdAt)}</dd>
                </div>
                <div>
                  <dt>Payment method</dt>
                  <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd>{paymentStatusLabel(order)}</dd>
                </div>
                <div>
                  <dt>Order status</dt>
                  <dd>{orderStatusLabel(order.status)}</dd>
                </div>
              </dl>

              <div className="thank-you-lines-wrap">
                <h3>Items ordered</h3>
                <ul className="thank-you-lines">
                  {items.map((line, idx) => (
                    <li key={`${line.product}-${idx}`}>
                      <div className="thank-you-line-main">
                        <span className="thank-you-line-name">
                          {line.name}
                          {line.colorName ? (
                            <span className="thank-you-line-color"> · {line.colorName}</span>
                          ) : null}
                        </span>
                        <span className="thank-you-line-qty">× {line.qty}</span>
                      </div>
                      <span className="thank-you-line-price">{formatBdt(line.price * line.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="thank-you-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatBdt(order.itemsPrice || 0)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{formatBdt(order.shippingPrice || 0)}</dd>
                </div>
                <div className="thank-you-totals-grand">
                  <dt>Total</dt>
                  <dd>{formatBdt(order.totalPrice || 0)}</dd>
                </div>
              </dl>
            </div>

            <div className="stack-md thank-you-side">
              <div className="card thank-you-panel">
                <h2>Delivery details</h2>
                <address className="thank-you-address">
                  <strong>{address.firstName}</strong>
                  <span>{address.address}</span>
                  <span>
                    {address.city}
                    {address.postalCode ? `, ${address.postalCode}` : ""}, {address.country}
                  </span>
                  <span>Phone: {address.phone}</span>
                  {address.email ? <span>Email: {address.email}</span> : null}
                  {address.orderNotes?.trim() ? (
                    <span className="thank-you-notes">Note: {address.orderNotes}</span>
                  ) : null}
                </address>
              </div>

              <div className="card thank-you-panel thank-you-next">
                <h2>What happens next?</h2>
                <ol className="thank-you-steps">
                  <li>
                    <Package size={18} aria-hidden="true" />
                    <span>We confirm your order and prepare items for packing.</span>
                  </li>
                  <li>
                    <Truck size={18} aria-hidden="true" />
                    <span>Your package is shipped to the address above.</span>
                  </li>
                  <li>
                    <Mail size={18} aria-hidden="true" />
                    <span>You receive updates in your account and by email.</span>
                  </li>
                </ol>
              </div>

              <div className="card thank-you-actions-card">
                <button
                  type="button"
                  className="btn btn-primary thank-you-btn"
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  <FileDown size={20} />
                  {downloading ? "Preparing PDF…" : "Download invoice (PDF)"}
                </button>
                <Link to="/orders" className="btn btn-secondary thank-you-btn">
                  <ShoppingBag size={18} /> View my orders
                </Link>
                <Link to="/" className="btn btn-ghost thank-you-btn">
                  <Home size={18} /> Continue shopping
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="card thank-you-panel">
            <p className="subtext">
              Order details are not available in this session, but your request was submitted. Check{" "}
              <Link to="/orders">My orders</Link> after signing in.
            </p>
            <Link to="/" className="btn btn-primary">
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default CheckoutThankYouPage;
