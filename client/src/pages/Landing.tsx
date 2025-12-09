import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wine, Star, Users, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          Libation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personal drink tasting journal. Log wines, beers, spirits, and cocktails with detailed tasting notes.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              Get Started
            </Button>
          </a>
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
