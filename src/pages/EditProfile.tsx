"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";
import { Camera, Loader2, AtSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshNotifications } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    display_name: currentUser?.display_name || '',
    username: currentUser?.username || '',
    title: currentUser?.title || '',
    bio: currentUser?.bio || '',
    skills: currentUser?.skills?.join(', ') || '',
    location: currentUser?.location || '',
    portfolio_url: currentUser?.portfolio_url || '',
    avatar_url: currentUser?.avatar_url || ''
  });

  const handleSave = async () => {
    if (!supabase || !currentUser) return;
    setLoading(true);

    try {
      const updates = {
        id: currentUser.id,
        name: formData.name,
        display_name: formData.display_name,
        username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        title: formData.title,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
        location: formData.location,
        portfolio_url: formData.portfolio_url,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      // Create Notification
      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        actor_id: currentUser.id,
        type: 'system',
        content: 'Your profile has been updated successfully.'
      });

      setCurrentUser({ ...currentUser, ...updates });
      toast.success("Profile updated successfully!");
      await refreshNotifications();
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Edit Profile" showBack>
      <div className="px-6 py-6 space-y-8">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Display Name (Public)</Label>
            <Input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="rounded-xl h-12" placeholder="John D." />
          </div>
          <div className="space-y-1.5">
            <Label>Professional Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="Tell us about yourself..." />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading || uploading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default EditProfile;