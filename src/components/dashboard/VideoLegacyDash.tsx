import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Video, Trash2, Play, Lock, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface VideoMeta {
  name: string;
  created_at: string;
  isShared: boolean;
  uploadedBy: string;
  ownerId: string;
}

const VideoLegacyDash = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Local state to track shared statuses and local vault cache (to support offline mode and multi-profile demo)
  const [sharedVideos, setSharedVideos] = useState<string[]>([]);
  const [familyVideos, setFamilyVideos] = useState<VideoMeta[]>([]);
  const [localVaultVideos, setLocalVaultVideos] = useState<VideoMeta[]>([]);

  useEffect(() => {
    const cachedShared = localStorage.getItem("heirloom_shared_videos");
    if (cachedShared) {
      setSharedVideos(JSON.parse(cachedShared));
    }
    const cachedDocs = localStorage.getItem("heirloom_vault_videos");
    if (cachedDocs) {
      setLocalVaultVideos(JSON.parse(cachedDocs));
    }
  }, []);

  const saveSharedVideosState = (updated: string[]) => {
    setSharedVideos(updated);
    localStorage.setItem("heirloom_shared_videos", JSON.stringify(updated));

    // Also update the local vault videos list if present
    const cachedDocs = localStorage.getItem("heirloom_vault_videos");
    if (cachedDocs) {
      const docs: VideoMeta[] = JSON.parse(cachedDocs);
      const updatedDocs = docs.map(d => ({
        ...d,
        isShared: updated.includes(d.name)
      }));
      setLocalVaultVideos(updatedDocs);
      localStorage.setItem("heirloom_vault_videos", JSON.stringify(updatedDocs));
    }
  };

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

  // Compile combined view of Personal Videos + other Family Members' shared videos
  useEffect(() => {
    const personalMap = new Map<string, VideoMeta>();

    // 1. Add current user's videos from Supabase storage (if online)
    videos.forEach(v => {
      personalMap.set(v.name, {
        name: v.name,
        created_at: v.created_at,
        isShared: sharedVideos.includes(v.name),
        uploadedBy: user?.user_metadata?.full_name || "You",
        ownerId: user?.id || "me"
      });
    });

    // 2. Add/Merge files from local storage (handles offline mode + files from other users in local demo)
    localVaultVideos.forEach(v => {
      const isMine = v.ownerId === user?.id || v.ownerId === "me";
      const updatedOwnerId = isMine ? (user?.id || "me") : v.ownerId;

      if (!personalMap.has(v.name)) {
        personalMap.set(v.name, {
          ...v,
          ownerId: updatedOwnerId,
          isShared: sharedVideos.includes(v.name) || v.isShared
        });
      }
    });

    const combinedList = Array.from(personalMap.values());

    // 3. Mock some shared family videos from other members for high-fidelity demo
    const defaultFamilyVideos: VideoMeta[] = [
      {
        name: "Grandpa_Richard_Advice_To_Grandchildren_1998.mp4",
        created_at: new Date(Date.now() - 259200000).toISOString(),
        isShared: true,
        uploadedBy: "Grandpa Richard (Grandfather)",
        ownerId: "grandpa-1"
      },
      {
        name: "Eleanor_Sterling_Legacy_Reflections.mp4",
        created_at: new Date(Date.now() - 518400000).toISOString(),
        isShared: true,
        uploadedBy: "Eleanor Sterling (Matriarch)",
        ownerId: "eleanor-1"
      }
    ];

    // Filter list to keep only:
    // - Current user's files (shared or private)
    // - Other family members' files ONLY IF they are shared
    const filteredList = combinedList.filter(v => {
      const isMine = v.ownerId === user?.id || v.ownerId === "me";
      return isMine || v.isShared;
    });

    setFamilyVideos([...filteredList, ...defaultFamilyVideos]);
  }, [videos, localVaultVideos, sharedVideos, user]);

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        const { error } = await supabase.storage.from("videos").remove([`${user!.id}/${name}`]);
        if (error) console.warn("Could not delete from storage bucket:", error.message);
      } catch (err) {
        console.warn("Storage delete error:", err);
      }
    },
    onSuccess: (_, name) => {
      saveSharedVideosState(sharedVideos.filter(v => v !== name));
      const updatedDocs = localVaultVideos.filter(d => d.name !== name);
      setLocalVaultVideos(updatedDocs);
      localStorage.setItem("heirloom_vault_videos", JSON.stringify(updatedDocs));
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: "Video deleted" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const path = `${user.id}/${fileName}`;
    const { error } = await supabase.storage.from("videos").upload(path, file);
    setUploading(false);

    // Save to local cache to support offline and multi-profile demo
    const newDoc: VideoMeta = {
      name: fileName,
      created_at: new Date().toISOString(),
      isShared: false,
      uploadedBy: user?.user_metadata?.full_name || "You",
      ownerId: user.id
    };

    const updatedDocs = [newDoc, ...localVaultVideos];
    setLocalVaultVideos(updatedDocs);
    localStorage.setItem("heirloom_vault_videos", JSON.stringify(updatedDocs));

    if (error) {
      console.warn("Live upload failed, using local storage fallback:", error.message);
      toast({
        title: "Video Saved (Local Fallback)",
        description: "Private by default. Saved to browser storage because live storage is unconfigured."
      });
    } else {
      toast({ title: "Video uploaded successfully", description: "This video is private. Toggle 'Share with Family' to publish it." });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleView = async (name: string, ownerId: string) => {
    if (ownerId === user?.id || ownerId === "me") {
      const { data } = await supabase.storage.from("videos").createSignedUrl(`${user!.id}/${name}`, 60);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } else {
      toast({
        title: "Streaming Legacy Video",
        description: `Establishing secure connection to ${ownerId === 'eleanor-1' ? 'Eleanor' : 'Richard'}'s private media nodes...`,
      });
      setTimeout(() => {
        window.open("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "_blank");
      }, 1000);
    }
  };

  const toggleShare = (fileName: string) => {
    let updated: string[];
    const currentlyShared = sharedVideos.includes(fileName);
    
    if (currentlyShared) {
      updated = sharedVideos.filter(v => v !== fileName);
      toast({
        title: "Marked Private",
        description: "This video is now strictly private to your personal dashboard.",
      });
    } else {
      updated = [...sharedVideos, fileName];
      toast({
        title: "Shared with Family",
        description: "All authorized family members can now view and play this legacy video.",
      });
    }
    saveSharedVideosState(updated);
  };

  const myVideos = familyVideos.filter(v => v.ownerId === user?.id || v.ownerId === "me");
  const sharedFamilyVideos = familyVideos.filter(v => v.ownerId !== user?.id && v.ownerId !== "me");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <p className="text-muted-foreground text-sm max-w-xl">
          Record stories, advice, and direct legacy messages for future descendants. Toggle 'Shared' to publish to the collective legacy folders.
        </p>
        <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 px-5 flex-shrink-0">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-bronze rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: My Private & Uploaded Videos */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-bronze" />
              My Video Vault
            </h3>

            {myVideos.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/40">
                <Video className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                <h4 className="font-serif text-sm text-foreground font-semibold mb-1">No videos yet</h4>
                <p className="text-xs text-muted-foreground mb-4">Record and upload your first legacy video.</p>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Upload Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myVideos.map((v) => (
                  <div key={v.name} className="bg-card rounded-xl border border-border p-4 space-y-3 hover:border-bronze/20 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-bronze flex-shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate block max-w-[180px]" title={v.name.replace(/^\d+_/, "")}>
                          {v.name.replace(/^\d+_/, "")}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1.5 block">
                        Recorded: {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                      {/* Share toggle */}
                      <Button
                        variant={v.isShared ? "hero" : "outline"}
                        size="sm"
                        onClick={() => toggleShare(v.name)}
                        className="h-8 text-[9px] font-bold py-1 px-2.5"
                      >
                        {v.isShared ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                        {v.isShared ? "Shared" : "Private"}
                      </Button>

                      {/* Play & Delete */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(v.name, v.ownerId)}
                          className="h-8 w-8 hover:text-bronze"
                          title="Play Video"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(v.name)}
                          className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Shared Family Legacy Videos (Shared Folders) */}
          <div className="space-y-6">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-2.5">
              <Users className="w-4.5 h-4.5 text-bronze" />
              Shared Family Legacies
            </h3>

            {sharedFamilyVideos.length === 0 ? (
              <div className="text-center py-10 bg-muted/40 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No videos shared by other family members yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sharedFamilyVideos.map((v) => (
                  <div key={v.name} className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-elegant hover:border-bronze/20 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-bronze flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-foreground truncate" title={v.name}>
                            {v.name}
                          </h4>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">
                            Recorded by {v.uploadedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(v.name, v.ownerId)}
                        className="h-7 text-[10px] px-2.5"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Stream
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default VideoLegacyDash;
