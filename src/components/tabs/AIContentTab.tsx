import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

interface AIContentTabProps {
  userId: string;
}

export default function AIContentTab({ userId }: AIContentTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  if (!aiContent || aiContent.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No AI Content Yet"
        description="Once you have transcripts, generate platform-optimized social media posts, blog articles, and marketing copy tailored to your audience. Choose your tone and target platforms for best results."
        actionLabel="View Transcripts"
        onAction={() => navigate("/dashboard")}
        secondaryActionLabel="Upload Webinar"
        onSecondaryAction={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Content</CardTitle>
        <CardDescription>Transform transcripts into blog posts, social media, and more</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aiContent.map((content: any) => (
            <div
              key={content.id}
              className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="capitalize">
                      {content.content_type}
                    </Badge>
                    {content.platform && (
                      <Badge variant="outline" className="capitalize">
                        {content.platform}
                      </Badge>
                    )}
                    {content.tone && (
                      <Badge variant="outline" className="capitalize">
                        {content.tone}
                      </Badge>
                    )}
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
      </CardContent>
    </Card>
  );
}
