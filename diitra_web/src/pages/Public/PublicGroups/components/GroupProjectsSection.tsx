import React from 'react';
import { Activity } from 'lucide-react';
import { estadoColor } from '../types';
import type { Group } from '../types';

interface GroupProjectsSectionProps {
    selectedGroup: Group;
    selectedProjectUuid: string | null;
    setSelectedProjectUuid: (uuid: string) => void;
}

export const GroupProjectsSection: React.FC<GroupProjectsSectionProps> = ({
    selectedGroup,
    selectedProjectUuid,
    setSelectedProjectUuid
}) => {
    return (
        <section className="py-28 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Izquierda (lg:col-span-4): Textos e Selector interactivo */}
                <div className="lg:col-span-4 lg:order-last space-y-6 font-sans">
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">// Portafolio de Proyectos</p>
                    <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter leading-tight text-text-main">
                        Proyectos Vinculados
                    </h2>
                    <p className="text-text-dim text-xs leading-relaxed">
                        Proyectos y líneas de desarrollo tecnológico liderados por los investigadores de este grupo en el periodo vigente.
                    </p>

                    {selectedGroup.proyectos && selectedGroup.proyectos.length > 0 ? (
                        <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-1">
                            {selectedGroup.proyectos.map((proyecto) => (
                                <button
                                    key={proyecto.uuid}
                                    onClick={() => setSelectedProjectUuid(proyecto.uuid)}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-2.5 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${selectedProjectUuid === proyecto.uuid
                                        ? 'bg-surface border-border-hover text-text-main font-medium'
                                        : 'border-border-thin/40 bg-surface/5 text-text-dim hover:text-text-main hover:bg-surface/20'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex justify-between items-center gap-3">
                                            <span className="text-[9px] font-mono font-semibold text-brand uppercase tracking-wider">
                                                {proyecto.codigoInstitucional || 'S/N - CÓDIGO'}
                                            </span>
                                            <span className={`text-[8px] font-mono shrink-0 font-semibold px-2 py-0.5 rounded-full border border-border-thin/45 uppercase tracking-wide ${estadoColor(proyecto.estado)}`}>
                                                {proyecto.estado}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold leading-snug line-clamp-1 text-text-main">
                                            {proyecto.titulo}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-dim text-xs italic">El grupo no tiene proyectos asociados.</p>
                    )}
                </div>

                {/* Derecha (lg:col-span-8): Mockup Window de CACES */}
                <div className="lg:col-span-8 lg:order-first flex flex-col items-center justify-center overflow-visible laptop-container">
                    <style>{`
                        .laptop-container {
                            perspective: 1200px;
                            width: 100%;
                            max-width: 740px;
                            margin: 0 auto;
                            overflow: visible;
                        }
                        .laptop-lid {
                            background: #0a0a0a;
                            border: 12px solid #0a0a0a;
                            border-bottom: 2px solid #0a0a0a;
                            border-radius: 18px 18px 0 0;
                            box-shadow:
                                inset 0 1px 1px rgba(255, 255, 255, 0.08),
                                inset 0 -1px 1px rgba(0, 0, 0, 0.9);
                            position: relative;
                            z-index: 2;
                        }
                        [data-theme="light"] .laptop-lid {
                            background: #121212;
                            border-color: #121212;
                            border-bottom-color: #121212;
                            box-shadow:
                                inset 0 1px 1px rgba(255, 255, 255, 0.1),
                                inset 0 -1px 1px rgba(0, 0, 0, 0.85);
                        }
                        .laptop-screen-glass {
                            background: #000000;
                            border-radius: 8px 8px 0 0;
                            padding: 3px;
                            position: relative;
                            overflow: hidden;
                            aspect-ratio: 16/10;
                            display: flex;
                            flex-direction: column;
                        }
                        .laptop-camera {
                            position: absolute;
                            top: 6px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 5px;
                            height: 5px;
                            background: #111;
                            border-radius: 50%;
                            border: 0.5px solid #333;
                            z-index: 10;
                        }
                        .laptop-camera::after {
                            content: '';
                            position: absolute;
                            top: 1.5px;
                            left: 1.5px;
                            width: 2px;
                            height: 2px;
                            background: #0070f3;
                            border-radius: 50%;
                            opacity: 0.65;
                        }
                        .laptop-display {
                            flex: 1;
                            background: #050505;
                            position: relative;
                            overflow: hidden;
                            border-radius: 5px;
                            border: 1px solid #111;
                        }
                        [data-theme="light"] .laptop-display {
                            background: #fafafa;
                            border-color: #eaeaea;
                        }
                        .laptop-screen-glare {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 200%;
                            height: 100%;
                            background: linear-gradient(
                                125deg,
                                rgba(255, 255, 255, 0.05) 0%,
                                rgba(255, 255, 255, 0.02) 25%,
                                rgba(255, 255, 255, 0) 50%
                            );
                            transform: rotate(-10deg) translateY(-20%);
                            pointer-events: none;
                            z-index: 8;
                        }
                        .laptop-base-wrapper {
                            position: relative;
                            width: 114%;
                            margin-left: -7%;
                            z-index: 3;
                        }
                        .laptop-base {
                            height: 14px;
                            background: linear-gradient(to bottom, #1f1f1f 0%, #121212 25%, #0a0a0a 70%, #050505 100%);
                            border-radius: 2px 2px 10px 10px;
                            box-shadow:
                                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                                inset 0 -1px 2px rgba(0, 0, 0, 0.9);
                            position: relative;
                        }
                        [data-theme="light"] .laptop-base {
                            background: linear-gradient(to bottom, #2b2b2b 0%, #1c1c1c 25%, #141414 70%, #0d0d0d 100%);
                            box-shadow:
                                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                                inset 0 -1px 2px rgba(0, 0, 0, 0.8);
                        }
                        .laptop-notch {
                            position: absolute;
                            top: 0;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 86px;
                            height: 5px;
                            background: #050505;
                            border-radius: 0 0 5px 5px;
                        }
                        [data-theme="light"] .laptop-notch {
                            background: #0d0d0d;
                        }
                    `}</style>

                    <div className="laptop-lid w-full">
                        <div className="laptop-screen-glass">
                            <div className="laptop-camera" />
                            <div className="laptop-screen-glare" />
                            <div className="laptop-display p-6 flex flex-col justify-between select-none relative overflow-y-auto">
                                <div>
                                    {/* Window controls */}
                                    <div className="flex items-center justify-between border-b border-border-thin/40 pb-3 mb-5 text-[10px] font-mono">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-error/50" />
                                            <span className="w-3 h-3 rounded-full bg-warning/50" />
                                            <span className="w-3 h-3 rounded-full bg-success/50" />
                                        </div>
                                        <span className="text-text-dim">Ficha_Proyecto_{selectedGroup.siglas || 'ISTPET'}.exe</span>
                                        <span className="text-brand uppercase">SIIES</span>
                                    </div>

                                    {/* CACES Interface output */}
                                    {selectedProjectUuid && selectedGroup.proyectos ? (
                                        (() => {
                                            const proj = selectedGroup.proyectos.find(p => p.uuid === selectedProjectUuid);
                                            if (!proj) return null;
                                            const isComplete = (proj.estado || '').toLowerCase() === 'aprobado' || (proj.estado || '').toLowerCase() === 'completado';
                                            const isExecuting = (proj.estado || '').toLowerCase() === 'en ejecución' || (proj.estado || '').toLowerCase() === 'en progreso';

                                            const pct = isComplete ? 100 : isExecuting ? 50 : 15;
                                            const lbl = isComplete ? 'CUMPLIDO' : isExecuting ? 'EN EJECUCIÓN' : 'PLANIFICADO';
                                            const pctText = isComplete ? '100%' : 'Fase Activa';

                                            return (
                                                <div className="space-y-6 font-sans">
                                                    <div className="space-y-2 border-b border-border-thin/40 pb-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-text-dim uppercase font-mono tracking-wider">// DETALLE CIENTÍFICO</span>
                                                            {proj.codigoInstitucional && <span className="text-[10px] text-text-dim font-mono">{proj.codigoInstitucional}</span>}
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-text-main leading-snug">{proj.titulo}</h4>
                                                        {proj.directorNombre && (
                                                            <p className="text-xs text-text-dim mt-1">Director: <strong className="text-text-main font-medium">{proj.directorNombre}</strong></p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs items-center">
                                                                <span className="text-text-main font-semibold font-mono flex items-center gap-1.5">
                                                                    <Activity size={12} className="text-brand" />
                                                                    // Fase de Avance
                                                                </span>
                                                                <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded-full border ${isComplete ? 'text-success bg-success/5 border-success/15' : isExecuting ? 'text-warning bg-warning/5 border-warning/15' : 'text-brand bg-brand/5 border-brand/15'}`}>{pctText} — {lbl}</span>
                                                            </div>
                                                            <div className="w-full h-2.5 bg-surface-hover border border-border-thin rounded-full overflow-hidden p-[2px]">
                                                                <div className="h-full rounded-full bg-gradient-to-r from-brand to-success transition-all duration-700" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border border-border-thin rounded p-3 bg-surface/50 flex justify-between items-center text-xs font-mono">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-main font-mono text-[10px]">Proyecto_{proj.codigoInstitucional || proj.uuid.substring(0, 8)}.pdf</span>
                                                        </div>
                                                        <button disabled className="text-[10px] border border-border-thin bg-surface px-2.5 py-1 rounded font-bold font-mono text-text-main select-none">
                                                            REGISTRADO
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="py-12 text-center text-text-dim font-sans text-xs">
                                            Selecciona un proyecto para auditar evidencias
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="laptop-base-wrapper">
                        <div className="laptop-base">
                            <div className="laptop-notch" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
