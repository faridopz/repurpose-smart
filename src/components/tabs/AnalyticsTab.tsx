import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface AnalyticsTabProps {
  userId: string;
}

export default function AnalyticsTab({ userId }: AnalyticsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Track your webinar repurposing activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground">
            View insights on uploads, transcriptions, and AI-generated content
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
