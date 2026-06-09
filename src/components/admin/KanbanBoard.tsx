import { ReactNode, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export type KanbanColumn<TKey extends string> = {
  key: TKey;
  label: string;
  colorClass?: string;
  accent?: string;
};

export type KanbanItem = { id: string };

type Props<TKey extends string, T extends KanbanItem> = {
  columns: KanbanColumn<TKey>[];
  items: T[];
  groupKey: (item: T) => TKey;
  renderCard: (item: T, opts: { isDragging?: boolean }) => ReactNode;
  onMove: (item: T, to: TKey) => void;
};

export function KanbanBoard<TKey extends string, T extends KanbanItem>({
  columns,
  items,
  groupKey,
  renderCard,
  onMove,
}: Props<TKey, T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  const grouped = columns.reduce(
    (acc, c) => {
      acc[c.key] = [];
      return acc;
    },
    {} as Record<TKey, T[]>,
  );
  items.forEach((it) => {
    const k = groupKey(it);
    if (grouped[k]) grouped[k].push(it);
  });

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overKey = e.over?.id as TKey | undefined;
    if (!overKey) return;
    const item = items.find((i) => i.id === String(e.active.id));
    if (!item) return;
    if (groupKey(item) === overKey) return;
    onMove(item, overKey);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="overflow-x-auto pb-3 -mx-1 px-1">
        <div className="flex gap-3 min-w-max">
          {columns.map((col) => (
            <Column
              key={col.key}
              col={col}
              items={grouped[col.key]}
              renderCard={renderCard}
              isDragging={!!activeId}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {active ? <div className="rotate-2 opacity-95">{renderCard(active, { isDragging: true })}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<TKey extends string, T extends KanbanItem>({
  col,
  items,
  renderCard,
  isDragging,
}: {
  col: KanbanColumn<TKey>;
  items: T[];
  renderCard: (item: T, opts: { isDragging?: boolean }) => ReactNode;
  isDragging: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-xl border bg-card/30 backdrop-blur-sm transition-colors ${
        isOver
          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
          : isDragging
          ? "border-border/40 border-dashed"
          : "border-border/50"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          {col.accent && <span className={`h-2 w-2 rounded-full ${col.accent}`} />}
          <span className={`text-xs font-medium uppercase tracking-wide ${col.colorClass ?? ""}`}>
            {col.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[80px]">
        {items.map((it) => (
          <DraggableCard key={it.id} id={it.id}>
            {renderCard(it, {})}
          </DraggableCard>
        ))}
        {items.length === 0 && (
          <div className="text-[11px] text-muted-foreground/60 text-center py-4 select-none">
            Перетащите сюда
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing touch-none ${isDragging ? "opacity-30" : ""}`}
    >
      {children}
    </div>
  );
}