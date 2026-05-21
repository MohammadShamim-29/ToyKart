import { motion } from "framer-motion";
import { Gift, Puzzle, Rocket, Star, ToyBrick } from "lucide-react";

const toys = [
  { Icon: Gift, className: "left-[8%] top-[18%] text-pink-400", delay: 0 },
  { Icon: Rocket, className: "right-[12%] top-[22%] text-violet-400", delay: 0.4 },
  { Icon: Star, className: "left-[20%] bottom-[28%] text-amber-300", delay: 0.8 },
  { Icon: Puzzle, className: "right-[18%] bottom-[32%] text-sky-400", delay: 1.2 },
  { Icon: ToyBrick, className: "left-[42%] top-[8%] text-indigo-400", delay: 0.6 }
];

const FloatingToys = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    {toys.map(({ Icon, className, delay }, i) => (
      <motion.div
        key={i}
        className={`absolute opacity-40 ${className}`}
        animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
        transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay, ease: "easeInOut" }}
      >
        <Icon size={28 + (i % 3) * 8} strokeWidth={1.5} />
      </motion.div>
    ))}
  </div>
);

export default FloatingToys;
