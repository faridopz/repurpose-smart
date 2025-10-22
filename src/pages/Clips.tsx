import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Film, Plus, Search, Download, Folder, Tag, Sparkles, Edit, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { openAIAssistant } from "@/components/AIAssistant";

export default function Clips() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [renamingCollection, setRenamingCollection] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [autoTagging, setAutoTagging] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: snippets, isLoading: snippetsLoading, refetch: refetchSnippets } = useQuery({
    queryKey: ["snippets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snippets")
        .select(`
          *,
          webinars (
            id,
            title
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: collections, refetch: refetchCollections } = useQuery({
    queryKey: ["collections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !user) return;

    setCreatingCollection(true);
    try {
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: newCollectionName,
        });

      if (error) throw error;

      toast.success("Collection created!");
      setNewCollectionName("");
      refetchCollections();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleRenameCollection = async (collectionId: string) => {
    if (!renameValue.trim()) return;

    try {
      const { error } = await supabase
        .from("collections")
        .update({ name: renameValue })
        .eq("id", collectionId);

      if (error) throw error;

      toast.success("Collection renamed!");
      setRenamingCollection(null);
      setRenameValue("");
      refetchCollections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDownloadCollection = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from("collection_snippets")
        .select(`
          snippet_id,
          snippets (
            *,
            webinars (title)
          )
        `)
        .eq("collection_id", collectionId);

      if (error) throw error;

      const collection = collections?.find(c => c.id === collectionId);
      const exportData = {
        collection: collection?.name,
        clips: data.map((cs: any) => ({
          webinar: cs.snippets.webinars.title,
          transcript: cs.snippets.transcript_chunk,
          startTime: cs.snippets.start_time,
          endTime: cs.snippets.end_time,
          tags: cs.snippets.tags,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${collection?.name || 'collection'}.json`;
      a.click();
      toast.success("Collection downloaded!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleSnippet = (snippetId: string) => {
    setSelectedSnippets(prev =>
      prev.includes(snippetId)
        ? prev.filter(id => id !== snippetId)
        : [...prev, snippetId]
    );
  };

  const handleAutoTag = async () => {
    if (selectedSnippets.length === 0) {
      toast.error("Please select clips to tag");
      return;
    }

    setAutoTagging(true);
    try {
      const { error } = await supabase.functions.invoke("auto-tag-clips", {
        body: { snippetIds: selectedSnippets },
      });

      if (error) throw error;

      toast.success("Clips tagged successfully!");
      refetchSnippets();
      setSelectedSnippets([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to tag clips");
    } finally {
      setAutoTagging(false);
    }
  };

  const handleAIRecommend = () => {
    if (selectedSnippets.length === 0) {
      toast.error("Please select clips for recommendations");
      return;
    }

    const selectedClipsData = snippets?.filter(s => selectedSnippets.includes(s.id));
    const clipsInfo = selectedClipsData?.map((s, idx) => 
      `Clip ${idx + 1}: "${s.transcript_chunk?.slice(0, 100)}..." (Tags: ${s.tags?.join(', ') || 'none'})`
    ).join('\n\n');

    openAIAssistant(
      `I have ${selectedSnippets.length} video clips. Recommend which clips are best for each platform and why:\n\n${clipsInfo}\n\nProvide specific recommendations for YouTube Shorts, LinkedIn, Instagram Reels, TikTok, and Twitter.`,
      {
        clips: selectedClipsData,
      }
    );
  };

  const handleGeneratePosts = () => {
    if (selectedSnippets.length === 0) {
      toast.error("Please select clips to generate posts");
      return;
    }

    const selectedClipsData = snippets?.filter(s => selectedSnippets.includes(s.id));
    const clipsInfo = selectedClipsData?.map((s, idx) => 
      `Clip ${idx + 1}: "${s.transcript_chunk}" (${Math.floor((s.end_time - s.start_time))}s)`
    ).join('\n\n');

    openAIAssistant(
      `Generate social media posts for these ${selectedSnippets.length} video clips. For each clip, create:\n\n1. LinkedIn post (professional)\n2. Instagram caption (engaging with emojis)\n3. Twitter thread (2-3 tweets)\n\nClips:\n${clipsInfo}`,
      {
        clips: selectedClipsData,
      }
    );
  };

  const filteredSnippets = snippets?.filter(snippet =>
    snippet.webinars?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    snippet.transcript_chunk?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedSnippets = filteredSnippets?.filter(s => s.status === 'suggested');
  const createdSnippets = filteredSnippets?.filter(s => s.status === 'created');

  if (snippetsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!snippets || snippets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div className="p-2 bg-primary rounded-lg">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Clips Library</h1>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <EmptyState
            icon={Film}
            title="No Video Clips Yet"
            description="Create engaging short-form video clips from your webinar highlights. AI automatically suggests the best moments based on sentiment, key topics, and speaker emphasis. Perfect for social media!"
            actionLabel="View Webinars"
            onAction={() => navigate("/dashboard")}
            secondaryActionLabel="Upload New Webinar"
            onSecondaryAction={() => navigate("/dashboard")}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div className="p-2 bg-primary rounded-lg">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Clips Library</h1>
            </div>
            <Badge variant="secondary">{snippets.length} clips</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-muted-foreground">Manage your video highlights and clips</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {selectedSnippets.length > 0 && (
              <>
                <Button onClick={handleAutoTag} disabled={autoTagging} variant="outline">
                  {autoTagging ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="mr-2 h-4 w-4" />
                  )}
                  Auto-Tag ({selectedSnippets.length})
                </Button>
                <Button onClick={handleAIRecommend} className="bg-gradient-to-r from-orange-500 to-amber-400">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Recommend
                </Button>
                <Button onClick={handleGeneratePosts} className="bg-gradient-to-r from-orange-500 to-amber-400">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Posts
                </Button>
              </>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Folder className="mr-2 h-4 w-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                  <DialogDescription>
                    Organize your clips into collections
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="collectionName">Collection Name</Label>
                    <Input
                      id="collectionName"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g., Launch Campaign"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateCollection} 
                    disabled={creatingCollection || !newCollectionName.trim()}
                    className="w-full"
                  >
                    {creatingCollection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Collection
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {collections && collections.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              variant={selectedCollection === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCollection(null)}
            >
              All Clips
            </Button>
            {collections.map(collection => (
              <div key={collection.id} className="flex gap-1">
                <Button
                  variant={selectedCollection === collection.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  <Folder className="mr-2 h-3 w-3" />
                  {collection.name}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRenamingCollection(collection.id);
                    setRenameValue(collection.name);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadCollection(collection.id)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {renamingCollection && (
          <Dialog open={!!renamingCollection} onOpenChange={() => setRenamingCollection(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="New collection name"
                />
                <Button 
                  onClick={() => handleRenameCollection(renamingCollection)}
                  className="w-full"
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips by title, tags, or transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="suggested" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suggested">
              Suggested ({suggestedSnippets?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="created">
              Created ({createdSnippets?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="space-y-4">
            {!suggestedSnippets || suggestedSnippets.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Suggested Highlights</CardTitle>
                  <CardDescription>
                    Upload a webinar and we'll automatically suggest highlights
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestedSnippets.map((snippet: any) => (
                  <Card key={snippet.id} className="overflow-hidden hover:border-orange-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Checkbox
                          checked={selectedSnippets.includes(snippet.id)}
                          onCheckedChange={() => handleToggleSnippet(snippet.id)}
                        />
                        <Badge variant="secondary" className="text-xs">Suggested</Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {snippet.webinars?.title}
                      </CardTitle>
                      <CardDescription>
                        {Math.floor(snippet.start_time / 60)}:{String(Math.floor(snippet.start_time % 60)).padStart(2, '0')} - {Math.floor(snippet.end_time / 60)}:{String(Math.floor(snippet.end_time % 60)).padStart(2, '0')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm line-clamp-3">{snippet.transcript_chunk}</p>
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags?.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {snippet.reason && (
                        <p className="text-xs text-muted-foreground italic">{snippet.reason}</p>
                      )}
                      <Button size="sm" className="w-full" variant="outline">
                        <Film className="mr-2 h-4 w-4" />
                        Create Clip
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="created" className="space-y-4">
            {!createdSnippets || createdSnippets.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Clips Created</CardTitle>
                  <CardDescription>
                    Create clips from suggested highlights
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdSnippets.map((snippet: any) => (
                  <Card key={snippet.id} className="overflow-hidden hover:border-orange-500/50 transition-colors">
                    <div className="aspect-video bg-muted relative">
                      {snippet.thumbnail_url ? (
                        <img src={snippet.thumbnail_url} alt="Clip thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Film className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedSnippets.includes(snippet.id)}
                          onCheckedChange={() => handleToggleSnippet(snippet.id)}
                          className="bg-background/80"
                        />
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base line-clamp-2">
                        {snippet.webinars?.title}
                      </CardTitle>
                      <CardDescription>
                        Duration: {Math.floor((snippet.end_time - snippet.start_time) / 60)}:{String(Math.floor((snippet.end_time - snippet.start_time) % 60)).padStart(2, '0')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags?.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
