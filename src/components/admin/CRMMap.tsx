import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  Inbox,
  Users,
  Briefcase,
  FileText,
  Activity,
  History,
  Car,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

type Node = {
  title: string;
  desc: string;
  to?: string;
  icon: typeof Inbox;
  tone: "muted" | "primary" | "accent" | "success" | "warning";
};

const toneClass: Record<Node["tone"], string> = {
  muted: "border-border bg-muted/30",
  primary: "border-primary/40 bg-primary/10",
  accent: "border-accent/40 bg-accent/10",
  success: "border-emerald-500/40 bg-emerald-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
};

const NodeCard = ({ n, i }: { n: Node; i: number }) => {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`group flex flex-col gap-1 rounded-lg border p-3 transition-all hover:scale-[1.02] hover:shadow-lg ${toneClass[n.tone]}`}
    >
      <div className="flex items-center gap-2">
        <n.icon className="h-4 w-4" />
        <span className="font-semibold text-sm">{n.title}</span>
      </div>
      <span className="text-xs text-muted-foreground leading-snug">{n.desc}</span>
    </motion.div>
  );
  return n.to ? <Link to={n.to}>{inner}</Link> : inner;
};

const Arrow = ({ dir = "down", label }: { dir?: "down" | "right"; label?: string }) => (
  <div className={`flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider ${dir === "down" ? "py-1" : "px-1"}`}>
    {dir === "down" ? <ArrowDown className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
    {label && <span>{label}</span>}
  </div>
);

const leadStatuses: { code: string; label: string; dot: string; hint: string }[] = [
  { code: "new", label: "Новая", dot: "bg-sky-500", hint: "Только что упала — позвонить в течение 15 мин" },
  { code: "in_progress", label: "В работе", dot: "bg-blue-500", hint: "Идёт первичная коммуникация" },
  { code: "qualified", label: "Квалифицирована", dot: "bg-indigo-500", hint: "Бюджет и потребность подтверждены" },
  { code: "proposal", label: "Предложение", dot: "bg-violet-500", hint: "Отправлен расчёт / варианты" },
  { code: "negotiation", label: "Переговоры", dot: "bg-fuchsia-500", hint: "Обсуждаются условия" },
  { code: "won", label: "Конвертирована", dot: "bg-emerald-500", hint: "Создан клиент и сделка" },
  { code: "lost", label: "Отказ", dot: "bg-red-500", hint: "Указать причину в карточке" },
  { code: "spam", label: "Спам", dot: "bg-zinc-500", hint: "Не учитывается в воронке" },
  { code: "postponed", label: "Отложена", dot: "bg-amber-500", hint: "Возврат через напоминание" },
  { code: "duplicate", label: "Дубль", dot: "bg-orange-500", hint: "Уже есть такая заявка" },
];

const dealStages: { code: string; label: string; dot: string; hint: string }[] = [
  { code: "new", label: "Новая", dot: "bg-sky-500", hint: "Заведена из заявки" },
  { code: "selection", label: "Подбор авто", dot: "bg-blue-500", hint: "Поиск/согласование лота" },
  { code: "contract", label: "Договор", dot: "bg-indigo-500", hint: "Подписание договора" },
  { code: "payment", label: "Оплата", dot: "bg-violet-500", hint: "Получены средства" },
  { code: "purchase", label: "Покупка", dot: "bg-fuchsia-500", hint: "Авто выкуплено" },
  { code: "delivery", label: "Доставка", dot: "bg-amber-500", hint: "Везём в РФ" },
  { code: "customs", label: "Растаможка", dot: "bg-orange-500", hint: "ЭПТС, пошлины" },
  { code: "completed", label: "Завершена", dot: "bg-emerald-500", hint: "Выдано клиенту" },
];

const CRMMap = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Карта CRM — как всё связано</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_2fr] gap-4 items-stretch">
            {/* Источник */}
            <div className="space-y-2">
              <NodeCard
                i={0}
                n={{
                  title: "Сайт / Калькулятор / Форма",
                  desc: "Все каналы привлечения создают заявку",
                  icon: Globe,
                  tone: "muted",
                }}
              />
              <Arrow label="заявка" />
              <NodeCard
                i={1}
                n={{
                  title: "Заявка (Lead)",
                  desc: "Первичная обработка, статусы и SLA",
                  to: "/admin/leads",
                  icon: Inbox,
                  tone: "primary",
                }}
              />
              <Arrow label="конвертация" />
              <NodeCard
                i={2}
                n={{
                  title: "Клиент",
                  desc: "Карточка 360°, контакты, история",
                  to: "/admin/clients",
                  icon: Users,
                  tone: "accent",
                }}
              />
              <Arrow label="сделка" />
              <NodeCard
                i={3}
                n={{
                  title: "Сделка (Deal)",
                  desc: "Pipeline из 8 этапов, маржа, чек-лист",
                  to: "/admin/deals",
                  icon: Briefcase,
                  tone: "success",
                }}
              />
            </div>

            {/* Соединитель */}
            <div className="hidden lg:flex flex-col items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Расширения */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
              <NodeCard
                i={4}
                n={{
                  title: "Документы",
                  desc: "Счета, договоры, инвойсы по шаблонам",
                  to: "/admin/documents",
                  icon: FileText,
                  tone: "warning",
                }}
              />
              <NodeCard
                i={5}
                n={{
                  title: "Активности",
                  desc: "Звонки, заметки, задачи, встречи",
                  icon: Activity,
                  tone: "primary",
                }}
              />
              <NodeCard
                i={6}
                n={{
                  title: "История этапов",
                  desc: "Кто и когда менял статус/этап",
                  icon: History,
                  tone: "muted",
                }}
              />
              <NodeCard
                i={7}
                n={{
                  title: "Каталог авто",
                  desc: "Витрина и подбор лотов для сделки",
                  to: "/admin/cars",
                  icon: Car,
                  tone: "accent",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статусы заявок</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {leadStatuses.map((s) => (
                <li key={s.code} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <div>
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">SLA индикаторы:</div>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;12 ч</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> &lt;48 ч</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> &gt;48 ч — просрочено</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Этапы сделки</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {dealStages.map((s, idx) => (
                <li key={s.code} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                    {idx + 1}
                  </span>
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <div>
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.hint}</div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMMap;