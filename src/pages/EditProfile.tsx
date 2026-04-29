"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";
import { Camera, ChevronLeft } from 'lucide-react';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useApp();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    title: currentUser?.title || '',
    skills: currentUser?.skills?.join(', ') || '',
    location: currentUser?.location || '',
    portfolio: currentUser?.portfolio || '',
    avatar: currentUser?.avatar || ''
  });

  const handleSave = () => {
    setCurrentUser({
      ...currentUser,
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== "")
    });
    toast.success("Profile updated successfully!");
    navigate('/profile');
  };

  const simulateAvatarChange = () => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
    setFormData({ ...formData, avatar: newAvatar });
    toast.info("Avatar updated!");
  };

  return (
    <MobileLayout title="Edit Profile" showBack>
      <div className="px-6 py-6 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={simulateAvatarChange}>
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback>{formData.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-primary">Tap to change avatar</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5 opacity-60">
            <Label>Email (Not editable)</Label>
            <Input value={currentUser?.email} disabled className="rounded-xl h-12 bg-accent/50" />
          </div>
          <div className="space-y-1.5">
            <Label>Professional Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Skills (comma separated)</Label>
            <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Portfolio URL</Label>
            <Input value={formData.portfolio} onChange={e => setFormData({...formData, portfolio: e.target.value})} className="rounded-xl h-12" />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg">
          Save Changes
        </Button>
      </div>
    </MobileLayout>
  );
};

export default EditProfile;