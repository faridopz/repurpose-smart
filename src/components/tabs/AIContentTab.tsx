import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface AIContentTabProps {
  userId: string;
}

export default function AIContentTab({ userId }: AIContentTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: aiContent, isLoading } = useQuery({
    queryKey: ["ai-content", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_content")
        .select(`
          *,
          webinars (
            id,
            title
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Content</CardTitle>
          <CardDescription>Transform transcripts into blog posts, social media, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Content</CardTitle>
        <CardDescription>Transform transcripts into blog posts, social media, and more</CardDescription>
      </CardHeader>
      <CardContent>
        {!aiContent || aiContent.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Content Yet</h3>
            <p className="text-muted-foreground">
              Generate AI content from your webinar transcripts
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiContent.map((content: any) => (
              <div
                key={content.id}
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                        {content.content_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {content.webinars?.title || "Untitled Webinar"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.content, content.id)}
                  >
                    {copiedId === content.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">
                  {content.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(content.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
