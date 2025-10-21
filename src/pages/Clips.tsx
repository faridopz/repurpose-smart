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
import { Loader2, Film, Plus, Search, Download, Folder, Tag } from "lucide-react";
import { toast } from "sonner";

export default function Clips() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

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

  const handleSuggestHighlights = async (webinarId: string) => {
    try {
      toast.info("Analyzing webinar for highlights...");
      const { error } = await supabase.functions.invoke('suggest-highlights', {
        body: { webinarId }
      });

      if (error) throw error;

      toast.success("Highlights suggested!");
      refetchSnippets();
    } catch (error: any) {
      toast.error(error.message || "Failed to suggest highlights");
    }
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clip Library</h1>
          <p className="text-muted-foreground">Manage your video highlights and clips</p>
        </div>
        
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

      {collections && collections.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCollection === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCollection(null)}
          >
            All Clips
          </Button>
          {collections.map(collection => (
            <Button
              key={collection.id}
              variant={selectedCollection === collection.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCollection(collection.id)}
            >
              <Folder className="mr-2 h-3 w-3" />
              {collection.name}
            </Button>
          ))}
        </div>
      )}

      <div className="relative">
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
                <Card key={snippet.id} className="overflow-hidden">
                  <CardHeader>
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
                    <p className="text-xs text-muted-foreground">{snippet.reason}</p>
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
                <Card key={snippet.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {snippet.thumbnail_url ? (
                      <img src={snippet.thumbnail_url} alt="Clip thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Film className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
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
    </div>
  );
}