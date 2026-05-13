import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../types';

interface CoWorkFieldProps {
    name: string;
    cowork: CoWorkHandle;
    placeholder?: string;
    className?: string;
    label?: string;
    type?: 'text' | 'textarea' | 'select' | 'checkbox';
    onValueChange?: (value: any) => void;
    children?: React.ReactNode;
    readOnly?: boolean;
}

/**
 * DIITRA CoWork Field
 * -------------------
 * Un campo de entrada que sincroniza su contenido en tiempo real.
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
    const [localValue, setLocalValue] = useState<any>(type === 'checkbox' ? false : '');
    const { ydoc } = cowork;
    const isRemoteChange = useRef(false);

    // Estabilizar onValueChange para que useEffect no se re-dispare cada render
    const onValueChangeRef = useRef(onValueChange);
    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    useEffect(() => {
        if (!ydoc) return;

        const ytext = ydoc.getText(name);

        // Sincronización Inicial: solo actualizamos local si Yjs tiene algo diferente
        const initialVal = ytext.toString();
        if (initialVal) {
            const parsed = type === 'checkbox' ? initialVal === 'true' : initialVal;
            setLocalValue(prev => {
                // Evitamos llamar onValueChange si el valor es idéntico
                if (prev !== parsed) {
                    console.log(`[CoWorkField:${name}] initial sync different, calling onValueChange`);
                    onValueChangeRef.current?.(parsed);
                }
                return parsed;
            });
        }

        const observer = (event: Y.YTextEvent) => {
            console.log(`[CoWorkField:${name}] Yjs observer fired, origin=`, event.transaction.origin);
            if (event.transaction.origin === 'remote') {
                isRemoteChange.current = true;
                const raw = ytext.toString();
                const newVal = type === 'checkbox' ? raw === 'true' : raw;
                setLocalValue(prev => {
                    if (prev !== newVal) {
                        onValueChangeRef.current?.(newVal);
                    }
                    return newVal;
                });
                setTimeout(() => { isRemoteChange.current = false; }, 0);
            }
        };

        ytext.observe(observer);
        return () => {
            ytext.unobserve(observer);
        };
    }, [ydoc, name, type]); // <-- onValueChange removido de deps

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setLocalValue(newValue);
        onValueChange?.(newValue);

        if (!isRemoteChange.current && ydoc) {
            const ytext = ydoc.getText(name);
            const stringVal = String(newValue);
            ydoc.transact(() => {
                const current = ytext.toString();
                if (current !== stringVal) {
                    ytext.delete(0, current.length);
                    ytext.insert(0, stringVal);
                }
            });
        }
    };

    const commonProps = {
        name,
        placeholder,
        className: type === 'checkbox'
            ? `w-5 h-5 rounded border-border-thin text-text-main focus:ring-text-main/20 cursor-pointer`
            : `${className} transition-all duration-200 focus:ring-2 focus:ring-text-main/20 outline-none`,
        disabled: cowork.session.readOnly,
        readOnly
    };

    return (
        <div className={type === 'checkbox' ? "flex items-center gap-3" : "w-full"}>
            <div className="relative order-1">
                {type === 'text' && <input {...commonProps} type="text" value={localValue} onChange={handleChange} />}
                {type === 'textarea' && <textarea {...commonProps} value={localValue} onChange={handleChange} />}
                {type === 'select' && (
                    <select {...commonProps} value={localValue} onChange={handleChange}>
                        {children}
                    </select>
                )}
                {type === 'checkbox' && (
                    <input {...commonProps} type="checkbox" checked={localValue} onChange={handleChange} />
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
                    : "block text-[9px] font-black text-text-dim uppercase mb-2 tracking-widest"}>
                    {label}
                </label>
            )}
        </div>
    );
};

export default CoWorkField;
