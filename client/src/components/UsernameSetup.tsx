import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";

interface UsernameSetupProps {
  open: boolean;
  onComplete: () => void;
}

export default function UsernameSetup({ open, onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setError("");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setIsAvailable(null);
      setError("Only letters, numbers, and underscores (3-20 characters)");
      return;
    }

    setError("");
    setIsChecking(true);

    const debounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setIsAvailable(data.available);
        }
      } catch (e) {
        console.error("Failed to check username:", e);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/username/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        onComplete();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to set username");
      }
    } catch (e) {
      setError("Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose your username</DialogTitle>
          <DialogDescription>
            Pick a unique username so others can find and follow you in the community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                data-testid="input-username"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="pl-8 pr-10"
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                {!isChecking && isAvailable === false && <X className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!isChecking && isAvailable === false && (
              <p className="text-sm text-red-500">This username is already taken</p>
            )}
            {!isChecking && isAvailable === true && (
              <p className="text-sm text-green-500">Username is available!</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!isAvailable || isSubmitting}
            data-testid="button-set-username"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <Button 
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onComplete}
            data-testid="button-skip-username"
          >
            Skip for now
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
