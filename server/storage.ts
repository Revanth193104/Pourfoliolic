import { type User, type UpsertUser, type Drink, type InsertDrink, drinks, users, follows, cheers, comments, type Comment, circles, circleMembers, circleInvites, circlePosts, type Circle, type InsertCircle, type CircleMember, type InsertCircleInvite, type CircleInvite, type InsertCirclePost, type CirclePost, conversations, conversationParticipants, messages, type Conversation, type Message, notifications, type Notification } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte, sql, ne, count, inArray } from "drizzle-orm";

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
  updateProfileImage(userId: string, imageData: string): Promise<User | undefined>;
  
  createDrink(drink: InsertDrink): Promise<Drink>;
  getDrinks(filters?: DrinkFilters, sortBy?: string, sortOrder?: "asc" | "desc"): Promise<Drink[]>;
  getDrinkById(id: string): Promise<Drink | undefined>;
  updateDrink(id: string, drink: Partial<InsertDrink>): Promise<Drink | undefined>;
  deleteDrink(id: string): Promise<boolean>;
  getDrinkStats(userId?: string): Promise<DrinkStats>;
  getPublicDrinks(filters?: DrinkFilters, sortBy?: string, sortOrder?: "asc" | "desc"): Promise<Drink[]>;
  
  // Community features
  sendFollowRequest(followerId: string, followingId: string): Promise<"pending" | "already_following" | "already_pending">;
  acceptFollowRequest(userId: string, followerId: string): Promise<boolean>;
  declineFollowRequest(userId: string, followerId: string): Promise<boolean>;
  removeFollower(userId: string, followerId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowStatus(followerId: string, followingId: string): Promise<"none" | "pending" | "accepted">;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getPendingFollowRequests(userId: string): Promise<(User & { requestedAt: Date | null })[]>;
  getPendingFollowRequestsCount(userId: string): Promise<number>;
  
  toggleCheers(drinkId: string, userId: string): Promise<boolean>;
  hasCheered(drinkId: string, userId: string): Promise<boolean>;
  getCheersCount(drinkId: string): Promise<number>;
  
  addComment(drinkId: string, userId: string, content: string): Promise<Comment>;
  getComments(drinkId: string): Promise<(Comment & { user: User })[]>;
  
  getTrendingFlavors(): Promise<{ flavor: string; count: number }[]>;
  getFeaturedDrinks(): Promise<Drink[]>;
  getSuggestedUsers(userId: string): Promise<(User & { drinksCount: number; followStatus: "none" | "pending" | "accepted" })[]>;
  getCommunityFeed(userId?: string): Promise<(Drink & { user: User; cheersCount: number; hasCheered: boolean; comments: (Comment & { user: User })[] })[]>;
  
  // Chat features
  areMutualFollowers(userId1: string, userId2: string): Promise<boolean>;
  getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation>;
  getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number; otherUserLastReadAt?: string })[]>;
  sendMessage(conversationId: string, senderId: string, content: string): Promise<Message>;
  getMessages(conversationId: string, userId: string, limit?: number, before?: Date): Promise<Message[]>;
  markConversationRead(conversationId: string, userId: string): Promise<void>;
  getMutualConnections(userId: string): Promise<User[]>;

  // Notifications
  createNotification(userId: string, type: "follow" | "comment" | "cheer", actorId: string, drinkId?: string): Promise<Notification>;
  getNotifications(userId: string): Promise<(Notification & { actor: User })[]>;
  markNotificationsRead(userId: string): Promise<void>;
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

  async updateProfileImage(userId: string, imageData: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ profileImageUrl: imageData })
      .where(eq(users.id, userId))
      .returning();
    return updated;
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
  async sendFollowRequest(followerId: string, followingId: string): Promise<"pending" | "already_following" | "already_pending"> {
    const existing = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    if (existing.length > 0) {
      if (existing[0].status === "accepted") {
        return "already_following";
      }
      return "already_pending";
    }
    
    await db.insert(follows).values({ followerId, followingId, status: "pending" });
    return "pending";
  }

  async acceptFollowRequest(userId: string, followerId: string): Promise<boolean> {
    const result = await db.update(follows)
      .set({ status: "accepted" })
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.followerId, followerId),
        eq(follows.status, "pending")
      ))
      .returning();
    return result.length > 0;
  }

  async declineFollowRequest(userId: string, followerId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.followerId, followerId),
        eq(follows.status, "pending")
      ))
      .returning();
    return result.length > 0;
  }

  async removeFollower(userId: string, followerId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.followerId, followerId)
      ))
      .returning();
    return result.length > 0;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .returning();
    return result.length > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId),
        eq(follows.status, "accepted")
      ));
    return result.length > 0;
  }

  async getFollowStatus(followerId: string, followingId: string): Promise<"none" | "pending" | "accepted"> {
    const result = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    if (result.length === 0) return "none";
    return result[0].status as "pending" | "accepted";
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db.select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(and(eq(follows.followingId, userId), eq(follows.status, "accepted")));
    return result.map(r => r.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db.select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
    return result.map(r => r.user);
  }

  async getFollowersCount(userId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(follows)
      .where(and(eq(follows.followingId, userId), eq(follows.status, "accepted")));
    return result[0]?.count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
    return result[0]?.count || 0;
  }

  async getPendingFollowRequests(userId: string): Promise<(User & { requestedAt: Date | null })[]> {
    const result = await db.select({ user: users, createdAt: follows.createdAt })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(and(eq(follows.followingId, userId), eq(follows.status, "pending")))
      .orderBy(desc(follows.createdAt));
    return result.map(r => ({ ...r.user, requestedAt: r.createdAt }));
  }

  async getPendingFollowRequestsCount(userId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(follows)
      .where(and(eq(follows.followingId, userId), eq(follows.status, "pending")));
    return result[0]?.count || 0;
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

  async getSuggestedUsers(userId: string): Promise<(User & { drinksCount: number; followStatus: "none" | "pending" | "accepted" })[]> {
    const allUsers = await db.select().from(users).where(ne(users.id, userId)).limit(10);
    
    const result = await Promise.all(allUsers.map(async (user) => {
      const userDrinks = await db.select({ count: count() }).from(drinks).where(eq(drinks.userId, user.id));
      const followStatus = await this.getFollowStatus(userId, user.id);
      return {
        ...user,
        drinksCount: userDrinks[0]?.count || 0,
        followStatus
      };
    }));
    
    return result;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await db.select().from(users)
      .where(eq(users.username, username.toLowerCase()));
    return existing.length === 0;
  }

  async setUsername(userId: string, username: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ username: username, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async searchUsers(query: string): Promise<(User & { drinksCount: number })[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    const results = await db.select().from(users)
      .where(
        or(
          like(sql`LOWER(${users.firstName})`, searchPattern),
          like(sql`LOWER(${users.username})`, searchPattern),
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

  async updateUserTheme(userId: string, theme: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ themePreference: theme, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getRecommendations(userId: string): Promise<(Drink & { reason: string })[]> {
    const userDrinks = await this.getDrinks({ userId });
    
    if (userDrinks.length === 0) {
      const popularDrinks = await db
        .select()
        .from(drinks)
        .where(eq(drinks.isPrivate, false))
        .orderBy(desc(drinks.rating))
        .limit(5);
      return popularDrinks.map(d => ({ ...d, reason: "Popular in the community" }));
    }
    
    const highRated = userDrinks.filter(d => parseFloat(d.rating) >= 4);
    const favoriteTypes = Array.from(new Set(highRated.map(d => d.type)));
    const favoriteMakers = Array.from(new Set(highRated.map(d => d.maker)));
    
    const userDrinkIds = userDrinks.map(d => d.id);
    
    let recommendations: Drink[] = [];
    
    if (favoriteTypes.length > 0) {
      const typeMatches = await db
        .select()
        .from(drinks)
        .where(and(
          eq(drinks.isPrivate, false),
          inArray(drinks.type, favoriteTypes),
          sql`${drinks.id} NOT IN (${userDrinkIds.map(id => `'${id}'`).join(',') || "''"})`,
          gte(drinks.rating, "4.0")
        ))
        .orderBy(desc(drinks.rating))
        .limit(5);
      recommendations = typeMatches;
    }
    
    if (recommendations.length < 5 && favoriteMakers.length > 0) {
      const makerMatches = await db
        .select()
        .from(drinks)
        .where(and(
          eq(drinks.isPrivate, false),
          inArray(drinks.maker, favoriteMakers),
          sql`${drinks.id} NOT IN (${userDrinkIds.map(id => `'${id}'`).join(',') || "''"})`,
        ))
        .orderBy(desc(drinks.rating))
        .limit(5 - recommendations.length);
      recommendations = [...recommendations, ...makerMatches];
    }
    
    return recommendations.map(d => ({
      ...d,
      reason: favoriteTypes.includes(d.type) 
        ? `Because you like ${d.type}s` 
        : `From a maker you enjoy`
    }));
  }

  async getUserCircles(userId: string): Promise<(Circle & { memberCount: number; role: string })[]> {
    const memberCircles = await db
      .select({
        circle: circles,
        member: circleMembers
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circleMembers.circleId, circles.id))
      .where(eq(circleMembers.userId, userId));
    
    const result = await Promise.all(memberCircles.map(async (row) => {
      const [memberCount] = await db
        .select({ count: count() })
        .from(circleMembers)
        .where(eq(circleMembers.circleId, row.circle.id));
      
      return {
        ...row.circle,
        memberCount: memberCount?.count || 0,
        role: row.member.role || "member"
      };
    }));
    
    return result;
  }

  async createCircle(data: InsertCircle): Promise<Circle> {
    const [circle] = await db.insert(circles).values(data).returning();
    await db.insert(circleMembers).values({
      circleId: circle.id,
      userId: data.creatorId,
      role: "admin"
    });
    return circle;
  }

  async getCircleById(circleId: string, userId: string): Promise<(Circle & { members: (CircleMember & { user: User })[] }) | null> {
    const [circle] = await db.select().from(circles).where(eq(circles.id, circleId));
    if (!circle) return null;
    
    const isMember = await db
      .select()
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
    
    if (circle.isPrivate && isMember.length === 0) return null;
    
    const members = await db
      .select({ member: circleMembers, user: users })
      .from(circleMembers)
      .innerJoin(users, eq(circleMembers.userId, users.id))
      .where(eq(circleMembers.circleId, circleId));
    
    return {
      ...circle,
      members: members.map(m => ({ ...m.member, user: m.user }))
    };
  }

  async createCircleInvite(data: InsertCircleInvite): Promise<CircleInvite> {
    const [invite] = await db.insert(circleInvites).values(data).returning();
    return invite;
  }

  async getPendingCircleInvites(userId: string): Promise<(CircleInvite & { circle: Circle; inviter: User })[]> {
    const invites = await db
      .select({ invite: circleInvites, circle: circles, inviter: users })
      .from(circleInvites)
      .innerJoin(circles, eq(circleInvites.circleId, circles.id))
      .innerJoin(users, eq(circleInvites.inviterId, users.id))
      .where(and(eq(circleInvites.inviteeId, userId), eq(circleInvites.status, "pending")));
    
    return invites.map(row => ({
      ...row.invite,
      circle: row.circle,
      inviter: row.inviter
    }));
  }

  async acceptCircleInvite(inviteId: string, userId: string): Promise<void> {
    const [invite] = await db
      .select()
      .from(circleInvites)
      .where(and(eq(circleInvites.id, inviteId), eq(circleInvites.inviteeId, userId)));
    
    if (!invite) throw new Error("Invite not found");
    
    await db.update(circleInvites).set({ status: "accepted" }).where(eq(circleInvites.id, inviteId));
    await db.insert(circleMembers).values({
      circleId: invite.circleId,
      userId: userId,
      role: "member"
    });
  }

  async declineCircleInvite(inviteId: string, userId: string): Promise<void> {
    await db
      .update(circleInvites)
      .set({ status: "declined" })
      .where(and(eq(circleInvites.id, inviteId), eq(circleInvites.inviteeId, userId)));
  }

  async createCirclePost(data: InsertCirclePost): Promise<CirclePost> {
    const [post] = await db.insert(circlePosts).values(data).returning();
    return post;
  }

  async getCirclePosts(circleId: string, userId: string): Promise<(CirclePost & { user: User; drink?: Drink })[]> {
    const isMember = await db
      .select()
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
    
    if (isMember.length === 0) return [];
    
    const posts = await db
      .select({ post: circlePosts, user: users })
      .from(circlePosts)
      .innerJoin(users, eq(circlePosts.userId, users.id))
      .where(eq(circlePosts.circleId, circleId))
      .orderBy(desc(circlePosts.createdAt));
    
    const result = await Promise.all(posts.map(async (row) => {
      let drink: Drink | undefined;
      if (row.post.drinkId) {
        drink = await this.getDrinkById(row.post.drinkId);
      }
      return {
        ...row.post,
        user: row.user,
        drink
      };
    }));
    
    return result;
  }

  async processOfflineActions(userId: string, actions: { tempId: string; actionType: string; payload: any }[]): Promise<{ tempId: string; success: boolean; result?: any; error?: string }[]> {
    const results = [];
    
    for (const action of actions) {
      try {
        let result;
        switch (action.actionType) {
          case "create_drink":
            result = await this.createDrink({ ...action.payload, userId });
            break;
          case "update_drink":
            result = await this.updateDrink(action.payload.id, action.payload);
            break;
          case "delete_drink":
            result = await this.deleteDrink(action.payload.id);
            break;
          default:
            throw new Error(`Unknown action type: ${action.actionType}`);
        }
        results.push({ tempId: action.tempId, success: true, result });
      } catch (error: any) {
        results.push({ tempId: action.tempId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Chat features
  async areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
    const [forward] = await db.select().from(follows)
      .where(and(
        eq(follows.followerId, userId1),
        eq(follows.followingId, userId2),
        eq(follows.status, "accepted")
      ));
    
    if (!forward) return false;
    
    const [backward] = await db.select().from(follows)
      .where(and(
        eq(follows.followerId, userId2),
        eq(follows.followingId, userId1),
        eq(follows.status, "accepted")
      ));
    
    return !!backward;
  }

  async getMutualConnections(userId: string): Promise<User[]> {
    const following = await db.select({ userId: follows.followingId })
      .from(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
    
    const followingIds = following.map(f => f.userId);
    if (followingIds.length === 0) return [];
    
    const mutualFollowers = await db.select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(and(
        eq(follows.followingId, userId),
        eq(follows.status, "accepted"),
        inArray(follows.followerId, followingIds)
      ));
    
    return mutualFollowers.map(r => r.user);
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const existingConvos = await db
      .select({ conversation: conversations })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(eq(conversationParticipants.userId, userId1));
    
    for (const c of existingConvos) {
      const participants = await db.select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, c.conversation.id));
      
      if (participants.length === 2 && participants.some(p => p.userId === userId2)) {
        return c.conversation;
      }
    }
    
    const [newConversation] = await db.insert(conversations).values({}).returning();
    
    await db.insert(conversationParticipants).values([
      { conversationId: newConversation.id, userId: userId1 },
      { conversationId: newConversation.id, userId: userId2 }
    ]);
    
    return newConversation;
  }

  async getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number; otherUserLastReadAt?: string })[]> {
    const userConvos = await db
      .select({ conversation: conversations, participant: conversationParticipants })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));
    
    const result = await Promise.all(userConvos.map(async (row) => {
      const otherParticipant = await db.select({ user: users, participant: conversationParticipants })
        .from(conversationParticipants)
        .innerJoin(users, eq(conversationParticipants.userId, users.id))
        .where(and(
          eq(conversationParticipants.conversationId, row.conversation.id),
          ne(conversationParticipants.userId, userId)
        ));
      
      const [lastMessage] = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, row.conversation.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const lastReadAt = row.participant.lastReadAt || new Date(0);
      const [unreadResult] = await db.select({ count: count() })
        .from(messages)
        .where(and(
          eq(messages.conversationId, row.conversation.id),
          ne(messages.senderId, userId),
          gte(messages.createdAt, lastReadAt)
        ));
      
      return {
        ...row.conversation,
        otherUser: otherParticipant[0]?.user || {} as User,
        lastMessage,
        unreadCount: unreadResult?.count || 0,
        otherUserLastReadAt: otherParticipant[0]?.participant.lastReadAt?.toISOString()
      };
    }));
    
    return result.filter(r => r.otherUser.id);
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({ conversationId, senderId, content })
      .returning();
    
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
    
    return message;
  }

  async getMessages(conversationId: string, userId: string, limit: number = 50, before?: Date): Promise<Message[]> {
    const participant = await db.select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
    
    if (participant.length === 0) return [];
    
    const conditions = [eq(messages.conversationId, conversationId)];
    if (before) {
      conditions.push(lte(messages.createdAt, before));
    }
    
    return await db.select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    await db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
  }

  async createNotification(userId: string, type: "follow" | "comment" | "cheer", actorId: string, drinkId?: string): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values({ userId, type, actorId, drinkId })
      .returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<(Notification & { actor: User })[]> {
    const notifs = await db.select({ notification: notifications, actor: users })
      .from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    
    return notifs.map(n => ({ ...n.notification, actor: n.actor }));
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
  }
}

export const storage = new DatabaseStorage();
