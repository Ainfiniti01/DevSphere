"use client";

import React, { useState, useMemo } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Check } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import { useApp } from '@/context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const SKILLS = ["React", "Python", "UI/UX", "Backend", "Mobile Development", "AI / ML", "Web3", "TypeScript", "Node.js"];
const STAGES = ["Idea", "MVP", "Building", "Scaling", "Completed"];
const TIME_FILTERS = ["Today", "This week", "All time"];

const Explore = () => {
  const { projects } = useApp();
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("All time");

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Search filter
      const matchesSearch = 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
        p.creator.name.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      // Skills filter
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some(skill => 
          p.skills.some((ps: string) => ps.toLowerCase() === skill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // Stage filter
      if (selectedStage && p.stage !== selectedStage) return false;

      // Time filter
      if (selectedTime !== "All time") {
        const projectDate = new Date(p.timestamp || 0);
        const now = new Date();
        if (selectedTime === "Today") {
          const isToday = projectDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (selectedTime === "This week") {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (projectDate < oneWeekAgo) return false;
        }
      }

      return true;
    });
  }, [projects, search, selectedSkills, selectedStage, selectedTime]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedStage(null);
    setSelectedTime("All time");
  };

  const activeFilterCount = selectedSkills.length + (selectedStage ? 1 : 0) + (selectedTime !== "All time" ? 1 : 0);

  return (
    <MobileLayout title="Explore">
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-10 h-12 bg-accent/20 border-border rounded-xl" 
              placeholder="Search projects, skills..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 w-12 p-0 rounded-xl relative">
                <Filter size={20} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] bg-background border-border">
              <SheetHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary font-bold">
                  Clear All
                </Button>
              </SheetHeader>
              
              <ScrollArea className="h-full py-6 pr-4">
                <div className="space-y-8 pb-20">
                  {/* Skills */}
                  <section>
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map(skill => (
                        <Badge 
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className={cn(
                            "px-4 py-2 rounded-xl cursor-pointer transition-all",
                            selectedSkills.includes(skill) ? "bg-primary text-white" : "hover:bg-accent"
                          )}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </section>

                  {/* Project Stage */}
                  <section>
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Project Stage</h4>
                    <div className="flex flex-wrap gap-2">
                      {STAGES.map(stage => (
                        <Badge 
                          key={stage}
                          variant={selectedStage === stage ? "default" : "outline"}
                          className={cn(
                            "px-4 py-2 rounded-xl cursor-pointer transition-all",
                            selectedStage === stage ? "bg-primary text-white" : "hover:bg-accent"
                          )}
                          onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                        >
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </section>

                  {/* Time Filter */}
                  <section>
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Time Recency</h4>
                    <div className="flex flex-wrap gap-2">
                      {TIME_FILTERS.map(time => (
                        <Badge 
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className={cn(
                            "px-4 py-2 rounded-xl cursor-pointer transition-all",
                            selectedTime === time ? "bg-primary text-white" : "hover:bg-accent"
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>
                  Show {filteredProjects.length} Results
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              {search || activeFilterCount > 0 ? "Filtered Results" : "Discover Projects"}
            </h3>
            <span className="text-xs font-bold text-primary">{filteredProjects.length} found</span>
          </div>
          
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-accent/50 rounded-full flex items-center justify-center mb-4">
                <X className="text-muted-foreground" size={32} />
              </div>
              <h4 className="text-lg font-bold">No projects found</h4>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
              <Button variant="link" onClick={clearFilters} className="mt-4 text-primary font-bold">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Explore;