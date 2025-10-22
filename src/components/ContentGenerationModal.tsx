import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface ContentGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinarId: string;
  webinarTitle: string;
}

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube Description' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'witty', label: 'Witty' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'technical', label: 'Technical' },
];

export default function ContentGenerationModal({
  open,
  onOpenChange,
  webinarId,
  webinarTitle
}: ContentGenerationModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [tone, setTone] = useState('professional');
  const [personaText, setPersonaText] = useState('');

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          webinarId,
          platforms: selectedPlatforms,
          tone,
          persona: personaText || null
        }
      });

      if (error) throw error;

      toast.success('Content generated successfully!');
      
      // Trigger AI assistant with automatic suggestions after a short delay
      setTimeout(() => {
        const { openAIAssistant } = require("@/components/AIAssistant");
        openAIAssistant(
          `Content has been generated for ${webinarTitle}! Now suggest:\n\n1. 3 alternative blog post titles for A/B testing\n2. 3 alternative ${selectedPlatforms.join(', ')} caption variations\n3. Best posting times and strategies for each platform\n\nTone: ${tone}`,
          {
            webinarTitle,
          }
        );
      }, 500);
      
      onOpenChange(false);
      window.location.reload(); // Refresh to show new content
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate AI Content
          </DialogTitle>
          <DialogDescription>
            Create platform-optimized content for "{webinarTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Target Platforms</Label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map(platform => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <label
                    htmlFor={platform.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {platform.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Content Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona">Target Persona (Optional)</Label>
            <Input
              id="persona"
              placeholder="e.g., marketing manager, developer advocate, CFO"
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Describe your target audience for tailored language and examples
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}