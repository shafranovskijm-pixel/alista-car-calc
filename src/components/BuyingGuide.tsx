import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const buyingSteps = [
  {
    label: "Обращение",
    title: "Обращаетесь в компанию «Алиста»",
    text: "Первый шаг — связаться с нами и рассказать, какой автомобиль хотите купить из Японии.",
    picture: "Шиба Али приветствует клиента в компании «Алиста»",
  },
  {
    label: "Подбор",
    title: "Заказываете подбор автомобиля",
    text: "Передаёте пожелания к автомобилю — начинаем подбор подходящего варианта.",
    picture: "Али вместе с клиентом подбирает автомобиль на экране",
  },
  {
    label: "Договор",
    title: "Заключаем договор с клиентом",
    text: "Оформляем договор на покупку автомобиля.",
    picture: "Али и клиент подписывают договор",
  },
  {
    label: "Выбор авто",
    title: "Выбираем авто и согласовываем сумму с расходами",
    text: "Согласовываем конкретный автомобиль и сумму с учётом расходов.",
    picture: "Али показывает выбранный автомобиль и смету расходов",
  },
  {
    label: "Морской путь",
    title: "Автомобиль на ярде — готовим к морской перевозке",
    text: "Ставим автомобиль на ярд — площадку, где он ожидает погрузки на морской транспорт.",
    picture: "Али сопровождает автомобиль на площадке у грузового судна",
  },
  {
    label: "СВХ",
    title: "Выгружаем автомобиль на СВХ",
    text: "После морской перевозки автомобиль выгружают на склад временного хранения — СВХ.",
    picture: "Автомобиль с Али выгружают у склада временного хранения",
  },
  {
    label: "Таможня",
    title: "Проходим таможенное оформление",
    text: "Оформляем автомобиль в таможне — этот этап также называют растаможкой.",
    picture: "Али передаёт документы для таможенного оформления автомобиля",
  },
  {
    label: "Лаборатория",
    title: "Выпуск авто, приёмка со склада и лаборатория",
    text: "После выпуска принимаем автомобиль со склада и проходим лабораторию.",
    picture: "Али сопровождает выпущенный автомобиль на проверке в лаборатории",
  },
  {
    label: "Ключи!",
    title: "Передаём ключи клиенту или отправляем через ТК",
    text: "Передаём автомобиль и ключи клиенту. Другой вариант — отправка через транспортную компанию.",
    picture: "Али вручает ключи счастливому клиенту рядом с автомобилем",
  },
] as const;

const BuyingGuide = () => {
  const [selectedStep, setSelectedStep] = useState(0);
  const guideId = useId();
  const step = buyingSteps[selectedStep];
  const contentId = `${guideId}-content`;
  const column = selectedStep % 3;
  const row = Math.floor(selectedStep / 3);

  return (
    <section id="japan-buying-guide" aria-labelledby={`${guideId}-heading`} className="border-y border-primary/15 bg-secondary/55 py-16 md:py-24">
      <div className="container min-w-0">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Из Японии — к вашим ключам</p>
          <h2 id={`${guideId}-heading`} className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl md:text-5xl">Покупка авто в 9 понятных шагах</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">Знакомьтесь, Али — ваш пушистый проводник. Выбирайте любой шаг или листайте по порядку: от первого обращения до передачи автомобиля.</p>
        </div>
        <nav aria-label="Этапы покупки автомобиля из Японии" className="mt-8">
          <ol className="grid min-w-0 grid-cols-3 gap-2 md:gap-3 xl:grid-cols-9">
            {buyingSteps.map((item, index) => (
              <li key={item.label} className="min-w-0">
                <button
                  type="button"
                  aria-label={`Шаг ${index + 1}: ${item.title}`}
                  aria-current={selectedStep === index ? "step" : undefined}
                  aria-controls={contentId}
                  onClick={() => setSelectedStep(index)}
                  className={cn(
                    "flex min-h-[88px] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-semibold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:transition-colors sm:text-sm",
                    selectedStep === index ? "border-primary bg-primary/15 text-foreground shadow-[0_0_22px_hsl(var(--primary)/0.12)]" : "border-border bg-background/55 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true" className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold", selectedStep === index ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}>{index + 1}</span>
                  <span className="break-words">{item.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div id={contentId} className="mt-5 grid min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/20 bg-background shadow-[0_20px_60px_hsl(var(--background)/0.45)] md:grid-cols-[1fr_1fr] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-w-0 bg-[#0a1e34]">
            <div role="img" aria-label={step.picture} data-testid="buying-guide-scene" className="aspect-square w-full" style={{ backgroundImage: "url('/images/japan-buying-guide.webp')", backgroundSize: "300% 300%", backgroundPosition: `${column * 50}% ${row * 50}%`, backgroundRepeat: "no-repeat" }} />
            <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-[#071220]/90 px-4 py-2 text-xs font-semibold text-white shadow-sm">Али · ваш проводник</span>
          </div>
          <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.12em] text-primary"><span>Маршрут автомобиля</span><span className="shrink-0">{selectedStep + 1} / {buyingSteps.length}</span></div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true"><div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${((selectedStep + 1) / buyingSteps.length) * 100}%` }} /></div>
            <div className="mt-7" aria-live="polite" aria-atomic="true">
              <p className="text-sm font-semibold text-muted-foreground">Шаг {selectedStep + 1} из {buyingSteps.length}</p>
              <h3 className="mt-3 text-pretty font-heading text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground lg:text-3xl">{step.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
            <div className="mt-auto pt-8">
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" disabled={selectedStep === 0} onClick={() => setSelectedStep((current) => Math.max(0, current - 1))} className="h-11 rounded-full border-primary/25 bg-transparent"><ArrowLeft aria-hidden="true" />Назад</Button>
                <Button type="button" disabled={selectedStep === buyingSteps.length - 1} onClick={() => setSelectedStep((current) => Math.min(buyingSteps.length - 1, current + 1))} className="h-11 rounded-full font-bold">Дальше<ArrowRight aria-hidden="true" /></Button>
              </div>
              <Button asChild variant="link" className="mt-4 h-auto min-h-11 w-full whitespace-normal px-0 py-2 text-center font-semibold"><Link to="/contacts">Обсудить подбор автомобиля<MessageCircle aria-hidden="true" /></Link></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyingGuide;
