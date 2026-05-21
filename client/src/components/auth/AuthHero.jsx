import { motion } from "framer-motion";
import { Shield, Sparkles, Truck } from "lucide-react";
import LogoToyBox from "../LogoToyBox";

const badges = [
  { icon: Shield, label: "Safe Shopping" },
  { icon: Sparkles, label: "Secure Payment" },
  { icon: Truck, label: "Fast Delivery" }
];

const AuthHero = () => (
  <aside className="auth-hero-panel">
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
      <LogoToyBox />
      <h1 className="auth-hero-title">
        Your playful
        <span> toy universe</span>
      </h1>
      <p className="auth-subtext mt-4">
        Premium toys for curious kids and confident parents — discover, play, and grow with ToyBox.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {badges.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="auth-badge"
          >
            <Icon size={16} />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  </aside>
);

export default AuthHero;
