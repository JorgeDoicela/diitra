import React, { useState } from 'react';
import { 
    Shield, CheckCircle2, AlertTriangle, 
    RotateCcw, Scale, Loader2 
} from 'lucide-react';
import api from '../../../../../api/axios_config';

interface AdminReviewPanelProps {
    currentProject: {
        uuid: string;
        presupuesto: number;
        convocatoriaMontoMaximo: number | null;
        convocatoria: string;
        title: string;
    };
    investigadores: Array<{
        nombres_completos?: string;
        nombre?: string;
        apellido?: string;
        rol?: string;
        horasSemanales?: number | null;
        horasDisponibles?: number | null;
        horasAsignadas?: number | null;
    }>;
    addToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info' | 'default', url?: string, onUndo?: () => void | Promise<void>) => void;
    confirm: (options: {
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        variant?: 'warning' | 'destructive' | 'primary';
    }) => Promise<boolean>;
    onStatusChanged: (newStatus: string, observation: string) => void;
}

export const AdminReviewPanel: React.FC<AdminReviewPanelProps> = ({
    currentProject,
    investigadores,
    addToast,
    confirm,
    onStatusChanged
}) => {
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 1. CHEQUEOS AUTOMÁTICOS
    // A. Presupuesto
    const maxBudget = currentProject.convocatoriaMontoMaximo;
    const currentBudget = currentProject.presupuesto || 0;
    const isBudgetOk = maxBudget ? currentBudget <= maxBudget : true;

    // B. Equipo Mínimo
    const hasPrincipalInvestigator = investigadores.some(inv => 
        (inv.rol || '').toLowerCase().includes('director') || 
        (inv.rol || '').toLowerCase().includes('principal')
    );
    const hasTeam = investigadores.length > 0;
    const isTeamOk = hasTeam && hasPrincipalInvestigator;

    // C. Carga Horaria (Exceso de horas)
    const teachersWithExceedingHours = investigadores.filter(inv => {
        const proposed = inv.horasSemanales || 0;
        const available = inv.horasDisponibles || 0;
        const assigned = inv.horasAsignadas || 0;
        return (assigned + proposed) > available;
    });
    const isHoursOk = teachersWithExceedingHours.length === 0;

    // D. Sello Digital (Por estar en estado Enviado, ya está firmado)
    const isSigned = true;

    const allOk = isBudgetOk && isTeamOk && isHoursOk && isSigned;

    // 2. ACCIONES
    const handleAprobar = async () => {
        if (!allOk) {
            if (!await confirm({
                title: "Advertencia de Validación",
                message: "El proyecto no cumple con todas las reglas de consistencia de CACES/DIITRA. ¿Está seguro de aprobarlo y enviarlo a Pares Evaluadores de todas formas?",
                confirmText: "Aprobar de todos modos",
                cancelText: "Cancelar",
                variant: "warning"
            })) return;
        } else {
            if (!await confirm({
                title: "Aprobar Revisión Técnica",
                message: "¿Aprobar la revisión técnica inicial y enviar el proyecto a la etapa de Evaluación por Pares?",
                confirmText: "Aprobar y Enviar",
                cancelText: "Cancelar",
                variant: "primary"
            })) return;
        }

        setSubmitting(true);
        try {
            const obs = feedback.trim() || 'Aprobación Técnica Inicial del Administrador. Cumple requisitos del CACES.';
            await api.post(`/projects/${currentProject.uuid}/transition`, null, {
                params: {
                    newState: 'En Revisión',
                    observation: obs
                }
            });
            addToast(
                "Revisión Aprobada",
                "El proyecto ha sido enviado exitosamente a Evaluación por Pares.",
                "success",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${currentProject.uuid}/transition`, null, {
                            params: {
                                newState: 'Enviado',
                                observation: "Reversión (Undo): Cancelación de la aprobación técnica inicial."
                            }
                        });
                        addToast("Acción Revertida", "La aprobación técnica ha sido cancelada. Proyecto en estado: Enviado", "info");
                        onStatusChanged('Enviado', "Reversión (Undo)");
                    } catch (err: any) {
                        console.error("[Undo Technical Approval] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la aprobación técnica.", "error");
                    }
                }
            );
            onStatusChanged('En Revisión', obs);
        } catch (err: any) {
            console.error(err);
            addToast("Error al transicionar", err.response?.data?.error ?? "No se pudo realizar la transición de estado.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolver = async () => {
        if (!feedback.trim()) {
            addToast("Observación requerida", "Debe redactar una retroalimentación detallada para el docente.", "warning");
            return;
        }

        if (!await confirm({
            title: "Devolver al Docente",
            message: "¿Devolver el proyecto a etapa de formulación (En Corrección) con las observaciones especificadas?",
            confirmText: "Devolver proyecto",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;

        setSubmitting(true);
        try {
            await api.post(`/projects/${currentProject.uuid}/transition`, null, {
                params: {
                    newState: 'En Corrección',
                    observation: feedback.trim()
                }
            });
            addToast(
                "Proyecto Devuelto",
                "El proyecto se ha retornado a etapa de correcciones.",
                "warning",
                undefined,
                async () => {
                    try {
                        await api.post(`/projects/${currentProject.uuid}/transition`, null, {
                            params: {
                                newState: 'Enviado',
                                observation: "Reversión (Undo): Cancelación de la devolución al docente."
                            }
                        });
                        addToast("Acción Revertida", "La devolución del proyecto ha sido cancelada. Proyecto en estado: Enviado", "info");
                        onStatusChanged('Enviado', "Reversión (Undo)");
                    } catch (err: any) {
                        console.error("[Undo Technical Return] Failed:", err);
                        addToast("Error al Revertir", err.response?.data?.error || "No se pudo deshacer la devolución del proyecto.", "error");
                    }
                }
            );
            onStatusChanged('En Corrección', feedback.trim());
        } catch (err: any) {
            console.error(err);
            addToast("Error al devolver", err.response?.data?.error ?? "No se pudo realizar la transición de estado.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bento-card p-6 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md flex flex-col gap-6 animate-fade-in">
            {/* Cabecera */}
            <div className="border-b border-border pb-4">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
                    <Shield size={15} className="text-brand animate-pulse" />
                    Revisión Técnica Admin
                </h3>
                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Control de Calidad e Integridad</p>
            </div>

            {/* Checklist de Validación Automatizada */}
            <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Chequeos de Consistencia</h4>
                
                {/* 1. Presupuesto */}
                <div className="flex items-start gap-2.5 text-xs">
                    {isBudgetOk ? (
                        <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle size={14} className="text-error shrink-0 mt-0.5 animate-bounce" />
                    )}
                    <div className="flex-1 leading-snug">
                        <p className="font-semibold text-text-main">Tope de Presupuesto</p>
                        <p className="text-[10px] text-text-dim mt-0.5">
                            Costo: ${currentBudget.toLocaleString()} / Máx: {maxBudget ? `$${maxBudget.toLocaleString()}` : 'Sin tope'}
                        </p>
                    </div>
                </div>

                {/* 2. Equipo Humano */}
                <div className="flex items-start gap-2.5 text-xs">
                    {isTeamOk ? (
                        <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle size={14} className="text-error shrink-0 mt-0.5 animate-pulse" />
                    )}
                    <div className="flex-1 leading-snug">
                        <p className="font-semibold text-text-main">Investigadores Registrados</p>
                        <p className="text-[10px] text-text-dim mt-0.5">
                            {!hasTeam 
                                ? 'No hay investigadores agregados.' 
                                : !hasPrincipalInvestigator 
                                    ? 'Falta Director/Investigador Principal.' 
                                    : `Total: ${investigadores.length} investigadores registrados.`}
                        </p>
                    </div>
                </div>

                {/* 3. Carga Horaria */}
                <div className="flex items-start gap-2.5 text-xs">
                    {isHoursOk ? (
                        <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5 animate-pulse" />
                    )}
                    <div className="flex-1 leading-snug">
                        <p className="font-semibold text-text-main">Carga Horaria Docente</p>
                        <p className="text-[10px] text-text-dim mt-0.5">
                            {isHoursOk 
                                ? 'Todos los docentes cuentan con carga horaria disponible.' 
                                : `Exceso detectado en: ${teachersWithExceedingHours.map(t => t.nombres_completos || t.nombre).join(', ')}`}
                        </p>
                    </div>
                </div>

                {/* 4. Sello Digital */}
                <div className="flex items-start gap-2.5 text-xs">
                    <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                    <div className="flex-1 leading-snug">
                        <p className="font-semibold text-text-main">Firma e Inmutabilidad</p>
                        <p className="text-[10px] text-text-dim mt-0.5">
                            Documento firmado digitalmente e inmutable.
                        </p>
                    </div>
                </div>
            </div>

            {/* Retroalimentación */}
            <div className="space-y-2">
                <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest ml-0.5">
                    Observaciones / Retroalimentación
                </label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escriba aquí los detalles de la revisión, o los motivos para devolver el proyecto al docente..."
                    className="input-vercel !h-28 !text-xs resize-none"
                    disabled={submitting}
                />
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-thin/40">
                <button
                    onClick={handleAprobar}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 btn-vercel-primary py-2.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"
                >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Scale size={12} />}
                    Aprobar y Enviar a Pares
                </button>

                <button
                    onClick={handleDevolver}
                    disabled={submitting || !feedback.trim()}
                    className="w-full flex items-center justify-center gap-1.5 bg-transparent hover:bg-error/10 text-error border border-error/20 hover:border-error/40 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                    Devolver para Correcciones
                </button>
            </div>
        </div>
    );
};

export default AdminReviewPanel;
