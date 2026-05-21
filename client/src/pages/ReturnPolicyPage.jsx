import ReturnPolicyContent from "../components/ReturnPolicyContent";

const ReturnPolicyPage = () => (
  <section className="stack-md return-policy-page" id="return-refund-policy">
    <div className="section-head">
      <h1>Return &amp; Refund Policy</h1>
      <p className="muted">Guidelines for returns, refunds, and replacements in Bangladesh.</p>
    </div>
    <article className="card return-policy-box">
      <ReturnPolicyContent />
    </article>
  </section>
);

export default ReturnPolicyPage;
