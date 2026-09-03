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
                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2 mb-1.5 sm:mb-2">
                    {label}
                </label>
            )}

            <div className="relative flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    maxLength={10}
                    className={`w-full bg-bg-deep border rounded-lg sm:rounded-xl px-3.5 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-text-main placeholder:text-text-dim/30 focus:ring-2 focus:ring-text-main/20 outline-none transition-all pr-10 ${
                        error ? 'border-red-500/60 focus:border-red-500' : 'border-border-thin focus:border-text-main'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {value && !disabled && !readOnly && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-1 text-text-dim hover:text-text-main transition-colors cursor-pointer rounded"
                            title="Limpiar fecha"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={disabled || readOnly}
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer ${
                            isOpen ? 'text-text-main bg-surface-hover' : ''
                        }`}
                        title="Seleccionar fecha en calendario"
                    >
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-wider mt-1.5 ml-2 animate-fade-in">
                    {error}
                </p>
            )}

            {/* Popover del Calendario Geist */}
            {isOpen && !disabled && !readOnly && (
                <div className={`absolute ${popoverPlacement.horizontal === 'right' ? 'right-0' : 'left-0'} ${popoverPlacement.vertical === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} z-50 animate-fade-in`}>
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
