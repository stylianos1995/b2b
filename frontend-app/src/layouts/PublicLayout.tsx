import { Outlet } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="rounded-b-2xl border-b border-slate-200/60 bg-white/80 shadow-soft backdrop-blur-xl">
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
