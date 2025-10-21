import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, FileText, Sparkles, Film } from "lucide-react";
import { toast } from "sonner";
import ContentGenerationModal from "@/components/ContentGenerationModal";

export default function WebinarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

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

  const { data: transcript, refetch: refetchTranscript } = useQuery({
    queryKey: ["transcript", id],
    enabled: !!id,
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

  const { data: aiContent, refetch: refetchAiContent } = useQuery({
    queryKey: ["ai-content", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_content")
        .select("*")
        .eq("webinar_id", id);

      if (error) throw error;
      return data;
    },
  });

  const { data: snippets } = useQuery({
    queryKey: ["snippets", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("webinar_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleStartTranscription = async () => {
    setTranscribing(true);
    try {
      const { error } = await supabase.functions.invoke('transcribe-webinar', {
        body: { webinarId: id }
      });

      if (error) throw error;

      toast.success("Transcription started!");
      setTimeout(() => {
        refetchTranscript();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to start transcription");
    } finally {
      setTranscribing(false);
    }
  };

  const handleSuggestHighlights = async () => {
    try {
      toast.info("Analyzing webinar for highlights...");
      const { error } = await supabase.functions.invoke('suggest-highlights', {
        body: { webinarId: id }
      });

      if (error) throw error;

      toast.success("Highlights suggested! Check the Clips page");
      navigate('/clips');
    } catch (error: any) {
      toast.error(error.message || "Failed to suggest highlights");
    }
  };

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
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            {transcript && (
              <>
                <Button onClick={() => setShowGenerateModal(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </Button>
                <Button variant="outline" onClick={handleSuggestHighlights}>
                  <Film className="mr-2 h-4 w-4" />
                  Suggest Highlights
                </Button>
              </>
            )}
            {!transcript && webinar?.status === 'uploaded' && (
              <Button onClick={handleStartTranscription} disabled={transcribing}>
                {transcribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Start Transcription
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

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
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Content</CardTitle>
                <CardDescription>Content generated from transcript</CardDescription>
              </CardHeader>
              <CardContent>
                {!aiContent || aiContent.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No AI content generated yet</p>
                    {transcript && (
                      <Button onClick={() => setShowGenerateModal(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Content
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiContent.map((content: any) => (
                      <div key={content.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{content.content_type}</Badge>
                          {content.platform && <Badge variant="outline">{content.platform}</Badge>}
                          {content.tone && <Badge variant="outline">{content.tone}</Badge>}
                        </div>
                        <p className="text-sm whitespace-pre-wrap line-clamp-4">
                          {typeof content.content === 'string' 
                            ? content.content 
                            : JSON.stringify(content.content, null, 2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {snippets && snippets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Suggested Highlights</CardTitle>
                  <CardDescription>{snippets.length} clips suggested</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {snippets.slice(0, 3).map((snippet: any) => (
                      <div key={snippet.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium">{snippet.reason}</p>
                          <Badge variant="secondary">{snippet.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(snippet.start_time / 60)}:{String(Math.floor(snippet.start_time % 60)).padStart(2, '0')} - {Math.floor(snippet.end_time / 60)}:{String(Math.floor(snippet.end_time % 60)).padStart(2, '0')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/clips')}>
                    <Film className="mr-2 h-4 w-4" />
                    View All Clips
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {webinar && (
        <ContentGenerationModal
          open={showGenerateModal}
          onOpenChange={(open) => {
            setShowGenerateModal(open);
            if (!open) refetchAiContent();
          }}
          webinarId={webinar.id}
          webinarTitle={webinar.title}
        />
      )}
    </div>
  );
}
