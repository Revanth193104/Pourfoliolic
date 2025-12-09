
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">Your settings and preferences.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>User Info</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Profile details coming soon...</p>
            </CardContent>
        </Card>
    </div>
  );
}
