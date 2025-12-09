import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Landing() {
  const { login, sendPasswordReset, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await login(rememberMe);
      setLocation("/");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsResetting(true);
    try {
      await sendPasswordReset(resetEmail);
      toast({
        title: "Email sent!",
        description: "Check your inbox for a password reset link.",
      });
      setDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          Pourfoliolic
        </h1>
        <p className="text-muted-foreground">
          Your personal drink tasting journal
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <Button 
          size="lg" 
          data-testid="button-google-signin"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            data-testid="checkbox-remember-me"
          />
          <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
            Remember me
          </Label>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="text-sm" data-testid="button-forgot-password">
              Forgot password?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                data-testid="input-reset-email"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordReset} 
                disabled={isResetting}
                data-testid="button-send-reset"
              >
                {isResetting ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
