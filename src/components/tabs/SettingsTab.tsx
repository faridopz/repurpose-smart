import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Key, Info, Film, Crown, Zap } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import UpgradeModal from "@/components/UpgradeModal";

interface SettingsTabProps {
  userId: string;
}

export default function SettingsTab({ userId }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [tonePreference, setTonePreference] = useState("professional");
  const [clipsGenerated, setClipsGenerated] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { role, limits } = useUserRole();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setTonePreference(data.tone_preference || "professional");
        setClipsGenerated(data.clips_generated_this_month || 0);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          tone_preference: tonePreference,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <UpgradeModal 
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="More Smart Clips"
      />

      {/* Clip Usage Card */}
      <Card className={
        role === 'enterprise'
          ? 'border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5'
          : role === 'pro'
          ? 'border-orange-500/20 bg-gradient-to-br from-background to-orange-500/5'
          : 'border-border'
      }>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {role === 'enterprise' ? (
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              ) : role === 'pro' ? (
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="p-2 bg-muted rounded-lg">
                  <Film className="h-5 w-5" />
                </div>
              )}
              <div>
                <CardTitle>Smart Clip Usage</CardTitle>
                <CardDescription>Monthly AI-powered clip generation</CardDescription>
              </div>
            </div>
            <Badge 
              className={
                role === 'enterprise' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0' 
                  : role === 'pro'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white border-0'
                  : 'bg-muted'
              }
            >
              {role?.toUpperCase() || 'FREE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {limits.clipsPerMonth === -1 
                  ? `${clipsGenerated} clips generated this month` 
                  : `${clipsGenerated} / ${limits.clipsPerMonth} clips used`}
              </span>
              <span className="font-medium">
                {limits.clipsPerMonth === -1 
                  ? 'Unlimited' 
                  : `${limits.clipsPerMonth - clipsGenerated} remaining`}
              </span>
            </div>
            {limits.clipsPerMonth !== -1 && (
              <Progress 
                value={(clipsGenerated / limits.clipsPerMonth) * 100} 
                className="h-2"
              />
            )}
          </div>
          
          {role === 'free' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Free plan includes {limits.clipsPerMonth} smart clips per month. 
                Upgrade to Pro for 30 clips/month or Enterprise for unlimited clips.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span>Custom brand colors</span>
              <Badge variant={limits.customBranding ? "default" : "secondary"}>
                {limits.customBranding ? "Enabled" : "Pro"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Logo upload</span>
              <Badge variant={limits.logoUpload ? "default" : "secondary"}>
                {limits.logoUpload ? "Enabled" : "Pro"}
              </Badge>
            </div>
          </div>

          {role !== 'enterprise' && (
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className={
                role === 'pro'
                  ? 'w-full bg-gradient-to-r from-purple-500 to-pink-400 hover:opacity-90 border-0 text-white'
                  : 'w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:opacity-90 border-0 text-white'
              }
            >
              {role === 'pro' ? '👑 Upgrade to Enterprise' : '⚡ Upgrade to Pro'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Content Tone Preference</Label>
            <Select value={tonePreference} onValueChange={setTonePreference}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This will influence how AI generates content from your webinars
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>Manage API integrations for transcription and AI generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              API keys are securely managed at the backend level for all users. If you need to use your own 
              AssemblyAI or OpenAI keys, please contact support for enterprise options.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">AssemblyAI</p>
                <p className="text-sm text-muted-foreground">Transcription service</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Backend Managed</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">OpenAI GPT-4</p>
                <p className="text-sm text-muted-foreground">AI content generation</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Backend Managed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
