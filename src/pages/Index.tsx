import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Sparkles, FileText, Mic, GraduationCap, Users, TrendingUp, BookOpen, Upload, Brain, Zap, Target, Clock, CheckCircle, ArrowRight } from "lucide-react";

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

        {/* About Section */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-primary">ContentKlipa</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The AI-powered platform that transforms hours of content into days of social media posts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">The Problem We Solve</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You spend hours creating valuable long-form content — webinars, podcasts, interviews, courses. But after publishing, that content sits unused while you struggle to keep up with daily social media demands.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Manual repurposing is time-consuming, expensive, and requires multiple tools. Most creators end up leaving 90% of their best content value untapped.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-2xl font-bold">Our Solution</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ContentKlipa uses advanced AI to automatically extract the most engaging moments, generate platform-optimized content, and create viral-ready clips — all from a single upload.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Smart AI Analysis</p>
                      <p className="text-sm text-muted-foreground">Identifies sentiment peaks, key topics, and quotable moments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Platform Optimization</p>
                      <p className="text-sm text-muted-foreground">Tailored content for LinkedIn, Twitter, Instagram, TikTok</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Time Multiplier</p>
                      <p className="text-sm text-muted-foreground">Turn 1 hour of content into 30+ days of social posts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>For Creators & Educators</CardTitle>
                  </div>
                  <CardDescription>
                    Stop spending hours editing clips and writing posts. Focus on creating great content while ContentKlipa handles the distribution.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>For Marketers & Businesses</CardTitle>
                  </div>
                  <CardDescription>
                    Maximize ROI from your content investments. Every webinar, demo, or event becomes a content library that keeps working for months.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>For Agencies & Teams</CardTitle>
                  </div>
                  <CardDescription>
                    Scale your content production without scaling headcount. Deliver more value to clients with faster turnarounds.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* How It Works - Enhanced */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From upload to published content in minutes — here's the complete workflow
            </p>
          </div>
          
          {/* Step-by-step workflow */}
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 order-2 md:order-1">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-2xl font-bold">Upload Your Content</h3>
                </div>
                <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
                  Simply drag and drop your video or audio file. We support all major formats including MP4, MP3, MOV, and WAV.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Support for files up to 1GB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Automatic format detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Secure cloud storage</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 order-1 md:order-2">
                <Card className="border-2 border-primary/20 p-8 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                  <div className="text-center">
                    <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Webinars • Podcasts • Interviews</p>
                    <p className="text-muted-foreground">Courses • Demos • Presentations</p>
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Upload time: ~30 seconds</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-8 w-8 text-primary rotate-90 md:rotate-0" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <Card className="border-2 border-primary/20 p-8 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                  <div className="text-center space-y-4">
                    <Brain className="h-16 w-16 mx-auto text-primary" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Transcribing audio...</span>
                        <span className="text-primary font-medium">100%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Analyzing sentiment...</span>
                        <span className="text-primary font-medium">100%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Identifying highlights...</span>
                        <span className="text-primary font-medium">100%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Generating content...</span>
                        <span className="text-primary font-medium">100%</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Processing time: 2-5 minutes</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="md:w-1/2">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-2xl font-bold">AI Processing</h3>
                </div>
                <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
                  Our advanced AI analyzes every second of your content to extract maximum value.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Transcription:</strong> 99% accuracy with speaker detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Sentiment Analysis:</strong> Identifies emotional peaks & engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Smart Clips:</strong> AI selects 30-90s viral-ready moments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Content Generation:</strong> Platform-specific posts & captions</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-8 w-8 text-primary rotate-90 md:rotate-0" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 order-2 md:order-1">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-2xl font-bold">Review & Publish</h3>
                </div>
                <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
                  Get all your content organized and ready to publish across platforms. One-click copy and you're done!
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">10+ ready-to-publish content pieces</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Platform-optimized formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Edit, refine with AI assistant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Export clips as video files</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 order-1 md:order-2">
                <Card className="border-2 border-primary/20 p-8 bg-gradient-to-br from-orange-500/5 to-amber-400/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                      <FileText className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">LinkedIn Post</p>
                        <p className="text-xs text-muted-foreground">Professional tone</p>
                      </div>
                      <Button size="sm" variant="outline">Copy</Button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                      <FileText className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Twitter Thread</p>
                        <p className="text-xs text-muted-foreground">Viral-optimized</p>
                      </div>
                      <Button size="sm" variant="outline">Copy</Button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                      <Video className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Smart Clips (5)</p>
                        <p className="text-xs text-muted-foreground">30-90 seconds each</p>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                    <div className="pt-4 border-t text-center">
                      <p className="text-sm font-medium text-primary">+ Blog post, Instagram captions, and more</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Time Comparison */}
          <div className="mt-16 bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl p-8 border-2 border-primary/20">
            <h3 className="text-2xl font-bold text-center mb-8">Time Comparison</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-muted-foreground mb-2">Manual Method</div>
                <div className="text-5xl font-bold text-muted-foreground mb-2">8-12</div>
                <div className="text-sm text-muted-foreground">hours per webinar</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Transcription, editing, writing, formatting...
                </p>
              </div>
              <div className="text-center">
                <div className="text-primary mb-2 font-medium">With ContentKlipa</div>
                <div className="text-5xl font-bold text-primary mb-2">5</div>
                <div className="text-sm font-medium">minutes per webinar</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload, process, publish. That's it!
                </p>
              </div>
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

        {/* Final CTA */}
        <div className="mt-24 text-center bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl p-12 border-2 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Content Strategy?</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Join thousands of creators, educators, and marketers who are maximizing their content value
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </div>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-8 h-14 text-lg bg-gradient-primary hover:opacity-90 shadow-lg">
            Start Creating Content Now — It's Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
