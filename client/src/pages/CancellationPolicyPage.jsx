import { Link } from "react-router-dom";
import CancellationPolicyContent from "../components/CancellationPolicyContent";

const CancellationPolicyPage = () => (
  <section className="stack-md return-policy-page" id="order-cancellation-policy">
    <div className="section-head">
      <h1>অর্ডার বাতিল নীতিমালা</h1>
      <p className="muted">বাংলাদেশে ToyKart-এ অর্ডার বাতিল ও রিফান্ড সংক্রান্ত নির্দেশনা।</p>
    </div>
    <article className="card return-policy-box">
      <CancellationPolicyContent />
    </article>
    <p className="muted" style={{ fontSize: "0.9rem" }}>
      ডেলিভারি হওয়া পণ্যের জন্য{" "}
      <Link to="/return-policy#return-refund-policy">রিটার্ন ও রিফান্ড নীতিমালা</Link> দেখুন।
    </p>
  </section>
);

export default CancellationPolicyPage;
