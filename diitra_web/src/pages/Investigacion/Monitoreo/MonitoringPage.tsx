import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, DollarSign, Calendar, AlertCircle } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DIITRA ARCHITECTURE: MONITOREO & EJECUCIÓN (MÓDULO SATÉLITE)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   - Controlar de forma desacoplada la ejecución física (Gantt) y financiera 
 *     (libro diario de presupuesto) del proyecto en su Fase C.
 *   - Aísla la complejidad financiera del Workspace principal.
 * 
 * GUÍA DE DESARROLLO:
 *   1. CONECTIVIDAD: Navega a esta página desde el Workspace del Proyecto.
 *   2. CRONOGRAMA: Renderiza el Gantt interactivo a partir de `inv_cronogramas`.
 *   3. PRESUPUESTO: Carga el desglose de recursos en `inv_presupuesto_items` y 
 *      permite registrar gastos/facturas vinculadas.
 *   4. AUTOCONTENIDO: Toda edición financiera vive aquí para evitar colisiones 
 *      con los metadatos de formulación en tiempo real.
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const MonitoringPage: React.FC = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();

    return (
        <div className="flex-1 bg-bg-deep min-h-screen text-text-main p-8 md:p-12 animate-fade-up">
            {/* Header del Satélite */}
            <header className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2.5 rounded-xl bg-surface border border-border-thin hover:border-text-main text-text-dim hover:text-text-main transition-all"
                >
                    <ArrowLeft size={14} />
                </button>
                <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-[0.3em]">
                        <Activity size={10} className="text-brand animate-pulse" />
                        <span>Módulo de Monitoreo & Ejecución · IST Traversari</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Monitoreo Físico y Financiero</h1>
                </div>
            </header>

            {/* Panel de cimientos */}
            <main className="max-w-4xl bg-surface border border-border-thin rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-brand mb-4">
                    <DollarSign size={24} className="stroke-[2.5]" />
                    <Calendar size={24} className="stroke-[2.5]" />
                </div>
                <h2 className="text-lg font-bold mb-2">Cimiento del Módulo Satélite Preparado</h2>
                <p className="text-text-dim text-sm leading-relaxed mb-6">
                    Este componente ha sido pre-aprovisionado de forma completamente desacoplada bajo la directriz del Plan de Arquitectura Modular de DIITRA. Aquí se programará de forma segura el Diagrama de Gantt, la bitácora mensual de evidencias y el libro de egresos contra el presupuesto del proyecto <span className="font-mono text-text-main">{projectUuid || 'UUID_TEMPLATE'}</span>, sin interferir con la lógica colaborativa del Workspace de formulación.
                </p>
                
                <div className="badge-vercel badge-vercel-warning !rounded-2xl !p-4 !text-xs !font-normal flex gap-3 leading-relaxed items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Nota de Arquitectura</span>
                        Para registrar facturas e hitos del CACES, implementa llamadas específicas en el backend hacia <code className="font-mono bg-surface-hover px-1 rounded">/api/Projects/{projectUuid}/expenses</code> sin modificar la entidad principal del proyecto en MariaDB.
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MonitoringPage;
