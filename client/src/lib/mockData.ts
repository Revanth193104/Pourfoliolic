
import { type LucideIcon, Wine, Beer, Martini, GlassWater } from "lucide-react";

export interface Drink {
  id: string;
  name: string;
  maker: string;
  type: "wine" | "beer" | "spirit" | "cocktail";
  subtype?: string; // e.g., "Cabernet Sauvignon", "IPA", "Single Malt"
  rating: number; // 1-5
  date: string;
  imageUrl?: string;
  notes: {
    nose: string[];
    palate: string[];
    finish?: string;
  };
  price?: number;
  currency?: string;
  location?: string; // Where purchased/consumed
  pairings?: string[];
  occasion?: string;
  mood?: string;
  isPrivate: boolean;
}

export const mockDrinks: Drink[] = [
  {
    id: "1",
    name: "Château Margaux 2015",
    maker: "Château Margaux",
    type: "wine",
    subtype: "Bordeaux Blend",
    rating: 5,
    date: "2024-12-01",
    imageUrl: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800",
    notes: {
      nose: ["Blackberry", "Violet", "Cedar"],
      palate: ["Cassis", "Tobacco", "Silky tannins"],
      finish: "Long, elegant"
    },
    price: 650,
    currency: "USD",
    location: "Home Cellar",
    pairings: ["Roast Lamb", "Aged Gouda"],
    occasion: "Anniversary",
    mood: "Celebratory",
    isPrivate: false,
  },
  {
    id: "2",
    name: "Pliny the Elder",
    maker: "Russian River Brewing",
    type: "beer",
    subtype: "Double IPA",
    rating: 4.8,
    date: "2024-12-05",
    imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=800",
    notes: {
      nose: ["Pine", "Citrus", "Floral"],
      palate: ["Resin", "Grapefruit", "Balanced bitterness"],
    },
    price: 18,
    currency: "USD",
    location: "Local Taproom",
    pairings: ["Burger", "Spicy Wings"],
    occasion: "Friday Night",
    mood: "Relaxed",
    isPrivate: false,
  },
  {
    id: "3",
    name: "Lagavulin 16",
    maker: "Lagavulin",
    type: "spirit",
    subtype: "Islay Single Malt Scotch",
    rating: 4.9,
    date: "2024-11-20",
    imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&q=80&w=800",
    notes: {
      nose: ["Peat smoke", "Iodine", "Dried fruit"],
      palate: ["Smoke", "Sherry sweetness", "Sea salt"],
      finish: "Warm, peppery"
    },
    price: 95,
    currency: "USD",
    location: "Gift",
    mood: "Contemplative",
    isPrivate: true,
  },
  {
    id: "4",
    name: "Negroni",
    maker: "Homemade",
    type: "cocktail",
    rating: 4.5,
    date: "2024-12-08",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800",
    notes: {
      nose: ["Orange peel", "Herbal"],
      palate: ["Bittersweet", "Botanical"],
    },
    location: "Home Bar",
    occasion: "Aperitivo",
    isPrivate: false,
  }
];

export const drinkTypes = [
  { id: "wine", label: "Wine", icon: Wine },
  { id: "beer", label: "Beer", icon: Beer },
  { id: "spirit", label: "Spirits", icon: GlassWater }, // Using GlassWater as proxy for spirits glass
  { id: "cocktail", label: "Cocktails", icon: Martini },
];
