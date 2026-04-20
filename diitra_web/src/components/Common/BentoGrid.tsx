import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid = ({ children, className = "" }: BentoGridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-3 ${className}`}>
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const BentoCard = ({ children, className = "", title, description, icon }: BentoCardProps) => {
  return (
    <div className={`bento-card p-6 flex flex-col justify-between group ${className}`}>
      {title && (
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            {icon && <div className="text-text-dim group-hover:text-text-main transition-colors">{icon}</div>}
            <h3 className="text-xs font-bold tracking-widest text-text-main uppercase opacity-90">{title}</h3>
          </div>
          {description && <p className="text-xs text-text-dim font-normal leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};
