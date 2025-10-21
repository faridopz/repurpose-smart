import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileVideo, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import WebinarList from "./WebinarList";

interface UploadTabProps {
  userId: string;
}

export default function UploadTab({ userId }: UploadTabProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: webinars, isLoading } = useQuery({
    queryKey: ["webinars", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webinars")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (1GB max)
      if (selectedFile.size > 1024 * 1024 * 1024) {
        toast.error("File size must be less than 1GB");
        return;
      }

      // Check file type
      const allowedTypes = ["video/mp4", "audio/mp3", "audio/mpeg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Only MP4 and MP3 files are supported");
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("webinars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("webinars")
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase.from("webinars").insert({
        user_id: userId,
        title,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: "uploaded",
      });

      if (dbError) throw dbError;

      toast.success("Webinar uploaded successfully!");
      setTitle("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["webinars", userId] });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload webinar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Webinar</CardTitle>
          <CardDescription>
            Upload your webinar recording to start the AI repurposing process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Webinar Title</Label>
            <Input
              id="title"
              placeholder="Enter webinar title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File (MP4 or MP3, max 1GB)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".mp4,.mp3"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileVideo className="h-4 w-4" />
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !title || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Webinar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <WebinarList webinars={webinars || []} isLoading={isLoading} userId={userId} />
    </div>
  );
}
