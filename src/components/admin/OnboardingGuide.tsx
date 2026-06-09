import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Rocket,
  UserCog,
  LayoutDashboard,
  Inbox,
  MessageSquare,
  Repeat,
  Users,
  Briefcase,
  FileText,
  Car,
  BarChart3,
  Search,
  Flag,
  Trophy,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

type Task = { id: string; label: string; href?: string };
type Step = {
  id: string;
  title: string;
  icon: typeof Rocket;
  summary: string;
  details: React.ReactNode;
  tasks: Task[];
};

const STEPS: Step[] = [
  {
    id: "intro",
    title: "Знакомство с CRM",
    icon: Rocket,
    summary: "Что есть в системе и как сущности связаны между собой.",
    details: (
      <>
        <p>CRM Alista — единая среда для работы менеджера: от первого касания клиента до выдачи авто.</p>
        <p className="mt-2">Основные сущности: <b>Заявка → Клиент → Сделка</b>, плюс <b>Документы</b>, <b>Активности</b> и <b>Каталог авто</b>. Всё связано — открыв клиента, вы видите все его заявки, сделки и историю общения.</p>
      </>
    ),
    tasks: [{ id: "got_it", label: "Я понял общую схему" }],
  },
  {
    id: "profile",
    title: "Профиль и вход",
    icon: UserCog,
    summary: "Заполните имя — оно используется в активностях и истории изменений.",
    details: <p>Откройте «Настройки → Профиль» и укажите своё имя. Email менять нельзя — он привязан к аккаунту.</p>,
    tasks: [
      { id: "open_profile", label: "Открыть профиль", href: "/admin/settings" },
      { id: "name_saved", label: "Имя сохранено" },
    ],
  },
  {
    id: "dashboard",
    title: "Дашборд",
    icon: LayoutDashboard,
    summary: "KPI воронки, лента событий и быстрые действия.",
    details: (
      <p>На дашборде сразу видно: новые заявки, активные сделки, конверсию и выручку. Клик по KPI — переход в отфильтрованный список. Лента справа показывает последние события по всей системе.</p>
    ),
    tasks: [
      { id: "open_dash", label: "Открыть дашборд", href: "/admin" },
      { id: "checked_kpi", label: "Посмотрел свои KPI за сегодня" },
    ],
  },
  {
    id: "lead_intake",
    title: "Приём заявки",
    icon: Inbox,
    summary: "Откуда падают заявки и что значит SLA-точка.",
    details: (
      <>
        <p>Все формы публичного сайта (калькулятор, форма обратной связи, поп-апы) попадают в раздел «Заявки» в реальном времени.</p>
        <p className="mt-2">Цветная точка рядом со статусом — это <b>SLA</b>: зелёная (&lt;12ч), жёлтая (&lt;48ч), красная (&gt;48ч, просрочено).</p>
      </>
    ),
    tasks: [
      { id: "open_leads", label: "Открыть «Заявки»", href: "/admin/leads" },
      { id: "assign_self", label: "Назначил заявку на себя" },
    ],
  },
  {
    id: "lead_work",
    title: "Работа с заявкой",
    icon: MessageSquare,
    summary: "Статусы, активности и горячие клавиши.",
    details: (
      <>
        <p>Воронка статусов: Новая → В работе → Квалифицирована → Предложение → Переговоры → Конвертирована / Отказ.</p>
        <p className="mt-2">В карточке заявки добавляйте <b>активности</b>: звонок, заметка, задача с дедлайном, встреча, email. Задачи с просрочкой подсвечиваются красным.</p>
        <p className="mt-2">Горячие клавиши в таблице: <kbd className="rounded border px-1 text-xs">/</kbd> поиск, <kbd className="rounded border px-1 text-xs">J</kbd>/<kbd className="rounded border px-1 text-xs">K</kbd> навигация, <kbd className="rounded border px-1 text-xs">X</kbd> отметить, <kbd className="rounded border px-1 text-xs">Enter</kbd> открыть, <kbd className="rounded border px-1 text-xs">Esc</kbd> снять.</p>
      </>
    ),
    tasks: [
      { id: "add_activity", label: "Добавил активность в таймлайн" },
      { id: "move_status", label: "Перевёл заявку в «В работе»" },
    ],
  },
  {
    id: "convert",
    title: "Конвертация в клиента и сделку",
    icon: Repeat,
    summary: "Один клик — создаётся клиент и сделка с этапом «Новая».",
    details: (
      <p>Если заявка квалифицирована — нажмите «Конвертировать». Система создаст запись в «Клиентах» и пустую «Сделку», к которой автоматически подтянутся данные из заявки.</p>
    ),
    tasks: [{ id: "converted", label: "Создал тестовую сделку из заявки" }],
  },
  {
    id: "client_360",
    title: "Карточка клиента 360°",
    icon: Users,
    summary: "Контакты, авто, сделки и история — всё на одной странице.",
    details: <p>В карточке клиента: реквизиты, прикреплённые авто, все сделки и общая лента активностей. Здесь же — быстрые действия: позвонить, написать, создать сделку.</p>,
    tasks: [{ id: "open_clients", label: "Открыть «Клиенты»", href: "/admin/clients" }],
  },
  {
    id: "pipeline",
    title: "Pipeline сделки",
    icon: Briefcase,
    summary: "8 этапов с чек-листами, маржа и привязка авто.",
    details: (
      <>
        <p>Этапы: Новая → Подбор авто → Договор → Оплата → Покупка → Доставка → Растаможка → Завершена.</p>
        <p className="mt-2">На каждом этапе — свой чек-лист в правой колонке (например, «Договор подписан» на этапе «Оплата»). Канбан — перетаскиванием меняйте этап, таблица — массовые действия.</p>
      </>
    ),
    tasks: [
      { id: "open_deals", label: "Открыть «Сделки»", href: "/admin/deals" },
      { id: "drag_stage", label: "Перетащил карточку на следующий этап" },
    ],
  },
  {
    id: "documents",
    title: "Документы",
    icon: FileText,
    summary: "Шаблоны и генерация из карточки сделки.",
    details: <p>Договоры, счета, инвойсы создаются из шаблонов. В карточке сделки кнопка «Сгенерировать документ» — выбираете шаблон, система подставляет данные клиента и сделки.</p>,
    tasks: [
      { id: "open_docs", label: "Открыть «Документы»", href: "/admin/documents" },
      { id: "generated_doc", label: "Сгенерировал тестовый документ" },
    ],
  },
  {
    id: "catalog",
    title: "Каталог и витрина",
    icon: Car,
    summary: "Что попадает на публичный сайт.",
    details: <p>«Каталог авто» — карточки авто в наличии, попадают в раздел сайта «Авто в наличии». «Наши работы» — кейсы для блока на главной. Управляйте публикацией переключателем.</p>,
    tasks: [
      { id: "open_cars", label: "Открыть каталог авто", href: "/admin/cars" },
      { id: "open_works", label: "Открыть «Наши работы»", href: "/admin/works" },
    ],
  },
  {
    id: "reports",
    title: "Отчёты",
    icon: BarChart3,
    summary: "Конверсия, источники, доход.",
    details: <p>В «Отчётах» — аналитика по периодам: источники заявок, конверсия по этапам, выручка. Используйте для еженедельного разбора.</p>,
    tasks: [{ id: "open_reports", label: "Открыть «Отчёты»", href: "/admin/reports" }],
  },
  {
    id: "search",
    title: "Поиск и уведомления",
    icon: Search,
    summary: "Cmd+K и колокольчик в шапке.",
    details: (
      <p>
        В шапке: <b>глобальный поиск</b> (<kbd className="rounded border px-1 text-xs">⌘</kbd>+<kbd className="rounded border px-1 text-xs">K</kbd>) — ищет по заявкам, клиентам, сделкам, авто. <b>Колокольчик</b> — новые заявки и системные события. <b>Курс валют</b> — текущие USD/EUR/JPY от ЦБ РФ.
      </p>
    ),
    tasks: [
      { id: "try_search", label: "Попробовал поиск Cmd+K" },
      { id: "checked_bell", label: "Открыл уведомления" },
    ],
  },
  {
    id: "close",
    title: "Закрытие сделки",
    icon: Flag,
    summary: "Завершена или Отменена с причиной.",
    details: <p>Успешная сделка → этап «Завершена». Если клиент отказался — этап «Отменена», обязательно укажите причину в карточке. Это нужно для аналитики отказов.</p>,
    tasks: [{ id: "knows_close", label: "Знаю, как корректно закрыть сделку" }],
  },
  {
    id: "done",
    title: "Готово!",
    icon: Trophy,
    summary: "Вы прошли обучение от и до.",
    details: (
      <>
        <p>Теперь вы знаете весь сквозной процесс работы в CRM Alista. Возвращайтесь к этому обучению в любое время — прогресс сохраняется.</p>
        <p className="mt-2 text-muted-foreground text-sm">Подсказки — в табах «Горячие клавиши» и «Справка / FAQ».</p>
      </>
    ),
    tasks: [{ id: "graduated", label: "Я готов работать в CRM" }],
  },
];

const STORAGE_KEY = "crm_onboarding_progress_v1";
const ACTIVE_KEY = "crm_onboarding_active_v1";

const OnboardingGuide = () => {
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [activeId, setActiveId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_KEY) || STEPS[0].id;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  }, [done]);
  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const totalTasks = useMemo(() => STEPS.reduce((s, st) => s + st.tasks.length, 0), []);
  const doneTasks = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const percent = Math.round((doneTasks / totalTasks) * 100);

  const isStepComplete = (s: Step) => s.tasks.every((t) => done[`${s.id}.${t.id}`]);
  const activeIdx = STEPS.findIndex((s) => s.id === activeId);
  const active = STEPS[activeIdx] ?? STEPS[0];

  const toggle = (stepId: string, taskId: string) => {
    const key = `${stepId}.${taskId}`;
    setDone((d) => ({ ...d, [key]: !d[key] }));
  };

  const reset = () => {
    if (!confirm("Сбросить прогресс обучения?")) return;
    setDone({});
    setActiveId(STEPS[0].id);
  };

  const next = () => {
    if (activeIdx < STEPS.length - 1) setActiveId(STEPS[activeIdx + 1].id);
  };
  const prev = () => {
    if (activeIdx > 0) setActiveId(STEPS[activeIdx - 1].id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      {/* Stepper */}
      <Card>
        <CardContent className="p-3">
          <div className="px-2 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Прогресс</span>
              <span>{doneTasks} / {totalTasks}</span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>
          <ul className="mt-2 space-y-0.5">
            {STEPS.map((s, idx) => {
              const complete = isStepComplete(s);
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${
                      isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        complete
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                          ? "border-primary text-primary"
                          : "border-border"
                      }`}
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </span>
                    <span className="flex-1 truncate">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border mt-3 pt-3 px-1">
            <Button variant="ghost" size="sm" onClick={reset} className="w-full justify-start text-muted-foreground">
              <RotateCcw className="h-4 w-4 mr-2" /> Сбросить прогресс
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center text-primary-foreground">
                    <active.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Шаг {activeIdx + 1} из {STEPS.length}</div>
                    <h2 className="text-xl font-semibold">{active.title}</h2>
                  </div>
                </div>
                {isStepComplete(active) && (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                    <Check className="h-3 w-3 mr-1" /> Выполнено
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4">{active.summary}</p>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed mb-6">{active.details}</div>

              <div className="rounded-lg border border-border bg-muted/20 p-4 mb-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Чек-лист шага</div>
                <ul className="space-y-2">
                  {active.tasks.map((t) => {
                    const key = `${active.id}.${t.id}`;
                    const checked = !!done[key];
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <Checkbox checked={checked} onCheckedChange={() => toggle(active.id, t.id)} />
                          <span className={checked ? "line-through text-muted-foreground" : ""}>{t.label}</span>
                        </label>
                        {t.href && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={t.href} target="_blank" rel="noreferrer">
                              Открыть <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={prev} disabled={activeIdx === 0}>
                  ← Назад
                </Button>
                <div className="text-xs text-muted-foreground">
                  {percent}% пройдено
                </div>
                <Button onClick={next} disabled={activeIdx === STEPS.length - 1}>
                  Дальше →
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingGuide;