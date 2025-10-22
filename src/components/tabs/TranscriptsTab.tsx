import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

interface TranscriptsTabProps {
  userId: string;
}

export default function TranscriptsTab({ userId }: TranscriptsTabProps) {
  const navigate = useNavigate();

  const { data: transcripts, isLoading } = useQuery({
    queryKey: ["transcripts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select(`
          *,
          webinars (
            id,
            title,
            created_at
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcripts</CardTitle>
          <CardDescription>View and manage webinar transcriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transcripts || transcripts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Transcripts Yet"
        description="Upload webinars, podcasts, interviews, courses, or presentations to automatically generate AI-powered transcripts with speaker detection, timestamps, keywords, and key insights."
        actionLabel="Upload Content"
        onAction={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcripts</CardTitle>
        <CardDescription>View and manage webinar transcriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transcripts.map((transcript: any) => (
            <div
              key={transcript.id}
              className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">
                    {transcript.webinars?.title || "Untitled Webinar"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transcript.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded capitalize ${
                    transcript.status === "completed"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {transcript.status}
                </span>
              </div>
              {transcript.full_text && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {transcript.full_text}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/webinar/${transcript.webinar_id}`)}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
