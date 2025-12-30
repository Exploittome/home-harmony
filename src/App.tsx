import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Main from "./pages/Main";
import Subscription from "./pages/Subscription";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import UserAgreement from "./pages/UserAgreement";
import Saved from "./pages/Saved";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const searchParams = new URLSearchParams(location.search);

    // Check for recovery in hash, search params, or PKCE code
    const isRecoveryHash = hashParams.get("type") === "recovery";
    const isRecoverySearch = searchParams.get("type") === "recovery";
    const hasCode = searchParams.has("code"); // PKCE flow uses code param

    const isRecovery = isRecoveryHash || isRecoverySearch || hasCode;

    if (!isRecovery) return;

    const hasResetMode = searchParams.get("mode") === "reset-password";

    if (location.pathname !== "/auth" || !hasResetMode) {
      const nextSearch = new URLSearchParams(location.search);
      nextSearch.set("mode", "reset-password");
      // Preserve type if present
      if (isRecoveryHash || isRecoverySearch) {
        nextSearch.set("type", "recovery");
      }

      navigate(
        {
          pathname: "/auth",
          search: `?${nextSearch.toString()}`,
          hash: location.hash,
        },
        { replace: true }
      );
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RecoveryRedirect />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/main" element={<Main />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/user-agreement" element={<UserAgreement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
