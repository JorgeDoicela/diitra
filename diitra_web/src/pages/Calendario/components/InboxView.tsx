import React from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
    Search, X, RotateCcw, FileText, Clock, Edit2, Trash2, Loader2,
    FlaskConical, Sparkles, Megaphone, ShieldCheck, TrendingUp, Inbox as InboxIcon, Settings, Calendar as CalendarIcon,
    Award, Users
} from 'lucide-react';
import { COLORES_OPCIONES } from '../../../services/calendarioService';
import { getModuleContext } from '../../../utils/moduleContext';
import type { Evento, PlanificandoState } from '../types/calendarioTypes';
import './InboxView.css';

const ALL_CATEGORIES = [
    { key: 'investigacion', label: 'Investigación', icon: FlaskConical },
    { key: 'innovacion', label: 'Innovación', icon: Sparkles },
    { key: 'convocatorias', label: 'Convocatorias', icon: Megaphone },
    { key: 'evaluacion', label: 'Evaluación Pares', icon: ShieldCheck },
    { key: 'calendario', label: 'Calendario', icon: CalendarIcon },
    { key: 'certificados', label: 'Certificados', icon: Award },
    { key: 'analiticas', label: 'Analíticas', icon: TrendingUp },
    { key: 'solicitudes', label: 'Solicitudes', icon: InboxIcon },
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'admin', label: 'Admin / Sistema', icon: Settings },
];

interface InboxViewProps {
    loadingNotes?: boolean;
    stickyNotes: Evento[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedFilterContext: string | null;
    setSelectedFilterContext: (c: string | null) => void;
    selectedFilterColor: string | null;
    setSelectedFilterColor: React.Dispatch<React.SetStateAction<string | null>>;
    draggedNoteIndex: number | null;
    draggedNote: Evento | null;
    draggedSize: { width: number; height: number };
    dragPreviewRef: React.RefObject<HTMLDivElement | null>;
    handleInboxPointerDown: (e: React.PointerEvent<HTMLDivElement>, note: Evento, index: number) => void;
    handleInboxPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    handleInboxPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    setPlanificando: React.Dispatch<React.SetStateAction<PlanificandoState | null>>;
    handleEditEventClick: (ev: Evento) => void;
    handleDeleteStickyNote: (uuid: string) => void;
    handleQuickPriorityChange: (note: Evento, prio: string) => void;
    handleQuickColorChange: (note: Evento, col: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
    loadingNotes = false,
    stickyNotes,
    searchQuery,
    setSearchQuery,
    selectedFilterContext,
    setSelectedFilterContext,
    selectedFilterColor,
    setSelectedFilterColor,
    draggedNoteIndex,
    draggedNote,
    draggedSize,
    dragPreviewRef,
    handleInboxPointerDown,
    handleInboxPointerMove,
    handleInboxPointerUp,
    setPlanificando,
    handleEditEventClick,
    handleDeleteStickyNote,
    handleQuickPriorityChange,
    handleQuickColorChange,
}) => {
    const [selectedSubmodule, setSelectedSubmodule] = React.useState<string | null>(null);

    // Resetear filtro de submódulo al cambiar la categoría principal
    const handleSelectCategory = (catKey: string | null) => {
        setSelectedFilterContext(catKey);
        setSelectedSubmodule(null);
    };

    // Conteos reactivos por categoría y submódulo
    const { moduleCounts, submoduleCountsByCat } = React.useMemo(() => {
        const mCounts: Record<string, number> = {};
        const sCounts: Record<string, Record<string, number>> = {};

        stickyNotes.forEach(note => {
            const info = getModuleContext(note.url_accion || '');
            const cat = info.categoryKey;
            mCounts[cat] = (mCounts[cat] || 0) + 1;

            if (info.submodulo) {
                if (!sCounts[cat]) sCounts[cat] = {};
                sCounts[cat][info.submodulo] = (sCounts[cat][info.submodulo] || 0) + 1;
            }
        });

        return { moduleCounts: mCounts, submoduleCountsByCat: sCounts };
    }, [stickyNotes]);

    // Submódulos existentes para la categoría seleccionada
    const currentSubmodules = React.useMemo(() => {
        if (!selectedFilterContext || !submoduleCountsByCat[selectedFilterContext]) return [];
        return Object.entries(submoduleCountsByCat[selectedFilterContext]).map(([name, count]) => ({
            name,
            count
        }));
    }, [selectedFilterContext, submoduleCountsByCat]);

    // Categorías visibles: ÚNICAMENTE aquellas donde el usuario realmente posee notas
    const visibleCategories = React.useMemo(() => {
        return ALL_CATEGORIES.filter(cat => (moduleCounts[cat.key] || 0) > 0);
    }, [moduleCounts]);

    // Colores disponibles de forma inteligente: basados en las notas del contexto activo
    const availableColors = React.useMemo(() => {
        const counts: Record<string, number> = {};
        stickyNotes.forEach(note => {
            if (selectedFilterContext) {
                const info = getModuleContext(note.url_accion || '');
                if (info.categoryKey !== selectedFilterContext) return;
                if (selectedSubmodule && info.submodulo !== selectedSubmodule) return;
            }
            const col = (note.color_hex || '#F59E0B').toUpperCase();
            counts[col] = (counts[col] || 0) + 1;
        });

        return COLORES_OPCIONES.map(c => ({
            ...c,
            count: counts[c.value.toUpperCase()] || 0
        })).filter(c => c.count > 0);
    }, [stickyNotes, selectedFilterContext, selectedSubmodule]);

    // Limpiar filtro de color si el color seleccionado ya no tiene notas en la sección activa
    React.useEffect(() => {
        if (selectedFilterColor && !availableColors.some(c => c.value.toLowerCase() === selectedFilterColor.toLowerCase())) {
            setSelectedFilterColor(null);
        }
    }, [availableColors, selectedFilterColor, setSelectedFilterColor]);

    return (
        <div className="sticky-inbox-view">
            {/* ── Barra de herramientas premium (Búsqueda + Filtros) ── */}
            <div className="sticky-inbox-toolbar animate-slide-up flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div className="sticky-inbox-search-wrapper">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por título o contenido de la nota..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sticky-inbox-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="search-clear-btn"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="sticky-inbox-filters-wrapper">
                        {/* Filtro por color de tarjeta inteligente */}
                        {loadingNotes ? (
                            <div className="h-6 w-16 bg-surface-hover rounded-full animate-pulse" />
                        ) : availableColors.length > 0 && (
                            <div className="sticky-inbox-color-filters">
                                {availableColors.map(col => (
                                    <button
                                        key={col.value}
                                        type="button"
                                        className={`inbox-color-filter-dot ${selectedFilterColor === col.value ? 'active' : ''}`}
                                        style={{ backgroundColor: col.value }}
                                        onClick={() => setSelectedFilterColor(prev => prev === col.value ? null : col.value)}
                                        title={`${col.label} (${col.count})`}
                                    />
                                ))}
                                {selectedFilterColor && (
                                    <button
                                        type="button"
                                        className="inbox-color-filter-clear"
                                        onClick={() => setSelectedFilterColor(null)}
                                        title="Limpiar filtro de color"
                                    >
                                        <RotateCcw size={10} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filtro por módulo de origen (Nivel 1) */}
                <div className="flex flex-col gap-2 w-full pt-1 border-t border-border-thin">
                    {loadingNotes ? (
                        <div className="flex items-center gap-2 py-0.5">
                            <div className="h-6 w-14 bg-surface-hover rounded-full animate-pulse" />
                            <div className="h-6 w-24 bg-surface-hover rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="sticky-inbox-context-filters">
                            <button
                                type="button"
                                className={`inbox-filter-chip ${selectedFilterContext === null ? 'active' : ''}`}
                                onClick={() => handleSelectCategory(null)}
                            >
                                <span>Todos</span>
                                <span className="inbox-filter-badge">{stickyNotes.length}</span>
                            </button>
                            {visibleCategories.map(ctx => {
                                const count = moduleCounts[ctx.key] || 0;
                                return (
                                    <button
                                        key={ctx.key}
                                        type="button"
                                        className={`inbox-filter-chip ${selectedFilterContext === ctx.key ? 'active' : ''}`}
                                        onClick={() => handleSelectCategory(selectedFilterContext === ctx.key ? null : ctx.key)}
                                    >
                                        <ctx.icon size={11} className="mr-1.5 opacity-70" />
                                        <span>{ctx.label}</span>
                                        {count > 0 && (
                                            <span className="inbox-filter-badge">{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Filtro por submódulo granular (Nivel 2) */}
                    {selectedFilterContext && currentSubmodules.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-border-thin/60 flex-wrap animate-slide-up">
                            <span className="text-[11px] font-semibold text-text-dim mr-1">Submódulos:</span>
                            <button
                                type="button"
                                className={`inbox-subfilter-chip ${selectedSubmodule === null ? 'active' : ''}`}
                                onClick={() => setSelectedSubmodule(null)}
                            >
                                <span>Todos en {ALL_CATEGORIES.find(c => c.key === selectedFilterContext)?.label}</span>
                                <span className="ml-1 opacity-70 font-mono text-[9.5px]">({moduleCounts[selectedFilterContext] || 0})</span>
                            </button>
                            {currentSubmodules.map(sub => (
                                <button
                                    key={sub.name}
                                    type="button"
                                    className={`inbox-subfilter-chip ${selectedSubmodule === sub.name ? 'active' : ''}`}
                                    onClick={() => setSelectedSubmodule(prev => prev === sub.name ? null : sub.name)}
                                >
                                    <span>{sub.name}</span>
                                    <span className="ml-1 opacity-70 font-mono text-[9.5px]">({sub.count})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rejilla responsiva de notas filtradas ── */}
            <div className="sticky-inbox-grid">
                {(() => {
                    const filteredNotes = stickyNotes.filter(note => {
                        const matchesSearch = note.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (note.nota_detalle || '').toLowerCase().includes(searchQuery.toLowerCase());

                        const matchesContext = (() => {
                            if (!selectedFilterContext) return true;
                            const info = getModuleContext(note.url_accion || '');
                            if (info.categoryKey !== selectedFilterContext) return false;
                            if (selectedSubmodule && info.submodulo !== selectedSubmodule) return false;
                            return true;
                        })();

                        const matchesColor = !selectedFilterColor ? true : note.color_hex === selectedFilterColor;

                        return matchesSearch && matchesContext && matchesColor;
                    });

                    if (loadingNotes) {
                        return (
                            <div className="sticky-inbox-empty col-span-full py-16 flex flex-col items-center justify-center gap-3">
                                <Loader2 size={24} className="animate-spin text-brand" />
                                <span className="text-xs text-text-dim font-medium">Cargando bandeja de notas...</span>
                            </div>
                        );
                    }

                    if (filteredNotes.length === 0) {
                        return (
                            <div className="sticky-inbox-empty col-span-full animate-slide-up">
                                <div className="text-center p-12 bg-surface border border-border-thin rounded-xl max-w-md mx-auto">
                                    <FileText size={40} className="text-text-dim mx-auto mb-4 opacity-50" />
                                    <h4 className="text-sm font-bold text-fg mb-1">Sin notas coincidentes</h4>
                                    <p className="text-xs text-text-dim leading-relaxed">
                                        {stickyNotes.length === 0
                                            ? 'Usa el botón flotante en la esquina inferior derecha o el botón "Añadir Nota" de arriba para guardar recordatorios rápidos.'
                                            : 'Prueba a cambiar tus términos de búsqueda o a limpiar los filtros activos de arriba.'
                                        }
                                    </p>
                                    {(searchQuery || selectedFilterContext || selectedFilterColor) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedFilterContext(null);
                                                setSelectedFilterColor(null);
                                            }}
                                            className="btn-vercel-secondary text-[11px] py-1.5 px-4 mt-4 rounded mx-auto"
                                        >
                                            Limpiar Filtros
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return filteredNotes.map((note, index) => {
                        const indexReal = stickyNotes.findIndex(n => n.uuid === note.uuid);

                        const contextoInfo = getModuleContext(note.url_accion || '');

                        return (
                            <motion.div
                                key={note.uuid}
                                layout
                                onPointerDown={(e) => handleInboxPointerDown(e, note, indexReal !== -1 ? indexReal : index)}
                                onPointerMove={handleInboxPointerMove}
                                onPointerUp={handleInboxPointerUp}
                                data-note-uuid={note.uuid}
                                className={`inbox-note-card animate-slide-up ${draggedNoteIndex === (indexReal !== -1 ? indexReal : index) ? 'dragging' : ''}`}
                                style={{
                                    '--note-color': note.color_hex || '#F59E0B',
                                    animationDelay: `${index * 0.04}s`,
                                    touchAction: 'none'
                                } as React.CSSProperties}
                                transition={{
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 26
                                }}
                            >
                                <div className="inbox-note-header">
                                    <h4 className="inbox-note-title">{note.titulo}</h4>
                                    <div className="inbox-note-actions">
                                        <button
                                            type="button"
                                            className="inbox-note-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                setPlanificando({
                                                    note,
                                                    targetEstado: 'Pendiente',
                                                    anchorPos: { x: btnRect.left + btnRect.width / 2, y: btnRect.top + window.scrollY - 10 }
                                                });
                                            }}
                                            title="Planificar en Agenda"
                                        >
                                            <Clock size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="inbox-note-btn"
                                            onClick={() => handleEditEventClick(note)}
                                            title="Editar nota"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            className="inbox-note-btn delete"
                                            onClick={() => handleDeleteStickyNote(note.uuid)}
                                            title="Eliminar nota"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {note.nota_detalle && (
                                    <p className="inbox-note-description">{note.nota_detalle}</p>
                                )}

                                <div className="inbox-note-footer">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {contextoInfo && (
                                            <div className="inbox-note-context" title={`${contextoInfo.modulo}${contextoInfo.submodulo ? ` › ${contextoInfo.submodulo}` : ''}`}>
                                                <contextoInfo.Icon size={10} className="opacity-70" />
                                                <span>{contextoInfo.modulo}</span>
                                                {contextoInfo.submodulo && (
                                                    <>
                                                        <span className="opacity-40">›</span>
                                                        <span className="font-semibold">{contextoInfo.submodulo}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <select
                                            value={note.prioridad}
                                            onChange={(e) => handleQuickPriorityChange(note, e.target.value)}
                                            className="inbox-note-priority-select"
                                            title="Cambiar prioridad"
                                        >
                                            <option value="Baja">Prioridad Baja</option>
                                            <option value="Media">Prioridad Media</option>
                                            <option value="Alta">Prioridad Alta</option>
                                        </select>
                                    </div>

                                    <div className="inbox-note-quick-colors">
                                        {COLORES_OPCIONES.map(col => (
                                            <button
                                                key={col.value}
                                                type="button"
                                                className={`inbox-note-quick-color-dot ${note.color_hex === col.value ? 'active' : ''}`}
                                                style={{ backgroundColor: col.value }}
                                                onClick={() => handleQuickColorChange(note, col.value)}
                                                title={col.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    });
                })()}
            </div>
            {draggedNote && (() => {
                const draggedContextoChip = (() => {
                    const url = draggedNote.url_accion || '';
                    if (url.startsWith('/investigacion/proyectos')) return { label: 'Proyectos', icon: Folder };
                    if (url.startsWith('/investigacion/convocatorias')) return { label: 'Convocatorias', icon: Bell };
                    if (url.includes('/cronograma/')) return { label: 'Cronograma', icon: CalendarIcon };
                    if (url.startsWith('/investigacion')) return { label: 'Investigación', icon: BookOpen };
                    if (url.startsWith('/agenda')) return { label: 'Agenda', icon: CalendarIcon };
                    if (url.startsWith('/analiticas')) return { label: 'Analíticas', icon: TrendingUp };
                    return null;
                })();

                return createPortal(
                    <div
                        ref={dragPreviewRef}
                        className="inbox-note-card-drag-preview"
                        style={{
                            position: 'fixed',
                            width: draggedSize.width,
                            height: draggedSize.height,
                            pointerEvents: 'none',
                            zIndex: 99999,
                            '--note-color': draggedNote.color_hex || '#F59E0B',
                            background: `color-mix(in srgb, ${draggedNote.color_hex || '#F59E0B'} 8%, var(--surface))`,
                            border: `1px solid color-mix(in srgb, ${draggedNote.color_hex || '#F59E0B'} 30%, var(--border))`,
                        } as React.CSSProperties}
                    >
                        <div className="inbox-note-header">
                            <h4 className="inbox-note-title">{draggedNote.titulo}</h4>
                        </div>
                        {draggedNote.nota_detalle && (
                            <p className="inbox-note-description">{draggedNote.nota_detalle}</p>
                        )}
                        <div className="inbox-note-footer" style={{ border: 'none', padding: 0 }}>
                            <div className="flex flex-col items-start gap-1.5">
                                {draggedContextoChip && (
                                    <div className="inbox-note-context" style={{ margin: 0 }}>
                                        <draggedContextoChip.icon size={10} className="opacity-70" />
                                        <span>{draggedContextoChip.label}</span>
                                    </div>
                                )}
                                {draggedNote.prioridad && (
                                    <span className="inbox-note-priority-select" style={{ cursor: 'default', margin: 0 }}>
                                        Prioridad {draggedNote.prioridad}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            })()}
        </div>
    );
};
