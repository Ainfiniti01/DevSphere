"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserMinus, Check, X, MessageSquare, Edit, User, Loader2, ChevronRight, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ManageTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, requests, currentUser, refreshProjects, refreshChats, resolveName, chats, dismissGroup, removeMemberFromGroup } = useApp();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const project = projects.find(p => p.id === id);
  const projectChat = chats.find(c => c.isGroup && c.targetId === id);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshProjects(), refreshChats()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (!project || project.creator_id !== currentUser?.id) {
    return (
      <AppLayout title="Access Denied" showBack>
        <div className="p-12 text-center flex flex-col items-center justify-center h-[60vh]">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mb-6">
            <X size={40} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-black">Access Denied</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">You don't have permission to manage this team.</p>
          <Button onClick={() => navigate('/')} className="mt-8 rounded-2xl px-10 h-14 font-bold shadow-lg">Return Home</Button>
        </div>
      </AppLayout>
    );
  }

  const projectRequests = requests.filter(r => r.project_id === project.id && r.status === 'pending');

  const handleRequest = async (reqId: string, status: 'accepted' | 'rejected') => {
    if (!supabase || !currentUser) return;
    setIsProcessing(reqId);
    try {
      const rpcName = status === 'accepted' ? 'accept_join_request' : 'reject_join_request';
      const { error } = await supabase.rpc(rpcName, {
        p_request_id: reqId,
        p_admin_id: currentUser.id
      });

      if (error) throw error;
      
      toast.success(status === 'accepted' ? "Member added to team!" : "Request declined");
      
      // Immediate sync for both projects and chats
      await Promise.all([refreshProjects(), refreshChats()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsProcessing(memberId);
    if (!projectChat) {
      try {
        await supabase?.from('project_members').update({ status: 'removed' }).match({ project_id: project.id, user_id: memberId });
        toast.success("Member removed");
        await refreshProjects();
      } catch (e) {}
    } else {
      await removeMemberFromGroup(projectChat.id, memberId);
    }
    setIsProcessing(null);
  };

  const handleDismissGroup = async () => {
    if (!projectChat) return;
    setIsProcessing('dismiss');
    await dismissGroup(projectChat.id);
    setIsProcessing(null);
  };

  return (
    <AppLayout title="Manage Team" showBack>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black truncate">{project.title}</h3>
              <ShieldCheck className="text-primary" size={20} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Project Settings & Team Management</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-2xl h-14 w-14 border-primary/20 bg-background"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            <Button 
              variant="outline" 
              className="h-14 rounded-2xl gap-2 font-black border-primary/20 hover:bg-primary/5 px-6"
              onClick={() => navigate(`/create?edit=${project.id}`)}
            >
              <Edit size={18} /> Edit Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Pending Requests</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20">{projectRequests.length}</span>
              </div>
              <div className="space-y-6">
                {isRefreshing && projectRequests.length === 0 ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : projectRequests.map(req => (
                  <div key={req.id} className="bg-card border border-border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                    <div className="flex gap-5 mb-6 items-center">
                      <div 
                        className="cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => navigate(`/profile/${req.user_id}`)}
                      >
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                          <AvatarImage src={req.user?.avatar_url} />
                          <AvatarFallback><User size={24} /></AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="text-lg font-black truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                          onClick={() => navigate(`/profile/${req.user_id}`)}
                        >
                          {resolveName(req.user)}
                          <ChevronRight size={18} className="text-muted-foreground" />
                        </h4>
                        <p className="text-sm text-primary font-bold truncate">{req.user?.title || 'Developer'}</p>
                      </div>
                    </div>
                    
                    {req.reason && (
                      <div className="bg-accent/30 p-5 rounded-2xl mb-4 border border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Application Message</p>
                        <p className="text-sm italic text-foreground/80 leading-relaxed">"{req.reason}"</p>
                      </div>
                    )}

                    {req.skills && (
                      <div className="bg-accent/30 p-5 rounded-2xl mb-6 border border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Inputted Skills / Contribution</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{req.skills}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        onClick={() => handleRequest(req.id, 'accepted')} 
                        disabled={!!isProcessing}
                        className="flex-1 h-14 rounded-2xl bg-primary text-sm font-black gap-2 shadow-lg shadow-primary/20"
                      >
                        {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Accept Member</>}
                      </Button>
                      <Button 
                        onClick={() => handleRequest(req.id, 'rejected')} 
                        disabled={!!isProcessing}
                        variant="outline" 
                        className="flex-1 h-14 rounded-2xl text-sm font-black gap-2 border-border"
                      >
                        <X size={20} /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
                {projectRequests.length === 0 && !isRefreshing && (
                  <div className="text-center py-16 bg-accent/5 rounded-[2.5rem] border border-dashed border-border">
                    <p className="text-base text-muted-foreground font-medium">No pending requests at the moment.</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Team Members</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20">{project.memberProfiles?.length || 0}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.memberProfiles?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border shadow-sm hover:bg-accent/5 transition-all group">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-12 w-12 border border-border cursor-pointer" onClick={() => navigate(`/profile/${member.id}`)}>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback><User size={20} /></AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/profile/${member.id}`)}>
                          {resolveName(member)}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-wider">{member.title || 'Member'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10" 
                        onClick={() => navigate(`/chat/${member.id}`)}
                      >
                        <MessageSquare size={18} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" 
                            disabled={isProcessing === member.id}
                          >
                            {isProcessing === member.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background border-border rounded-[2rem] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {resolveName(member)} from the project and group chat? They will be notified.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="rounded-xl bg-destructive text-destructive-foreground">
                              Confirm Removal
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {(!project.memberProfiles || project.memberProfiles.length === 0) && (
                  <div className="col-span-full text-center py-16 bg-accent/5 rounded-[2.5rem] border border-dashed border-border">
                    <p className="text-base text-muted-foreground font-medium">No team members yet. Your project is waiting for talent!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {projectChat && (
              <section className="bg-destructive/5 border border-destructive/10 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-destructive flex items-center gap-2">
                    <Trash2 size={20} /> Group Chat
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Dismissing the group permanently removes all members and message history. This action is irreversible.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-14 rounded-2xl gap-2 font-black shadow-lg shadow-destructive/10" disabled={isProcessing === 'dismiss'}>
                      {isProcessing === 'dismiss' ? <Loader2 className="animate-spin" size={20} /> : "Dismiss Group Chat"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-border rounded-[2rem] max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Dismiss Group Chat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all messages and remove all members from the group chat. Members will be notified. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDismissGroup} className="rounded-xl bg-destructive text-destructive-foreground">
                        Confirm Dismissal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            )}

            <div className="bg-card border border-border p-8 rounded-[2.5rem] space-y-4 shadow-sm">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Team Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-2xl">
                  <span className="text-sm font-bold">Active Members</span>
                  <span className="text-lg font-black text-primary">{project.memberProfiles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-2xl">
                  <span className="text-sm font-bold">Pending Requests</span>
                  <span className="text-lg font-black text-primary">{projectRequests.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ManageTeam;