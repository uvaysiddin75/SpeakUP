import { setRequestLocale } from "next-intl/server";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTransition } from "@/components/motion/page-transition";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="app-shell-bg flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-8 lg:px-8">
          <PageTransition className="mx-auto w-full max-w-6xl">
            {children}
          </PageTransition>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
