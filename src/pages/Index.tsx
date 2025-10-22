import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Sparkles, FileText, Mic, GraduationCap, Users, TrendingUp, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <Video className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              ContentKlipa
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Turn <span className="text-primary">Any Long-Form Content</span> into{" "}
            <span className="text-accent">10+ Viral Clips</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            Webinars • Podcasts • Interviews • Courses • Presentations — Transform any long-form content into bite-sized social media gold
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            ✨ No video editing skills needed • ⚡ Ready in minutes • 🎯 Platform-optimized content
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-8 h-14 text-lg bg-gradient-primary hover:opacity-90 shadow-lg">
              Start Free — Upload Your Content
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="h-14 text-lg">
              Already have an account? Sign In
            </Button>
          </div>

          {/* Value Props */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border">
              <div className="text-3xl font-bold text-primary mb-1">5 min</div>
              <div className="text-sm text-muted-foreground">Average processing time</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border">
              <div className="text-3xl font-bold text-accent mb-1">10+</div>
              <div className="text-sm text-muted-foreground">Content pieces per webinar</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border">
              <div className="text-3xl font-bold text-success mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Time saved vs. manual</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 text-lg">Get content-ready assets in 3 simple steps</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 border shadow-md hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 mt-2">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Upload Your Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Drop your video or audio file from any source: webinar, podcast episode, interview, online course, conference talk, or presentation.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border shadow-md hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4 mt-2">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">AI Does the Magic</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI transcribes, analyzes sentiment, identifies key moments, and generates platform-specific content. All while you grab coffee.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border shadow-md hover:shadow-xl transition-all relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <div className="p-3 bg-success/10 rounded-lg w-fit mb-4 mt-2">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Copy & Publish</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get LinkedIn posts, Twitter threads, Instagram captions, blog articles, and video clips. Just copy and publish — it's that simple.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perfect For <span className="text-primary">Any Long-Form Content</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
            Whether you're a creator, educator, marketer, or business owner — ContentKlipa extracts maximum value from your content
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <Video className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Webinars & Virtual Events</CardTitle>
                <CardDescription>
                  Turn 60-minute presentations into shareable highlights that extend your event's reach and engagement
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <Mic className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Podcasts & Interviews</CardTitle>
                <CardDescription>
                  Extract the best moments from episodes for audiograms, reels, and promotional clips that drive listeners
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Online Courses & Tutorials</CardTitle>
                <CardDescription>
                  Create bite-sized previews and key takeaways to promote your educational content and boost enrollments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Conference Talks & Panels</CardTitle>
                <CardDescription>
                  Transform keynotes and discussions into shareable moments that amplify your message and authority
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Sales & Product Demos</CardTitle>
                <CardDescription>
                  Convert demos into compelling feature highlights and customer testimonials for your marketing funnel
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Workshops & Masterclasses</CardTitle>
                <CardDescription>
                  Extract actionable tips and expert insights to maximize your content's impact and student value
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* What You Get */}
        <div className="mt-24 max-w-4xl mx-auto bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl p-12 border-2 border-primary/20">
          <h2 className="text-3xl font-bold text-center mb-8">What You Get From Every Upload</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Full Transcript</h4>
                <p className="text-sm text-muted-foreground">Searchable, timestamped, speaker-labeled</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">LinkedIn Posts (3 variations)</h4>
                <p className="text-sm text-muted-foreground">Professional, engagement-optimized</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Twitter/X Threads</h4>
                <p className="text-sm text-muted-foreground">Bite-sized, viral-ready content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Blog Article</h4>
                <p className="text-sm text-muted-foreground">SEO-optimized, 800+ words</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Instagram Captions</h4>
                <p className="text-sm text-muted-foreground">With hashtags and emojis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-foreground text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Video Clip Suggestions</h4>
                <p className="text-sm text-muted-foreground">Best moments for shorts & reels</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to 10x Your Content Output?</h2>
          <p className="text-xl text-muted-foreground mb-8">Join creators who are turning every webinar into a content goldmine</p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-8 h-14 text-lg bg-gradient-primary hover:opacity-90 shadow-lg">
            Start Creating Content Now — It's Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
