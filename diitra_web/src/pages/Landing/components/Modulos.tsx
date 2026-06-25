import React, { useState } from 'react';
import { FileSignature, Clock, Cpu, ShieldCheck, Check, Play } from 'lucide-react';

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
        }, 300);
    };

    // Card D: Terminal Logs
    const initialLogs = [
        '✓ [14:02:15] Validando Distributivo de Investigadores...',
        '✓ [14:02:16] Evidencias compiladas de Proyectos (12/12)',
        '✓ [14:02:17] Archivo JSON generado y enviado con éxito.'
    ];
    const [terminalLogs, setTerminalLogs] = useState<string[]>(initialLogs);
    const [logRunning, setLogRunning] = useState<boolean>(false);

    const runLogSimulation = () => {
        if (logRunning) return;
        setTerminalLogs([]);
        setLogRunning(true);

        const newLogs = [
            '⟳ [Conectando] Estableciendo canal seguro con SIIES...',
            '✓ [Conectado] Autenticación de firma digital exitosa.',
            '⟳ [Procesando] Empaquetando actas de aprobación...',
            '✓ [Procesado] Evidencias de hito cargadas (48 archivos).',
            '✓ [Finalizado] Sincronización completada. SIIES ID: #8294'
        ];

        let currentIdx = 0;
        
        const timer = setInterval(() => {
            if (currentIdx < newLogs.length) {
                setTerminalLogs(prev => [...prev, newLogs[currentIdx]]);
                currentIdx++;
            } else {
                clearInterval(timer);
                setLogRunning(false);
            }
        }, 600);
    };

    return (
        <section id="modulos" className="py-20 lg:-ml-24 lg:-mr-24 space-y-16">
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                Módulos de Automatización.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Fase_Convocatoria</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6">
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span>// CONFIGURAR PRESUPUESTO</span>
                            <span className="text-brand font-bold font-sans text-[10px]">Total: ${currentBudgetTotal.toLocaleString()}.00</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => toggleBudget('equipos')} className={`p-2 border rounded text-left transition-all cursor-pointer ${budgetToggles.equipos ? 'bg-bg-deep border-brand/40' : 'bg-surface/10 border-border-thin opacity-40'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">01/ EQUIPOS</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$2,100.00</p>
                            </button>
                            <button onClick={() => toggleBudget('materiales')} className={`p-2 border rounded text-left transition-all cursor-pointer ${budgetToggles.materiales ? 'bg-bg-deep border-brand/40' : 'bg-surface/10 border-border-thin opacity-40'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">02/ MATERIALES</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$900.00</p>
                            </button>
                            <button onClick={() => toggleBudget('vinculacion')} className={`p-2 border rounded text-left transition-all cursor-pointer ${budgetToggles.vinculacion ? 'bg-bg-deep border-brand/40' : 'bg-surface/10 border-border-thin opacity-40'}`}>
                                <p className="text-[7px] text-text-dim font-semibold font-mono">03/ VINCULACIÓN</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$1,500.00</p>
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[7px]"><span>Ejecución del límite</span><span>{budgetPct}%</span></div>
                            <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden"><div className="h-full bg-brand transition-all duration-300" style={{ width: `${budgetPct}%` }} /></div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">Postulación & Peer Review</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Formularios simplificados con Gantt y presupuestos integrados. Asignación automatizada de revisores doble ciego.</p>
                    </div>
                </div>

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
                        <div className="space-y-2 flex flex-col justify-center min-h-[70px]">
                            {hitos.map((h) => (
                                <button key={h.id} onClick={() => toggleHito(h.id)} className={`flex items-center gap-2 font-sans w-full text-left transition-all ${h.completed ? 'text-success' : 'text-text-dim'}`}>
                                    <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${h.completed ? 'bg-success/15 border-success' : 'bg-surface/20 border-border-thin'}`}>
                                        {h.completed && <Check size={8} strokeWidth={3} />}
                                    </span>
                                    <span className="font-semibold text-[10px]">{h.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">Seguimiento & Distributivo</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Verificación mensual de horas de investigación mediante carga de evidencias de hito.</p>
                    </div>
                </div>

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
                                <button key={fileName} onClick={() => triggerDownload(fileName)} className="p-2 border border-border-thin rounded bg-bg-deep flex flex-col gap-1 text-left w-full transition-all">
                                    <div className="flex justify-between items-center font-sans">
                                        <span className="text-[10px] text-text-main font-medium">{fileName}</span>
                                        <span className="text-brand text-[9px] font-bold font-mono">{state === 'idle' ? 'DESCARGAR' : state === 'success' ? 'COMPLETO ✓' : `${state}%`}</span>
                                    </div>
                                    {typeof state === 'number' && <div className="w-full bg-border-thin h-1 rounded-full"><div className="h-full bg-brand transition-all" style={{ width: `${state}%` }} /></div>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">SENADI & Repositorio</h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">Gestión del registro de derechos de autor y propiedad intelectual.</p>
                    </div>
                </div>

                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative select-none">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <ShieldCheck size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Evaluación_Externa</span>
                    </div>

                    <div className="border border-border-thin rounded bg-surface/50 p-4 font-mono text-[9px] text-text-dim space-y-3 mt-6">
                        <div className="flex justify-between items-center border-b border-border-thin pb-2">
                            <span>// LOG DE EXPORTACIÓN SIIES</span>
                            <button onClick={runLogSimulation} disabled={logRunning} className={`px-2 py-0.5 border rounded flex items-center gap-1 font-sans text-[8px] uppercase ${logRunning ? 'bg-surface border-border-thin' : 'bg-text-main text-bg-deep'}`}>
                                <Play size={8} fill="currentColor" /> {logRunning ? 'CORRIENDO...' : 'EJECUTAR'}
                            </button>
                        </div>
                        <div className="space-y-1 text-[8px] font-sans min-h-[45px] flex flex-col justify-end">
                            {terminalLogs.map((log, idx) => <p key={idx} className="text-text-main">{log}</p>)}
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
