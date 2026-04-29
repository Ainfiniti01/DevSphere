"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from "@/components/ui/input";
import { Search, Filter, TrendingUp, Users, Rocket } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';

const Explore = () => {
  const categories = [
    { icon: TrendingUp, label: 'Trending', color: 'bg-orange-100 text-orange-600' },
    { icon: Rocket, label: 'Startups', color: 'bg-blue-100 text-blue-600' },
    { icon: Users, label: 'Talent', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <MobileLayout title="Explore">
      <div className="px-4 py-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input className="pl-10 h-12 bg-white border-slate-200 rounded-xl" placeholder="Search projects, skills, or people..." />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg">
            <Filter size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button key={cat.label} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm whitespace-nowrap">
              <div className={`p-2 rounded-lg ${cat.color}`}>
                <cat.icon size={18} />
              </div>
              <span className="font-semibold text-sm">{cat.label}</span>
            </button>
          ))}
        </div>

        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4">Popular Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['React Native', 'Solidity', 'AI/ML', 'UI Design', 'Rust', 'Growth Hacking', 'AWS'].map(skill => (
              <button key={skill} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-medium hover:border-indigo-600 transition-colors">
                {skill}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-4">Recommended for you</h3>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i+10}/400`} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-sm line-clamp-1">Project Alpha {i}</h4>
                <p className="text-[10px] text-slate-500 mb-2">3 spots left</p>
                <div className="flex gap-1">
                  <SkillBadge skill="React" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Explore;