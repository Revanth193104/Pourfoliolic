import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { getIdToken } from "@/lib/firebase";
import { User, Mail, LogOut, Edit2, Check, X, Loader2, AtSign, Download, Settings, Sun, Moon, Monitor } from "lucide-react";

export default function Profile() {
  const { user, isLoading, refetchUser, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!newUsername || newUsername.length < 3 || newUsername === user?.username) {
      setIsUsernameAvailable(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const debounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/check/${encodeURIComponent(newUsername)}`);
        if (response.ok) {
          const data = await response.json();
          setIsUsernameAvailable(data.available);
        }
      } catch (e) {
        console.error("Failed to check username:", e);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [newUsername, user?.username]);

  const handleSaveUsername = async () => {
    if (!isUsernameAvailable && newUsername !== user?.username) return;
    
    setIsSavingUsername(true);
    try {
      const response = await fetch("/api/username/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (response.ok) {
        await refetchUser();
        setIsEditingUsername(false);
        toast({
          title: "Username updated!",
          description: `Your username is now @${newUsername}`,
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update username",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleExportData = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch("/api/drinks/export?format=csv", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pourfoliolic-tastings.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: "Export complete!",
          description: "Your tasting history has been downloaded.",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-profile-title">Profile</h2>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold" data-testid="text-profile-name">{displayName}</h3>
              {user.username && (
                <p className="text-muted-foreground flex items-center gap-1" data-testid="text-profile-username">
                  <AtSign className="h-4 w-4" />
                  {user.username}
                </p>
              )}
              {user.email && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm" data-testid="text-profile-email">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Username</Label>
            {isEditingUsername ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    className="pl-8 pr-10"
                    placeholder="your_username"
                    data-testid="input-edit-username"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {!isCheckingUsername && isUsernameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                    {!isCheckingUsername && isUsernameAvailable === false && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername || (isUsernameAvailable === false)}
                  data-testid="button-save-username"
                >
                  {isSavingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingUsername(false);
                    setNewUsername(user.username || "");
                  }}
                  data-testid="button-cancel-username"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 rounded border bg-muted/50">
                  {user.username ? `@${user.username}` : "No username set"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingUsername(true)}
                  data-testid="button-edit-username"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isCheckingUsername && isUsernameAvailable === false && isEditingUsername && (
              <p className="text-sm text-red-500">This username is already taken</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all your tasting notes as a CSV file
              </p>
            </div>
            <Button onClick={handleExportData} variant="outline" data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <h4 className="font-medium">Theme Preference</h4>
              <p className="text-sm text-muted-foreground">
                Choose your preferred appearance
              </p>
            </div>
            <div className="flex gap-1">
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTheme("light")}
                data-testid="button-theme-light"
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTheme("dark")}
                data-testid="button-theme-dark"
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button 
                variant={theme === "system" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTheme("system")}
                data-testid="button-theme-system"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Auto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
