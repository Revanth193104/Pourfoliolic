import { type User, type UpsertUser, type Drink, type InsertDrink, drinks, users, follows, cheers, comments, type Comment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte, sql, ne, count } from "drizzle-orm";

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
  
  // Community features
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  toggleCheers(drinkId: string, userId: string): Promise<boolean>;
  hasCheered(drinkId: string, userId: string): Promise<boolean>;
  getCheersCount(drinkId: string): Promise<number>;
  
  addComment(drinkId: string, userId: string, content: string): Promise<Comment>;
  getComments(drinkId: string): Promise<(Comment & { user: User })[]>;
  
  getTrendingFlavors(): Promise<{ flavor: string; count: number }[]>;
  getFeaturedDrinks(): Promise<Drink[]>;
  getSuggestedUsers(userId: string): Promise<(User & { drinksCount: number; isFollowing: boolean })[]>;
  getCommunityFeed(userId?: string): Promise<(Drink & { user: User; cheersCount: number; hasCheered: boolean; comments: (Comment & { user: User })[] })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<{ user: User; isNewUser: boolean }> {
    const existingUser = userData.id ? await this.getUser(userData.id) : undefined;
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

  // Community features
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const existing = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    if (existing.length > 0) {
      await db.delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      return false;
    } else {
      await db.insert(follows).values({ followerId, followingId });
      return true;
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db.select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map(r => r.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db.select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map(r => r.user);
  }

  async toggleCheers(drinkId: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(cheers)
      .where(and(eq(cheers.drinkId, drinkId), eq(cheers.userId, userId)));
    
    if (existing.length > 0) {
      await db.delete(cheers)
        .where(and(eq(cheers.drinkId, drinkId), eq(cheers.userId, userId)));
      return false;
    } else {
      await db.insert(cheers).values({ drinkId, userId });
      return true;
    }
  }

  async hasCheered(drinkId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(cheers)
      .where(and(eq(cheers.drinkId, drinkId), eq(cheers.userId, userId)));
    return result.length > 0;
  }

  async getCheersCount(drinkId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(cheers)
      .where(eq(cheers.drinkId, drinkId));
    return result[0]?.count || 0;
  }

  async addComment(drinkId: string, userId: string, content: string): Promise<Comment> {
    const [comment] = await db.insert(comments)
      .values({ drinkId, userId, content })
      .returning();
    return comment;
  }

  async getComments(drinkId: string): Promise<(Comment & { user: User })[]> {
    const result = await db.select({
      comment: comments,
      user: users
    })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.drinkId, drinkId))
      .orderBy(asc(comments.createdAt));
    
    return result.map(r => ({ ...r.comment, user: r.user }));
  }

  async getTrendingFlavors(): Promise<{ flavor: string; count: number }[]> {
    const publicDrinks = await db.select().from(drinks).where(eq(drinks.isPrivate, false));
    const flavorCounts: Record<string, number> = {};
    
    publicDrinks.forEach(drink => {
      [...(drink.nose || []), ...(drink.palate || [])].forEach(flavor => {
        if (flavor) {
          flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
        }
      });
    });
    
    return Object.entries(flavorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([flavor, count]) => ({ flavor, count }));
  }

  async getFeaturedDrinks(): Promise<Drink[]> {
    return await db.select().from(drinks)
      .where(eq(drinks.isPrivate, false))
      .orderBy(desc(drinks.rating), desc(drinks.date))
      .limit(10);
  }

  async getSuggestedUsers(userId: string): Promise<(User & { drinksCount: number; isFollowing: boolean })[]> {
    const allUsers = await db.select().from(users).where(ne(users.id, userId)).limit(10);
    
    const result = await Promise.all(allUsers.map(async (user) => {
      const userDrinks = await db.select({ count: count() }).from(drinks).where(eq(drinks.userId, user.id));
      const isFollowing = await this.isFollowing(userId, user.id);
      return {
        ...user,
        drinksCount: userDrinks[0]?.count || 0,
        isFollowing
      };
    }));
    
    return result;
  }

  async searchUsers(query: string): Promise<(User & { drinksCount: number })[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    const results = await db.select().from(users)
      .where(
        or(
          like(sql`LOWER(${users.firstName})`, searchPattern),
          like(sql`LOWER(${users.email})`, searchPattern)
        )
      )
      .limit(20);
    
    const usersWithCounts = await Promise.all(results.map(async (user) => {
      const userDrinks = await db.select({ count: count() }).from(drinks).where(eq(drinks.userId, user.id));
      return {
        ...user,
        drinksCount: userDrinks[0]?.count || 0
      };
    }));
    
    return usersWithCounts;
  }

  async getCommunityFeed(userId?: string): Promise<(Drink & { user: User; cheersCount: number; hasCheered: boolean; comments: (Comment & { user: User })[] })[]> {
    const publicDrinks = await db.select({
      drink: drinks,
      user: users
    })
      .from(drinks)
      .innerJoin(users, eq(drinks.userId, users.id))
      .where(eq(drinks.isPrivate, false))
      .orderBy(desc(drinks.date))
      .limit(20);
    
    const result = await Promise.all(publicDrinks.map(async (row) => {
      const cheersCount = await this.getCheersCount(row.drink.id);
      const hasCheered = userId ? await this.hasCheered(row.drink.id, userId) : false;
      const drinkComments = await this.getComments(row.drink.id);
      
      return {
        ...row.drink,
        user: row.user,
        cheersCount,
        hasCheered,
        comments: drinkComments
      };
    }));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
