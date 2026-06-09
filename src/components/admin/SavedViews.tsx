import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bookmark, BookmarkPlus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

type View<T> = { id: string; name: string; value: T; createdAt: string };

type Props<T> = {
  storageKey: string;
  current: T;
  onApply: (value: T) => void;
  // Optional: returns true if `current` matches `view.value` (used to mark active)
  isEqual?: (a: T, b: T) => boolean;
};

function defaultEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function SavedViews<T>({ storageKey, current, onApply, isEqual = defaultEqual }: Props<T>) {
  const [views, setViews] = useState<View<T>[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setViews(raw ? JSON.parse(raw) : []);
    } catch {
      setViews([]);
    }
  }, [storageKey]);

  const persist = (next: View<T>[]) => {
    setViews(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const save = () => {
    if (!name.trim()) return;
    const v: View<T> = {
      id: crypto.randomUUID(),
      name: name.trim(),
      value: current,
      createdAt: new Date().toISOString(),
    };
    persist([...views, v]);
    setName("");
    setOpen(false);
    toast.success(`Представление «${v.name}» сохранено`);
  };

  const remove = (id: string) => persist(views.filter((v) => v.id !== id));

  const activeId = views.find((v) => isEqual(v.value, current))?.id;

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            {activeId ? views.find((v) => v.id === activeId)?.name : "Представления"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Сохранённые представления</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              Пока нет сохранённых
            </div>
          ) : (
            views.map((v) => (
              <DropdownMenuItem
                key={v.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onApply(v.value);
                }}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 truncate">
                  {v.id === activeId && <Check className="h-3.5 w-3.5 text-primary" />}
                  {v.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v.id);
                  }}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Сохранить текущие фильтры">
            <BookmarkPlus className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить представление</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Например: Мои горящие"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <DialogFooter>
            <Button onClick={save} disabled={!name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SavedViews;