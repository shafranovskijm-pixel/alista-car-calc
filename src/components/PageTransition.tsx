import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: isMobile ? 0.18 : 0.32, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
