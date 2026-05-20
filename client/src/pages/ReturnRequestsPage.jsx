import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  UNDER_REVIEW: { label: "Under Review", color: "#3b82f6", bg: "#dbeafe" },
  NEED_MORE_INFO: { label: "More Info Needed", color: "#8b5cf6", bg: "#ede9fe" },
  CUSTOMER_RESPONDED: { label: "You Responded", color: "#06b6d4", bg: "#cffafe" },
  APPROVED_FOR_PICKUP: { label: "Approved for Pickup", color: "#10b981", bg: "#d1fae5" },
  PICKUP_SCHEDULED: { label: "Pickup Scheduled", color: "#10b981", bg: "#d1fae5" },
  PICKED_UP: { label: "Picked Up", color: "#10b981", bg: "#d1fae5" },
  INSPECTION_COMPLETED: { label: "Inspection Completed", color: "#10b981", bg: "#d1fae5" },
  REFUND_APPROVED: { label: "Refund Approved", color: "#059669", bg: "#d1fae5" },
  REFUND_REJECTED: { label: "Refund Rejected", color: "#ef4444", bg: "#fee2e2" },
  REFUND_PROCESSED: { label: "Refund Processed", color: "#059669", bg: "#d1fae5" },
  REPLACEMENT_APPROVED: { label: "Replacement Approved", color: "#059669", bg: "#d1fae5" },
  REPLACEMENT_SHIPPED: { label: "Replacement Shipped", color: "#059669", bg: "#d1fae5" },
  REPLACEMENT_DELIVERED: { label: "Replacement Delivered", color: "#059669", bg: "#d1fae5" },
  ITEM_RETURNED_TO_CUSTOMER: { label: "Item Returned", color: "#f59e0b", bg: "#fef3c7" },
  COMPLETED: { label: "Completed", color: "#10b981", bg: "#d1fae5" },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fee2e2" },
  CLOSED: { label: "Closed", color: "#6b7280", bg: "#f3f4f6" }
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status || "Unknown", color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "999px",
      fontSize: "0.8rem",
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: "nowrap"
    }}>
      {cfg.label}
    </span>
  );
};

const ReturnRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) return;
    const fetchReturns = async () => {
      try {
        const { data } = await api.get("/returns/my");
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not fetch return requests");
      }
    };
    fetchReturns();
  }, [userInfo]);

  const openCount = requests.filter(
    (r) => !["COMPLETED", "REJECTED", "CLOSED", "ITEM_RETURNED_TO_CUSTOMER", "REFUND_REJECTED"].includes(r.status)
  ).length;

  return (
    <section className="stack-md" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="section-head">
        <div>
          <h1>Return & Refund Requests</h1>
          <p className="subtext">
            {requests.length} request{requests.length === 1 ? "" : "s"}
            {openCount > 0 && ` · ${openCount} active`}
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && requests.length === 0 && (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No return requests yet</p>
          <p className="subtext">
            You can request a return within 7 days of delivery from your orders page.
          </p>
          <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => navigate("/orders")}>
            View My Orders
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {requests.map((req) => {
          const isUrgent = req.status === "NEED_MORE_INFO";
          return (
            <Link
              to={`/returns/${req._id}`}
              key={req._id}
              className="card"
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: "1.25rem",
                borderLeft: `4px solid ${STATUS_CONFIG[req.status]?.color || "#d1d5db"}`,
                transition: "box-shadow 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                      Request #{req._id.slice(-6).toUpperCase()}
                    </h3>
                    <StatusBadge status={req.status} />
                    {isUrgent && (
                      <span style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>
                        ACTION NEEDED
                      </span>
                    )}
                  </div>
                  <p className="subtext" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
                    Order #{req.order?._id?.slice(-6).toUpperCase() || "N/A"} · Submitted {formatDateTime(req.createdAt)}
                  </p>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                  {req.requestType === "refund_only" ? "Refund Only" : req.requestType === "exchange" ? "Exchange" : "Return & Refund"}
                </span>
              </div>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#4b5563" }}>
                <strong>Reason:</strong> {req.reason || "Not specified"}
              </p>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {req.timeline?.length > 0 && (
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                    Last update: {formatDateTime(req.timeline[req.timeline.length - 1]?.createdAt)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ReturnRequestsPage;
