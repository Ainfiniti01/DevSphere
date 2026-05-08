"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserMinus, Check, X, MessageSquare, Edit, User, Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const ManageTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, requests, currentUser, refreshProjects, resolveName } = useApp();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const project = projects.find(p => p.id === id);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProjects();
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (!project || project.creator_id !== currentUser?.id) {
    return (
      <MobileLayout title="Access Denied" showBack>
        <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
          <X size={48} className="text-destructive mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don't have permission to manage this team.</p>
          <Button onClick={() => navigate('/')} className="mt-6 rounded-xl">Return Home</Button>
        </div>
      </MobileLayout>
    );
  }

  // CRITICAL FIX: Scope requests strictly to this project and pending status
  const projectRequests = requests.filter(r => r.project_id === project.id && r.status === 'pending');

  const handleRequest = async (reqId: string, status: 'accepted' | 'rejected', userId: string) => {
    if (!supabase) return;
    setIsProcessing(reqId);
    try {
      // 1. Update the request status
      const { error: reqError } = await supabase
        .from('join_requests')
        .update({ status })
        .eq('id', reqId);

      if (reqError) throw reqError;

      if (status === 'accepted') {
        // 2. Add to project members
        const { error: memberError } = await supabase.from('project_members').insert({
          project_id: project.id,
          user_id: userId,
          role: 'Member'
        });
        
        if (memberError && memberError.code !== '23505') throw memberError;
        
        toast.success("Member added to team!");
      } else {
        toast.info("Request declined");
      }
      
      await refreshProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!supabase) return;
    setIsProcessing(memberId);
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: project.id, user_id: memberId });

      if (error) throw error;
      
      toast.success("Member removed from team");
      await refreshProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <MobileLayout title="Manage Team" showBack>
      <div className="px-4 py-6 space-y-8">
        <div className="flex items-center justify-between bg-primary/5 p-5 rounded-3xl border border-primary/10 shadow-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{project.title}</h3>
            <p className="text-[11px] text-muted-foreground">Project Settings & Team</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl h-10 w-10 border-primary/20"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl gap-2 font-bold border-primary/20 hover:bg-primary/5"
              onClick={() => navigate(`/create?edit=${project.id}`)}
            >
              <Edit size={14} /> Edit
            </Button>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Requests</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{projectRequests.length}</span>
          </div>
          <div className="space-y-4">
            {isRefreshing && projectRequests.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : projectRequests.map(req => (
              <div key={req.id} className="bg-card border border-border p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4 mb-4 items-center">
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => navigate(`/profile/${req.user_id}`)}
                  >
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={req.user?.avatar_url} />
                      <AvatarFallback><User size={20} /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="text-sm font-bold truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => navigate(`/profile/${req.user_id}`)}
                    >
                      {resolveName(req.user)}
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </h4>
                    <p className="text-[11px] text-primary font-medium truncate">{req.user?.title || 'Developer'}</p>
                  </div>
                </div>
                
                {req.reason && (
                  <div className="bg-accent/30 p-3 rounded-2xl mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                    <p className="text-xs italic text-foreground leading-relaxed">"{req.reason}"</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequest(req.id, 'accepted', req.user_id);
                    }} 
                    disabled={!!isProcessing}
                    className="flex-1 h-11 rounded-xl bg-primary text-xs font-bold gap-2 shadow-lg shadow-primary/20"
                  >
                    {isProcessing === req.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Accept</>}
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequest(req.id, 'rejected', req.user_id);
                    }} 
                    disabled={!!isProcessing}
                    variant="outline" 
                    className="flex-1 h-11 rounded-xl text-xs font-bold gap-2 border-border"
                  >
                    <X size={16} /> Decline
                  </Button>
                </div>
              </div>
            ))}
            {projectRequests.length === 0 && !isRefreshing && (
              <div className="text-center py-10 bg-accent/10 rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No pending requests at the moment.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Team Members</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{project.memberProfiles?.length || 0}</span>
          </div>
          <div className="space-y-3">
            {project.memberProfiles?.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-card rounded-3xl border border-border shadow-sm hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-11 w-11 border border-border cursor-pointer" onClick={() => navigate(`/profile/${member.id}`)}>
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/profile/${member.id}`)}>
                      {resolveName(member)}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate">{member.title || 'Member'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10" 
                    onClick={() => navigate(`/chat/${member.id}`)}
                  >
                    <MessageSquare size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" 
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isProcessing === member.id}
                  >
                    {isProcessing === member.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                  </Button>
                </div>
              </div>
            ))}
            {(!project.memberProfiles || project.memberProfiles.length === 0) && (
              <div className="text-center py-10 bg-accent/10 rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No team members yet. Your project is waiting for talent!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default ManageTeam;