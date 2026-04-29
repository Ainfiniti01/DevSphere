"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Share2, MapPin, Link as LinkIcon, Award, Briefcase } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Profile">
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
        
        <div className="px-4 -mt-12">
          <div className="flex items-end justify-between mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
              <AvatarFallback>FX</AvatarFallback>
            </Avatar>
            <div className="flex gap-2 pb-2">
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/settings')}>
                <Settings size={18} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl">
                <Share2 size={18} />
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Felix Zhang</h2>
            <p className="text-indigo-600 font-medium">Senior Fullstack Developer</p>
            <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> San Francisco</span>
              <span className="flex items-center gap-1"><LinkIcon size={14} /> felix.dev</span>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
              <p className="text-xl font-bold text-slate-900">12</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Projects</p>
            </div>
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
              <p className="text-xl font-bold text-slate-900">842</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Followers</p>
            </div>
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
              <p className="text-xl font-bold text-slate-900">4.9</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rating</p>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Award size={20} className="text-amber-500" /> Badges
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {['Top Contributor', 'AI Specialist', 'Hackathon Winner'].map(badge => (
                <Badge key={badge} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1 whitespace-nowrap">
                  {badge}
                </Badge>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'GraphQL', 'Docker', 'PostgreSQL'].map(skill => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Briefcase size={20} className="text-slate-400" /> Experience
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400">G</div>
                <div>
                  <h4 className="font-bold text-sm">Senior Engineer @ Google</h4>
                  <p className="text-xs text-slate-500">2021 - Present</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;