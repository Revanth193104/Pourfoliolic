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

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-900/90 via-background to-orange-900/30 cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onComplete}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      
      <motion.div
        className="text-center px-8 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="text-8xl mb-8"
          animate={{ 
            rotate: [0, -15, 15, -10, 10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 1, delay: 0.2, repeat: Infinity, repeatDelay: 2 }}
        >
          🥂
        </motion.div>
        {userName && (
          <motion.p
            className="text-xl text-white/80 mb-3 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back, {userName}!
          </motion.p>
        )}
        <motion.h1
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          data-testid="text-intro-message"
        >
          {introMessage}
        </motion.h1>
        <motion.div
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Tap to continue</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10 text-foreground font-sans antialiased relative">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <main className="container mx-auto p-4 md:p-8 max-w-7xl relative z-10">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/5 text-foreground flex font-sans antialiased">
      <Sidebar />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/3 via-transparent to-transparent pointer-events-none" />
        <main className="container mx-auto p-4 md:p-8 max-w-7xl relative z-10">
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
