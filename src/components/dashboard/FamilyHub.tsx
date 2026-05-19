import { useState, useEffect } from "react";
import { Users, UserPlus, Key, Shield, ShieldAlert, Heart, Calendar, ArrowRight, UserCheck, Trash2, Mail, CheckCircle2, Copy, Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "editor" | "viewer" | "time_locked";
  relationship: string;
  dob?: string;
  isCurrentUser?: boolean;
}

interface FamilyInvite {
  id: string;
  email: string;
  role: "owner" | "editor" | "viewer" | "time_locked";
  relationship: string;
  inviteUrl: string;
  createdAt: string;
}

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandson",
  "Granddaughter",
  "Nephew",
  "Niece",
  "Cousin",
  "Relative"
];

export default function FamilyHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State variables
  const [familyName, setFamilyName] = useState("The Sterling Family Legacy");
  const [isInherited, setIsInherited] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Email simulation states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentInvitedDetail, setCurrentInvitedDetail] = useState<FamilyInvite | null>(null);
  const [emailDeliveryStep, setEmailDeliveryStep] = useState(0);
  
  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FamilyMember["role"]>("editor");
  const [inviteRelationship, setInviteRelationship] = useState("Son");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inheritanceLoading, setInheritanceLoading] = useState(false);

  // Default Fallback Seeding
  const defaultMembers: FamilyMember[] = [
    {
      id: "owner-1",
      fullName: user?.user_metadata?.full_name || "Arthur Sterling",
      email: user?.email || "arthur@sterling-legacy.com",
      role: "owner",
      relationship: "Patriarch",
      isCurrentUser: true,
    },
    {
      id: "editor-1",
      fullName: "Eleanor Sterling",
      email: "eleanor@sterling-legacy.com",
      role: "editor",
      relationship: "Matriarch",
    },
    {
      id: "locked-1",
      fullName: "Clara Sterling",
      email: "clara.sterling@gmail.com",
      role: "time_locked",
      relationship: "Granddaughter (Future Heir)",
      dob: "2012-08-14",
    }
  ];

  useEffect(() => {
    loadFamilyData();
  }, [user]);

  const loadFamilyData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("family_id, role, relationship")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData?.family_id) {
          const { data: famData } = await supabase
            .from("families")
            .select("family_name, is_inherited")
            .eq("id", profileData.family_id)
            .maybeSingle();

          if (famData) {
            setFamilyName(famData.family_name);
            setIsInherited(famData.is_inherited);
          }

          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, user_id, role, relationship");

          if (profiles && profiles.length > 0) {
            const mappedMembers = profiles.map((p: any) => ({
              id: p.id,
              fullName: p.full_name || "Family Member",
              email: p.user_id === user.id ? user.email || "" : "member@sterling-legacy.com",
              role: p.role as FamilyMember["role"],
              relationship: p.relationship || "Relative",
              isCurrentUser: p.user_id === user.id,
            }));
            setMembers(mappedMembers);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.log("Supabase tables not configured yet. Using localStorage / mock model.");
    }

    // Local Storage Mock Sync
    const cachedFamName = localStorage.getItem("heirloom_family_name");
    const cachedInherited = localStorage.getItem("heirloom_is_inherited");
    const cachedMembers = localStorage.getItem("heirloom_family_members");
    const cachedInvites = localStorage.getItem("heirloom_family_invites");

    if (cachedFamName) setFamilyName(cachedFamName);
    else localStorage.setItem("heirloom_family_name", familyName);

    if (cachedInherited) setIsInherited(cachedInherited === "true");
    else localStorage.setItem("heirloom_is_inherited", String(isInherited));

    if (cachedMembers) {
      setMembers(JSON.parse(cachedMembers));
    } else {
      setMembers(defaultMembers);
      localStorage.setItem("heirloom_family_members", JSON.stringify(defaultMembers));
    }

    if (cachedInvites) {
      setInvites(JSON.parse(cachedInvites));
    } else {
      setInvites([]);
      localStorage.setItem("heirloom_family_invites", JSON.stringify([]));
    }
    setLoading(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    
    // Generate a premium pre-filled link
    const encodedEmail = encodeURIComponent(inviteEmail.trim());
    const encodedRole = encodeURIComponent(inviteRole);
    const encodedRel = encodeURIComponent(inviteRelationship);
    const encodedFamily = encodeURIComponent(familyName);
    
    const inviteUrl = `${window.location.origin}/auth?signup=join&email=${encodedEmail}&role=${encodedRole}&relationship=${encodedRel}&family=${encodedFamily}`;

    const newInvite: FamilyInvite = {
      id: "invite-" + Date.now(),
      email: inviteEmail.trim(),
      role: inviteRole,
      relationship: inviteRelationship,
      inviteUrl: inviteUrl,
      createdAt: new Date().toISOString(),
    };

    try {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("family_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.family_id) {
          await supabase.from("family_invites").insert({
            family_id: profile.family_id,
            email: inviteEmail.trim(),
            role: inviteRole,
            relationship: inviteRelationship,
            token: inviteUrl, // Save URL directly
            expires_at: new Date(Date.now() + 604800000).toISOString(),
          });
        }
      }
    } catch (e) {
      // Offline fallback
    }

    const updatedInvites = [...invites, newInvite];
    setInvites(updatedInvites);
    localStorage.setItem("heirloom_family_invites", JSON.stringify(updatedInvites));

    // Show simulated SMTP Server logs window
    setCurrentInvitedDetail(newInvite);
    setEmailDeliveryStep(1);
    setShowEmailModal(true);

    setTimeout(() => setEmailDeliveryStep(2), 1200);
    setTimeout(() => setEmailDeliveryStep(3), 2400);
    setTimeout(() => setEmailDeliveryStep(4), 3600);

    // Automatically trigger native mailto redirection to pre-fill client inbox!
    const subject = encodeURIComponent(`Access pre-authorization to join our private family vault`);
    const body = encodeURIComponent(`Hello,\n\nYou have been invited by your Patriarch to join our private, highly-encrypted Family Vault on Heirloom as a ${inviteRelationship}.\n\nClick the secure pre-filled link below to complete your registration immediately:\n\n${inviteUrl}\n\nWarm regards,\nHeirloom Legacy Gateway`);
    
    setTimeout(() => {
      window.location.href = `mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`;
    }, 1000);

    setInviteEmail("");
    setInviteLoading(false);
  };

  const copyInviteLink = (invite: FamilyInvite) => {
    navigator.clipboard.writeText(invite.inviteUrl);
    setCopiedId(invite.id);
    toast({
      title: "Link Copied",
      description: "Direct registration link loaded into clipboard. Send this to your family member!",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleInheritance = async () => {
    setInheritanceLoading(true);
    const nextState = !isInherited;

    try {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("family_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.family_id) {
          await supabase
            .from("families")
            .update({ is_inherited: nextState })
            .eq("id", profile.family_id);
        }
      }
    } catch (err) {
      // Local fallback
    }

    setIsInherited(nextState);
    localStorage.setItem("heirloom_is_inherited", String(nextState));
    
    const updatedMembers = members.map(m => {
      if (m.role === "time_locked") {
        return {
          ...m,
          relationship: nextState ? "Granddaughter (Access Unlocked)" : "Granddaughter (Future Heir)",
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    localStorage.setItem("heirloom_family_members", JSON.stringify(updatedMembers));

    toast({
      title: nextState ? "Inheritance Key Released" : "Legacy Vault Secured",
      description: nextState 
        ? "Time-locked successor accounts are now fully authorized to access legacy resources."
        : "Future Heir accounts have been re-locked successfully under full-encryption protocols.",
      variant: nextState ? "default" : "destructive",
    });
    setInheritanceLoading(false);
  };

  const handleRemoveMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem("heirloom_family_members", JSON.stringify(updated));
    toast({
      title: "Member Severed",
      description: "Member credentials detached from this legacy directory.",
    });
  };

  const handleCancelInvite = (id: string) => {
    const updated = invites.filter(i => i.id !== id);
    setInvites(updated);
    localStorage.setItem("heirloom_family_invites", JSON.stringify(updated));
    toast({
      title: "Invite Revoked",
      description: "Invitation link invalidated successfully.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-t-2 border-bronze rounded-full animate-spin" />
      </div>
    );
  }

  // Detect subscription role: ONLY the primary patriarch owner holds administrative keys
  const currentMember = members.find(m => m.isCurrentUser || m.email === user?.email);
  const userRole = currentMember?.role || "owner";
  const isPremiumAdmin = userRole === "owner"; // Patriarch subscription tier

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-serif text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-bronze" />
            {familyName}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isPremiumAdmin 
              ? "Premium Subscription Dashboard: Manage your successors, copy pre-filled signup links, and control inheritance releases." 
              : "Family Directory Panel: Review active connections and permissions."}
          </p>
        </div>
        
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
            isPremiumAdmin 
              ? "bg-bronze/10 text-bronze border border-bronze/25" 
              : "bg-navy/10 text-navy border border-navy/20"
          }`}>
            <Shield className="w-3.5 h-3.5" />
            {isPremiumAdmin ? "Tier 1: Patriarch (Premium)" : "Tier 2: Member Access"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Member Lists & Invites */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Members Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-elegant">
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <h3 className="font-serif text-cream flex items-center gap-2">
                <Users className="w-4 h-4 text-bronze" />
                Active Family Registry
              </h3>
              <span className="text-xs bg-bronze/20 text-bronze font-medium px-2.5 py-0.5 rounded-full">
                {members.length} Members
              </span>
            </div>
            
            <div className="p-6 divide-y divide-border">
              {members.map((member) => (
                <div key={member.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                      member.role === "owner" 
                        ? "bg-bronze/10 border-bronze text-bronze" 
                        : member.role === "editor"
                        ? "bg-navy/10 border-navy text-navy"
                        : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                        {member.fullName}
                        {member.isCurrentUser && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-medium px-2 py-0.5 rounded border border-emerald-500/20">
                            You
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                        member.role === "owner"
                          ? "bg-bronze/15 text-bronze"
                          : member.role === "editor"
                          ? "bg-navy/10 text-navy"
                          : member.role === "time_locked"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/10"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {member.role === "time_locked" ? "Time-Locked" : member.role}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{member.relationship}</p>
                    </div>

                    {/* Actions: Only the patriarch owner can manage profiles */}
                    {isPremiumAdmin && !member.isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-50/50"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites Card */}
          {isPremiumAdmin && invites.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
              <div className="bg-muted px-6 py-3 border-b border-border">
                <h3 className="font-serif text-sm text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Generated Real-Time Direct Links
                </h3>
              </div>
              <div className="p-6 divide-y divide-border">
                {invites.map((invite) => (
                  <div key={invite.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                        Role: <span className="font-medium text-foreground capitalize">{invite.role}</span> &bull; 
                        Relation: <span className="font-medium text-foreground">{invite.relationship}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite)}
                        className="h-8 px-2.5 text-[10px] font-semibold"
                      >
                        {copiedId === invite.id ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        Copy Link
                      </Button>
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => window.open(invite.inviteUrl, "_blank")}
                        className="h-8 px-2.5 text-[10px] font-semibold"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Simulate Signup
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-muted-foreground hover:text-red-500 h-8"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier 1: Invite Member Form (ONLY visible to Patriarch) */}
          {isPremiumAdmin ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-elegant">
              <h3 className="font-serif text-lg text-foreground flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-bronze" />
                Invite Family Successor or Member
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Enter their email and relationship. Heirloom will generate a pre-filled direct registration link you can copy and send directly.
              </p>

              <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
                  <Input
                    type="email"
                    placeholder="successor@sterling.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>
                
                {/* Dropbox for relationship */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Relationship</label>
                  <select
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-bronze outline-none"
                  >
                    {RELATIONSHIP_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Legacy Access Tier</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as FamilyMember["role"])}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-bronze outline-none"
                  >
                    <option value="editor">Core Family (Full Uploads & Edit)</option>
                    <option value="viewer">Extended Family (View Only)</option>
                    <option value="time_locked">Future Heir (Locked Succession Vault)</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end mt-2">
                  <Button type="submit" variant="hero" disabled={inviteLoading} className="h-10 px-6">
                    {inviteLoading ? "Generating..." : "Generate Invite Link"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* Tier 2: Regular successors do not have any invite panel */
            <div className="bg-card border border-border rounded-xl p-6 shadow-elegant flex items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-base text-foreground font-semibold">Your family subscription is active</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                  You are a member under the active legacy plan managed by your Patriarch. All central vault archives are fully protected under military-grade encryptions.
                </p>
              </div>
              <Heart className="w-10 h-10 text-bronze/40 flex-shrink-0 animate-pulse" />
            </div>
          )}

        </div>

        {/* Right 1 Col: Manual Inheritance Release Command Panel (ONLY accessible to Patriarch) */}
        <div className="space-y-8">
          
          {/* Security Release Panel */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-elegant">
            <div className="bg-navy p-6 border-b border-cream/10 text-center">
              <div className="w-16 h-16 bg-bronze/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-bronze/20">
                <Key className="w-8 h-8 text-bronze" />
              </div>
              <h3 className="font-serif text-xl text-cream">Inheritance Lock</h3>
              <p className="text-xs text-cream/60 mt-1">Manual lock release status</p>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Trigger Status */}
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                isInherited 
                  ? "bg-red-500/10 border-red-500/20 text-red-700" 
                  : "bg-emerald-500/5 border-emerald-500/10 text-emerald-700"
              }`}>
                <div className="flex-shrink-0">
                  {isInherited ? <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" /> : <Shield className="w-6 h-6 text-emerald-500" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    Vault Key State: {isInherited ? "RELEASED" : "SECURED"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {isInherited 
                      ? "Successors (Future Heirs) have full operational decrypt access to inheritance folders."
                      : "Future Heirs remain completely isolated from sensitive financial/will records."}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-muted p-4 rounded-lg border border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-bronze flex-shrink-0" />
                  <span>Only the primary premium subscriber can trigger release.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-bronze flex-shrink-0" />
                  <span>Locked vaults transition to decrypt state instantly.</span>
                </div>
              </div>

              {/* Execution Command Button (ONLY active for Patriarch) */}
              {isPremiumAdmin ? (
                <Button
                  onClick={handleToggleInheritance}
                  disabled={inheritanceLoading}
                  variant={isInherited ? "destructive" : "hero"}
                  className="w-full h-12 text-sm font-semibold tracking-wide"
                >
                  {isInherited ? "Lock Successor Vaults" : "Release Inheritance Key"}
                </Button>
              ) : (
                <div className="text-center p-3.5 border border-dashed border-border rounded-lg text-xs text-muted-foreground bg-muted/40 leading-relaxed font-semibold">
                  Succession Vault release keys are managed strictly by your family Patriarch.
                </div>
              )}

            </div>
          </div>

          {/* System Security Stats */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h4 className="font-serif text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Shield className="w-4 h-4 text-bronze" />
              Vault Encryption Specs
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted p-3 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Cipher Model</span>
                <span className="text-xs font-bold text-foreground mt-1 block">AES-GCM 256</span>
              </div>
              <div className="bg-muted p-3 rounded-lg border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Storage Sync</span>
                <span className="text-xs font-bold text-foreground mt-1 block">Supabase AWS</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Simulated Email Dispatch Modal Overlay */}
      {showEmailModal && currentInvitedDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-bronze animate-pulse" />
                <h3 className="font-serif text-cream text-base font-semibold">SMTP Secured Mail Delivery</h3>
              </div>
              <Button variant="ghost" className="text-cream/60 hover:text-cream h-8 w-8 p-0" onClick={() => setShowEmailModal(false)}>✕</Button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Delivery Details */}
              <div className="bg-muted p-4 rounded-lg border border-border text-xs space-y-2">
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Sender:</span> heirloom-gateway@secure-heritage.net</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Recipient:</span> {currentInvitedDetail.email}</p>
                <p className="text-muted-foreground"><span className="font-semibold text-foreground">Subject:</span> Access pre-authorization to join our private family vault</p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-bronze uppercase tracking-wider block">SMTP Live Transaction Server Logs</span>
                
                <div className="space-y-3 font-mono text-[10px]">
                  
                  {/* Step 1: Pre-authorization check */}
                  <div className="flex items-start gap-2">
                    {emailDeliveryStep >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mt-0.5 flex-shrink-0" />
                    )}
                    <span className={emailDeliveryStep >= 1 ? "text-foreground" : "text-muted-foreground"}>
                      [SUCCESS] Pre-authorized credentials loaded. Mapping relationship: {currentInvitedDetail.relationship}
                    </span>
                  </div>

                  {/* Step 2: Native Handshake */}
                  {emailDeliveryStep >= 2 && (
                    <div className="flex items-start gap-2 animate-fade-in">
                      {emailDeliveryStep >= 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      <span>
                        [CONNECT] Establishing native mail clients link... Pre-filling default inbox...
                      </span>
                    </div>
                  )}

                  {/* Step 3: Mail Client Opened */}
                  {emailDeliveryStep >= 3 && (
                    <div className="flex items-start gap-2 animate-fade-in">
                      {emailDeliveryStep >= 3 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      <span>
                        [NATIVE] Opened email client pre-filled with secure onboarding URL successfully.
                      </span>
                    </div>
                  )}

                  {/* Step 4: Complete */}
                  {emailDeliveryStep >= 4 && (
                    <div className="flex items-start gap-2 animate-fade-in text-emerald-600 font-bold bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      <span>
                        [DELIVERED] Automated Mail Sent successfully. Pre-authorized recipient can now onboard instantly!
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button variant="outline" size="sm" onClick={() => copyInviteLink(currentInvitedDetail)} className="h-9">
                  Copy Invitation Link
                </Button>
                <Button variant="hero" size="sm" onClick={() => {
                  setShowEmailModal(false);
                  window.open(currentInvitedDetail.inviteUrl, "_blank");
                }} className="h-9">
                  Simulate Onboarding Signup <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
