import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, FileText, BarChart3, Plus, Trash2, Home, Gem, Car, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type AssetType = "Land" | "Jewelry" | "Vehicle" | "Other";

const getAssetIcon = (type: string) => {
  switch (type) {
    case "Land": return <Home className="w-5 h-5 text-bronze flex-shrink-0" />;
    case "Jewelry": return <Gem className="w-5 h-5 text-bronze flex-shrink-0" />;
    case "Vehicle": return <Car className="w-5 h-5 text-bronze flex-shrink-0" />;
    default: return <Briefcase className="w-5 h-5 text-bronze flex-shrink-0" />;
  }
};

const AssetManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assetType, setAssetType] = useState<AssetType>("Land");
  const [description, setDescription] = useState("");
  const [valueEstimate, setValueEstimate] = useState("");

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

  const { data: physicalAssets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["physical-assets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physical_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching assets (ensure you ran the SQL migration):", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  const addAssetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("physical_assets").insert([
        {
          user_id: user!.id,
          asset_type: assetType,
          description,
          value_estimate: valueEstimate
        }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Asset Added successfully" });
      setDescription("");
      setValueEstimate("");
      queryClient.invalidateQueries({ queryKey: ["physical-assets"] });
    },
    onError: (error) => {
      toast({ title: "Failed to add asset", description: error.message, variant: "destructive" });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("physical_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Asset removed" });
      queryClient.invalidateQueries({ queryKey: ["physical-assets"] });
    }
  });

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    addAssetMutation.mutate();
  };

  const totalAssets = videoCount + docCount + physicalAssets.length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-2xl font-serif text-foreground mb-2">Asset Manager</h2>
        <p className="text-muted-foreground text-sm">
          Overview of all your preserved family assets in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{totalAssets}</div>
          <div className="text-xs text-muted-foreground">Total Value Items</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{physicalAssets.length}</div>
          <div className="text-xs text-muted-foreground">Physical Assets</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{videoCount}</div>
          <div className="text-xs text-muted-foreground">Legacy Videos</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-bronze/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-bronze" />
          </div>
          <div className="text-3xl font-serif text-foreground mb-1">{docCount}</div>
          <div className="text-xs text-muted-foreground">Documents</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-border rounded-xl p-5 bg-card">
          <h3 className="font-serif text-lg mb-4">Add Physical Asset</h3>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Land">Land / Real Estate</option>
                <option value="Jewelry">Jewelry & Heirlooms</option>
                <option value="Vehicle">Cars / Vehicles</option>
                <option value="Other">Other Asset</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description / Name</label>
              <Input
                placeholder="e.g. Grandma's Pearl Necklace"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Estimated Value (Optional)</label>
              <Input
                placeholder="e.g. $5,000"
                value={valueEstimate}
                onChange={(e) => setValueEstimate(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={addAssetMutation.isPending || !description.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {addAssetMutation.isPending ? "Adding..." : "Add Asset"}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 border border-border rounded-xl p-5 bg-card">
          <h3 className="font-serif text-lg mb-4">Your Physical Assets</h3>

          {assetsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading assets...</div>
          ) : physicalAssets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-lg text-foreground mb-1">No physical assets</h3>
              <p className="text-muted-foreground text-sm">Add your real estate, jewelry or vehicles using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {physicalAssets.map((asset: any) => (
                <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-bronze/10 rounded-lg">
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{asset.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{asset.asset_type}</span>
                        {asset.value_estimate && (
                          <>
                            <span>•</span>
                            <span>{asset.value_estimate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAssetMutation.mutate(asset.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
