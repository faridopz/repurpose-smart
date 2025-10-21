import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebinarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: webinar, isLoading } = useQuery({
    queryKey: ["webinar", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webinars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: transcript } = useQuery({
    queryKey: ["transcript", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("webinar_id", id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: aiContent } = useQuery({
    queryKey: ["ai-content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_content")
        .select("*")
        .eq("webinar_id", id);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading webinar...</p>
        </div>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Webinar not found</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{webinar.title}</h1>
          <p className="text-muted-foreground">
            Uploaded {new Date(webinar.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Webinar Video</CardTitle>
              <CardDescription>Original uploaded file</CardDescription>
            </CardHeader>
            <CardContent>
              {webinar.file_type.startsWith("video/") ? (
                <video
                  controls
                  className="w-full rounded-lg"
                  src={webinar.file_url}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <audio controls className="w-full" src={webinar.file_url}>
                  Your browser does not support the audio tag.
                </audio>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
              <CardDescription>Details about the upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{webinar.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Type:</span>
                <span className="font-medium">{webinar.file_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">
                  {(webinar.file_size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              {webinar.duration_seconds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {Math.floor(webinar.duration_seconds / 60)}:
                    {String(webinar.duration_seconds % 60).padStart(2, "0")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript">
              <FileText className="mr-2 h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="ai-content">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>
                  {transcript ? "Transcription complete" : "No transcript available yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transcript ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{transcript.full_text}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Transcript will appear here once processing is complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-content" className="mt-6">
            {aiContent && aiContent.length > 0 ? (
              <div className="space-y-6">
                {aiContent.map((content) => (
                  <Card key={content.id}>
                    <CardHeader>
                      <CardTitle className="capitalize">{content.content_type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{content.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No AI Content Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      AI-generated content will appear here once created
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
