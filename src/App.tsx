
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import DefaultLayout from "./layouts/DefaultLayout";
import Dashboard from "./pages/Dashboard";
import Hosts from "./pages/Hosts";
import Profiles from "./pages/Profiles";
import Servers from "./pages/Servers";
import Discovery from "./pages/Discovery";
import Settings from "./pages/Settings";
import TrayPopup from "./pages/TrayPopup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="mcp-now-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/tray" element={<TrayPopup />} />
            <Route path="/" element={<DefaultLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="hosts" element={<Hosts />} />
              <Route path="profiles" element={<Profiles />} />
              <Route path="servers" element={<Servers />} />
              <Route path="discovery" element={<Discovery />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
