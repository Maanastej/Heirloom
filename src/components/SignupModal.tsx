import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignupModal = ({ open, onOpenChange }: SignupModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSubmitted(false);
      setName("");
      setEmail("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-navy border-cream/10 text-cream sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-bronze/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-bronze" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-cream">You're on the list</DialogTitle>
              <DialogDescription className="text-cream/60 mt-2">
                We'll reach out soon with exclusive early access details.
              </DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-cream">Request Early Access</DialogTitle>
              <DialogDescription className="text-cream/60">
                Join founding families preserving what matters most.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-cream/80">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cream/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-cream/5 border-cream/10 text-cream placeholder:text-cream/30 focus-visible:ring-bronze"
                />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Request Access
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
