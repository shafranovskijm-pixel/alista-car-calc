import { motion } from "framer-motion";

const orbs = [
  {
    className: "top-1/4 -left-32 w-96 h-96 bg-primary/20",
    duration: 20,
    delay: 0,
  },
  {
    className: "top-2/3 -right-24 w-80 h-80 bg-[hsl(var(--neon-secondary)/0.15)]",
    duration: 25,
    delay: 2,
  },
  {
    className: "bottom-1/4 left-1/3 w-72 h-72 bg-primary/10",
    duration: 22,
    delay: 5,
  },
];

const BackgroundDecor = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[100px] ${orb.className}`}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 20, 0, -15, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Subtle top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,hsl(var(--neon-glow)/0.06),transparent_70%)]" />
    </div>
  );
};

export default BackgroundDecor;
