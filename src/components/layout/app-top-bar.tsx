"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Menu, Search, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { SearchBar } from "@/components/ui/search-bar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export function AppTopBar() {
  const t = useTranslations("nav");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "glass-header sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 transition-shadow md:px-6",
          scrolled ? "border-border shadow-[var(--shadow)]" : "border-border/60",
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo className="lg:hidden" />
          <nav className="ml-2 hidden items-center gap-1 xl:flex" aria-label="Quick links">
            {[
              { href: "/dashboard", label: "Home" },
              { href: "/courses", label: "Learn" },
              { href: "/vocabulary", label: "Vocabulary" },
              { href: "/reading", label: "Reading" },
              { href: "/listening", label: "Listening" },
              { href: "/speaking", label: "Speaking" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden max-w-md flex-1 md:block">
          <SearchBar placeholder={t("searchPlaceholder")} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("search")}
            onClick={() => setSearchOpen((prev) => !prev)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
          </Button>
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
          <ThemeSwitcher className="hidden sm:inline-flex" />
          <Button asChild variant="outline" size="icon" className="rounded-full">
            <Link href="/profile" aria-label={t("profile")}>
              <UserRound className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {searchOpen ? (
        <div className="border-b border-border bg-background px-4 py-3 md:hidden">
          <SearchBar placeholder={t("searchPlaceholder")} />
        </div>
      ) : null}

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>
    </>
  );
}
