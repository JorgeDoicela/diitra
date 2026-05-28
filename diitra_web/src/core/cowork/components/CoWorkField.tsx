import React, { useEffect, useRef, useState, useContext } from 'react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../types';
import { DocumentDataContext } from '../../documents/context/DocumentDataContext';

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
    const parentFormData = useContext(DocumentDataContext);
    const value = parentFormData ? parentFormData[name] : undefined;

    const [localValue, setLocalValue] = useState<any>(() => {
        if (value !== undefined && value !== null && value !== '') {
            return type === 'checkbox' ? value === 'true' || value === true : value;
        }
        return type === 'checkbox' ? false : '';
    });
    const { ydoc } = cowork;
    const isRemoteChange = useRef(false);

    // Estabilizar onValueChange para que useEffect no se re-dispare cada render
    const onValueChangeRef = useRef(onValueChange);
    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    // Sincronizar el valor local cuando el valor del padre cambie (ej: carga asíncrona de base de datos)
    useEffect(() => {
        if (value !== undefined && value !== null && value !== '' && value !== localValue) {
            const isReadOnlyMode = readOnly || cowork.session.readOnly;
            if (isReadOnlyMode) {
                setLocalValue(type === 'checkbox' ? value === 'true' || value === true : value);
            } else {
                // Si estamos en modo de escritura y Yjs está vacío, podemos poblar Yjs
                const ytext = ydoc?.getText(name);
                const currentYVal = ytext?.toString();
                if (!currentYVal || currentYVal === 'undefined') {
                    const parsed = type === 'checkbox' ? value === 'true' || value === true : value;
                    setLocalValue(parsed);
                    ydoc?.transact(() => {
                        ytext?.delete(0, ytext.length);
                        ytext?.insert(0, String(value));
                    }, 'local-initializer-effect');
                }
            }
        }
    }, [value, ydoc, name, cowork.session.readOnly, readOnly, localValue, type]);

    useEffect(() => {
        if (!ydoc) return;

        const ytext = ydoc.getText(name);

        // Sincronización Inicial: solo actualizamos local si Yjs tiene algo diferente
        const initialVal = ytext.toString();
        if (initialVal && initialVal !== 'undefined') {
            const parsed = type === 'checkbox' ? initialVal === 'true' : initialVal;
            // Solo sincronizamos si el valor local inicial (vacío) es diferente al del ydoc
            if (localValue !== parsed) {
                console.log(`[CoWorkField:${name}] Sincronización inicial detectada desde Yjs:`, parsed);
                setLocalValue(parsed);
                const callback = onValueChangeRef.current;
                if (callback) {
                    setTimeout(() => callback(parsed), 0);
                }
            }
        } else if (value !== undefined && value !== null && value !== '') {
            // Yjs está vacío, pero el padre tiene un valor de base de datos.
            const isReadOnlyMode = readOnly || cowork.session.readOnly;
            if (!isReadOnlyMode) {
                console.log(`[CoWorkField:${name}] Yjs vacío. Poblando Yjs con el valor de la BD del padre:`, value);
                const stringVal = String(value);
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, stringVal);
                }, 'local-initializer');
            } else {
                console.log(`[CoWorkField:${name}] Yjs vacío (modo sólo lectura). Usando valor de la BD:`, value);
                const parsed = type === 'checkbox' ? value === 'true' || value === true : value;
                setLocalValue(parsed);
            }
        }

        const observer = (event: Y.YTextEvent) => {
            console.log(`[CoWorkField:${name}] Yjs observer fired, origin=`, event.transaction.origin);
            if (event.transaction.origin === 'remote') {
                isRemoteChange.current = true;
                const raw = ytext.toString();
                const newVal = type === 'checkbox' ? raw === 'true' : raw;
                
                // 1. Actualizar el valor local síncronamente
                setLocalValue(newVal);
                
                // 2. Disparar el callback del padre de forma asíncrona para no contaminar la fase de render
                const callback = onValueChangeRef.current;
                if (callback) {
                    setTimeout(() => callback(newVal), 0);
                }
                
                setTimeout(() => { isRemoteChange.current = false; }, 0);
            }
        };

        ytext.observe(observer);
        return () => {
            ytext.unobserve(observer);
        };
    }, [ydoc, name, type, value, readOnly, cowork.session.readOnly]); // <-- onValueChange removido de deps, value y readOnly añadidos

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
