import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const variants = isMobile
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: isMobile ? 0.18 : 0.32, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
