import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, FileText, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="p-3 bg-gradient-primary rounded-xl">
              <Video className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold">WebinarAI</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Transform Webinars into Powerful Content
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your webinar recordings and let AI generate transcripts, blog posts, 
            social media content, and analytics — all in one place.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 border shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Transcription</h3>
            <p className="text-muted-foreground">
              Automatically transcribe your webinars with speaker identification and timestamps
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Generation</h3>
            <p className="text-muted-foreground">
              Generate blog posts, social media content, and summaries powered by GPT-4
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-success/10 rounded-lg w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
            <p className="text-muted-foreground">
              Track your content creation activity and optimize your workflow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
