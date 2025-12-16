import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wine, Beer, Martini, Coffee, Search, Star, Edit, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Drink } from "@shared/schema";
import { getIdToken } from "@/lib/firebase";

const drinkTypes = [
  { value: "all", label: "All Types", icon: Coffee },
  { value: "wine", label: "Wine", icon: Wine },
  { value: "beer", label: "Beer", icon: Beer },
  { value: "spirit", label: "Spirit", icon: Martini },
  { value: "cocktail", label: "Cocktail", icon: Martini },
];

export default function Cellar() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrinks();
    }, 300);
    return () => clearTimeout(timer);
  }, [typeFilter, ratingFilter, sortBy, sortOrder, searchQuery]);

  const fetchDrinks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (ratingFilter !== "all") {
        const [min, max] = ratingFilter.split("-");
        params.append("minRating", min);
        if (max) params.append("maxRating", max);
      }
      if (searchQuery) params.append("search", searchQuery);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const token = await getIdToken();
      const response = await fetch(`/api/drinks?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setDrinks(data);
      }
    } catch (error) {
      console.error("Failed to fetch drinks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (drinkId: string) => {
    if (!confirm("Are you sure you want to delete this drink?")) return;
    
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/drinks/${drinkId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Drink removed from your cellar.",
        });
        fetchDrinks();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete drink.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    return (
      <div className="flex gap-0.5" data-testid={`rating-${rating}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= numRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Cellar</h2>
        <p className="text-muted-foreground">Your history of tastings.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search"
              placeholder="Search by name or maker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger data-testid="select-sort" className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date" data-testid="sort-date">Date</SelectItem>
              <SelectItem value="rating" data-testid="sort-rating">Rating</SelectItem>
              <SelectItem value="name" data-testid="sort-name">Name</SelectItem>
              <SelectItem value="price" data-testid="sort-price">Price</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
            <SelectTrigger data-testid="select-order" className="w-full md:w-[140px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc" data-testid="order-desc">Descending</SelectItem>
              <SelectItem value="asc" data-testid="order-asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {drinkTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                data-testid={`filter-type-${type.value}`}
                variant={typeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {type.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Rating:</span>
          {["all", "4-5", "3-4", "2-3", "1-2"].map((rating) => (
            <Button
              key={rating}
              data-testid={`filter-rating-${rating}`}
              variant={ratingFilter === rating ? "default" : "outline"}
              size="sm"
              onClick={() => setRatingFilter(rating)}
            >
              {rating === "all" ? "All" : `${rating.split("-")[0]}+ ⭐`}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12" data-testid="loading-state">
          <p className="text-muted-foreground">Loading drinks...</p>
        </div>
      ) : drinks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center" data-testid="empty-state">
              <p className="text-muted-foreground mb-4">No drinks found matching your filters.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setRatingFilter("all");
              }} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drinks.map((drink) => {
            const TypeIcon = drinkTypes.find(t => t.value === drink.type)?.icon || Coffee;
            return (
              <Card
                key={drink.id}
                data-testid={`card-drink-${drink.id}`}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {drink.imageUrl ? (
                      <img
                        src={drink.imageUrl}
                        alt={drink.name}
                        className="w-20 h-20 object-cover rounded"
                        data-testid={`img-drink-${drink.id}`}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                        <TypeIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate" data-testid={`text-name-${drink.id}`}>
                        {drink.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-maker-${drink.id}`}>
                        {drink.maker}
                      </p>
                      {drink.subtype && (
                        <p className="text-xs text-muted-foreground capitalize" data-testid={`text-subtype-${drink.id}`}>
                          {drink.subtype}
                        </p>
                      )}
                      <div className="mt-2">
                        {renderStars(drink.rating)}
                      </div>
                      {drink.price && (
                        <p className="text-sm font-medium mt-2" data-testid={`text-price-${drink.id}`}>
                          {drink.currency || "USD"} ${parseFloat(drink.price).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-date-${drink.id}`}>
                        {new Date(drink.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {drink.nose && drink.nose.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Nose</p>
                      <div className="flex flex-wrap gap-1">
                        {drink.nose.slice(0, 3).map((note, i) => (
                          <span
                            key={i}
                            className="text-xs bg-muted px-2 py-1 rounded"
                            data-testid={`tag-nose-${drink.id}-${i}`}
                          >
                            {note}
                          </span>
                        ))}
                        {drink.nose.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{drink.nose.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit/${drink.id}`);
                      }}
                      data-testid={`button-edit-${drink.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(drink.id);
                      }}
                      data-testid={`button-delete-${drink.id}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground" data-testid="text-count">
        Showing {drinks.length} drink{drinks.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
