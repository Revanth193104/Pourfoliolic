
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Cellar() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight">My Cellar</h2>
          <p className="text-muted-foreground">Your history of tastings.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Collection</CardTitle>
            </CardHeader>
            <CardContent>
                <p>List view coming soon...</p>
            </CardContent>
        </Card>
    </div>
  );
}
