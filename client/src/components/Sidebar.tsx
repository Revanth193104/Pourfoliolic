
import { LayoutDashboard, PlusCircle, Wine, Search, User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/log", label: "Log Drink", icon: PlusCircle },
    { href: "/cellar", label: "My Cellar", icon: Wine },
    { href: "/discovery", label: "Discovery", icon: Search },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground hidden md:flex fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          Libation
        </h1>
        <p className="text-sm text-muted-foreground">The discerning palate.</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function MobileNav() {
    const [location] = useLocation();
  
    const navItems = [
      { href: "/", label: "Home", icon: LayoutDashboard },
      { href: "/cellar", label: "Cellar", icon: Wine },
      { href: "/log", label: "Log", icon: PlusCircle },
      { href: "/discovery", label: "Find", icon: Search },
      { href: "/profile", label: "Me", icon: User },
    ];
  
    return (
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2 md:hidden z-50">
        <nav className="flex justify-around">
          {navItems.map((item) => (
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
