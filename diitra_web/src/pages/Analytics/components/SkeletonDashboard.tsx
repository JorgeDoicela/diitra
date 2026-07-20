import React from 'react';

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6 animate-pulse select-none">
        <div className="h-28 bg-surface-hover/30 rounded-2xl border border-border-thin p-5 flex flex-col justify-between">
            <div className="w-1/4 h-3 bg-border-thin/40 rounded"></div>
            <div className="w-2/3 h-6 bg-border-thin/40 rounded mt-2"></div>
            <div className="w-1/2 h-3 bg-border-thin/40 rounded mt-2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-surface-hover/30 border border-border-thin rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="w-20 h-2 bg-border-thin/40 rounded"></div>
                        <div className="w-6 h-6 bg-border-thin/40 rounded-lg"></div>
                    </div>
                    <div className="w-14 h-8 bg-border-thin/40 rounded"></div>
                    <div className="w-24 h-3 bg-border-thin/40 rounded"></div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-surface-hover/30 border border-border-thin rounded-2xl lg:col-span-1"></div>
            <div className="h-96 bg-surface-hover/30 border border-border-thin rounded-2xl lg:col-span-2"></div>
        </div>
    </div>
);
