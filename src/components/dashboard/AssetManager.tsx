import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, FileText, BarChart3 } from "lucide-react";

const AssetManager = () => {
  const { user } = useAuth();

  const { data: videoCount = 0 } = useQuery({
    queryKey: ["video-count", user?.id],
    queryFn: async () => {
      const { data } = await supabase.storage.from("videos").list(`${user!.id}/`, { limit: 1000 });
      return data?.length || 0;
    },
    enabled: !!user,
  });

  const { data: docCount = 0 } = useQuery({
    queryKey: ["doc-count", user?.id],
    queryFn: async () => {
      const { data } = await supabase.storage.from("documents").list(`${user!.id}/`, { limit: 1000 });
      return data?.length || 0;
    },
    enabled: !!user,
  });

  const totalAssets = videoCount + docCount;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Overview of all your preserved family assets in one place.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{totalAssets}</div>
          <div className="text-sm text-muted-foreground">Total Assets</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{videoCount}</div>
          <div className="text-sm text-muted-foreground">Legacy Videos</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{docCount}</div>
          <div className="text-sm text-muted-foreground">Documents</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <h3 className="font-serif text-lg text-foreground mb-2">Your Legacy at a Glance</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          As you add more videos and documents, this dashboard will give you a complete picture of your family's preserved legacy.
        </p>
      </div>
    </div>
  );
};

export default AssetManager;
