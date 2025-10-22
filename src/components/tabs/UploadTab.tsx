import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SmartUploadFlow from "@/components/SmartUploadFlow";
import WebinarList from "./WebinarList";

interface UploadTabProps {
  userId: string;
}

export default function UploadTab({ userId }: UploadTabProps) {
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

  return (
    <div className="space-y-8">
      <SmartUploadFlow userId={userId} />
      <WebinarList webinars={webinars || []} isLoading={isLoading} userId={userId} />
    </div>
  );
}
