import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export function PublicLayout() {
  return (
    <>
      <div className="mesh-bg" />
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-150px)] max-w-7xl px-3 py-6 sm:px-4 sm:py-8 md:px-6">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
