import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AIContentTabProps {
  userId: string;
}

export default function AIContentTab({ userId }: AIContentTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Content</CardTitle>
        <CardDescription>Transform transcripts into blog posts, social media, and more</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Content Generation Coming Soon</h3>
          <p className="text-muted-foreground">
            OpenAI GPT-4 Turbo will help repurpose your transcripts into engaging content
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
