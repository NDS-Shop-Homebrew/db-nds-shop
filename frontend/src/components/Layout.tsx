import { Outlet } from "react-router-dom";
import { NavBar } from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";

export default function Layout() {
  return (
    <div className="scanlines min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}