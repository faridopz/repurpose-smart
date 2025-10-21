import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileVideo, Trash2, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Webinar {
  id: string;
  title: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
}

interface WebinarListProps {
  webinars: Webinar[];
  isLoading: boolean;
  userId: string;
}

export default function WebinarList({ webinars, isLoading, userId }: WebinarListProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDelete = async (webinarId: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this webinar?")) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split("/");
      const filePath = `${userId}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("webinars")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("webinars")
        .delete()
        .eq("id", webinarId);

      if (dbError) throw dbError;

      toast.success("Webinar deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["webinars", userId] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete webinar");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading webinars...</div>
        </CardContent>
      </Card>
    );
  }

  if (webinars.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webinars yet</h3>
            <p className="text-muted-foreground">Upload your first webinar to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Webinars</CardTitle>
        <CardDescription>Manage your uploaded webinar recordings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {webinars.map((webinar) => (
            <div
              key={webinar.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-2 bg-primary/10 rounded">
                  <FileVideo className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{webinar.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{(webinar.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(webinar.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/webinar/${webinar.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(webinar.id, webinar.file_url)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
