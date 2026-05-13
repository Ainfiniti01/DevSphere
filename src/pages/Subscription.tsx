"use client";

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from "@/components/ui/button";
import { Rocket, Zap, Star, ShieldCheck, BellRing, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import WaitlistModal from '@/components/WaitlistModal';
import { useApp } from '@/context/AppContext';

const Subscription = () => {
  const { currentUser } = useApp();
  const isPremium = currentUser?.is_premium_override;

  return (
    <AppLayout title="Subscription" showBack>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {isPremium ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[2.5rem] text-center space-y-4 shadow-xl shadow-emerald-500/5">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Premium Access</h3>
              <h2 className="text-4xl font-black text-emerald-700">Founder Status</h2>
              <p className="text-sm text-emerald-600/70">All premium features unlocked</p>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                <CheckCircle2 size={16} /> Unrestricted Pro Access
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                <CheckCircle2 size={16} /> Testing & Admin Bypass Active
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2rem] text-center">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Plan</h3>
            <h2 className="text-4xl font-bold text-primary">Free</h2>
            <p className="text-sm text-muted-foreground mt-2">Basic access to DevSphere</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Zap size={20} /></div>
              <h3 className="text-2xl font-bold">Pro Features Coming Soon</h3>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              Pro features are coming soon to help you grow faster on DevSphere. Here's what we're building:
            </p>

            <div className="space-y-4">
              {[
                { icon: Star, title: "Priority Visibility", desc: "Get your projects featured at the top of the feed." },
                { icon: Rocket, title: "Advanced Filters", desc: "Find the perfect collaborators with deep skill search." },
                { icon: ShieldCheck, title: "Enhanced Profile", desc: "Stand out with custom themes and verified badges." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="text-primary mt-1"><feature.icon size={24} /></div>
                  <div>
                    <h4 className="font-bold text-base">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            {!isPremium && (
              <Button 
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20"
                onClick={() => toast.info("Pro features are coming soon!")}
              >
                Upgrade to Pro
              </Button>
            )}

            <div className="bg-accent/20 border border-border p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><BellRing size={20} /></div>
                <h3 className="text-xl font-bold">Get Early Access</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Be the first to know when Pro launches. Join our waitlist and help us prioritize the features you need most.
              </p>
              <WaitlistModal 
                trigger={
                  <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-primary/20 hover:bg-primary/5 text-lg">
                    Get Notified
                  </Button>
                }
              />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscription;