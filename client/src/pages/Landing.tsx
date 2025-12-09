import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wine, Star, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Landing() {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      await login();
      setLocation("/");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          Pourfoliolic
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personal drink tasting journal. Log wines, beers, spirits, and cocktails with detailed tasting notes.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button 
            size="lg" 
            data-testid="button-get-started"
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
          <a href="/explore">
            <Button size="lg" variant="outline" data-testid="button-explore">
              Explore Drinks
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wine className="h-10 w-10 mx-auto text-amber-500 mb-4" />
            <h3 className="font-semibold mb-2">Track Tastings</h3>
            <p className="text-sm text-muted-foreground">
              Log wines, beers, spirits, and cocktails with detailed notes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-10 w-10 mx-auto text-amber-500 mb-4" />
            <h3 className="font-semibold mb-2">Rate & Review</h3>
            <p className="text-sm text-muted-foreground">
              Capture nose, palate, and finish for each tasting.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-amber-500 mb-4" />
            <h3 className="font-semibold mb-2">Build Your Cellar</h3>
            <p className="text-sm text-muted-foreground">
              Create a searchable archive of all your tastings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-10 w-10 mx-auto text-amber-500 mb-4" />
            <h3 className="font-semibold mb-2">Share & Discover</h3>
            <p className="text-sm text-muted-foreground">
              Explore what others are tasting and share your favorites.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-8">
        <p className="text-muted-foreground">
          Join the community of discerning palates.
        </p>
      </div>
    </div>
  );
}
