import React from 'react';
import { 
    Cpu, 
    ShieldCheck, 
    CheckCircle2, 
    FileText, 
    Settings, 
    Building2, 
    ExternalLink, 
    Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    asset: {
        uuid: string;
        titulo: string;
        trl_actual?: number;
        estado_senadi?: string;
        numero_registro?: string;
        url_producto?: string;
        proyecto_uuid?: string;
        total_transferencias?: number;
    };
    onOpenTransferModal: () => void;
}

const Phases = [
    {
        id: 1,
        title: 'FORMULACIÓN Y DISEÑO CONCEPTUAL (TRL 1-3)',
        description: 'Definición del reto tecnológico, formulación del concepto y análisis preliminar.',
        minTrl: 1,
        maxTrl: 3
    },
    {
        id: 2,
        title: 'PROTOTIPADO Y VALIDACIÓN EN LABORATORIO (TRL 4-6)',
        description: 'Construcción del prototipo funcional, simulaciones y validación en ambiente controlado.',
        minTrl: 4,
        maxTrl: 6
    },
    {
        id: 3,
        title: 'VENTANILLA DE PROPIEDAD INTELECTUAL (SENADI)',
        description: 'Expediente legal ante SENADI: derechos de autor (software) o propiedad industrial (patentes/modelos).',
        isLegal: true
    },
    {
        id: 4,
        title: 'VALIDACIÓN EN ENTORNO REAL Y PILOTO (TRL 7-8)',
        description: 'Demostración operativa del sistema en entorno productivo con usuarios reales.',
        minTrl: 7,
        maxTrl: 8
    },
    {
        id: 5,
        title: 'TRANSFERENCIA TECNOLÓGICA Y CONVENIO CTT (TRL 9)',
        description: 'Licenciamiento, cesión de derechos o convenio de transferencia tecnológica con el sector externo.',
        minTrl: 9,
        maxTrl: 9
    }
];

export const InnovationStepper: React.FC<Props> = ({ asset, onOpenTransferModal }) => {
    const currentTrl = asset.trl_actual ?? 1;
    const isSenadiGranted = asset.estado_senadi === 'Concedido';

    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            {/* Header del Stepper */}
            <div className="flex items-center gap-2.5 mb-6">
                <Settings size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                    Flujo de Maduración e Innovación CTT
                </h3>
            </div>

            {/* Stepper Vertical */}
            <div className="relative pl-8 space-y-6">
                {/* Línea conectora base */}
                <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-border-thin" />

                {Phases.map((phase, idx) => {
                    let isCompleted = false;
                    let isCurrent = false;

                    if (phase.id === 1) {
                        isCompleted = currentTrl >= 4;
                        isCurrent = currentTrl <= 3;
                    } else if (phase.id === 2) {
                        isCompleted = currentTrl >= 7;
                        isCurrent = currentTrl >= 4 && currentTrl <= 6;
                    } else if (phase.id === 3) {
                        isCompleted = isSenadiGranted;
                        isCurrent = !isSenadiGranted && asset.estado_senadi === 'EnExamen';
                    } else if (phase.id === 4) {
                        isCompleted = currentTrl >= 9;
                        isCurrent = currentTrl >= 7 && currentTrl <= 8;
                    } else if (phase.id === 5) {
                        isCompleted = (asset.total_transferencias ?? 0) > 0;
                        isCurrent = currentTrl >= 8 && (asset.total_transferencias ?? 0) === 0;
                    }

                    return (
                        <div key={phase.id} className="relative group/step">
                            {/* Segmento conector */}
                            {idx < Phases.length - 1 && (
                                <div className={`absolute top-9 bottom-[-24px] transition-all duration-300 z-0 ${
                                    isCompleted
                                        ? 'w-[2.5px] -left-[20.25px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                        : 'w-0.5 -left-[20px] bg-border-thin'
                                }`} />
                            )}

                            {/* Círculo del Paso */}
                            <div className={`absolute -left-[38px] top-0.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                                isCompleted
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                                    : isCurrent
                                        ? 'bg-text-main border-text-main text-bg-deep ring-4 ring-text-main/10 shadow-[0_0_12px_rgba(0,0,0,0.08)]'
                                        : 'bg-surface border-border-thin text-text-dim/40'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                ) : (
                                    <span className="text-xs font-bold font-mono">{phase.id}</span>
                                )}
                            </div>

                            {/* Contenido del Paso */}
                            <div className={`transition-all duration-200 ${isCurrent ? 'opacity-100' : 'opacity-70'}`}>
                                <h4 className="text-xs font-bold text-text-main tracking-wider uppercase">
                                    {phase.title}
                                </h4>
                                <p className="text-[11px] text-text-dim leading-relaxed mt-0.5">
                                    {phase.description}
                                </p>

                                {/* Bloque de Acción en Fase 1 */}
                                {phase.id === 1 && asset.proyecto_uuid && (
                                    <div className="mt-3 p-3 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-text-dim">
                                            <FileText size={14} className="opacity-60" />
                                            <span>Protocolo de Investigación Vinculado</span>
                                        </div>
                                        <Link
                                            to={`/investigacion/workspace/protocolo-investigacion/${asset.proyecto_uuid}`}
                                            className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-border-thin text-text-main hover:bg-surface-hover transition-colors"
                                        >
                                            Ver Protocolo
                                        </Link>
                                    </div>
                                )}

                                {/* Bloque de Acción en Fase 2 (Prototipo) */}
                                {phase.id === 2 && (
                                    <div className="mt-3 p-3 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-text-main font-semibold">
                                            <Cpu size={14} className="text-amber-500" />
                                            <span>Nivel Actual: TRL {currentTrl}/9</span>
                                        </div>
                                        {asset.url_producto && (
                                            <a
                                                href={asset.url_producto}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-border-thin text-text-main hover:bg-surface-hover transition-colors inline-flex items-center gap-1.5"
                                            >
                                                <span>Repositorio / Ficha</span>
                                                <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Bloque de Acción en Fase 3 (SENADI) */}
                                {phase.id === 3 && (
                                    <div className="mt-3 p-3 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs">
                                            <ShieldCheck size={14} className={isSenadiGranted ? 'text-emerald-500' : 'text-sky-500'} />
                                            <span className="font-semibold text-text-main">
                                                {asset.estado_senadi === 'Concedido' 
                                                    ? 'Título de Registro Otorgado' 
                                                    : asset.estado_senadi === 'EnExamen'
                                                        ? 'Trámite en Examen de Fondo'
                                                        : 'Solicitud ante el SENADI'}
                                            </span>
                                            {asset.numero_registro && (
                                                <span className="font-mono text-text-dim text-[11px]">
                                                    (N° {asset.numero_registro})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bloque de Acción en Fase 5 (Convenio CTT) */}
                                {phase.id === 5 && (
                                    <div className="mt-3 p-3.5 rounded-xl bg-bg-deep border border-border-thin flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-text-dim">
                                            <Building2 size={14} className="opacity-60 text-emerald-500" />
                                            <span>
                                                {asset.total_transferencias ?? 0} {asset.total_transferencias === 1 ? 'convenio suscrito' : 'convenios suscritos'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={onOpenTransferModal}
                                            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 border-0 cursor-pointer"
                                        >
                                            <Plus size={12} />
                                            <span>Registrar Convenio CTT</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
