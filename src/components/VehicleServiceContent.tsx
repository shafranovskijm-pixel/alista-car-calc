import React from "react";
import { ArrowRight, Check, ChevronRight, Layers, Luggage, Phone, Snowflake } from "lucide-react";
import { CUSTOMS_SERVICES, SERVICE_GROUPS, VEHICLE_SERVICES, servicePath, serviceStructuredData, type VehicleService } from "../lib/vehicle-services";

const groupIcons = { insulation: Layers, comfort: Snowflake, luggage: Luggage };
const linkButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export const VehicleServiceCard = ({ service }: { service: VehicleService }) => {
  const Icon = groupIcons[service.group];
  return (
    <a href={servicePath(service)} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className="font-heading text-xl font-bold text-foreground">{service.name}</h3>
      <p className="mb-5 mt-3 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
      <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">Подробнее об услуге <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
    </a>
  );
};

export const ServiceContact = ({ name }: { name?: string }) => (
  <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6 sm:p-9" aria-label="Обсудить услугу">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Расчёт под ваш автомобиль</p>
    <h2 className="mt-3 font-heading text-2xl font-bold text-foreground sm:text-3xl">Обсудим задачу и состав работ</h2>
    <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{name ? `Укажите в заявке «${name}», модель и год автомобиля. ` : "Укажите интересующую услугу, модель и год автомобиля. "}Менеджер уточнит совместимость, материалы, стоимость и возможные сроки до согласования работ.</p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a className={linkButton} href="/contacts">Обсудить услугу <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
      <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary" href="tel:+79140730196"><Phone className="h-4 w-4 text-primary" aria-hidden="true" />+7 914 073-01-96</a>
    </div>
  </section>
);

export const ServicesHubContent = () => (
  <div className="pb-16 md:pb-24">
    <section className="border-b border-border bg-secondary/30 py-12 md:py-20">
      <div className="container max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">ALISTA · Владивосток</p>
        <h1 className="mt-4 max-w-4xl text-balance font-heading text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">Услуги для вашего автомобиля</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">От таможенного оформления до комфорта в каждой поездке. Шумо- и теплоизоляция, обновление салона, подогрев, вентиляция и подбор багажных систем во Владивостоке.</p>
        <nav className="mt-7 flex flex-wrap gap-2" aria-label="Направления услуг">
          {SERVICE_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">{group.name}</a>)}
          <a href="#customs" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary">Таможенное оформление</a>
        </nav>
      </div>
    </section>
    <div className="container max-w-6xl">
      {SERVICE_GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="scroll-mt-28 py-10 md:py-14">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{group.name}</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{group.description}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{VEHICLE_SERVICES.filter((service) => service.group === group.id).map((service) => <VehicleServiceCard key={service.slug} service={service} />)}</div>
        </section>
      ))}
      <section id="customs" className="scroll-mt-28 border-t border-border py-10 md:py-14">
        <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Таможенное оформление</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">Проверяем параметры транспорта и документы, объясняем состав платежей и сопровождаем оформление.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{CUSTOMS_SERVICES.map((service) => <div key={service.title} className="rounded-2xl border border-border bg-card p-6"><h3 className="font-heading text-lg font-bold text-foreground">{service.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.text}</p><a href="/contacts" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">Запросить расчёт <ChevronRight className="h-4 w-4" aria-hidden="true" /></a></div>)}</div>
      </section>
      <ServiceContact />
    </div>
  </div>
);

export const ServiceDetailContent = ({ service }: { service: VehicleService }) => {
  const related = VEHICLE_SERVICES.filter((item) => item.group === service.group && item.slug !== service.slug).slice(0, 3);
  const recommendations = related.length ? related : VEHICLE_SERVICES.filter((item) => item.group === "comfort").slice(0, 3);
  const group = SERVICE_GROUPS.find((item) => item.id === service.group)!;
  return (
    <article className="pb-16 md:pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceStructuredData(service)).replace(/</g, "\\u003c") }} />
      <div className="border-b border-border bg-secondary/30 py-8 md:py-14">
        <div className="container max-w-6xl">
          <nav aria-label="Хлебные крошки" className="mb-7 text-sm leading-relaxed text-muted-foreground"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1"><li><a href="/" className="hover:text-primary">Главная</a></li><li aria-hidden="true">/</li><li><a href="/services/" className="hover:text-primary">Услуги</a></li><li aria-hidden="true">/</li><li aria-current="page">{service.name}</li></ol></nav>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{group.name} · ALISTA</p>
          <h1 className="mt-4 max-w-4xl text-balance font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">{service.name} во Владивостоке</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{service.summary}</p>
          <a href="#service-request" className={`${linkButton} mt-7`}>Уточнить стоимость <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        </div>
      </div>
      <div className="container max-w-6xl">
        <div className="grid gap-8 py-10 md:py-14 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground">Об услуге</h2>
            {service.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-relaxed text-muted-foreground">{paragraph}</p>)}
            <h2 className="mt-9 font-heading text-2xl font-bold text-foreground">Когда стоит обсудить</h2>
            <ul className="mt-5 space-y-4">{service.reasons.map((reason) => <li key={reason} className="flex items-start gap-3 leading-relaxed text-muted-foreground"><Check className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><span>{reason}</span></li>)}</ul>
          </section>
          <aside className="self-start rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground">Что сообщить для расчёта</h2>
            <ol className="mt-5 list-decimal space-y-4 pl-5 leading-relaxed text-muted-foreground">{service.preparation.map((item) => <li key={item} className="pl-1">{item}</li>)}</ol>
            <h2 className="mt-8 font-heading text-xl font-bold text-foreground">От чего зависит стоимость</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{service.estimate}</p>
            <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">Совместимость, материалы и состав работ подтверждаются после консультации по конкретному автомобилю.</p>
          </aside>
        </div>
        <section className="border-t border-border py-10 md:py-14">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Частые вопросы</h2>
          <div className="mt-6 space-y-3">{service.faq.map((item) => <details key={item.question} className="rounded-2xl border border-border bg-card px-5"><summary className="cursor-pointer py-5 font-semibold leading-relaxed text-foreground marker:text-primary">{item.question}</summary><p className="pb-5 leading-relaxed text-muted-foreground">{item.answer}</p></details>)}</div>
        </section>
        <div id="service-request" className="scroll-mt-28"><ServiceContact name={service.name} /></div>
        <section className="pt-12 md:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-heading text-2xl font-bold text-foreground">Другие услуги ALISTA</h2><a href="/services/" className="inline-flex items-center gap-1 font-semibold text-primary">Все услуги <ChevronRight className="h-4 w-4" aria-hidden="true" /></a></div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recommendations.map((item) => <VehicleServiceCard key={item.slug} service={item} />)}</div>
        </section>
      </div>
    </article>
  );
};
