import React from 'react';

const SkillBadge = ({ skill }: { skill: string }) => (
  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded-full border border-indigo-100">
    {skill}
  </span>
);

export default SkillBadge;