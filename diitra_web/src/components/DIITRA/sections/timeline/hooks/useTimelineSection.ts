import React, { useState, useEffect, useRef } from 'react';
import type { CoWorkHandle } from '../../../../../core/cowork/types';

// Helper puro para obtener el primer y último checked week
export const getWeekRange = (semanas: boolean[]) => {
    if (!semanas || semanas.length === 0) return { start: -1, end: -1 };
    const start = semanas.indexOf(true);
    if (start === -1) return { start: -1, end: -1 };
    const last = semanas.lastIndexOf(true);
    return { start, end: last };
};

// Helper puro para obtener las iniciales del responsable
export const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const parts = nameStr.split(' ').filter(p => p.trim().length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const parseProjectDate = (dStr: any): Date | null => {
    if (!dStr) return null;
    if (dStr instanceof Date) {
        return isNaN(dStr.getTime()) ? null : dStr;
    }
    if (typeof dStr === 'string') {
        const cleanStr = dStr.trim();
        
        // Caso 1: Formato yyyy-MM-dd (con guiones, opcionalmente con hora T00:00:00)
        const isoDateOnlyMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
        if (isoDateOnlyMatch) {
            const year = parseInt(isoDateOnlyMatch[1], 10);
            const month = parseInt(isoDateOnlyMatch[2], 10) - 1;
            const day = parseInt(isoDateOnlyMatch[3], 10);
            const parsed = new Date(year, month, day);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        
        // Caso 2: Formato dd/MM/yyyy (con barras)
        if (cleanStr.includes('/')) {
            const parts = cleanStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const parsed = new Date(year, month, day);
                if (!isNaN(parsed.getTime())) return parsed;
            }
        }
    }
    
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
};

export const formatDateForInput = (dStr: any): string => {
    const parsed = parseProjectDate(dStr);
    if (!parsed) return '';
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const colorsPalette = [
    '#0070f3', // Azul Vercel
    '#00e054', // Verde Éxito
    '#7928ca', // Púrpura Accent
    '#f5a623', // Naranja Alerta
    '#ff3333', // Rojo Error
    '#00dfd8', // Cyan Vercel
    '#ff0080', // Rosa Vercel
    '#888888'  // Gris Atenuado
];

export const suggestedCatalog = [
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

export interface UseTimelineSectionProps {
    cronograma: any[];
    formData?: any;
    cowork: CoWorkHandle;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    readOnly?: boolean;
}

export const useTimelineSection = ({
    cronograma = [],
    formData = {},
    cowork,
    onAdd,
    onRemove,
    onUpdate,
    onReorder,
    readOnly = false
}: UseTimelineSectionProps) => {
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

    // Estado para controlar toques (taps) en responsive sin interferir con el scroll
    const [touchStartInfo, setTouchStartInfo] = useState<{
        x: number;
        y: number;
        activityIndex: number;
        weekIndex: number;
        time: number;
    } | null>(null);

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

    const getWeeksAndMonthsTimeline = () => {
        const start = parseProjectDate(formData?.FechaInicio || formData?.FechaInicioEstimada);
        const end = parseProjectDate(formData?.FechaFin || formData?.FechaFinEstimada);
        
        if (!start || !end || end <= start) {
            const defaultMonths = ["Enero", "Febrero", "Marzo"];
            const timeline = defaultMonths.map((name, i) => ({
                name,
                year: new Date().getFullYear(),
                weeksCount: 4,
                weekOffset: i * 4
            }));
            return { timeline, totalWeeks: 12 };
        }
        
        const diffTime = end.getTime() - start.getTime();
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalWeeks = Math.ceil(totalDays / 7);
        
        const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const weeksData = [];
        
        for (let w = 0; w < totalWeeks; w++) {
            const weekStartDate = new Date(start.getTime());
            weekStartDate.setDate(start.getDate() + w * 7);
            weeksData.push({
                weekIndex: w,
                monthIndex: weekStartDate.getMonth(),
                monthName: monthsNames[weekStartDate.getMonth()],
                year: weekStartDate.getFullYear()
            });
        }
        
        const timeline: { name: string; year: number; weeksCount: number; weekOffset: number }[] = [];
        if (weeksData.length > 0) {
            let currentGroup = {
                name: weeksData[0].monthName,
                year: weeksData[0].year,
                weeksCount: 1,
                weekOffset: 0
            };
            
            for (let i = 1; i < weeksData.length; i++) {
                const w = weeksData[i];
                if (w.monthName === currentGroup.name && w.year === currentGroup.year) {
                    currentGroup.weeksCount++;
                } else {
                    timeline.push(currentGroup);
                    currentGroup = {
                        name: w.monthName,
                        year: w.year,
                        weeksCount: 1,
                        weekOffset: i
                    };
                }
            }
            timeline.push(currentGroup);
        }
        
        return { timeline, totalWeeks };
    };

    const { timeline: months, totalWeeks } = getWeeksAndMonthsTimeline();
    const teamMembers = getTeamMembers();
    const objectives = getObjectivesList();
    const projectStartDate = parseProjectDate(formData?.FechaInicio || formData?.FechaInicioEstimada);
    const projectEndDate = parseProjectDate(formData?.FechaFin || formData?.FechaFinEstimada);

    const getDurationText = () => {
        if (!projectStartDate || !projectEndDate) return '';
        const diffTime = projectEndDate.getTime() - projectStartDate.getTime();
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const realWeeks = Math.ceil(totalDays / 7);
        
        const diffMonths = (projectEndDate.getFullYear() - projectStartDate.getFullYear()) * 12 + (projectEndDate.getMonth() - projectStartDate.getMonth()) + (projectEndDate.getDate() - projectStartDate.getDate()) / 30.4;
        const realMonths = Math.max(0.5, Math.round(diffMonths * 10) / 10);
        return `✓ Periodo: ${realMonths} ${realMonths === 1 ? 'mes' : 'meses'} (${realWeeks} ${realWeeks === 1 ? 'semana' : 'semanas'}) desde ${projectStartDate.toLocaleDateString('es-EC')} al ${projectEndDate.toLocaleDateString('es-EC')}.`;
    };

    // --- AUTO-CORRECCIÓN DE FECHAS PREVISTAS SI CAMBIA LA FECHA DEL PROYECTO ---
    const prevProjectStartRef = useRef<number | null>(null);

    useEffect(() => {
        if (readOnly || !projectStartDate || !cronograma || cronograma.length === 0) return;
        
        const currentStartMs = projectStartDate.getTime();
        if (prevProjectStartRef.current !== null && prevProjectStartRef.current !== currentStartMs) {
            cronograma.forEach((activity, idx) => {
                const semanas = activity.Semanas || [];
                const { start, end } = getWeekRange(semanas);
                
                if (start !== -1) {
                    const calculatedStart = new Date(projectStartDate.getTime());
                    calculatedStart.setDate(projectStartDate.getDate() + start * 7);
                    const expectedStartStr = formatDateForInput(calculatedStart);
                    
                    const calculatedEnd = new Date(projectStartDate.getTime());
                    calculatedEnd.setDate(projectStartDate.getDate() + (end + 1) * 7 - 1);
                    const expectedEndStr = formatDateForInput(calculatedEnd);
                    
                    if (activity.FechaInicioPrevista !== expectedStartStr) {
                        onUpdate(idx, 'FechaInicioPrevista', expectedStartStr);
                    }
                    if (activity.FechaFinPrevista !== expectedEndStr) {
                        onUpdate(idx, 'FechaFinPrevista', expectedEndStr);
                    }
                }
            });
        }
        prevProjectStartRef.current = currentStartMs;
    }, [projectStartDate, readOnly, onUpdate, cronograma]);

    // --- LIBERAR EL ARRASTRE DE CELDAS DE MANERA GLOBAL ---
    useEffect(() => {
        const handleGlobalEnd = () => {
            if (cellDragInfo) {
                const { activityIndex, startWeek, currentWeek } = cellDragInfo;
                
                const activity = cronograma[activityIndex];
                const currentSemanas = activity?.Semanas || Array(totalWeeks).fill(false);
                let newSemanas = [...currentSemanas];
                
                // Si es un click simple (no hubo arrastre)
                if (startWeek === currentWeek) {
                    newSemanas[startWeek] = !newSemanas[startWeek];
                } else {
                    // Si es un arrastre, dibujamos el rango continuo
                    const minW = Math.min(startWeek, currentWeek);
                    const maxW = Math.max(startWeek, currentWeek);
                    newSemanas = Array(totalWeeks).fill(false);
                    for (let w = minW; w <= maxW; w++) {
                        newSemanas[w] = true;
                    }
                }
                
                onUpdate(activityIndex, 'Semanas', newSemanas);
                
                // Sincronizar las fechas de la actividad
                const { start, end } = getWeekRange(newSemanas);
                if (start !== -1 && projectStartDate) {
                    const actStart = new Date(projectStartDate.getTime());
                    actStart.setDate(projectStartDate.getDate() + start * 7);
                    onUpdate(activityIndex, 'FechaInicioPrevista', formatDateForInput(actStart));
                    
                    const actEnd = new Date(projectStartDate.getTime());
                    actEnd.setDate(projectStartDate.getDate() + (end + 1) * 7 - 1);
                    onUpdate(activityIndex, 'FechaFinPrevista', formatDateForInput(actEnd));
                } else {
                    onUpdate(activityIndex, 'FechaInicioPrevista', '');
                    onUpdate(activityIndex, 'FechaFinPrevista', '');
                }
                
                setCellDragInfo(null);
            }
        };
        window.addEventListener('mouseup', handleGlobalEnd);
        return () => {
            window.removeEventListener('mouseup', handleGlobalEnd);
        };
    }, [cellDragInfo, totalWeeks, projectStartDate, onUpdate, cronograma]);

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
            onUpdate(lastIdx, 'Responsable', act.Responsable || '');
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
    }, [cronograma.length, pendingSuggestedToAdd, totalWeeks, projectStartDate, onUpdate]);

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
                onUpdate(idx, 'Responsable', "");
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

    const handleCellTouchStart = (activityIndex: number, weekIndex: number, e: React.TouchEvent) => {
        if (readOnly) return;
        const touch = e.touches[0];
        setTouchStartInfo({
            x: touch.clientX,
            y: touch.clientY,
            activityIndex,
            weekIndex,
            time: Date.now()
        });
    };

    const handleCellTouchEnd = (activityIndex: number, weekIndex: number, e: React.TouchEvent) => {
        if (!touchStartInfo || readOnly) return;

        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartInfo.x);
        const deltaY = Math.abs(touch.clientY - touchStartInfo.y);
        const deltaTime = Date.now() - touchStartInfo.time;

        // Si se movió muy poco (menos de 8px) y fue rápido (menos de 250ms), lo consideramos un tap
        if (deltaX < 8 && deltaY < 8 && deltaTime < 250) {
            const activity = cronograma[activityIndex];
            const currentSemanas = activity.Semanas || Array(totalWeeks).fill(false);
            const newSemanas = [...currentSemanas];
            
            newSemanas[weekIndex] = !newSemanas[weekIndex];
            onUpdate(activityIndex, 'Semanas', newSemanas);
            
            // Sincronizar las fechas de la actividad
            const { start, end } = getWeekRange(newSemanas);
            if (start !== -1 && projectStartDate) {
                const actStart = new Date(projectStartDate.getTime());
                actStart.setDate(projectStartDate.getDate() + start * 7);
                onUpdate(activityIndex, 'FechaInicioPrevista', formatDateForInput(actStart));

                const actEnd = new Date(projectStartDate.getTime());
                actEnd.setDate(projectStartDate.getDate() + (end + 1) * 7 - 1);
                onUpdate(activityIndex, 'FechaFinPrevista', formatDateForInput(actEnd));
            } else {
                onUpdate(activityIndex, 'FechaInicioPrevista', '');
                onUpdate(activityIndex, 'FechaFinPrevista', '');
            }
        }
        setTouchStartInfo(null);
    };

    const handleInactiveRowTouchEnd = (activityIndex: number, e: React.TouchEvent) => {
        if (!touchStartInfo || readOnly) return;
        
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartInfo.x);
        const deltaY = Math.abs(touch.clientY - touchStartInfo.y);
        const deltaTime = Date.now() - touchStartInfo.time;

        if (deltaX < 8 && deltaY < 8 && deltaTime < 250) {
            setExpandedCard(activityIndex);
        }
        setTouchStartInfo(null);
    };

    // --- AGREGAR SUGERENCIA DIRECTA DESDE CLICK/TOUCH EN EL BANCO ---
    const handleAddSuggestedActivity = (item: any) => {
        if (readOnly) return;
        const actData = { ...item };
        actData.weeksRange = [0, Math.min(3, totalWeeks - 1)];
        setPendingSuggestedToAdd(actData);
        onAdd();
    };

    // --- REDIMENSIONADO Y DESPLAZAMIENTO GLOBAL DE BARRAS GANTT (MOUSE & TOUCH) ---
    const handleGanttBarStart = (
        e: React.MouseEvent | React.TouchEvent,
        idx: number,
        type: 'move' | 'resize-left' | 'resize-right'
    ) => {
        if (readOnly) return;
        
        const isTouch = 'touches' in e;
        if (!isTouch && e.cancelable) {
            e.preventDefault();
        }
        e.stopPropagation();

        const activity = cronograma[idx];
        const semanas = activity.Semanas || Array(totalWeeks).fill(false);
        const { start: startW, end: endW } = getWeekRange(semanas);
        
        if (startW === -1) return;

        const trackElement = document.getElementById('gantt-timeline-track');
        if (!trackElement) return;

        const trackRect = trackElement.getBoundingClientRect();
        const cellWidth = trackRect.width / totalWeeks;
        
        const initialX = isTouch ? e.touches[0].clientX : e.clientX;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent && moveEvent.cancelable) {
                moveEvent.preventDefault();
            }

            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const deltaX = currentX - initialX;
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

        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
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
        const activity = cronograma[index];
        const updatedActivity = { ...activity };
        
        if (type === 'start') {
            updatedActivity.FechaInicioPrevista = dateValue;
            if (updatedActivity.FechaFinPrevista && dateValue > updatedActivity.FechaFinPrevista) {
                updatedActivity.FechaFinPrevista = dateValue;
            }
        } else {
            updatedActivity.FechaFinPrevista = dateValue;
            if (updatedActivity.FechaInicioPrevista && dateValue < updatedActivity.FechaInicioPrevista) {
                updatedActivity.FechaInicioPrevista = dateValue;
            }
        }

        onUpdate(index, 'FechaInicioPrevista', updatedActivity.FechaInicioPrevista);
        onUpdate(index, 'FechaFinPrevista', updatedActivity.FechaFinPrevista);
        
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

    return {
        // States & calculated data
        activeTab,
        setActiveTab,
        expandedCard,
        setExpandedCard,
        draggedCardIndex,
        dragOverCardIndex,
        dragOverTimelineWeek,
        months,
        totalWeeks,
        teamMembers,
        objectives,
        projectStartDate,
        projectEndDate,
        durationText: getDurationText(),
        cowork,
        
        // Handlers
        onRemove,
        handleLoadSuggestedTimeline,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleCellTouchStart,
        handleCellTouchEnd,
        handleInactiveRowTouchEnd,
        handleAddSuggestedActivity,
        handleGanttBarStart,
        handleCardDragStart,
        handleCardDragOver,
        handleCardDragEnd,
        handleCardDrop,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        handleCardDropZoneDrop,
        handleActivityDateChange
    };
};
