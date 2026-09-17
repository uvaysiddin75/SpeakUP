import { PrismaClient } from "@prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is missing. Copy .env.example to .env");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection OK");
    console.log(`   URL host: ${safeHost(url)}`);
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error instanceof Error ? error.message : error);
    console.error("");
    console.error("Start PostgreSQL with:");
    console.error("  docker compose up -d");
    console.error("Then run:");
    console.error("  npx prisma db push");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function safeHost(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace("/", "")}`;
  } catch {
    return "(unparsed)";
  }
}

main();
