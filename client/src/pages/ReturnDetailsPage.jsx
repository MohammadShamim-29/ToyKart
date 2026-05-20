import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
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
      padding: "4px 14px",
      borderRadius: "999px",
      fontSize: "0.85rem",
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: "nowrap"
    }}>
      {cfg.label}
    </span>
  );
};

const formatCondition = (val) => (val || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const ReturnDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!userInfo) return;
    const fetchRequest = async () => {
      try {
        const { data } = await api.get(`/returns/${id}`);
        setRequest(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not fetch return request");
      }
    };
    fetchRequest();
  }, [id, userInfo]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [request?.conversation]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFiles = async () => {
    if (attachedFiles.length === 0) return [];
    const urls = [];
    for (const file of attachedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        urls.push(data.url);
      } catch {
        // silently fail for individual file
      }
    }
    return urls;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;
    try {
      setSending(true);
      let attachments = [];
      if (attachedFiles.length > 0) {
        setUploading(true);
        attachments = await uploadFiles();
        setUploading(false);
      }
      const { data } = await api.post(`/returns/${id}/messages`, {
        text: messageText.trim(),
        attachments
      });
      setRequest(data);
      setMessageText("");
      setAttachedFiles([]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (error && !request) {
    return (
      <section className="stack-md" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p className="error">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate("/returns")}>Back to Returns</button>
      </section>
    );
  }

  if (!request) {
    return <section className="stack-md" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <p className="notice">Loading...</p>
    </section>;
  }

  const timeline = Array.isArray(request.timeline) ? request.timeline : [];
  const conversation = Array.isArray(request.conversation) ? request.conversation : [];
  const pickup = request.pickupDetails;
  const inspection = request.inspectionDetails;
  const refund = request.refundDetails;
  const returnToCustomer = request.returnToCustomerDetails;
  const isActive = !["COMPLETED", "CLOSED", "REJECTED", "REFUND_REJECTED", "ITEM_RETURNED_TO_CUSTOMER", "REFUND_PROCESSED"].includes(request.status);

  return (
    <section style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button className="btn btn-secondary" onClick={() => navigate("/returns")} style={{ marginBottom: "0.75rem" }}>
          &larr; All Returns
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ margin: 0 }}>Request #{request._id.slice(-6).toUpperCase()}</h1>
            <p className="subtext" style={{ marginTop: "0.25rem" }}>
              {request.requestType === "refund_only" ? "Refund Only" : request.requestType === "exchange" ? "Exchange" : "Return & Refund"}
              · Submitted {formatDateTime(request.createdAt)}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Request Details Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Request Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Order</label>
              <span style={{ fontWeight: 600 }}>#{request.order?._id?.slice(-6).toUpperCase() || "N/A"}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>Order Breakdown</label>
              <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: "0.75rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <span style={{ fontSize: "0.85rem" }}>Product Price: <strong>{currency.format(request.order?.itemsPrice || 0)}</strong></span>
                <span style={{ fontSize: "0.85rem" }}>Shipping: <strong>{currency.format(request.order?.shippingPrice || 0)}</strong></span>
                {request.order?.taxPrice > 0 && (
                  <span style={{ fontSize: "0.85rem" }}>Tax: <strong>{currency.format(request.order?.taxPrice)}</strong></span>
                )}
                <span style={{ fontSize: "0.9rem", fontWeight: 700, borderTop: "1px solid #e5e7eb", paddingTop: "0.25rem" }}>
                  Total: {currency.format(request.order?.totalPrice || 0)}
                </span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Reason</label>
              <span>{request.reason || "Not specified"}</span>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Refund Method</label>
              <span>{request.refundMethod || "Original Payment Method"}</span>
            </div>
            {request.description && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Description</label>
                <span>{request.description}</span>
              </div>
            )}
          </div>
          {Array.isArray(request.evidenceAttachments) && request.evidenceAttachments.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.5rem" }}>Evidence Attachments</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {request.evidenceAttachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    background: "#f3f4f6",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    color: "#2563eb",
                    textDecoration: "none"
                  }}>
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Card */}
        {timeline.length > 0 && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Timeline</h3>
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div style={{
                position: "absolute",
                left: "7px",
                top: 0,
                bottom: 0,
                width: "2px",
                background: "#e5e7eb"
              }} />
              {[...timeline].reverse().map((entry, idx) => {
                const cfg = STATUS_CONFIG[entry.status] || {};
                return (
                  <div key={idx} style={{ position: "relative", paddingBottom: "1.25rem" }}>
                    <div style={{
                      position: "absolute",
                      left: "-1.5rem",
                      top: "4px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: cfg.color || "#d1d5db",
                      border: "2px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }} />
                    <div style={{ marginLeft: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.9rem", color: cfg.color || "#374151" }}>
                          {cfg.label || entry.status}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.note && (
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                          {entry.note}
                        </p>
                      )}
                      {entry.actorName && (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          by {entry.actorName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pickup Details */}
        {pickup && pickup.courierName && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Pickup Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {pickup.scheduledDate && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Scheduled Date</label><span>{formatDateTime(pickup.scheduledDate)}</span></div>}
              {pickup.courierName && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Courier</label><span>{pickup.courierName}</span></div>}
              {pickup.trackingNumber && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Tracking</label><span>{pickup.trackingNumber}</span></div>}
              {pickup.pickupCharge !== 0 && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Pickup Charge</label><span>{currency.format(Math.abs(pickup.pickupCharge))}</span></div>}
            </div>
          </div>
        )}

        {/* Inspection Details */}
        {inspection && inspection.condition && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Inspection Results</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Condition</label><span style={{ fontWeight: 600 }}>{formatCondition(inspection.condition)}</span></div>
              {inspection.packagingStatus && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Packaging</label><span>{inspection.packagingStatus}</span></div>}
              {inspection.accessoriesStatus && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Accessories</label><span>{inspection.accessoriesStatus}</span></div>}
              {inspection.inspectionNotes && <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Notes</label><span>{inspection.inspectionNotes}</span></div>}
            </div>
          </div>
        )}

        {/* Refund Summary */}
        {refund && refund.finalRefundAmount > 0 && (
          <div className="card" style={{ padding: "1.5rem", border: "2px solid #d1fae5" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#059669" }}>Refund Summary</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Approved Amount</span>
                <span style={{ fontWeight: 600 }}>{currency.format(refund.approvedAmount)}</span>
              </div>
              {refund.deductions > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ef4444" }}>
                  <span>Deductions</span>
                  <span style={{ fontWeight: 600 }}>-{currency.format(refund.deductions)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "0.75rem" }}>
                <span style={{ fontWeight: 700 }}>Final Refund Amount</span>
                <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "#059669" }}>{currency.format(refund.finalRefundAmount)}</span>
              </div>
              {refund.refundMethod && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                  <span>Method</span>
                  <span>{refund.refundMethod}</span>
                </div>
              )}
              {refund.transactionId && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                  <span>Transaction ID</span>
                  <span>{refund.transactionId}</span>
                </div>
              )}
              {refund.processedAt && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                  <span>Processed At</span>
                  <span>{formatDateTime(refund.processedAt)}</span>
                </div>
              )}
              {refund.estimatedCompletionDays && request.status !== "COMPLETED" && (
                <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#fef3c7", borderRadius: "8px", fontSize: "0.85rem", color: "#92400e" }}>
                  Estimated completion within {refund.estimatedCompletionDays} working days
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {request.rejectionReason && (
          <div className="card" style={{ padding: "1.5rem", border: "1px solid #fecaca" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#ef4444" }}>Rejection Reason</h3>
            <p style={{ margin: 0 }}>{request.rejectionReason}</p>
          </div>
        )}

        {/* Replacement Details */}
        {request.replacementDetails?.replacementOrder && (
          <div className="card" style={{ padding: "1.5rem", border: "2px solid #d1fae5" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#059669" }}>Replacement Order</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Replacement Order</span>
                <span style={{ fontWeight: 600 }}>
                  #{String(request.replacementDetails.replacementOrder._id || request.replacementDetails.replacementOrder).slice(-6).toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                <span>Shipping Charge</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>Free</span>
              </div>
              {request.replacementDetails.trackingNumber && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                  <span>Tracking Number</span>
                  <span style={{ fontWeight: 600 }}>{request.replacementDetails.trackingNumber}</span>
                </div>
              )}
              {request.replacementDetails.carrier && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                  <span>Carrier</span>
                  <span>{request.replacementDetails.carrier}</span>
                </div>
              )}
              {request.replacementDetails.shippedAt && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#6b7280" }}>
                  <span>Shipped At</span>
                  <span>{formatDateTime(request.replacementDetails.shippedAt)}</span>
                </div>
              )}
              {request.replacementDetails.deliveredAt && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#059669" }}>
                  <span>Delivered At</span>
                  <span style={{ fontWeight: 600 }}>{formatDateTime(request.replacementDetails.deliveredAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Return to Customer */}
        {returnToCustomer && returnToCustomer.trackingNumber && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Item Return Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Tracking Number</label><span style={{ fontWeight: 600 }}>{returnToCustomer.trackingNumber}</span></div>
              {returnToCustomer.shippingCharge > 0 && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Shipping Charge</label><span>{currency.format(returnToCustomer.shippingCharge)}</span></div>}
              {returnToCustomer.returnedAt && <div><label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>Returned At</label><span>{formatDateTime(returnToCustomer.returnedAt)}</span></div>}
            </div>
          </div>
        )}

        {/* Conversation */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Conversation</h3>
          {conversation.length === 0 && (
            <p className="notice" style={{ marginBottom: "1rem" }}>No messages yet. Reach out to the support team if you have questions.</p>
          )}
          <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "1rem" }}>
            {conversation.map((msg, idx) => (
              <div key={idx} style={{
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                marginBottom: "0.75rem",
                background: msg.senderType === "CUSTOMER" ? "#eef2ff" : "#f9fafb",
                maxWidth: "85%",
                marginLeft: msg.senderType === "CUSTOMER" ? "auto" : "0",
                textAlign: msg.senderType === "CUSTOMER" ? "right" : "left",
                border: `1px solid ${msg.senderType === "CUSTOMER" ? "#e0e7ff" : "#e5e7eb"}`
              }}>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                  {msg.senderType === "ADMIN" ? "Support Team" : "You"} · {formatDateTime(msg.createdAt)}
                </div>
                {msg.text && <p style={{ margin: 0, fontSize: "0.9rem" }}>{msg.text}</p>}
                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {msg.attachments.map((url, ai) => (
                      <a key={ai} href={url} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: "0.8rem",
                        color: "#2563eb",
                        textDecoration: "underline",
                        display: "inline-block"
                      }}>
                        Attachment {ai + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {isActive && (
            <form onSubmit={handleSendMessage}>
              {attachedFiles.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  {attachedFiles.map((file, idx) => (
                    <span key={idx} style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "4px 10px",
                      background: "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "0.8rem"
                    }}>
                      {file.name}
                      <button type="button" onClick={() => removeFile(idx)} style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "1rem",
                        padding: 0,
                        lineHeight: 1
                      }}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  background: "white",
                  fontSize: "0.85rem"
                }}>
                  <input type="file" multiple accept="image/*,video/*,.pdf" onChange={handleFileSelect} style={{ display: "none" }} disabled={sending || uploading} />
                  📎
                </label>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.9rem"
                  }}
                  disabled={sending || uploading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending || uploading || (!messageText.trim() && attachedFiles.length === 0)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {uploading ? "Uploading..." : sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          )}
          {!isActive && (
            <p className="subtext" style={{ fontSize: "0.85rem", textAlign: "center" }}>
              This request is closed. No further messages can be sent.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReturnDetailsPage;
