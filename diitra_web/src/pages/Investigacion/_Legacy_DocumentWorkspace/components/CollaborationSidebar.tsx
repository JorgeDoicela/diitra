import React, { useState, useEffect, useMemo } from 'react';
import { 
    MessageSquare, 
    CheckCircle, 
    Clock, 
    Send, 
    User,
    Activity,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import type { CoWorkHandle } from '../../../../core/cowork';

import api from '../../../../api/axios_config';

interface CollaborationSidebarProps {
    instanceUuid: string;
    sectionName: string;
    cowork: CoWorkHandle;
    allSections: string[];
}

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({ instanceUuid, sectionName, cowork, allSections }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'comments' | 'status' | 'activity'>('comments');
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [sectionStatuses, setSectionStatuses] = useState<Record<string, string>>({});

    // Cargar Pulso Inicial
    useEffect(() => {
        const fetchInitialPulse = async () => {
            try {
                const res = await api.get(`/collaboration/${instanceUuid}/pulse`);
                if (res.data.comments) setComments(res.data.comments);
                if (res.data.statuses) {
                    const mappedStatuses: Record<string, string> = {};
                    Object.entries(res.data.statuses).forEach(([key, val]: [string, any]) => {
                        mappedStatuses[key] = typeof val === 'string' ? val : (val?.estado || 'Borrador');
                    });
                    setSectionStatuses(mappedStatuses);
                }
            } catch (err) {
                console.error("[Team Pulse] Error al cargar pulso inicial:", err);
            }
        };

        if (instanceUuid) fetchInitialPulse();
    }, [instanceUuid]);

    useEffect(() => {
        // Suscribirse a eventos de tiempo real
        cowork.onNewCommentReceived((data) => {
            setComments(prev => [data, ...prev].slice(0, 50));
        });

        cowork.onSectionActivity((data) => {
            setActivities(prev => [data, ...prev].slice(0, 10));
        });

        cowork.onSectionStatusUpdated((data) => {
            setSectionStatuses(prev => ({
                ...prev,
                [data.sectionName]: data.status
            }));
        });
    }, [cowork]);

    // Cálculo dinámico de progreso
    const globalProgress = useMemo(() => {
        if (!allSections.length) return 0;
        const approvedCount = allSections.filter(s => sectionStatuses[s] === 'Aprobado').length;
        return Math.round((approvedCount / allSections.length) * 100);
    }, [allSections, sectionStatuses]);

    const handlePostComment = async () => {
        if (!comment.trim()) return;
        await cowork.postComment(instanceUuid, comment);
        setComment('');
    };

    const handleUpdateStatus = async (status: string) => {
        await cowork.updateSectionStatus(instanceUuid, sectionName, status);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 bg-surface border border-r-0 border-border-thin p-2 rounded-l-xl shadow-xl z-40 hover:bg-primary/5 text-primary transition-all"
            >
                <ChevronLeft size={20} />
            </button>
        );
    }

    return (
        <aside className="w-80 bg-surface border-l border-border-thin flex flex-col shadow-2xl z-40 transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border-thin flex items-center justify-between bg-gray-50/50 dark:bg-bg-deep/50">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-text-main">Actividad del equipo</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-bg-deep rounded-lg text-text-dim transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-thin">
                <button 
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'comments' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-dim hover:text-text-main'
                    }`}
                >
                    <MessageSquare size={14} className="mx-auto mb-1" />
                    Chat
                </button>
                <button 
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'status' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-dim hover:text-text-main'
                    }`}
                >
                    <CheckCircle size={14} className="mx-auto mb-1" />
                    Estado
                </button>
                <button 
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === 'activity' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-dim hover:text-text-main'
                    }`}
                >
                    <Clock size={14} className="mx-auto mb-1" />
                    Pulso
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'comments' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 mb-4">
                            {comments.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <MessageSquare size={32} className="mx-auto mb-2 text-text-dim" />
                                    <p className="text-[10px] font-bold text-text-dim uppercase">No hay comentarios aún</p>
                                </div>
                            )}
                            {comments.map((c, i) => (
                                <div key={c.uuid || i} className="bg-bg-deep rounded-xl p-3 border border-border-thin shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-primary">{c.nombreUsuario}</span>
                                        <span className="text-[8px] text-text-dim font-mono">{new Date(c.creadoEn).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-text-main leading-relaxed">{c.contenido}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto relative">
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un mensaje al equipo..."
                                className="w-full bg-bg-deep border border-border-thin rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20 transition-all"
                            />
                            <button 
                                onClick={handlePostComment}
                                className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'status' && (
                    <div className="space-y-6">
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                            <h4 className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest">Mi Sección Actual</h4>
                            <p className="text-xs font-bold text-text-main mb-4 capitalize">{sectionName.replace(/_/g, ' ')}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['Borrador', 'Revisión', 'Aprobado'].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => handleUpdateStatus(s)}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                                            (sectionStatuses[sectionName] || 'Borrador') === s 
                                            ? 'bg-primary text-white border-primary shadow-lg' 
                                            : 'bg-surface border-border-thin text-text-dim hover:bg-gray-50 dark:hover:bg-bg-deep'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-text-dim mb-3 tracking-widest">Resumen del Informe</h4>
                            <div className="flex items-center justify-between p-2 bg-bg-deep rounded-lg text-[10px] font-bold">
                                <span className="text-text-dim uppercase">Progreso Global</span>
                                <span className="text-primary">{globalProgress}%</span>
                            </div>
                            <div className="w-full bg-bg-deep h-1 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${globalProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        {activities.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <Activity size={32} className="mx-auto mb-2 text-text-dim" />
                                <p className="text-[10px] font-bold text-text-dim uppercase">Esperando actividad...</p>
                            </div>
                        )}
                        {activities.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 border-l-2 border-primary/20 pl-4 py-1">
                                <div className="mt-1">
                                    <User size={12} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-main font-medium">
                                        <span className="font-black">{a.userName}</span> {a.action}
                                    </p>
                                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">
                                        {a.sectionName.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[8px] text-text-dim font-mono mt-1">
                                        {new Date(a.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-bg-deep/50 border-t border-border-thin">
                <div className="flex items-center gap-2 text-[9px] font-bold text-text-dim">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    SINCRO REAL-TIME ACTIVA
                </div>
            </div>
        </aside>
    );
};

export default CollaborationSidebar;
