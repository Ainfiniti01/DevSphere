import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AnythingAIButton = ({ className }: { className?: string }) => {
  const handleOpenAI = () => {
    toast.info("Opening Anything AI Collaboration Suite...");
    // Placeholder for WebView/Iframe logic
  };

  return (
    <Button 
      onClick={handleOpenAI}
      variant="outline" 
      className={`bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100 gap-2 shadow-sm ${className}`}
    >
      <Sparkles size={16} className="text-amber-500" />
      <span className="font-semibold">Anything AI</span>
    </Button>
  );
};

export default AnythingAIButton;