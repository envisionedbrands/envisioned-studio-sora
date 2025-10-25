import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/i18n/config";
import CookieConsent from "./components/CookieConsent";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Create from "./pages/Create";
import CreatePro from "./pages/CreatePro";
import Storyboard from "./pages/Storyboard";
import Library from "./pages/Library";
import Account from "./pages/Account";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import FailedVideos from "./pages/FailedVideos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create" element={<Create />} />
          <Route path="/create-pro" element={<CreatePro />} />
          <Route path="/storyboard" element={<Storyboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/account" element={<Account />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/failed-videos" element={<FailedVideos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
