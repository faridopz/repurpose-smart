import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, FileText, Sparkles as SparklesIcon, BarChart3, Settings, LogOut, Film, Upload } from "lucide-react";
import { toast } from "sonner";
import UploadTab from "./tabs/UploadTab";
import TranscriptsTab from "./tabs/TranscriptsTab";
import AIContentTab from "./tabs/AIContentTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import SettingsTab from "./tabs/SettingsTab";
import RecentOutputsTab from "./tabs/RecentOutputsTab";

export default function DashboardLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("uploads");
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                  ContentKlipa
                </h1>
                <p className="text-xs text-muted-foreground">1 Webinar → 10+ Content Pieces</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                onClick={() => {
                  setActiveTab("uploads");
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden sm:flex bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white border-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-7xl pt-24">
        {/* Process Flow Guide */}
        <div className="mb-8 bg-card border rounded-lg p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">YOUR WORKFLOW</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab("uploads")}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                activeTab === "uploads" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 ${activeTab === "uploads" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Video className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">1. Upload</span>
              <span className="text-xs text-muted-foreground text-center">Start with your webinar</span>
            </button>
            
            <button
              onClick={() => setActiveTab("transcripts")}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                activeTab === "transcripts" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 ${activeTab === "transcripts" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">2. Transcribe</span>
              <span className="text-xs text-muted-foreground text-center">AI extracts insights</span>
            </button>
            
            <button
              onClick={() => setActiveTab("ai-content")}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                activeTab === "ai-content" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`p-3 rounded-full mb-2 ${activeTab === "ai-content" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <SparklesIcon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">3. Generate</span>
              <span className="text-xs text-muted-foreground text-center">Create social content</span>
            </button>
            
            <button
              onClick={() => navigate("/clips")}
              className="flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:scale-105 border-border hover:border-primary/50"
            >
              <div className="p-3 rounded-full mb-2 bg-muted">
                <Film className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">4. Create Clips</span>
              <span className="text-xs text-muted-foreground text-center">Short highlight videos</span>
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden">
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            <TabsTrigger value="ai-content">AI Content</TabsTrigger>
            <TabsTrigger value="recent">Recent Outputs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            <UploadTab userId={user.id} />
          </TabsContent>

          <TabsContent value="transcripts">
            <TranscriptsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="ai-content">
            <AIContentTab userId={user.id} />
          </TabsContent>

          <TabsContent value="recent">
            <RecentOutputsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
