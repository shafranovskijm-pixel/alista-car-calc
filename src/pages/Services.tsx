import { motion } from "framer-motion";
import { Car, Truck, Bike, Bus, Anchor, Snowflake, FileText, Scale } from "lucide-react";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";

const services = [
  {
    icon: Car,
    title: "Растаможка легковых авто",
    desc: "Полное таможенное оформление легковых автомобилей из Японии, Кореи и других стран. Расчёт пошлин, подготовка документов, сопровождение на всех этапах.",
  },
  {
    icon: Truck,
    title: "Растаможка грузовых ТС",
    desc: "Таможенное оформление грузовиков, тягачей и специальной техники. Работаем с любыми категориями грузовых транспортных средств.",
  },
  {
    icon: Bike,
    title: "Мотоциклы и квадроциклы",
    desc: "Растаможка мотоциклов, квадроциклов, снегоходов и другой мототехники. Быстрое оформление с минимальными задержками.",
  },
  {
    icon: Bus,
    title: "Автобусы и спецтехника",
    desc: "Таможенное оформление автобусов, прицепов и специализированной техники для бизнеса.",
  },
  {
    icon: Anchor,
    title: "Водный транспорт",
    desc: "Растаможка катеров, лодок, яхт и другого водного транспорта. Знаем все нюансы оформления.",
  },
  {
    icon: Scale,
    title: "Консультации",
    desc: "Профессиональные консультации по таможенному законодательству РФ. Поможем разобраться в ставках, льготах и требованиях.",
  },
];

const ServicesPage = () => {
  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">Наши услуги</h1>
            <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
              Полный спектр услуг по таможенному оформлению транспортных средств
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:box-glow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
