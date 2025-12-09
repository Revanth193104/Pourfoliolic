
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Discovery() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight">Discovery</h2>
          <p className="text-muted-foreground">Find your next favorite drink.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Recommendations engine coming soon...</p>
            </CardContent>
        </Card>
    </div>
  );
}
