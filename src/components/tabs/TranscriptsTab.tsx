import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface TranscriptsTabProps {
  userId: string;
}

export default function TranscriptsTab({ userId }: TranscriptsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcripts</CardTitle>
        <CardDescription>View and manage webinar transcriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Transcription Coming Soon</h3>
          <p className="text-muted-foreground">
            AssemblyAI integration will be added to transcribe your webinars
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
