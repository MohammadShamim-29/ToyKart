/** Shared return & refund policy copy (footer page + orders modal). */
const ReturnPolicyContent = () => (
  <div className="return-policy-content">
    <ul className="return-policy-list">
      <li>Return or refund requests must be submitted within 7 days of delivery.</li>
      <li>Items must be unused, in original packaging, and include all tags and accessories.</li>
      <li>
        Record an unboxing video when you open the product. For returns, refunds, or damage/wrong-item
        claims, this video is important evidence for review and investigation.
      </li>
      <li>Requests are approved or declined after review; we may ask for additional information.</li>
      <li>COD order refunds may be sent via bank transfer or mobile financial services (bKash, Nagad, etc.).</li>
    </ul>

    <div className="return-policy-callout">
      <p className="return-policy-callout-title">Logistics &amp; refund rules</p>
      <p>
        If a return/refund request is approved, a pickup charge equal to the original delivery fee may apply
        when we collect the item from you.
      </p>
      <p className="return-policy-callout-success">
        If review shows the item was wrong, defective, or damaged due to our error, you will not pay any extra
        charge. We will replace the item at our cost or issue a full refund where applicable, including free
        return shipping.
      </p>
      <p>
        If investigation shows the issue was not on our side and the item does not meet return policy conditions,
        the refund will not be approved. The item may be sent back to you with no refund.
      </p>
    </div>
  </div>
);

export default ReturnPolicyContent;
