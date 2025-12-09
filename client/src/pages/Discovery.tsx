import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wine, Beer, Martini, GlassWater, Star, Search, Users, Sparkles, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Drink } from "@shared/schema";

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

export default function Discovery() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [cocktailsLoading, setCocktailsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cocktailSearch, setCocktailSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/cocktails/categories")
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchPublicDrinks = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("searchQuery", searchQuery);
        if (typeFilter !== "all") params.set("type", typeFilter);
        params.set("sortBy", sortBy);
        params.set("sortOrder", "desc");

        const response = await fetch(`/api/drinks/public?${params}`);
        if (response.ok) {
          const data = await response.json();
          setDrinks(data);
        }
      } catch (error) {
        console.error("Failed to fetch public drinks:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPublicDrinks, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, typeFilter, sortBy]);

  useEffect(() => {
    const fetchCocktails = async () => {
      setCocktailsLoading(true);
      try {
        const params = new URLSearchParams();
        if (cocktailSearch) params.set("search", cocktailSearch);
        if (selectedCategory !== "all") params.set("category", selectedCategory);

        const response = await fetch(`/api/cocktails?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCocktails(data);
        }
      } catch (error) {
        console.error("Failed to fetch cocktails:", error);
      } finally {
        setCocktailsLoading(false);
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

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-explore-title">
          Explore
        </h2>
        <p className="text-muted-foreground">Discover drinks from around the world.</p>
      </div>

      <Tabs defaultValue="cocktails" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cocktails" data-testid="tab-cocktails">
            <Sparkles className="h-4 w-4 mr-2" />
            Cocktail Database
          </TabsTrigger>
          <TabsTrigger value="community" data-testid="tab-community">
            <Users className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cocktails" className="space-y-6 mt-6">
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

          {cocktailsLoading ? (
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
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
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
        </TabsContent>

        <TabsContent value="community" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-explore-search"
                placeholder="Search drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-explore-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wine">Wine</SelectItem>
                <SelectItem value="beer">Beer</SelectItem>
                <SelectItem value="spirit">Spirits</SelectItem>
                <SelectItem value="cocktail">Cocktails</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-explore-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-explore-loading">
              Loading drinks...
            </div>
          ) : drinks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold" data-testid="text-explore-empty">No public drinks yet</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to share a tasting with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drinks.map((drink) => (
                <Card key={drink.id} className="overflow-hidden" data-testid={`card-explore-drink-${drink.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {drink.imageUrl ? (
                          <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                        ) : (
                          getTypeIcon(drink.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" data-testid={`text-explore-name-${drink.id}`}>
                          {drink.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {drink.maker}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {formatType(drink.type)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">{drink.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(drink.nose?.length || drink.palate?.length || drink.finish) && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {drink.nose && drink.nose.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Nose:</span>
                            <p className="text-sm">{drink.nose.slice(0, 3).join(", ")}</p>
                          </div>
                        )}
                        {drink.palate && drink.palate.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Palate:</span>
                            <p className="text-sm">{drink.palate.slice(0, 3).join(", ")}</p>
                          </div>
                        )}
                        {drink.finish && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Finish:</span>
                            <p className="text-sm truncate">{drink.finish}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
