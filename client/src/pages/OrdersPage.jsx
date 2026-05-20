import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Trash2, FileDown } from "lucide-react";
import api from "../api";
import { generateReceipt } from "../utils/generateReceipt";

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

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [requestingId, setRequestingId] = useState("");
  
  const [returnModalOrderId, setReturnModalOrderId] = useState("");
  const [cancelModalOrderId, setCancelModalOrderId] = useState("");
  const [actionModalOrderId, setActionModalOrderId] = useState("");
  
  const [returnReason, setReturnReason] = useState("");
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

  const onRequestReturn = async (orderId, reasonText) => {
    const reason = String(reasonText || "").trim();
    if (!reason) return;
    try {
      setRequestingId(orderId);
      const { data } = await api.post("/returns", {
        orderId,
        requestType: "return_refund",
        customerReason: reason
      });
      setReturnRequests((prev) => [data, ...prev]);
      setReturnModalOrderId("");
      setReturnReason("");
      setPolicyAccepted(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit return request.");
    } finally {
      setRequestingId("");
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
    setReturnModalOrderId(orderId);
    setReturnReason("");
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
    setPolicyAccepted(false);
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
    onRequestReturn(returnModalOrderId, returnReason);
  };

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

      {error && <p className="error">{error}</p>}
      {!error && orders.length === 0 && <p className="notice">No orders yet.</p>}

      <div className="orders-grid">
        {orders.map((order) => (
          <article className="card order-card" key={order._id}>
            {(() => {
              const orderStatus = String(order.status || "pending").toLowerCase();
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
                      <span className={`order-status-pill status-${orderStatus}`}>
                        {titleCaseStatus(order.status)}
                      </span>
                    </p>
                    <p>
                      <strong>Payment:</strong> {order.isPaid ? "Paid" : "Pending"}
                    </p>
                    <p>
                      <strong>Total:</strong> {currency.format(order.totalPrice || 0)}
                    </p>
                    <p>
                      <strong>Items:</strong> {order.orderItems.length}
                    </p>
                  </div>
                  {latestRequestByOrderId[order._id] && (
                    <p className="order-return-row">
                      <strong>Return Request:</strong>{" "}
                      <span className="order-return-status">
                        {titleCaseStatus(latestRequestByOrderId[order._id].status || "requested")}
                      </span>
                    </p>
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

                  <div className="order-tracking-summary">
                    <div className="tracking-status-badge">
                      <span className={`order-status-pill status-${orderStatus} large`}>
                        {titleCaseStatus(actionModalOrder.status)}
                      </span>
                      {actionModalOrder.isPaid && <span className="payment-badge paid">Paid</span>}
                    </div>
                  </div>

                  <div className="order-modal-action-row" style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
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

                  <div className="order-details-grid" style={{ marginTop: '1.5rem' }}>
                    <div className="info-item">
                      <label>Shipping Method</label>
                      <p>{actionModalOrder.fulfillment?.carrier || "Standard Shipping"}</p>
                    </div>
                    <div className="info-item">
                      <label>Tracking Code</label>
                      <p className="tracking-number">{actionModalOrder.fulfillment?.trackingNumber || "Assigning soon"}</p>
                    </div>
                  </div>

                  <div className="order-timeline-container">
                    <h4>Timeline & Updates</h4>
                    <div className="modern-timeline">
                      {Array.isArray(actionModalOrder.statusHistory) && actionModalOrder.statusHistory.length > 0 ? (
                        <div className="timeline-items">
                          {[...actionModalOrder.statusHistory].reverse().map((entry, idx) => (
                            <div className="timeline-item" key={`${entry.changedAt || idx}-${entry.to || idx}`}>
                              <div className="timeline-dot"></div>
                              <div className="timeline-content">
                                <div className="timeline-header">
                                  <strong>{titleCaseStatus(entry.to)}</strong>
                                  <span className="timeline-date">{formatDateTime(entry.changedAt)}</span>
                                </div>
                                <p className="timeline-note">{entry.note || "Order state change"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="timeline-empty">
                          <p>Order is being prepared for shipment.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {returnModalOrderId && (
        <div className="return-modal-backdrop" role="presentation" onClick={closeReturnModal}>
          <div className="return-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="return-modal-head">
              <h3>রিটার্ন বা রিফান্ড রিকোয়েস্ট</h3>
              <button type="button" className="return-modal-close" onClick={closeReturnModal} disabled={Boolean(requestingId)}>
                x
              </button>
            </div>

            <form className="return-modal-form" onSubmit={submitReturnModal}>
              <label>
                সমস্যার বিবরণ (কারণ)
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="যেমন: পণ্যটি ড্যামেজড এসেছে / ভুল পণ্য পেয়েছি / কোয়ালিটি সমস্যা"
                  minLength={10}
                  required
                />
              </label>

              <div className="policy-link-row" style={{ marginBottom: '1rem' }}>
                <button 
                  type="button" 
                  className="subtext-link" 
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9rem' }}
                  onClick={() => setShowPolicyModal(true)}
                >
                  পণ্য রিটার্ন বা রিফান্ড নীতিমালা দেখুন
                </button>
              </div>

              <label className="return-policy-accept">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  required
                />
                আমি রিটার্ন নীতিমালা পড়েছি এবং শর্তাবলীতে সম্মত।
              </label>

              <div className="return-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeReturnModal} disabled={Boolean(requestingId)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(requestingId)}>
                  {requestingId ? "সাবমিট হচ্ছে..." : "রিকোয়েস্ট সাবমিট করুন"}
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
              <h3>অর্ডার বাতিলের অনুরোধ</h3>
              <button type="button" className="return-modal-close" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                x
              </button>
            </div>

            <form className="return-modal-form" onSubmit={submitCancelModal}>
              <label>
                বাতিল করার কারণ
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="যেমন: ভুল করে অর্ডার করেছি / এখন আর প্রয়োজন নেই"
                  minLength={5}
                  required
                />
              </label>

              <div className="policy-box" style={{ 
                background: 'var(--surface-soft)', 
                padding: '1rem', 
                borderRadius: '12px', 
                fontSize: '0.85rem',
                margin: '1rem 0',
                border: '1px solid var(--line)'
              }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--ink)' }}>বাতিল নীতিমালা:</h4>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, listStyleType: 'disc' }}>
                  <li>অনলাইন পেমেন্ট করা অর্ডার বাতিল হলে সম্পূর্ণ (ফুল) রিফান্ড দেয়া হবে।</li>
                  <li>রিফান্ড ২-৩ কার্যদিবসের মধ্যে সম্পন্ন হবে।</li>
                  <li>টাকা যে মাধ্যমে পেমেন্ট করা হয়েছে, সেই একই মাধ্যমেই ফেরত যাবে।</li>
                </ul>
              </div>

              <label className="return-policy-accept">
                <input
                  type="checkbox"
                  checked={cancelPolicyAccepted}
                  onChange={(e) => setCancelPolicyAccepted(e.target.checked)}
                  required
                />
                আমি বাতিল নীতিমালা বুঝেছি এবং সম্মত।
              </label>

              <div className="return-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCancelModal} disabled={Boolean(cancellingId)}>
                  বন্ধ করুন
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(cancellingId)}>
                  {cancellingId ? "বাতিল হচ্ছে..." : "অর্ডারটি বাতিল করুন"}
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
              <h3>রিটার্ন নীতিমালা (বাংলাদেশ)</h3>
              <button type="button" className="return-modal-close" onClick={() => setShowPolicyModal(false)}>
                x
              </button>
            </div>
            <div className="return-policy-box" style={{ padding: '1rem', border: 'none', background: 'transparent' }}>
              <ul style={{ paddingLeft: '1.2rem', margin: '0' }}>
                <li style={{ marginBottom: '0.6rem' }}>ডেলিভারির পর সর্বোচ্চ ৭ দিনের মধ্যে রিটার্ন/রিফান্ড রিকোয়েস্ট করতে হবে।</li>
                <li style={{ marginBottom: '0.6rem' }}>পণ্য অবশ্যই অরিজিনাল প্যাকেজিং, ট্যাগ এবং আনইউজড অবস্থায় থাকতে হবে।</li>
                <li style={{ marginBottom: '0.6rem' }}>ড্যামেজড/ভুল পণ্য পেলে আনবক্সিংয়ের ছবি বা ভিডিও দিলে দ্রুত প্রসেস করা হবে।</li>
                <li style={{ marginBottom: '0.6rem' }}>পর্যালোচনার পরে রিকোয়েস্ট অনুমোদন বা বাতিল করা হবে; প্রয়োজন হলে অতিরিক্ত তথ্য চাওয়া হতে পারে।</li>
                <li style={{ marginBottom: '0.6rem' }}>অনুমোদিত হলে পিকআপ/রিটার্ন গ্রহণের পর রিফান্ড ৭-১০ কর্মদিবসের মধ্যে সম্পন্ন হতে পারে।</li>
                <li style={{ marginBottom: '0.6rem' }}>COD অর্ডারের রিফান্ড ব্যাংক/মোবাইল ফাইন্যান্সিয়াল সার্ভিসে দেয়া হতে পারে।</li>
                <li style={{ marginBottom: '0.6rem' }}>পণ্য রিটার্ন এপ্রুভ হলে পিকআপ চার্জ বা লজিস্টিক চার্জ (ডেলিভারি চার্জের সমপরিমাণ) টাকা কেটে রাখা হবে।</li>
                <li style={{ marginBottom: '0.6rem' }}>কাস্টমার কর্তৃক ক্ষতিগ্রস্ত বা নন-রিটার্নেবল পণ্যে রিফান্ড প্রযোজ্য নাও হতে পারে।</li>
              </ul>
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button type="button" className="btn btn-primary" onClick={() => setShowPolicyModal(false)}>
                  ঠিক আছে
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
