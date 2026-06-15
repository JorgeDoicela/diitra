import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    MessageSquare,
    CheckCircle,
    Clock,
    Send,
    User,
    Activity,
    ChevronRight,
    Loader
} from 'lucide-react';
import type { CoWorkHandle } from '../../core/cowork/types';
import api from '../../api/axios_config';

interface CollaborationSidebarProps {
    instanceUuid: string;
    sectionName: string;
    cowork: CoWorkHandle;
    allSections: string[];
    onClose: () => void;
}

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
    instanceUuid,
    sectionName,
    cowork,
    allSections,
    onClose
}) => {
    const [activeTab, setActiveTabState] = useState<'comments' | 'status' | 'activity'>(() => {
        const saved = localStorage.getItem('document_sidebar_tab');
        return (saved === 'comments' || saved === 'status' || saved === 'activity') ? saved : 'comments';
    });

    const setActiveTab = useCallback((tab: 'comments' | 'status' | 'activity') => {
        localStorage.setItem('document_sidebar_tab', tab);
        setActiveTabState(tab);
    }, []);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [sectionStatuses, setSectionStatuses] = useState<Record<string, string>>({});
    const [isLoadingPulse, setIsLoadingPulse] = useState(true);

    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Cargar Pulso Inicial (Historial de comentarios y estados)
    useEffect(() => {
        const fetchInitialPulse = async () => {
            setIsLoadingPulse(true);
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
            } finally {
                setIsLoadingPulse(false);
            }
        };

        if (instanceUuid) {
            fetchInitialPulse();
        }
    }, [instanceUuid]);

    // Suscribirse a eventos de tiempo real del Hub CoWork
    useEffect(() => {
        if (!cowork) return;

        cowork.onNewCommentReceived((data) => {
            setComments(prev => [data, ...prev].slice(0, 50));
        });

        cowork.onSectionActivity((data) => {
            setActivities(prev => [data, ...prev].slice(0, 20));
        });

        cowork.onSectionStatusUpdated((data) => {
            setSectionStatuses(prev => ({
                ...prev,
                [data.sectionName]: data.status
            }));
        });
    }, [cowork]);

    // Cálculo dinámico de progreso global basado en aprobaciones
    const globalProgress = useMemo(() => {
        if (!allSections.length) return 0;
        const approvedCount = allSections.filter(s => sectionStatuses[s] === 'Aprobado').length;
        return Math.round((approvedCount / allSections.length) * 100);
    }, [allSections, sectionStatuses]);

    // Publicar comentario en tiempo real
    const handlePostComment = async () => {
        if (!comment.trim()) return;
        try {
            await cowork.postComment(instanceUuid, comment);
            setComment('');
        } catch (err) {
            console.error("[Team Pulse] Error al enviar comentario:", err);
        }
    };

    // Actualizar estado de sección colaborativa
    const handleUpdateStatus = async (status: string) => {
        try {
            await cowork.updateSectionStatus(instanceUuid, sectionName, status);
        } catch (err) {
            console.error("[Team Pulse] Error al actualizar estado:", err);
        }
    };

    // Formatear hora de forma legible
    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <aside className="w-80 h-full bg-surface border-l border-border-thin flex flex-col shadow-2xl z-40 transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border-thin flex items-center justify-between bg-bg-deep/50">
                <div className="flex items-center gap-2">
                    <Activity size={15} className="text-brand animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-main">Actividad del equipo</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                    title="Cerrar panel lateral"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-thin bg-surface-hover/30">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'comments' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <MessageSquare size={14} />
                    <span>Chat</span>
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'status' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <CheckCircle size={14} />
                    <span>Estado</span>
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${activeTab === 'activity' ? 'border-brand text-brand bg-brand/5' : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                >
                    <Clock size={14} />
                    <span>Actividad</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg-deep/10 flex flex-col">
                {isLoadingPulse ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 opacity-70">
                        <Loader size={24} className="animate-spin text-brand" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Cargando datos...</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'comments' && (
                            <div className="flex flex-col h-full flex-1">
                                <div className="flex-1 space-y-3 mb-4">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-12 opacity-50 flex flex-col items-center justify-center">
                                            <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                                <MessageSquare size={20} className="text-text-dim" />
                                            </div>
                                            <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Sin comentarios aún</p>
                                            <p className="text-[8px] text-text-dim mt-1 max-w-[150px] leading-relaxed">Escribe un mensaje para coordinar la redacción.</p>
                                        </div>
                                    ) : (
                                        comments.map((c, i) => (
                                            <div key={c.uuid || i} className="bg-surface rounded-xl p-3.5 border border-border-thin shadow-sm hover:border-border-normal transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black text-brand uppercase tracking-wider">{c.nombreUsuario}</span>
                                                    <span className="text-[8px] text-text-dim font-mono">{formatTime(c.creadoEn)}</span>
                                                </div>
                                                <p className="text-xs text-text-main leading-relaxed select-text">{c.contenido}</p>
                                            </div>
                                        ))
                                    )}
                                    <div ref={commentsEndRef} />
                                </div>
                                <div className="mt-auto relative pt-2">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handlePostComment();
                                            }
                                        }}
                                        placeholder="Escribe un mensaje al equipo..."
                                        className="w-full bg-surface border border-border-thin rounded-xl p-3 pr-12 text-xs focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none resize-none h-20 transition-all custom-scrollbar placeholder:text-text-dim/60"
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        className="absolute bottom-5 right-3 p-2 bg-text-main hover:bg-brand text-bg-deep hover:text-text-main rounded-lg shadow-lg active:scale-95 transition-all"
                                        title="Enviar mensaje"
                                    >
                                        <Send size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'status' && (
                            <div className="space-y-6">
                                <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-[9px] font-black uppercase text-brand mb-2.5 tracking-widest">Mi Sección Actual</h4>
                                    <p className="text-xs font-bold text-text-main mb-4 capitalize">{sectionName.replace(/_/g, ' ')}</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['Borrador', 'Revisión', 'Aprobado'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateStatus(s)}
                                                className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${(sectionStatuses[sectionName] || 'Borrador') === s
                                                        ? 'bg-brand text-bg-deep border-brand shadow-lg font-black'
                                                        : 'bg-surface border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-surface border border-border-thin rounded-2xl space-y-3">
                                    <h4 className="text-[9px] font-black uppercase text-text-dim tracking-widest">Estado del Informe</h4>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-text-dim uppercase tracking-wider">Aprobación Global</span>
                                        <span className="text-brand font-mono font-black">{globalProgress}%</span>
                                    </div>
                                    <div className="w-full bg-bg-deep h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand transition-all duration-500 rounded-full"
                                            style={{ width: `${globalProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[8px] text-text-dim uppercase leading-relaxed font-bold tracking-tight">
                                        Secciones aprobadas: {allSections.filter(s => sectionStatuses[s] === 'Aprobado').length} de {allSections.length}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                {activities.length === 0 ? (
                                    <div className="text-center py-12 opacity-50 flex flex-col items-center justify-center">
                                        <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                            <Activity size={20} className="text-text-dim" />
                                        </div>
                                        <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Esperando actividad...</p>
                                        <p className="text-[8px] text-text-dim mt-1 max-w-[150px] leading-relaxed">Los movimientos del equipo aparecerán en este panel en tiempo real.</p>
                                    </div>
                                ) : (
                                    activities.map((a, i) => (
                                        <div key={i} className="flex items-start gap-3 border-l-2 border-brand/30 pl-3 py-1 animate-fade-up">
                                            <div className="mt-0.5 shrink-0">
                                                <User size={12} className="text-brand" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-text-main leading-relaxed">
                                                    <span className="font-black text-brand text-[10px] uppercase tracking-wider">{a.userName}</span> {a.action}
                                                </p>
                                                <p className="text-[9px] text-text-dim/80 font-bold uppercase tracking-wider mt-0.5">
                                                    {a.sectionName.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-[8px] text-text-dim font-mono mt-1">
                                                    {formatTime(a.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-bg-deep/50 border-t border-border-thin flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-green-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Sincronización activa
                </div>
                <div className="text-[8px] text-text-dim font-mono font-bold">
                    Colaboración en vivo
                </div>
            </div>
        </aside>
    );
};

export default CollaborationSidebar;
