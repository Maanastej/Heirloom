import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Video, Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const VideoLegacyDash = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("videos")
        .list(`${user!.id}/`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from("videos").remove([`${user!.id}/${name}`]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: "Video deleted" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("videos").upload(path, file);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video uploaded" });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleView = async (name: string) => {
    const { data } = await supabase.storage.from("videos").createSignedUrl(`${user!.id}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Record and preserve family stories, wisdom, and memories for future generations.
        </p>
        <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-lg text-foreground mb-2">No videos yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Upload your first legacy video to get started.</p>
          <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> Upload Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.name} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-bronze flex-shrink-0" />
                <span className="text-sm text-foreground truncate" title={v.name.replace(/^\d+_/, "")}>
                  {v.name.replace(/^\d+_/, "")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-2">
                <span>{new Date(v.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(v.name)}
                    className="text-foreground hover:text-bronze transition-colors flex items-center justify-center p-2 hover:bg-bronze/10 rounded-full"
                    title="Watch / Download"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(v.name)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-2 hover:bg-destructive/10 rounded-full"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoLegacyDash;

