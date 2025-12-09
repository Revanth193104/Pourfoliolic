import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const drinks = pgTable("drinks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  maker: text("maker").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype"),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  imageUrl: text("image_url"),
  nose: text("nose").array(),
  palate: text("palate").array(),
  finish: text("finish"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  location: text("location"),
  pairings: text("pairings").array(),
  occasion: text("occasion"),
  mood: text("mood"),
  isPrivate: boolean("is_private").notNull().default(false),
  userId: varchar("user_id"),
});

export const insertDrinkSchema = createInsertSchema(drinks).omit({
  id: true,
  date: true,
});

export type InsertDrink = z.infer<typeof insertDrinkSchema>;
export type Drink = typeof drinks.$inferSelect;
