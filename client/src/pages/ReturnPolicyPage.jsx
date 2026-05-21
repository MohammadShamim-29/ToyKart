import { Link } from "react-router-dom";
import ReturnPolicyContent from "../components/ReturnPolicyContent";

const ReturnPolicyPage = () => (
  <section className="stack-md return-policy-page" id="return-refund-policy">
    <div className="section-head">
      <h1>Return &amp; Refund Policy</h1>
      <p className="muted" lang="bn">
        রিটার্ন ও রিফান্ড নীতিমালা — returns, refunds, and replacements in Bangladesh (English &amp; Bangla).
      </p>
    </div>
    <article className="card return-policy-box">
      <ReturnPolicyContent />
    </article>
    <p className="muted" style={{ fontSize: "0.9rem" }}>
      To cancel an order before shipment, see our{" "}
      <Link to="/cancellation-policy#order-cancellation-policy">Cancellation Policy</Link> (অর্ডার বাতিল
      নীতিমালা)।
    </p>
  </section>
);

export default ReturnPolicyPage;
