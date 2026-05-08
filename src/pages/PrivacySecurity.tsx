"use client";

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Lock, LogOut, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { logout, currentUser, setCurrentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [autoLogout, setAutoLogout] = useState('never');
  
  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ open: boolean, success: boolean, message: string }>({
    open: false,
    success: false,
    message: ''
  });

  useEffect(() => {
    if (currentUser?.notification_settings?.auto_logout) {
      setAutoLogout(currentUser.notification_settings.auto_logout);
    }
  }, [currentUser]);

  const validateAndConfirm = () => {
    if (!passwords.new || !passwords.confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!supabase) return;
    setIsConfirmOpen(false);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      setResultModal({
        open: true,
        success: true,
        message: "Your password has been updated successfully. You can continue using the app with your new credentials."
      });
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      setResultModal({
        open: true,
        success: false,
        message: err.message || "We encountered an error while updating your password. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogoutChange = async (value: string) => {
    if (!supabase || !currentUser) return;
    
    const newSettings = { 
      ...(currentUser.notification_settings || {}), 
      auto_logout: value 
    };
    
    setAutoLogout(value);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: newSettings })
        .eq('id', currentUser.id);

      if (error) throw error;
      setCurrentUser({ ...currentUser, notification_settings: newSettings });
      toast.success(`Auto logout set to ${value === 'never' ? 'Never' : value + ' min'}`);
    } catch (err: any) {
      toast.error("Failed to update preference");
      setAutoLogout(currentUser?.notification_settings?.auto_logout || 'never');
    }
  };

  return (
    <MobileLayout title="Privacy & Security" showBack>
      <div className="px-6 py-6 space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Lock size={16} /> Change Password
          </h3>
          <div className="space-y-3 bg-card p-4 rounded-2xl border border-border">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={passwords.new} 
                onChange={e => setPasswords({...passwords, new: e.target.value})} 
                className="rounded-xl h-12" 
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input 
                type="password" 
                value={passwords.confirm} 
                onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                className="rounded-xl h-12" 
                placeholder="••••••••"
              />
            </div>
            <Button onClick={validateAndConfirm} disabled={loading} className="w-full h-12 mt-2 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} /> Preferences
          </h3>
          <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Auto Logout</Label>
              <Select value={autoLogout} onValueChange={handleAutoLogoutChange}>
                <SelectTrigger className="w-[120px] h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your data is used only to improve your experience on DevSphere. We do not share your personal information with third parties.
              </p>
            </div>
          </div>
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl gap-2 font-bold shadow-sm"
          onClick={() => {
            logout();
            navigate('/auth');
          }}
        >
          <LogOut size={20} /> Sign Out
        </Button>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-background border-border rounded-3xl max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change your password? You will need to use the new password for future logins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdatePassword} className="rounded-xl bg-primary">
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Modal (Success/Fail) */}
      <Dialog open={resultModal.open} onOpenChange={(open) => setResultModal(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${resultModal.success ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {resultModal.success ? (
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={32} />
              ) : (
                <XCircle className="text-red-600 dark:text-red-400" size={32} />
              )}
            </div>
            <DialogTitle className="text-2xl font-bold">
              {resultModal.success ? "Success!" : "Update Failed"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {resultModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <Button onClick={() => setResultModal(prev => ({ ...prev, open: false }))} className="w-full h-12 rounded-xl font-bold text-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySecurity;