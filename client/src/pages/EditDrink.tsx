import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { Wine, Beer, Martini, GlassWater, Star, Plus, X, Camera, Link, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getIdToken } from "@/lib/firebase";

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

export default function EditDrink() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [noseInput, setNoseInput] = useState("");
  const [palateInput, setPalateInput] = useState("");
  const [pairingInput, setPairingInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageMode, setImageMode] = useState<"camera" | "url">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  useEffect(() => {
    const fetchDrink = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch(`/api/drinks/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (response.ok) {
          const drink = await response.json();
          reset({
            name: drink.name,
            maker: drink.maker,
            type: drink.type,
            subtype: drink.subtype || "",
            rating: parseFloat(drink.rating),
            imageUrl: drink.imageUrl || "",
            nose: drink.nose || [],
            palate: drink.palate || [],
            finish: drink.finish || "",
            price: drink.price || "",
            currency: drink.currency || "USD",
            location: drink.location || "",
            pairings: drink.pairings || [],
            occasion: drink.occasion || "",
            mood: drink.mood || "",
            isPrivate: drink.isPrivate || false,
          });
          if (drink.imageUrl && drink.imageUrl.startsWith("data:")) {
            setCapturedImage(drink.imageUrl);
            setImageMode("camera");
          } else if (drink.imageUrl) {
            setImageMode("url");
          }
        } else {
          throw new Error("Failed to fetch drink");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load drink details.",
          variant: "destructive",
        });
        navigate("/cellar");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrink();
  }, [params.id]);

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

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        setValue("imageUrl", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setCapturedImage(null);
    setValue("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/drinks/${params.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...data,
          rating: data.rating.toString(),
          price: data.price ? data.price : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update drink");
      }

      toast({
        title: "Success!",
        description: "Your tasting has been updated.",
      });

      navigate("/cellar");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update drink",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading drink details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Drink</h2>
        <p className="text-muted-foreground">Update your tasting notes.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-3">
              <Label>Photo</Label>
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={imageMode === "camera" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("camera")}
                  data-testid="button-image-camera"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant={imageMode === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImageMode("url")}
                  data-testid="button-image-url"
                >
                  <Link className="w-4 h-4 mr-2" />
                  URL
                </Button>
              </div>
              
              {imageMode === "camera" ? (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                    data-testid="input-camera"
                  />
                  {capturedImage ? (
                    <div className="relative inline-block">
                      <img
                        src={capturedImage}
                        alt="Captured drink"
                        className="w-48 h-48 object-cover rounded-lg border"
                        data-testid="img-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8"
                        onClick={clearImage}
                        data-testid="button-clear-image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-capture"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">Tap to capture or select photo</span>
                      </div>
                    </Button>
                  )}
                </div>
              ) : (
                <Input
                  id="imageUrl"
                  data-testid="input-imageUrl"
                  {...register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </div>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>Tasting Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

        <div className="flex gap-4">
          <Button
            type="submit"
            data-testid="button-submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Update Tasting"}
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
