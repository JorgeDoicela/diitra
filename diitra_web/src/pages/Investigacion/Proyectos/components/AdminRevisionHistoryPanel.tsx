import React, { useEffect, useState, useCallback } from 'react';
import {
    CheckCircle2, AlertTriangle, Shield, Clock, ChevronDown, ChevronUp,
    FileCheck, MessageSquare, User, ArrowRight, Loader2, Info
} from 'lucide-react';
import api from '../../../../api/axios_config';
import { useAuth } from '../../../../api/AuthContext';
import { FIELD_LABELS } from '../types/revisionTecnicaTypes';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TraceabilityEntry {
    estado_nuevo: string | null;
    estadoNuevo?: string | null;
    fecha_transicion: string | null;
    fechaTransicion?: string | null;
    observacion: string | null;
    hash_actual: string | null;
    hashActual?: string | null;
}

interface ParsedSectionObservation {
    fieldKey: string;
    label: string;
    text: string;
    status: 'Aprobado' | 'Corregir';
}

interface ParsedAdminRevision {
    resultado: 'Aprobado' | 'Devuelto';
    feedbackGeneral: string;
    secciones: ParsedSectionObservation[];
    fecha: string | null;
    hash: string | null;
}

// ─── Parser de observación estructurada ───────────────────────────────────────
// Formato guardado por handleAprobar/handleDevolver:
//   "Feedback general\n\nObservaciones por Sección:\n* Label:\n  - texto"
// O simplemente texto plano si no hay secciones.

function parseAdminObservation(
    raw: string,
    resultado: 'Aprobado' | 'Devuelto'
): ParsedAdminRevision['secciones'] {
    const secciones: ParsedSectionObservation[] = [];

    // Intentar parsear líneas con formato "* Label:\n  - texto"
    const seccionRegex = /\*\s*(.+?):\n((?:\s+-\s+.+\n?)+)/gm;
    let match: RegExpExecArray | null;
    while ((match = seccionRegex.exec(raw)) !== null) {
        const label = match[1].trim();
        const textos = match[2]
            .split('\n')
            .map(l => l.replace(/^\s+-\s+/, '').trim())
            .filter(Boolean);

        const fieldKey = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k] === label) || label;

        textos.forEach(texto => {
            secciones.push({
                fieldKey,
                label,
                text: texto,
                status: resultado === 'Devuelto' ? 'Corregir' : 'Aprobado'
            });
        });
    }

    // Intentar parsear formato inline de aprobación: "label: texto1; texto2 | label2: ..."
    if (secciones.length === 0 && raw.includes(']:')) {
        const parts = raw.split(' | ');
        parts.forEach(part => {
            const m = part.match(/^\[(.+?)\]:\s*(.+)$/);
            if (m) {
                const label = m[1].trim();
                const fieldKey = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k] === label) || label;
                m[2].split('; ').filter(Boolean).forEach(texto => {
                    secciones.push({ fieldKey, label, text: texto.trim(), status: 'Aprobado' });
                });
            }
        });
    }

    return secciones;
}

function extractFeedbackGeneral(raw: string): string {
    // Extraer la parte antes de "Observaciones por Sección:"
    const separatorIdx = raw.indexOf('\n\nObservaciones por Sección:');
    if (separatorIdx > 0) return raw.substring(0, separatorIdx).trim();

    // Si tiene formato de secciones inline (aprobación con observaciones menores)
    if (raw.startsWith('Revisión Técnica aprobada') || raw.startsWith('Aprobación Técnica')) {
        return raw.split(' | ')[0].trim();
    }

    // Texto plano simple
    if (!raw.includes('\n\n')) return raw.trim();
    return raw.split('\n\n')[0].trim();
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface AdminRevisionHistoryPanelProps {
    projectUuid: string;
}

export const AdminRevisionHistoryPanel: React.FC<AdminRevisionHistoryPanelProps> = ({ projectUuid }) => {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState<ParsedAdminRevision | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const loadTraceability = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${projectUuid}/traceability`);
            const entries: TraceabilityEntry[] = res.data ?? [];

            // Buscar la última transición de revisión técnica del admin
            // (Enviado → En Revisión) o (Enviado → En Corrección)
            const adminEntry = entries.find(e => {
                const estado = e.estado_nuevo ?? e.estadoNuevo;
                return estado === 'En Revisión' || estado === 'En Corrección';
            });

            if (!adminEntry) {
                setRevision(null);
                return;
            }

            const estado = adminEntry.estado_nuevo ?? adminEntry.estadoNuevo ?? '';
            const obs = adminEntry.observacion ?? '';
            const fecha = adminEntry.fecha_transicion ?? adminEntry.fechaTransicion ?? null;
            const hash = adminEntry.hash_actual ?? adminEntry.hashActual ?? null;
            const resultado: 'Aprobado' | 'Devuelto' = estado === 'En Revisión' ? 'Aprobado' : 'Devuelto';

            const secciones = parseAdminObservation(obs, resultado);
            const feedbackGeneral = extractFeedbackGeneral(obs);

            setRevision({ resultado, feedbackGeneral, secciones, fecha, hash });
        } catch (err) {
            console.error('[DIITRA] Error al cargar trazabilidad:', err);
            setRevision(null);
        } finally {
            setLoading(false);
        }
    }, [projectUuid]);

    useEffect(() => {
        loadTraceability();
    }, [loadTraceability]);

    const toggleSection = (key: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // ─── Render: cargando ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center gap-3 text-text-dim text-xs font-mono">
                <Loader2 size={16} className="animate-spin text-brand" />
                Cargando historial de revisión técnica...
            </div>
        );
    }

    // ─── Render: sin datos ───────────────────────────────────────────────────
    if (!revision) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4 text-text-dim">
                <Shield size={32} className="opacity-30" />
                <div>
                    <p className="text-sm font-semibold text-text-dim">Sin historial de revisión técnica</p>
                    <p className="text-xs mt-1 opacity-60 leading-relaxed">
                        La revisión del administrador aún no ha sido registrada para este protocolo.
                    </p>
                </div>
            </div>
        );
    }

    const isAprobado = revision.resultado === 'Aprobado';
    const totalSecciones = revision.secciones.length;
    const seccionesCorregir = revision.secciones.filter(s => s.status === 'Corregir').length;
    const seccionesOk = revision.secciones.filter(s => s.status === 'Aprobado').length;

    // Agrupar observaciones por sección
    const seccionesPorKey = revision.secciones.reduce<Record<string, ParsedSectionObservation[]>>((acc, obs) => {
        if (!acc[obs.fieldKey]) acc[obs.fieldKey] = [];
        acc[obs.fieldKey].push(obs);
        return acc;
    }, {});

    const formatFecha = (iso: string | null) => {
        if (!iso) return 'Fecha no disponible';
        try {
            return new Intl.DateTimeFormat('es-EC', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }).format(new Date(iso));
        } catch {
            return iso;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto p-6 space-y-5">

                {/* ── Cabecera de resultado ── */}
                <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
                    isAprobado
                        ? 'bg-success/5 border-success/25'
                        : 'bg-warning/5 border-warning/25'
                }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAprobado ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                    }`}>
                        {isAprobado ? <FileCheck size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className={`text-sm font-black uppercase tracking-wider ${
                                isAprobado ? 'text-success' : 'text-warning'
                            }`}>
                                Revisión Técnica {isAprobado ? 'Aprobada' : 'Devuelta para Correcciones'}
                            </h2>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border font-mono ${
                                isAprobado
                                    ? 'bg-success/10 border-success/30 text-success'
                                    : 'bg-warning/10 border-warning/30 text-warning'
                            }`}>
                                {isAprobado ? '→ En Evaluación por Pares' : '→ En Corrección'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-text-dim font-mono">
                            <Clock size={10} />
                            {formatFecha(revision.fecha)}
                        </div>
                        {isAdmin && revision.hash && (
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-text-dim/40 font-mono truncate">
                                <Shield size={9} />
                                Hash: {revision.hash.substring(0, 32)}...
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Estadísticas visuales (solo admin ve detalle completo) ── */}
                {isAdmin && totalSecciones > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-surface border border-border-thin rounded-xl p-3 text-center">
                            <p className="text-xl font-black text-text-main font-mono">{totalSecciones}</p>
                            <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold mt-0.5">Secciones revisadas</p>
                        </div>
                        <div className="bg-surface border border-success/20 rounded-xl p-3 text-center">
                            <p className="text-xl font-black text-success font-mono">{seccionesOk}</p>
                            <p className="text-[9px] text-success/70 uppercase tracking-wider font-semibold mt-0.5">Aprobadas</p>
                        </div>
                        <div className="bg-surface border border-warning/20 rounded-xl p-3 text-center">
                            <p className="text-xl font-black text-warning font-mono">{seccionesCorregir}</p>
                            <p className="text-[9px] text-warning/70 uppercase tracking-wider font-semibold mt-0.5">Con observación</p>
                        </div>
                    </div>
                )}

                {/* ── Feedback general del administrador ── */}
                {revision.feedbackGeneral && (
                    <div className="bg-surface border border-border-thin rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-thin bg-surface-hover/30">
                            <MessageSquare size={13} className="text-text-dim" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                                {isAdmin ? 'Dictamen General del Administrador' : 'Mensaje del Coordinador de Investigación'}
                            </span>
                        </div>
                        <div className="p-4">
                            <blockquote className={`text-xs leading-relaxed border-l-2 pl-3 text-text-main/80 italic ${
                                isAprobado ? 'border-success/40' : 'border-warning/40'
                            }`}>
                                {revision.feedbackGeneral}
                            </blockquote>
                        </div>
                    </div>
                )}

                {/* ── Secciones observadas ── */}
                {totalSecciones > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                                {isAdmin
                                    ? 'Observaciones por Sección del Protocolo'
                                    : 'Secciones con observaciones del Coordinador'}
                            </h3>
                            <div className="flex-1 h-[1px] bg-border-thin" />
                        </div>

                        {Object.entries(seccionesPorKey).map(([fieldKey, items]) => {
                            const isExpanded = expandedSections.has(fieldKey);
                            const label = items[0]?.label ?? (FIELD_LABELS[fieldKey] ?? fieldKey);
                            const status = items[0]?.status ?? 'Corregir';
                            const isOk = status === 'Aprobado';

                            return (
                                <div
                                    key={fieldKey}
                                    className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                                        isOk
                                            ? 'border-success/20 bg-success/[0.02]'
                                            : 'border-warning/25 bg-warning/[0.02]'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(fieldKey)}
                                        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover/30 transition-colors text-left"
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                            isOk ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                                        }`}>
                                            {isOk
                                                ? <CheckCircle2 size={13} className="stroke-[2.5]" />
                                                : <AlertTriangle size={13} className="stroke-[2.5]" />
                                            }
                                        </div>
                                        <span className="flex-1 text-xs font-semibold text-text-main truncate">{label}</span>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border font-mono shrink-0 ${
                                            isOk
                                                ? 'text-success bg-success/10 border-success/20'
                                                : 'text-warning bg-warning/10 border-warning/20'
                                        }`}>
                                            {isOk ? 'Aprobado' : 'Corregir'}
                                        </span>
                                        {isExpanded
                                            ? <ChevronUp size={13} className="text-text-dim shrink-0" />
                                            : <ChevronDown size={13} className="text-text-dim shrink-0" />
                                        }
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-3 pt-0 space-y-2 animate-fade-in">
                                            <div className="border-t border-border-thin/50 pt-3 space-y-2">
                                                {items.map((obs, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 text-xs text-text-main/80">
                                                        <ArrowRight size={12} className={`shrink-0 mt-0.5 ${isOk ? 'text-success/60' : 'text-warning/60'}`} />
                                                        <span className="leading-relaxed">{obs.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Sin secciones detalladas, mostrar texto plano ── */}
                {totalSecciones === 0 && !revision.feedbackGeneral && (
                    <div className="flex items-start gap-3 bg-surface border border-border-thin rounded-xl p-4">
                        <Info size={15} className="text-brand shrink-0 mt-0.5" />
                        <p className="text-xs text-text-dim leading-relaxed">
                            {isAprobado
                                ? 'El Coordinador de Investigación aprobó el protocolo sin observaciones adicionales. El cumplimiento de todos los controles CACES fue verificado.'
                                : 'El Coordinador de Investigación solicitó correcciones. Consulte las observaciones detalladas con su director de proyecto.'}
                        </p>
                    </div>
                )}

                {/* ── Nota de confidencialidad para no-admin ── */}
                {!isAdmin && (
                    <div className="flex items-start gap-2 text-[10px] text-text-dim/50 leading-relaxed px-1">
                        <User size={11} className="shrink-0 mt-0.5" />
                        <span>
                            Esta vista muestra únicamente el dictamen de la revisión técnica institucional.
                            Los detalles internos de auditoría son confidenciales y accesibles solo al Coordinador de Investigación.
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminRevisionHistoryPanel;
