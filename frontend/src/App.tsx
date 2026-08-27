import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import GameList from "./pages/GameList";
import About from "./pages/About";
import Docs from "./pages/Docs";
import GameDetail from "./pages/GameDetail";
import Favorites from "./pages/Favorites";
import Tutorial from "./pages/Tutorial";
import DMCA from "./pages/DMCA";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RequestGame from "./pages/RequestGame";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/game-list" element={<GameList />} />
        <Route path="/game/:slug" element={<GameDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/about" element={<About />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/request" element={<RequestGame />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/dmca" element={<DMCA />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}