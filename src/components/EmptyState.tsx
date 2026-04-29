"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionPath }: EmptyStateProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-20 h-20 bg-accent/50 rounded-full flex items-center justify-center mb-6">
        <Icon className="text-muted-foreground" size={40} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[250px] mb-8">
        {description}
      </p>
      {actionLabel && actionPath && (
        <Button 
          onClick={() => navigate(actionPath)}
          className="rounded-2xl px-8 h-12 font-bold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;