/**
 * @file RubricCriteriaPanel.tsx
 * @description Panel de administración de criterios de la Rúbrica de Evaluación por Pares.
 *
 * Aparece en la columna derecha de /admin/plantillas cuando la plantilla activa
 * es RUBRICA_EVALUACION y el bloque seleccionado es rubric_table.
 *
 * Flujo:
 *  1. Al montar: GET /api/admin/rubrica → carga criterios de inv_rubrica_criterios (rúbrica activa)
 *  2. El admin edita, agrega o elimina criterios en local
 *  3. Al guardar: PUT /api/admin/rubrica/criterios → persiste en BD
 *  4. El formulario del revisor y el PDF los reflejan inmediatamente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, GripVertical, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../../../../api/axios_config';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────────────

interface CriterioLocal {
    _key: string;          // clave única de UI (no es el IdCriterio de BD)
    id_criterio?: number;  // presente si ya existía en BD
    nombre: string;
    descripcion: string;
    peso_maximo: number;
}

interface RubricaAdminDto {
    id_rubrica: number;
    nombre: string;
    criterios: {
        id_criterio?: number;
        nombre: string;
        descripcion?: string;
        peso_maximo: number;
        orden: number;
    }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

let _keyCounter = 0;
const genKey = () => `crit_${++_keyCounter}_${Date.now()}`;

export const RubricCriteriaPanel: React.FC = () => {
    const [criterios, setCriterios] = useState<CriterioLocal[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    // ── Carga inicial ────────────────────────────────────────────────────────
    const loadCriterios = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<RubricaAdminDto>('/admin/rubrica');
            const data = res.data;
            const mapped: CriterioLocal[] = (data.criterios || []).map(c => ({
                _key: genKey(),
                id_criterio: c.id_criterio,
                nombre: c.nombre,
                descripcion: c.descripcion ?? '',
                peso_maximo: Number(c.peso_maximo),
            }));
            setCriterios(mapped.length > 0 ? mapped : getDefaultCriterios());
            setIsDirty(false);
        } catch {
            setError('No se pudo cargar la rúbrica. Verifica la conexión.');
            setCriterios(getDefaultCriterios());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCriterios(); }, [loadCriterios]);

    // ── Suma total de pesos ──────────────────────────────────────────────────
    const pesoTotal = criterios.reduce((sum, c) => sum + (Number(c.peso_maximo) || 0), 0);
    const pesoWarning = pesoTotal !== 100;

    // ── Handlers de edición ──────────────────────────────────────────────────
    const handleChange = (key: string, field: keyof CriterioLocal, value: string | number) => {
        setCriterios(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c));
        setIsDirty(true);
    };

    const handleAdd = () => {
        const newKey = genKey();
        setCriterios(prev => [...prev, {
            _key: newKey,
            nombre: `Criterio ${prev.length + 1}`,
            descripcion: '',
            peso_maximo: 25,
        }]);
        setExpandedKey(newKey);
        setIsDirty(true);
    };

    const handleDelete = (key: string) => {
        if (criterios.length <= 1) return;
        setCriterios(prev => prev.filter(c => c._key !== key));
        setIsDirty(true);
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        setCriterios(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
        setIsDirty(true);
    };

    const handleMoveDown = (idx: number) => {
        if (idx === criterios.length - 1) return;
        setCriterios(prev => {
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
        setIsDirty(true);
    };

    // ── Guardar en backend ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (criterios.some(c => !c.nombre.trim())) {
            setError('Todos los criterios deben tener un nombre.');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await api.put('/admin/rubrica/criterios', {
                criterios: criterios.map((c, idx) => ({
                    id_criterio: c.id_criterio ?? null,
                    nombre: c.nombre.trim(),
                    descripcion: c.descripcion.trim() || null,
                    peso_maximo: Number(c.peso_maximo),
                    orden: idx,
                })),
            });
            setIsDirty(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            // Recargar para obtener los IdCriterio generados por BD
            await loadCriterios();
        } catch {
            setError('Error al guardar los criterios. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-dim">
                <Loader2 className="w-6 h-6 animate-spin text-text-main/40" />
                <p className="text-[11px]">Cargando criterios...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-4 flex-1 min-h-0 overflow-y-auto">
            {/* Encabezado del panel */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="font-bold text-xs text-text-main">Criterios de Evaluación</h4>
                    <p className="text-[10px] text-text-dim mt-0.5 leading-normal">
                        Define qué criterios evalúan los revisores y su puntaje máximo.
                        Los cambios aplican a todos los revisores inmediatamente al guardar.
                    </p>
                </div>
            </div>

            {/* Alerta de suma de pesos */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-medium border transition-colors ${
                pesoWarning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}>
                {pesoWarning
                    ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                }
                <span>
                    Suma total de puntajes: <strong>{pesoTotal} / 100</strong>
                    {pesoWarning && ' — Se recomienda que sumen 100'}
                </span>
            </div>

            {/* Lista de criterios */}
            <div className="space-y-2">
                {criterios.map((crit, idx) => (
                    <div
                        key={crit._key}
                        className="border border-border-thin rounded-md bg-surface-hover/20 overflow-hidden transition-all"
                    >
                        {/* Fila de cabecera del criterio */}
                        <div className="flex items-center gap-1.5 px-2 py-2">
                            {/* Drag handle visual (no funcional — orden por botones) */}
                            <GripVertical className="w-3.5 h-3.5 text-text-dim/30 shrink-0" />

                            {/* Número */}
                            <span className="text-[10px] font-bold text-text-dim/60 w-4 text-center shrink-0">
                                {idx + 1}
                            </span>

                            {/* Nombre inline editable */}
                            <input
                                type="text"
                                value={crit.nombre}
                                onChange={e => handleChange(crit._key, 'nombre', e.target.value)}
                                placeholder="Nombre del criterio"
                                className="flex-1 min-w-0 text-[11px] bg-transparent border-none outline-none text-text-main font-medium placeholder:text-text-dim/50 truncate"
                            />

                            {/* Puntaje máximo */}
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={crit.peso_maximo}
                                onChange={e => handleChange(crit._key, 'peso_maximo', Number(e.target.value))}
                                className="w-12 text-[11px] bg-surface border border-border-thin rounded px-1.5 py-0.5 text-text-main text-center focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                            <span className="text-[9px] text-text-dim shrink-0">pts</span>

                            {/* Controles */}
                            <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    type="button"
                                    title="Subir"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveUp(idx)}
                                    className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    title="Bajar"
                                    disabled={idx === criterios.length - 1}
                                    onClick={() => handleMoveDown(idx)}
                                    className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    title="Editar descripción"
                                    onClick={() => setExpandedKey(expandedKey === crit._key ? null : crit._key)}
                                    className={`p-1 rounded hover:bg-surface-hover transition-colors cursor-pointer ${expandedKey === crit._key ? 'text-text-main' : 'text-text-dim'}`}
                                >
                                    {expandedKey === crit._key
                                        ? <ChevronUp className="w-3 h-3" />
                                        : <ChevronDown className="w-3 h-3" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    title="Eliminar criterio"
                                    disabled={criterios.length <= 1}
                                    onClick={() => handleDelete(crit._key)}
                                    className="p-1 rounded hover:bg-red-500/10 text-text-dim hover:text-red-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Descripción expandible */}
                        {expandedKey === crit._key && (
                            <div className="border-t border-border-thin px-3 py-2 bg-surface-hover/10">
                                <label className="text-[10px] text-text-dim block mb-1">
                                    Descripción / Guía para el revisor
                                </label>
                                <textarea
                                    rows={2}
                                    value={crit.descripcion}
                                    onChange={e => handleChange(crit._key, 'descripcion', e.target.value)}
                                    placeholder="Describe qué evalúa este criterio y cómo asignar el puntaje..."
                                    className="w-full text-[11px] bg-surface-hover/60 border border-border-thin rounded-md p-2 text-text-main focus:border-black dark:focus:border-white focus:outline-none transition-all resize-none"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Botón agregar criterio */}
            <button
                type="button"
                onClick={handleAdd}
                className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-border-thin rounded-md text-[11px] font-medium text-text-dim hover:text-text-main hover:border-border-hover hover:bg-surface-hover/30 transition-all cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" />
                Agregar Criterio
            </button>

            {/* Feedback de error */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Feedback de éxito */}
            {success && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Criterios guardados correctamente. Los revisores ya ven los cambios.
                </div>
            )}

            {/* Botón guardar */}
            <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md bg-text-main text-bg-deep text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
                {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                    : <><Save className="w-3.5 h-3.5" /> Guardar Criterios</>
                }
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Criterios por defecto si la BD está vacía
// ─────────────────────────────────────────────────────────────────────────────

function getDefaultCriterios(): CriterioLocal[] {
    return [
        { _key: genKey(), nombre: 'Pertinencia Social', descripcion: 'Relevancia del proyecto con el contexto institucional y social.', peso_maximo: 25 },
        { _key: genKey(), nombre: 'Metodología Científica', descripcion: 'Rigor y coherencia del enfoque metodológico propuesto.', peso_maximo: 25 },
        { _key: genKey(), nombre: 'Viabilidad y Presupuesto', descripcion: 'Factibilidad técnica, humana y financiera del proyecto.', peso_maximo: 25 },
        { _key: genKey(), nombre: 'Impacto y Transferencia', descripcion: 'Potencial de generación de conocimiento y aplicación práctica.', peso_maximo: 25 },
    ];
}
