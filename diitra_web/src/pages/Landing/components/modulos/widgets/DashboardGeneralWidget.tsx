import React from 'react';
import { FileSignature, Clock, Cpu, ShieldCheck, Key } from 'lucide-react';

interface DashboardGeneralWidgetProps {
    onSelectModule: (id: number) => void;
    currentBudgetTotal: number;
    budgetPct: number;
    hitosCompletedCount: number;
    hitosTotalCount: number;
    signState: 'idle' | 'scanning' | 'signed';
}

export const DashboardGeneralWidget: React.FC<DashboardGeneralWidgetProps> = ({
    onSelectModule,
    currentBudgetTotal,
    budgetPct,
    hitosCompletedCount,
    hitosTotalCount,
    signState
}) => {
    return (
        <div className="h-full flex flex-col gap-3">

            {/* Cabecera del Dashboard */}
            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[9px] font-mono text-text-dim">
                <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    DIITRA AUTOMATION HUB
                </span>
                <span>MONITOR CENTRAL</span>
            </div>

            {/* Rejilla interactiva para 5 módulos (4 en grid 2x2 + 1 abajo ancho completo) */}
            <div className="grid grid-cols-6 gap-3 pt-1 text-left flex-1">

                {/* Cuadrante 1: Postulación */}
                <button
                    onClick={() => onSelectModule(1)}
                    className="col-span-3 p-3 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-brand/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[7.5px] font-mono text-text-dim">01 // CONVOCATORIA</span>
                        <FileSignature size={11} className="text-text-dim group-hover:text-brand transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] text-text-dim block leading-tight font-sans">Presupuesto</span>
                        <span className="text-xs font-bold text-text-main font-mono leading-none">${currentBudgetTotal.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-border-thin/50 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-brand transition-all duration-500" style={{ width: `${budgetPct}%` }} />
                    </div>
                </button>

                {/* Cuadrante 2: Seguimiento */}
                <button
                    onClick={() => onSelectModule(2)}
                    className="col-span-3 p-3 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-success/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[7.5px] font-mono text-text-dim">02 // SEGUIMIENTO</span>
                        <Clock size={11} className="text-text-dim group-hover:text-success transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] text-text-dim block leading-tight font-sans">Hitos Completos</span>
                        <span className="text-xs font-bold text-text-main font-mono leading-none">{hitosCompletedCount}/{hitosTotalCount}</span>
                    </div>
                    <div className="w-full bg-border-thin/50 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-success transition-all duration-500" style={{ width: `${(hitosCompletedCount / hitosTotalCount) * 100}%` }} />
                    </div>
                </button>

                {/* Cuadrante 3: Propiedad Intelectual */}
                <button
                    onClick={() => onSelectModule(3)}
                    className="col-span-3 p-3 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-warning/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[7.5px] font-mono text-text-dim">03 // PROPIEDAD INT.</span>
                        <Cpu size={11} className="text-text-dim group-hover:text-warning transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] text-text-dim block leading-tight font-sans">SENADI & Código</span>
                        <span className="text-[10px] font-mono font-medium text-text-main truncate block">Repositorio Listo</span>
                    </div>
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    </div>
                </button>

                {/* Cuadrante 4: Acreditación */}
                <button
                    onClick={() => onSelectModule(4)}
                    className="col-span-3 p-3 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-info/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[7.5px] font-mono text-text-dim">04 // ACREDITACIÓN</span>
                        <ShieldCheck size={11} className="text-text-dim group-hover:text-info transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] text-text-dim block leading-tight font-sans">Auditoría CACES</span>
                        <span className="text-[8.5px] font-mono font-semibold text-success animate-pulse truncate block">APTO ACREDITAR</span>
                    </div>
                    <div className="text-[7px] font-mono text-text-dim truncate">
                        guest@diitra:~$ status
                    </div>
                </button>

                {/* Cuadrante 5: Firma Electrónica (Ancho completo abajo) */}
                <button
                    onClick={() => onSelectModule(5)}
                    className="col-span-6 p-3 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-brand/40 transition-all duration-300 flex items-center justify-between text-left group cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <Key size={13} className="text-text-dim group-hover:text-brand transition-colors" />
                        <div className="flex flex-col">
                            <span className="text-[7.5px] font-mono text-text-dim leading-none">05 // FIRMA ELECTRÓNICA</span>
                            <span className="text-[9.5px] font-bold text-text-main mt-0.5 leading-none">INTEGRACIÓN FIRMAEC (.P12)</span>
                        </div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                        <span className={`w-1.5 h-1.5 rounded-full ${signState === 'signed' ? 'bg-success animate-pulse' : 'bg-brand animate-pulse'}`} />
                        <span className="text-[7.5px] font-mono text-text-dim uppercase">{signState === 'signed' ? 'FIRMADO' : 'LISTO'}</span>
                    </div>
                </button>

            </div>

        </div>
    );
};
