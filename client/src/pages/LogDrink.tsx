
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogDrink() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight">Log a Drink</h2>
          <p className="text-muted-foreground">Record your latest tasting experience.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Form coming soon...</p>
            </CardContent>
        </Card>
    </div>
  );
}
