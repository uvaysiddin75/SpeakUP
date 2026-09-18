import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface LevelCardProps {
  code: string;
  name: string;
  description: string;
  topicsLabel: string;
  href: string;
  progress?: number;
  className?: string;
}

export function LevelCard({
  code,
  name,
  description,
  topicsLabel,
  href,
  progress = 0,
  className,
}: LevelCardProps) {
  return (
    <Link href={href} className={cn("group block h-full", className)}>
      <Card
        interactive
        className="h-full transition-all duration-200 hover:-translate-y-1.5 hover:border-primary/40"
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="primary" className="card-icon">
              {code}
            </Badge>
            <span className="text-xs text-muted-foreground">{topicsLabel}</span>
          </div>
          <CardTitle className="mt-2 transition-colors group-hover:text-primary">
            {name}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={progress} label="Progress" />
        </CardContent>
      </Card>
    </Link>
  );
}
