import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';

/**
 * useDIITRADocument V1.0 (Reactive ydoc — Arquitectura Correcta)
 * ---------------------------------------------------------------
 * Hook maestro para la gestión de documentos colaborativos DIITRA.
 *
 * CAMBIO ARQUITECTÓNICO V1.0:
 * ─────────────────────────────────────────────────────────────────
 * En v2.0, el ydoc se accedía via `coworkRef.current?.ydoc`, una referencia
 * mutable que React no observa. Esto causaba un bug crítico: si SignalR
 * caía y se reconectaba (generando un nuevo ydoc), los observadores de Yjs
 * NO se re-registraban y los cambios remotos dejaban de sincronizarse.
 *
 * En V1.0, el ydoc es un PARÁMETRO REACTIVO. El padre (DocumentEditor) lo
 * obtiene de `cowork.ydoc` (estado de React), lo pasa como prop, y React
 * re-ejecuta correctamente el efecto cuando ydoc cambia (reconexión, etc.).
 *
 * Uso:
 * ─────────────────────────────────────────────────────────────────
 * // En el componente padre:
 * const cowork = useCoWork({ documentId, user });
 * const { formData, updateField, ... } = useDIITRADocument(
 *     initialData,
 *     cowork.ydoc,     // <-- parámetro reactivo
 *     { lists: ['Investigadores', 'Cronograma'] }
 * );
 */
export function useDIITRADocument<T extends Record<string, any>>(
    initialData: T,
    ydoc: Y.Doc | null,             // ← Parámetro reactivo (V1.0)
    options: {
        lists?: string[];
        richTexts?: string[];
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

    // Función estable para actualizar el estado de React e Yjs de forma bidireccional e idempotente
    const updateField = useCallback((name: string, value: any) => {
        // Sincronizar en Yjs si existe ydoc y no es una lista trackeada ni un rich-text
        // Excluimos 'Uuid' y 'uuid' de la sincronización de Yjs para evitar que se pise el identificador estático
        if (ydoc && !options.lists?.includes(name) && !options.richTexts?.includes(name) && name.toLowerCase() !== 'uuid') {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ydoc, options.lists, options.richTexts]);

    // --- LÓGICA DE LISTAS (Y.Array) ---
    const addItem = useCallback((listName: string, template: any) => {
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
    }, [ydoc]);

    const removeItem = useCallback((listName: string, index: number) => {
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
    }, [ydoc]);

    const updateItem = useCallback((listName: string, index: number, field: string, value: any) => {
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
    }, [ydoc]);

    // ─── MOTOR DE SINCRONIZACIÓN OMNISCIENTE (Re-ejecuta cuando ydoc cambia) ───
    //
    // CORRECCIÓN V1.0: Como `ydoc` es un parámetro de React (no una ref mutable),
    // este efecto se re-ejecuta correctamente cuando:
    //   1. CoWork se conecta por primera vez (ydoc: null → Y.Doc)
    //   2. SignalR pierde la conexión y se reconecta (ydoc anterior destruido → nuevo Y.Doc)
    //   3. El componente se desmonta (cleanup limpia los observadores)
    useEffect(() => {
        if (!ydoc) return; // Sin ydoc, no hay nada que sincronizar

        const cleanups: (() => void)[] = [];

        // 1. Vincular Primitivos (Campos de texto, select, etc)
        Object.keys(initialData).forEach(key => {
            if (options.lists?.includes(key)) return; // Se maneja como array
            if (options.richTexts?.includes(key)) return; // Se maneja como XMLFragment en Tiptap
            if (key.toLowerCase() === 'uuid') return; // El UUID es inmutable y no se sincroniza via Yjs

            const ytext = ydoc.getText(key);
            const observer = (event: Y.YTextEvent) => {
                // Solo actualizamos el estado local si el cambio viene de OTRO usuario
                if (event.transaction.origin === 'remote') {
                    const rawValue = ytext.toString();
                    let parsedValue: any = rawValue;

                    // Auto-detección de tipos básicos
                    if (rawValue === 'true') parsedValue = true;
                    else if (rawValue === 'false') parsedValue = false;
                    else if (!isNaN(Number(rawValue)) && rawValue !== '') parsedValue = Number(rawValue);

                    setFormData(prev => {
                        if (JSON.stringify(prev[key]) === JSON.stringify(parsedValue)) return prev;
                        return { ...prev, [key]: parsedValue };
                    });
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
                // Actualizar solo si es diferente al valor actual
                setFormData(prev => {
                    if (JSON.stringify(prev[key]) === JSON.stringify(parsedInitial)) return prev;
                    return { ...prev, [key]: parsedInitial };
                });
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
                    setFormData(prev => {
                        if (JSON.stringify(prev[listName]) === JSON.stringify(enriched)) return prev;
                        return { ...prev, [listName]: enriched };
                    });
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
                setFormData(prev => {
                    if (JSON.stringify(prev[listName]) === JSON.stringify(enriched)) return prev;
                    return { ...prev, [listName]: enriched };
                });
            }
        });

        return () => cleanups.forEach(c => c());
        // options.lists se puede serializar de forma estable; initialData es estable por useMemo en el padre
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ydoc]);

    return {
        formData,
        setFormData,
        addItem,
        removeItem,
        updateItem,
        updateField
    };
}
