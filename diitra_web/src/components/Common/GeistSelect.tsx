import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Lock } from 'lucide-react';

export interface GeistSelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface GeistSelectProps {
    value?: string | number;
    options?: GeistSelectOption[];
    children?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    onChange?: (val: string | number) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    name?: string;
    style?: React.CSSProperties;
}

export const GeistSelect: React.FC<GeistSelectProps> = ({
    value,
    options,
    children,
    placeholder = 'Seleccione una opción...',
    disabled = false,
    readOnly = false,
    className = '',
    onChange,
    onFocus,
    onBlur,
    style
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [popoverPlacement, setPopoverPlacement] = useState<{ vertical: 'top' | 'bottom' }>({
        vertical: 'bottom'
    });

    // Extraer opciones ya sea por la prop options o dinámicamente de <option> children
    const parsedOptions = useMemo<GeistSelectOption[]>(() => {
        if (options && options.length > 0) return options;
        if (!children) return [];

        const extracted: GeistSelectOption[] = [];

        const processChild = (child: React.ReactNode) => {
            if (!React.isValidElement(child)) return;
            if (child.type === 'option') {
                const val = (child.props as any).value !== undefined ? (child.props as any).value : (child.props as any).children;
                const lbl = typeof (child.props as any).children === 'string' 
                    ? (child.props as any).children 
                    : String(val);
                extracted.push({
                    value: val,
                    label: lbl,
                    disabled: Boolean((child.props as any).disabled)
                });
            } else if (child.type === React.Fragment && (child.props as any).children) {
                React.Children.forEach((child.props as any).children, processChild);
            }
        };

        React.Children.forEach(children, processChild);
        return extracted;
    }, [options, children]);

    // Encontrar la opción seleccionada actual
    const selectedOption = useMemo(() => {
        if (value === undefined || value === null) return null;
        return parsedOptions.find(opt => String(opt.value) === String(value));
    }, [parsedOptions, value]);

    // Opciones filtradas por término de búsqueda
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return parsedOptions;
        const q = searchTerm.toLowerCase().trim();
        return parsedOptions.filter(opt => 
            opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
        );
    }, [parsedOptions, searchTerm]);

    const isInteractive = !disabled && !readOnly;

    const toggleOpen = () => {
        if (!isInteractive) return;
        setIsOpen(prev => {
            const next = !prev;
            if (next) {
                onFocus?.();
                setSearchTerm('');
            } else {
                onBlur?.();
            }
            return next;
        });
    };

    // Calcular posición óptima del menú (arriba o abajo)
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const popoverHeight = 280;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const vertical = (spaceBelow < popoverHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom';
            setPopoverPlacement({ vertical });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        // Autofocus en búsqueda si hay más de 5 opciones
        if (parsedOptions.length > 5) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                onBlur?.();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                onBlur?.();
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
    }, [isOpen, onBlur, parsedOptions.length]);

    const handleSelect = (val: string | number) => {
        onChange?.(val);
        setIsOpen(false);
        onBlur?.();
    };

    return (
        <div ref={containerRef} className="relative w-full" style={style}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={toggleOpen}
                disabled={disabled || readOnly}
                title={selectedOption ? selectedOption.label : placeholder}
                className={`
                    w-full flex items-center justify-between text-left transition-all duration-200 outline-none
                    ${className}
                    ${isInteractive ? 'cursor-pointer hover:border-text-main/50' : 'cursor-default select-none'}
                    ${isOpen ? 'ring-2 ring-text-main/20 border-text-main' : ''}
                    ${readOnly ? 'bg-surface/30 opacity-90' : ''}
                `}
            >
                <span className={`truncate min-w-0 pr-2 ${selectedOption ? 'text-text-main font-bold' : 'text-text-dim/60 font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <div className="shrink-0 flex items-center pointer-events-none ml-1">
                    {readOnly ? (
                        <Lock className="w-4 h-4 text-text-dim/70" />
                    ) : (
                        <ChevronDown 
                            className={`w-4 h-4 text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-main' : ''}`} 
                        />
                    )}
                </div>
            </button>

            {/* Floating Popover Menu */}
            {isOpen && isInteractive && (
                <div
                    ref={popoverRef}
                    className={`
                        absolute left-0 z-50 min-w-full sm:min-w-[340px] max-w-[min(540px,94vw)] bg-bg-deep border border-border-thin rounded-xl shadow-2xl p-1.5 animate-fade-in
                        ${popoverPlacement.vertical === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
                    `}
                    style={{ maxHeight: '340px' }}
                >
                    {/* Buscador inteligente si hay más de 5 opciones */}
                    {parsedOptions.length > 5 && (
                        <div className="relative mb-1.5 pb-1.5 border-b border-border-thin/50 px-1 pt-0.5">
                            <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 text-text-dim absolute left-2.5 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar en la lista..."
                                    className="w-full bg-surface/50 border border-border-thin/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-main placeholder:text-text-dim/50 outline-none focus:border-text-main transition-colors font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {/* Lista de Opciones */}
                    <div className="overflow-y-auto max-h-60 space-y-1 custom-scrollbar pr-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 px-3 text-center text-xs text-text-dim italic">
                                No se encontraron opciones que coincidan
                            </div>
                        ) : (
                            filteredOptions.map((option, idx) => {
                                const isSelected = String(option.value) === String(value);
                                const isFirstDefault = idx === 0 && (option.value === 0 || option.value === '' || String(option.label).startsWith('--') || String(option.label).startsWith('Seleccione'));

                                return (
                                    <button
                                        key={`${option.value}-${idx}`}
                                        type="button"
                                        disabled={option.disabled}
                                        onClick={() => handleSelect(option.value)}
                                        title={option.label}
                                        className={`
                                            w-full flex items-start justify-between px-3 py-2.5 rounded-lg text-xs transition-colors text-left gap-2
                                            ${isSelected 
                                                ? 'bg-text-main text-bg-deep font-bold shadow-xs' 
                                                : isFirstDefault 
                                                ? 'text-text-dim/80 hover:bg-surface-hover hover:text-text-main italic font-medium'
                                                : 'text-text-main hover:bg-surface-hover font-semibold'
                                            }
                                            ${option.disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
                                        `}
                                    >
                                        <span className="leading-snug whitespace-normal break-words flex-1">
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 shrink-0 text-bg-deep mt-0.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
