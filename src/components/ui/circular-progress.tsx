import { cn } from "@/lib/utils";

type CircularProgressProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  light?: boolean;
};

export function CircularProgress({
  value,
  size = 112,
  stroke = 10,
  label,
  className,
  light = false,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% ${label ?? "progress"}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={light ? "rgb(255 255 255 / 0.25)" : "var(--muted)"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={light ? "#ffffff" : "var(--primary)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-display text-xl font-bold tabular-nums",
            light && "text-white",
          )}
        >
          {clamped}%
        </span>
        {label ? (
          <span
            className={cn(
              "text-[10px]",
              light ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
