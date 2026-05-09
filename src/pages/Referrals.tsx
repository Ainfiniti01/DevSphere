"use client";

import React, { useState, useEffect, useCallback } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Copy, 
  Share2, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Loader2,
  Gift,
  Rocket,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

const Referrals = () => {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    joined: 0,
    pending: 0,
    rewarded: 0
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!currentUser || !supabase) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch Points (For display only)
      const { data: pointData } = await supabase
        .from('referral_points')
        .select('points')
        .eq('user_id', currentUser.id);

      const totalPoints = pointData?.reduce((acc, curr) => acc + curr.points, 0) || 0;
      setPoints(totalPoints);

      // 2. Fetch Referrals (The Source of Truth for Analytics)
      const { data: refData, error: refError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:profiles!referrals_referred_user_id_fkey (
            id,
            name,
            avatar_url,
            activity_streak,
            updated_at
          )
        `)
        .eq('referrer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      const refs = refData || [];
      setReferrals(refs);
      
      // Derive all dashboard stats strictly from the referrals table
      setStats({
        total: refs.length,
        joined: refs.filter(r => r.status === 'joined').length,
        pending: refs.filter(r => r.status === 'pending').length,
        rewarded: refs.filter(r => r.status === 'rewarded').length
      });

    } catch (err: any) {
      console.error("[Referrals] Sync error:", err);
      toast.error("Failed to synchronize referral data.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyCode = () => {
    if (!currentUser?.referral_code) {
      toast.error("Referral code not found.");
      return;
    }
    navigator.clipboard.writeText(currentUser.referral_code);
    toast.success("Referral code copied!");
  };

  const handleShare = async () => {
    const code = currentUser?.referral_code || '';
    const shareData = {
      title: 'Join DevSphere',
      text: `Join me on DevSphere and build amazing projects! Use my code: ${code}`,
      url: `${window.location.origin}/signup?ref=${code}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <MobileLayout title="Refer & Earn" showBack>
      <div className="px-6 py-6 space-y-8">
        <section className="text-center space-y-4 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </Button>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
            <Trophy size={16} />
            {points} Points Earned
          </div>
          <h2 className="text-3xl font-black tracking-tight">Invite Friends</h2>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            Earn points toward future Pro discounts for every developer you bring to DevSphere.
          </p>
        </section>

        <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Your Referral Code</p>
              <h3 className="text-4xl font-black tracking-tighter text-primary">{currentUser?.referral_code || '---'}</h3>
            </div>
            <div className="flex gap-3">
              <Button onClick={copyCode} variant="outline" className="flex-1 h-14 rounded-2xl gap-2 font-bold border-primary/20 bg-background hover:bg-primary/5">
                <Copy size={18} /> Copy
              </Button>
              <Button onClick={handleShare} className="flex-1 h-14 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                <Share2 size={18} /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Invites', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Successful', value: stats.joined, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Rewarded', value: stats.rewarded, icon: Gift, color: 'text-primary', bg: 'bg-primary/10' }
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-3xl space-y-2">
              <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How it works</h3>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <Info size={12} /> View Rules
                </button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Referral Rules</DialogTitle>
                  <DialogDescription>Please follow these guidelines to ensure your rewards are valid.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <ul className="space-y-3">
                    {[
                      "Fake referrals are strictly prohibited",
                      "Self-referrals using multiple accounts are not allowed",
                      "Abuse may lead to permanent reward removal",
                      "Rewards are subject to manual verification",
                      "The referral system may evolve over time"
                    ].map((rule, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <DialogFooter>
                  <Button className="w-full h-12 rounded-xl font-bold" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>
                    I Understand
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {[
              { title: "Friend Signs Up", points: "+10", desc: "When they create a verified account" },
              { title: "7-Day Streak", points: "+5", desc: "When they stay active for a week" },
              { title: "First Project", points: "+10", desc: "When they launch their first project" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-accent/10 border border-border rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-sm font-black text-primary">{item.points}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Milestone Progress</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : referrals.length > 0 ? (
              referrals.map((ref, i) => (
                <div key={i} className="bg-card border border-border rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center font-bold text-primary">
                        {ref.referred_user?.name?.[0] || '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{ref.referred_user?.name || 'New User'}</h4>
                        <p className="text-[10px] text-muted-foreground">Joined {new Date(ref.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1 p-2 bg-accent/10 rounded-xl border border-border">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-[8px] font-bold uppercase">Signed Up</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-accent/10 rounded-xl border border-border">
                      {(ref.referred_user?.activity_streak || 0) >= 7 ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <Clock size={14} className="text-muted-foreground" />
                      )}
                      <span className="text-[8px] font-bold uppercase">7-Day Streak</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-accent/10 rounded-xl border border-border">
                      <Zap size={14} className="text-muted-foreground" />
                      <span className="text-[8px] font-bold uppercase">1st Project</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-accent/5 rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No referrals yet. Start sharing!</p>
              </div>
            )}
          </div>
        </section>

        <section className="pt-4">
          <div className="p-6 bg-gradient-to-br from-primary to-violet-600 rounded-[2rem] text-white space-y-4 shadow-xl shadow-primary/20">
            <div className="space-y-1">
              <h3 className="text-xl font-black">Redeem Rewards</h3>
              <p className="text-xs text-white/80">Convert your points into Pro discounts.</p>
            </div>
            <Button disabled className="w-full h-12 bg-white text-primary hover:bg-white/90 rounded-xl font-bold">
              Coming Soon
            </Button>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Referrals;