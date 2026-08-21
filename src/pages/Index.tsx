import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  Car,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  HelpCircle,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import Gallery from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import heroCar from "@/assets/alista-hero-suv-v2.webp";

const confidencePoints = [
  "Для физических и юридических лиц",
  "Курсы валют с датой расчёта",
  "Каждый платёж показан отдельно",
];

const paymentBreakdown = [
  {
    icon: Landmark,
    title: "Таможенная пошлина",
    text: "Зависит от стоимости, возраста и характеристик транспортного средства.",
  },
  {
    icon: Gauge,
    title: "Акциз и НДС",
    text: "Калькулятор учитывает их там, где они применимы к выбранному типу ввоза.",
  },
  {
    icon: ReceiptText,
    title: "Утилизационный сбор",
    text: "Выводится отдельной строкой, чтобы структура суммы оставалась понятной.",
  },
  {
    icon: FileCheck2,
    title: "Таможенный сбор",
    text: "Входит в предварительную смету и не прячется внутри общей цифры.",
  },
];

const services = [
  {
    icon: Car,
    title: "Легковые автомобили",
    text: "Расчёт платежей, подготовка документов и сопровождение оформления.",
  },
  {
    icon: Truck,
    title: "Грузовые ТС и спецтехника",
    text: "Работа с грузовиками, тягачами, автобусами, прицепами и специальной техникой.",
  },
  {
    icon: Gauge,
    title: "Мото- и водная техника",
    text: "Оформление мотоциклов, квадроциклов, снегоходов, катеров и лодок.",
  },
  {
    icon: Scale,
    title: "Консультация по оформлению",
    text: "Поможем разобраться в исходных данных, документах и составе платежей.",
  },
];

const steps = [
  {
    number: "01",
    title: "Передаёте параметры",
    text: "Тип транспорта, стоимость, возраст, объём и мощность двигателя, формат ввоза.",
  },
  {
    number: "02",
    title: "Получаете предварительный расчёт",
    text: "Сразу видите общую оценку и разбивку платежей по отдельным статьям.",
  },
  {
    number: "03",
    title: "Уточняем документы",
    text: "Проверяем данные автомобиля и исходные документы перед уточнением суммы.",
  },
  {
    number: "04",
    title: "Сопровождаем оформление",
    text: "Готовим комплект и ведём процесс таможенного оформления во Владивостоке.",
  },
];

const faqItems = [
  {
    q: "Что именно считает калькулятор?",
    a: "Он даёт предварительную оценку таможенных платежей и показывает отдельными строками пошлину, акциз и НДС — если они применимы, — утилизационный и таможенный сборы. Итог не заменяет проверку документов специалистом.",
  },
  {
    q: "Какие данные понадобятся для расчёта?",
    a: "Тип транспортного средства, кто ввозит — физическое или юридическое лицо, стоимость и валюта, возраст, тип и объём двигателя, мощность и масса.",
  },
  {
    q: "Почему предварительная сумма может измениться после проверки?",
    a: "На итог влияют подтверждённая таможенная стоимость, характеристики конкретного автомобиля, курс валют на дату оформления и действующие правила. Поэтому после онлайн-оценки мы отдельно проверяем исходные данные.",
  },
  {
    q: "Можно рассчитать оформление для юридического лица?",
    a: "Да. В калькуляторе есть отдельный выбор для физического и юридического лица, поскольку состав и порядок начисления платежей различаются.",
  },
  {
    q: "С какой техникой работает ALISTA?",
    a: "С легковыми и грузовыми автомобилями, автобусами, прицепами, специальной, мото- и водной техникой. Для нестандартного транспорта лучше запросить индивидуальный расчёт.",
  },
  {
    q: "Как получить уточнённый расчёт?",
    a: "Заполните калькулятор или оставьте заявку с параметрами транспорта. Менеджер уточнит недостающие сведения и подтвердит расчёт после проверки.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55 },
};

const Index = () => (
  <PageTransition>
    <Layout>
      <section className="relative overflow-hidden bg-[#eafaf3] pb-10 pt-10 md:pb-16 md:pt-16">
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-[#36d487]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-white/80 blur-3xl" />

        <div className="container relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0aa66a]/20 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#08764d] shadow-sm backdrop-blur">
                <MapPin className="h-3.5 w-3.5" />
                Владивосток · таможенное оформление
              </div>
              <h1 className="max-w-3xl text-balance font-heading text-4xl font-bold leading-[1.03] tracking-[-0.045em] text-[#10231d] sm:text-5xl md:text-6xl xl:text-[4.4rem]">
                Авто из Японии, Кореи и Китая — с понятным расчётом платежей
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[#50635c] sm:text-lg md:text-xl">
                Покажем предварительную сумму и её состав. Уточнённую сумму подтвердим после проверки параметров автомобиля и документов.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-[3.25rem] rounded-full px-7 text-base font-bold shadow-[0_14px_34px_rgba(11,174,108,0.24)]">
                  <Link to="/calculator"><Calculator className="h-5 w-5" />Рассчитать платежи</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-[3.25rem] rounded-full border-[#b8cdc4] bg-white/70 px-7 text-base font-bold text-[#16352a] hover:bg-white">
                  <Link to="/cars">Посмотреть автомобили<ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {confidencePoints.map((point) => (
                  <div key={point} className="flex items-start gap-2 text-sm leading-snug text-[#42564e]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9f5df] text-[#078858]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.7 }} className="relative mx-auto w-full max-w-2xl">
              <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-[#f7fffb] to-[#ccf2df] shadow-[0_28px_80px_rgba(19,61,45,0.16)] sm:min-h-[520px] sm:rounded-[2.6rem]">
                <div className="absolute left-6 top-6 z-10 rounded-full border border-[#a9dfc6] bg-white/90 px-4 py-2 text-xs font-semibold text-[#315147] shadow-sm backdrop-blur">Япония · Корея · Китай</div>
                <div className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#122b23] text-white shadow-lg"><Sparkles className="h-5 w-5" /></div>
                <img src={heroCar} alt="Автомобиль для расчёта таможенного оформления" width={1536} height={1024} loading="eager" className="absolute left-1/2 top-[46%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_24px_24px_rgba(20,45,36,0.22)] sm:w-[112%]" />
                <div className="absolute inset-x-4 bottom-4 z-10 rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_16px_50px_rgba(16,51,39,0.13)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0a8b5a]">Перед оформлением</p><p className="mt-1 font-heading text-lg font-bold text-[#142a22] sm:text-xl">Проверьте состав платежей</p></div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d9f7e8] text-[#087a50]"><ReceiptText className="h-6 w-6" /></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[#53665f]">
                    <span className="rounded-xl bg-[#eef8f3] px-2 py-2">Стоимость</span><span className="rounded-xl bg-[#eef8f3] px-2 py-2">Возраст</span><span className="rounded-xl bg-[#eef8f3] px-2 py-2">Двигатель</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card py-6">
        <div className="container grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center gap-3 sm:justify-center"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /><span><strong className="text-foreground">ООО «Алиста»</strong> · ИНН 2543194698</span></div>
          <div className="flex items-center gap-3 sm:justify-center sm:border-x sm:border-border/70"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span>Таможенное оформление во Владивостоке</span></div>
          <div className="flex items-center gap-3 sm:justify-center"><Phone className="h-5 w-5 shrink-0 text-primary" /><a className="font-semibold text-foreground hover:text-primary" href="tel:+79140730196">+7 914 073-01-96</a></div>
        </div>
      </section>

      <section className="py-20 md:py-28" id="calculation">
        <div className="container">
          <motion.div {...reveal} className="grid items-start gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Прозрачный расчёт</p>
              <h2 className="mt-4 max-w-xl text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl md:text-5xl">Не одна итоговая цифра, а понятная смета</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">Калькулятор показывает, из чего складываются таможенные платежи. Дата курса и предупреждение о предварительном характере расчёта остаются рядом с результатом.</p>
              <Button asChild size="lg" className="mt-8 rounded-full px-7 font-bold"><Link to="/calculator">Открыть калькулятор<ArrowRight className="h-4 w-4" /></Link></Button>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">Онлайн-расчёт носит справочный характер. Итог подтверждается после проверки параметров и документов.</p>
            </div>
            <div className="rounded-[2rem] bg-[#102820] p-4 text-white shadow-[0_24px_70px_rgba(17,45,36,0.18)] sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6be2aa]">Предварительная смета</p><h3 className="mt-2 font-heading text-2xl font-bold">Таможенные платежи</h3></div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">по статьям</div>
              </div>
              <div className="mt-3 divide-y divide-white/10">
                {paymentBreakdown.map((item) => (
                  <div key={item.title} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1c3a30] text-[#71e5af]"><item.icon className="h-5 w-5" /></div>
                    <div><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-white/60">{item.text}</p></div>
                    <span className="pt-1 font-mono text-sm text-[#71e5af]">→</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#d9f8e8] p-5 text-[#102820] sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#08764d]">Итог</p><p className="mt-1 font-heading text-xl font-bold">Видите сумму до заявки</p></div>
                <Link to="/calculator" className="inline-flex items-center gap-1 text-sm font-bold text-[#08764d] hover:underline">Рассчитать <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f4f8f6] py-20 md:py-28">
        <div className="container">
          <motion.div {...reveal} className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Услуги</p><h2 className="mt-4 max-w-2xl text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl md:text-5xl">Оформляем не только легковые автомобили</h2></div>
            <Link to="/services" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Все услуги <ChevronRight className="h-4 w-4" /></Link>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <motion.div key={service.title} {...reveal} transition={{ duration: 0.45, delay: index * 0.06 }} className="group rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(30,65,52,0.05)] transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_42px_rgba(30,65,52,0.1)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><service.icon className="h-6 w-6" /></div>
                <h3 className="mt-6 font-heading text-xl font-bold text-foreground">{service.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Опубликованные работы</p>
            <h2 className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl md:text-5xl">Автомобили из реального каталога ALISTA</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">Здесь показываются только опубликованные карточки из рабочей базы: фотографии, страна и указанная стоимость.</p>
          </motion.div>
          <div className="mt-12"><Gallery /></div>
        </div>
      </section>

      <section className="bg-[#102820] py-20 text-white md:py-28">
        <div className="container">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6be2aa]">Как проходит работа</p><h2 className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl md:text-5xl">От исходных данных до готового оформления</h2><p className="mt-5 max-w-lg leading-relaxed text-white/65">Сначала считаем и проверяем, затем оформляем. Так клиент понимает следующий шаг и не теряется в документах.</p><Button asChild variant="outline" size="lg" className="mt-8 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white hover:text-[#102820]"><Link to="/contacts">Обсудить автомобиль<MessageCircle className="h-4 w-4" /></Link></Button></div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((step) => (
                <li key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6"><div className="flex items-center justify-between"><span className="font-mono text-sm font-bold text-[#6be2aa]">{step.number}</span><ClipboardCheck className="h-5 w-5 text-white/35" /></div><h3 className="mt-8 font-heading text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-white/60">{step.text}</p></li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div {...reveal} className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_rgba(25,63,48,0.09)] lg:grid-cols-[1fr_0.9fr]">
            <div className="p-7 sm:p-10 md:p-14"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><ShieldCheck className="h-6 w-6" /></div><p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-primary">Проверяемые данные</p><h2 className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl">Открытые данные компании</h2><p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">На сайте указаны реквизиты, адрес и прямой телефон компании. Оценить подход к работе можно по опубликованным карточкам и понятной структуре расчёта.</p><Link to="/about" className="mt-7 inline-flex items-center gap-1 font-semibold text-primary hover:underline">О компании и реквизитах <ChevronRight className="h-4 w-4" /></Link></div>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-1">
              <div className="bg-[#eff8f4] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Компания</p><p className="mt-2 font-heading text-2xl font-bold text-foreground">ООО «Алиста»</p><p className="mt-2 text-sm text-muted-foreground">ИНН 2543194698 · КПП 254301001</p></div>
              <div className="bg-[#eff8f4] p-7 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Связаться</p><a href="tel:+79140730196" className="mt-2 block font-heading text-2xl font-bold text-foreground hover:text-primary">+7 914 073-01-96</a><p className="mt-2 text-sm text-muted-foreground">Владивосток · Пн–Пт, 9:00–18:00</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f4f8f6] py-20 md:py-28">
        <div className="container grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <motion.div {...reveal}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-sm"><HelpCircle className="h-6 w-6" /></div><p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-primary">Ответы без сложных формулировок</p><h2 className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl md:text-5xl">Частые вопросы</h2><p className="mt-5 max-w-md leading-relaxed text-muted-foreground">Если вашего случая нет в списке, отправьте параметры транспорта — разберём индивидуально.</p></motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <motion.div key={item.q} {...reveal} transition={{ duration: 0.4, delay: index * 0.04 }}><AccordionItem value={`faq-${index}`} className="rounded-2xl border border-border bg-card px-5 shadow-sm data-[state=open]:border-primary/30"><AccordionTrigger className="py-5 text-left font-semibold text-foreground hover:text-primary hover:no-underline">{item.q}</AccordionTrigger><AccordionContent className="pb-5 leading-relaxed text-muted-foreground">{item.a}</AccordionContent></AccordionItem></motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] bg-[#d9f8e8] p-6 sm:p-10 md:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:gap-16">
              <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#08764d]">Уточнённый расчёт после проверки</p><h2 className="mt-4 max-w-2xl text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-[#102820] sm:text-4xl md:text-5xl">Оставьте параметры автомобиля — уточним расчёт</h2><p className="mt-5 max-w-xl leading-relaxed text-[#476158] md:text-lg">Укажите контакт и кратко опишите транспорт. Менеджер свяжется, чтобы запросить недостающие данные.</p><div className="mt-8 grid gap-3 text-sm text-[#304c42] sm:grid-cols-2"><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#078858]" /> Параметры можно уточнить с менеджером</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#078858]" /> Можно начать с онлайн-калькулятора</div></div></div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(24,68,50,0.12)] backdrop-blur sm:p-7"><LeadForm source="home_redesign_cta" buttonLabel="Запросить уточнённый расчёт" /></div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  </PageTransition>
);

export default Index;
