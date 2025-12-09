import { useState } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "feature" | "update" | "tip";
}

const NOTIFICATIONS_KEY = "pourfoliolic_notifications";
const SEEN_IDS_KEY = "pourfoliolic_seen_notifications";

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "customizable-dashboard",
    title: "Customizable Dashboard",
    message: "You can now personalize your dashboard! Click the settings icon to show/hide widgets and reorder them.",
    date: new Date().toISOString(),
    read: false,
    type: "feature",
  },
  {
    id: "page-transitions",
    title: "Smooth Transitions",
    message: "We've added beautiful animated transitions between pages for a smoother experience.",
    date: new Date().toISOString(),
    read: false,
    type: "feature",
  },
  {
    id: "remember-me",
    title: "Remember Me Option",
    message: "Stay signed in! Toggle 'Remember me' when signing in to keep your session active.",
    date: new Date().toISOString(),
    read: false,
    type: "feature",
  },
  {
    id: "welcome-tip",
    title: "Welcome to Pourfoliolic!",
    message: "Start logging your favorite drinks to build your personal tasting journal. Track wines, beers, spirits, and cocktails!",
    date: new Date().toISOString(),
    read: false,
    type: "tip",
  },
];

function loadNotifications(): Notification[] {
  try {
    const seenIds = JSON.parse(localStorage.getItem(SEEN_IDS_KEY) || "[]") as string[];
    return DEFAULT_NOTIFICATIONS.map(n => ({
      ...n,
      read: seenIds.includes(n.id),
    }));
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

function saveSeenNotifications(notifications: Notification[]) {
  try {
    const seenIds = notifications.filter(n => n.read).map(n => n.id);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(seenIds));
  } catch (e) {
    console.error("Failed to save notification state:", e);
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      saveSeenNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveSeenNotifications(updated);
      return updated;
    });
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "feature":
        return "bg-blue-500";
      case "update":
        return "bg-green-500";
      case "tip":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "feature":
        return "New Feature";
      case "update":
        return "Update";
      case "tip":
        return "Tip";
      default:
        return "";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium"
                data-testid="badge-notification-count"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={false}
                  animate={{ opacity: notification.read ? 0.7 : 1 }}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(notification.type)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(notification.type)}
                        </span>
                        {!notification.read && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
