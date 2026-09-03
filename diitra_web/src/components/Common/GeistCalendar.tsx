import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface GeistCalendarProps {
    value?: string; // dd/mm/yyyy or yyyy-mm-dd
    onChange: (dateStr: string) => void;
    onClose?: () => void;
    minDate?: string;
    maxDate?: string;
    className?: string;
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/**
 * Parsea un string en formato dd/mm/aaaa o yyyy-mm-dd a Date local
 */
export const parseStringToDate = (val?: string): Date | null => {
    if (!val || typeof val !== 'string') return null;
    const clean = val.trim();
    if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 1900 && y <= 2100 && m >= 0 && m <= 11) {
                const date = new Date(y, m, d);
                if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
                    return date;
                }
            }
        }
    } else if (clean.includes('-')) {
        const parts = clean.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 1900 && y <= 2100 && m >= 0 && m <= 11) {
                const date = new Date(y, m, d);
                if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
                    return date;
                }
            }
        }
    }
    return null;
};

/**
 * Formatea Date a dd/mm/aaaa
 */
export const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const GeistCalendar: React.FC<GeistCalendarProps> = ({
    value,
    onChange,
    onClose,
    minDate,
    maxDate,
    className = ''
}) => {
    const initialDate = parseStringToDate(value) || new Date();
    const [viewDate, setViewDate] = useState<Date>(initialDate);
    const [isSelectingYear, setIsSelectingYear] = useState(false);
    const [isSelectingMonth, setIsSelectingMonth] = useState(false);

    const yearDropdownRef = useRef<HTMLDivElement>(null);
    const monthDropdownRef = useRef<HTMLDivElement>(null);

    // Auto-scroll centrado dentro del menú SIN afectar ni mover el scroll de la página principal
    useEffect(() => {
        if (isSelectingMonth && monthDropdownRef.current) {
            const container = monthDropdownRef.current;
            const activeMonthEl = container.querySelector<HTMLElement>('[data-active="true"]');
            if (activeMonthEl) {
                container.scrollTop = activeMonthEl.offsetTop - (container.clientHeight / 2) + (activeMonthEl.clientHeight / 2);
            }
        }
    }, [isSelectingMonth]);

    useEffect(() => {
        if (isSelectingYear && yearDropdownRef.current) {
            const container = yearDropdownRef.current;
            const activeYearEl = container.querySelector<HTMLElement>('[data-active="true"]');
            if (activeYearEl) {
                container.scrollTop = activeYearEl.offsetTop - (container.clientHeight / 2) + (activeYearEl.clientHeight / 2);
            }
        }
    }, [isSelectingYear]);

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const selectedDate = parseStringToDate(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minParsed = React.useMemo(() => {
        const d = parseStringToDate(minDate);
        if (d) d.setHours(0, 0, 0, 0);
        return d;
    }, [minDate]);

    const maxParsed = React.useMemo(() => {
        const d = parseStringToDate(maxDate);
        if (d) d.setHours(23, 59, 59, 999);
        return d;
    }, [maxDate]);

    // Días del mes actual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Primer día del mes (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Convertir 0 a Lunes
    // Días del mes anterior para relleno
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // Rango de años para selección rápida (desde 10 años atrás hasta 15 años adelante)
    const currentActualYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 30 }, (_, i) => currentActualYear - 10 + i);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleSelectDay = (day: number, isPrev = false, isNext = false) => {
        let targetMonth = currentMonth;
        let targetYear = currentYear;

        if (isPrev) {
            targetMonth -= 1;
            if (targetMonth < 0) {
                targetMonth = 11;
                targetYear -= 1;
            }
        } else if (isNext) {
            targetMonth += 1;
            if (targetMonth > 11) {
                targetMonth = 0;
                targetYear += 1;
            }
        }

        const targetDate = new Date(targetYear, targetMonth, day);
        
        // Verificar límites
        if (minParsed && targetDate < minParsed) return;
        if (maxParsed && targetDate > maxParsed) return;

        onChange(formatDateToDDMMYYYY(targetDate));
        if (onClose) onClose();
    };

    const handleSelectToday = () => {
        const now = new Date();
        setViewDate(now);
        onChange(formatDateToDDMMYYYY(now));
        if (onClose) onClose();
    };

    const handleClear = () => {
        onChange('');
        if (onClose) onClose();
    };

    return (
        <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-[290px] sm:w-[310px] p-3.5 bg-surface border border-border-thin rounded-xl shadow-2xl select-none animate-scale-up font-sans text-text-main ${className}`}
        >
            {/* Header del Calendario: Mes, Año y Controles */}
            <div className="flex items-center justify-between gap-1 mb-3 pb-2.5 border-b border-border-thin/40 relative">
                <div className="flex items-center gap-1.5">
                    {/* Selector de Mes */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSelectingMonth(!isSelectingMonth);
                                setIsSelectingYear(false);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            <span>{MONTH_NAMES[currentMonth]}</span>
                            <ChevronDown className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isSelectingMonth ? 'rotate-180' : ''}`} />
                        </button>

                        {isSelectingMonth && (
                            <div 
                                ref={monthDropdownRef}
                                className="absolute top-full left-0 mt-1 z-50 w-32 max-h-48 overflow-y-auto bg-surface border border-border-thin rounded-lg shadow-xl p-1 grid grid-cols-1 gap-0.5 custom-scrollbar"
                            >
                                {MONTH_NAMES.map((mName, idx) => (
                                    <button
                                        key={mName}
                                        type="button"
                                        data-active={idx === currentMonth}
                                        onClick={() => {
                                            setViewDate(new Date(currentYear, idx, 1));
                                            setIsSelectingMonth(false);
                                        }}
                                        className={`px-2 py-1.5 rounded text-left text-xs font-medium transition-colors ${
                                            idx === currentMonth 
                                                ? 'bg-text-main text-bg-deep font-bold' 
                                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                                        }`}
                                    >
                                        {mName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selector de Año */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSelectingYear(!isSelectingYear);
                                setIsSelectingMonth(false);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            <span>{currentYear}</span>
                            <ChevronDown className={`w-3 h-3 text-text-dim transition-transform duration-200 ${isSelectingYear ? 'rotate-180' : ''}`} />
                        </button>

                        {isSelectingYear && (
                            <div 
                                ref={yearDropdownRef}
                                className="absolute top-full left-0 mt-1 z-50 w-24 max-h-48 overflow-y-auto bg-surface border border-border-thin rounded-lg shadow-xl p-1 grid grid-cols-1 gap-0.5 custom-scrollbar"
                            >
                                {yearsList.map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        data-active={y === currentYear}
                                        onClick={() => {
                                            setViewDate(new Date(y, currentMonth, 1));
                                            setIsSelectingYear(false);
                                        }}
                                        className={`px-2 py-1.5 rounded text-left text-xs font-medium transition-colors ${
                                            y === currentYear 
                                                ? 'bg-text-main text-bg-deep font-bold' 
                                                : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                                        }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Flechas Navegación Mes Anterior / Siguiente */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Mes anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 rounded-md text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Mes siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_NAMES.map((dName) => (
                    <div key={dName} className="text-[10px] font-black text-text-dim/60 uppercase tracking-widest py-1">
                        {dName}
                    </div>
                ))}
            </div>

            {/* Matriz de Días */}
            <div className="grid grid-cols-7 gap-1">
                {/* Días del mes anterior */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => {
                    const dayNum = prevMonthDays - firstDayIndex + idx + 1;
                    return (
                        <button
                            key={`prev-${dayNum}`}
                            type="button"
                            onClick={() => handleSelectDay(dayNum, true, false)}
                            className="h-8 w-full flex items-center justify-center rounded-md text-xs font-normal text-text-dim/30 hover:text-text-dim hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            {dayNum}
                        </button>
                    );
                })}

                {/* Días del mes en curso */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(currentYear, currentMonth, dayNum);
                    
                    const isSelected = selectedDate && 
                        selectedDate.getFullYear() === currentYear && 
                        selectedDate.getMonth() === currentMonth && 
                        selectedDate.getDate() === dayNum;

                    const isToday = today.getFullYear() === currentYear && 
                        today.getMonth() === currentMonth && 
                        today.getDate() === dayNum;

                    const isDisabled = (minParsed && dateObj < minParsed) || (maxParsed && dateObj > maxParsed);

                    return (
                        <button
                            key={`curr-${dayNum}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleSelectDay(dayNum)}
                            className={`h-8 w-full flex items-center justify-center rounded-lg text-xs transition-all relative ${
                                isSelected
                                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black shadow-sm'
                                    : isToday
                                    ? 'border border-text-main/40 font-bold text-text-main hover:bg-surface-hover'
                                    : 'font-medium text-text-main hover:bg-surface-hover'
                            } ${isDisabled ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                        >
                            {dayNum}
                            {isToday && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-text-main" />
                            )}
                        </button>
                    );
                })}

                {/* Días del mes posterior para rellenar la matriz fija a 6 semanas (42 celdas) */}
                {(() => {
                    const TOTAL_CELLS = 42;
                    const renderedSoFar = firstDayIndex + daysInMonth;
                    const nextDaysCount = TOTAL_CELLS - renderedSoFar;
                    return Array.from({ length: nextDaysCount }).map((_, idx) => {
                        const dayNum = idx + 1;
                        return (
                            <button
                                key={`next-${dayNum}`}
                                type="button"
                                onClick={() => handleSelectDay(dayNum, false, true)}
                                className="h-8 w-full flex items-center justify-center rounded-md text-xs font-normal text-text-dim/30 hover:text-text-dim hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                                {dayNum}
                            </button>
                        );
                    });
                })()}
            </div>

            {/* Footer de Acciones Rápidas */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-thin/40 text-[11px]">
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-text-dim hover:text-red-500 font-bold tracking-wider uppercase transition-colors cursor-pointer px-1.5 py-0.5 rounded"
                >
                    Limpiar
                </button>
                <button
                    type="button"
                    onClick={handleSelectToday}
                    className="text-text-main hover:underline font-bold tracking-wider uppercase transition-colors cursor-pointer px-1.5 py-0.5 rounded"
                >
                    Hoy
                </button>
            </div>
        </div>
    );
};
