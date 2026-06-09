import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

type Props = {
  rows?: number;
  cols?: number;
  className?: string;
};

/**
 * Lightweight skeleton placeholder for admin tables.
 * Replaces plain "Загрузка..." strings with shimmering rows.
 */
const TableSkeleton = ({ rows = 8, cols = 5, className }: Props) => {
  return (
    <Card className={className}>
      <div className="divide-y divide-border/60">
        <div className="grid gap-3 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-2/3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-4 py-3.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-4"
                style={{ width: `${55 + ((r * 13 + c * 23) % 40)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TableSkeleton;