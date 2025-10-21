import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Video, FileText, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsTabProps {
  userId: string;
}

export default function AnalyticsTab({ userId }: AnalyticsTabProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics", userId],
    queryFn: async () => {
      const [webinarsResult, transcriptsResult, aiContentResult] = await Promise.all([
        supabase.from("webinars").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("transcripts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("ai_content").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      return {
        webinars: webinarsResult.count || 0,
        transcripts: transcriptsResult.count || 0,
        aiContent: aiContentResult.count || 0,
      };
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webinars")
        .select("id, title, created_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || activityLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Track your webinar repurposing activity</CardDescription>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.webinars || 0}</p>
                <p className="text-sm text-muted-foreground">Total Webinars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.transcripts || 0}</p>
                <p className="text-sm text-muted-foreground">Transcripts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.aiContent || 0}</p>
                <p className="text-sm text-muted-foreground">AI Content Pieces</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest webinar uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
