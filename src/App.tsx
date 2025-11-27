import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { publicRoutes, authRoutes, protectedRoutes, adminRoutes, fallbackRoute } from "@/config/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = React.useState(true);

  const handleDismissPWAInstall = () => {
    setShowPWAInstallPrompt(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <CheckoutProvider>
                <Routes>
                  {/* Public routes */}
                  {publicRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  
                  {/* Authentication routes with error recovery */}
                  {authRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  
                  {/* Protected routes with consistent error boundaries */}
                  {protectedRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  
                  {/* Admin panel routes (separate authentication) */}
                  {adminRoutes.map((route) => (
                    route.children ? (
                      <Route key={route.path} path={route.path} element={route.element}>
                        {route.children.map((child: { path?: string; element: React.ReactNode; index?: boolean }, idx: number) => (
                          child.index ? (
                            <Route key="index" index element={child.element} />
                          ) : (
                            <Route key={child.path || idx} path={child.path} element={child.element} />
                          )
                        ))}
                      </Route>
                    ) : (
                      <Route key={route.path} path={route.path} element={route.element} />
                    )
                  ))}
                  
                  {/* Catch-all route */}
                  <Route path={fallbackRoute.path} element={fallbackRoute.element} />
                </Routes>
              </CheckoutProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
        {showPWAInstallPrompt && (
          <PWAInstallPrompt onDismiss={handleDismissPWAInstall} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
