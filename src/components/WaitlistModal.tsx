"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const OPTIONS = [
  "Priority Visibility",
  "Advanced Filters",
  "Enhanced Profile",
  "All Features",
  "Other"
];

interface WaitlistModalProps {
  trigger: React.ReactNode;
}

const WaitlistModal = ({ trigger }: WaitlistModalProps) => {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interest, setInterest] = useState("All Features");
  const [otherText, setOtherText] = useState("");

  const handleSubmit = async () => {
    if (!currentUser || !supabase) {
      toast.error("Please sign in to join the waitlist");
      return;
    }

    setLoading(true);
    const finalInterest = interest === "Other" ? `Other: ${otherText}` : interest;

    try {
      const { error } = await supabase.from('waitlist').insert({
        user_id: currentUser.id,
        interest: finalInterest
      });

      if (error) throw error;

      toast.success("You'll be notified when this feature is ready.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Get Notified for Pro Features</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label className="text-sm font-bold">Which feature are you most interested in?</Label>
            <RadioGroup value={interest} onValueChange={setInterest} className="space-y-3">
              {OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-accent/20 transition-colors">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {interest === "Other" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Please specify</Label>
              <Input 
                placeholder="Tell us what you're looking for..." 
                className="rounded-xl h-12 bg-accent/20"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
              />
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={loading || (interest === "Other" && !otherText.trim())}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Get Notified"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;