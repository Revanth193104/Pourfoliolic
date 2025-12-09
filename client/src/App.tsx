import { Switch, Route } from "wouter";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import Home from "@/pages/Home";
import LogDrink from "@/pages/LogDrink";
import Cellar from "@/pages/Cellar";
import Discovery from "@/pages/Discovery";
import Profile from "@/pages/Profile";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
          <PageTransition>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/explore" component={Discovery} />
              <Route component={Landing} />
            </Switch>
          </PageTransition>
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans antialiased">
      <Sidebar />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
          <PageTransition>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/log" component={LogDrink} />
              <Route path="/cellar" component={Cellar} />
              <Route path="/explore" component={Discovery} />
              <Route path="/profile" component={Profile} />
              <Route component={NotFound} />
            </Switch>
          </PageTransition>
        </main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
