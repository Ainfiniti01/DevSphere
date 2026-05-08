"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Rocket, Zap, Star, ShieldCheck, BellRing, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import WaitlistModal from '@/components/WaitlistModal';
import { useApp } from '@/context/AppContext';

const Subscription = () => {
  const { currentUser } = useApp();
  const isPremium = currentUser?.is_premium_override;

  return (
    <MobileLayout title="Subscription" showBack>
      <div className="px-6 py-6 space-y-8">
        {isPremium ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] text-center space-y-4 shadow-xl shadow-emerald-500/5">
            <div className="w-16 h-16 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Premium Access</h3>
              <h2 className="text-3xl font-black text-emerald-700">Founder Status</h2>
              <p className="text-xs text-emerald-600/70">All premium features unlocked</p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500/5 p-3 rounded-xl">
                <CheckCircle2 size={14} /> Unrestricted Pro Access
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500/5 p-3 rounded-xl">
                <CheckCircle2 size={14} /> Testing & Admin Bypass Active
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl text-center">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Plan</h3>
            <h2 className="text-3xl font-bold text-primary">Free</h2>
            <p className="text-xs text-muted-foreground mt-2">Basic access to DevSphere</p>
          </div>
        )}

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

        {!isPremium && (
          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg"
            onClick={() => toast.info("Pro features are coming soon!")}
          >
            Upgrade to Pro
          </Button>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Waitlist</span></div>
        </div>

        <section className="bg-accent/20 border border-border p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><BellRing size={20} /></div>
            <h3 className="text-lg font-bold">Get Early Access</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Be the first to know when Pro launches. Join our waitlist and help us prioritize the features you need most.
          </p>
          <WaitlistModal 
            trigger={
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                Get Notified
              </Button>
            }
          />
        </section>
      </div>
    </MobileLayout>
  );
};

export default Subscription;