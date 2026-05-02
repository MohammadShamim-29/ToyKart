import { BadgeCheck, Package, RotateCcw, Truck } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Fast delivery",
    text: "Tracked shipping on every order."
  },
  {
    icon: Package,
    title: "Careful packing",
    text: "Items protected for a safe arrival."
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    text: "Simple process within policy window."
  },
  {
    icon: BadgeCheck,
    title: "Trusted quality",
    text: "Verified suppliers and safe materials."
  }
];

const TrustDeliveryRow = () => (
  <div className="pd-trust-grid">
    {items.map(({ icon: Icon, title, text }) => (
      <div key={title} className="pd-trust-item">
        <div className="pd-trust-icon">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <div>
          <p className="pd-trust-title">{title}</p>
          <p className="pd-trust-text">{text}</p>
        </div>
      </div>
    ))}
  </div>
);

export default TrustDeliveryRow;
