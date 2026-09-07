import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { GeistCalendar } from './GeistCalendar';

export interface GeistDatePickerProps {
    value?: string;
    onChange: (dateStr: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    readOnly?: boolean;
    minDate?: string;
    maxDate?: string;
    className?: string;
    containerClassName?: string;
}

export const GeistDatePicker: React.FC<GeistDatePickerProps> = ({
    value = '',
    onChange,
    label,
    placeholder = 'dd/mm/aaaa',
    error,
    disabled = false,
    readOnly = false,
    minDate,
    maxDate,
    className = '',
    containerClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverPlacement, setPopoverPlacement] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({
        vertical: 'bottom',
        horizontal: 'left'
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic afuera y detectar espacio en viewport
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const calendarHeight = 350;
            const calendarWidth = 310;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const vertical = (spaceBelow < calendarHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom';
            const horizontal = (window.innerWidth - rect.left < calendarWidth && rect.right >= calendarWidth) ? 'right' : 'left';

            setPopoverPlacement({ vertical, horizontal });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Formatear entrada manual con máscara dd/mm/aaaa
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const digits = raw.replace(/\D/g, '');
        let formatted = '';
        if (digits.length <= 2) {
            formatted = digits;
        } else if (digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
        onChange(formatted);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${containerClassName}`}>
            {label && (
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 mb-1.5 sm:mb-2">
                    {label}
                </label>
            )}

            {/* Selector interactivo de fecha (Trigger completo) */}
            <button
                type="button"
                onClick={() => !disabled && !readOnly && setIsOpen(prev => !prev)}
                disabled={disabled || readOnly}
                className={`
                    w-full flex items-center justify-between text-left transition-all duration-200 outline-none
                    bg-bg-deep border border-border-thin rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium
                    ${!disabled && !readOnly ? 'cursor-pointer hover:border-text-main/50' : 'cursor-default select-none'}
                    ${isOpen ? 'ring-2 ring-text-main/20 border-text-main shadow-sm' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${readOnly ? 'bg-surface/30 opacity-90' : ''}
                    ${error ? 'border-red-500/60 focus:border-red-500' : ''}
                    ${className}
                `}
            >
                <span className={`truncate min-w-0 pr-2 ${value ? 'text-text-main font-semibold' : 'text-text-dim/60 font-normal'}`}>
                    {value || placeholder}
                </span>

                <div className="shrink-0 flex items-center pointer-events-none ml-1.5 text-text-dim">
                    <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? 'text-text-main' : 'text-text-dim'}`} />
                </div>
            </button>

            {error && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-1.5 ml-1 animate-fade-in">
                    {error}
                </p>
            )}

            {/* Popover del Calendario Geist */}
            {isOpen && !disabled && !readOnly && (
                <div className={`absolute ${popoverPlacement.horizontal === 'right' ? 'right-0' : 'left-0'} ${popoverPlacement.vertical === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} z-[100] animate-fade-in`}>
                    <GeistCalendar
                        value={value}
                        onChange={(newVal) => {
                            onChange(newVal);
                            setIsOpen(false);
                        }}
                        onClose={() => setIsOpen(false)}
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
            )}
        </div>
    );
};
