import React, { useEffect, useRef, useState, useContext } from 'react';
import { Calendar, Lock } from 'lucide-react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../types';
import { DocumentDataContext, SectionGuardContext } from '../../documents/context/DocumentDataContext';
import { coworkLog } from '../utils/log';
import { GeistCalendar } from '../../../components/Common/GeistCalendar';
import { GeistSelect } from '../../../components/Common/GeistSelect';



interface CoWorkFieldProps {
    name: string;
    cowork: CoWorkHandle;
    placeholder?: string;
    className?: string;
    label?: string;
    type?: 'text' | 'textarea' | 'select' | 'checkbox';
    onValueChange?: (value: any, meta?: { source?: 'local' | 'remote' }) => void;
    children?: React.ReactNode;
    readOnly?: boolean;
    mask?: 'date';
    uppercase?: boolean;
    minDate?: string;
    maxDate?: string;
    options?: { value: string | number; label: string; disabled?: boolean }[];
}

function maskDate(value: string, deletedSlash: boolean = false): string {
    // Mantener solo dígitos y barras diagonales
    const cleaned = value.replace(/[^\d/]/g, '');
    
    // Si el usuario borró la barra diagonal, respetamos esa acción para que pueda seguir borrando hacia atrás
    if (deletedSlash) {
        return cleaned.slice(0, 10);
    }
    
    let parts = cleaned.split('/');
    
    // Caso 1: Se ha escrito el año pegado al mes (ej: 24/122 -> 24/12/2)
    if (parts.length === 2 && parts[1].length > 2) {
        const day = parts[0];
        const month = parts[1].slice(0, 2);
        const year = parts[1].slice(2);
        parts = [day, month, year];
    }
    
    // Caso 2: Se ha escrito el mes pegado al día sin barras (ej: 241 -> 24/1)
    if (parts.length === 1 && parts[0].length > 2) {
        const day = parts[0].slice(0, 2);
        const rest = parts[0].slice(2);
        if (rest.length > 2) {
            const month = rest.slice(0, 2);
            const year = rest.slice(2);
            parts = [day, month, year];
        } else {
            parts = [day, rest];
        }
    }
    
    // Validar límites de los segmentos
    if (parts.length > 0 && parts[0]) {
        // Limitar día a 2 dígitos y un valor coherente (máx 31, no 00)
        parts[0] = parts[0].slice(0, 2);
        if (parts[0].length === 2) {
            const dayNum = parseInt(parts[0], 10);
            if (dayNum > 31) parts[0] = '31';
            if (dayNum === 0) parts[0] = '01';
        }
    }
    if (parts.length > 1 && parts[1]) {
        // Limitar mes a 2 dígitos y un valor coherente (máx 12, no 00)
        parts[1] = parts[1].slice(0, 2);
        if (parts[1].length === 2) {
            const monthNum = parseInt(parts[1], 10);
            if (monthNum > 12) parts[1] = '12';
            if (monthNum === 0) parts[1] = '01';
        }
    }
    if (parts.length > 2 && parts[2]) {
        // Limitar año a 4 dígitos
        parts[2] = parts[2].slice(0, 4);
    }
    
    // Construir el resultado
    let result = parts.slice(0, 3).join('/');
    
    // Si acaba de terminar de escribir los 2 dígitos de día o mes y no hay barra, auto-agregarla para facilitar la escritura
    if (parts.length === 1 && parts[0].length === 2 && !value.endsWith('/')) {
        result = `${parts[0]}/`;
    } else if (parts.length === 2 && parts[1].length === 2 && !value.endsWith('/')) {
        result = `${parts[0]}/${parts[1]}/`;
    }
    
    return result.slice(0, 10);
}

function applyMinimalDiff(ytext: Y.Text, oldVal: string, newVal: string): void {
    if (oldVal === newVal) return;

    let prefixLen = 0;
    const minLen = Math.min(oldVal.length, newVal.length);
    while (prefixLen < minLen && oldVal[prefixLen] === newVal[prefixLen]) {
        prefixLen++;
    }

    let suffixLen = 0;
    while (
        suffixLen < (minLen - prefixLen) &&
        oldVal[oldVal.length - 1 - suffixLen] === newVal[newVal.length - 1 - suffixLen]
    ) {
        suffixLen++;
    }

    const deleteCount = oldVal.length - prefixLen - suffixLen;
    const insertStr = newVal.slice(prefixLen, newVal.length - suffixLen);

    if (deleteCount > 0) ytext.delete(prefixLen, deleteCount);
    if (insertStr.length > 0) ytext.insert(prefixLen, insertStr);
}

/**
 * DIITRA CoWork Field (v2.0 — Yjs as single source of truth)
 *
 * The displayed value is always derived from Yjs (after history loads).
 * The parent's DB value via DocumentDataContext is used ONLY as a one-time
 * seed when Yjs is empty and history has been fully loaded.
 */
function resolveDbValue(parentFormData: any, name: string): any {
    if (!parentFormData) return undefined;
    
    // Check if the name matches dot-separated path (e.g., HitosCompletados.0.Actividad)
    if (name.includes('.')) {
        const parts = name.split('.');
        let current = parentFormData;
        for (const part of parts) {
            if (current == null) return undefined;
            current = current[part];
        }
        return current;
    }

    if (name.startsWith('Impacto_')) {
        const tipo = name.substring(8).toLowerCase();
        const impactoObj = parentFormData.Impacto ?? parentFormData.impacto;
        return (impactoObj && typeof impactoObj === 'object') ? impactoObj[tipo] : undefined;
    }

    if (name.startsWith('Firmas_')) {
        const fieldName = name.substring(7);
        const firmasObj = parentFormData.FirmasResponsabilidad ?? parentFormData.firmasResponsabilidad;
        return (firmasObj && typeof firmasObj === 'object') ? firmasObj[fieldName] : undefined;
    }

    // Map list prefixes to list name and field mapping
    const prefixes = [
        { key: 'Inv_', listName: 'Investigadores', fields: { nombre: 'Nombre', cedula: 'Cedula', email: 'Email', telefono: 'Telefono', nivel: 'NivelAcademico', rol: 'Rol', horas: 'HorasSemanales' } },
        { key: 'Cron_', listName: 'Cronograma', fields: { act: 'Actividad', num: 'Numero', rec: 'RecursosNecesarios' } },
        { key: 'RecDisp_', listName: 'RecursosDisponibles', fields: { desc: 'Descripcion', cant: 'Cantidad', fnt: 'Fuente' } },
        { key: 'RecNec_', listName: 'RecursosNecesarios', fields: { desc: 'Descripcion', cant: 'Cantidad', unit: 'CostoUnitario' } },
        { key: 'Prod_', listName: 'ProductosEsperados', fields: { cant: 'cantidad' } }
    ];

    for (const prefix of prefixes) {
        if (name.startsWith(prefix.key)) {
            const parts = name.split('_');
            if (parts.length >= 3) {
                let fieldSuffix = parts[parts.length - 1];
                let itemId = parts.slice(1, parts.length - 1).join('_');
                
                // Check if it's week selection (e.g. Cron_0_sem_5)
                if (parts.length >= 4 && parts[parts.length - 2] === 'sem') {
                    fieldSuffix = `sem_${parts[parts.length - 1]}`;
                    itemId = parts.slice(1, parts.length - 2).join('_');
                }
                
                const list = parentFormData[prefix.listName];
                if (Array.isArray(list)) {
                    const item = list.find((x: any, idx: number) => String(x.id) === itemId || String(idx) === itemId);
                    if (item) {
                        // Special handling for Cronograma weeks (sem_X)
                        if (prefix.key === 'Cron_' && fieldSuffix.startsWith('sem_')) {
                            const weekIdx = parseInt(fieldSuffix.substring(4), 10);
                            if (Array.isArray(item.Semanas) && weekIdx >= 0 && weekIdx < item.Semanas.length) {
                                return item.Semanas[weekIdx];
                            }
                            return false;
                        }
                        
                        // Special handling for ProductosEsperados type selection (Prod_0_tipo)
                        if (prefix.key === 'Prod_' && fieldSuffix === 'tipo') {
                            return item.tipo ?? item.Tipo ?? '';
                        }
                        
                        const targetField = (prefix.fields as any)[fieldSuffix] || fieldSuffix;
                        if (item[targetField] !== undefined) {
                            return item[targetField];
                        }
                        const capitalized = targetField.charAt(0).toUpperCase() + targetField.slice(1);
                        const lowercased = targetField.charAt(0).toLowerCase() + targetField.slice(1);
                        return item[capitalized] ?? item[lowercased];
                    }
                }
            }
        }
    }

    return parentFormData[name];
}

export const CoWorkField: React.FC<CoWorkFieldProps> = ({
    name,
    cowork,
    placeholder,
    className,
    label,
    type = 'text',
    onValueChange,
    children,
    readOnly,
    mask,
    uppercase,
    minDate,
    maxDate,
    options,
}) => {
    const parentFormData = useContext(DocumentDataContext);
    const guardContext = useContext(SectionGuardContext);
    const dbValue = parentFormData ? resolveDbValue(parentFormData, name) : undefined;

    const { ydoc } = cowork;
    const historyLoaded = cowork.session.lastSyncedAt !== null;

    const [displayValue, setDisplayValue] = useState<any>(() => {
        if (dbValue !== undefined && dbValue !== null && dbValue !== '') {
            return type === 'checkbox' ? dbValue === 'true' || dbValue === true : dbValue;
        }
        return type === 'checkbox' ? false : '';
    });

    const onValueChangeRef = useRef(onValueChange);
    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    const seededRef = useRef(false);

    useEffect(() => {
        if (!ydoc) return;

        const ytext = ydoc.getText(name);

        const readYjs = (): any => {
            const raw = ytext.toString();
            if (raw === 'undefined' || raw === null) return null;
            if (raw === '' && dbValue !== undefined && dbValue !== null && dbValue !== '') {
                return null;
            }
            return type === 'checkbox' ? raw === 'true' : raw;
        };

        const currentYjsVal = readYjs();
        
        let isDuplicate = false;
        if (
            currentYjsVal !== null &&
            dbValue !== undefined &&
            dbValue !== null &&
            dbValue !== ''
        ) {
            const strVal = String(dbValue);
            const yjsStr = String(currentYjsVal);
            if (yjsStr !== strVal && yjsStr.length > 0 && yjsStr.length % strVal.length === 0) {
                const repeatCount = yjsStr.length / strVal.length;
                if (repeatCount >= 2 && strVal.repeat(repeatCount) === yjsStr) {
                    isDuplicate = true;
                }
            }
        }

        if (isDuplicate) {
            seededRef.current = true;
            const isReadOnlyMode = readOnly || guardContext.readOnly || cowork.session.readOnly;
            if (!isReadOnlyMode) {
                coworkLog(`[CoWorkField:${name}] Cleaned duplicated seed: ${currentYjsVal} -> ${dbValue}`);
                const stringVal = String(dbValue);
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, stringVal);
                }, 'local-dedup');
                setDisplayValue(dbValue);
            } else {
                setDisplayValue(dbValue);
            }
        } else if (currentYjsVal !== null) {
            setDisplayValue(currentYjsVal);
        } else if (
            dbValue !== undefined &&
            dbValue !== null &&
            dbValue !== ''
        ) {
            const parsed = type === 'checkbox' ? dbValue === 'true' || dbValue === true : dbValue;
            setDisplayValue(parsed);

            if (historyLoaded && !seededRef.current) {
                seededRef.current = true;
                const isReadOnlyMode = readOnly || guardContext.readOnly || cowork.session.readOnly;
                if (!isReadOnlyMode) {
                    const states = cowork.awareness ? Array.from(cowork.awareness.getStates().values()) : [];
                    const localUserId = (cowork.awareness?.getLocalState() as any)?.user?.id;
                    const otherUsersCount = states.filter((st: any) => st?.user?.id && st?.user?.id !== localUserId).length;
                    const isLeader = otherUsersCount === 0;

                    if (isLeader) {
                        coworkLog(`[CoWorkField:${name}] Seeding Yjs from DB (one-time, sole user):`, dbValue);
                        const stringVal = String(dbValue);
                        ydoc.transact(() => {
                            ytext.delete(0, ytext.length);
                            ytext.insert(0, stringVal);
                        }, 'local-seed');
                    }
                }
            }
        }

        const observer = (event: Y.YTextEvent) => {
            if (event.transaction.origin !== 'remote') return;
            const raw = ytext.toString();
            const val = type === 'checkbox' ? raw === 'true' : raw;
            setDisplayValue(val);
            const cb = onValueChangeRef.current;
            if (cb) setTimeout(() => cb(val, { source: 'remote' }), 0);
        };

        ytext.observe(observer);
        return () => {
            ytext.unobserve(observer);
        };
    }, [ydoc, name, type, historyLoaded, dbValue, readOnly, guardContext.readOnly, cowork.session.readOnly]);

    const [activeUsersEditing, setActiveUsersEditing] = useState<{
        clientId: number;
        name: string;
        initials: string;
        color: string;
    }[]>([]);

    useEffect(() => {
        const awareness = cowork.awareness;
        if (!awareness) return;

        const updateActiveUsers = () => {
            const users: any[] = [];
            const states = awareness.getStates();
            states.forEach((state: any, clientId: number) => {
                if (clientId === awareness.clientID) return; // ignorar a sí mismo
                if (state.focusedField === name && state.user) {
                    users.push({
                        clientId,
                        name: state.user.name || state.user.nombreCompleto || 'Usuario',
                        initials: state.user.initials || 'U',
                        color: state.user.color || '#EC4899',
                    });
                }
            });
            setActiveUsersEditing(users);
        };

        updateActiveUsers(); // Comprobación inicial

        awareness.on('update', updateActiveUsers);
        return () => {
            awareness.off('update', updateActiveUsers);
        };
    }, [cowork.awareness, name]);

    // Limpiar focusedField al desmontar
    useEffect(() => {
        return () => {
            if (cowork.awareness) {
                const currentState = cowork.awareness.getLocalState();
                if (currentState?.focusedField === name) {
                    cowork.awareness.setLocalStateField('focusedField', null);
                }
            }
        };
    }, [cowork.awareness, name]);

    const handleFocus = () => {
        if (cowork.awareness) {
            cowork.awareness.setLocalStateField('focusedField', name);
        }
    };

    const handleBlur = () => {
        if (cowork.awareness) {
            const currentState = cowork.awareness.getLocalState();
            if (currentState?.focusedField === name) {
                cowork.awareness.setLocalStateField('focusedField', null);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        if (mask === 'date' && typeof newValue === 'string') {
            const isDelete = newValue.length < (displayValue || '').length;
            const deletedSlash = isDelete && (displayValue || '').endsWith('/') && !newValue.endsWith('/');
            newValue = maskDate(newValue, deletedSlash);
        }
        if (uppercase && typeof newValue === 'string') {
            newValue = newValue.toUpperCase();
        }
        setDisplayValue(newValue);
        onValueChange?.(newValue, { source: 'local' });

        if (ydoc) {
            const ytext = ydoc.getText(name);
            const stringVal = String(newValue);
            const current = ytext.toString();
            if (current !== stringVal) {
                ydoc.transact(() => {
                    applyMinimalDiff(ytext, current, stringVal);
                }, 'local-input');
            }
        }
    };

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [popoverPlacement, setPopoverPlacement] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({
        vertical: 'bottom',
        horizontal: 'right'
    });
    const calendarContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isCalendarOpen) return;

        const updatePosition = () => {
            if (!calendarContainerRef.current) return;
            const rect = calendarContainerRef.current.getBoundingClientRect();
            const calendarHeight = 350;
            const calendarWidth = 310;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const vertical = (spaceBelow < calendarHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom';
            const horizontal = (rect.right < calendarWidth && window.innerWidth - rect.left >= calendarWidth) ? 'left' : 'right';

            setPopoverPlacement({ vertical, horizontal });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        const handleClickOutside = (event: MouseEvent) => {
            if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCalendarOpen(false);
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
    }, [isCalendarOpen]);

    const handleCalendarSelect = (newDateStr: string) => {
        setDisplayValue(newDateStr);
        onValueChange?.(newDateStr, { source: 'local' });

        if (ydoc) {
            const ytext = ydoc.getText(name);
            const current = ytext.toString();
            if (current !== newDateStr) {
                ydoc.transact(() => {
                    applyMinimalDiff(ytext, current, newDateStr);
                }, 'local-input');
            }
        }
    };

    const isFieldReadOnly = readOnly || guardContext.readOnly;
    const borderStyle = activeUsersEditing.length > 0 && type !== 'checkbox'
        ? {
            borderColor: activeUsersEditing[0].color,
            boxShadow: `0 0 0 2px ${activeUsersEditing[0].color}33`,
          }
        : {};

    const isDateField = mask === 'date';

    const toggleCalendar = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (isDateField && !cowork.session.readOnly && !isFieldReadOnly) {
            setIsCalendarOpen(prev => !prev);
        }
    };

    const commonProps = {
        name,
        placeholder,
        className: type === 'checkbox'
            ? `w-5 h-5 rounded border-border-thin text-text-main focus:ring-text-main/20 cursor-pointer`
            : `${className} ${isDateField ? 'pr-10 cursor-pointer select-none' : ''} ${type === 'select' ? (isFieldReadOnly ? 'appearance-none pr-10' : 'cursor-pointer') : ''} ${isFieldReadOnly && !isDateField ? 'pr-10 cursor-default bg-surface/30 opacity-90 select-none' : ''} transition-all duration-200 focus:ring-2 focus:ring-text-main/20 outline-none`,
        disabled: cowork.session.readOnly || isFieldReadOnly,
        readOnly: isFieldReadOnly || isDateField,
        onClick: isDateField ? toggleCalendar : undefined,
        onFocus: isDateField ? undefined : handleFocus,
        onBlur: isDateField ? undefined : handleBlur,
        style: borderStyle
    };

    return (
        <div className={type === 'checkbox' ? "flex items-center gap-3" : "w-full"}>
            {type !== 'checkbox' && label && (
                <label className="block text-[10px] font-black text-text-dim uppercase tracking-widest ml-2 mb-1.5 sm:mb-2">
                    {label}
                </label>
            )}
            <div className="relative" ref={isDateField ? calendarContainerRef : undefined}>
                {activeUsersEditing.length > 0 && type !== 'checkbox' && (
                    <div className="absolute right-2 -top-2.5 z-50 flex items-center gap-1">
                        {/* Usuario principal con nombre completo */}
                        <div 
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black text-white uppercase tracking-widest shadow-md select-none pointer-events-none transition-all duration-300 animate-fade-in"
                            style={{ backgroundColor: activeUsersEditing[0].color }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-white text-bg-deep flex items-center justify-center text-[5.5px] font-black" style={{ color: activeUsersEditing[0].color }}>
                                {activeUsersEditing[0].initials}
                            </div>
                            <span>{activeUsersEditing[0].name.toUpperCase()}</span>
                        </div>

                        {/* Avatares apilados para los demás usuarios concurrentes en el mismo input */}
                        {activeUsersEditing.slice(1).map((usr) => (
                            <div 
                                key={usr.clientId}
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black text-white shadow-md border border-surface select-none pointer-events-none transition-all duration-300 animate-fade-in -ml-1.5"
                                style={{ backgroundColor: usr.color }}
                                title={usr.name.toUpperCase()}
                            >
                                {usr.initials}
                            </div>
                        ))}
                    </div>
                )}
                {type === 'text' && <input {...commonProps} type="text" value={displayValue} onChange={handleChange} />}
                {type === 'textarea' && <textarea {...commonProps} value={displayValue} onChange={handleChange} />}
                {type === 'select' && (
                    <GeistSelect
                        name={name}
                        value={displayValue}
                        options={options}
                        placeholder={placeholder || 'Seleccione una opción...'}
                        disabled={cowork.session.readOnly || isFieldReadOnly}
                        readOnly={isFieldReadOnly}
                        className={className}
                        style={borderStyle}
                        onChange={(newVal) => {
                            setDisplayValue(newVal);
                            onValueChange?.(newVal, { source: 'local' });
                            if (ydoc) {
                                const ytext = ydoc.getText(name);
                                const current = ytext.toString();
                                const strVal = String(newVal);
                                if (current !== strVal) {
                                    ydoc.transact(() => {
                                        ytext.delete(0, ytext.length);
                                        ytext.insert(0, strVal);
                                    }, 'local-input');
                                }
                            }
                        }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    >
                        {children}
                    </GeistSelect>
                )}
                {type === 'checkbox' && (
                    <input {...commonProps} type="checkbox" checked={displayValue} onChange={handleChange} />
                )}

                {isFieldReadOnly && !isDateField && type !== 'select' && (
                    <div 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none animate-fade-in"
                        title="Campo de solo lectura institucional"
                    >
                        <Lock className="w-4 h-4 text-text-dim/70" />
                    </div>
                )}
                
                {mask === 'date' && (
                    <div>
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={toggleCalendar}
                            disabled={cowork.session.readOnly || isFieldReadOnly}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer rounded-md ${
                                isCalendarOpen ? 'text-text-main bg-surface-hover' : ''
                            }`}
                            title="Seleccionar fecha en calendario"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>

                        {isCalendarOpen && !cowork.session.readOnly && !isFieldReadOnly && (
                            <div className={`absolute ${popoverPlacement.horizontal === 'left' ? 'left-0' : 'right-0'} ${popoverPlacement.vertical === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} z-50 animate-fade-in`}>
                                <GeistCalendar
                                    value={displayValue}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    onChange={(newVal) => {
                                        handleCalendarSelect(newVal);
                                        setIsCalendarOpen(false);
                                    }}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            {type === 'checkbox' && label && (
                <label className="text-[10px] font-bold text-text-main uppercase tracking-tight cursor-pointer">
                    {label}
                </label>
            )}
        </div>
    );
};

export default CoWorkField;
