import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** tailwind bg class for the dot, e.g. "bg-emerald-400" */
  dot: string;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Unified status pill used across CRM (leads, deals, tasks, etc.)
 * Renders a coloured dot + label in a subtle bordered chip.
 */
const StatusBadge = ({ label, dot, className, size = "sm" }: Props) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 font-medium text-foreground/90 whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      <span className="truncate">{label}</span>
    </span>
  );
};

export default StatusBadge;