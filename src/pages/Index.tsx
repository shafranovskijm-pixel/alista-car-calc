import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Calculator, Shield, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const features = [
  {
    icon: Shield,
    title: "Надёжность",
    desc: "Полное соблюдение таможенного законодательства РФ",
  },
  {
    icon: Clock,
    title: "Скорость",
    desc: "Оперативное оформление документов без задержек",
  },
  {
    icon: TrendingUp,
    title: "Опыт",
    desc: "Профессиональная команда специалистов",
  },
  {
    icon: Calculator,
    title: "Прозрачность",
    desc: "Точный расчёт всех таможенных платежей",
  },
];

const Index = () => {
  return (
    <PageTransition>
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-premium" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(199_89%_48%/0.08),transparent_60%)]" />
        <div className="container relative flex min-h-[80vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-primary">
              Таможенное оформление
            </p>
            <h1 className="font-heading text-5xl font-bold leading-tight text-foreground md:text-7xl lg:text-8xl text-glow">
              ALISTA
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Профессиональная растаможка автомобилей и спецтехники во Владивостоке. Быстро, надёжно, прозрачно.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/calculator">
                <Button size="lg" className="gradient-accent px-8 text-base font-semibold text-primary-foreground hover:opacity-90">
                  <Calculator className="mr-2 h-5 w-5" />
                  Рассчитать стоимость
                </Button>
              </Link>
              <Link to="/contacts">
                <Button variant="outline" size="lg" className="border-border px-8 text-base hover:border-primary/50">
                  Связаться с нами
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-20">
        <div className="container">
          <h2 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl">
            Почему выбирают нас
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:box-glow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="border-t border-border/50 py-16">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Режим работы</h2>
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-border/50 bg-card p-6">
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Понедельник — Пятница</span>
              <span className="font-semibold text-primary">9:00 — 18:00</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-muted-foreground">Суббота — Воскресенье</span>
              <span className="font-semibold text-destructive">Выходной</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
    </PageTransition>
  );
};

export default Index;
