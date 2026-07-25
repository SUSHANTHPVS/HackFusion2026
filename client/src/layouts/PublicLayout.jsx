import { Outlet } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export function PublicLayout() {
  return (
    <>
      <div className="mesh-bg" />
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-150px)] max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
