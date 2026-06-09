import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-semibold">
    {children}
  </kbd>
);

const sections: { title: string; items: { keys: React.ReactNode; desc: string }[] }[] = [
  {
    title: "Глобально",
    items: [
      { keys: <><Kbd>⌘</Kbd> + <Kbd>K</Kbd></>, desc: "Открыть глобальный поиск" },
      { keys: <Kbd>/</Kbd>, desc: "Фокус в строку поиска текущего раздела" },
      { keys: <Kbd>Esc</Kbd>, desc: "Закрыть диалог / снять выделение" },
    ],
  },
  {
    title: "Таблица заявок",
    items: [
      { keys: <><Kbd>J</Kbd> / <Kbd>K</Kbd></>, desc: "Следующая / предыдущая строка" },
      { keys: <><Kbd>↑</Kbd> / <Kbd>↓</Kbd></>, desc: "То же стрелками" },
      { keys: <Kbd>X</Kbd>, desc: "Отметить / снять отметку строки" },
      { keys: <Kbd>Enter</Kbd>, desc: "Открыть карточку заявки" },
    ],
  },
  {
    title: "Карточка лида / сделки",
    items: [
      { keys: <><Kbd>⌘</Kbd> + <Kbd>Enter</Kbd></>, desc: "Сохранить активность в таймлайне" },
    ],
  },
];

const HotkeysSheet = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Горячие клавиши</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{s.title}</div>
          <ul className="space-y-2 text-sm">
            {s.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{it.desc}</span>
                <span className="flex items-center gap-1">{it.keys}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default HotkeysSheet;