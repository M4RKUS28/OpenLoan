import { Outlet, ScrollRestoration } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
