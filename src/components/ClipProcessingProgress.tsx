import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, Video } from "lucide-react";

interface ClipProcessingProgressProps {
  userId: string;
}

export default function ClipProcessingProgress({ userId }: ClipProcessingProgressProps) {
  const { data: processingClips } = useQuery({
    queryKey: ["processing-clips", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snippets")
        .select("id, status, reason, created_at")
        .eq("user_id", userId)
        .eq("status", "suggested")
        .is("url", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Check every 5 seconds
  });

  if (!processingClips || processingClips.length === 0) {
    return null;
  }

  const recentClips = processingClips.filter(clip => {
    const createdAt = new Date(clip.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 1; // Only show clips from last hour
  });

  if (recentClips.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500/20 bg-gradient-to-br from-background to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Processing Video Clips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {recentClips.length} clip{recentClips.length !== 1 ? 's' : ''} being processed
            </span>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              ~2-5 min
            </Badge>
          </div>
          
          <Progress value={30} className="h-2" />
          
          <div className="space-y-2">
            {recentClips.slice(0, 3).map((clip) => (
              <div key={clip.id} className="flex items-center gap-2 text-xs">
                <Video className="h-3 w-3 text-orange-500" />
                <span className="text-muted-foreground truncate">{clip.reason}</span>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Clips will automatically appear when ready. You can navigate away and come back later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
