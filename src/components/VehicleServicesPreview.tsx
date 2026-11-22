import { ArrowRight, Layers, Luggage, Snowflake } from "lucide-react";
import { SERVICE_GROUPS, VEHICLE_SERVICES, servicePath } from "@/lib/vehicle-services";

const icons = { insulation: Layers, comfort: Snowflake, luggage: Luggage };

const VehicleServicesPreview = () => (
  <section className="border-y border-border bg-card/40 py-16 md:py-24">
    <div className="container">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Больше комфорта в поездке</p>
      <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <h2 className="max-w-3xl text-balance font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">Доработки для вашего автомобиля</h2>
        <a href="/services/" className="inline-flex shrink-0 items-center gap-2 font-semibold text-primary">Все услуги <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {SERVICE_GROUPS.map((group) => {
          const Icon = icons[group.id];
          return <div key={group.id} className="rounded-2xl border border-border bg-card p-6"><Icon className="h-7 w-7 text-primary" aria-hidden="true" /><h3 className="mt-5 font-heading text-xl font-bold text-foreground">{group.name}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{group.description}</p><ul className="mt-5 space-y-3">{VEHICLE_SERVICES.filter((service) => service.group === group.id).map((service) => <li key={service.slug}><a className="inline-flex gap-2 text-sm text-foreground underline decoration-border underline-offset-4 hover:text-primary" href={servicePath(service)}>{service.name}</a></li>)}</ul></div>;
        })}
      </div>
    </div>
  </section>
);

export default VehicleServicesPreview;
