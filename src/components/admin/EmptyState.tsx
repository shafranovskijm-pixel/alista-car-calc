import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className ?? ""}`}>
    {Icon && (
      <div className="mb-3 rounded-full bg-secondary/60 p-3 ring-1 ring-border">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
    )}
    <div className="text-sm font-medium">{title}</div>
    {description && (
      <div className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</div>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;