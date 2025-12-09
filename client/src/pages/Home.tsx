import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Wine, Star, Beer, Martini, GlassWater } from "lucide-react";
import { Link } from "wouter";
import type { Drink } from "@shared/schema";

interface Stats {
  totalDrinks: number;
  averageRating: number;
  totalSpending: number;
  favoriteType: string | null;
  drinksByType: Record<string, number>;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDrinks, setRecentDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, drinksRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/drinks?sortBy=date&sortOrder=desc")
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (drinksRes.ok) {
          const drinksData = await drinksRes.json();
          setRecentDrinks(drinksData.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "wine":
        return <Wine className="h-5 w-5" />;
      case "beer":
        return <Beer className="h-5 w-5" />;
      case "spirit":
        return <Martini className="h-5 w-5" />;
      case "cocktail":
        return <GlassWater className="h-5 w-5" />;
      default:
        return <Wine className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatType = (type: string | null) => {
    if (!type) return "N/A";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to your tasting journal.</p>
        </div>
        <Link href="/log">
          <Button size="lg" className="gap-2" data-testid="button-log-drink">
            <Plus className="h-4 w-4" />
            Log a Drink
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tastings</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tastings">
              {loading ? "..." : stats?.totalDrinks || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-average-rating">
              {loading ? "..." : stats?.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-favorite-type">
              {loading ? "..." : formatType(stats?.favoriteType || null)}
            </div>
            <p className="text-xs text-muted-foreground">Most logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <span className="text-lg font-bold text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-spent">
              {loading ? "..." : stats?.totalSpending ? formatCurrency(stats.totalSpending) : "$0"}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Tastings</CardTitle>
            <CardDescription>
              Your latest logged drinks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8" data-testid="text-loading">
                Loading...
              </div>
            ) : recentDrinks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8" data-testid="text-empty-recent">
                <p>No tastings yet.</p>
                <Link href="/log">
                  <Button variant="outline" className="mt-4" data-testid="button-log-first">
                    Log Your First Drink
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {recentDrinks.map((drink, index) => (
                  <div key={drink.id} className="flex items-center" data-testid={`card-recent-drink-${index}`}>
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {drink.imageUrl ? (
                        <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                      ) : (
                        getTypeIcon(drink.type)
                      )}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid={`text-recent-name-${index}`}>
                        {drink.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-recent-maker-${index}`}>
                        {drink.maker} • {formatType(drink.type)}
                      </p>
                    </div>
                    <div className="ml-auto font-medium" data-testid={`text-recent-rating-${index}`}>
                      {drink.rating}/5
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>
              Based on your collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : stats && stats.totalDrinks > 0 ? (
              <div className="space-y-4">
                {stats.drinksByType && Object.keys(stats.drinksByType).length > 0 && (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4" data-testid="card-insight-collection">
                    <h4 className="font-semibold">Your Collection</h4>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      {Object.entries(stats.drinksByType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{formatType(type)}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {stats.averageRating >= 4.0 && (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4" data-testid="card-insight-taste">
                    <h4 className="font-semibold">Excellent Taste!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your average rating of {stats.averageRating.toFixed(1)}/5 shows you have high standards.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8" data-testid="text-empty-insights">
                <p>Start logging drinks to see insights!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
