const PolicyBlock = ({ title, children }) => (
  <div className="policy-locale-block">
    <h3 className="policy-locale-title">{title}</h3>
    {children}
  </div>
);

const EnglishPolicy = () => (
  <>
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
        <strong>Cash on delivery (COD):</strong> no online payment was collected; cancelling stops the order — no
        refund transfer is needed.
      </li>
      <li>
        Orders that are already <strong>shipped</strong> or <strong>delivered</strong> cannot be cancelled here.
        Please follow our <strong>Return &amp; Refund Policy</strong> instead.
      </li>
    </ul>
    <div className="return-policy-callout">
      <p className="return-policy-callout-title">After you submit</p>
      <p>
        We review your reason and update the order status. For online payments, refund processing starts only
        after cancellation is approved.
      </p>
      <p className="return-policy-callout-success">
        Refunds are returned to the same payment method where possible, in line with SSLCommerz rules.
      </p>
    </div>
  </>
);

const BanglaPolicy = () => (
  <>
    <ul className="return-policy-list">
      <li>
        অর্ডার <strong>pending</strong>, <strong>confirmed</strong> বা <strong>processing</strong> (শিপমেন্টের
        আগে) অবস্থায় বাতিলের অনুরোধ করা যাবে।
      </li>
      <li>
        <strong>অনলাইন পেমেন্ট (SSLCommerz):</strong> অনুমোদনের পর সম্পূর্ণ (ফুল) রিফান্ড একই পেমেন্ট
        মাধ্যমে দেওয়া হয়, সাধারণত ২–৩ কার্যদিবসের মধ্যে।
      </li>
      <li>
        <strong>ক্যাশ অন ডেলিভারি (COD):</strong> অনলাইনে অর্থ গ্রহণ করা হয়নি; বাতিল করলে অর্ডার বন্ধ হয় —
        আলাদা রিফান্ড ট্রান্সফারের প্রয়োজন নেই।
      </li>
      <li>
        যে অর্ডার ইতিমধ্যে <strong>shipped</strong> বা <strong>delivered</strong>, সেগুলো এখানে বাতিল করা যাবে
        না। সেক্ষেত্রে <strong>রিটার্ন ও রিফান্ড নীতিমালা</strong> অনুসরণ করুন।
      </li>
    </ul>
    <div className="return-policy-callout">
      <p className="return-policy-callout-title">অনুরোধ জমা দেওয়ার পর</p>
      <p>
        আপনার কারণ যাচাই করে অর্ডারের স্ট্যাটাস আপডেট করা হবে। অনলাইনে পেমেন্ট করা থাকলে, বাতিল অনুমোদিত
        হওয়ার পরেই রিফান্ড প্রক্রিয়া শুরু হবে।
      </p>
      <p className="return-policy-callout-success">
        টাকা যে মাধ্যমে পেমেন্ট করা হয়েছিল, সেই একই মাধ্যমেই ফেরত যাওয়ার চেষ্টা করা হবে (SSLCommerz নীতিমালা
        অনুযায়ী)।
      </p>
    </div>
  </>
);

/**
 * @param {{ locales?: ('en' | 'bn')[] }} props — default both; use ['en'] or ['bn'] for a single language
 */
const CancellationPolicyContent = ({ locales = ["en", "bn"] }) => (
  <div className="return-policy-content cancellation-policy-content">
    {locales.includes("en") && (
      <PolicyBlock title="English">
        <EnglishPolicy />
      </PolicyBlock>
    )}
    {locales.includes("en") && locales.includes("bn") && <hr className="policy-locale-divider" />}
    {locales.includes("bn") && (
      <PolicyBlock title="বাংলা">
        <BanglaPolicy />
      </PolicyBlock>
    )}
  </div>
);

export default CancellationPolicyContent;
