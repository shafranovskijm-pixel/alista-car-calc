import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";
import { Car, Zap } from "lucide-react";

const StatsSection = () => (
  <section className="relative py-16">
    <div className="container">
      <div className="flex flex-wrap justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 text-center transition-all hover:border-primary/30 hover:box-glow hover-lift"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <AnimatedCounter
            value={700}
            suffix="+"
            className="text-3xl font-bold text-primary text-glow md:text-4xl"
          />
          <span className="mt-2 text-sm text-muted-foreground">Авто оформлено</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="group flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 text-center transition-all hover:border-primary/30 hover:box-glow hover-lift"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <span className="text-3xl font-bold text-primary text-glow md:text-4xl">⚡</span>
          <span className="mt-2 text-sm text-muted-foreground">В кратчайшие сроки</span>
        </motion.div>
      </div>
    </div>
  </section>
);

export default StatsSection;
