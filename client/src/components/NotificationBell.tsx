import { useState, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Notification as DBNotification } from "@shared/schema";

interface Notification extends DBNotification {
  actor: { id: string; firstName?: string; lastName?: string; username?: string };
}

export function NotificationBell({ firebaseUser, isAuthenticated }: { firebaseUser: any; isAuthenticated: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseUser || !isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const newNotifications = data.filter((n: any) => !n.read);
          
          newNotifications.forEach((notif: any) => {
            const actorName = notif.actor.firstName || notif.actor.username || "Someone";
            let message = "";
            if (notif.type === "follow") {
              message = `${actorName} followed you`;
            } else if (notif.type === "comment") {
              message = `${actorName} commented on your drink`;
            } else if (notif.type === "cheer") {
              message = `${actorName} cheered your drink`;
            }
            
            if (message) {
              toast({ title: "New Activity", description: message });
            }
          });
          
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [firebaseUser, isAuthenticated, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "follow":
        return "bg-blue-500";
      case "comment":
        return "bg-purple-500";
      case "cheer":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "follow":
        return "Follow";
      case "comment":
        return "Comment";
      case "cheer":
        return "Cheer";
      default:
        return "";
    }
  };

  const getNotificationMessage = (notif: Notification) => {
    const actorName = notif.actor?.firstName || notif.actor?.username || "Someone";
    switch (notif.type) {
      case "follow":
        return `${actorName} followed you`;
      case "comment":
        return `${actorName} commented on your drink`;
      case "cheer":
        return `${actorName} cheered your drink`;
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
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
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
                      <p className="font-medium text-sm">{getNotificationMessage(notification)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : "Just now"}
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
