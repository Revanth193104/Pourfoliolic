import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const APP_VERSION = "1.0.0";
const VERSION_KEY = "pourfoliolic_app_version";

export function useAppUpdateChecker() {
  const { toast } = useToast();

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch("/api/version");
        if (response.ok) {
          const data = await response.json();
          const storedVersion = localStorage.getItem(VERSION_KEY);
          
          if (storedVersion && data.version !== storedVersion && data.version !== APP_VERSION) {
            toast({
              title: "App Updated",
              description: "Refresh the page to see the latest changes!",
              action: {
                label: "Refresh",
                onClick: () => window.location.reload(),
              },
            });
          }
          
          localStorage.setItem(VERSION_KEY, data.version);
        }
      } catch (error) {
        console.error("Error checking for app updates:", error);
      }
    };

    checkForUpdates();
  }, [toast]);
}
