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
  const { logout, currentUser, setCurrentUser, refreshNotifications } = useApp();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [autoLogout, setAutoLogout] = useState('never');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ open: boolean, success: boolean, message: string }>({
    open: false,
    success: false,
    message: ''
  });

  const handleUpdatePassword = async () => {
    if (!supabase || !currentUser) return;
    setIsConfirmOpen(false);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      // Create Notification
      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        actor_id: currentUser.id,
        type: 'system',
        content: 'Your password was recently updated.'
      });

      setResultModal({
        open: true,
        success: true,
        message: "Your password has been updated successfully."
      });
      setPasswords({ new: '', confirm: '' });
      await refreshNotifications();
    } catch (err: any) {
      setResultModal({
        open: true,
        success: false,
        message: err.message || "Failed to update password."
      });
    } finally {
      setLoading(false);
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
            <Button onClick={() => setIsConfirmOpen(true)} disabled={loading} className="w-full h-12 mt-2 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
            </Button>
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

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-background border-border rounded-3xl max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change your password?
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

      <Dialog open={resultModal.open} onOpenChange={(open) => setResultModal(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${resultModal.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {resultModal.success ? <CheckCircle2 className="text-emerald-600" size={32} /> : <XCircle className="text-red-600" size={32} />}
            </div>
            <DialogTitle className="text-2xl font-bold">{resultModal.success ? "Success!" : "Update Failed"}</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">{resultModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <Button onClick={() => setResultModal(prev => ({ ...prev, open: false }))} className="w-full h-12 rounded-xl font-bold text-lg">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PrivacySecurity;