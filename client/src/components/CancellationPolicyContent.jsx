/** Shared order cancellation policy — Bangla (footer page + orders cancel modal). */
const CancellationPolicyContent = () => (
  <div className="return-policy-content cancellation-policy-content">
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
  </div>
);

export default CancellationPolicyContent;
