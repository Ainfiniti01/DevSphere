import React from 'react';
import { Heart, Share2, MessageCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillBadge from './SkillBadge';
import { useNavigate } from 'react-router-dom';

interface ProjectProps {
  id: string;
  title: string;
  creator: { name: string; avatar: string; role: string };
  thumbnail: string;
  skills: string[];
  description: string;
}

const ProjectCard = ({ project }: { project: ProjectProps }) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow mb-4">
      <CardHeader className="p-4 flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10 border border-slate-100">
          <AvatarImage src={project.creator.avatar} />
          <AvatarFallback>{project.creator.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{project.creator.name}</h4>
          <p className="text-[11px] text-slate-500">{project.creator.role}</p>
        </div>
      </CardHeader>
      
      <div 
        className="relative aspect-video bg-slate-200 cursor-pointer group"
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <PlayCircle className="text-white opacity-80 group-hover:opacity-100 transition-opacity" size={48} />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg drop-shadow-md">{project.title}</h3>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map(skill => <SkillBadge key={skill} skill={skill} />)}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-slate-50 mt-2">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
            <Heart size={20} />
            <span className="text-xs font-medium">24</span>
          </button>
          <button className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
            <MessageCircle size={20} />
            <span className="text-xs font-medium">8</span>
          </button>
        </div>
        <button className="text-slate-500 hover:text-slate-900 transition-colors">
          <Share2 size={20} />
        </button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;