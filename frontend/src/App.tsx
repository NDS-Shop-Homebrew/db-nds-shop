import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import GameList from "./pages/GameList";
import About from "./pages/About";
import GameDetail from "./pages/GameDetail";
import DMCA from "./pages/DMCA";
import PrivacyPolicy from "./pages/PrivacyPolicy";

export default function App() {
  return (
    <Routes>
      {/* Routes avec Layout (Navbar + Footer) */}
      <Route element={<Layout />}>
        {/* Routes publiques */}
        <Route index element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/game-list" element={<GameList />} />
        <Route path="/game/:slug" element={<GameDetail />} />
        <Route path="/about" element={<About />} />

        {/* Routes légales */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/dmca" element={<DMCA />} />
      </Route>

      {/* Route 404 hors Layout */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
