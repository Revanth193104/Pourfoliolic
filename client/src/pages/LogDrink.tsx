import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { Wine, Beer, Martini, GlassWater, Star, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const drinkTypes = [
  { id: "wine", label: "Wine", icon: Wine },
  { id: "beer", label: "Beer", icon: Beer },
  { id: "spirit", label: "Spirits", icon: GlassWater },
  { id: "cocktail", label: "Cocktails", icon: Martini },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  maker: z.string().min(1, "Maker is required"),
  type: z.enum(["wine", "beer", "spirit", "cocktail"]),
  subtype: z.string().optional(),
  rating: z.number().min(0).max(5),
  imageUrl: z.string().optional(),
  nose: z.array(z.string()).optional(),
  palate: z.array(z.string()).optional(),
  finish: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().default("USD"),
  location: z.string().optional(),
  pairings: z.array(z.string()).optional(),
  occasion: z.string().optional(),
  mood: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function LogDrink() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [noseInput, setNoseInput] = useState("");
  const [palateInput, setPalateInput] = useState("");
  const [pairingInput, setPairingInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "wine",
      rating: 3,
      currency: "USD",
      isPrivate: false,
      nose: [],
      palate: [],
      pairings: [],
    },
  });

  const selectedType = watch("type");
  const rating = watch("rating");
  const nose = watch("nose") || [];
  const palate = watch("palate") || [];
  const pairings = watch("pairings") || [];
  const isPrivate = watch("isPrivate");

  const addNose = () => {
    if (noseInput.trim()) {
      setValue("nose", [...nose, noseInput.trim()]);
      setNoseInput("");
    }
  };

  const removeNose = (index: number) => {
    setValue("nose", nose.filter((_, i) => i !== index));
  };

  const addPalate = () => {
    if (palateInput.trim()) {
      setValue("palate", [...palate, palateInput.trim()]);
      setPalateInput("");
    }
  };

  const removePalate = (index: number) => {
    setValue("palate", palate.filter((_, i) => i !== index));
  };

  const addPairing = () => {
    if (pairingInput.trim()) {
      setValue("pairings", [...pairings, pairingInput.trim()]);
      setPairingInput("");
    }
  };

  const removePairing = (index: number) => {
    setValue("pairings", pairings.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: data.price ? data.price : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create drink");
      }

      toast({
        title: "Success!",
        description: "Your tasting has been logged.",
      });

      navigate("/cellar");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create drink",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Log a Drink</h2>
        <p className="text-muted-foreground">Record your latest tasting experience.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Drink Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {drinkTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    data-testid={`button-type-${type.id}`}
                    onClick={() => setValue("type", type.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedType === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  {...register("name")}
                  placeholder="e.g., Château Margaux 2015"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maker">Maker/Producer *</Label>
                <Input
                  id="maker"
                  data-testid="input-maker"
                  {...register("maker")}
                  placeholder="e.g., Château Margaux"
                />
                {errors.maker && (
                  <p className="text-sm text-destructive">{errors.maker.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtype/Varietal</Label>
              <Input
                id="subtype"
                data-testid="input-subtype"
                {...register("subtype")}
                placeholder="e.g., Bordeaux Blend, IPA, Single Malt Scotch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                data-testid="input-imageUrl"
                {...register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    data-testid={`button-rating-${star}`}
                    onClick={() => setValue("rating", star)}
                    className="transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-lg font-semibold" data-testid="text-rating">
                {rating}/5
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tasting Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Tasting Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nose */}
            <div className="space-y-2">
              <Label>Nose/Aroma</Label>
              <div className="flex gap-2">
                <Input
                  data-testid="input-nose"
                  value={noseInput}
                  onChange={(e) => setNoseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNose();
                    }
                  }}
                  placeholder="Add aroma descriptor (e.g., Blackberry)"
                />
                <Button
                  type="button"
                  data-testid="button-add-nose"
                  onClick={addNose}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {nose.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nose.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`tag-nose-${index}`}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        data-testid={`button-remove-nose-${index}`}
                        onClick={() => removeNose(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Palate */}
            <div className="space-y-2">
              <Label>Palate/Taste</Label>
              <div className="flex gap-2">
                <Input
                  data-testid="input-palate"
                  value={palateInput}
                  onChange={(e) => setPalateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPalate();
                    }
                  }}
                  placeholder="Add taste descriptor (e.g., Cassis)"
                />
                <Button
                  type="button"
                  data-testid="button-add-palate"
                  onClick={addPalate}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {palate.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {palate.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`tag-palate-${index}`}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        data-testid={`button-remove-palate-${index}`}
                        onClick={() => removePalate(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finish */}
            <div className="space-y-2">
              <Label htmlFor="finish">Finish</Label>
              <Textarea
                id="finish"
                data-testid="input-finish"
                {...register("finish")}
                placeholder="Describe the finish (e.g., Long, elegant, warm)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase & Context */}
        <Card>
          <CardHeader>
            <CardTitle>Details & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  data-testid="input-price"
                  type="number"
                  step="0.01"
                  {...register("price")}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  data-testid="input-currency"
                  {...register("currency")}
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="input-location"
                {...register("location")}
                placeholder="Where purchased or consumed (e.g., Home Cellar, Local Wine Shop)"
              />
            </div>

            {/* Pairings */}
            <div className="space-y-2">
              <Label>Food Pairings</Label>
              <div className="flex gap-2">
                <Input
                  data-testid="input-pairing"
                  value={pairingInput}
                  onChange={(e) => setPairingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPairing();
                    }
                  }}
                  placeholder="Add food pairing (e.g., Roast Lamb)"
                />
                <Button
                  type="button"
                  data-testid="button-add-pairing"
                  onClick={addPairing}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {pairings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pairings.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`tag-pairing-${index}`}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        data-testid={`button-remove-pairing-${index}`}
                        onClick={() => removePairing(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  data-testid="input-occasion"
                  {...register("occasion")}
                  placeholder="e.g., Anniversary, Friday Night"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Input
                  id="mood"
                  data-testid="input-mood"
                  {...register("mood")}
                  placeholder="e.g., Celebratory, Relaxed, Contemplative"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPrivate">Private Tasting</Label>
                <p className="text-sm text-muted-foreground">
                  Keep this tasting visible only to you
                </p>
              </div>
              <Switch
                id="isPrivate"
                data-testid="switch-private"
                checked={isPrivate}
                onCheckedChange={(checked) => setValue("isPrivate", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="submit"
            data-testid="button-submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Log Tasting"}
          </Button>
          <Button
            type="button"
            data-testid="button-cancel"
            variant="outline"
            onClick={() => navigate("/cellar")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
