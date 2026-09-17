import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  inverted?: boolean;
}

export function Logo({ className, showText = true, inverted = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="SpeakUp home"
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl shadow-[var(--shadow)]",
          inverted
            ? "bg-white/15 text-white"
            : "bg-gradient-to-br from-primary to-secondary text-primary-foreground",
        )}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        <span className="sr-only">SpeakUp</span>
      </span>
      {showText ? (
        <span
          className={cn(
            "font-display text-lg font-extrabold tracking-tight",
            inverted ? "text-white" : "text-foreground",
          )}
        >
          Speak
          <span className={inverted ? "text-indigo-200" : "text-primary"}>Up</span>
        </span>
      ) : null}
    </Link>
  );
}
