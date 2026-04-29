"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    skills: '',
    location: '',
    portfolio: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: 'u' + Date.now(),
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
    };
    setCurrentUser(newUser);
    toast.success("Welcome to DevSphere!");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-muted-foreground mt-2">Join the developer community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Professional Title</Label>
          <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Frontend Engineer" />
        </div>
        <div className="space-y-2">
          <Label>Skills (comma separated)</Label>
          <Input required value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, TypeScript, Node.js" />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" />
        </div>
        <div className="space-y-2">
          <Label>Portfolio URL (Optional)</Label>
          <Input value={formData.portfolio} onChange={e => setFormData({...formData, portfolio: e.target.value})} placeholder="https://myportfolio.com" />
        </div>

        <Button type="submit" className="w-full h-12 mt-4">Complete Profile</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account? <span onClick={() => navigate('/auth')} className="text-primary font-semibold cursor-pointer">Log in</span>
      </p>
    </div>
  );
};

export default Signup;