import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrinkSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/drinks", async (req, res) => {
    try {
      const validatedData = insertDrinkSchema.parse(req.body);
      const drink = await storage.createDrink(validatedData);
      res.status(201).json(drink);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create drink" });
      }
    }
  });

  app.get("/api/drinks", async (req, res) => {
    try {
      const filters: any = {};
      
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

  app.put("/api/drinks/:id", async (req, res) => {
    try {
      const validatedData = insertDrinkSchema.partial().parse(req.body);
      const drink = await storage.updateDrink(req.params.id, validatedData);
      if (!drink) {
        res.status(404).json({ error: "Drink not found" });
        return;
      }
      res.json(drink);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to update drink" });
      }
    }
  });

  app.delete("/api/drinks/:id", async (req, res) => {
    try {
      const success = await storage.deleteDrink(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Drink not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete drink" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDrinkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  return httpServer;
}
