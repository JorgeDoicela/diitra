import React, { useEffect, useRef, useState, useContext } from 'react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../types';
import { DocumentDataContext } from '../../documents/context/DocumentDataContext';
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
export const CoWorkField: React.FC<CoWorkFieldProps> = ({
    name,
    cowork,
    placeholder,
    className,
    label,
    type = 'text',
    onValueChange,
    children,
    readOnly
}) => {
    const parentFormData = useContext(DocumentDataContext);
    const dbValue = parentFormData ? parentFormData[name] : undefined;

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
        if (currentYjsVal !== null) {
            setDisplayValue(currentYjsVal);
        } else if (
            historyLoaded &&
            !seededRef.current &&
            dbValue !== undefined &&
            dbValue !== null &&
            dbValue !== ''
        ) {
            seededRef.current = true;
            const isReadOnlyMode = readOnly || cowork.session.readOnly;
            if (!isReadOnlyMode) {
                coworkLog(`[CoWorkField:${name}] Seeding Yjs from DB (one-time):`, dbValue);
                const stringVal = String(dbValue);
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, stringVal);
                }, 'local-seed');
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
    }, [ydoc, name, type, historyLoaded, dbValue, readOnly, cowork.session.readOnly]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
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

    const commonProps = {
        name,
        placeholder,
        className: type === 'checkbox'
            ? `w-5 h-5 rounded border-border-thin text-text-main focus:ring-text-main/20 cursor-pointer`
            : `${className} transition-all duration-200 focus:ring-2 focus:ring-text-main/20 outline-none`,
        disabled: cowork.session.readOnly || readOnly,
        readOnly
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
