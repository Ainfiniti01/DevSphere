"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Supabase automatically parses the hash from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          console.log("[ResetPassword] Session established", session.user.email);
          setVerifying(false);
        } else {
          // If no session, wait a bit for the hash to be processed
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
              setVerifying(false);
              subscription.unsubscribe();
            }
          });

          // Timeout after 5 seconds if no session is found
          setTimeout(() => {
            setVerifying(prev => {
              if (prev) {
                setError("Your reset link may have expired or is invalid. Please request a new one.");
              }
              return prev;
            });
          }, 5000);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while verifying the link.");
        setVerifying(false);
      }
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      // Success! Show the dialog
      setShowSuccessDialog(true);
      
      // Sign out to ensure a clean state for the next login
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("[ResetPassword] Update error:", err);
      toast.error(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="text-destructive" size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">{error}</p>
        <Button onClick={() => navigate('/auth')} className="rounded-xl px-8">
          Back to Login
        </Button>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Verifying your secure link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-8 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Lock className="text-primary-foreground" size={32} />
          </div>
          <h1 className="text-3xl font-bold">New Password</h1>
          <p className="text-muted-foreground mt-2">Enter your new secure password</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input 
                id="new-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="h-12 rounded-xl pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="h-12 rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && navigate('/auth')}>
        <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={32} />
            </div>
            <DialogTitle className="text-2xl font-bold">Password Updated!</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Your password has been successfully changed. You can now sign in with your new credentials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <Button onClick={() => navigate('/auth')} className="w-full h-12 rounded-xl font-bold text-lg">
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResetPassword;