import React, { useEffect, useRef, useState, useContext } from 'react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../types';
import { DocumentDataContext, SectionGuardContext } from '../../documents/context/DocumentDataContext';
import { coworkLog } from '../utils/log';

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
    uppercase
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
            if (!raw || raw === 'undefined') return null;
            return type === 'checkbox' ? raw === 'true' : raw;
        };

        const syncDisplayFromYjs = () => {
            const val = readYjs();
            if (val !== null) {
                setDisplayValue(val);
            }
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
            historyLoaded &&
            !seededRef.current &&
            dbValue !== undefined &&
            dbValue !== null &&
            dbValue !== ''
        ) {
            seededRef.current = true;
            const isReadOnlyMode = readOnly || guardContext.readOnly || cowork.session.readOnly;
            if (!isReadOnlyMode) {
                const clientIds = cowork.awareness
                    ? Array.from(cowork.awareness.getStates().keys()).sort((a, b) => a - b)
                    : [];
                const isLeader = clientIds.length === 0 || ydoc.clientID === clientIds[0];

                if (isLeader) {
                    coworkLog(`[CoWorkField:${name}] Seeding Yjs from DB (one-time, leader):`, dbValue);
                    const stringVal = String(dbValue);
                    ydoc.transact(() => {
                        ytext.delete(0, ytext.length);
                        ytext.insert(0, stringVal);
                    }, 'local-seed');
                } else {
                    coworkLog(`[CoWorkField:${name}] Postponing seed, not leader (leader is client ${clientIds[0]})`);
                    const parsed = type === 'checkbox' ? dbValue === 'true' || dbValue === true : dbValue;
                    setDisplayValue(parsed);
                }
            } else {
                const parsed = type === 'checkbox' ? dbValue === 'true' || dbValue === true : dbValue;
                setDisplayValue(parsed);
            }
        }

        const observer = (event: Y.YTextEvent) => {
            if (event.transaction.origin !== 'remote') return;
            syncDisplayFromYjs();
            const val = readYjs();
            if (val !== null) {
                const cb = onValueChangeRef.current;
                if (cb) setTimeout(() => cb(val, { source: 'remote' }), 0);
            }
        };

        ytext.observe(observer);
        return () => {
            ytext.unobserve(observer);
        };
    }, [ydoc, name, type, historyLoaded, dbValue, readOnly, guardContext.readOnly, cowork.session.readOnly]);

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

    const isFieldReadOnly = readOnly || guardContext.readOnly;
    const commonProps = {
        name,
        placeholder,
        className: type === 'checkbox'
            ? `w-5 h-5 rounded border-border-thin text-text-main focus:ring-text-main/20 cursor-pointer`
            : `${className} transition-all duration-200 focus:ring-2 focus:ring-text-main/20 outline-none`,
        disabled: cowork.session.readOnly || isFieldReadOnly,
        readOnly: isFieldReadOnly
    };

    return (
        <div className={type === 'checkbox' ? "flex items-center gap-3" : "w-full"}>
            <div className="relative order-1">
                {type === 'text' && <input {...commonProps} type="text" value={displayValue} onChange={handleChange} />}
                {type === 'textarea' && <textarea {...commonProps} value={displayValue} onChange={handleChange} />}
                {type === 'select' && (
                    <select {...commonProps} value={displayValue} onChange={handleChange}>
                        {children}
                    </select>
                )}
                {type === 'checkbox' && (
                    <input {...commonProps} type="checkbox" checked={displayValue} onChange={handleChange} />
                )}
                
                {type !== 'checkbox' && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-text-main animate-pulse" />
                    </div>
                )}
            </div>
            {label && (
                <label className={type === 'checkbox' 
                    ? "text-[10px] font-bold text-text-main uppercase tracking-tight cursor-pointer order-2" 
                    : "block text-[9px] font-black text-text-dim uppercase mt-1 ml-2 mb-2 tracking-widest"}>
                    {label}
                </label>
            )}
        </div>
    );
};

export default CoWorkField;
