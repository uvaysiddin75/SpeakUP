import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function slugUsername(login: string | null | undefined, email: string | null | undefined) {
  const base =
    (login || email?.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "user";
  return base;
}

const adapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...adapter,
    async createUser(data) {
      const email = data.email ?? `user_${Date.now()}@users.noreply.github.com`;
      let username = slugUsername(data.name, email);
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        username = `${username}_${Math.random().toString(36).slice(2, 6)}`;
      }

      return prisma.user.create({
        data: {
          email,
          emailVerified: data.emailVerified ?? null,
          name: data.name ?? null,
          image: data.image ?? null,
          avatarUrl: data.image ?? null,
          username,
          passwordHash: null,
          settings: {
            create: {
              language: "en",
              theme: "system",
            },
          },
        },
      });
    },
  },
  providers: [
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/en/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
});
