import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import api from "../api";

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
  const [openTrack, setOpenTrack] = useState({});
  const [deletingId, setDeletingId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [requestingId, setRequestingId] = useState("");
  const [returnModalOrderId, setReturnModalOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
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
      setOpenTrack((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
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

  const onCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "আপনি কি অর্ডারটি বাতিল করতে চান?\n\nবাতিল নীতিমালা:\n- অনলাইন পেমেন্ট করা অর্ডার বাতিল হলে সম্পূর্ণ (ফুল) রিফান্ড দেয়া হবে।\n- রিফান্ড ২-৩ কার্যদিবসের মধ্যে সম্পন্ন হবে।\n- টাকা যে পেমেন্ট সিস্টেমে/মাধ্যমে পেমেন্ট করা হয়েছে, সেই একই পেমেন্ট সিস্টেমে ফেরত দেয়া হবে।"
    );
    if (!confirmed) return;

    try {
      setCancellingId(orderId);
      const { data } = await api.patch(`/orders/${orderId}/cancel`);
      setOrders((prev) => prev.map((order) => (order._id === orderId ? data : order)));
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

  const closeReturnModal = () => {
    if (requestingId) return;
    setReturnModalOrderId("");
    setReturnReason("");
    setPolicyAccepted(false);
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

  const latestRequestByOrderId = returnRequests.reduce((acc, req) => {
    const orderId = req?.order?._id || req?.order;
    if (!orderId) return acc;
    if (!acc[orderId]) acc[orderId] = req;
    return acc;
  }, {});

  return (
    <section className="stack-md">
      <div className="section-head">
        <h1>My Orders</h1>
      </div>

      {error && <p className="error">{error}</p>}
      {!error && orders.length === 0 && <p className="notice">No orders yet.</p>}

      <div className="orders-grid">
        {orders.map((order) => (
          <article className="card order-card" key={order._id}>
            {(() => {
              const orderStatus = String(order.status || "pending").toLowerCase();
              const isDelivered = orderStatus === "delivered";
              const canCancel = ["pending", "confirmed", "processing"].includes(orderStatus);
              const hasReturnRequest = Boolean(latestRequestByOrderId[order._id]);
              const canRequestReturn = isDelivered && !hasReturnRequest && requestingId !== order._id;

              return (
                <>
            <div className="order-card-head">
              <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
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
            <p>
              <strong>Status:</strong>{" "}
              <span className={`order-status-pill status-${String(order.status || "pending").toLowerCase()}`}>
                {titleCaseStatus(order.status)}
              </span>
            </p>
            <p>
              <strong>Total:</strong> {currency.format(order.totalPrice || 0)}
            </p>
            <p>
              <strong>Items:</strong> {order.orderItems.length}
            </p>
            <p>
              <strong>Payment:</strong> {order.isPaid ? "Paid" : "Pending"}
            </p>
            <p>
              <strong>Placed:</strong> {formatDateTime(order.createdAt)}
            </p>
            {latestRequestByOrderId[order._id] && (
              <p>
                <strong>Return Request:</strong>{" "}
                <span className="order-return-status">
                  {titleCaseStatus(latestRequestByOrderId[order._id].status || "requested")}
                </span>
              </p>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canRequestReturn}
              onClick={() => openReturnModal(order._id)}
            >
              {hasReturnRequest ? "Return Requested" : "Request Return/Refund"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canCancel || cancellingId === order._id}
              onClick={() => onCancelOrder(order._id)}
            >
              {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOpenTrack((prev) => ({ ...prev, [order._id]: !prev[order._id] }))}
            >
              {openTrack[order._id] ? "Hide Tracking" : "Track"}
            </button>

            {openTrack[order._id] && (
              <div className="order-track-panel">
                <p>
                  <strong>Carrier:</strong> {order.fulfillment?.carrier || "Not assigned yet"}
                </p>
                <p>
                  <strong>Tracking Number:</strong> {order.fulfillment?.trackingNumber || "Not assigned yet"}
                </p>
                <p>
                  <strong>Shipped At:</strong> {formatDateTime(order.fulfillment?.shippedAt)}
                </p>
                <div className="order-track-timeline">
                  <h4>Order Updates</h4>
                  {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 ? (
                    <ul>
                      {[...order.statusHistory].reverse().map((entry, idx) => (
                        <li key={`${entry.changedAt || idx}-${entry.to || idx}`}>
                          <p>
                            <strong>{titleCaseStatus(entry.to)}</strong> • {formatDateTime(entry.changedAt)}
                          </p>
                          <p className="subtext">{entry.note || "Status updated"}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="subtext">No tracking updates yet.</p>
                  )}
                </div>
              </div>
            )}
                </>
              );
            })()}
          </article>
        ))}
      </div>

      {returnModalOrderId && (
        <div className="return-modal-backdrop" role="presentation" onClick={closeReturnModal}>
          <div
            className="return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="return-modal-head">
              <h3 id="return-modal-title">রিটার্ন বা রিফান্ড রিকোয়েস্ট</h3>
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

              <div className="return-policy-box">
                <h4>রিটার্ন নীতিমালা (বাংলাদেশ)</h4>
                <ul>
                  <li>ডেলিভারির পর সর্বোচ্চ ৭ দিনের মধ্যে রিটার্ন/রিফান্ড রিকোয়েস্ট করতে হবে।</li>
                  <li>পণ্য অবশ্যই অরিজিনাল প্যাকেজিং, ট্যাগ এবং আনইউজড অবস্থায় থাকতে হবে।</li>
                  <li>ড্যামেজড/ভুল পণ্য পেলে আনবক্সিংয়ের ছবি বা ভিডিও দিলে দ্রুত প্রসেস করা হবে।</li>
                  <li>পর্যালোচনার পরে রিকোয়েস্ট অনুমোদন বা বাতিল করা হবে; প্রয়োজন হলে অতিরিক্ত তথ্য চাওয়া হতে পারে।</li>
                  <li>অনুমোদিত হলে পিকআপ/রিটার্ন গ্রহণের পর রিফান্ড ৭-১০ কর্মদিবসের মধ্যে সম্পন্ন হতে পারে।</li>
                  <li>COD অর্ডারের রিফান্ড ব্যাংক/মোবাইল ফাইন্যান্সিয়াল সার্ভিসে দেয়া হতে পারে।</li>
                  <li>কাস্টমার কর্তৃক ক্ষতিগ্রস্ত বা নন-রিটার্নেবল পণ্যে রিফান্ড প্রযোজ্য নাও হতে পারে।</li>
                </ul>
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
    </section>
  );
};

export default OrdersPage;
