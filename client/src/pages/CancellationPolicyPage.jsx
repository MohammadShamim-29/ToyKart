import { Link } from "react-router-dom";
import CancellationPolicyContent from "../components/CancellationPolicyContent";

const CancellationPolicyPage = () => (
  <section className="stack-md return-policy-page" id="order-cancellation-policy">
    <div className="section-head">
      <h1>Order Cancellation Policy</h1>
      <p className="muted" lang="bn">
        অর্ডার বাতিল নীতিমালা — guidelines for cancelling ToyKart orders in Bangladesh (English &amp; Bangla).
      </p>
    </div>
    <article className="card return-policy-box">
      <CancellationPolicyContent />
    </article>
    <p className="muted" style={{ fontSize: "0.9rem" }}>
      For delivered items, see our{" "}
      <Link to="/return-policy#return-refund-policy">Return &amp; Refund Policy</Link> (রিটার্ন ও রিফান্ড
      নীতিমালা)।
    </p>
  </section>
);

export default CancellationPolicyPage;
