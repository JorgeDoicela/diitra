import React from 'react';
import { FileText, Mail } from 'lucide-react';
import { Group } from '../types';

interface GroupWorkspaceSectionProps {
    selectedGroup: Group;
    activeWorkspaceTab: number;
    handleWorkspaceTabClick: (tabId: number) => void;
    workspaceCardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export const GroupWorkspaceSection: React.FC<GroupWorkspaceSectionProps> = ({
    selectedGroup,
    activeWorkspaceTab,
    handleWorkspaceTabClick,
    workspaceCardRefs
}) => {
    const emailContacto = selectedGroup.nombreCoordinador
        ? `${selectedGroup.nombreCoordinador.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}@istpet.edu.ec`
        : "investigacion@istpet.edu.ec";

    return (
        <section className="py-12 md:py-20 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
            <h2 className="text-3xl md:text-[44px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl mb-12">
                Un espacio de trabajo para el investigador
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
                {/* Izquierda (col-span-8): Mockup Interactivo del Editor */}
                <div className="lg:col-span-8 lg:sticky lg:top-[32vh] border border-border-thin rounded-xl bg-surface shadow-md p-6 font-mono text-xs tracking-tight relative overflow-hidden">
                    {/* Window controls */}
                    <div className="flex items-center justify-between border-b border-border-thin pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-error/50" />
                            <span className="w-3.5 h-3.5 rounded-full bg-warning/50" />
                            <span className="w-3.5 h-3.5 rounded-full bg-success/50" />
                        </div>
                        <span className="text-xs text-text-dim font-mono">Workspace://{selectedGroup.siglas || 'grupo'}-investigacion.doc</span>
                        <span className="px-2.5 py-0.5 rounded border border-success/30 bg-success-subtle text-success text-[10px] font-mono">
                            SINCRONIZADO
                        </span>
                    </div>

                    {/* Editor Layout */}
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
                        {/* Left side inside mockup: Structure selector */}
                        <div className="w-full md:col-span-4 border-b md:border-b-0 md:border-r border-border-thin pb-4 md:pb-0 md:pr-4 space-y-2 text-xs text-text-dim font-sans">
                            <p className="text-text-main font-semibold mb-3 font-mono text-[10px] tracking-wider uppercase">// ESTRUCTURA</p>

                            {[
                                { id: 1, name: '1. Objetivo' },
                                { id: 2, name: '2. Misión' },
                                { id: 3, name: '3. Visión' },
                                { id: 4, name: '4. Líneas' },
                                { id: 5, name: '5. Convocatorias' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleWorkspaceTabClick(tab.id)}
                                    className={`w-full text-left p-2.5 rounded border flex items-center justify-between cursor-pointer transition-all duration-300 ${activeWorkspaceTab === tab.id
                                        ? 'bg-surface-hover border-border-hover text-text-main font-semibold'
                                        : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                        }`}
                                >
                                    <span>{tab.name}</span>
                                    {activeWorkspaceTab === tab.id ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-border-thin/60" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Right side inside mockup: Content output */}
                        <div className="w-full md:col-span-8 flex flex-col justify-between min-h-[220px] font-sans relative">
                            <div className="flex flex-1 gap-2">
                                <div className="relative flex-1 min-w-0">
                                    {/* Tab 1: Objetivo */}
                                    {activeWorkspaceTab === 1 && (
                                        <div className="space-y-3.5 animate-fade-in font-sans">
                                            <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                <FileText size={10} />
                                                // Meta del Grupo
                                            </p>
                                            <h3 className="text-base font-bold text-text-main">Objetivo General</h3>
                                            <p className="text-text-main text-xs leading-relaxed font-light">
                                                {selectedGroup.objetivoGeneral || 'El grupo no cuenta con un objetivo general registrado.'}
                                            </p>
                                        </div>
                                    )}
                                    {/* Tab 2: Misión */}
                                    {activeWorkspaceTab === 2 && (
                                        <div className="space-y-3.5 animate-fade-in font-sans">
                                            <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                <FileText size={10} />
                                                // Propósito
                                            </p>
                                            <h3 className="text-base font-bold text-text-main">Misión</h3>
                                            <p className="text-text-main text-xs leading-relaxed font-light">
                                                {selectedGroup.mision || 'El grupo no cuenta con una misión registrada.'}
                                            </p>
                                        </div>
                                    )}
                                    {/* Tab 3: Visión */}
                                    {activeWorkspaceTab === 3 && (
                                        <div className="space-y-3.5 animate-fade-in font-sans">
                                            <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                <FileText size={10} />
                                                // Visión de Futuro
                                            </p>
                                            <h3 className="text-base font-bold text-text-main">Visión</h3>
                                            <p className="text-text-main text-xs leading-relaxed font-light">
                                                {selectedGroup.vision || 'El grupo no cuenta con una visión registrada.'}
                                            </p>
                                        </div>
                                    )}
                                    {/* Tab 4: Líneas */}
                                    {activeWorkspaceTab === 4 && (
                                        <div className="space-y-3.5 animate-fade-in font-sans">
                                            <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                <FileText size={10} />
                                                // Especialización
                                            </p>
                                            <h3 className="text-base font-bold text-text-main mb-2">Líneas de Investigación</h3>
                                            {selectedGroup.lineasNombres && selectedGroup.lineasNombres.length > 0 ? (
                                                <div className="space-y-2 pt-1">
                                                    {selectedGroup.lineasNombres.map((linea, idx) => (
                                                        <div key={idx} className="flex gap-2.5 items-start text-xs font-light">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                                                            <span className="text-text-main leading-relaxed">{linea}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-text-dim italic text-xs">El grupo no tiene líneas de investigación asociadas.</p>
                                            )}
                                        </div>
                                    )}
                                    {/* Tab 5: Convocatorias */}
                                    {activeWorkspaceTab === 5 && (
                                        <div className="space-y-3.5 animate-fade-in font-sans">
                                            <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                <FileText size={10} />
                                                // Vinculación
                                            </p>
                                            <h3 className="text-base font-bold text-text-main">Convocatorias y Adscripción</h3>
                                            <p className="text-text-main text-xs leading-relaxed font-light">
                                                ¿Te apasiona el desarrollo tecnológico y la investigación aplicada? {selectedGroup.tipoGrupo.toLowerCase() === 'semillero' ? 'Nuestro semillero' : 'Nuestro grupo de investigación'} mantiene abiertas oportunidades para postular en calidad de pasantes, tesistas o asistentes de investigación.
                                            </p>
                                            <div className="pt-2 select-none">
                                                <a
                                                    href={`mailto:${emailContacto}?subject=${encodeURIComponent(`Postulación a Grupo ${selectedGroup.siglas || ''}`)}`}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-brand text-bg-deep font-mono text-[9px] font-bold tracking-wider hover:opacity-90 transition-all shadow-sm"
                                                >
                                                    POSTULAR AL COORDINADOR <Mail size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-border-thin mt-4 pt-3 flex justify-between items-center text-[10px] text-text-dim font-mono">
                                <span>DOCUMENTO: {selectedGroup.siglas || 'grupo'}-investigacion.doc</span>
                                <span>LÍNEAS: {selectedGroup.lineasNombres?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Derecha (lg:col-span-4): Títulos con scroll-spy */}
                <div className="lg:col-span-4 space-y-[40vh] py-12 font-sans relative lg:pb-[40vh]">
                    {[
                        { id: 1, tag: '// 01. Enfoque Principal', title: 'Objetivo General' },
                        { id: 2, tag: '// 02. Propósito Actual', title: 'Misión del Grupo' },
                        { id: 3, tag: '// 03. Proyección Futura', title: 'Visión del Grupo' },
                        { id: 4, tag: '// 04. Especialidades', title: 'Líneas de Trabajo' },
                    ].map(item => (
                        <div
                            key={item.id}
                            ref={el => { workspaceCardRefs.current[item.id - 1] = el; }}
                            onClick={() => handleWorkspaceTabClick(item.id)}
                            className="cursor-pointer select-none"
                            style={{
                                opacity: activeWorkspaceTab === item.id ? 1 : 0,
                                transform: `translateY(${activeWorkspaceTab === item.id ? 0 : 12}px)`,
                                pointerEvents: activeWorkspaceTab === item.id ? 'auto' : 'none',
                                transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">{item.tag}</p>
                            <h3 className="text-3xl font-black text-text-main leading-none">{item.title}</h3>
                        </div>
                    ))}

                    {/* Bloque 5: Convocatorias */}
                    <div
                        ref={el => { workspaceCardRefs.current[4] = el; }}
                        onClick={() => handleWorkspaceTabClick(5)}
                        className="cursor-pointer select-none"
                        style={{
                            opacity: activeWorkspaceTab === 5 ? 1 : 0,
                            transform: `translateY(${activeWorkspaceTab === 5 ? 0 : 12}px)`,
                            pointerEvents: activeWorkspaceTab === 5 ? 'auto' : 'none',
                            transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 05. Vinculación</p>
                        <h3 className="text-3xl font-black text-text-main leading-none mb-6">Únete al Equipo</h3>
                        <a
                            href={`mailto:${emailContacto}?subject=${encodeURIComponent(`Postulación a Grupo ${selectedGroup.siglas || ''}`)}`}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand text-bg-deep font-mono text-xs font-bold tracking-wider hover:opacity-90 transition-all select-none shadow-[0_4px_20px_rgba(0,112,243,0.12)]"
                        >
                            SOLICITAR INGRESO <Mail size={12} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};
