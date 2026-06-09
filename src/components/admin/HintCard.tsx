import { ReactNode, useEffect, useState } from "react";
import { ChevronDown, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  children: ReactNode;
  storageKey?: string;
  className?: string;
  /** На мобиле автоматически сворачиваем */
  collapsibleOnMobile?: boolean;
};

/**
 * Учебная плашка-подсказка. Показывается под заголовком страницы или
 * крупного блока, объясняет назначение раздела.
 * - На мобильных умеет сворачиваться в одну строку (тап разворачивает).
 * - При наличии storageKey пользователь может закрыть навсегда (крестик).
 */
const HintCard = ({
  title = "Подсказка",
  children,
  storageKey,
  className,
  collapsibleOnMobile = true,
}: Props) => {
  const dismissKey = storageKey ? `hint_dismissed_${storageKey}` : null;
  const openKey = storageKey ? `hint_open_${storageKey}` : null;

  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (dismissKey) {
      try {
        setDismissed(localStorage.getItem(dismissKey) === "1");
      } catch {
        /* ignore */
      }
    }
    if (openKey) {
      try {
        const v = localStorage.getItem(openKey);
        if (v != null) setOpen(v === "1");
      } catch {
        /* ignore */
      }
    }
  }, [dismissKey, openKey]);

  if (dismissed) return null;

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (openKey) {
        try {
          localStorage.setItem(openKey, next ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissKey) {
      try {
        localStorage.setItem(dismissKey, "1");
      } catch {
        /* ignore */
      }
    }
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/25 bg-primary/5 text-sm",
        "transition-colors hover:border-primary/40",
        className,
      )}
      role="note"
      aria-label={title}
    >
      <button
        type="button"
        onClick={collapsibleOnMobile ? toggle : undefined}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 text-left",
          collapsibleOnMobile ? "cursor-pointer sm:cursor-default" : "cursor-default",
        )}
      >
        <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Lightbulb className="h-4 w-4" />
        </span>
        <span className="font-semibold text-primary flex-1 min-w-0 truncate">
          {title}
        </span>
        {collapsibleOnMobile && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-primary/70 transition-transform sm:hidden",
              open && "rotate-180",
            )}
          />
        )}
        {storageKey && (
          <span
            role="button"
            tabIndex={0}
            onClick={dismiss}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") dismiss(e as unknown as React.MouseEvent);
            }}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 shrink-0"
            aria-label="Скрыть подсказку"
            title="Скрыть подсказку"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <div
        className={cn(
          "px-3 pb-3 sm:px-4 sm:pb-4 pl-[52px] sm:pl-[60px] text-muted-foreground leading-relaxed",
          collapsibleOnMobile && !open && "hidden sm:block",
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default HintCard;