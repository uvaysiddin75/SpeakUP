"use client";

import { Modal } from "@/components/ui/modal";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";

type LevelCompleteModalProps = {
  open: boolean;
  onClose: () => void;
  levelCode: string;
  levelName?: string;
};

export function LevelCompleteModal({
  open,
  onClose,
  levelCode,
  levelName,
}: LevelCompleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`${levelCode} Completed 🎉`}>
      <div className="space-y-4 text-center">
        <CircularProgress value={100} label="Complete" className="mx-auto" />
        <div>
          <p className="font-display text-xl font-bold">
            {levelName ?? levelCode} completed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Achievement unlocked — keep going to the next level.
          </p>
        </div>
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary animate-scale-in">
          🏆 Achievement Unlocked!
        </div>
        <Button className="w-full" onClick={onClose}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
