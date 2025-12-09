import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrinkSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/drinks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get("/api/drinks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put("/api/drinks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete("/api/drinks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDrinkStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  return httpServer;
}
