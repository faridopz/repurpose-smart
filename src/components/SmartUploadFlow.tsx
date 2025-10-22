import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, FileVideo, Loader2, CheckCircle2, Sparkles, FileText, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SmartUploadFlowProps {
  userId: string;
}

type FlowStep = "upload" | "checking" | "preparing" | "processing" | "transcribing" | "analyzing" | "generating" | "success";

interface Diagnostics {
  upload_ms?: number;
  transcribe_ms?: number;
  fetch_ms?: number;
  total_ms?: number;
}

export default function SmartUploadFlow({ userId }: SmartUploadFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>("upload");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [webinarId, setWebinarId] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({});
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File size must be less than 1GB");
        return;
      }
      
      // Support comprehensive video and audio formats
      const allowedTypes = [
        // Video formats
        "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska",
        // Audio formats
        "audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"
      ];
      
      // Also check file extension as fallback (MIME types can be unreliable)
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
      const allowedExtensions = ["mp4", "mov", "avi", "webm", "mkv", "mp3", "wav", "m4a"];
      
      if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension || "")) {
        toast.error("Supported formats: MP4, MOV, AVI, WEBM, MKV, MP3, WAV, M4A");
        return;
      }
      
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const pollTranscription = async (transcriptId: string, webinarId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5s intervals)
    
    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        throw new Error('Transcription timeout');
      }

      const { data, error } = await supabase.functions.invoke('poll-transcription', {
        body: { transcriptId }
      });

      if (error) throw error;

      if (data.status === 'completed') {
        setProgress(75);
        setStep("analyzing");

        // Suggest highlights
        await supabase.functions.invoke('suggest-highlights', {
          body: { webinarId }
        });

        setProgress(85);
        setStep("generating");

        // Generate content
        await supabase.functions.invoke('generate-content', {
          body: {
            webinarId,
            platforms: ['linkedin', 'twitter'],
            tone: 'professional'
          }
        });

        setProgress(100);
        setStep("success");

        // Trigger AI assistant with automatic suggestions
        setTimeout(() => {
          const { openAIAssistant } = require("@/components/AIAssistant");
          openAIAssistant(
            `Successfully processed webinar "${title}"! Now suggest:\n\n1. 3 blog post titles for A/B testing\n2. 3 social media caption variations (LinkedIn & Twitter)\n3. Best posting times for maximum engagement\n\nKeep suggestions actionable and platform-specific.`,
            { webinarTitle: title }
          );
        }, 1000);

        // Redirect after success
        setTimeout(() => {
          navigate(`/webinar/${webinarId}`);
        }, 2000);
      } else if (data.status === 'error') {
        throw new Error('Transcription failed');
      } else {
        // Update progress based on time elapsed
        const progressValue = Math.min(70, 60 + (attempts * 0.5));
        setProgress(progressValue);
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
        await poll();
      }
    };

    await poll();
  };

  const startProcessing = async () => {
    if (!file || !title) {
      toast.error("Please provide a title and select a file");
      return;
    }

    try {
      // Step 1: Checking file
      setStep("checking");
      setStatusMessage("Checking file...");
      setProgress(5);
      toast.info("Checking file...");

      const filePath = `${userId}/${Date.now()}_${file.name}`;
      
      // Step 2: Uploading
      setStatusMessage("Preparing your webinar for transcription...");
      setProgress(10);
      toast.info("Preparing your webinar for transcription...");
      
      const { error: uploadError } = await supabase.storage
        .from("webinars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("webinars")
        .getPublicUrl(filePath);

      setProgress(30);

      const { data: webinar, error: dbError } = await supabase
        .from("webinars")
        .insert({
          user_id: userId,
          title,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          status: "uploaded",
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setWebinarId(webinar.id);

      // Step 3: Processing audio
      setStep("processing");
      setStatusMessage("Processing audio...");
      setProgress(40);
      toast.info("Processing audio...");

      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke("transcribe-webinar", {
        body: { webinarId: webinar.id },
      });

      if (transcriptError) {
        throw new Error("Unable to start transcription. Please try again.");
      }

      // Store diagnostics if available
      if (transcriptData?.diagnostics) {
        setDiagnostics(transcriptData.diagnostics);
      }

      // Step 4: Transcription started
      setStep("transcribing");
      setStatusMessage("Transcription started successfully!");
      setProgress(60);
      toast.success("Transcription started successfully!");

      // Start polling for transcription completion
      await pollTranscription(transcriptData.transcript_id, webinar.id);

    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error("Something went wrong while preparing your transcript. Please try again.");
      setStep("upload");
      setProgress(0);
      setStatusMessage("");
      setDiagnostics({});
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <Card className="p-8 border-2">
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Upload Your Content</h2>
                <p className="text-muted-foreground">
                  Upload webinars, podcasts, interviews, courses, or any long-form content
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Q4 Product Launch, Podcast Episode 42, Industry Interview"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Video or Audio File</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Input
                      id="file"
                      type="file"
                      accept=".mp4,.mov,.avi,.webm,.mkv,.mp3,.wav,.m4a,video/*,audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileVideo className="h-6 w-6 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <FileVideo className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="font-medium">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground">Video (MP4, MOV, AVI, WEBM) or Audio (MP3, WAV, M4A) - Max 1GB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  onClick={startProcessing}
                  disabled={!file || !title}
                  className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90"
                >
                  Start Processing
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "checking" && (
          <ProcessingStep
            key="checking"
            icon={<FileVideo className="h-12 w-12" />}
            title="Checking file..."
            description="Validating your upload"
            progress={progress}
            statusMessage={statusMessage}
            diagnostics={diagnostics}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />
        )}

        {step === "processing" && (
          <ProcessingStep
            key="processing"
            icon={<Loader2 className="h-12 w-12" />}
            title="Processing audio..."
            description="Getting everything ready for transcription"
            progress={progress}
            statusMessage={statusMessage}
            diagnostics={diagnostics}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />
        )}

        {step === "transcribing" && (
          <ProcessingStep
            key="transcribing"
            icon={<FileText className="h-12 w-12" />}
            title="Transcription started successfully!"
            description="Converting speech to text with timestamps..."
            progress={progress}
            statusMessage={statusMessage}
            diagnostics={diagnostics}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />
        )}

        {step === "analyzing" && (
          <ProcessingStep
            key="analyzing"
            icon={<TrendingUp className="h-12 w-12" />}
            title="Analyzing Highlights"
            description="Identifying key moments and sentiment peaks..."
            progress={progress}
            statusMessage={statusMessage}
            diagnostics={diagnostics}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />
        )}

        {step === "generating" && (
          <ProcessingStep
            key="generating"
            icon={<Sparkles className="h-12 w-12" />}
            title="Generating Content Ideas"
            description="Creating social posts and blog drafts..."
            progress={progress}
            statusMessage={statusMessage}
            diagnostics={diagnostics}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex p-6 rounded-full bg-gradient-primary mb-6"
            >
              <CheckCircle2 className="h-16 w-16 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-3">Your Content is Ready 🚀</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Redirecting to your content...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading results...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProcessingStep({
  icon,
  title,
  description,
  progress,
  statusMessage,
  diagnostics,
  showDiagnostics,
  setShowDiagnostics,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  progress: number;
  statusMessage?: string;
  diagnostics?: Diagnostics;
  showDiagnostics?: boolean;
  setShowDiagnostics?: (show: boolean) => void;
}) {
  const hasDiagnostics = diagnostics && Object.keys(diagnostics).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="inline-flex p-6 rounded-full bg-gradient-primary mb-6"
      >
        <div className="text-white">{icon}</div>
      </motion.div>
      <h2 className="text-3xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground mb-8">{description}</p>
      <div className="space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-sm font-medium text-primary">{progress}% Complete</p>
      </div>

      {hasDiagnostics && setShowDiagnostics && (
        <Collapsible
          open={showDiagnostics}
          onOpenChange={setShowDiagnostics}
          className="mt-6"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              {showDiagnostics ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View Logs
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-3 bg-muted/50 border-muted">
              <div className="p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Processing Diagnostics
                </p>
                <div className="space-y-1 text-sm font-mono">
                  {diagnostics.fetch_ms !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Fetch:</span>
                      <span className="font-medium">{diagnostics.fetch_ms}ms</span>
                    </div>
                  )}
                  {diagnostics.upload_ms !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload Time:</span>
                      <span className="font-medium">{diagnostics.upload_ms}ms</span>
                    </div>
                  )}
                  {diagnostics.transcribe_ms !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Response:</span>
                      <span className="font-medium">{diagnostics.transcribe_ms}ms</span>
                    </div>
                  )}
                  {diagnostics.total_ms !== undefined && (
                    <div className="flex justify-between border-t border-muted pt-1 mt-1">
                      <span className="text-muted-foreground font-semibold">Total:</span>
                      <span className="font-semibold">{diagnostics.total_ms}ms</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}
