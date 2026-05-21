import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Trash2, FileDown, Upload } from "lucide-react";
import api from "../api";
import { generateReceipt } from "../utils/generateReceipt";
import { getOrderStatusLabel, getOrderStatusUi } from "../utils/orderStatusLabel";
import ReturnPolicyContent from "../components/ReturnPolicyContent";
import CancellationPolicyContent from "../components/CancellationPolicyContent";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const titleCaseStatus = (status) => {
  const s = String(status || "").trim().toLowerCase();
  if (!s) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const REFUND_METHOD_OPTIONS = [
  {
    value: "OriginalPaymentMethod",
    label: "Original Payment Method",
    hint: "Refund to the same card or gateway used at checkout (SSLCommerz, etc.)"
  },
  {
    value: "BankTransfer",
    label: "Bank Transfer",
    hint: "Refund to your bank account — add account details below"
  },
  {
    value: "bKash",
    label: "bKash",
    hint: "Refund to your bKash wallet — add number below"
  },
  {
    value: "Nagad",
    label: "Nagad",
    hint: "Refund to your Nagad wallet — add number below"
  }
];

const refundAccountPlaceholder = (method) => {
  if (method === "BankTransfer") {
    return "Account holder name, bank name, account number, branch/routing (if any)";
  }
  if (method === "bKash") return "bKash number (e.g. 01XXXXXXXXX) and account name";
  if (method === "Nagad") return "Nagad number (e.g. 01XXXXXXXXX) and account name";
  return "Only required if you choose Bank Transfer, bKash, or Nagad";
};

const OrderStatusBadge = ({ order, status }) => {
  const cfg = order ? getOrderStatusUi(order) : getOrderStatusUi({ status });
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap"
      }}
    >
      {order ? getOrderStatusLabel(order) : cfg.label}
    </span>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [requestingId, setRequestingId] = useState("");

  const [returnModalOrderId, setReturnModalOrderId] = useState("");
  const [cancelModalOrderId, setCancelModalOrderId] = useState("");
  const [actionModalOrderId, setActionModalOrderId] = useState("");

  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState("OriginalPaymentMethod");
  const [returnAccountInfo, setReturnAccountInfo] = useState("");
  const [returnFiles, setReturnFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [cancelPolicyAccepted, setCancelPolicyAccepted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userInfo) {
        setError("Please login to view your orders.");
        return;
      }

      try {
        const [ordersRes, returnsRes] = await Promise.all([api.get("/orders/my"), api.get("/returns/my")]);
        setOrders(ordersRes.data);
        setReturnRequests(Array.isArray(returnsRes.data) ? returnsRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not fetch orders");
      }
    };

    fetchOrders();
  }, [userInfo]);

  const onDeleteHistory = async (orderId) => {
    const confirmed = window.confirm("Remove this order from your history?");
    if (!confirmed) return;

    try {
      setDeletingId(orderId);
      await api.patch(`/orders/${orderId}/delete-history`);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      if (actionModalOrderId === orderId) setActionModalOrderId("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove order history.");
    } finally {
      setDeletingId("");
    }
  };

  const uploadReturnFiles = async () => {
    if (returnFiles.length === 0) return [];
    const urls = [];
    for (const file of returnFiles) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        urls.push(data.url);
      } catch {
        // skip failed uploads
      }
    }
    return urls;
  };

  const onRequestReturn = async (orderId) => {
    const reason = String(returnReason || "").trim();
    if (!reason) return;
    try {
      setRequestingId(orderId);
      if (returnFiles.length > 0) setUploading(true);
      const evidence = await uploadReturnFiles();
      setUploading(false);
      const { data } = await api.post("/returns", {
        orderId,
        requestType: "return_refund",
        customerReason: reason,
        description: returnDescription.trim(),
        refundMethod: returnRefundMethod,
        refundAccountInfo: returnAccountInfo.trim(),
        evidenceAttachments: evidence
      });
      setReturnRequests((prev) => [data, ...prev]);
      setReturnModalOrderId("");
      setReturnReason("");
      setReturnDescription("");
      setReturnRefundMethod("OriginalPaymentMethod");
      setReturnAccountInfo("");
      setReturnFiles([]);
      setPolicyAccepted(false);
      setSuccessMsg("Your return request has been submitted successfully! We will review it shortly.");
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit return request.");
    } finally {
      setRequestingId("");
      setUploading(false);
    }
  };

  const onCancelOrder = async (orderId, reasonText) => {
    try {
      setCancellingId(orderId);
      const { data } = await api.patch(`/orders/${orderId}/cancel`, {
        reason: reasonText
      });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? data : order)));
      setCancelModalOrderId("");
      setCancelReason("");
      setCancelPolicyAccepted(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel this order.");
    } finally {
      setCancellingId("");
    }
  };

  const openReturnModal = (orderId) => {
    setError("");
    setSuccessMsg("");
    setReturnModalOrderId(orderId);
    setReturnReason("");
    setReturnDescription("");
    setReturnRefundMethod("OriginalPaymentMethod");
    setReturnAccountInfo("");
    setReturnFiles([]);
    setPolicyAccepted(false);
  };

  const openCancelModal = (orderId) => {
    setError("");
    setCancelModalOrderId(orderId);
    setCancelReason("");
    setCancelPolicyAccepted(false);
  };

  const closeReturnModal = () => {
    if (requestingId) return;
    setReturnModalOrderId("");
    setReturnReason("");
    setReturnDescription("");
    setReturnRefundMethod("OriginalPaymentMethod");
    setReturnAccountInfo("");
    setReturnFiles([]);
    setPolicyAccepted(false);
    setSuccessMsg("");
  };

  const closeCancelModal = () => {
    if (cancellingId) return;
    setCancelModalOrderId("");
    setCancelReason("");
    setCancelPolicyAccepted(false);
  };

  const closeActionModal = () => {
    if (cancellingId) return;
    setActionModalOrderId("");
  };

  const submitReturnModal = (e) => {
    e.preventDefault();
    if (!returnModalOrderId) return;
    if (!policyAccepted) {
      setError("Please accept the return policy before submitting.");
      return;
    }
    if (returnRefundMethod !== "OriginalPaymentMethod" && !String(returnAccountInfo || "").trim()) {
      setError("Please enter your bank or MFS account details for the selected refund method.");
      return;
    }
    onRequestReturn(returnModalOrderId);
  };

  const needsRefundAccount = returnRefundMethod !== "OriginalPaymentMethod";

  const submitCancelModal = (e) => {
    e.preventDefault();
    if (!cancelModalOrderId) return;
    if (!cancelPolicyAccepted) {
      setError("Please accept the cancellation policy before following through.");
      return;
    }
    onCancelOrder(cancelModalOrderId, cancelReason);
  };

  const latestRequestByOrderId = returnRequests.reduce((acc, req) => {
    const orderId = req?.order?._id || req?.order;
    if (!orderId) return acc;
    if (!acc[orderId]) acc[orderId] = req;
    return acc;
  }, {});

  const actionModalOrder = orders.find((order) => order._id === actionModalOrderId) || null;

  return (
    <section className="stack-md orders-page">
      <div className="section-head">
        <h1>My Orders</h1>
        <p className="subtext">
          {orders.length} order{orders.length === 1 ? "" : "s"} in your history
        </p>
      </div>

      {successMsg && <p className="success">{successMsg}</p>}
      {error && <p className="error">{error}</p>}
      {!error && !successMsg && orders.length === 0 && <p className="notice">No orders yet.</p>}

      <div className="orders-grid">
        {orders.map((order) => (
          <article className="card order-card" key={order._id}>
            {(() => {
              return (
                <>
                  <div className="order-card-head">
                    <div>
                      <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                      <p className="order-date">Placed {formatDateTime(order.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      className="order-delete-btn"
                      aria-label="Delete order history"
                      title="Delete order history"
                      disabled={deletingId === order._id}
                      onClick={() => onDeleteHistory(order._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="order-meta-grid">
                    <p>
                      <strong>Status:</strong>{" "}
                      <OrderStatusBadge order={order} />
                    </p>
                    <p>
                      <strong>Payment:</strong>{" "}
                      {order.paymentStatus === "refunded"
                        ? "Refunded"
                        : order.isPaid
                          ? "Paid"
                          : "Pending"}
                    </p>
                    <p>
                      <strong>Total:</strong> {currency.format(order.totalPrice || 0)}
                    </p>
                    <p>
                      <strong>Items:</strong> {order.orderItems.length}
                    </p>
                  </div>
                  {latestRequestByOrderId[order._id] && (
                    <Link
                      to={`/returns/${latestRequestByOrderId[order._id]._id}`}
                      className="order-return-row"
                      style={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      <strong>Return Request:</strong>{" "}
                      <span className="order-return-status">
                        {titleCaseStatus(latestRequestByOrderId[order._id].status || "requested")}
                      </span>
                    </Link>
                  )}
                  <div className="order-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, borderRadius: '12px' }}
                      onClick={() => setActionModalOrderId(order._id)}
                    >
                      Open Action Center
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ borderRadius: '12px', padding: '0.62rem' }}
                      title="Download Receipt"
                      onClick={() => generateReceipt(order)}
                    >
                      <FileDown size={20} />
                    </button>
                  </div>
                </>
              );
            })()}
          </article>
        ))}
      </div>

      {actionModalOrder && (
        <div className="return-modal-backdrop" role="presentation" onClick={closeActionModal}>
          <div className="return-modal order-action-modal glass-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const orderStatus = String(actionModalOrder.status || "pending").toLowerCase();
              const isDelivered = orderStatus === "delivered";
              const canCancel = ["pending", "confirmed", "processing"].includes(orderStatus);
              const hasReturnRequest = Boolean(latestRequestByOrderId[actionModalOrder._id]);
              const canRequestReturn = isDelivered && !hasReturnRequest && requestingId !== actionModalOrder._id;

              return (
                <>
                  <div className="return-modal-head">
                    <div>
                      <span className="eyebrow">Action Center</span>
                      <h3 style={{ marginTop: '0.2rem' }}>Order #{actionModalOrder._id.slice(-6).toUpperCase()}</h3>
                    </div>
                    <button type="button" className="return-modal-close" onClick={closeActionModal} disabled={Boolean(cancellingId)}>
                      ×
                    </button>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    padding: "1rem 0 0.75rem",
                    borderBottom: "1px solid var(--line)"
                  }}>
                    <OrderStatusBadge order={actionModalOrder} />
                    {actionModalOrder.paymentStatus === "refunded" ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "#0f766e",
                          background: "#ccfbf1",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Refunded
                      </span>
                    ) : actionModalOrder.isPaid ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "#059669",
                          background: "#d1fae5",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Paid
                      </span>
                    ) : null}
                    <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "#6b7280" }}>
                      {currency.format(actionModalOrder.totalPrice || 0)}
                    </span>
                  </div>

                  <div className="order-modal-action-row" style={{ marginTop: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--line)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={!canRequestReturn}
                      style={{ flex: 1, height: '48px' }}
                      onClick={() => {
                        setActionModalOrderId("");
                        openReturnModal(actionModalOrder._id);
                      }}
                    >
                      {hasReturnRequest ? "Return Requested" : "Request Return"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-soft"
                      disabled={!canCancel || cancellingId === actionModalOrder._id}
                      style={{ flex: 1, height: '48px' }}
                      onClick={() => {
                        setActionModalOrderId("");
                        openCancelModal(actionModalOrder._id);
                      }}
                    >
                      {cancellingId === actionModalOrder._id ? "Processing..." : "Cancel Order"}
                    </button>
                  </div>

                  <div style={{
                    marginTop: "1.25rem",
                    background: "var(--surface-soft)",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    border: "1px solid var(--line)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6b7280" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Shipping & Fulfillment</span>
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 160px" }}>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.2rem" }}>Method</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {actionModalOrder.fulfillment?.carrier || "Standard Shipping"}
                        </span>
                      </div>
                      <div style={{ flex: "1 1 160px" }}>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.2rem" }}>Tracking</span>
                        {actionModalOrder.fulfillment?.trackingNumber ? (
                          <span style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#2563eb",
                            fontFamily: "monospace"
                          }}>
                            {actionModalOrder.fulfillment.trackingNumber}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>
                            Assigning soon
                          </span>
                        )}
                      </div>
                      {actionModalOrder.fulfillment?.shippedAt && (
                        <div style={{ flex: "1 1 160px" }}>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.2rem" }}>Shipped</span>
                          <span style={{ fontSize: "0.85rem" }}>{formatDateTime(actionModalOrder.fulfillment.shippedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "1.5rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Timeline & Updates</h4>
                    {Array.isArray(actionModalOrder.statusHistory) && actionModalOrder.statusHistory.length > 0 ? (
                      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                        <div style={{
                          position: "absolute",
                          left: "7px",
                          top: "10px",
                          bottom: "10px",
                          width: "2px",
                          background: "#e5e7eb",
                          borderRadius: "1px"
                        }} />
                        {[...actionModalOrder.statusHistory].reverse().map((entry, idx) => {
                          const s = String(entry.to || "").toLowerCase();
                          const cfg = getOrderStatusUi({ status: s });
                          const isLast = idx === 0;
                          return (
                            <div key={`${entry.changedAt || idx}-${entry.to || idx}`} style={{ position: "relative", paddingBottom: idx < actionModalOrder.statusHistory.length - 1 ? "1rem" : 0 }}>
                              <div style={{
                                position: "absolute",
                                left: "-1.5rem",
                                top: "6px",
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: isLast ? cfg.color : cfg.bg,
                                border: `2.5px solid ${cfg.color}`,
                                zIndex: 1,
                                boxSizing: "border-box"
                              }} />
                              <div style={{ marginLeft: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <span style={{
                                    display: "inline-block",
                                    padding: "2px 10px",
                                    borderRadius: "999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: cfg.color,
                                    background: cfg.bg,
                                    whiteSpace: "nowrap"
                                  }}>
                                    {getOrderStatusLabel({ status: entry.to })}
                                  </span>
                                  {entry.changedAt && (
                                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                      {formatDateTime(entry.changedAt)}
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
                                  {entry.note || "Order state change"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>
                        Order is being prepared for shipment.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {returnModalOrderId && (
        <div className="return-modal-backdrop" role="presentation" onClick={closeReturnModal}>
          <div className="return-modal return-modal--scroll" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
            <div className="return-modal-head">
              <h3>Return / Refund Request</h3>
              <button type="button" className="return-modal-close" onClick={closeReturnModal} disabled={Boolean(requestingId)}>
                x
              </button>
            </div>

            <form className="return-modal-form" onSubmit={submitReturnModal}>
              <label>
                Reason for Return *
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Product is damaged / Wrong item received / Quality issue"
                  minLength={10}
                  required
                  style={{ minHeight: "70px" }}
                />
              </label>

              <label>
                Detailed Description
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  style={{ minHeight: "80px" }}
                />
              </label>

              <div className="return-refund-method-field">
                <span className="return-refund-method-label">Preferred Refund Method *</span>
                <div className="return-refund-method-picker" role="radiogroup" aria-label="Preferred refund method">
                  {REFUND_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={returnRefundMethod === opt.value}
                      className={`return-refund-method-option${returnRefundMethod === opt.value ? " is-selected" : ""}`}
                      onClick={() => setReturnRefundMethod(opt.value)}
                    >
                      <span className="return-refund-method-option-title">{opt.label}</span>
                      <span className="return-refund-method-option-hint">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className={needsRefundAccount ? "return-account-required" : ""}>
                {needsRefundAccount ? "Refund account details *" : "Refund account details (optional)"}
                <input
                  type="text"
                  value={returnAccountInfo}
                  onChange={(e) => setReturnAccountInfo(e.target.value)}
                  placeholder={refundAccountPlaceholder(returnRefundMethod)}
                  required={needsRefundAccount}
                  disabled={!needsRefundAccount}
                  aria-disabled={!needsRefundAccount}
                />
                {needsRefundAccount ? (
                  <span className="return-field-hint">
                    We will send the refund to this account after your return is approved.
                  </span>
                ) : (
                  <span className="return-field-hint">
                    Not needed when refunding to your original payment method.
                  </span>
                )}
              </label>

              <label style={{ border: "2px dashed var(--line, #d1d5db)", borderRadius: "10px", padding: "1rem", textAlign: "center", cursor: "pointer" }}>
                <Upload size={24} style={{ display: "block", margin: "0 auto 0.5rem", color: "#6b7280" }} />
                <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Upload evidence (images/videos)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => setReturnFiles(Array.from(e.target.files || []))}
                  style={{ display: "none" }}
                />
                {returnFiles.length > 0 && (
                  <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.8rem", color: "#059669" }}>
                    {returnFiles.length} file{returnFiles.length > 1 ? "s" : ""} selected
                  </span>
                )}
              </label>

              <div className="policy-link-row" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="subtext-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9rem' }}
                  onClick={() => setShowPolicyModal(true)}
                >
                  View Return & Refund Policy
                </button>
              </div>

              <label className="return-policy-accept">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  required
                />
                I have read and agree to the return policy.
              </label>

              <div className="return-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeReturnModal} disabled={Boolean(requestingId)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(requestingId || uploading)}>
                  {uploading ? "Uploading..." : requestingId ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelModalOrderId && (
        <div className="return-modal-backdrop" role="presentation" onClick={closeCancelModal}>
          <div className="return-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-head">
              <h3>Cancel order</h3>
              <button type="button" className="return-modal-close" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                x
              </button>
            </div>

            <form className="return-modal-form" onSubmit={submitCancelModal}>
              <label>
                Reason for cancellation
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. ordered by mistake / no longer needed"
                  minLength={5}
                  required
                />
              </label>

              <div className="policy-link-row" style={{ marginBottom: "0.75rem" }}>
                <Link
                  to="/cancellation-policy#order-cancellation-policy"
                  className="subtext-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  বাতিল নীতিমালা দেখুন (সম্পূর্ণ)
                </Link>
              </div>

              <div className="return-policy-box cancellation-policy-box">
                <h4 className="cancellation-policy-title">বাতিল নীতিমালা</h4>
                <CancellationPolicyContent />
              </div>

              <label className="return-policy-accept">
                <input
                  type="checkbox"
                  checked={cancelPolicyAccepted}
                  onChange={(e) => setCancelPolicyAccepted(e.target.checked)}
                  required
                />
                আমি বাতিল নীতিমালা পড়েছি এবং সম্মত।
              </label>

              <div className="return-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(cancellingId)}>
                  {cancellingId ? "Cancelling…" : "Cancel order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="return-modal-backdrop" role="presentation" onClick={() => setShowPolicyModal(false)} style={{ zIndex: 1100 }}>
          <div className="return-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-head">
              <h3>Return &amp; Refund Policy</h3>
              <button type="button" className="return-modal-close" onClick={() => setShowPolicyModal(false)}>
                x
              </button>
            </div>
            <div className="return-policy-box return-policy-box--modal">
              <ReturnPolicyContent />
              <div className="return-modal-actions" style={{ marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-primary" onClick={() => setShowPolicyModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
