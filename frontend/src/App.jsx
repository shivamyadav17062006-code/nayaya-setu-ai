import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Rights from "@/pages/Rights";
import RightsCategory from "@/pages/RightsCategory";
import Navigator from "@/pages/Navigator";
import AidFinder from "@/pages/AidFinder";
import Eligibility from "@/pages/Eligibility";
import NotFound from "@/pages/NotFound";
function AppRoutes() {
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";
  return <div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1"><AnimatePresence mode="wait"><Routes location={location} key={location.pathname}><Route path="/" element={<Home />} /><Route path="/chat" element={<Chat />} /><Route path="/rights" element={<Rights />} /><Route path="/rights/:categoryId" element={<RightsCategory />} /><Route path="/navigator" element={<Navigator />} /><Route path="/aid-finder" element={<AidFinder />} /><Route path="/eligibility" element={<Eligibility />} /><Route path="*" element={<NotFound />} /></Routes></AnimatePresence></main>{!isChatPage && <Footer />}</div>;
}
export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
