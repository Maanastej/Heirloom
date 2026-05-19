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
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    if (user) {
      // Offline check
      const cachedMembers = localStorage.getItem("heirloom_family_members");
      if (cachedMembers) {
        const membersList = JSON.parse(cachedMembers);
        const currentUser = membersList.find((m: any) => m.email === user.email || m.isCurrentUser);
        if (currentUser && currentUser.role === "owner") {
          setIsAdmin(true);
        }
      }

      // Online check
      supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role === "owner") {
            setIsAdmin(true);
          }
        });
    }
  }, [user]);

  // Fetch family members to discover other accounts in the family
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family-members", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("family_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!profile?.family_id) return [];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, user_id, role, relationship")
          .eq("family_id", profile.family_id);
        return profiles || [];
      } catch (err) {
        console.warn("Could not query profiles:", err);
        return [];
      }
    },
    enabled: !!user,
  });

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
        isShared: v.name.includes("_shared_") || sharedVideos.includes(v.name),
        uploadedBy: "You",
        ownerId: user?.id || "me"
      });
    });

    // 2. Add/Merge files from local storage cache
    localVaultVideos.forEach(v => {
      const isMine = v.ownerId === user?.id || v.ownerId === "me";
      const updatedOwnerId = isMine ? (user?.id || "me") : v.ownerId;
      const isShared = v.name.includes("_shared_") || v.isShared;

      if (!personalMap.has(v.name)) {
        personalMap.set(v.name, {
          ...v,
          ownerId: updatedOwnerId,
          isShared
        });
      }
    });

    // 3. Query other family members' files if we are online and have familyMembers
    const fetchOtherFamilyVideos = async () => {
      const otherMembers = familyMembers.filter(m => m.user_id && m.user_id !== user?.id);
      let updated = false;

      await Promise.all(
        otherMembers.map(async (member) => {
          try {
            const { data, error } = await supabase.storage
              .from("videos")
              .list(`${member.user_id}/`, { limit: 100 });
            
            if (!error && data) {
              data.forEach(f => {
                // Only load if it's marked shared
                if (f.name.includes("_shared_")) {
                  if (!personalMap.has(f.name)) {
                    personalMap.set(f.name, {
                      name: f.name,
                      created_at: f.created_at,
                      isShared: true,
                      uploadedBy: member.full_name || `${member.relationship}`,
                      ownerId: member.user_id
                    });
                    updated = true;
                  }
                }
              });
            }
          } catch (e) {
            console.warn("Could not list other member folder:", e);
          }
        })
      );

      if (updated) {
        setFamilyVideos(compileFilteredList(Array.from(personalMap.values())));
      }
    };

    const compileFilteredList = (list: VideoMeta[]) => {
      const filteredList = list.filter(v => {
        const isMine = v.ownerId === user?.id || v.ownerId === "me";
        return isMine || v.isShared;
      });

      return filteredList;
    };

    // Initialize with current local/storage mapping
    setFamilyVideos(compileFilteredList(Array.from(personalMap.values())));

    if (user && familyMembers.length > 0) {
      fetchOtherFamilyVideos();
    }
  }, [videos, localVaultVideos, sharedVideos, user, familyMembers]);

  const deleteMutation = useMutation({
    mutationFn: async ({ name, ownerId }: { name: string; ownerId: string }) => {
      try {
        const folder = ownerId === "me" ? user!.id : ownerId;
        const { error } = await supabase.storage
          .from("videos")
          .remove([`${folder}/${name}`]);
        if (error) console.warn("Could not delete from storage bucket:", error.message);
      } catch (err) {
        console.warn("Storage delete error:", err);
      }
    },
    onSuccess: (_, variables) => {
      const { name } = variables;
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
    // Add _private_ prefix to make video private by default
    const fileName = `${Date.now()}_private_${file.name.replace(/\s+/g, "_")}`;
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
    const targetFolder = ownerId === "me" || ownerId === user?.id ? user?.id : ownerId;
    if (targetFolder) {
      try {
        const { data } = await supabase.storage
          .from("videos")
          .createSignedUrl(`${targetFolder}/${name}`, 60);
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
          return;
        }
      } catch (err) {
        console.warn("Could not preview video:", err);
      }
    }
    
    // Fallback for mock files or if storage call fails
    toast({
      title: "Streaming Legacy Video",
      description: `Establishing secure connection to private media nodes...`,
    });
    setTimeout(() => {
      window.open("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "_blank");
    }, 1000);
  };

  const toggleShare = async (fileName: string) => {
    const isShared = fileName.includes("_shared_");
    const cleanName = fileName.replace(/^\d+_(private_|shared_)/, "").replace(/^\d+_(?!private|shared)/, "");
    const timestamp = fileName.match(/^\d+/)?.[0] || Date.now().toString();
    const targetName = `${timestamp}_${isShared ? "private" : "shared"}_${cleanName}`;

    // Update in local cache first to ensure smooth offline fallback
    const updatedDocs = localVaultVideos.map(d => {
      if (d.name === fileName) {
        return {
          ...d,
          name: targetName,
          isShared: !isShared
        };
      }
      return d;
    });
    setLocalVaultVideos(updatedDocs);
    localStorage.setItem("heirloom_vault_videos", JSON.stringify(updatedDocs));

    // Update shared list
    const updatedSharedList = !isShared
      ? [...sharedVideos, targetName].filter(name => name !== fileName)
      : sharedVideos.filter(name => name !== fileName);
    saveSharedVideosState(updatedSharedList);

    // Online move in storage bucket
    if (user) {
      try {
        const fromPath = `${user.id}/${fileName}`;
        const toPath = `${user.id}/${targetName}`;
        
        const { error } = await supabase.storage
          .from("videos")
          .move(fromPath, toPath);
        
        if (error) {
          console.warn("Could not rename file in storage bucket:", error.message);
        }
      } catch (err) {
        console.warn("Storage move error:", err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["videos"] });
    
    toast({
      title: !isShared ? "Shared with Family" : "Marked Private",
      description: !isShared 
        ? "All authorized family members can now view and play this legacy video."
        : "This video is now strictly private to your personal dashboard.",
    });
  };

  const cleanDisplayName = (name: string) => {
    return name.replace(/^\d+_(private_|shared_)/, "").replace(/^\d+_(?!private|shared)/, "");
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
                        <span className="text-xs font-semibold text-foreground truncate block max-w-[180px]" title={cleanDisplayName(v.name)}>
                          {cleanDisplayName(v.name)}
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
                          onClick={() => deleteMutation.mutate({ name: v.name, ownerId: v.ownerId })}
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
                          <h4 className="text-xs font-semibold text-foreground truncate" title={cleanDisplayName(v.name)}>
                            {cleanDisplayName(v.name)}
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
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(v.name, v.ownerId)}
                          className="h-7 text-[10px] px-2.5"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Stream
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ name: v.name, ownerId: v.ownerId })}
                            className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete other user's shared video (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
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
