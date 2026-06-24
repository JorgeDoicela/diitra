import React, { useState, useEffect } from 'react';
import { 
    Calendar, Trash2, Target, User, FileCheck, Palette, 
    Clock, Layers, ChevronDown, ChevronUp, 
    AlertCircle, Copy, Move, GripVertical, CalendarDays, 
    Info, Plus, Compass 
} from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

// Helper puro para obtener el primer y último checked week
const getWeekRange = (semanas: boolean[]) => {
    if (!semanas || semanas.length === 0) return { start: -1, end: -1 };
    const start = semanas.indexOf(true);
    if (start === -1) return { start: -1, end: -1 };
    const last = semanas.lastIndexOf(true);
    return { start, end: last };
};

// Helper puro para obtener las iniciales del responsable
const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const parts = nameStr.split(' ').filter(p => p.trim().length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface TimelineSectionProps {
    cronograma: any[];
    formData?: any;
    cowork: CoWorkHandle;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    readOnly?: boolean;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
    cronograma = [],
    formData = {},
    cowork,
    onAdd,
    onRemove,
    onUpdate,
    onReorder,
    readOnly = false
}) => {
    // --- ESTADOS INTERACTIVOS DE LA VISTA ---
    const [activeTab, setActiveTab] = useState<'gantt' | 'cards' | 'calendar'>('gantt');
    const [expandedCard, setExpandedCard] = useState<number | null>(0);
    const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
    const [dragOverCardIndex, setDragOverCardIndex] = useState<number | null>(null);
    const [pendingSuggestedToAdd, setPendingSuggestedToAdd] = useState<any | null>(null);
    const [dragOverTimelineWeek, setDragOverTimelineWeek] = useState<number | null>(null);

    // Estado original para pintar celdas con click + drag
    const [cellDragInfo, setCellDragInfo] = useState<{
        activityIndex: number;
        startWeek: number;
        currentWeek: number;
    } | null>(null);

    // --- LIBERAR EL ARRASTRE DE CELDAS DE MANERA GLOBAL ---
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (cellDragInfo) {
                const { activityIndex, startWeek, currentWeek } = cellDragInfo;
                const minW = Math.min(startWeek, currentWeek);
                const maxW = Math.max(startWeek, currentWeek);
                
                const newSemanas = Array(totalWeeks).fill(false);
                for (let w = minW; w <= maxW; w++) {
                    newSemanas[w] = true;
                }
                
                onUpdate(activityIndex, 'Semanas', newSemanas);
                
                if (projectStartDate) {
                    const actStart = new Date(projectStartDate.getTime());
                    actStart.setDate(projectStartDate.getDate() + minW * 7);
                    onUpdate(activityIndex, 'FechaInicioPrevista', formatDateForInput(actStart));
                    
                    const actEnd = new Date(projectStartDate.getTime());
                    actEnd.setDate(projectStartDate.getDate() + (maxW + 1) * 7 - 1);
                    onUpdate(activityIndex, 'FechaFinPrevista', formatDateForInput(actEnd));
                }
                
                setCellDragInfo(null);
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [cellDragInfo]);

    // --- CATÁLOGO DE ACTIVIDADES SUGERIDAS (CACES / SENESCYT) ---
    const suggestedCatalog = [
        {
            Actividad: "Revisión de literatura y fundamentación teórica",
            RecursosNecesarios: "Acceso a bases de datos científicas (Scopus/IEEE), biblioteca digital.",
            Entregable: "Documento de Marco Teórico y Bibliografía inicial compilada en APA.",
            colorHex: "#0070f3",
            IdObjetivo: 0,
            description: "Fase fundamental de recopilación de antecedentes y fundamentación teórica.",
            weeksRange: [0, 3]
        },
        {
            Actividad: "Diseño conceptual y validación de instrumentos",
            RecursosNecesarios: "Computador con herramientas de diagramación, cuestionarios, software de encuestas.",
            Entregable: "Formularios de encuesta validados o diseño de laboratorio aprobado.",
            colorHex: "#00dfd8",
            IdObjetivo: 1,
            description: "Elaboración y prueba piloto de cuestionarios, experimentos o prototipos.",
            weeksRange: [2, 5]
        },
        {
            Actividad: "Trabajo de campo, experimentación y recolección de datos",
            RecursosNecesarios: "Equipos de laboratorio, reactivos, licencias, transporte de campo.",
            Entregable: "Bitácoras firmadas y bases de datos crudos estructuradas.",
            colorHex: "#f5a623",
            IdObjetivo: 1,
            description: "Fase operativa de campo o laboratorio para colecta experimental de datos.",
            weeksRange: [4, 7]
        },
        {
            Actividad: "Procesamiento de datos y análisis estadístico",
            RecursosNecesarios: "Software analítico (Excel, SPSS, R, Python), internet.",
            Entregable: "Reporte de resultados, tablas cruzadas y gráficos analizados.",
            colorHex: "#7928ca",
            IdObjetivo: 1,
            description: "Tabulación y aplicación de modelos estadísticos sobre datos colectados.",
            weeksRange: [6, 9]
        },
        {
            Actividad: "Redacción de informe final técnico y artículo indexado",
            RecursosNecesarios: "Computador, procesador de texto, guías de publicación institucional.",
            Entregable: "Borrador de artículo científico y reporte técnico final completo.",
            colorHex: "#00e054",
            IdObjetivo: 0,
            description: "Sistematización teórica y preparación de manuscrito para publicación científica.",
            weeksRange: [8, 11]
        },
        {
            Actividad: "Firma electrónica de informes y subida al Repositorio DSpace",
            RecursosNecesarios: "Firma digital (.p12), token de acceso al Repositorio Traversari.",
            Entregable: "Certificado de depósito digital en el repositorio Traversari.",
            colorHex: "#ff0080",
            IdObjetivo: 0,
            description: "Transferencia tecnológica y publicación digital obligatoria CACES.",
            weeksRange: [10, 11]
        }
    ];

    // --- EFECTO MAESTRO PARA DETECTAR drop DE SUGERIDOS ---
    useEffect(() => {
        if (pendingSuggestedToAdd && cronograma.length > 0) {
            const lastIdx = cronograma.length - 1;
            const act = pendingSuggestedToAdd;
            
            const startW = act.weeksRange?.[0] ?? 0;
            const endW = act.weeksRange?.[1] ?? 3;
            
            const newSemanas = Array(totalWeeks).fill(false);
            for (let w = Math.min(startW, totalWeeks - 1); w <= Math.min(endW, totalWeeks - 1); w++) {
                newSemanas[w] = true;
            }
            
            let fInitStr = '';
            let fEndStr = '';
            if (projectStartDate) {
                const fInit = new Date(projectStartDate.getTime());
                fInit.setDate(projectStartDate.getDate() + startW * 7);
                fInitStr = formatDateForInput(fInit);

                const fEnd = new Date(projectStartDate.getTime());
                fEnd.setDate(projectStartDate.getDate() + (endW + 1) * 7 - 1);
                fEndStr = formatDateForInput(fEnd);
            }
            
            onUpdate(lastIdx, 'Actividad', act.Actividad);
            onUpdate(lastIdx, 'RecursosNecesarios', act.RecursosNecesarios);
            onUpdate(lastIdx, 'Responsable', act.Responsable || teamMembers[0] || '');
            onUpdate(lastIdx, 'Entregable', act.Entregable);
            onUpdate(lastIdx, 'colorHex', act.colorHex);
            onUpdate(lastIdx, 'IdObjetivo', act.IdObjetivo);
            onUpdate(lastIdx, 'Numero', lastIdx + 1);
            if (fInitStr) onUpdate(lastIdx, 'FechaInicioPrevista', fInitStr);
            if (fEndStr) onUpdate(lastIdx, 'FechaFinPrevista', fEndStr);
            onUpdate(lastIdx, 'Semanas', newSemanas);
            
            setPendingSuggestedToAdd(null);
            setExpandedCard(lastIdx);
        }
    }, [cronograma.length]);

    // --- PARSEO DE OBJETIVOS ESPECÍFICOS ---
    const parseSpecificObjectives = (html: string | undefined): string[] => {
        if (!html) return [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return Array.from(doc.querySelectorAll('li, p'))
            .map(el => {
                let text = el.textContent?.trim() || '';
                return text.replace(/^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*/, '').trim();
            })
            .filter(text => text.length > 0);
    };

    const getObjectivesList = (): { index: number; label: string }[] => {
        const list: { index: number; label: string }[] = [];
        
        let objGenHtml = formData?.ObjetivoGeneral || '';
        let cleanGen = '';
        if (objGenHtml) {
            const doc = new DOMParser().parseFromString(objGenHtml, 'text/html');
            cleanGen = doc.body.textContent?.trim() || '';
        }
        list.push({ 
            index: 0, 
            label: `OG: ${cleanGen ? cleanGen.substring(0, 60) + (cleanGen.length > 60 ? '...' : '') : 'Objetivo General'}` 
        });

        const objEsp = formData?.ObjetivosEspecificos;
        if (Array.isArray(objEsp)) {
            objEsp.forEach((text, i) => {
                if (text) {
                    list.push({ index: i + 1, label: `OE ${i + 1}: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}` });
                }
            });
        } else if (typeof objEsp === 'string' && objEsp) {
            const parsed = parseSpecificObjectives(objEsp);
            parsed.forEach((text, i) => {
                list.push({ index: i + 1, label: `OE ${i + 1}: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}` });
            });
        }
        return list;
    };

    // --- INTEGRANTES DEL EQUIPO ---
    const getTeamMembers = (): string[] => {
        const members: string[] = [];
        if (formData?.DirectorProyecto) {
            members.push(formData.DirectorProyecto);
        }
        if (Array.isArray(formData?.Investigadores)) {
            formData.Investigadores.forEach((inv: any) => {
                if (inv?.Nombre && !members.includes(inv.Nombre)) {
                    members.push(inv.Nombre);
                }
            });
        }
        return members;
    };

    // --- MANEJO DE FECHAS ---
    const parseProjectDate = (dStr: any): Date | null => {
        if (!dStr) return null;
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) return d;
        if (typeof dStr === 'string' && dStr.includes('/')) {
            const parts = dStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const parsed = new Date(year, month, day);
                if (!isNaN(parsed.getTime())) return parsed;
            }
        }
        return null;
    };

    const formatDateForInput = (dStr: any): string => {
        const parsed = parseProjectDate(dStr);
        if (!parsed) return '';
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getMonthsTimeline = () => {
        const start = parseProjectDate(formData?.FechaInicio || formData?.FechaInicioEstimada);
        const end = parseProjectDate(formData?.FechaFin || formData?.FechaFinEstimada);
        
        let monthsCount = 3;
        let startDate = start || new Date();
        
        if (start && end && end > start) {
            const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            monthsCount = Math.max(1, diffMonths + 1);
        }
        
        const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const timeline = [];
        for (let i = 0; i < monthsCount; i++) {
            const current = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            timeline.push({
                name: monthsNames[current.getMonth()],
                year: current.getFullYear(),
                weekOffset: i * 4
            });
        }
        return timeline;
    };

    const months = getMonthsTimeline();
    const totalWeeks = months.length * 4;
    const teamMembers = getTeamMembers();
    const objectives = getObjectivesList();
    const projectStartDate = parseProjectDate(formData?.FechaInicio || formData?.FechaInicioEstimada);
    const projectEndDate = parseProjectDate(formData?.FechaFin || formData?.FechaFinEstimada);

    const colorsPalette = [
        '#0070f3', // Azul Vercel
        '#00e054', // Verde Éxito
        '#7928ca', // Púrpura Accent
        '#f5a623', // Naranja Alerta
        '#ff3333', // Rojo Error
        '#00dfd8', // Cyan Vercel
        '#ff0080', // Rosa Vercel
        '#888888'  // Gris Atenuado
    ];

    // --- CARGAR CRONOGRAMA SUGERIDO COMPLETO ---
    const handleLoadSuggestedTimeline = () => {
        suggestedCatalog.forEach((act, idx) => {
            const newSemanas = Array(totalWeeks).fill(false);
            const startW = Math.min(act.weeksRange[0], totalWeeks - 1);
            const endW = Math.min(act.weeksRange[1], totalWeeks - 1);
            for (let w = startW; w <= endW; w++) {
                newSemanas[w] = true;
            }

            let fInitStr = '';
            let fEndStr = '';
            if (projectStartDate) {
                const fInit = new Date(projectStartDate.getTime());
                fInit.setDate(projectStartDate.getDate() + startW * 7);
                fInitStr = formatDateForInput(fInit);

                const fEnd = new Date(projectStartDate.getTime());
                fEnd.setDate(projectStartDate.getDate() + (endW + 1) * 7 - 1);
                fEndStr = formatDateForInput(fEnd);
            }

            onAdd();
            setTimeout(() => {
                onUpdate(idx, 'Actividad', act.Actividad);
                onUpdate(idx, 'RecursosNecesarios', act.RecursosNecesarios);
                onUpdate(idx, 'Responsable', teamMembers[0] || "");
                onUpdate(idx, 'Entregable', act.Entregable);
                onUpdate(idx, 'colorHex', act.colorHex);
                onUpdate(idx, 'IdObjetivo', act.IdObjetivo);
                onUpdate(idx, 'Numero', idx + 1);
                if (fInitStr) onUpdate(idx, 'FechaInicioPrevista', fInitStr);
                if (fEndStr) onUpdate(idx, 'FechaFinPrevista', fEndStr);
                onUpdate(idx, 'Semanas', newSemanas);
            }, 50 * idx);
        });
        setExpandedCard(0);
    };

    // --- EVENTO DE PINADO CLÁSICO CELL-BY-CELL ---
    const handleCellMouseDown = (activityIndex: number, weekIndex: number) => {
        if (readOnly) return;
        setCellDragInfo({
            activityIndex,
            startWeek: weekIndex,
            currentWeek: weekIndex
        });
    };

    const handleCellMouseEnter = (activityIndex: number, weekIndex: number) => {
        if (!cellDragInfo || cellDragInfo.activityIndex !== activityIndex) return;
        setCellDragInfo({
            ...cellDragInfo,
            currentWeek: weekIndex
        });
    };

    // --- REDIMENSIONADO Y DESPLAZAMIENTO GLOBAL DE BARRAS GANTT ---
    const handleGanttBarMouseDown = (
        e: React.MouseEvent,
        idx: number,
        type: 'move' | 'resize-left' | 'resize-right'
    ) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();

        const activity = cronograma[idx];
        const semanas = activity.Semanas || Array(totalWeeks).fill(false);
        const { start: startW, end: endW } = getWeekRange(semanas);
        
        if (startW === -1) return; // No hay rango definido para arrastrar

        const trackElement = document.getElementById('gantt-timeline-track');
        if (!trackElement) return;

        const trackRect = trackElement.getBoundingClientRect();
        const cellWidth = trackRect.width / totalWeeks;
        const initialMouseX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - initialMouseX;
            const deltaWeeks = Math.round(deltaX / cellWidth);

            let newStart = startW;
            let newEnd = endW;

            if (type === 'resize-left') {
                newStart = Math.min(startW + deltaWeeks, endW);
                newStart = Math.max(0, newStart);
            } else if (type === 'resize-right') {
                newEnd = Math.max(endW + deltaWeeks, startW);
                newEnd = Math.min(totalWeeks - 1, newEnd);
            } else if (type === 'move') {
                const duration = endW - startW;
                newStart = startW + deltaWeeks;
                newEnd = newStart + duration;

                if (newStart < 0) {
                    newStart = 0;
                    newEnd = duration;
                }
                if (newEnd >= totalWeeks) {
                    newEnd = totalWeeks - 1;
                    newStart = newEnd - duration;
                }
            }

            if (newStart !== startW || newEnd !== endW) {
                const newSemanas = Array(totalWeeks).fill(false);
                for (let w = newStart; w <= newEnd; w++) {
                    newSemanas[w] = true;
                }
                onUpdate(idx, 'Semanas', newSemanas);

                if (projectStartDate) {
                    const actStart = new Date(projectStartDate.getTime());
                    actStart.setDate(projectStartDate.getDate() + newStart * 7);
                    onUpdate(idx, 'FechaInicioPrevista', formatDateForInput(actStart));

                    const actEnd = new Date(projectStartDate.getTime());
                    actEnd.setDate(projectStartDate.getDate() + (newEnd + 1) * 7 - 1);
                    onUpdate(idx, 'FechaFinPrevista', formatDateForInput(actEnd));
                }
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // --- REORDENACIÓN VERTICAL DE TARJETAS (HTML5 DRAG & DROP) ---
    const handleCardDragStart = (e: React.DragEvent, index: number) => {
        if (readOnly) return;
        setDraggedCardIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCardDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedCardIndex === null || draggedCardIndex === index) return;
        setDragOverCardIndex(index);
    };

    const handleCardDragEnd = () => {
        setDraggedCardIndex(null);
        setDragOverCardIndex(null);
    };

    const handleCardDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedCardIndex === null || draggedCardIndex === index) return;
        if (onReorder) {
            onReorder(draggedCardIndex, index);
        }
        setDraggedCardIndex(null);
        setDragOverCardIndex(null);
    };

    // --- DRAG Y DROP DESDE BANCO DE SUGERENCIAS AL TIMELINE GANTT ---
    const handleTimelineDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const trackElement = document.getElementById('gantt-timeline-track');
        if (trackElement) {
            const rect = trackElement.getBoundingClientRect();
            const dropX = e.clientX - rect.left;
            const weekPercent = dropX / rect.width;
            const weekIndex = Math.max(0, Math.min(totalWeeks - 1, Math.floor(weekPercent * totalWeeks)));
            setDragOverTimelineWeek(weekIndex);
        }
    };

    const handleTimelineDragLeave = () => {
        setDragOverTimelineWeek(null);
    };

    const handleTimelineDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverTimelineWeek(null);
        try {
            const dataStr = e.dataTransfer.getData('suggested_activity');
            if (!dataStr) return;
            const actData = JSON.parse(dataStr);
            
            const trackElement = document.getElementById('gantt-timeline-track');
            if (trackElement) {
                const rect = trackElement.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const weekPercent = dropX / rect.width;
                const weekIndex = Math.max(0, Math.min(totalWeeks - 1, Math.floor(weekPercent * totalWeeks)));
                actData.weeksRange = [weekIndex, Math.min(weekIndex + 3, totalWeeks - 1)];
            }
            
            setPendingSuggestedToAdd(actData);
            onAdd();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCardDropZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        try {
            const dataStr = e.dataTransfer.getData('suggested_activity');
            if (!dataStr) return;
            const actData = JSON.parse(dataStr);
            actData.weeksRange = [0, Math.min(3, totalWeeks - 1)];
            
            setPendingSuggestedToAdd(actData);
            onAdd();
        } catch (err) {
            console.error(err);
        }
    };

    // --- CONTROLADOR DE CAMBIOS EN LAS FECHAS MANUALES DE CARD ---
    const handleActivityDateChange = (index: number, type: 'start' | 'end', dateValue: string) => {
        onUpdate(index, type === 'start' ? 'FechaInicioPrevista' : 'FechaFinPrevista', dateValue);
        
        const activity = cronograma[index];
        const updatedActivity = { ...activity };
        if (type === 'start') {
            updatedActivity.FechaInicioPrevista = dateValue;
        } else {
            updatedActivity.FechaFinPrevista = dateValue;
        }

        const actStart = parseProjectDate(updatedActivity.FechaInicioPrevista);
        const actEnd = parseProjectDate(updatedActivity.FechaFinPrevista);
        
        if (actStart && actEnd && actEnd >= actStart && projectStartDate) {
            const newSemanas = Array(totalWeeks).fill(false);
            for (let w = 0; w < totalWeeks; w++) {
                const weekStart = new Date(projectStartDate.getTime());
                weekStart.setDate(projectStartDate.getDate() + w * 7);
                
                const weekEnd = new Date(weekStart.getTime());
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const isOverlapping = (actStart <= weekEnd && actEnd >= weekStart);
                newSemanas[w] = isOverlapping;
            }
            onUpdate(index, 'Semanas', newSemanas);
        }
    };

    return (
        <div className="space-y-6 text-text-main pb-10">
            
            {/* 1. CABECERA GENERAL DEL MÓDULO */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-bg-deep/40 p-5 border border-border-thin rounded-2xl">
                <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-text-main">
                        <Calendar size={18} /> 7. Planificación y Cronograma
                    </h4>
                    <p className="text-[10px] text-text-dim leading-relaxed">
                        Administra las etapas de tu proyecto. 
                        {projectStartDate && projectEndDate ? (
                            <span className="text-emerald-500 font-bold block mt-0.5">
                                {`✓ Periodo: ${months.length} meses (${totalWeeks} semanas) desde ${projectStartDate.toLocaleDateString('es-EC')} al ${projectEndDate.toLocaleDateString('es-EC')}.`}
                            </span>
                        ) : (
                            <span className="text-amber-500 font-bold block mt-0.5 flex items-center gap-1">
                                <AlertCircle size={11} /> Configura la duración del proyecto en "Identificación" para activar el mapeo en calendario.
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Selectores de vista */}
                    <div className="flex bg-bg-deep border border-border-thin p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('gantt')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'gantt' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            Vista Gantt
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'calendar' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setActiveTab('cards')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'cards' ? 'bg-text-main text-bg-deep shadow' : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            Detalle ({cronograma.length})
                        </button>
                    </div>

                    {cronograma.length === 0 && (
                        <button
                            onClick={handleLoadSuggestedTimeline}
                            className="px-3.5 py-2 border border-border-thin hover:bg-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 text-text-dim hover:text-text-main"
                        >
                            <Copy size={11}/> Sugerido CACES
                        </button>
                    )}
                    {!readOnly && (
                        <button 
                            onClick={onAdd} 
                            className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow flex items-center gap-1.5"
                        >
                            <Plus size={11}/> Nueva Actividad
                        </button>
                    )}
                </div>
            </div>

            {/* 2. DISEÑO PRINCIPAL EN DOS COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 2.1 PANEL LATERAL: BANCO DE SUGERENCIAS DRAGGABLE */}
                <div className="lg:col-span-3">
                    <div className="bg-bg-deep/70 border border-border-thin rounded-2xl p-4.5 space-y-4.5 sticky top-4">
                        <div className="flex items-center gap-2 border-b border-border-thin/60 pb-2.5">
                            <Compass size={15} className="text-text-main" />
                            <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Banco de Actividades</h5>
                        </div>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Arrastra estas actividades sugeridas por la SENESCYT/CACES y suéltalas directamente sobre la grilla Gantt o la lista de tareas.
                        </p>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {suggestedCatalog.map((item, idx) => (
                                <div
                                    key={idx}
                                    draggable={!readOnly}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('suggested_activity', JSON.stringify(item));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="p-4 bg-bg-deep border border-border-thin/80 hover:border-text-main/40 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:shadow relative group select-none"
                                >
                                    <div className="flex items-start justify-between gap-2.5 mb-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <div 
                                                className="w-1.5 h-3.5 rounded-full shrink-0 mt-0.5" 
                                                style={{ backgroundColor: item.colorHex }} 
                                            />
                                            <span className="text-[12.5px] font-bold text-text-main leading-snug whitespace-normal pr-1">{item.Actividad}</span>
                                        </div>
                                        <Move size={13} className="text-text-dim opacity-50 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                                    </div>
                                    <p className="text-[11px] text-text-dim/80 leading-relaxed mt-2">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2.2 TABLERO ACTIVO (VISTAS) */}
                <div className="lg:col-span-9">

                    {/* VISTA A: DIAGRAMA GANTT INTERACTIVO */}
                    {activeTab === 'gantt' && (
                        <div 
                            className="bg-bg-deep border border-border-thin rounded-2xl p-5 shadow-sm space-y-4 select-none relative"
                            onDragOver={handleTimelineDragOver}
                            onDragLeave={handleTimelineDragLeave}
                            onDrop={handleTimelineDrop}
                        >
                            {/* Visual Drop Overlay Indicator */}
                            {dragOverTimelineWeek !== null && (
                                <div className="absolute inset-0 bg-text-main/5 border-2 border-dashed border-text-main/40 rounded-2xl flex items-center justify-center z-20 pointer-events-none transition-all">
                                    <div className="bg-bg-deep px-4 py-2 rounded-xl shadow-lg border border-text-main/30 text-[9px] font-bold uppercase tracking-widest text-text-main flex items-center gap-2">
                                        <CalendarDays size={12} className="animate-bounce" />
                                        <span>Soltar para crear en Semana {dragOverTimelineWeek + 1}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border-thin/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Layers size={16} className="text-text-main" />
                                    <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Diagrama de Gantt Académico</h5>
                                </div>
                                <div className="text-[10.5px] font-bold text-text-dim flex items-center gap-1.5 px-3 py-1.5 rounded bg-bg-deep/80 border border-border-thin">
                                    <Info size={12} className="text-text-main" />
                                    <span>Arrastra el centro de las barras para mover, o los bordes para redimensionar.</span>
                                </div>
                            </div>

                            {cronograma.length === 0 ? (
                                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-xl flex flex-col items-center justify-center gap-2">
                                    <AlertCircle size={24} className="text-text-dim/60" />
                                    <span>No hay actividades planificadas. Arrastra una sugerida del panel izquierdo.</span>
                                </div>
                            ) : (
                                <div id="gantt-grid-container" className="overflow-x-auto w-full">
                                    <div 
                                        className="space-y-1"
                                        style={{ minWidth: `${Math.max(900, 280 + totalWeeks * 32)}px` }}
                                    >
                                        {/* Cabecera del calendario */}
                                        <div className="grid grid-cols-[280px_1fr] border-b border-border-thin pb-2 items-stretch" id="gantt-grid-header">
                                            <div className="text-xs font-black text-text-dim uppercase tracking-wider pl-2 flex items-center border-r border-border-thin/50 pr-4">Descripción de la Tarea</div>
                                            <div className="flex flex-col gap-1.5 w-full">
                                                {/* Fila de Meses */}
                                                <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                                    {months.map((m, mIdx) => (
                                                        <div key={mIdx} className="border-l border-border-thin/60 col-span-4 text-center text-[10.5px] font-black uppercase tracking-wider text-text-main">
                                                            <div className="truncate px-0.5">{m.name}</div>
                                                            <div className="opacity-50 text-[8.5px] font-bold">{m.year}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Fila de Semanas */}
                                                <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                                    {Array.from({ length: totalWeeks }).map((_, w) => (
                                                        <div key={w} className="border-l border-border-thin/20 text-center text-[9px] font-black text-text-dim/80">
                                                            S{((w % 4) + 1)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Filas del Gantt */}
                                        <div className="space-y-1">
                                            {cronograma.map((_c, idx) => {
                                                const activityColor = _c.colorHex || '#0070f3';
                                                const number = _c.Numero || (idx + 1);
                                                const name = _c.Actividad || 'Actividad por definir';
                                                const semanas = _c.Semanas || Array(totalWeeks).fill(false);
                                                const { start: startW, end: endW } = getWeekRange(semanas);
                                                const isExpanded = expandedCard === idx;

                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`grid grid-cols-[280px_1fr] items-stretch hover:bg-bg-deep/40 transition-colors border-b border-border-thin/30 ${
                                                            isExpanded ? 'bg-bg-deep/20 font-semibold' : ''
                                                        }`}
                                                    >
                                                        {/* Nombre de la actividad */}
                                                        <div 
                                                            className="text-xs font-semibold text-text-main pr-3 pl-2 cursor-pointer flex items-center justify-between border-r border-border-thin/50 py-3 mr-2"
                                                            onClick={() => {
                                                                setActiveTab('cards');
                                                                setExpandedCard(idx);
                                                            }}
                                                            title="Clic para editar detalles"
                                                        >
                                                            <div className="flex items-start gap-2 pl-1 whitespace-normal">
                                                                <div 
                                                                    className="w-1.5 h-3.5 rounded-full shrink-0 mt-0.5" 
                                                                    style={{ backgroundColor: activityColor }} 
                                                                />
                                                                <span className="font-mono text-[11px] font-black select-none text-text-dim shrink-0">
                                                                    {String(number).padStart(2, '0')}.
                                                                </span>
                                                                <span className="whitespace-normal break-words leading-tight line-clamp-2 pr-1.5 text-xs text-text-main font-semibold" title={name}>{name}</span>
                                                             </div>
                                                        </div>

                                                        {/* Timeline track de la fila */}
                                                        <div 
                                                            id={idx === 0 ? "gantt-timeline-track" : undefined}
                                                            className="relative h-full min-h-[48px] flex items-center bg-transparent w-full"
                                                        >
                                                            {/* Grid celdas fondo */}
                                                            <div className="absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                                                                 {Array.from({ length: totalWeeks }).map((_, w) => {
                                                                    const isMonthBoundary = w % 4 === 0;
                                                                    return (
                                                                        <div 
                                                                            key={w} 
                                                                            className={`h-full border-r border-border-thin/10 cursor-pointer hover:bg-text-main/5 transition-colors ${
                                                                                isMonthBoundary ? 'border-l border-l-border-thin/30' : ''
                                                                            }`}
                                                                            onMouseDown={() => handleCellMouseDown(idx, w)}
                                                                            onMouseEnter={() => handleCellMouseEnter(idx, w)}
                                                                        />
                                                                    );
                                                                })}
                                                                   {/* Barra de Rango de la Actividad (Draggable & Resizable) */}
                                                             {startW !== -1 && (
                                                                 <div 
                                                                     onMouseDown={(e) => handleGanttBarMouseDown(e, idx, 'move')}
                                                                     className="absolute h-[26px] rounded-md flex items-center justify-between px-1.5 shadow-sm cursor-move group select-none transition-all bg-surface hover:bg-surface-hover border border-border-thin hover:border-border-hover overflow-hidden"
                                                                     style={{
                                                                         left: `${(startW / totalWeeks) * 100}%`,
                                                                         width: `${((endW - startW + 1) / totalWeeks) * 100}%`,
                                                                         backgroundColor: `${activityColor}15`,
                                                                         borderColor: activityColor
                                                                     }}
                                                                 >
                                                                     <div 
                                                                         className="absolute left-0 top-0 bottom-0 w-[4px] z-10" 
                                                                         style={{ backgroundColor: activityColor }} 
                                                                     />
                                                                     {/* Resize Handle Izquierdo */}
                                                                     <div 
                                                                         onMouseDown={(e) => handleGanttBarMouseDown(e, idx, 'resize-left')}
                                                                         className="w-[5px] h-3.5 bg-text-main/30 group-hover:bg-text-main/50 hover:!bg-text-main cursor-ew-resize rounded-full opacity-40 group-hover:opacity-75 hover:!opacity-100 transition-all z-20" 
                                                                     />
                                                                     
                                                                     <div className="text-[10px] font-bold text-text-main pr-1.5 pl-2.5 pointer-events-none select-none flex items-center gap-1.5 z-10 w-full overflow-hidden">
                                                                         {_c.Responsable ? (
                                                                             <div className="flex items-center gap-1.5 min-w-0">
                                                                                 <span 
                                                                                     className="px-1.5 py-0.5 rounded-[3px] text-[8.5px] font-black uppercase tracking-wider bg-bg-deep/30 border border-border-thin text-text-main shrink-0"
                                                                                     title={_c.Responsable}
                                                                                 >
                                                                                     {getInitials(_c.Responsable)}
                                                                                 </span>
                                                                                 <span className="truncate text-text-main/90 font-medium" title={_c.Responsable}>
                                                                                     {_c.Responsable.split(' ')[0]}
                                                                                 </span>
                                                                             </div>
                                                                         ) : (
                                                                             <span className="text-[9px] text-text-dim/60 italic">Sin responsable</span>
                                                                         )}
                                                                     </div>
 
                                                                     {/* Resize Handle Derecho */}
                                                                     <div 
                                                                         onMouseDown={(e) => handleGanttBarMouseDown(e, idx, 'resize-right')}
                                                                         className="w-[5px] h-3.5 bg-text-main/30 group-hover:bg-text-main/50 hover:!bg-text-main cursor-ew-resize rounded-full opacity-40 group-hover:opacity-75 hover:!opacity-100 transition-all z-20" 
                                                                     />
                                                                 </div>
                                                             )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA B: VISTA CALENDARIO MENSUAL ACADÉMICO */}
                    {activeTab === 'calendar' && (
                        <div className="bg-bg-deep border border-border-thin rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border-thin/60 pb-3">
                                <CalendarDays size={16} className="text-text-main" />
                                <h5 className="text-xs font-black uppercase tracking-widest text-text-main">Agenda y Hitos Mensuales</h5>
                            </div>

                            {cronograma.length === 0 ? (
                                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-xl">
                                    No hay actividades para estructurar en el calendario.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {months.map((m, mIdx) => {
                                        const startWeekIndex = m.weekOffset;

                                        return (
                                            <div key={mIdx} className="bg-bg-deep/40 border border-border-thin rounded-xl p-4.5 space-y-3.5 hover:border-border-thin/80 transition-colors">
                                                <div className="text-xs font-bold text-text-main uppercase tracking-widest border-b border-border-thin/50 pb-2 flex justify-between items-center">
                                                    <span>{m.name}</span>
                                                    <span className="opacity-50 text-[10px]">{m.year}</span>
                                                </div>

                                                <div className="space-y-3.5 text-xs">
                                                    {[0, 1, 2, 3].map((wOffset) => {
                                                        const currentWeekNum = startWeekIndex + wOffset;
                                                        const activeActs = cronograma.filter(c => c.Semanas?.[currentWeekNum] === true);

                                                        return (
                                                            <div key={wOffset} className="space-y-1.5">
                                                                <div className="text-[9.5px] font-bold text-text-dim uppercase tracking-wider">
                                                                    Semana {currentWeekNum + 1}
                                                                </div>
                                                                {activeActs.length === 0 ? (
                                                                    <div className="text-[9.5px] italic text-text-dim/60 pl-2">Sin actividad</div>
                                                                ) : (
                                                                    <div className="space-y-1.5 pl-1">
                                                                        {activeActs.map((act, actIdx) => {
                                                                            const idx = cronograma.indexOf(act);
                                                                            return (
                                                                                <div 
                                                                                    key={actIdx}
                                                                                    onClick={() => {
                                                                                        setActiveTab('cards');
                                                                                        setExpandedCard(idx);
                                                                                    }}
                                                                                    className="bg-bg-deep hover:bg-bg-deep/80 border border-border-thin px-2.5 py-2 rounded-md text-[11px] flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                                                                                >
                                                                                    <div className="truncate flex items-center gap-1.5 font-semibold text-text-main">
                                                                                        <div 
                                                                                            className="w-1.5 h-3 rounded-full shrink-0" 
                                                                                            style={{ backgroundColor: act.colorHex || '#0070f3' }} 
                                                                                        />
                                                                                        <span className="font-mono text-[10px] font-bold text-text-dim">
                                                                                            {String(act.Numero || (idx + 1)).padStart(2, '0')}.
                                                                                        </span>
                                                                                        <span className="truncate">{act.Actividad}</span>
                                                                                    </div>
                                                                                    {act.Responsable && (
                                                                                        <span className="text-[9px] text-text-dim font-bold shrink-0 bg-bg-deep/50 px-1.5 py-0.5 rounded border border-border-thin">
                                                                                            {act.Responsable.split(' ')[0]}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA C: DETALLE Y EDICIÓN DE TARJETAS (REORDENABLE VERTICALMENTE) */}
                    {activeTab === 'cards' && (
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleCardDropZoneDrop}
                            className="space-y-4"
                        >
                            {cronograma.length === 0 ? (
                                <div className="py-12 text-center text-text-dim text-xs font-semibold border-2 border-dashed border-border-thin rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <Compass size={24} className="text-text-dim/60 animate-spin" />
                                    <span>No hay actividades creadas. Arrastra desde el panel lateral para planificar.</span>
                                </div>
                            ) : (
                                cronograma.map((_c, i) => {
                                    const activityColor = _c.colorHex || '#0070f3';
                                    const number = _c.Numero || (i + 1);
                                    const name = _c.Actividad || 'Nueva Actividad de Investigación';
                                    const checkedWeeksCount = (_c.Semanas || []).filter((w: boolean) => w === true).length;
                                    const progressPercent = totalWeeks > 0 ? Math.round((checkedWeeksCount / totalWeeks) * 100) : 0;
                                    const isExpanded = expandedCard === i;

                                    const isDragging = draggedCardIndex === i;
                                    const isDragOver = dragOverCardIndex === i;

                                    return (
                                        <div 
                                            key={_c.id || _c.uuid || i} 
                                            draggable={!readOnly}
                                            onDragStart={(e) => handleCardDragStart(e, i)}
                                            onDragOver={(e) => handleCardDragOver(e, i)}
                                            onDragEnd={handleCardDragEnd}
                                            onDrop={(e) => handleCardDrop(e, i)}
                                            className={`bg-bg-deep border border-border-thin rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${
                                                isDragging ? 'opacity-30 border-dashed border-text-main bg-bg-deep/20 scale-[0.98]' : ''
                                            } ${
                                                isDragOver ? 'border-t-4 border-t-text-main pt-2 bg-text-main/5' : ''
                                            }`}
                                        >
                                            {/* Cabecera del Accordion con Drag Handle */}
                                            <div className="flex items-center select-none pl-3 hover:bg-bg-deep/25">
                                                {/* Grip Handle */}
                                                {!readOnly && (
                                                    <div 
                                                        className="text-text-dim hover:text-text-main cursor-grab active:cursor-grabbing p-2.5 rounded-lg mr-1.5 transition-colors"
                                                        title="Arrastrar para reordenar"
                                                    >
                                                        <GripVertical size={14} />
                                                    </div>
                                                )}
                                                
                                                <div 
                                                    onClick={() => setExpandedCard(isExpanded ? null : i)}
                                                    className="p-4 flex items-center justify-between w-full"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div 
                                                            className="w-1 h-5 rounded-full shrink-0" 
                                                            style={{ backgroundColor: activityColor }} 
                                                        />
                                                        <span className="font-mono text-[11px] font-black select-none text-text-dim">
                                                            {String(number).padStart(2, '0')}.
                                                        </span>
                                                        <div className="space-y-0.5 truncate">
                                                            <h6 className="text-[12px] font-black text-text-main truncate max-w-[280px] sm:max-w-[400px]">
                                                                {name}
                                                            </h6>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim">
                                                                {_c.Responsable && (
                                                                    <span className="flex items-center gap-1">
                                                                        <User size={12} className="opacity-75" /> {_c.Responsable}
                                                                    </span>
                                                                )}
                                                                {_c.FechaInicioPrevista && _c.FechaFinPrevista && (
                                                                    <span className="flex items-center gap-1 font-semibold text-emerald-500">
                                                                        <Clock size={12} /> {parseProjectDate(_c.FechaInicioPrevista)?.toLocaleDateString('es-EC')} - {parseProjectDate(_c.FechaFinPrevista)?.toLocaleDateString('es-EC')}
                                                                    </span>
                                                                )}
                                                                {_c.EsEntregableCaces === true && (
                                                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-[8px] font-black text-emerald-500 uppercase tracking-wider">
                                                                        CACES
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <div className="hidden sm:flex items-center gap-2.5">
                                                            <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">Ponderación:</span>
                                                            <span className="font-black text-text-main text-[11px]">{checkedWeeksCount} Semanas ({progressPercent}%)</span>
                                                        </div>
                                                        <div className="text-text-dim p-1.5 rounded-lg hover:bg-bg-deep/80 transition-colors">
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contenido expandido */}
                                            {isExpanded && (
                                                <div className="p-5 border-t border-border-thin/40 bg-bg-deep/10 space-y-5 animate-fade-in">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                                        {/* Orden / Número */}
                                                        <div className="col-span-1 lg:col-span-1">
                                                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5">N° Orden</label>
                                                            <input
                                                                type="number"
                                                                value={_c.Numero || (i + 1)}
                                                                onChange={(e) => onUpdate(i, 'Numero', parseInt(e.target.value) || 1)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs font-bold text-center focus:border-text-main focus:outline-none"
                                                                disabled={readOnly}
                                                                min={1}
                                                            />
                                                        </div>

                                                        {/* Descripción / Actividad */}
                                                        <div className="col-span-1 lg:col-span-4">
                                                            <CoWorkField 
                                                                name={`Cron_${_c.id || i}_act`} 
                                                                cowork={cowork} 
                                                                label="Actividad"
                                                                onValueChange={(v) => onUpdate(i, 'Actividad', v)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold"
                                                                readOnly={readOnly}
                                                            />
                                                        </div>

                                                        {/* Alineación de Objetivos */}
                                                        <div className="col-span-1 lg:col-span-3">
                                                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                                <Target size={10} /> Objetivo Relacionado
                                                            </label>
                                                            <select
                                                                value={_c.IdObjetivo !== undefined ? _c.IdObjetivo : 0}
                                                                onChange={(e) => onUpdate(i, 'IdObjetivo', parseInt(e.target.value) || 0)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none cursor-pointer"
                                                                disabled={readOnly}
                                                            >
                                                                {objectives.map((obj) => (
                                                                    <option key={obj.index} value={obj.index}>
                                                                        {obj.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Responsable de la actividad */}
                                                        <div className="col-span-1 lg:col-span-3">
                                                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                                <User size={10} /> Responsable
                                                            </label>
                                                            {teamMembers.length > 0 ? (
                                                                <select
                                                                    value={_c.Responsable || ''}
                                                                    onChange={(e) => onUpdate(i, 'Responsable', e.target.value)}
                                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none cursor-pointer"
                                                                    disabled={readOnly}
                                                                >
                                                                    <option value="">-- Seleccionar Integrante --</option>
                                                                    {teamMembers.map((m, idx) => (
                                                                        <option key={idx} value={m}>
                                                                            {m}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre del responsable"
                                                                    value={_c.Responsable || ''}
                                                                    onChange={(e) => onUpdate(i, 'Responsable', e.target.value)}
                                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                                                    disabled={readOnly}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Botón de borrado */}
                                                        <div className="col-span-1 lg:col-span-1 flex justify-center pb-1">
                                                            {!readOnly && (
                                                                <button 
                                                                    onClick={() => onRemove(i)} 
                                                                    className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                                                    title="Eliminar Actividad"
                                                                >
                                                                    <Trash2 size={15}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Planificación Temporal (Fechas específicas) */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-thin/40 pt-4">
                                                        <div>
                                                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                                <Clock size={11} /> Fecha Inicio Prevista
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formatDateForInput(_c.FechaInicioPrevista)}
                                                                min={formatDateForInput(formData?.FechaInicio || formData?.FechaInicioEstimada)}
                                                                max={formatDateForInput(formData?.FechaFin || formData?.FechaFinEstimada)}
                                                                onChange={(e) => handleActivityDateChange(i, 'start', e.target.value)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                                                disabled={readOnly}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                                <Clock size={11} /> Fecha Fin Prevista
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formatDateForInput(_c.FechaFinPrevista)}
                                                                min={formatDateForInput(_c.FechaInicioPrevista || formData?.FechaInicio || formData?.FechaInicioEstimada)}
                                                                max={formatDateForInput(formData?.FechaFin || formData?.FechaFinEstimada)}
                                                                onChange={(e) => handleActivityDateChange(i, 'end', e.target.value)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                                                disabled={readOnly}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Recursos y Entregables */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <CoWorkField 
                                                                name={`Cron_${_c.id || i}_rec`} 
                                                                cowork={cowork} 
                                                                label="Recursos Necesarios"
                                                                onValueChange={(v) => onUpdate(i, 'RecursosNecesarios', v)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs"
                                                                readOnly={readOnly}
                                                            />
                                                        </div>
                                                        <div>
                                                            <CoWorkField 
                                                                name={`Cron_${_c.id || i}_ent`} 
                                                                cowork={cowork} 
                                                                label="Entregable Esperado / Evidencia CACES"
                                                                onValueChange={(v) => onUpdate(i, 'Entregable', v)}
                                                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs"
                                                                placeholder="Ej: Manual de software, Base de datos, Rúbrica firmada..."
                                                                readOnly={readOnly}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Configuración estética (Colores) y CACES */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-deep/20 p-3 rounded-xl border border-border-thin/50 text-[10px]">
                                                        {/* Selector de color */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-black text-text-dim uppercase tracking-wider flex items-center gap-1">
                                                                <Palette size={12} /> Color:
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                {colorsPalette.map((col) => (
                                                                    <button
                                                                        key={col}
                                                                        onClick={() => onUpdate(i, 'colorHex', col)}
                                                                        className="w-3.5 h-3.5 rounded-full border border-border-thin hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                                                                        style={{ 
                                                                            backgroundColor: col, 
                                                                            boxShadow: _c.colorHex === col ? `0 0 0 2px var(--color-text-main, #0070f3)` : 'none' 
                                                                        }}
                                                                        title={`Color ${col}`}
                                                                        disabled={readOnly}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Checklist CACES e Indicador de Progreso */}
                                                        <div className="flex items-center gap-6">
                                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-text-dim uppercase tracking-wider">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={_c.EsEntregableCaces || false}
                                                                    onChange={(e) => onUpdate(i, 'EsEntregableCaces', e.target.checked)}
                                                                    className="w-3.5 h-3.5 accent-text-main rounded cursor-pointer"
                                                                    disabled={readOnly}
                                                                />
                                                                <span>Acreditación CACES</span>
                                                            </label>

                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-text-dim uppercase tracking-wider">Progreso:</span>
                                                                <div className="w-16 h-2 bg-bg-deep rounded-full overflow-hidden border border-border-thin/80">
                                                                    <div 
                                                                        className="h-full transition-all duration-300" 
                                                                        style={{ width: `${progressPercent}%`, backgroundColor: activityColor }}
                                                                    />
                                                                </div>
                                                                <span className="font-black text-text-main text-[9px] grandfather">${progressPercent}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Cuadrícula Gantt Semanal Interactiva */}
                                                    <div className="border-t border-border-thin pt-3.5 space-y-2 select-none">
                                                        <div className="text-[9px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1">
                                                            <FileCheck size={13} /> 
                                                            <span>Programación de Semanas Activas</span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                            {months.map((m, mIdx) => (
                                                                <div key={mIdx} className="bg-bg-deep/20 rounded-xl p-2.5 border border-border-thin/70 hover:border-border-thin transition-colors">
                                                                    <div className="text-[8.5px] font-black text-text-dim uppercase tracking-wider mb-2 text-center border-b border-border-thin/40 pb-1">
                                                                        {m.name} <span className="opacity-50">{m.year}</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 gap-1">
                                                                        {[0, 1, 2, 3].map((wIdx) => {
                                                                            const weekNum = m.weekOffset + wIdx;
                                                                            const currentSemanas = _c.Semanas || Array(totalWeeks).fill(false);
                                                                            const isChecked = currentSemanas[weekNum] === true;

                                                                            return (
                                                                                <button 
                                                                                    key={weekNum} 
                                                                                    onClick={() => {
                                                                                        if (readOnly) return;
                                                                                        const newSemanas = [...currentSemanas];
                                                                                        newSemanas[weekNum] = !newSemanas[weekNum];
                                                                                        onUpdate(i, 'Semanas', newSemanas);

                                                                                        // Sync dates of this activity based on the updated range
                                                                                        const { start, end } = getWeekRange(newSemanas);
                                                                                        if (start !== -1 && projectStartDate) {
                                                                                            const actStart = new Date(projectStartDate.getTime());
                                                                                            actStart.setDate(projectStartDate.getDate() + start * 7);
                                                                                            onUpdate(i, 'FechaInicioPrevista', formatDateForInput(actStart));

                                                                                            const actEnd = new Date(projectStartDate.getTime());
                                                                                            actEnd.setDate(projectStartDate.getDate() + (end + 1) * 7 - 1);
                                                                                            onUpdate(i, 'FechaFinPrevista', formatDateForInput(actEnd));
                                                                                        }
                                                                                    }}
                                                                                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                                                                                        isChecked 
                                                                                            ? 'bg-text-main/5 border-text-main/30 font-bold text-text-main shadow-sm' 
                                                                                            : 'bg-transparent border-transparent hover:border-border-thin/50 text-text-dim hover:text-text-main'
                                                                                    }`}
                                                                                    disabled={readOnly}
                                                                                >
                                                                                    <span className="text-[7.5px]">Sem {weekNum + 1}</span>
                                                                                    <div 
                                                                                        className="w-3 h-3 rounded-sm border transition-all"
                                                                                        style={{ 
                                                                                            backgroundColor: isChecked ? activityColor : 'transparent',
                                                                                            borderColor: isChecked ? activityColor : 'var(--color-border-thin)' 
                                                                                        }}
                                                                                    />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
