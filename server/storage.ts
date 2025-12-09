import { type User, type UpsertUser, type Drink, type InsertDrink, drinks, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte } from "drizzle-orm";

export interface DrinkFilters {
  type?: string;
  subtype?: string;
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  maker?: string;
  searchQuery?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  publicOnly?: boolean;
}

export interface DrinkStats {
  totalDrinks: number;
  averageRating: number;
  totalSpending: number;
  favoriteType: string | null;
  drinksByType: Record<string, number>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<{ user: User; isNewUser: boolean }>;
  
  createDrink(drink: InsertDrink): Promise<Drink>;
  getDrinks(filters?: DrinkFilters, sortBy?: string, sortOrder?: "asc" | "desc"): Promise<Drink[]>;
  getDrinkById(id: string): Promise<Drink | undefined>;
  updateDrink(id: string, drink: Partial<InsertDrink>): Promise<Drink | undefined>;
  deleteDrink(id: string): Promise<boolean>;
  getDrinkStats(userId?: string): Promise<DrinkStats>;
  getPublicDrinks(filters?: DrinkFilters, sortBy?: string, sortOrder?: "asc" | "desc"): Promise<Drink[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<{ user: User; isNewUser: boolean }> {
    const existingUser = await this.getUser(userData.id);
    const isNewUser = !existingUser;
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return { user, isNewUser };
  }

  async createDrink(drink: InsertDrink): Promise<Drink> {
    const [newDrink] = await db.insert(drinks).values(drink).returning();
    return newDrink;
  }

  async getDrinks(filters?: DrinkFilters, sortBy: string = "date", sortOrder: "asc" | "desc" = "desc"): Promise<Drink[]> {
    const conditions = [];

    if (filters) {
      if (filters.userId) {
        conditions.push(eq(drinks.userId, filters.userId));
      }
      if (filters.type) {
        conditions.push(eq(drinks.type, filters.type));
      }
      if (filters.subtype) {
        conditions.push(eq(drinks.subtype, filters.subtype));
      }
      if (filters.minRating !== undefined) {
        conditions.push(gte(drinks.rating, filters.minRating.toString()));
      }
      if (filters.maxRating !== undefined) {
        conditions.push(lte(drinks.rating, filters.maxRating.toString()));
      }
      if (filters.minPrice !== undefined) {
        conditions.push(gte(drinks.price, filters.minPrice.toString()));
      }
      if (filters.maxPrice !== undefined) {
        conditions.push(lte(drinks.price, filters.maxPrice.toString()));
      }
      if (filters.maker) {
        conditions.push(like(drinks.maker, `%${filters.maker}%`));
      }
      if (filters.searchQuery) {
        conditions.push(
          or(
            like(drinks.name, `%${filters.searchQuery}%`),
            like(drinks.maker, `%${filters.searchQuery}%`)
          )!
        );
      }
      if (filters.startDate) {
        conditions.push(gte(drinks.date, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(drinks.date, filters.endDate));
      }
      if (filters.publicOnly) {
        conditions.push(eq(drinks.isPrivate, false));
      }
    }

    let query = db.select().from(drinks);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    const orderByColumn = sortBy === "rating" ? drinks.rating : 
                          sortBy === "name" ? drinks.name : 
                          sortBy === "price" ? drinks.price : drinks.date;
    
    query = query.orderBy(sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)) as any;

    return await query;
  }

  async getPublicDrinks(filters?: DrinkFilters, sortBy: string = "date", sortOrder: "asc" | "desc" = "desc"): Promise<Drink[]> {
    return this.getDrinks({ ...filters, publicOnly: true }, sortBy, sortOrder);
  }

  async getDrinkById(id: string): Promise<Drink | undefined> {
    const [drink] = await db.select().from(drinks).where(eq(drinks.id, id));
    return drink;
  }

  async updateDrink(id: string, drink: Partial<InsertDrink>): Promise<Drink | undefined> {
    const [updated] = await db
      .update(drinks)
      .set(drink)
      .where(eq(drinks.id, id))
      .returning();
    return updated;
  }

  async deleteDrink(id: string): Promise<boolean> {
    const result = await db.delete(drinks).where(eq(drinks.id, id)).returning();
    return result.length > 0;
  }

  async getDrinkStats(userId?: string): Promise<DrinkStats> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(drinks.userId, userId));
    }

    let query = db.select().from(drinks);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    const allDrinks = await query;
    
    const totalDrinks = allDrinks.length;
    const averageRating = totalDrinks > 0
      ? allDrinks.reduce((sum, d) => sum + parseFloat(d.rating), 0) / totalDrinks
      : 0;
    
    const totalSpending = allDrinks.reduce((sum, d) => {
      return sum + (d.price ? parseFloat(d.price) : 0);
    }, 0);

    const drinksByType: Record<string, number> = {};
    allDrinks.forEach(d => {
      drinksByType[d.type] = (drinksByType[d.type] || 0) + 1;
    });

    const favoriteType = Object.entries(drinksByType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalDrinks,
      averageRating,
      totalSpending,
      favoriteType,
      drinksByType,
    };
  }
}

export const storage = new DatabaseStorage();
