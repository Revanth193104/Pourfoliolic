import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import Home from "@/pages/Home";
import LogDrink from "@/pages/LogDrink";
import EditDrink from "@/pages/EditDrink";
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
import { motion, AnimatePresence } from "framer-motion";

const INTRO_MESSAGES = [
  "Look who's getting drunk again! 🍷",
  "Back for more, are we? 🍺",
  "The liver called... it's filing a complaint 😅",
  "Another day, another drink to log! 🥂",
  "Your taste buds await, connoisseur! 🍸",
  "Time to pour some knowledge! 🥃",
  "Cheers to another tasting session! 🍾",
];

function IntroSplash({ onComplete, userName }: { onComplete: () => void; userName?: string }) {
  const [introMessage] = useState(() => 
    INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onComplete}
    >
      <motion.div
        className="text-center px-8 cursor-pointer"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="text-7xl mb-6"
          animate={{ 
            rotate: [0, -15, 15, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          🥂
        </motion.div>
        {userName && (
          <motion.p
            className="text-lg text-muted-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back, {userName}!
          </motion.p>
        )}
        <motion.h1
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          data-testid="text-intro-message"
        >
          {introMessage}
        </motion.h1>
        <motion.p
          className="text-sm text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tap anywhere to skip
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

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
              <Route path="/edit/:id" component={EditDrink} />
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

function AppWithIntro() {
  const { isAuthenticated, isLoading, firebaseUser, user } = useAuth();
  const [showIntro, setShowIntro] = useState(false);
  const [wasLoggedIn, setWasLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const isLoggedIn = !!firebaseUser;
      if (wasLoggedIn === false && isLoggedIn) {
        setShowIntro(true);
      }
      setWasLoggedIn(isLoggedIn);
    }
  }, [firebaseUser, isLoading, wasLoggedIn]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroSplash onComplete={handleIntroComplete} userName={user?.firstName || undefined} />}
      </AnimatePresence>
      <AppLayout />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppWithIntro />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
