import { createHash } from "crypto";

/** Deterministic IDs matching prisma/seed.ts for offline quiz links. */
export function stableId(prefix: string, key: string): string {
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}
