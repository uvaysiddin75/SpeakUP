"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUxOptional } from "@/components/providers/ux-provider";

type Props = {
  subtopicId: string;
  alreadyDone?: boolean;
  guestMode?: boolean;
};

export function CompleteLessonButton({
  subtopicId,
  alreadyDone = false,
  guestMode = false,
}: Props) {
  const router = useRouter();
  const ux = useUxOptional();
  const [done, setDone] = useState(alreadyDone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (guestMode) {
    return (
      <Button variant="outline" disabled>
        Sign in to save lesson progress
      </Button>
    );
  }

  if (done) {
    return (
      <Button variant="success" disabled className="animate-check-pop">
        <Check className="h-4 w-4" />
        Lesson completed ✓
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        loading={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete_lesson",
                subtopicId,
              }),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
              setError(data.error ?? "Could not complete lesson");
              return;
            }
            setDone(true);
            ux?.toast({
              title: "Lesson completed ✓",
              tone: "success",
              icon: "success",
            });
            router.refresh();
          } catch {
            setError("Network error");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Complete lesson
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
