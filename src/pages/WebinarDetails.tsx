import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Loader2, Sparkles, Film, Video, Clock, FileVideo, Scissors } from "lucide-react";
import { toast } from "sonner";
import ContentGenerationModal from "@/components/ContentGenerationModal";

export default function WebinarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [clipContext, setClipContext] = useState("");
  const [generatingClips, setGeneratingClips] = useState(false);

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("webinar_id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    },
    enabled: !!webinar,
  });

  const { data: aiContent, refetch: refetchAIContent } = useQuery({
    queryKey: ["ai_content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_content")
        .select("*")
        .eq("webinar_id", id);

      if (error) throw error;
      return data;
    },
    enabled: !!webinar,
  });

  const { data: snippets } = useQuery({
    queryKey: ["snippets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("webinar_id", id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!webinar,
  });

  const handleStartTranscription = async () => {
    setTranscribing(true);
    try {
      const { error } = await supabase.functions.invoke("transcribe-webinar", {
        body: { webinarId: id },
      });

      if (error) throw error;

      toast.success("Transcription started");
      setTimeout(() => {
        refetchTranscript();
        setTranscribing(false);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to start transcription");
      setTranscribing(false);
    }
  };

  const handleSuggestHighlights = async () => {
    try {
      const { error } = await supabase.functions.invoke("suggest-highlights", {
        body: { webinarId: id },
      });

      if (error) throw error;

      toast.success("Highlights suggested successfully");
      navigate("/clips");
    } catch (error: any) {
      toast.error(error.message || "Failed to suggest highlights");
    }
  };

  const handleGenerateSmartClips = async () => {
    setGeneratingClips(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("generate-smart-clips", {
        body: { 
          webinarId: id,
          clipContext: clipContext.trim() || null
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        // Check if limit reached
        if (error.message?.includes('limit reached')) {
          toast.error(error.message, {
            description: "Upgrade to Pro for 30 clips/month or Enterprise for unlimited clips",
            duration: 6000
          });
        } else {
          throw error;
        }
        return;
      }

      const remainingMsg = data.remainingClips === -1 
        ? "Unlimited clips available" 
        : `${data.remainingClips} clips remaining this month`;

      toast.success(data.message || "Smart clips generated!", {
        description: remainingMsg
      });
      
      navigate("/clips");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate smart clips");
    } finally {
      setGeneratingClips(false);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-6 py-8 max-w-7xl"
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-gradient">{webinar.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(webinar.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <FileVideo className="h-4 w-4" />
                  {(webinar.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
                <Badge variant={webinar.status === "uploaded" ? "secondary" : "default"}>
                  {webinar.status}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!transcript && webinar?.status === "uploaded" && (
                <Button onClick={handleStartTranscription} disabled={transcribing} size="lg">
                  {transcribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Start Processing
                    </>
                  )}
                </Button>
              )}
              {transcript && (
                <>
                  <Button onClick={() => setShowGenerateModal(true)} size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </Button>
                  <Button variant="outline" onClick={handleSuggestHighlights} size="lg">
                    <Film className="mr-2 h-4 w-4" />
                    Find Highlights
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="video" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="highlights" className="gap-2">
              <Film className="h-4 w-4" />
              Highlights
              {snippets && snippets.length > 0 && (
                <Badge variant="secondary" className="ml-1">{snippets.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Content
              {aiContent && aiContent.length > 0 && (
                <Badge variant="secondary" className="ml-1">{aiContent.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Video Tab */}
          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>Webinar Recording</CardTitle>
                <CardDescription>Original uploaded file</CardDescription>
              </CardHeader>
              <CardContent>
                {webinar.file_type.startsWith("video/") ? (
                  <video
                    controls
                    className="w-full rounded-lg border bg-black"
                    src={webinar.file_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="p-8 border rounded-lg bg-muted/20">
                    <audio controls className="w-full" src={webinar.file_url}>
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>
                  {transcript ? "AI-generated transcript with timestamps" : "No transcript available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transcript ? (
                  <div className="space-y-4">
                    {transcript.full_text ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-foreground">{transcript.full_text}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Transcript is being processed...
                      </p>
                    )}
                    
                    {transcript.keywords && transcript.keywords.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3">Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {transcript.keywords.map((keyword: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {transcript.quotes && transcript.quotes.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3">Key Quotes</h3>
                        <div className="space-y-2">
                          {transcript.quotes.map((quote: string, idx: number) => (
                            <blockquote key={idx} className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                              "{quote}"
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No transcript yet</p>
                    {webinar?.status === "uploaded" && (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Highlights Tab */}
          <TabsContent value="highlights">
            <div className="space-y-6">
              {/* Smart Clip Generator */}
              {transcript && (
                <Card className="border-orange-500/20 bg-gradient-to-br from-background to-orange-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg">
                        <Scissors className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Smart Clip Generator</CardTitle>
                        <CardDescription>
                          AI-powered highlight detection with context
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clipContext">
                        Clip Context (Optional)
                      </Label>
                      <Input
                        id="clipContext"
                        placeholder="e.g., Find motivational moments, Key leadership insights, Funny highlights..."
                        value={clipContext}
                        onChange={(e) => setClipContext(e.target.value)}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide context to help AI find the most relevant clips for your needs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleGenerateSmartClips}
                        disabled={generatingClips}
                        className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500"
                      >
                        {generatingClips ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Scissors className="mr-2 h-4 w-4" />
                            Generate Smart Clips
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleSuggestHighlights}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Quick Highlights
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Highlights */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Clips</CardTitle>
                  <CardDescription>
                    {snippets && snippets.length > 0
                      ? "AI-identified video clips from key moments"
                      : "No clips generated yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {snippets && snippets.length > 0 ? (
                    <div className="grid gap-4">
                      {snippets.map((snippet) => (
                        <motion.div
                          key={snippet.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{snippet.reason || "Highlight"}</h4>
                              <p className="text-sm text-muted-foreground">
                                {Math.floor(snippet.start_time)}s - {Math.floor(snippet.end_time)}s 
                                <span className="ml-2 text-orange-500">
                                  ({Math.floor(snippet.end_time - snippet.start_time)}s clip)
                                </span>
                              </p>
                            </div>
                            <Badge variant={snippet.status === 'suggested' ? 'secondary' : 'default'}>
                              {snippet.status}
                            </Badge>
                          </div>
                          {snippet.transcript_chunk && (
                            <p className="text-sm text-muted-foreground italic mt-2 line-clamp-3">
                              "{snippet.transcript_chunk}"
                            </p>
                          )}
                          {snippet.tags && snippet.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {snippet.tags.map((tag, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs capitalize"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No clips yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use the Smart Clip Generator above to create AI-powered highlights
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Content</CardTitle>
                <CardDescription>
                  {aiContent && aiContent.length > 0
                    ? "Social posts and content generated from your webinar"
                    : "No content generated yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiContent && aiContent.length > 0 ? (
                  <div className="space-y-4">
                    {aiContent.map((content) => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{content.content_type}</Badge>
                            {content.platform && <Badge variant="outline">{content.platform}</Badge>}
                          </div>
                          <Badge variant="outline">{content.tone}</Badge>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{content.content}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No AI content yet</p>
                    {transcript && (
                      <Button onClick={() => setShowGenerateModal(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Content
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Content Generation Modal */}
      <ContentGenerationModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        webinarId={id!}
        webinarTitle={webinar.title}
      />
    </div>
  );
}
