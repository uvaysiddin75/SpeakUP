import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon, hint, className }: StatCardProps) {
  return (
    <Card interactive className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="card-icon rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
