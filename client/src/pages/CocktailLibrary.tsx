import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Martini, GlassWater, Search, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Cocktail {
  id: string;
  name: string;
  category: string;
  type: string;
  imageUrl: string;
  instructions: string;
  glass: string;
  ingredients: string[];
  measures: string[];
  isAlcoholic: boolean;
}

export default function CocktailLibrary() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [cocktailSearch, setCocktailSearch] = useState("");
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const nonAlcoholicCategories = ["Coffee / Tea", "Cocoa", "Soft Drink", "Other / Unknown"];
  
  useEffect(() => {
    fetch("/api/cocktails/categories")
      .then(res => res.json())
      .then((cats: string[]) => {
        const alcoholicOnly = cats.filter(cat => !nonAlcoholicCategories.includes(cat));
        setCategories(alcoholicOnly);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchCocktails = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cocktailSearch) params.set("search", cocktailSearch);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const response = await fetch(`/api/cocktails?${params}`);
        if (response.ok) {
          const data = await response.json();
          const filtered = data.filter((c: Cocktail) => c.isAlcoholic !== false);
          setCocktails(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch cocktails:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCocktails, 300);
    return () => clearTimeout(debounce);
  }, [cocktailSearch, selectedCategory]);

  const fetchRandomCocktail = async () => {
    try {
      const response = await fetch("/api/cocktails/random");
      if (response.ok) {
        const data = await response.json();
        setSelectedCocktail(data);
      }
    } catch (error) {
      console.error("Failed to fetch random cocktail:", error);
    }
  };

  const fetchCocktailDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/cocktails/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCocktail(data);
      }
    } catch (error) {
      console.error("Failed to fetch cocktail details:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent" data-testid="text-cocktail-library-title">
          Cocktail Library
        </h2>
        <p className="text-muted-foreground">Discover classic and creative cocktail recipes.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-cocktail-search"
            placeholder="Search cocktails..."
            value={cocktailSearch}
            onChange={(e) => setCocktailSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-cocktail-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchRandomCocktail} data-testid="button-random-cocktail">
          <Shuffle className="h-4 w-4 mr-2" />
          Random
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="text-cocktails-loading">
          Loading cocktails...
        </div>
      ) : cocktails.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Martini className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold" data-testid="text-cocktails-empty">No cocktails found</h3>
            <p className="text-muted-foreground mt-2">
              Try a different search or category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cocktails.map((cocktail) => (
            <Card 
              key={cocktail.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
              onClick={() => fetchCocktailDetails(cocktail.id)}
              data-testid={`card-cocktail-${cocktail.id}`}
            >
              <div className="aspect-square overflow-hidden">
                {cocktail.imageUrl ? (
                  <img 
                    src={cocktail.imageUrl} 
                    alt={cocktail.name} 
                    className="h-full w-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <GlassWater className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate" data-testid={`text-cocktail-name-${cocktail.id}`}>
                  {cocktail.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{cocktail.category || "Cocktail"}</Badge>
                  {cocktail.isAlcoholic !== undefined && (
                    <Badge variant={cocktail.isAlcoholic ? "default" : "outline"}>
                      {cocktail.isAlcoholic ? "Alcoholic" : "Non-Alcoholic"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedCocktail} onOpenChange={() => setSelectedCocktail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCocktail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl" data-testid="text-cocktail-detail-name">
                  {selectedCocktail.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {selectedCocktail.imageUrl && (
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img 
                      src={selectedCocktail.imageUrl} 
                      alt={selectedCocktail.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedCocktail.category}</Badge>
                  {selectedCocktail.glass && (
                    <Badge variant="outline">Serve in: {selectedCocktail.glass}</Badge>
                  )}
                  <Badge variant={selectedCocktail.isAlcoholic ? "default" : "outline"}>
                    {selectedCocktail.isAlcoholic ? "Alcoholic" : "Non-Alcoholic"}
                  </Badge>
                </div>

                {selectedCocktail.ingredients && selectedCocktail.ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <ul className="space-y-1">
                      {selectedCocktail.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm">
                          {selectedCocktail.measures?.[i] && (
                            <span className="text-muted-foreground">{selectedCocktail.measures[i]} </span>
                          )}
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCocktail.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <p className="text-sm text-muted-foreground">{selectedCocktail.instructions}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
