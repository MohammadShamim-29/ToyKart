const PolicyBlock = ({ title, children }) => (
  <div className="policy-locale-block">
    <h3 className="policy-locale-title">{title}</h3>
    {children}
  </div>
);

const EnglishPolicy = () => (
  <>
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
  </>
);

const BanglaPolicy = () => (
  <>
    <ul className="return-policy-list">
      <li>ডেলিভারির পর সর্বোচ্চ ৭ দিনের মধ্যে রিটার্ন/রিফান্ড রিকোয়েস্ট করতে হবে।</li>
      <li>পণ্য অবশ্যই অরিজিনাল প্যাকেজিং, ট্যাগ এবং আনইউজড অবস্থায় থাকতে হবে।</li>
      <li>
        পণ্য আনবক্সিংয়ের সময় অবশ্যই ভিডিও ধারণ করে রাখতে হবে। রিটার্ন, রিফান্ড অথবা ক্ষতিগ্রস্ত/ভুল পণ্যের
        দাবির ক্ষেত্রে যথাযথ প্রমাণ যাচাই ও অনুসন্ধানের জন্য আনবক্সিং ভিডিও গুরুত্বপূর্ণ প্রমাণ হিসেবে
        বিবেচিত হবে। প্রয়োজনে দ্রুত সমাধানের জন্য গ্রাহককে আনবক্সিং ভিডিও প্রদান করতে হতে পারে।
      </li>
      <li>পর্যালোচনার পরে রিকোয়েস্ট অনুমোদন বা বাতিল করা হবে; প্রয়োজন হলে অতিরিক্ত তথ্য চাওয়া হতে পারে।</li>
      <li>COD অর্ডারের রিফান্ড ব্যাংক/মোবাইল ফাইন্যান্সিয়াল সার্ভিসে দেওয়া হতে পারে।</li>
    </ul>
    <div className="return-policy-callout">
      <p className="return-policy-callout-title">লজিস্টিক ও রিফান্ড সংক্রান্ত নীতিমালা</p>
      <p>
        রিটার্ন/রিফান্ড রিকোয়েস্ট অনুমোদিত হলে পণ্য সংগ্রহ (পিকআপ) করার জন্য গ্রাহককে ডেলিভারি চার্জের
        সমপরিমাণ একটি পিকআপ চার্জ প্রদান করতে হবে।
      </p>
      <p className="return-policy-callout-success">
        তবে যদি পর্যালোচনায় দেখা যায় যে পণ্যটি আমাদের পক্ষ থেকে ভুল, ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত অবস্থায়
        সরবরাহ করা হয়েছে, তাহলে গ্রাহককে কোনো অতিরিক্ত চার্জ প্রদান করতে হবে না। সে ক্ষেত্রে আমাদের
        প্রতিষ্ঠান নিজস্ব খরচে পণ্যটি প্রতিস্থাপন (Replacement) করে দেবে অথবা প্রযোজ্য ক্ষেত্রে সম্পূর্ণ
        অর্থ ফেরত প্রদান করবে। পুনরায় পণ্য পাঠানোর জন্যও গ্রাহকের কাছ থেকে কোনো ডেলিভারি চার্জ গ্রহণ করা
        হবে না।
      </p>
      <p>
        অন্যদিকে, যদি তদন্তে প্রমাণিত হয় যে সমস্যাটি আমাদের পক্ষ থেকে হয়নি এবং পণ্যটি রিটার্ন নীতির শর্ত
        পূরণ না করে, তাহলে রিফান্ড অনুমোদিত হবে না। সে ক্ষেত্রে পণ্যটি পুনরায় গ্রাহকের কাছে ফেরত পাঠানো
        হবে এবং কোনো অর্থ ফেরত প্রদান করা হবে না।
      </p>
    </div>
  </>
);

/**
 * @param {{ locales?: ('en' | 'bn')[] }} props — default both languages
 */
const ReturnPolicyContent = ({ locales = ["en", "bn"] }) => (
  <div className="return-policy-content">
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

export default ReturnPolicyContent;
