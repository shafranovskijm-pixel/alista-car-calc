import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Calculator, Shield, Clock, TrendingUp, ChevronRight, HelpCircle, Car, Award, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import Gallery from "@/components/Gallery";
import StatsSection from "@/components/StatsSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import AnimatedCounter from "@/components/AnimatedCounter";
import heroBg from "@/assets/hero-bg.jpg";

const faqItems = [
  {
    q: "Сколько стоит растаможка автомобиля?",
    a: "Стоимость зависит от типа ТС, объёма двигателя, возраста, стоимости и статуса импортёра (физлицо/юрлицо). Воспользуйтесь нашим калькулятором для предварительного расчёта или свяжитесь с нами для точной оценки.",
  },
  {
    q: "Какие документы нужны для растаможки?",
    a: "Основные документы: паспорт владельца, договор купли-продажи (инвойс), коносамент (Bill of Lading), экспортный сертификат страны отправления, а также документы, подтверждающие стоимость авто. Мы поможем подготовить полный пакет.",
  },
  {
    q: "Сколько времени занимает растаможка?",
    a: "При наличии всех документов — от 1 до 5 рабочих дней. Сроки могут увеличиться при необходимости дополнительных проверок или экспертиз. Мы делаем всё возможное для ускорения процесса.",
  },
  {
    q: "Можно ли растаможить авто старше 7 лет?",
    a: "Да, но таможенные пошлины для таких автомобилей значительно выше. Ставка рассчитывается по объёму двигателя (от 3.0 до 5.7 €/см³ для физлиц). Рекомендуем предварительно рассчитать стоимость через наш калькулятор.",
  },
  {
    q: "В чём разница растаможки для физлиц и юрлиц?",
    a: "Физлица платят единую таможенную пошлину и освобождены от НДС и акциза (при ввозе для личного пользования). Юрлица оплачивают пошлину, акциз и НДС (22%) отдельно. Утилизационный сбор различается по коэффициентам.",
  },
  {
    q: "Что входит в утилизационный сбор?",
    a: "Утилизационный сбор — обязательный платёж, размер которого зависит от типа ТС, объёма двигателя и возраста. С декабря 2025 года коэффициенты значительно увеличены (Постановление № 1713). Например, для авто 2.0л сбор может составить более 600 000 ₽.",
  },
  {
    q: "Какие виды транспорта вы растамаживаете?",
    a: "Мы работаем со всеми видами: легковые автомобили, грузовики, мотоциклы, автобусы, прицепы, квадроциклы, снегоходы и водный транспорт. Для каждого типа ТС свои ставки и порядок оформления.",
  },
  {
    q: "Можно ли ввезти электромобиль? Есть ли льготы?",
    a: "Да, электромобили можно ввозить. Они освобождены от акциза, но утилизационный сбор рассчитывается по мощности электродвигателя (в кВт). Таможенная пошлина начисляется на общих основаниях.",
  },
];

const features = [
  {
    icon: Shield,
    title: "Надёжность",
    desc: "Полное соблюдение таможенного законодательства РФ. 100% легальность.",
  },
  {
    icon: Clock,
    title: "Оформление от 1 дня",
    desc: "Оперативная подготовка документов без задержек и бюрократии.",
  },
  {
    icon: TrendingUp,
    title: "5 лет на рынке",
    desc: "Более 700 автомобилей оформлено. Профессиональная команда.",
  },
  {
    icon: Calculator,
    title: "Прозрачность",
    desc: "Точный расчёт всех таможенных платежей. Никаких скрытых комиссий.",
  },
];

const heroCounters = [
  { value: 700, suffix: "+", label: "авто оформлено" },
  { value: 5, suffix: " лет", label: "опыта" },
  { value: 1, suffix: " день", label: "минимум оформления" },
];

const Index = () => {
  return (
    <PageTransition>
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--neon-glow)/0.1),transparent_60%)]" />
        <div className="container relative flex min-h-[80vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-primary">
              ALISTA — таможенное оформление
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl text-glow">
              Импорт авто из Японии,
              <br />
              Кореи и Китая под ключ
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Профессиональная растаможка автомобилей и спецтехники во Владивостоке. Быстро, надёжно, прозрачно.
            </p>

            {/* Hero counters */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {heroCounters.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <AnimatedCounter
                    value={c.value}
                    suffix={c.suffix}
                    className="text-3xl font-bold text-primary text-glow md:text-4xl"
                  />
                  <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/calculator">
                <Button size="lg" className="gradient-accent px-8 text-base font-semibold text-primary-foreground hover:opacity-90 pulse-glow hover-lift">
                  <Calculator className="mr-2 h-5 w-5" />
                  Рассчитать стоимость
                </Button>
              </Link>
              <Link to="/contacts">
                <Button variant="outline" size="lg" className="border-border px-8 text-base hover:border-primary/50 hover-lift">
                  Связаться с нами
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <div className="gradient-divider" />
      <section className="relative py-20">
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
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:box-glow hover-lift"
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

      {/* Gallery */}
      <div className="gradient-divider" />
      <section className="relative py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl mb-10">
              Наши работы
            </h2>
          </motion.div>
          <Gallery />
        </div>
      </section>

      {/* Stats */}
      <div className="gradient-divider" />
      <StatsSection />

      {/* Testimonials */}
      <div className="gradient-divider" />
      <TestimonialsCarousel />

      {/* Working hours */}
      <div className="gradient-divider" />
      <section className="py-16">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Режим работы</h2>
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-border/50 bg-card p-6 hover-lift">
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

      {/* FAQ */}
      <div className="gradient-divider" />
      <section className="relative py-20">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-10">
              <HelpCircle className="h-7 w-7 text-primary" />
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">
                Частые вопросы
              </h2>
            </div>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem
                  value={`faq-${i}`}
                  className="rounded-xl border border-border/50 bg-card px-5 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <div className="gradient-divider" />
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--neon-glow)/0.08),transparent_70%)]" />
        <div className="container relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-5xl text-glow">
              Готовы рассчитать стоимость?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground md:text-lg">
              Воспользуйтесь калькулятором или свяжитесь с нами для бесплатной консультации.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/calculator">
                <Button size="lg" className="gradient-accent px-10 text-base font-semibold text-primary-foreground hover:opacity-90 pulse-glow hover-lift">
                  <Calculator className="mr-2 h-5 w-5" />
                  Открыть калькулятор
                </Button>
              </Link>
              <Link to="/contacts">
                <Button variant="outline" size="lg" className="border-border px-8 text-base hover:border-primary/50 hover-lift">
                  Связаться с нами
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
    </PageTransition>
  );
};

export default Index;
