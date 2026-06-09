import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Дашборд",
    body: (
      <>KPI воронки (новые заявки, активные сделки, конверсия, выручка), последние события и быстрые ссылки на разделы. Клик по KPI ведёт в отфильтрованный список.</>
    ),
  },
  {
    title: "Заявки",
    body: (
      <>Все входящие обращения. Два вида: таблица (быстрая обработка, hotkeys, массовые действия) и Канбан (визуальное распределение по статусам). SLA-точка показывает, сколько времени заявка без действий.</>
    ),
  },
  {
    title: "Клиенты",
    body: (
      <>Карточка клиента 360°: контакты, авто, история сделок и активностей. Создаётся автоматически при конвертации заявки.</>
    ),
  },
  {
    title: "Сделки",
    body: (
      <>Pipeline из 8 этапов (Новая → Завершена). На каждом этапе свой чек-лист требований в правой колонке карточки. Канбан — перетаскиванием меняем этап, таблица — массово.</>
    ),
  },
  {
    title: "Документы",
    body: (
      <>Шаблоны (договор, счёт, инвойс) и сгенерированные документы. Привязываются к сделке/клиенту.</>
    ),
  },
  {
    title: "Отчёты",
    body: <>Аналитика по источникам, конверсии и доходу. Период — переключатель сверху.</>,
  },
  {
    title: "Каталог авто / Наши работы",
    body: <>Что публикуется на публичном сайте в разделах «Авто в наличии» и «Наши работы».</>,
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Как сменить пароль?",
    a: "Выйдите из CRM и на странице входа нажмите «Забыли пароль» — придёт письмо со ссылкой для сброса.",
  },
  {
    q: "Как назначить заявку на себя?",
    a: "В таблице заявок наведитесь на строку и нажмите «Назначить мне» в быстрых действиях, либо в карточке заявки — поле «Ответственный» справа.",
  },
  {
    q: "Как закрыть сделку?",
    a: "В карточке сделки переведите этап в «Завершена». Если сделка не состоялась — этап «Отменена» с указанием причины.",
  },
  {
    q: "Откуда берутся заявки?",
    a: "Все формы публичного сайта (калькулятор, форма обратной связи, поп-апы) создают запись в разделе «Заявки» в реальном времени.",
  },
  {
    q: "Что значит цветная точка рядом со статусом?",
    a: "Это SLA — индикатор «свежести» заявки: зелёная (<12ч), жёлтая (<48ч), красная (>48ч, надо срочно реагировать).",
  },
];

const CRMFaq = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Что где находится</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sections.map((s) => (
            <AccordionItem key={s.title} value={s.title}>
              <AccordionTrigger className="text-sm">{s.title}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{s.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Частые вопросы</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  </div>
);

export default CRMFaq;