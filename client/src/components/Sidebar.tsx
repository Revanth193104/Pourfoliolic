import { useState, useEffect } from "react";
import { LayoutDashboard, PlusCircle, Wine, Martini, Users, MessageCircle, User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import type { User as UserType } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function UserSection({ user }: { user: UserType }) {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-3 py-2">
        {user.profileImageUrl ? (
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {user.username && (
            <Link href="/profile">
              <p className="text-sm font-bold truncate hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors" data-testid="text-user-username">
                {user.username}
              </p>
            </Link>
          )}
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button 
            data-testid="button-logout"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} data-testid="button-confirm-logout">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, firebaseUser, isAuthenticated, isLoading } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser || !isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("/api/chat/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadMessageCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [firebaseUser, isAuthenticated]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
    { href: "/log", label: "Log Drink", icon: PlusCircle, requiresAuth: true },
    { href: "/cellar", label: "My Cellar", icon: Wine, requiresAuth: true },
    { href: "/cocktails", label: "Cocktail Library", icon: Martini, requiresAuth: false },
    { href: "/community", label: "Community", icon: Users, requiresAuth: false },
    { href: "/chat", label: "Messages", icon: MessageCircle, requiresAuth: true },
    { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  const visibleNavItems = navItems.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gradient-to-b from-card via-card to-purple-950/10 text-card-foreground hidden md:flex fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Pourfoliolic
            </h1>
            <p className="text-sm text-muted-foreground">Your tasting journey.</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && <NotificationBell firebaseUser={firebaseUser} isAuthenticated={isAuthenticated} />}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {visibleNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/chat" && unreadMessageCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs" data-testid="badge-unread-messages">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        {isLoading ? (
          <div className="text-sm text-muted-foreground px-3 py-2">Loading...</div>
        ) : isAuthenticated && user ? (
          <UserSection user={user} />
        ) : null}
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard, requiresAuth: true },
    { href: "/cellar", label: "Cellar", icon: Wine, requiresAuth: true },
    { href: "/log", label: "Log", icon: PlusCircle, requiresAuth: true },
    { href: "/community", label: "Community", icon: Users, requiresAuth: false },
    { href: "/profile", label: "Me", icon: User, requiresAuth: true },
  ];

  const visibleNavItems = navItems.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2 md:hidden z-50">
      <nav className="flex justify-around">
        {visibleNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                location === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
