"use client";

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserMinus, Check, X, MessageSquare, Edit } from 'lucide-react';
import { toast } from 'sonner';

const ManageTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, setProjects, requests, setRequests, currentUser } = useApp();
  
  const project = projects.find(p => p.id === id);

  if (!project || project.creator.id !== currentUser?.id) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  const projectRequests = requests.filter(r => r.projectId === project.id && r.status === 'pending');

  const handleAccept = (req: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return { ...p, members: [...(p.members || []), req.userId] };
      }
      return p;
    }));
    setRequests(prev => prev.filter(r => r.id !== req.id));
    toast.success(`${req.userName} added to team!`);
  };

  const handleDecline = (reqId: string) => {
    setRequests(prev => prev.filter(r => r.id !== reqId));
    toast.info("Request declined");
  };

  const handleRemoveMember = (memberId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return { ...p, members: p.members.filter((m: string) => m !== memberId) };
      }
      return p;
    }));
    toast.success("Member removed from team");
  };

  return (
    <MobileLayout title="Manage Team" showBack>
      <div className="px-4 py-6 space-y-8">
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <div>
            <h3 className="font-bold text-sm">Project Settings</h3>
            <p className="text-[10px] text-muted-foreground">Update project details and skills</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl gap-2 font-bold"
            onClick={() => navigate(`/create?edit=${project.id}`)}
          >
            <Edit size={14} /> Edit Project
          </Button>
        </div>

        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Pending Requests ({projectRequests.length})</h3>
          <div className="space-y-3">
            {projectRequests.map(req => (
              <div key={req.id} className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.userAvatar} />
                    <AvatarFallback>{req.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{req.userName}</h4>
                    <p className="text-[10px] text-muted-foreground">{req.skills}</p>
                  </div>
                </div>
                <p className="text-xs italic text-muted-foreground mb-4 bg-accent/30 p-2 rounded-lg">"{req.reason}"</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleAccept(req)} className="flex-1 h-9 rounded-xl bg-primary text-xs font-bold gap-1">
                    <Check size={14} /> Accept
                  </Button>
                  <Button onClick={() => handleDecline(req.id)} variant="outline" className="flex-1 h-9 rounded-xl text-xs font-bold gap-1">
                    <X size={14} /> Decline
                  </Button>
                </div>
              </div>
            ))}
            {projectRequests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Team Members ({project.members?.length || 0})</h3>
          <div className="space-y-2">
            {project.members?.map((memberId: string) => (
              <div key={memberId} className="flex items-center justify-between p-3 bg-accent/20 rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} />
                    <AvatarFallback>M</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold">User_{memberId.slice(-4)}</h4>
                    <p className="text-[10px] text-muted-foreground">Member</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground" onClick={() => navigate(`/chat/${memberId}`)}>
                    <MessageSquare size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50" onClick={() => handleRemoveMember(memberId)}>
                    <UserMinus size={18} />
                  </Button>
                </div>
              </div>
            ))}
            {(!project.members || project.members.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default ManageTeam;