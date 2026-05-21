/** Shared order cancellation policy (orders cancel modal). */
const CancellationPolicyContent = () => (
  <div className="return-policy-content cancellation-policy-content">
    <ul className="return-policy-list">
      <li>
        You may request cancellation while your order is <strong>pending</strong>, <strong>confirmed</strong>, or{" "}
        <strong>processing</strong> (before it ships).
      </li>
      <li>
        <strong>Online paid orders (SSLCommerz):</strong> after approval, a full refund is issued to the same
        payment method, usually within 2–3 business days.
      </li>
      <li>
        <strong>Cash on delivery (COD):</strong> no online payment was taken; cancelling stops the order — no
        refund transfer is needed.
      </li>
      <li>
        Orders that are already <strong>shipped</strong> or <strong>delivered</strong> cannot be cancelled here.
        Please use our Return &amp; Refund Policy instead.
      </li>
    </ul>

    <div className="return-policy-callout">
      <p className="return-policy-callout-title">After you submit</p>
      <p>
        We review your reason and update the order status. If payment was captured online, refund processing
        begins only after cancellation is approved.
      </p>
    </div>
  </div>
);

export default CancellationPolicyContent;
