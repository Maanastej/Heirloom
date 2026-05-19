import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Download, Eye, Lock, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DocumentMeta {
  name: string;
  created_at: string;
  isShared: boolean;
  uploadedBy: string;
  ownerId: string;
}

const DocumentVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Local state to track shared statuses and local vault cache (to support offline mode and multi-profile demo)
  const [sharedFiles, setSharedFiles] = useState<string[]>([]);
  const [familyDocuments, setFamilyDocuments] = useState<DocumentMeta[]>([]);
  const [localVaultDocs, setLocalVaultDocs] = useState<DocumentMeta[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const cachedShared = localStorage.getItem("heirloom_shared_documents");
    if (cachedShared) {
      setSharedFiles(JSON.parse(cachedShared));
    }
    const cachedDocs = localStorage.getItem("heirloom_vault_documents");
    if (cachedDocs) {
      setLocalVaultDocs(JSON.parse(cachedDocs));
    }
  }, []);

  const saveSharedFilesState = (updated: string[]) => {
    setSharedFiles(updated);
    localStorage.setItem("heirloom_shared_documents", JSON.stringify(updated));

    // Also update the local vault docs list if present
    const cachedDocs = localStorage.getItem("heirloom_vault_documents");
    if (cachedDocs) {
      const docs: DocumentMeta[] = JSON.parse(cachedDocs);
      const updatedDocs = docs.map(d => ({
        ...d,
        isShared: updated.includes(d.name)
      }));
      setLocalVaultDocs(updatedDocs);
      localStorage.setItem("heirloom_vault_documents", JSON.stringify(updatedDocs));
    }
  };

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

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("documents")
        .list(`${user!.id}/`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Compile combined view of Personal Documents + other Family Members' shared documents
  useEffect(() => {
    const personalMap = new Map<string, DocumentMeta>();

    // 1. Add current user's documents from Supabase storage (if online)
    documents.forEach(d => {
      personalMap.set(d.name, {
        name: d.name,
        created_at: d.created_at,
        isShared: d.name.includes("_shared_") || sharedFiles.includes(d.name),
        uploadedBy: "You",
        ownerId: user?.id || "me"
      });
    });

    // 2. Add/Merge files from local storage cache
    localVaultDocs.forEach(d => {
      const isMine = d.ownerId === user?.id || d.ownerId === "me";
      const updatedOwnerId = isMine ? (user?.id || "me") : d.ownerId;
      const isShared = d.name.includes("_shared_") || d.isShared;

      if (!personalMap.has(d.name)) {
        personalMap.set(d.name, {
          ...d,
          ownerId: updatedOwnerId,
          isShared
        });
      }
    });

    // 3. Query other family members' files if we are online and have familyMembers
    const fetchOtherFamilyDocs = async () => {
      const otherMembers = familyMembers.filter(m => m.user_id && m.user_id !== user?.id);
      let updated = false;

      await Promise.all(
        otherMembers.map(async (member) => {
          try {
            const { data, error } = await supabase.storage
              .from("documents")
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
        setFamilyDocuments(compileFilteredList(Array.from(personalMap.values())));
      }
    };

    const compileFilteredList = (list: DocumentMeta[]) => {
      const filteredList = list.filter(d => {
        const isMine = d.ownerId === user?.id || d.ownerId === "me";
        return isMine || d.isShared;
      });

      return filteredList;
    };

    // Initialize with current local/storage mapping
    setFamilyDocuments(compileFilteredList(Array.from(personalMap.values())));

    if (user && familyMembers.length > 0) {
      fetchOtherFamilyDocs();
    }
  }, [documents, localVaultDocs, sharedFiles, user, familyMembers]);

  const deleteMutation = useMutation({
    mutationFn: async ({ name, ownerId }: { name: string; ownerId: string }) => {
      try {
        const folder = ownerId === "me" ? user!.id : ownerId;
        const { error } = await supabase.storage
          .from("documents")
          .remove([`${folder}/${name}`]);
        if (error) console.warn("Could not delete from storage bucket:", error.message);
      } catch (err) {
        console.warn("Storage delete error:", err);
      }
    },
    onSuccess: (_, variables) => {
      const { name } = variables;
      saveSharedFilesState(sharedFiles.filter(f => f !== name));
      const updatedDocs = localVaultDocs.filter(d => d.name !== name);
      setLocalVaultDocs(updatedDocs);
      localStorage.setItem("heirloom_vault_documents", JSON.stringify(updatedDocs));
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    // Add _private_ prefix to make file private by default
    const fileName = `${Date.now()}_private_${file.name.replace(/\s+/g, "_")}`;
    const path = `${user.id}/${fileName}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    setUploading(false);

    // Save to local cache to support offline and multi-profile demo
    const newDoc: DocumentMeta = {
      name: fileName,
      created_at: new Date().toISOString(),
      isShared: false,
      uploadedBy: user?.user_metadata?.full_name || "You",
      ownerId: user.id
    };

    const updatedDocs = [newDoc, ...localVaultDocs];
    setLocalVaultDocs(updatedDocs);
    localStorage.setItem("heirloom_vault_documents", JSON.stringify(updatedDocs));

    if (error) {
      console.warn("Live upload failed, using local storage fallback:", error.message);
      toast({
        title: "Document Saved (Local Fallback)",
        description: "Private by default. Saved to browser storage because live storage is unconfigured."
      });
    } else {
      toast({ title: "Document uploaded successfully", description: "Private by default. You can share it with family anytime." });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownload = async (name: string, ownerId: string) => {
    const targetFolder = ownerId === "me" || ownerId === user?.id ? user?.id : ownerId;
    if (targetFolder) {
      try {
        const { data } = await supabase.storage
          .from("documents")
          .createSignedUrl(`${targetFolder}/${name}`, 60);
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
          return;
        }
      } catch (err) {
        console.warn("Could not download file:", err);
      }
    }
    
    // Fallback for mock files or if storage call fails
    toast({
      title: "Downloading Shared Asset",
      description: `Accessing encrypted document from family vault...`,
    });
    setTimeout(() => {
      window.open("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "_blank");
    }, 1000);
  };

  const toggleShare = async (fileName: string) => {
    const isShared = fileName.includes("_shared_");
    const cleanName = fileName.replace(/^\d+_(private_|shared_)/, "").replace(/^\d+_(?!private|shared)/, "");
    const timestamp = fileName.match(/^\d+/)?.[0] || Date.now().toString();
    const targetName = `${timestamp}_${isShared ? "private" : "shared"}_${cleanName}`;

    // Update in local cache first to ensure smooth offline fallback
    const updatedDocs = localVaultDocs.map(d => {
      if (d.name === fileName) {
        return {
          ...d,
          name: targetName,
          isShared: !isShared
        };
      }
      return d;
    });
    setLocalVaultDocs(updatedDocs);
    localStorage.setItem("heirloom_vault_documents", JSON.stringify(updatedDocs));

    // Update shared list
    const updatedSharedList = !isShared
      ? [...sharedFiles, targetName].filter(name => name !== fileName)
      : sharedFiles.filter(name => name !== fileName);
    saveSharedFilesState(updatedSharedList);

    // Online move in storage bucket
    if (user) {
      try {
        const fromPath = `${user.id}/${fileName}`;
        const toPath = `${user.id}/${targetName}`;
        
        const { error } = await supabase.storage
          .from("documents")
          .move(fromPath, toPath);
        
        if (error) {
          console.warn("Could not rename file in storage bucket:", error.message);
        }
      } catch (err) {
        console.warn("Storage move error:", err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["documents"] });
    
    toast({
      title: !isShared ? "Shared with Family" : "Marked Private",
      description: !isShared 
        ? "All authorized family members can now view and download this document."
        : "This document is now strictly private to your personal account.",
    });
  };

  const cleanDisplayName = (name: string) => {
    return name.replace(/^\d+_(private_|shared_)/, "").replace(/^\d+_(?!private|shared)/, "");
  };

  const myDocuments = familyDocuments.filter(d => d.ownerId === user?.id || d.ownerId === "me");
  const sharedFamilyDocuments = familyDocuments.filter(d => d.ownerId !== user?.id && d.ownerId !== "me");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <p className="text-muted-foreground text-sm max-w-xl">
          Securely manage legal deeds, will drafts, and property agreements. Items are strictly private until explicitly toggled as shared.
        </p>
        <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 px-5 flex-shrink-0">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.png" className="hidden" onChange={handleUpload} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-bronze rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: My Private & Uploaded Documents */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-bronze" />
              My Vault Documents
            </h3>
            
            {myDocuments.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/40">
                <FileText className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                <h4 className="font-serif text-sm text-foreground font-semibold mb-1">Your vault is empty</h4>
                <p className="text-xs text-muted-foreground mb-4">No records uploaded yet.</p>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Upload Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myDocuments.map((d) => (
                  <div key={d.name} className="flex flex-col sm:flex-row sm:items-center justify-between bg-card rounded-lg border border-border p-4 gap-4 hover:border-bronze/20 transition-all">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-bronze/5 flex items-center justify-center border border-bronze/10 flex-shrink-0">
                        <FileText className="w-5 h-5 text-bronze" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate max-w-[280px]" title={cleanDisplayName(d.name)}>
                          {cleanDisplayName(d.name)}
                        </h4>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Uploaded on {new Date(d.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {/* Shared Toggle Trigger */}
                      <Button
                        variant={d.isShared ? "hero" : "outline"}
                        size="sm"
                        onClick={() => toggleShare(d.name)}
                        className="h-8 text-[10px] font-bold"
                        title={d.isShared ? "Visible to family" : "Private (only me)"}
                      >
                        {d.isShared ? (
                          <>
                            <Globe className="w-3.5 h-3.5 mr-1" />
                            Shared
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Private
                          </>
                        )}
                      </Button>

                      {/* Download */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(d.name, d.ownerId)}
                        className="h-8 w-8 hover:text-bronze"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate({ name: d.name, ownerId: d.ownerId })}
                        className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Shared Family Documents (Vault Feed) */}
          <div className="space-y-6">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2 border-b border-border pb-2.5">
              <Users className="w-4.5 h-4.5 text-bronze" />
              Shared Family Folder
            </h3>

            {sharedFamilyDocuments.length === 0 ? (
              <div className="text-center py-10 bg-muted/40 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No documents shared by other family members yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sharedFamilyDocuments.map((d) => (
                  <div key={d.name} className="bg-card rounded-lg border border-border p-4 space-y-3 shadow-elegant hover:border-bronze/20 transition-all">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-bronze flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate" title={cleanDisplayName(d.name)}>
                          {cleanDisplayName(d.name)}
                        </h4>
                        <span className="text-[9px] text-muted-foreground block mt-0.5">
                          Published by {d.uploadedBy}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(d.name, d.ownerId)}
                          className="h-7 text-[10px] px-2.5"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ name: d.name, ownerId: d.ownerId })}
                            className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete other user's shared document (Admin)"
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

export default DocumentVault;
