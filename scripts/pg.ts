import { spawnSync } from "node:child_process";
import path from "node:path";

const PG_HOME = process.env.SPEAKUP_PG_HOME || "D:\\speakup-pg";
const BIN = path.join(PG_HOME, "pgsql", "bin", "pg_ctl.exe");
const DATA = path.join(PG_HOME, "data");
const LOG = path.join(PG_HOME, "logfile.txt");

const action = process.argv[2] || "status";

function run(args: string[]) {
  const result = spawnSync(BIN, args, { encoding: "utf8", stdio: "inherit" });
  process.exit(result.status ?? 1);
}

if (action === "start") {
  run(["-D", DATA, "-l", LOG, "start"]);
} else if (action === "stop") {
  run(["-D", DATA, "stop", "-m", "fast"]);
} else if (action === "status") {
  run(["-D", DATA, "status"]);
} else {
  console.log("Usage: npx tsx scripts/pg.ts [start|stop|status]");
  process.exit(1);
}
