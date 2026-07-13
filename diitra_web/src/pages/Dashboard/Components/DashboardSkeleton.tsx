import React from 'react';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="w-full flex flex-col gap-8 skeleton-pulse animate-fade-in">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-thin/40">
                <div className="space-y-3">
                    {/* Role Tag Sim */}
                    <div className="skeleton-item h-4 w-32" />
                    {/* Title Sim */}
                    <div className="skeleton-item h-8 w-64 md:w-80" />
                    {/* Subtitle Sim */}
                    <div className="skeleton-item h-4 w-72 md:w-96" />
                </div>
                {/* Actions Buttons Sim */}
                <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <div className="skeleton-item h-9 w-28 flex-1 md:flex-none" />
                    <div className="skeleton-item h-9 w-28 flex-1 md:flex-none" />
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pb-10">
                {/* Main Content: Left Column */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Two-column Status Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Box 1: Proyectos por estado */}
                        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden p-6 flex flex-col justify-between min-h-[260px]">
                            <div className="space-y-5">
                                <div className="skeleton-item h-4 w-36" />
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="skeleton-item h-3 w-16 shrink-0" />
                                            <div className="skeleton-item h-2.5 flex-1" />
                                            <div className="skeleton-item h-3 w-6 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-border-thin/40 pt-4 mt-6 flex justify-between items-center">
                                <div className="skeleton-item h-3.5 w-24" />
                                <div className="skeleton-item h-3.5 w-8" />
                            </div>
                        </div>

                        {/* Box 2: Ejecución presupuestaria */}
                        <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden p-6 flex flex-col justify-between min-h-[260px]">
                            <div className="space-y-6">
                                <div className="skeleton-item h-4 w-40" />
                                <div className="space-y-3">
                                    <div className="skeleton-item h-10 w-28" />
                                    <div className="skeleton-item h-2.5 w-full" />
                                </div>
                            </div>
                            <div className="border-t border-border-thin/40 pt-4 mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="skeleton-item h-3 w-12 mb-1" />
                                    <div className="skeleton-item h-4 w-20" />
                                </div>
                                <div className="border-l border-border-thin/40 pl-4">
                                    <div className="skeleton-item h-3 w-12 mb-1" />
                                    <div className="skeleton-item h-4 w-20" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Box 3: Actividad Reciente */}
                    <div className="bento-card static bg-surface border border-border-thin shadow-sm rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-thin/60 flex items-center gap-2">
                            <div className="skeleton-item h-4 w-4 shrink-0" />
                            <div className="skeleton-item h-4 w-32" />
                        </div>
                        <div className="divide-y divide-border-thin/40 px-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton-item h-3.5 w-[85%]" />
                                        <div className="skeleton-item h-3 w-[50%] md:hidden" />
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="skeleton-item h-3.5 w-16" />
                                        <div className="skeleton-item h-5 w-20" />
                                        <div className="skeleton-item h-3.5 w-12 hidden md:block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Right Column */}
                <div className="flex flex-col gap-6">
                    {/* Eventos widget sim */}
                    <div className="bento-card static p-5 bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                            <div className="skeleton-item h-4 w-28" />
                            <div className="skeleton-item h-4 w-12" />
                        </div>
                        <div className="py-6 flex flex-col items-center justify-center space-y-3">
                            <div className="skeleton-item h-6 w-16" />
                            <div className="skeleton-item h-3 w-40" />
                        </div>
                    </div>

                    {/* Resumen Institucional sim */}
                    <div className="bento-card static p-5 bg-surface border border-border-thin shadow-sm rounded-xl space-y-5">
                        <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                            <div className="skeleton-item h-4 w-36" />
                            <div className="skeleton-item h-6 w-16" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 flex-1">
                                        <div className="skeleton-item h-4 w-4 rounded-full shrink-0" />
                                        <div className="skeleton-item h-3.5 w-32" />
                                    </div>
                                    <div className="skeleton-item h-3.5 w-16 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Producción Científica sim */}
                    <div className="bento-card static p-5 bg-surface border border-border-thin shadow-sm rounded-xl space-y-4">
                        <div className="pb-2 border-b border-border-thin/40">
                            <div className="skeleton-item h-4 w-32" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="skeleton-item h-3 w-28" />
                                    <div className="skeleton-item h-3.5 w-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
