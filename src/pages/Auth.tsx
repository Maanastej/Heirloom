import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupMode, setSignupMode] = useState<"create" | "join">("create");
  const [searchParams] = useSearchParams();
  
  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [familyName, setFamilyName] = useState("");
  
  // Invited Onboarding Parameters
  const [isInvited, setIsInvited] = useState(false);
  const [invitedRole, setInvitedRole] = useState("editor");
  const [invitedRelationship, setInvitedRelationship] = useState("Family Member");
  const [invitedFamilyName, setInvitedFamilyName] = useState("");
  const [invitedFamilyId, setInvitedFamilyId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (user) {
      if (emailParam && user.email?.toLowerCase() !== emailParam.toLowerCase()) {
        // Automatically sign out if trying to access a different user's invite link
        supabase.auth.signOut().then(() => {
          toast({
            title: "Switching Accounts",
            description: "Signing out of your current account to accept the new family invitation.",
          });
        });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, searchParams]);

  // Decode URL parameters for direct email-link signups
  useEffect(() => {
    const signupParam = searchParams.get("signup");
    const emailParam = searchParams.get("email");
    const roleParam = searchParams.get("role");
    const relationshipParam = searchParams.get("relationship");
    const familyParam = searchParams.get("family");
    const familyIdParam = searchParams.get("family_id");

    if (signupParam === "join" && emailParam) {
      setIsLogin(false); // Switch directly to Register mode
      setSignupMode("join");
      setEmail(emailParam);
      setIsInvited(true);
      
      if (roleParam) setInvitedRole(roleParam);
      if (relationshipParam) setInvitedRelationship(relationshipParam);
      if (familyParam) setInvitedFamilyName(familyParam);
      if (familyIdParam) setInvitedFamilyId(familyIdParam);

      toast({
        title: "Invitation Found",
        description: `Pre-filling your secure link to join "${familyParam || 'Family Vault'}".`,
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // 1. SIGN IN FLOW
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully authorized into family vault.",
        });
        navigate("/dashboard");
      } else {
        // 2. SIGN UP FLOW
        const metadata: Record<string, any> = { full_name: fullName };

        if (signupMode === "create") {
          metadata.family_name = familyName.trim();
          metadata.role = "owner"; // Primary patriarch tier
          metadata.relationship = "Patriarch";
          
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) throw error;

          // Offline sync storage
          localStorage.setItem("heirloom_family_name", familyName.trim());
          localStorage.setItem("heirloom_is_inherited", "false");
          
          const ownerMember = {
            id: "owner-" + Date.now(),
            fullName: fullName,
            email: email,
            role: "owner" as const,
            relationship: "Patriarch",
            isCurrentUser: true,
          };
          localStorage.setItem("heirloom_family_members", JSON.stringify([ownerMember]));

        } else {
          // Signup with pre-filled link parameters
          metadata.family_name = invitedFamilyName;
          metadata.role = invitedRole;
          metadata.relationship = invitedRelationship;
          if (invitedFamilyId) {
            metadata.family_id = invitedFamilyId;
          }

          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) throw error;

          // Update active member lists in offline fallback immediately
          const newMember = {
            id: "mem-" + Date.now(),
            fullName: fullName,
            email: email,
            role: invitedRole as any,
            relationship: invitedRelationship,
            isCurrentUser: true,
          };

          const existingMembers = JSON.parse(localStorage.getItem("heirloom_family_members") || "[]");
          const updatedMembers = [...existingMembers, newMember];
          localStorage.setItem("heirloom_family_members", JSON.stringify(updatedMembers));
          localStorage.setItem("heirloom_family_name", invitedFamilyName);
          localStorage.setItem("heirloom_is_inherited", "false");

          // Clean invitation list if cached locally
          const cachedInvites = JSON.parse(localStorage.getItem("heirloom_family_invites") || "[]");
          const updatedInvites = cachedInvites.filter((i: any) => i.email.toLowerCase() !== email.toLowerCase());
          localStorage.setItem("heirloom_family_invites", JSON.stringify(updatedInvites));
        }

        // Automatically sign in the user immediately after registering to bypass email verification lock!
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        toast({
          title: "Legacy Vault Initialized!",
          description: "Account registered successfully. Bringing you straight into your dashboard.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({ title: "Authorization Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--cream)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="w-full max-w-md mx-auto px-6 relative z-10 py-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-bronze/20 flex items-center justify-center border border-bronze/10">
            <Shield className="w-5 h-5 text-bronze" />
          </div>
          <span className="font-serif text-xl text-cream tracking-wide">Heirloom</span>
        </div>

        <h1 className="font-serif text-3xl text-cream mb-2">
          {isLogin ? "Welcome back" : "Create your legacy"}
        </h1>
        <p className="text-cream/60 mb-8 text-xs md:text-sm">
          {isLogin
            ? "Sign in to access your family vault."
            : isInvited 
            ? `Complete registration to join "${invitedFamilyName}" as a family successor.`
            : "Start preserving what matters most to your lineage."}
        </p>

        {/* Signup Mode selector (Hidden if joining via invited link) */}
        {!isLogin && !isInvited && (
          <div className="grid grid-cols-2 gap-3 mb-6 bg-cream/5 p-1 rounded-lg border border-cream/10">
            <button
              type="button"
              onClick={() => setSignupMode("create")}
              className={`py-2 px-3 text-xs rounded font-medium transition-all ${
                signupMode === "create" 
                  ? "bg-bronze text-white shadow-bronze" 
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Start New Family Vault
            </button>
            <button
              type="button"
              onClick={() => setSignupMode("join")}
              className={`py-2 px-3 text-xs rounded font-medium transition-all ${
                signupMode === "join" 
                  ? "bg-bronze text-white shadow-bronze" 
                  : "text-cream/60 hover:text-cream"
              }`}
            >
              Join Existing Family
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="fullName" className="text-cream/80 text-xs font-semibold">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required={!isLogin}
                className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze h-10 text-xs"
              />
            </div>
          )}

          {!isLogin && signupMode === "create" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="familyName" className="text-cream/80 text-xs font-semibold">Family Legacy Name</Label>
              <Input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Sterling Family Legacy"
                required={!isLogin && signupMode === "create"}
                className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze h-10 text-xs"
              />
            </div>
          )}

          {!isLogin && signupMode === "join" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="familyNameReadOnly" className="text-cream/80 text-xs font-semibold">Joining Family Legacy</Label>
              <Input
                id="familyNameReadOnly"
                value={invitedFamilyName}
                readOnly
                className="bg-cream/5 border-cream/10 text-cream/70 h-10 text-xs cursor-not-allowed opacity-80"
              />
            </div>
          )}

          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="email" className="text-cream/80 text-xs font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isInvited} // Lock email if joining via direct invite URL
              className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze h-10 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-cream/80 text-xs font-semibold">Security Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze h-10 text-xs"
            />
          </div>

          <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Register Legacy Account"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="text-cream/50 text-xs text-center mt-6">
          {isLogin ? "Don't have an authorized account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-bronze hover:text-bronze-light transition-colors underline ml-1"
          >
            {isLogin ? "Register Access" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
