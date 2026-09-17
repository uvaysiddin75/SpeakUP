"use client";

import { useTranslations } from "next-intl";
import {
  BookMarked,
  BookOpen,
  ChartColumnIncreasing,
  ClipboardCheck,
  Headphones,
  Languages,
  LayoutDashboard,
  Lock,
  Mic,
  PencilRuler,
  PenLine,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { APP_NAV } from "@/lib/constants";
import { LEVEL_META } from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  PencilRuler,
  Languages,
  BookMarked,
  Headphones,
  PenLine,
  Mic,
  ClipboardCheck,
  ChartColumnIncreasing,
  User,
  Settings,
  Shield,
};

const LEARN_LINKS = [
  { href: "/courses", key: "courses", icon: BookOpen },
  { href: "/grammar", key: "grammar", icon: PencilRuler },
  { href: "/vocabulary", key: "vocabulary", icon: Languages },
  { href: "/reading", key: "reading", icon: BookMarked },
  { href: "/listening", key: "listening", icon: Headphones },
  { href: "/speaking", key: "speaking", icon: Mic },
] as const;

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground",
        className,
      )}
      aria-label="App sidebar"
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <Logo inverted />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Overview
          </p>
          {APP_NAV.filter((item) =>
            ["/dashboard", "/progress", "/tests", "/profile", "/settings", "/admin"].includes(
              item.href,
            ),
          ).map((item) => {
            const Icon = icons[item.icon] ?? BookOpen;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[var(--sidebar-active)] text-white shadow-[var(--shadow)]"
                    : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Learn
          </p>
          {LEARN_LINKS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[var(--sidebar-active)] text-white shadow-[var(--shadow)]"
                    : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Levels
          </p>
          {LEVEL_META.map((level, index) => {
            const href = `/courses/${level.slug}`;
            const active = pathname.startsWith(href);
            const locked = false;
            return (
              <Link
                key={level.code}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-white/15 text-white"
                    : "text-sidebar-foreground/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold",
                      active ? "bg-primary text-white" : "bg-white/10",
                    )}
                  >
                    {level.code}
                  </span>
                  {level.name}
                </span>
                {locked ? (
                  <Lock className="h-3.5 w-3.5 opacity-60" aria-label="Locked" />
                ) : index === 0 ? (
                  <span className="text-[10px] text-success">→</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
