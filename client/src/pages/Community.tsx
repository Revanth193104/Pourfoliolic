import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Wine, Beer, Martini, GlassWater, Star, Search, Users, 
  Heart, MessageCircle, UserPlus, TrendingUp, Sparkles, Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIdToken } from "@/lib/firebase";
import type { Drink } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DrinkWithUser extends Drink {
  user?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  cheersCount?: number;
  hasCheered?: boolean;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    };
  }>;
}

interface TrendingFlavor {
  flavor: string;
  count: number;
}

interface UserProfile {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  email: string | null;
  followersCount: number;
  followingCount: number;
  drinksCount: number;
  isFollowing: boolean;
}

const getUserDisplayName = (user: { username?: string | null; firstName?: string | null; lastName?: string | null } | undefined | null): string => {
  if (!user) return "Anonymous";
  if (user.username) return `@${user.username}`;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || "Anonymous";
};

const getUserInitial = (user: { username?: string | null; firstName?: string | null } | undefined | null): string => {
  if (!user) return "U";
  if (user.username) return user.username[0].toUpperCase();
  if (user.firstName) return user.firstName[0].toUpperCase();
  return "U";
};

export default function Community() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [drinks, setDrinks] = useState<DrinkWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrink, setSelectedDrink] = useState<DrinkWithUser | null>(null);
  const [trendingFlavors, setTrendingFlavors] = useState<TrendingFlavor[]>([]);
  const [featuredDrinks, setFeaturedDrinks] = useState<DrinkWithUser[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [viewingUser, setViewingUser] = useState<{
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    followersCount: number;
    followingCount: number;
    drinksCount: number;
    drinks: DrinkWithUser[];
  } | null>(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    setLoadingUserProfile(true);
    try {
      const response = await fetch(`/api/community/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setViewingUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoadingUserProfile(false);
    }
  };

  useEffect(() => {
    fetchPublicDrinks();
    fetchTrendingFlavors();
    fetchFeaturedDrinks();
    if (isAuthenticated) {
      fetchSuggestedUsers();
      fetchFollowers();
      fetchFollowing();
    }
  }, [isAuthenticated]);

  const fetchPublicDrinks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("searchQuery", searchQuery);
      params.set("sortBy", "date");
      params.set("sortOrder", "desc");

      const response = await fetch(`/api/community/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDrinks(data);
      }
    } catch (error) {
      console.error("Failed to fetch public drinks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingFlavors = async () => {
    try {
      const response = await fetch("/api/community/trending");
      if (response.ok) {
        const data = await response.json();
        setTrendingFlavors(data);
      }
    } catch (error) {
      console.error("Failed to fetch trending flavors:", error);
    }
  };

  const fetchFeaturedDrinks = async () => {
    try {
      const response = await fetch("/api/community/featured");
      if (response.ok) {
        const data = await response.json();
        setFeaturedDrinks(data);
      }
    } catch (error) {
      console.error("Failed to fetch featured drinks:", error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/community/suggested-users", { headers });
      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/community/followers", { headers });
      if (response.ok) {
        const data = await response.json();
        setFollowers(data);
      }
    } catch (error) {
      console.error("Failed to fetch followers:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/community/following", { headers });
      if (response.ok) {
        const data = await response.json();
        setFollowing(data);
      }
    } catch (error) {
      console.error("Failed to fetch following:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/community/search-users?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchedUsers(data);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (userSearchQuery) {
        searchUsers(userSearchQuery);
      } else {
        setSearchedUsers([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [userSearchQuery]);

  const handleCheers = async (drinkId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to cheer drinks!",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api/community/cheers/${drinkId}`, {
        method: "POST",
        headers,
      });
      if (response.ok) {
        setDrinks(drinks.map(d => {
          if (d.id === drinkId) {
            return {
              ...d,
              hasCheered: !d.hasCheered,
              cheersCount: (d.cheersCount || 0) + (d.hasCheered ? -1 : 1)
            };
          }
          return d;
        }));
      }
    } catch (error) {
      console.error("Failed to cheer:", error);
    }
  };

  const handleComment = async (drinkId: string) => {
    if (!isAuthenticated || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api/community/comments/${drinkId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: commentText }),
      });
      if (response.ok) {
        const newComment = await response.json();
        if (selectedDrink) {
          setSelectedDrink({
            ...selectedDrink,
            comments: [...(selectedDrink.comments || []), newComment]
          });
        }
        setCommentText("");
        toast({
          title: "Comment added!",
          description: "Your comment has been posted."
        });
      }
    } catch (error) {
      console.error("Failed to comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users!",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api/community/follow/${userId}`, {
        method: "POST",
        headers,
      });
      if (response.ok) {
        setSuggestedUsers(suggestedUsers.map(u => {
          if (u.id === userId) {
            return { ...u, isFollowing: !u.isFollowing };
          }
          return u;
        }));
        setSearchedUsers(searchedUsers.map(u => {
          if (u.id === userId) {
            return { ...u, isFollowing: !u.isFollowing };
          }
          return u;
        }));
        fetchFollowers();
        fetchFollowing();
        toast({
          title: "Success!",
          description: "Follow status updated."
        });
      }
    } catch (error) {
      console.error("Failed to follow:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "wine": return <Wine className="h-5 w-5" />;
      case "beer": return <Beer className="h-5 w-5" />;
      case "spirit": return <Martini className="h-5 w-5" />;
      case "cocktail": return <GlassWater className="h-5 w-5" />;
      default: return <Wine className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent" data-testid="text-community-title">
          Community
        </h2>
        <p className="text-muted-foreground">Connect with fellow drink enthusiasts.</p>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed" data-testid="tab-feed">
            <Clock className="h-4 w-4 mr-2" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover">
            <Sparkles className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="people" data-testid="tab-people">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-community-search"
              placeholder="Search tastings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading activity...
            </div>
          ) : drinks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No public tastings yet</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to share with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {drinks.map((drink) => (
                <Card key={drink.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-community-drink-${drink.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => drink.user?.id && fetchUserProfile(drink.user.id)}
                      >
                        <AvatarImage src={drink.user?.profileImageUrl || undefined} />
                        <AvatarFallback>{getUserInitial(drink.user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="font-medium text-sm cursor-pointer hover:underline"
                            onClick={() => drink.user?.id && fetchUserProfile(drink.user.id)}
                          >
                            {getUserDisplayName(drink.user)}
                          </span>
                          <span className="text-xs text-muted-foreground">shared a tasting</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {drink.imageUrl ? (
                              <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                            ) : (
                              getTypeIcon(drink.type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{drink.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{drink.maker}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{drink.type}</Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-medium">{drink.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {drink.finish && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            "{drink.finish}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={drink.hasCheered ? "text-red-500" : ""}
                            onClick={() => handleCheers(drink.id)}
                            data-testid={`button-cheers-${drink.id}`}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${drink.hasCheered ? "fill-current" : ""}`} />
                            {drink.cheersCount || 0}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDrink(drink)}
                                data-testid={`button-comments-${drink.id}`}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {drink.comments?.length || 0}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Comments</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                {selectedDrink?.comments?.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.user?.profileImageUrl || undefined} />
                                      <AvatarFallback>{getUserInitial(comment.user)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{getUserDisplayName(comment.user)}</p>
                                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                                {(!selectedDrink?.comments || selectedDrink.comments.length === 0) && (
                                  <p className="text-center text-muted-foreground py-4">No comments yet</p>
                                )}
                              </div>
                              {isAuthenticated && (
                                <div className="flex gap-2 pt-4 border-t">
                                  <Textarea
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="min-h-[60px]"
                                  />
                                  <Button
                                    onClick={() => selectedDrink && handleComment(selectedDrink.id)}
                                    disabled={submittingComment || !commentText.trim()}
                                  >
                                    Post
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Trending Flavors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendingFlavors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trendingFlavors.map((flavor, i) => (
                      <Badge 
                        key={flavor.flavor} 
                        variant={i < 3 ? "default" : "secondary"}
                        className="text-sm"
                      >
                        {flavor.flavor} ({flavor.count})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No trending flavors yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Featured Picks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {featuredDrinks.length > 0 ? (
                  featuredDrinks.slice(0, 3).map((drink) => (
                    <div key={drink.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {drink.imageUrl ? (
                          <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                        ) : (
                          getTypeIcon(drink.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{drink.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{drink.maker}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm">{drink.rating}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No featured picks yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Drink Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Based on community favorites and trending tastings
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {featuredDrinks.slice(0, 6).map((drink) => (
                  <div key={drink.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {drink.imageUrl ? (
                          <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                        ) : (
                          getTypeIcon(drink.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{drink.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{drink.type}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {drink.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Find People</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-user-search"
                  placeholder="Search by name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchingUsers ? (
                <div className="text-center py-4 text-muted-foreground">Searching...</div>
              ) : userSearchQuery && searchedUsers.length > 0 ? (
                <div className="space-y-4">
                  {searchedUsers.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                        onClick={() => fetchUserProfile(profile.id)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.profileImageUrl || undefined} />
                          <AvatarFallback>{getUserInitial(profile)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium hover:underline">{getUserDisplayName(profile)}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.drinksCount} tastings
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={profile.isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleFollow(profile.id)}
                        data-testid={`button-follow-search-${profile.id}`}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {profile.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : userSearchQuery ? (
                <div className="text-center py-4 text-muted-foreground">No users found</div>
              ) : null}
            </CardContent>
          </Card>

          {isAuthenticated && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Followers ({followers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.map((follower: any) => (
                        <div 
                          key={follower.id} 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                          onClick={() => fetchUserProfile(follower.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={follower.profileImageUrl || undefined} />
                            <AvatarFallback>{getUserInitial(follower)}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium hover:underline">{getUserDisplayName(follower)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No followers yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Following ({following.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {following.length > 0 ? (
                    <div className="space-y-3">
                      {following.map((followed: any) => (
                        <div 
                          key={followed.id} 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                          onClick={() => fetchUserProfile(followed.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={followed.profileImageUrl || undefined} />
                            <AvatarFallback>{getUserInitial(followed)}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium hover:underline">{getUserDisplayName(followed)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Not following anyone yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Suggested to Follow</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestedUsers.length > 0 ? (
                <div className="space-y-4">
                  {suggestedUsers.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                        onClick={() => fetchUserProfile(profile.id)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.profileImageUrl || undefined} />
                          <AvatarFallback>{getUserInitial(profile)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium hover:underline">{getUserDisplayName(profile)}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile.drinksCount} tastings
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={profile.isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleFollow(profile.id)}
                        data-testid={`button-follow-${profile.id}`}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {profile.isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isAuthenticated 
                      ? "No suggestions yet. More users will appear as the community grows!"
                      : "Sign in to discover other enthusiasts"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={viewingUser?.profileImageUrl || undefined} />
                <AvatarFallback>{getUserInitial(viewingUser)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getUserDisplayName(viewingUser)}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {viewingUser?.followersCount || 0} followers · {viewingUser?.followingCount || 0} following
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Tastings ({viewingUser?.drinksCount || 0})
            </h4>
            {loadingUserProfile ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : viewingUser?.drinks && viewingUser.drinks.length > 0 ? (
              <div className="space-y-3">
                {viewingUser.drinks.map((drink) => (
                  <div key={drink.id} className="p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {drink.imageUrl ? (
                          <img src={drink.imageUrl} alt={drink.name} className="h-full w-full object-cover" />
                        ) : (
                          getTypeIcon(drink.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{drink.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{drink.maker}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{drink.type}</Badge>
                          <span className="text-xs flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {drink.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No public tastings yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
