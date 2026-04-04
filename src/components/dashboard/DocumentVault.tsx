import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DocumentVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from("documents").remove([`${user!.id}/${name}`]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded" });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownload = async (name: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(`${user!.id}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Securely store legal documents, property records, and important family files.
        </p>
        <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.png" className="hidden" onChange={handleUpload} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-lg text-foreground mb-2">No documents yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Upload your first document to the vault.</p>
          <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.name} className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-bronze flex-shrink-0" />
                <span className="text-sm text-foreground truncate">{d.name.replace(/^\d+_/, "")}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                <span>{new Date(d.created_at).toLocaleDateString()}</span>
                <button onClick={() => handleDownload(d.name)} className="text-foreground hover:text-bronze transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(d.name)} className="text-destructive hover:text-destructive/80 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
