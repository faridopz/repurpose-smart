import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Copy, Check, FileText, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { openAIAssistant } from "@/components/AIAssistant";

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
    // Parse JSON content if it's stored as JSON
    let textToCopy = content;
    try {
      const parsed = JSON.parse(content);
      if (parsed.text) {
        textToCopy = parsed.text;
        if (parsed.hashtags && parsed.hashtags.length > 0) {
          textToCopy += '\n\n' + parsed.hashtags.map((tag: string) => `#${tag}`).join(' ');
        }
      } else if (parsed.body) {
        textToCopy = `${parsed.title}\n\n${parsed.body}\n\nKey Takeaways:\n${parsed.takeaways?.map((t: string) => `• ${t}`).join('\n')}`;
      }
    } catch {
      // If not JSON, use as is
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefineWithAI = (content: any) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.content);
    } catch {
      parsedContent = { text: content.content };
    }

    const contentText = parsedContent.text || parsedContent.body || content.content;
    const platform = content.platform || 'blog';
    const tone = content.tone || 'professional';
    
    openAIAssistant(
      `Refine this ${platform} content. Current tone: ${tone}.\n\nContent:\n${contentText.slice(0, 500)}...`,
      {
        webinarTitle: content.webinars?.title,
        generatedContent: contentText,
      }
    );
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
        description="Once you have transcripts from webinars, podcasts, interviews, or courses — generate platform-optimized social media posts, blog articles, and marketing copy tailored to your audience."
        actionLabel="View Transcripts"
        onAction={() => navigate("/dashboard")}
        secondaryActionLabel="Upload Content"
        onSecondaryAction={() => navigate("/dashboard")}
      />
    );
  }

  // Group content by platform
  const contentByPlatform = aiContent.reduce((acc: any, content: any) => {
    const platform = content.platform || 'blog';
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(content);
    return acc;
  }, {});

  const platforms = Object.keys(contentByPlatform);

  const renderContent = (content: any) => {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content.content);
    } catch {
      parsedContent = { text: content.content };
    }

    if (parsedContent.body) {
      // Blog post format
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">{parsedContent.title}</h3>
          <p className="text-sm whitespace-pre-wrap line-clamp-6">{parsedContent.body}</p>
          {parsedContent.takeaways && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Key Takeaways:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                {parsedContent.takeaways.map((takeaway: string, i: number) => (
                  <li key={i}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Social post format
    return (
      <div className="space-y-2">
        <p className="text-sm whitespace-pre-wrap line-clamp-4">{parsedContent.text}</p>
        {parsedContent.hashtags && parsedContent.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {parsedContent.hashtags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI-Generated Content
        </CardTitle>
        <CardDescription>Platform-optimized content ready to publish</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={platforms[0]} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {platforms.map((platform) => (
              <TabsTrigger key={platform} value={platform} className="capitalize">
                {platform === 'blog' ? <FileText className="h-4 w-4 mr-1" /> : null}
                {platform}
                <Badge variant="secondary" className="ml-2">
                  {contentByPlatform[platform].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform} value={platform} className="space-y-4 mt-4">
              {contentByPlatform[platform].map((content: any) => (
                <div
                  key={content.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {content.tone && (
                          <Badge variant="outline" className="capitalize">
                            {content.tone}
                          </Badge>
                        )}
                        {content.persona && (
                          <Badge variant="outline" className="text-xs">
                            {content.persona}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {content.webinars?.title || "Untitled Webinar"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefineWithAI(content)}
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Refine
                      </Button>
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
                  </div>

                  {renderContent(content)}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {new Date(content.created_at).toLocaleDateString()}
                    </p>
                    {content.model && (
                      <Badge variant="secondary" className="text-xs">
                        {content.model}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
