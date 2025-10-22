import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, FileText, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

interface RecentOutputsTabProps {
  userId: string;
}

export default function RecentOutputsTab({ userId }: RecentOutputsTabProps) {
  const navigate = useNavigate();

  const { data: recentOutputs, isLoading } = useQuery({
    queryKey: ["recent-outputs", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_content")
        .select(`
          id,
          content_type,
          platform,
          tone,
          created_at,
          webinars (
            id,
            title
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Outputs</CardTitle>
          <CardDescription>Your latest AI-generated content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentOutputs || recentOutputs.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No AI Outputs Yet"
        description="Generate your first AI content from webinar transcripts to see them here."
        actionLabel="Upload Webinar"
        onAction={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recent AI Outputs
        </CardTitle>
        <CardDescription>Your latest AI-generated content across all platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentOutputs.map((output) => (
            <div
              key={output.id}
              className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {output.content_type === 'blog' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-medium text-sm">
                      {output.webinars?.title || "Untitled Webinar"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {output.platform}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">
                      {output.tone}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(output.created_at).toLocaleDateString()} at{" "}
                      {new Date(output.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
