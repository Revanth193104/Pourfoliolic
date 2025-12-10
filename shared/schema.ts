import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
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
  userId: varchar("user_id").references(() => users.id),
});

export const insertDrinkSchema = createInsertSchema(drinks).omit({
  id: true,
  date: true,
});

export type InsertDrink = z.infer<typeof insertDrinkSchema>;
export type Drink = typeof drinks.$inferSelect;

// Follows table for user relationships
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Follow = typeof follows.$inferSelect;

// Cheers (likes) for drinks
export const cheers = pgTable("cheers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drinkId: varchar("drink_id").references(() => drinks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Cheer = typeof cheers.$inferSelect;

// Comments on drinks
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drinkId: varchar("drink_id").references(() => drinks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Tasting Circles (micro-communities)
export const circles = pgTable("circles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleSchema = createInsertSchema(circles).omit({
  id: true,
  createdAt: true,
});

export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type Circle = typeof circles.$inferSelect;

// Circle members
export const circleMembers = pgTable("circle_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").references(() => circles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // "admin" or "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export type CircleMember = typeof circleMembers.$inferSelect;
