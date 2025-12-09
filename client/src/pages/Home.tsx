
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Wine, Star } from "lucide-react";
import { Link } from "wouter";
import { mockDrinks } from "@/lib/mockData";

export default function Home() {
  const recentDrinks = mockDrinks.slice(0, 3);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to your tasting journal.</p>
        </div>
        <Link href="/log">
          <Button size="lg" className="gap-2">
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
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">Average score this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Style</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Islay Scotch</div>
            <p className="text-xs text-muted-foreground">Most logged category</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
             <span className="text-lg font-bold text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$420</div>
            <p className="text-xs text-muted-foreground">Spent this month</p>
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
            <div className="space-y-8">
              {recentDrinks.map((drink) => (
                <div key={drink.id} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                     {drink.imageUrl ? <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" /> : <Wine className="h-5 w-5" />}
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{drink.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {drink.maker} • {drink.type}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {drink.rating}/5
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Discovery</CardTitle>
            <CardDescription>
              Based on your taste.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h4 className="font-semibold">Try: Ardbeg Uigeadail</h4>
                  <p className="text-sm text-muted-foreground mt-1">Since you love Lagavulin 16, this high-proof Islay malt offers similar peat intensity with sherry sweetness.</p>
               </div>
               <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h4 className="font-semibold">Try: Ridge Geyserville</h4>
                  <p className="text-sm text-muted-foreground mt-1">A robust Zinfandel blend that matches your preference for structured reds.</p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
