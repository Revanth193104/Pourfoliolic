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
  themePreference: text("theme_preference").default("system"), // "light", "dark", or "system"
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
  purchaseVenue: text("purchase_venue"),
  purchaseUrl: text("purchase_url"),
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
  status: text("status").notNull().default("pending"), // "pending" or "accepted"
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

// Circle invites
export const circleInvites = pgTable("circle_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").references(() => circles.id).notNull(),
  inviterId: varchar("inviter_id").references(() => users.id).notNull(),
  inviteeId: varchar("invitee_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCircleInviteSchema = createInsertSchema(circleInvites).omit({
  id: true,
  createdAt: true,
});

export type InsertCircleInvite = z.infer<typeof insertCircleInviteSchema>;
export type CircleInvite = typeof circleInvites.$inferSelect;

// Circle posts (shared drinks/content within circles)
export const circlePosts = pgTable("circle_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").references(() => circles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  drinkId: varchar("drink_id").references(() => drinks.id),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCirclePostSchema = createInsertSchema(circlePosts).omit({
  id: true,
  createdAt: true,
});

export type InsertCirclePost = z.infer<typeof insertCirclePostSchema>;
export type CirclePost = typeof circlePosts.$inferSelect;

// Offline actions queue for sync
export const offlineActions = pgTable("offline_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tempId: varchar("temp_id").notNull(), // Client-generated ID to prevent duplicates
  userId: varchar("user_id").references(() => users.id).notNull(),
  actionType: text("action_type").notNull(), // "create_drink", "update_drink", "delete_drink"
  payload: jsonb("payload").notNull(),
  status: text("status").default("pending"), // "pending", "synced", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  syncedAt: timestamp("synced_at"),
});

export type OfflineAction = typeof offlineActions.$inferSelect;

// Price history for tracking price changes
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drinkId: varchar("drink_id").references(() => drinks.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  venue: text("venue"),
  url: text("url"),
  capturedAt: timestamp("captured_at").defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  capturedAt: true,
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

// Conversations for direct messaging
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;

// Conversation participants
export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at").defaultNow(),
});

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "follow", "comment", "cheer"
  actorId: varchar("actor_id").references(() => users.id).notNull(),
  drinkId: varchar("drink_id").references(() => drinks.id),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
