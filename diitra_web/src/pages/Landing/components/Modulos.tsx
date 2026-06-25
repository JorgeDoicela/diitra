import React, { useState } from 'react';
import { FileSignature, Clock, Cpu, ShieldCheck, Check, Terminal, Loader2 } from 'lucide-react';

const Modulos: React.FC = () => {
    // Card A: Presupuesto
    const [budgetToggles, setBudgetToggles] = useState({
        equipos: true,
        materiales: true,
        vinculacion: false
    });

    const budgetValues = {
        equipos: 2100,
        materiales: 900,
        vinculacion: 1500
    };

    const toggleBudget = (key: 'equipos' | 'materiales' | 'vinculacion') => {
        setBudgetToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const currentBudgetTotal = (budgetToggles.equipos ? budgetValues.equipos : 0) +
                               (budgetToggles.materiales ? budgetValues.materiales : 0) +
                               (budgetToggles.vinculacion ? budgetValues.vinculacion : 0);

    const budgetMax = budgetValues.equipos + budgetValues.materiales + budgetValues.vinculacion;
    const budgetPct = Math.round((currentBudgetTotal / budgetMax) * 100);

    // Card B: Hitos
    const [hitos, setHitos] = useState([
        { id: 1, name: 'Hito 1: Marco Teórico', completed: true },
        { id: 2, name: 'Hito 2: Diseño de Algoritmo', completed: true },
        { id: 3, name: 'Hito 3: Evidencias y Pruebas', completed: false }
    ]);

    const toggleHito = (id: number) => {
        setHitos(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    };

    const hitosCompletedCount = hitos.filter(h => h.completed).length;
    const hitosTotalCount = hitos.length;

    // Card C: Descargas
    const [downloadStates, setDownloadStates] = useState<{ [key: string]: 'idle' | number | 'success' }>({
        'Certificado_SENADI.pdf': 'idle',
        'Codigo_Fuente.zip': 'idle'
    });

    const triggerDownload = (fileName: string) => {
        if (downloadStates[fileName] !== 'idle') return;
        
        let progress = 0;
        setDownloadStates(prev => ({ ...prev, [fileName]: 0 }));
        
        const interval = setInterval(() => {
            progress += 25;
            if (progress >= 100) {
                clearInterval(interval);
                setDownloadStates(prev => ({ ...prev, [fileName]: 'success' }));
                
                setTimeout(() => {
                    setDownloadStates(prev => ({ ...prev, [fileName]: 'idle' }));
                }, 3000);
            } else {
                setDownloadStates(prev => ({ ...prev, [fileName]: progress }));
            }
        }, 200);
    };

    // Card D: Terminal Logs con comandos interactivos
    const [terminalLogs, setTerminalLogs] = useState<string[]>([
        'guest@diitra:~$ status',
        '✓ [14:02:15] Validando Distributivo de Investigadores...',
        '✓ [14:02:16] Evidencias compiladas de Proyectos (12/12)',
        '✓ [14:02:17] Sistema listo para auditoría CACES.'
    ]);
    const [logRunning, setLogRunning] = useState<boolean>(false);

    const runCommand = (commandType: 'clear' | 'sync' | 'audit') => {
        if (logRunning) return;
        setLogRunning(true);

        if (commandType === 'clear') {
            setTerminalLogs(['guest@diitra:~$ clear']);
            setTimeout(() => {
                setTerminalLogs(['guest@diitra:~$ ']);
                setLogRunning(false);
            }, 300);
            return;
        }

        if (commandType === 'sync') {
            setTerminalLogs(prev => [...prev, 'guest@diitra:~$ sync --siies']);
            const logs = [
                '⟳ Conectando con pasarela SIIES...',
                '✓ Autenticación de certificado digital firmaEC completada.',
                '⟳ Transmitiendo lote de evidencias académicas...',
                '✓ Carga finalizada con éxito. Código de respuesta: 200 (OK).'
            ];
            let idx = 0;
            const interval = setInterval(() => {
                if (idx < logs.length) {
                    setTerminalLogs(prev => [...prev, logs[idx]]);
                    idx++;
                } else {
                    clearInterval(interval);
                    setLogRunning(false);
                }
            }, 450);
        }

        if (commandType === 'audit') {
            setTerminalLogs(prev => [...prev, 'guest@diitra:~$ audit --caces']);
            const logs = [
                '⟳ Escaneando repositorios de evidencias...',
                '✓ Indicador I+D+i verificado: 100% cumplimiento.',
                '✓ Horas de distributivo académico sincronizadas (24 docentes).',
                '✓ Auditoría local finalizada: DIITRA APTO PARA ACREDITACIÓN.'
            ];
            let idx = 0;
            const interval = setInterval(() => {
                if (idx < logs.length) {
                    setTerminalLogs(prev => [...prev, logs[idx]]);
                    idx++;
                } else {
                    clearInterval(interval);
                    setLogRunning(false);
                }
            }, 450);
        }
    };

    return (
        <section id="modulos" className="py-20 lg:-ml-24 lg:-mr-24 space-y-16 select-none">
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                Módulos de Automatización.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Bento Card A: Postulación */}
                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Fase_Convocatoria</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6">
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span>// CONFIGURAR PRESUPUESTO (Haz clic en tarjetas)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-brand font-bold font-sans text-[10px]">Total: ${currentBudgetTotal.toLocaleString()}.00</span>
                                {/* Mini donut reactive chart */}
                                <svg width="22" height="22" className="rotate-[-90deg] shrink-0">
                                    <circle cx="11" cy="11" r="8" stroke="var(--border)" strokeWidth="2.5" fill="transparent" />
                                    <circle 
                                        cx="11" 
                                        cy="11" 
                                        r="8" 
                                        stroke="var(--brand)" 
                                        strokeWidth="2.5" 
                                        fill="transparent" 
                                        strokeDasharray="50.26" 
                                        strokeDashoffset={50.26 - (50.26 * budgetPct) / 100} 
                                        className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => toggleBudget('equipos')} className={`p-2 border rounded text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${budgetToggles.equipos ? 'bg-bg-deep border-brand/50 shadow-sm' : 'bg-surface/10 border-border-thin opacity-30'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">01/ EQUIPOS</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$2,100.00</p>
                            </button>
                            <button onClick={() => toggleBudget('materiales')} className={`p-2 border rounded text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${budgetToggles.materiales ? 'bg-bg-deep border-brand/50 shadow-sm' : 'bg-surface/10 border-border-thin opacity-30'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">02/ MATERIALES</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$900.00</p>
                            </button>
                            <button onClick={() => toggleBudget('vinculacion')} className={`p-2 border rounded text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${budgetToggles.vinculacion ? 'bg-bg-deep border-brand/50 shadow-sm' : 'bg-surface/10 border-border-thin opacity-30'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">03/ VINCULACIÓN</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$1,500.00</p>
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[7px]"><span>Ejecución del límite institucional</span><span>{budgetPct}%</span></div>
                            <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-brand transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${budgetPct}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">Postulación & Peer Review</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Formularios simplificados con Gantt y presupuestos integrados. Asignación automatizada de revisores doble ciego.</p>
                    </div>
                </div>

                {/* Bento Card B: Seguimiento */}
                <div className="lg:col-span-4 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <Clock size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Monitoreo_Docente</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6">
                        <div className="flex justify-between items-center border-b border-border-thin pb-1">
                            <span>// HITOS COMPLETADOS</span>
                            <span className="text-success font-bold font-mono">{hitosCompletedCount}/{hitosTotalCount}</span>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-center min-h-[60px]">
                            {hitos.map((h) => (
                                <button 
                                    key={h.id} 
                                    onClick={() => toggleHito(h.id)} 
                                    className={`flex items-center gap-2 font-sans w-full text-left cursor-pointer transition-all duration-300 ${h.completed ? 'text-success' : 'text-text-dim'}`}
                                >
                                    <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${h.completed ? 'bg-success/15 border-success text-success' : 'bg-surface/20 border-border-thin text-transparent'}`}>
                                        <Check size={8} strokeWidth={3} />
                                    </span>
                                    <span className="font-semibold text-[9.5px]">{h.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Interactive sliding teacher avatar map */}
                        <div className="space-y-1 border-t border-border-thin/50 pt-2 pb-0.5">
                            <span className="text-[7px] text-text-dim block uppercase tracking-wider">// AVANCE DOCENTE EN VIVO</span>
                            <div className="relative h-4 mt-2 flex items-center">
                                <div className="absolute w-full bg-border-thin h-1 rounded-full" />
                                <div 
                                    className="absolute h-1 bg-success rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                                    style={{ width: `${(hitosCompletedCount / hitosTotalCount) * 100}%` }}
                                />
                                <div 
                                    className="absolute w-5 h-5 rounded-full bg-brand text-white border-2 border-surface flex items-center justify-center text-[6.5px] font-sans font-bold transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md"
                                    style={{ left: `calc(${(hitosCompletedCount / hitosTotalCount) * 100}% - 10px)` }}
                                    title="Docente Manuel Cevallos"
                                >
                                    MC
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">Seguimiento & Distributivo</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Verificación mensual de horas de investigación mediante carga de evidencias de hito.</p>
                    </div>
                </div>

                {/* Bento Card C: SENADI */}
                <div className="lg:col-span-4 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Propiedad_Intelectual</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6 flex flex-col justify-center min-h-[110px]">
                        {Object.keys(downloadStates).map((fileName) => {
                            const state = downloadStates[fileName];
                            return (
                                <button key={fileName} onClick={() => triggerDownload(fileName)} className="p-2 border border-border-thin rounded bg-bg-deep flex flex-col gap-1 text-left w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/35 cursor-pointer">
                                    <div className="flex justify-between items-center font-sans">
                                        <span className="text-[10px] text-text-main font-medium">{fileName}</span>
                                        <span className="text-brand text-[8.5px] font-bold font-mono">{state === 'idle' ? 'DESCARGAR' : state === 'success' ? 'COMPLETO ✓' : `${state}%`}</span>
                                    </div>
                                    {typeof state === 'number' && (
                                        <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-brand transition-all duration-300 ease-out" style={{ width: `${state}%` }} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">SENADI & Repositorio</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Gestión del registro de derechos de autor y propiedad intelectual.</p>
                    </div>
                </div>

                {/* Bento Card D: Acreditación */}
                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <ShieldCheck size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Evaluación_Externa</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6">
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span className="flex items-center gap-1"><Terminal size={11} className="text-text-main" /> // CONSOLA DE AUDITORÍA CACES</span>
                            <div className="flex gap-1.5 font-sans text-[7.5px]">
                                <button 
                                    onClick={() => runCommand('sync')} 
                                    disabled={logRunning} 
                                    className="px-2 py-0.5 bg-brand text-white rounded font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                >
                                    SYNC SIIES
                                </button>
                                <button 
                                    onClick={() => runCommand('audit')} 
                                    disabled={logRunning} 
                                    className="px-2 py-0.5 bg-success text-white rounded font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                >
                                    AUDITAR
                                </button>
                                <button 
                                    onClick={() => runCommand('clear')} 
                                    disabled={logRunning} 
                                    className="px-2 py-0.5 border border-border-thin text-text-dim rounded font-bold hover:text-text-main cursor-pointer"
                                >
                                    CLEAR
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 text-[8px] font-mono min-h-[70px] flex flex-col justify-end bg-bg-deep/45 p-2 rounded border border-border-thin/40">
                            {terminalLogs.map((log, idx) => (
                                <p key={idx} className={log.startsWith('✓') ? 'text-success' : log.startsWith('⟳') ? 'text-warning' : 'text-text-main'}>
                                    {log}
                                </p>
                            ))}
                            {logRunning && (
                                <div className="text-brand flex items-center gap-1.5 mt-0.5">
                                    <Loader2 size={8} className="animate-spin" />
                                    <span>Ejecutando proceso...</span>
                                </div>
                            )}
                            {!logRunning && (
                                <p className="text-text-dim mt-0.5">
                                    guest@diitra:~$ <span className="w-1 h-3 bg-brand inline-block animate-pulse align-middle" />
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">Acreditación & Reportes</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Automatización de la recopilación de evidencias. Dashboard con cumplimiento CACES en tiempo real.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Modulos;
