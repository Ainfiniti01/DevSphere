"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Check, Rocket, Zap, Star, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const Subscription = () => {
  return (
    <MobileLayout title="Subscription">
      <div className="px-6 py-6 space-y-8">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl text-center">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Plan</h3>
          <h2 className="text-3xl font-bold text-primary">Free</h2>
          <p className="text-xs text-muted-foreground mt-2">Basic access to DevSphere</p>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Zap size={20} /></div>
            <h3 className="text-xl font-bold">Pro Features Coming Soon</h3>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pro features are coming soon to help you grow faster on DevSphere. Here's what we're building:
          </p>

          <div className="space-y-4">
            {[
              { icon: Star, title: "Priority Visibility", desc: "Get your projects featured at the top of the feed." },
              { icon: Rocket, title: "Advanced Filters", desc: "Find the perfect collaborators with deep skill search." },
              { icon: ShieldCheck, title: "Enhanced Profile", desc: "Stand out with custom themes and verified badges." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-2xl">
                <div className="text-primary mt-1"><feature.icon size={20} /></div>
                <div>
                  <h4 className="font-bold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Button 
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg"
          onClick={() => toast.info("Pro features are coming soon!")}
        >
          Upgrade to Pro
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Subscription;