import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { BreadcrumbItem } from "@/types/curriculum";
import { cn } from "@/lib/utils";

interface CourseBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function CourseBreadcrumbs({ items, className }: CourseBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/70"
                aria-hidden
              />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? "font-medium text-foreground" : "text-muted-foreground",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
