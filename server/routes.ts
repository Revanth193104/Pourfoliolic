import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrinkSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, getUserFromToken, type AuthenticatedRequest } from "./firebaseAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', async (req, res) => {
    try {
      const user = await getUserFromToken(req.headers.authorization);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/drinks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const validatedData = insertDrinkSchema.parse({ ...req.body, userId });
      const drink = await storage.createDrink(validatedData);
      res.status(201).json(drink);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        console.error("Error creating drink:", error);
        res.status(500).json({ error: "Failed to create drink" });
      }
    }
  });

  app.get("/api/drinks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const filters: any = { userId };
      
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.subtype) filters.subtype = req.query.subtype as string;
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating as string);
      if (req.query.maxRating) filters.maxRating = parseFloat(req.query.maxRating as string);
      if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
      if (req.query.maker) filters.maker = req.query.maker as string;
      if (req.query.searchQuery) filters.searchQuery = req.query.searchQuery as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const sortBy = (req.query.sortBy as string) || "date";
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      const drinks = await storage.getDrinks(filters, sortBy, sortOrder);
      res.json(drinks);
    } catch (error) {
      console.error("Error fetching drinks:", error);
      res.status(500).json({ error: "Failed to fetch drinks" });
    }
  });

  app.get("/api/drinks/public", async (req, res) => {
    try {
      const filters: any = { publicOnly: true };
      
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.searchQuery) filters.searchQuery = req.query.searchQuery as string;
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating as string);

      const sortBy = (req.query.sortBy as string) || "date";
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      const drinks = await storage.getPublicDrinks(filters, sortBy, sortOrder);
      res.json(drinks);
    } catch (error) {
      console.error("Error fetching public drinks:", error);
      res.status(500).json({ error: "Failed to fetch drinks" });
    }
  });

  app.get("/api/drinks/:id", async (req, res) => {
    try {
      const drink = await storage.getDrinkById(req.params.id);
      if (!drink) {
        res.status(404).json({ error: "Drink not found" });
        return;
      }
      res.json(drink);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drink" });
    }
  });

  app.put("/api/drinks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const drink = await storage.getDrinkById(req.params.id);
      
      if (!drink) {
        res.status(404).json({ error: "Drink not found" });
        return;
      }
      
      if (drink.userId !== userId) {
        res.status(403).json({ error: "Not authorized to update this drink" });
        return;
      }

      const validatedData = insertDrinkSchema.partial().parse(req.body);
      const updated = await storage.updateDrink(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to update drink" });
      }
    }
  });

  app.delete("/api/drinks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const drink = await storage.getDrinkById(req.params.id);
      
      if (!drink) {
        res.status(404).json({ error: "Drink not found" });
        return;
      }
      
      if (drink.userId !== userId) {
        res.status(403).json({ error: "Not authorized to delete this drink" });
        return;
      }

      await storage.deleteDrink(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete drink" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const stats = await storage.getDrinkStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/cocktails", async (req, res) => {
    try {
      const { search, category, ingredient } = req.query;
      let url = "https://www.thecocktaildb.com/api/json/v1/1/";
      let isFilterEndpoint = false;
      
      if (search) {
        url += `search.php?s=${encodeURIComponent(search as string)}`;
      } else if (ingredient) {
        url += `filter.php?i=${encodeURIComponent(ingredient as string)}`;
        isFilterEndpoint = true;
      } else if (category) {
        url += `filter.php?c=${encodeURIComponent(category as string)}`;
        isFilterEndpoint = true;
      } else {
        // When no filters, fetch cocktails from multiple letters for variety
        const letters = ['a', 'm', 'c', 'b', 's', 'g', 't'];
        const allDrinks: any[] = [];
        
        for (const letter of letters) {
          try {
            const letterResponse = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`);
            const letterData = await letterResponse.json();
            if (letterData.drinks) {
              allDrinks.push(...letterData.drinks);
            }
          } catch (e) {
            // Skip failed letters
          }
        }
        
        const cocktails = allDrinks.slice(0, 24).map((drink: any) => ({
          id: drink.idDrink,
          name: drink.strDrink,
          category: drink.strCategory || "Cocktail",
          type: "cocktail",
          imageUrl: drink.strDrinkThumb,
          instructions: drink.strInstructions,
          glass: drink.strGlass,
          ingredients: [
            drink.strIngredient1, drink.strIngredient2, drink.strIngredient3,
            drink.strIngredient4, drink.strIngredient5, drink.strIngredient6,
            drink.strIngredient7, drink.strIngredient8
          ].filter(Boolean),
          measures: [
            drink.strMeasure1, drink.strMeasure2, drink.strMeasure3,
            drink.strMeasure4, drink.strMeasure5, drink.strMeasure6,
            drink.strMeasure7, drink.strMeasure8
          ].filter(Boolean),
          isAlcoholic: drink.strAlcoholic === "Alcoholic"
        }));
        
        res.json(cocktails);
        return;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const cocktails = (data.drinks || []).map((drink: any) => ({
        id: drink.idDrink,
        name: drink.strDrink,
        category: isFilterEndpoint ? (category as string) : (drink.strCategory || "Cocktail"),
        type: "cocktail",
        imageUrl: drink.strDrinkThumb,
        instructions: drink.strInstructions || null,
        glass: drink.strGlass || null,
        ingredients: isFilterEndpoint ? [] : [
          drink.strIngredient1, drink.strIngredient2, drink.strIngredient3,
          drink.strIngredient4, drink.strIngredient5, drink.strIngredient6,
          drink.strIngredient7, drink.strIngredient8, drink.strIngredient9,
          drink.strIngredient10, drink.strIngredient11, drink.strIngredient12,
          drink.strIngredient13, drink.strIngredient14, drink.strIngredient15
        ].filter(Boolean),
        measures: isFilterEndpoint ? [] : [
          drink.strMeasure1, drink.strMeasure2, drink.strMeasure3,
          drink.strMeasure4, drink.strMeasure5, drink.strMeasure6,
          drink.strMeasure7, drink.strMeasure8, drink.strMeasure9,
          drink.strMeasure10, drink.strMeasure11, drink.strMeasure12,
          drink.strMeasure13, drink.strMeasure14, drink.strMeasure15
        ].filter(Boolean),
        isAlcoholic: isFilterEndpoint ? true : (drink.strAlcoholic === "Alcoholic"),
        isPartialData: isFilterEndpoint,
      }));

      res.json(cocktails);
    } catch (error) {
      console.error("Error fetching cocktails:", error);
      res.status(500).json({ error: "Failed to fetch cocktails" });
    }
  });

  app.get("/api/cocktails/random", async (req, res) => {
    try {
      const response = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php");
      const data = await response.json();
      const drink = data.drinks?.[0];
      
      if (!drink) {
        res.status(404).json({ error: "No cocktail found" });
        return;
      }

      res.json({
        id: drink.idDrink,
        name: drink.strDrink,
        category: drink.strCategory || "Cocktail",
        type: "cocktail",
        imageUrl: drink.strDrinkThumb,
        instructions: drink.strInstructions,
        glass: drink.strGlass,
        ingredients: [
          drink.strIngredient1, drink.strIngredient2, drink.strIngredient3,
          drink.strIngredient4, drink.strIngredient5, drink.strIngredient6,
          drink.strIngredient7, drink.strIngredient8, drink.strIngredient9,
          drink.strIngredient10, drink.strIngredient11, drink.strIngredient12,
          drink.strIngredient13, drink.strIngredient14, drink.strIngredient15
        ].filter(Boolean),
        measures: [
          drink.strMeasure1, drink.strMeasure2, drink.strMeasure3,
          drink.strMeasure4, drink.strMeasure5, drink.strMeasure6,
          drink.strMeasure7, drink.strMeasure8, drink.strMeasure9,
          drink.strMeasure10, drink.strMeasure11, drink.strMeasure12,
          drink.strMeasure13, drink.strMeasure14, drink.strMeasure15
        ].filter(Boolean),
        isAlcoholic: drink.strAlcoholic === "Alcoholic",
      });
    } catch (error) {
      console.error("Error fetching random cocktail:", error);
      res.status(500).json({ error: "Failed to fetch random cocktail" });
    }
  });

  app.get("/api/cocktails/categories", async (req, res) => {
    try {
      const response = await fetch("https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list");
      const data = await response.json();
      const categories = (data.drinks || []).map((d: any) => d.strCategory);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/cocktails/ingredients", async (req, res) => {
    try {
      const response = await fetch("https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list");
      const data = await response.json();
      const ingredients = (data.drinks || []).map((d: any) => d.strIngredient1);
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/cocktails/:id", async (req, res) => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${req.params.id}`);
      const data = await response.json();
      const drink = data.drinks?.[0];
      
      if (!drink) {
        res.status(404).json({ error: "Cocktail not found" });
        return;
      }

      res.json({
        id: drink.idDrink,
        name: drink.strDrink,
        category: drink.strCategory || "Cocktail",
        type: "cocktail",
        imageUrl: drink.strDrinkThumb,
        instructions: drink.strInstructions,
        glass: drink.strGlass,
        ingredients: [
          drink.strIngredient1, drink.strIngredient2, drink.strIngredient3,
          drink.strIngredient4, drink.strIngredient5, drink.strIngredient6,
          drink.strIngredient7, drink.strIngredient8, drink.strIngredient9,
          drink.strIngredient10, drink.strIngredient11, drink.strIngredient12,
          drink.strIngredient13, drink.strIngredient14, drink.strIngredient15
        ].filter(Boolean),
        measures: [
          drink.strMeasure1, drink.strMeasure2, drink.strMeasure3,
          drink.strMeasure4, drink.strMeasure5, drink.strMeasure6,
          drink.strMeasure7, drink.strMeasure8, drink.strMeasure9,
          drink.strMeasure10, drink.strMeasure11, drink.strMeasure12,
          drink.strMeasure13, drink.strMeasure14, drink.strMeasure15
        ].filter(Boolean),
        isAlcoholic: drink.strAlcoholic === "Alcoholic",
      });
    } catch (error) {
      console.error("Error fetching cocktail:", error);
      res.status(500).json({ error: "Failed to fetch cocktail" });
    }
  });

  // Community API routes
  app.get("/api/community/feed", async (req, res) => {
    try {
      const userId = (req as any).user?.uid;
      const feed = await storage.getCommunityFeed(userId);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching community feed:", error);
      res.status(500).json({ error: "Failed to fetch community feed" });
    }
  });

  app.get("/api/community/trending", async (req, res) => {
    try {
      const trending = await storage.getTrendingFlavors();
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending flavors:", error);
      res.status(500).json({ error: "Failed to fetch trending flavors" });
    }
  });

  app.get("/api/community/featured", async (req, res) => {
    try {
      const featured = await storage.getFeaturedDrinks();
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured drinks:", error);
      res.status(500).json({ error: "Failed to fetch featured drinks" });
    }
  });

  app.get("/api/community/suggested-users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const suggested = await storage.getSuggestedUsers(userId);
      res.json(suggested);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ error: "Failed to fetch suggested users" });
    }
  });

  app.post("/api/community/cheers/:drinkId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { drinkId } = req.params;
      const isCheered = await storage.toggleCheers(drinkId, userId);
      res.json({ cheered: isCheered });
    } catch (error) {
      console.error("Error toggling cheers:", error);
      res.status(500).json({ error: "Failed to toggle cheers" });
    }
  });

  app.post("/api/community/comments/:drinkId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { drinkId } = req.params;
      const { content } = req.body;
      
      if (!content || typeof content !== "string") {
        res.status(400).json({ error: "Comment content is required" });
        return;
      }
      
      const comment = await storage.addComment(drinkId, userId, content);
      const user = await storage.getUser(userId);
      res.json({ ...comment, user });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.post("/api/community/follow/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const followerId = (req as AuthenticatedRequest).user!.uid;
      const { userId } = req.params;
      
      if (followerId === userId) {
        res.status(400).json({ error: "Cannot follow yourself" });
        return;
      }
      
      const result = await storage.sendFollowRequest(followerId, userId);
      res.json({ status: result });
    } catch (error) {
      console.error("Error sending follow request:", error);
      res.status(500).json({ error: "Failed to send follow request" });
    }
  });

  app.post("/api/community/unfollow/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const followerId = (req as AuthenticatedRequest).user!.uid;
      const { userId } = req.params;
      
      await storage.unfollowUser(followerId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.post("/api/community/follow-requests/:followerId/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { followerId } = req.params;
      
      const success = await storage.acceptFollowRequest(userId, followerId);
      if (!success) {
        res.status(404).json({ error: "Follow request not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting follow request:", error);
      res.status(500).json({ error: "Failed to accept follow request" });
    }
  });

  app.post("/api/community/follow-requests/:followerId/decline", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { followerId } = req.params;
      
      const success = await storage.declineFollowRequest(userId, followerId);
      if (!success) {
        res.status(404).json({ error: "Follow request not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining follow request:", error);
      res.status(500).json({ error: "Failed to decline follow request" });
    }
  });

  app.delete("/api/community/followers/:followerId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { followerId } = req.params;
      
      await storage.removeFollower(userId, followerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing follower:", error);
      res.status(500).json({ error: "Failed to remove follower" });
    }
  });

  app.get("/api/community/follow-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const requests = await storage.getPendingFollowRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      res.status(500).json({ error: "Failed to fetch follow requests" });
    }
  });

  app.get("/api/community/follow-requests/count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const count = await storage.getPendingFollowRequestsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching follow requests count:", error);
      res.status(500).json({ error: "Failed to fetch follow requests count" });
    }
  });

  app.get("/api/community/follow-status/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as AuthenticatedRequest).user!.uid;
      const { userId } = req.params;
      const status = await storage.getFollowStatus(currentUserId, userId);
      res.json({ status });
    } catch (error) {
      console.error("Error fetching follow status:", error);
      res.status(500).json({ error: "Failed to fetch follow status" });
    }
  });

  app.get("/api/community/search-users", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        res.json([]);
        return;
      }
      const results = await storage.searchUsers(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.get("/api/community/followers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  app.get("/api/community/following", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Username management
  app.get("/api/community/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      const drinks = await storage.getPublicDrinks({ userId });
      const followersCount = await storage.getFollowersCount(userId);
      const followingCount = await storage.getFollowingCount(userId);
      
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        drinksCount: drinks.length,
        followersCount,
        followingCount,
        drinks,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.get("/api/username/check/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const isAvailable = await storage.isUsernameAvailable(username);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  app.post("/api/username/set", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { username } = req.body;
      
      if (!username || typeof username !== "string") {
        res.status(400).json({ error: "Username is required" });
        return;
      }
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        res.status(400).json({ error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" });
        return;
      }
      
      const isAvailable = await storage.isUsernameAvailable(username);
      if (!isAvailable) {
        res.status(409).json({ error: "Username is already taken" });
        return;
      }
      
      const updatedUser = await storage.setUsername(userId, username);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting username:", error);
      res.status(500).json({ error: "Failed to set username" });
    }
  });

  // Export drinks as CSV
  app.get("/api/drinks/export", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const format = (req.query.format as string) || "csv";
      
      const drinks = await storage.getDrinks({ userId }, "date", "desc");
      
      if (format === "csv") {
        const headers = ["Name", "Maker", "Type", "Subtype", "Rating", "Date", "Price", "Currency", "Location", "Purchase Venue", "Nose", "Palate", "Finish", "Pairings", "Occasion", "Mood"];
        const csvRows = [headers.join(",")];
        
        for (const drink of drinks) {
          const row = [
            `"${(drink.name || "").replace(/"/g, '""')}"`,
            `"${(drink.maker || "").replace(/"/g, '""')}"`,
            `"${(drink.type || "").replace(/"/g, '""')}"`,
            `"${(drink.subtype || "").replace(/"/g, '""')}"`,
            drink.rating || "",
            drink.date ? new Date(drink.date).toISOString().split("T")[0] : "",
            drink.price || "",
            drink.currency || "",
            `"${(drink.location || "").replace(/"/g, '""')}"`,
            `"${(drink.purchaseVenue || "").replace(/"/g, '""')}"`,
            `"${(drink.nose || []).join("; ").replace(/"/g, '""')}"`,
            `"${(drink.palate || []).join("; ").replace(/"/g, '""')}"`,
            `"${(drink.finish || "").replace(/"/g, '""')}"`,
            `"${(drink.pairings || []).join("; ").replace(/"/g, '""')}"`,
            `"${(drink.occasion || "").replace(/"/g, '""')}"`,
            `"${(drink.mood || "").replace(/"/g, '""')}"`,
          ];
          csvRows.push(row.join(","));
        }
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=pourfoliolic-tastings.csv");
        res.send(csvRows.join("\n"));
      } else {
        res.status(400).json({ error: "Unsupported format. Use 'csv'" });
      }
    } catch (error) {
      console.error("Error exporting drinks:", error);
      res.status(500).json({ error: "Failed to export drinks" });
    }
  });

  // Update theme preference
  app.patch("/api/settings/theme", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { theme } = req.body;
      
      if (!theme || !["light", "dark", "system"].includes(theme)) {
        res.status(400).json({ error: "Invalid theme. Use 'light', 'dark', or 'system'" });
        return;
      }
      
      const updatedUser = await storage.updateUserTheme(userId, theme);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ error: "Failed to update theme" });
    }
  });

  // Get drink recommendations
  app.get("/api/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const recommendations = await storage.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Circles CRUD
  app.get("/api/circles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const circles = await storage.getUserCircles(userId);
      res.json(circles);
    } catch (error) {
      console.error("Error fetching circles:", error);
      res.status(500).json({ error: "Failed to fetch circles" });
    }
  });

  app.post("/api/circles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { name, description, isPrivate } = req.body;
      
      if (!name) {
        res.status(400).json({ error: "Circle name is required" });
        return;
      }
      
      const circle = await storage.createCircle({
        name,
        description: description || null,
        isPrivate: isPrivate || false,
        creatorId: userId,
        imageUrl: null,
      });
      res.status(201).json(circle);
    } catch (error) {
      console.error("Error creating circle:", error);
      res.status(500).json({ error: "Failed to create circle" });
    }
  });

  app.get("/api/circles/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const circle = await storage.getCircleById(req.params.id, userId);
      if (!circle) {
        res.status(404).json({ error: "Circle not found" });
        return;
      }
      res.json(circle);
    } catch (error) {
      console.error("Error fetching circle:", error);
      res.status(500).json({ error: "Failed to fetch circle" });
    }
  });

  app.post("/api/circles/:id/invite", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { inviteeId } = req.body;
      
      if (!inviteeId) {
        res.status(400).json({ error: "Invitee ID is required" });
        return;
      }
      
      const invite = await storage.createCircleInvite({
        circleId: req.params.id,
        inviterId: userId,
        inviteeId,
        status: "pending",
      });
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  app.get("/api/circles/invites/pending", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const invites = await storage.getPendingCircleInvites(userId);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  app.post("/api/circles/invites/:id/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      await storage.acceptCircleInvite(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ error: "Failed to accept invite" });
    }
  });

  app.post("/api/circles/invites/:id/decline", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      await storage.declineCircleInvite(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining invite:", error);
      res.status(500).json({ error: "Failed to decline invite" });
    }
  });

  app.post("/api/circles/:id/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { content, drinkId } = req.body;
      
      const post = await storage.createCirclePost({
        circleId: req.params.id,
        userId,
        content: content || null,
        drinkId: drinkId || null,
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/circles/:id/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const posts = await storage.getCirclePosts(req.params.id, userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Offline sync endpoint
  app.post("/api/sync/offline", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user!.uid;
      const { actions } = req.body;
      
      if (!Array.isArray(actions)) {
        res.status(400).json({ error: "Actions must be an array" });
        return;
      }
      
      const results = await storage.processOfflineActions(userId, actions);
      res.json({ results });
    } catch (error) {
      console.error("Error syncing offline actions:", error);
      res.status(500).json({ error: "Failed to sync offline actions" });
    }
  });

  return httpServer;
}
