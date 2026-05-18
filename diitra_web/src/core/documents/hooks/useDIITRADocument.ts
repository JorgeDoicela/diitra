import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import type { CoWorkHandle } from '../../cowork/types';

/**
 * useDIITRADocument v2.0 (Impeccable Logic)
 * ----------------------------------------
 * Hook maestro para la gestión de documentos colaborativos DIITRA.
 * Sincroniza automáticamente Primitivos (Y.Text) y Colecciones (Y.Array).
 */
export function useDIITRADocument<T extends Record<string, any>>(
    initialData: T,
    options: {
        lists?: string[];
    } = {}
) {
    // Inicializar el estado enriqueciendo los arrays con IDs únicos estables si no existen
    const [formData, setFormData] = useState<T>(() => {
        const enriched: any = { ...initialData };
        options.lists?.forEach(listName => {
            if (Array.isArray(enriched[listName])) {
                enriched[listName] = enriched[listName].map((item: any, idx: number) => {
                    if (item && typeof item === 'object' && !item.id) {
                        return { ...item, id: `db_${idx}` };
                    }
                    return item;
                });
            }
        });
        return enriched;
    });
    const coworkRef = useRef<CoWorkHandle | null>(null);

    // Función estable para actualizar el estado de React e Yjs de forma bidireccional e idempotente
    const updateField = useCallback((name: string, value: any) => {
        // Sincronizar en Yjs si existe ydoc y no es una lista trackeada
        const ydoc = coworkRef.current?.ydoc;
        if (ydoc && !options.lists?.includes(name)) {
            const ytext = ydoc.getText(name);
            const stringVal = String(value);
            if (ytext.toString() !== stringVal) {
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, stringVal);
                }, 'local-hook');
            }
        }

        setFormData(prev => {
            // Evitar re-renders si el valor es idéntico (deep check para objetos/arrays)
            if (JSON.stringify(prev[name]) === JSON.stringify(value)) return prev;
            return { ...prev, [name]: value };
        });
    }, [options.lists]);

    // --- LÓGICA DE LISTAS (Y.Array) ---
    const addItem = (listName: string, template: any) => {
        const ydoc = coworkRef.current?.ydoc;
        const enrichedTemplate = {
            ...template,
            id: template.id || `rand_${Math.random().toString(36).substring(2, 9)}`
        };
        if (ydoc) {
            const yarray = ydoc.getArray(listName);
            ydoc.transact(() => {
                yarray.push([enrichedTemplate]);
            }, 'local-hook');
        }
        setFormData(prev => ({
            ...prev,
            [listName]: [...(prev as any)[listName], enrichedTemplate]
        }));
    };

    const removeItem = (listName: string, index: number) => {
        const ydoc = coworkRef.current?.ydoc;
        if (ydoc) {
            const yarray = ydoc.getArray(listName);
            if (index >= 0 && index < yarray.length) {
                ydoc.transact(() => {
                    yarray.delete(index, 1);
                }, 'local-hook');
            }
        }
        setFormData(prev => ({
            ...prev,
            [listName]: (prev as any)[listName].filter((_: any, i: number) => i !== index)
        }));
    };

    const updateItem = (listName: string, index: number, field: string, value: any) => {
        const ydoc = coworkRef.current?.ydoc;
        if (ydoc) {
            const yarray = ydoc.getArray(listName);
            const currentItem = yarray.get(index) as any;
            if (currentItem) {
                const updatedItem = { ...currentItem, [field]: value };
                ydoc.transact(() => {
                    yarray.delete(index, 1);
                    yarray.insert(index, [updatedItem]);
                }, 'local-hook');
            }
        }
        setFormData(prev => {
            const newList = [...(prev as any)[listName]];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [listName]: newList };
        });
    };

    // --- MOTOR DE SINCRONIZACIÓN OMNISCIENTE ---
    useEffect(() => {
        const ydoc = coworkRef.current?.ydoc;
        if (!ydoc) return;

        const cleanups: (() => void)[] = [];

        // 1. Vincular Primitivos (Campos de texto, select, etc)
        Object.keys(initialData).forEach(key => {
            if (options.lists?.includes(key)) return; // Se maneja como array

            const ytext = ydoc.getText(key);
            const observer = (event: Y.YTextEvent) => {
                // Solo actualizamos el estado local si el cambio viene de OTRO usuario
                // Los cambios locales ya se manejan por el flujo normal de React
                if (event.transaction.origin === 'remote') {
                    const rawValue = ytext.toString();
                    let parsedValue: any = rawValue;
                    
                    // Auto-detección de tipos básicos
                    if (rawValue === 'true') parsedValue = true;
                    else if (rawValue === 'false') parsedValue = false;
                    else if (!isNaN(Number(rawValue)) && rawValue !== '') parsedValue = Number(rawValue);

                    updateField(key, parsedValue);
                }
            };
            ytext.observe(observer);
            cleanups.push(() => ytext.unobserve(observer));
            
            // Sincronización Inicial: Si el documento ya tiene datos en Yjs, traerlos a React
            const currentYVal = ytext.toString();
            if (currentYVal && currentYVal !== 'undefined') {
                let parsedInitial: any = currentYVal;
                if (currentYVal === 'true') parsedInitial = true;
                else if (currentYVal === 'false') parsedInitial = false;
                else if (!isNaN(Number(currentYVal)) && currentYVal !== '') parsedInitial = Number(currentYVal);
                updateField(key, parsedInitial);
            }
        });

        // 2. Vincular Listas (Arrays colaborativos)
        options.lists?.forEach(listName => {
            const yarray = ydoc.getArray(listName);
            const observer = (event: any) => {
                if (event.transaction.origin === 'remote') {
                    const rawArray = yarray.toArray();
                    const enriched = rawArray.map((item: any, idx) => {
                        if (item && typeof item === 'object' && !item.id) {
                            return { ...item, id: `db_${idx}` };
                        }
                        return item;
                    });
                    updateField(listName, enriched);
                }
            };
            yarray.observe(observer);
            cleanups.push(() => yarray.unobserve(observer));

            // Sincronización Inicial de listas
            const currentArray = yarray.toArray();
            if (currentArray.length > 0) {
                const enriched = currentArray.map((item: any, idx) => {
                    if (item && typeof item === 'object' && !item.id) {
                        return { ...item, id: `db_${idx}` };
                    }
                    return item;
                });
                updateField(listName, enriched);
            }
        });

        return () => cleanups.forEach(c => c());
    }, [coworkRef.current?.ydoc, options.lists, updateField]);

    return { 
        formData, 
        setFormData, 
        coworkRef, 
        addItem, 
        removeItem, 
        updateItem,
        updateField 
    };
}
