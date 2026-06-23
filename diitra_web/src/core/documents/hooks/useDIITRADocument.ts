import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { coworkLog } from '../../cowork/utils/log';

/**
 * Shallow-equal check: O(1) for primitives, falls back to JSON only for objects.
 */
function isEqualValue(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a == b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

function deduplicateYArray(yarray: Y.Array<any>, ydoc: Y.Doc, listName: string) {
    const arr = yarray.toArray();
    const seenIds = new Set<string>();
    const indicesToDelete: number[] = [];
    
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item && typeof item === 'object') {
            const itemId = item.id || item.uuid || item.Uuid;
            if (itemId) {
                if (seenIds.has(itemId)) {
                    indicesToDelete.push(i);
                } else {
                    seenIds.add(itemId);
                }
            }
        }
    }
    
    if (indicesToDelete.length > 0) {
        console.warn(`[DIITRA] Found ${indicesToDelete.length} duplicates in Y.Array '${listName}'.`);
        ydoc.transact(() => {
            for (let i = indicesToDelete.length - 1; i >= 0; i--) {
                yarray.delete(indicesToDelete[i], 1);
            }
        }, 'deduplication-cleanup');
    }
}

export function useDIITRADocument<T extends Record<string, any>>(
    initialData: T,
    ydoc: Y.Doc | null,
    options: {
        lists?: string[];
        richTexts?: string[];
        nonCollaborative?: string[];
        isHistoryLoaded?: boolean;
    } = {}
) {
    const [localChangeCount, setLocalChangeCount] = useState(0);

    const [formData, setFormData] = useState<T>(() => {
        const enriched: any = { ...initialData };
        options.lists?.forEach(listName => {
            if (Array.isArray(enriched[listName])) {
                enriched[listName] = enriched[listName].map((item: any, idx: number) => {
                    if (item && typeof item === 'object') {
                        const newItem = { ...item };
                        if (!newItem.id) {
                            newItem.id = `db_${idx}`;
                        }
                        if (listName === 'Cronograma' && !newItem.Semanas) {
                            newItem.Semanas = Array(12).fill(false);
                        }
                        return newItem;
                    }
                    return item;
                });
            }
        });
        return enriched;
    });

    const updateField = useCallback((name: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => {
        const source = meta?.source ?? 'local';

        if (source !== 'remote' &&
            ydoc &&
            !options.lists?.includes(name) &&
            !options.richTexts?.includes(name) &&
            !options.nonCollaborative?.includes(name) &&
            name.toLowerCase() !== 'uuid' &&
            name.toLowerCase() !== 'entityuuid') {
            const ytext = ydoc.getText(name);
            const stringVal = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
            if (ytext.toString() !== stringVal) {
                ydoc.transact(() => {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, stringVal);
                }, 'local-hook');
            }
        }

        setFormData(prev => {
            if (isEqualValue(prev[name], value)) return prev;
            return { ...prev, [name]: value };
        });
        if (source !== 'remote' && source !== 'system') {
            setLocalChangeCount(c => c + 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ydoc, options.lists, options.richTexts, options.nonCollaborative]);

    const addItem = useCallback((listName: string, template: any) => {
        const enrichedTemplate = {
            ...template,
            id: template.id || `rand_${crypto.randomUUID().replace(/-/g, '').substring(0, 10)}`
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
        setLocalChangeCount(c => c + 1);
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
        setLocalChangeCount(c => c + 1);
    }, [ydoc]);

    const updateItem = useCallback((listName: string, index: number, field: string, value: any) => {
        if (ydoc) {
            const yarray = ydoc.getArray(listName);
            const currentItem = yarray.get(index) as any;
            if (currentItem) {
                if (currentItem[field] === value) return;
                const updatedItem = { ...currentItem, [field]: value };
                if (isEqualValue(currentItem, updatedItem)) return;
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
        setLocalChangeCount(c => c + 1);
    }, [ydoc]);

    useEffect(() => {
        if (!ydoc) return;

        const cleanups: (() => void)[] = [];

        Object.keys(initialData).forEach(key => {
            if (options.lists?.includes(key)) return;
            if (options.richTexts?.includes(key)) return;
            if (options.nonCollaborative?.includes(key)) return;
            if (key.toLowerCase() === 'uuid' || key.toLowerCase() === 'entityuuid') return;

            const ytext = ydoc.getText(key);
            const observer = (event: Y.YTextEvent) => {
                if (event.transaction.origin === 'remote') {
                    const rawValue = ytext.toString();
                    let parsedValue: any = rawValue;

                    if (rawValue === 'true') parsedValue = true;
                    else if (rawValue === 'false') parsedValue = false;
                    else if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
                        try {
                            parsedValue = JSON.parse(rawValue);
                        } catch (e) {}
                    }
                    else if (!isNaN(Number(rawValue)) && rawValue !== '') parsedValue = Number(rawValue);

                    setFormData(prev => {
                        if (isEqualValue(prev[key], parsedValue)) return prev;
                        return { ...prev, [key]: parsedValue };
                    });
                }
            };
            ytext.observe(observer);
            cleanups.push(() => ytext.unobserve(observer));

            const currentYVal = ytext.toString();
            if (currentYVal && currentYVal !== 'undefined') {
                let parsedInitial: any = currentYVal;
                if (currentYVal === 'true') parsedInitial = true;
                else if (currentYVal === 'false') parsedInitial = false;
                else if (currentYVal.startsWith('{') || currentYVal.startsWith('[')) {
                    try {
                        parsedInitial = JSON.parse(currentYVal);
                    } catch (e) {}
                }
                else if (!isNaN(Number(currentYVal)) && currentYVal !== '') parsedInitial = Number(currentYVal);
                setFormData(prev => {
                    if (isEqualValue(prev[key], parsedInitial)) return prev;
                    return { ...prev, [key]: parsedInitial };
                });
            }
        });

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
                    
                    const seen = new Set();
                    const uniqueEnriched = enriched.filter((item: any) => {
                        const id = item?.id || item?.uuid || item?.Uuid;
                        if (id) {
                            if (seen.has(id)) return false;
                            seen.add(id);
                        }
                        return true;
                    });

                    setFormData(prev => {
                        if (isEqualValue(prev[listName], uniqueEnriched)) return prev;
                        return { ...prev, [listName]: uniqueEnriched };
                    });
                }
            };
            yarray.observe(observer);
            cleanups.push(() => yarray.unobserve(observer));

            deduplicateYArray(yarray, ydoc, listName);

            const currentArray = yarray.toArray() as any[];
            if (listName === 'Investigadores' && options.isHistoryLoaded && Array.isArray(initialData.Investigadores)) {
                const targetArray = initialData.Investigadores.map((dbInv: any, idx: number) => {
                    const yjsInv = currentArray.find((yInv: any) => 
                        yInv && yInv.Cedula && dbInv.Cedula && 
                        yInv.Cedula.trim().toLowerCase() === dbInv.Cedula.trim().toLowerCase()
                    );
                    return {
                        Nombre: dbInv.Nombre ?? '',
                        Cedula: dbInv.Cedula ?? '',
                        Email: dbInv.Email ?? '',
                        NivelAcademico: dbInv.NivelAcademico ?? '',
                        Rol: dbInv.Rol ?? '',
                        id: dbInv.id || yjsInv?.id || `db_${idx}`,
                        Telefono: dbInv.Telefono ?? '',
                        HorasSemanales: dbInv.HorasSemanales ?? null,
                    };
                });

                const areEqual = (arrA: any[], arrB: any[]) => {
                    if (arrA.length !== arrB.length) return false;
                    for (let i = 0; i < arrA.length; i++) {
                        const a = arrA[i] || {};
                        const b = arrB[i] || {};
                        if (
                            (a.Nombre ?? '') !== (b.Nombre ?? '') ||
                            (a.Cedula ?? '') !== (b.Cedula ?? '') ||
                            (a.Email ?? '') !== (b.Email ?? '') ||
                            (a.NivelAcademico ?? '') !== (b.NivelAcademico ?? '') ||
                            (a.Rol ?? '') !== (b.Rol ?? '') ||
                            (a.id ?? '') !== (b.id ?? '') ||
                            (a.Telefono ?? '') !== (b.Telefono ?? '') ||
                            (a.HorasSemanales ?? null) !== (b.HorasSemanales ?? null)
                        ) {
                            return false;
                        }
                    }
                    return true;
                };

                if (!areEqual(currentArray, targetArray)) {
                    coworkLog(`[DIITRA] Force-updating Yjs list 'Investigadores' to match DB truth. DB count: ${targetArray.length}, Yjs count: ${currentArray.length}`);
                    ydoc.transact(() => {
                        yarray.delete(0, yarray.length);
                        if (targetArray.length > 0) {
                            yarray.push(targetArray);
                        }
                    }, 'local-hook-force-sync');

                    setFormData(prev => {
                        if (isEqualValue(prev[listName], targetArray)) return prev;
                        return { ...prev, [listName]: targetArray };
                    });
                } else {
                    setFormData(prev => {
                        if (isEqualValue(prev[listName], targetArray)) return prev;
                        return { ...prev, [listName]: targetArray };
                    });
                }
            } else if (currentArray.length > 0) {
                const enriched = currentArray.map((item: any, idx) => {
                    if (item && typeof item === 'object' && !item.id) {
                        return { ...item, id: `db_${idx}` };
                    }
                    return item;
                });
                
                const seen = new Set();
                const uniqueEnriched = enriched.filter((item: any) => {
                    const id = item?.id || item?.uuid || item?.Uuid;
                    if (id) {
                        if (seen.has(id)) return false;
                        seen.add(id);
                    }
                    return true;
                });

                setFormData(prev => {
                    if (isEqualValue(prev[listName], uniqueEnriched)) return prev;
                    return { ...prev, [listName]: uniqueEnriched };
                });
            } else if (options.isHistoryLoaded && Array.isArray(initialData[listName]) && initialData[listName].length > 0) {
                const enriched = initialData[listName].map((item: any, idx: number) => {
                    if (item && typeof item === 'object') {
                        const newItem = { ...item };
                        if (!newItem.id) {
                            newItem.id = `db_${idx}`;
                        }
                        if (listName === 'Cronograma' && !newItem.Semanas) {
                            newItem.Semanas = Array(12).fill(false);
                        }
                        return newItem;
                    }
                    return item;
                });
                coworkLog(`[DIITRA] Initializing Yjs list '${listName}' from DB`);
                ydoc.transact(() => {
                    yarray.push(enriched);
                }, 'local-hook');
            }
        });

        return () => cleanups.forEach(c => c());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ydoc, options.isHistoryLoaded]);

    return {
        formData,
        setFormData,
        localChangeCount,
        addItem,
        removeItem,
        updateItem,
        updateField
    };
}
