import React, { useState, useEffect, useRef } from 'react';
import { 
    FileSignature, 
    Clock, 
    Cpu, 
    ShieldCheck, 
    Check, 
    Terminal, 
    Loader2, 
    X, 
    Plus
} from 'lucide-react';

const Modulos: React.FC = () => {
    // Estado del selector de módulos interactivo (estilo Apple)
    // null representa la vista de "Dashboard General" de la laptop
    const [activeModule, setActiveModule] = useState<number | null>(null);
    const [showDetail, setShowDetail] = useState<boolean>(false);
    const [transitioning, setTransitioning] = useState<boolean>(false);

    const modulesList = [
        {
            id: 1,
            title: "Postulación",
            subtitle: "Postulación & Peer Review",
            icon: FileSignature,
            desc: "Optimiza la etapa inicial de investigación académica. Diseña presupuestos dinámicos desglosados en equipos, materiales y vinculación, y gestiona la asignación inteligente de pares evaluadores mediante un riguroso protocolo de doble ciego."
        },
        {
            id: 2,
            title: "Seguimiento",
            subtitle: "Seguimiento & Distributivo",
            icon: Clock,
            desc: "Lleva el control exacto del avance de tus proyectos. Registra los hitos y evidencias en tiempo real con una barra de progreso interactiva para el seguimiento docente y la validación automatizada de horas de investigación."
        },
        {
            id: 3,
            title: "SENADI",
            subtitle: "SENADI & Repositorio",
            icon: Cpu,
            desc: "Gestiona los derechos de autor y la propiedad intelectual de tus desarrollos científicos de manera directa. Descarga certificados oficiales del SENADI y empaqueta el código fuente con verificación de estado instantánea."
        },
        {
            id: 4,
            title: "Acreditación",
            subtitle: "Acreditación & Reportes",
            icon: ShieldCheck,
            desc: "Prepara a tu institución para las auditorías externas. Conéctate automáticamente con la pasarela SIIES para sincronizar evidencias y audita el cumplimiento del indicador de investigación CACES desde una terminal interactiva."
        }
    ];

    // Lógica para cambiar de módulo con efecto de transición
    const handleModuleSelect = (id: number | null) => {
        setTransitioning(true);
        setTimeout(() => {
            setActiveModule(id);
            if (id !== null) {
                setShowDetail(true);
            } else {
                setShowDetail(false);
            }
            setTransitioning(false);
        }, 150);
    };

    const handleNextModule = () => {
        if (activeModule === null) {
            handleModuleSelect(1);
        } else {
            const next = activeModule === 4 ? 1 : activeModule + 1;
            handleModuleSelect(next);
        }
    };

    const handlePrevModule = () => {
        if (activeModule === null) {
            handleModuleSelect(4);
        } else {
            const prev = activeModule === 1 ? 4 : activeModule - 1;
            handleModuleSelect(prev);
        }
    };

    // ==========================================
    // LÓGICA DE NEGOCIO ORIGINAL DE LOS WIDGETS
    // ==========================================

    // Módulo 1: Presupuesto
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

    // Módulo 2: Hitos
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

    // Módulo 3: Descargas (SENADI)
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

    // Módulo 4: Terminal Logs (CACES)
    const [terminalLogs, setTerminalLogs] = useState<string[]>([
        'guest@diitra:~$ status',
        '✓ [14:02:15] Validando Distributivo de Investigadores...',
        '✓ [14:02:16] Evidencias compiladas de Proyectos (12/12)',
        '✓ [14:02:17] Sistema listo para auditoría CACES.'
    ]);
    const [logRunning, setLogRunning] = useState<boolean>(false);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [terminalLogs]);

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
        <section id="modulos" className="py-24 relative lg:-ml-24 lg:-mr-24 px-6 overflow-hidden">
            {/* Estilos Inline CSS para la Laptop Realista Matte Black de mayor tamaño */}
            <style>{`
                .laptop-container {
                    perspective: 1200px;
                    width: 100%;
                    max-width: 680px; /* Laptop más grande */
                    margin: 0 auto;
                }
                .laptop-lid {
                    background: #0a0a0a; /* Negro profundo mate */
                    border: 12px solid #0a0a0a;
                    border-bottom: 14px solid #0a0a0a;
                    border-radius: 18px 18px 0 0;
                    box-shadow: 
                        inset 0 1px 1px rgba(255, 255, 255, 0.08), 
                        inset 0 -1px 1px rgba(0, 0, 0, 0.9),
                        0 -4px 30px rgba(0, 0, 0, 0.6);
                    position: relative;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 2;
                }
                [data-theme="light"] .laptop-lid {
                    background: #121212; /* Sigue siendo negra mate */
                    border-color: #121212;
                    box-shadow: 
                        inset 0 1px 1px rgba(255, 255, 255, 0.1), 
                        inset 0 -1px 1px rgba(0, 0, 0, 0.85),
                        0 -4px 25px rgba(0, 0, 0, 0.45);
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
                        0 25px 50px rgba(0, 0, 0, 0.75), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.9);
                    position: relative;
                }
                [data-theme="light"] .laptop-base {
                    background: linear-gradient(to bottom, #2b2b2b 0%, #1c1c1c 25%, #141414 70%, #0d0d0d 100%);
                    box-shadow: 
                        0 20px 40px rgba(0, 0, 0, 0.4), 
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
                .laptop-shadow {
                    position: absolute;
                    bottom: -22px;
                    left: 5%;
                    width: 90%;
                    height: 24px;
                    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 75%);
                    z-index: 1;
                    pointer-events: none;
                }
                [data-theme="light"] .laptop-shadow {
                    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0) 75%);
                }
                .screen-transition {
                    animation: screenFlicker 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes screenFlicker {
                    0% { opacity: 0.65; filter: contrast(1.15) brightness(1.1); }
                    100% { opacity: 1; filter: contrast(1) brightness(1); }
                }
                .custom-blur-panel {
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                }
            `}</style>

            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header de la sección */}
                <div className="space-y-4">
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand font-semibold block">// AUTOMATIZACIÓN ACADÉMICA</span>
                    <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main">
                        Módulos de Automatización.
                    </h2>
                    <p className="text-text-dim text-sm max-w-xl leading-relaxed">
                        Explora a detalle cómo opera cada módulo de DIITRA para acelerar la investigación, el cumplimiento reglamentario y la interoperabilidad con entidades externas.
                    </p>
                </div>

                {/* Grid principal - Proporciones reajustadas para agrandar la laptop (4/8 en vez de 5/7) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
                    
                    {/* Columna Izquierda (col-span-4): Selector pastillas y Tooltip explicativo estilo Apple */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
                        
                        {/* Selector de pastillas/botones con scroll lateral en móvil y vertical en desktop */}
                        <div className="flex flex-row lg:flex-col flex-wrap lg:flex-nowrap gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
                            {modulesList.map((item) => {
                                const isSelected = activeModule === item.id;
                                const IconComponent = item.icon;
                                
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleModuleSelect(isSelected ? null : item.id)}
                                        className={`flex items-center gap-3.5 px-4.5 py-3 rounded-full border text-xs font-mono uppercase tracking-wider text-left transition-all duration-300 shrink-0 cursor-pointer ${
                                            isSelected 
                                            ? 'bg-text-main text-bg-deep border-text-main shadow-md font-bold'
                                            : 'bg-surface border-border-thin text-text-main hover:bg-surface-hover hover:border-border-hover'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                            isSelected 
                                            ? 'bg-bg-deep border-bg-deep text-text-main rotate-45' 
                                            : 'bg-bg-deep/50 border-border-thin text-text-dim'
                                        }`}>
                                            <Plus size={9} className="stroke-[2.5]" />
                                        </span>
                                        <IconComponent size={14} className="opacity-80" />
                                        <span>{item.title}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tooltip explicativo estilo Apple "Mírala en detalle" (Glassmorphism de alta gama) */}
                        <div className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            showDetail && activeModule !== null
                            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                            : 'opacity-0 translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden lg:h-auto lg:opacity-0'
                        }`}>
                            {activeModule !== null && (
                                <div className="custom-blur-panel bg-surface/85 dark:bg-black/75 border border-border-thin rounded-2xl p-6.5 shadow-2xl relative space-y-4.5 animate-scale-up">
                                    
                                    {/* Botón de cierre superior derecho del panel */}
                                    <button 
                                        onClick={() => handleModuleSelect(null)}
                                        className="absolute top-4 right-4 p-1.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-bg-deep/50 hover:bg-bg-deep transition-all cursor-pointer"
                                        title="Volver al Dashboard"
                                    >
                                        <X size={12} />
                                    </button>

                                    {/* Cabecera del Tooltip */}
                                    <div className="space-y-1 pr-6">
                                        <span className="text-[10px] font-mono font-semibold text-brand tracking-widest block uppercase">MÓDULO 0{activeModule} // AUTOMÁTICO</span>
                                        <h3 className="text-xl font-bold tracking-tight text-text-main">
                                            {modulesList[activeModule - 1].subtitle}
                                        </h3>
                                    </div>

                                    {/* Párrafo explicativo */}
                                    <p className="text-xs text-text-dim leading-relaxed font-sans font-medium">
                                        {modulesList[activeModule - 1].desc}
                                    </p>

                                </div>
                            )}
                        </div>

                    </div>

                    {/* Columna Derecha (col-span-8): Laptop de CSS interactiva de gran tamaño */}
                    <div className="lg:col-span-8 flex flex-col items-center justify-center relative">
                        
                        <div className="relative w-full flex flex-col items-center justify-center">
                            
                            {/* ÚNICO BOTÓN X flotante en la esquina superior derecha del contenedor de la laptop */}
                            {activeModule !== null && (
                                <button 
                                    onClick={() => handleModuleSelect(null)}
                                    className="absolute -top-6 right-0 lg:-right-4 z-30 w-8 h-8 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface/95 dark:bg-black/90 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center"
                                    title="Cerrar detalle"
                                >
                                    <X size={14} className="stroke-[2.5]" />
                                </button>
                            )}

                            {/* TAPA/PANTALLA DE LA LAPTOP */}
                            <div className="laptop-lid w-full">
                                <div className="laptop-screen-glass">
                                    
                                    {/* Cámara Web de la laptop */}
                                    <div className="laptop-camera" />
                                    
                                    {/* Reflejo/Brillo sobre el cristal */}
                                    <div className="laptop-screen-glare" />

                                    {/* PANTALLA ACTIVA */}
                                    <div className={`laptop-display p-4 flex flex-col justify-between select-none ${transitioning ? 'opacity-40' : 'screen-transition'}`}>
                                        
                                        {/* PANTALLA: WIDGETS INTERACTIVOS */}

                                        {/* 0. VISTA GENERAL (Dashboard consolidado de 4 cuadrantes) */}
                                        {activeModule === null && (
                                            <div className="h-full flex flex-col justify-between">
                                                
                                                {/* Cabecera del Dashboard */}
                                                <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 mb-2 text-[9px] font-mono text-text-dim">
                                                    <span className="flex items-center gap-1.5 font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                        DIITRA AUTOMATION HUB
                                                    </span>
                                                    <span>MONITOR CENTRAL</span>
                                                </div>

                                                {/* Rejilla 2x2 interactiva */}
                                                <div className="grid grid-cols-2 gap-3.5 flex-1 pt-1 text-left">
                                                    
                                                    {/* Cuadrante 1: Postulación */}
                                                    <button 
                                                        onClick={() => handleModuleSelect(1)}
                                                        className="p-3.5 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-brand/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
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
                                                        onClick={() => handleModuleSelect(2)}
                                                        className="p-3.5 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-success/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
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
                                                        onClick={() => handleModuleSelect(3)}
                                                        className="p-3.5 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-warning/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
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
                                                        onClick={() => handleModuleSelect(4)}
                                                        className="p-3.5 rounded border border-border-thin bg-surface/30 hover:bg-surface/90 hover:border-info/40 transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[7.5px] font-mono text-text-dim">04 // ACREDITACIÓN</span>
                                                            <ShieldCheck size={11} className="text-text-dim group-hover:text-info transition-colors" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[9px] text-text-dim block leading-tight font-sans">Auditoría CACES</span>
                                                            <span className="text-[8.5px] font-mono font-semibold text-success animate-pulse truncate block">✓ APTO ACREDITAR</span>
                                                        </div>
                                                        <div className="text-[7px] font-mono text-text-dim truncate">
                                                            guest@diitra:~$ status
                                                        </div>
                                                    </button>

                                                </div>

                                                {/* Footer de bienvenida general */}
                                                <div className="text-center text-[8.5px] font-mono text-text-dim pt-2 border-t border-border-thin/30">
                                                    SELECCIONA UN CUADRANTE O BOTÓN PARA PROFUNDIZAR
                                                </div>

                                            </div>
                                        )}

                                        {/* 1. MÓDULO ACTIVO: POSTULACIÓN (Presupuesto) */}
                                        {activeModule === 1 && (
                                            <div className="h-full flex flex-col justify-between animate-fade-in">
                                                
                                                {/* Header del widget */}
                                                <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[9px] font-mono text-text-dim">
                                                    <span className="font-semibold text-text-main">// PRESUPUESTO MODULAR</span>
                                                    <span>MOD-01</span>
                                                </div>

                                                {/* Contenido principal del Presupuesto */}
                                                <div className="flex-1 flex flex-col justify-center gap-3.5 my-2.5">
                                                    
                                                    {/* Encabezado presupuestario */}
                                                    <div className="flex justify-between items-center bg-surface/30 p-2.5 rounded border border-border-thin/40">
                                                        <span className="text-[9px] font-mono text-text-dim uppercase">// PRESUPUESTO PROYECTO</span>
                                                        <span className="text-brand font-bold text-xs font-mono bg-brand-subtle px-2 py-0.5 rounded border border-brand/20">
                                                            Total: ${currentBudgetTotal.toLocaleString()}.00
                                                        </span>
                                                    </div>

                                                    {/* Rejilla de tarjetas de presupuesto */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(['equipos', 'materiales', 'vinculacion'] as const).map((key) => {
                                                            const active = budgetToggles[key];
                                                            const value = budgetValues[key];
                                                            const label = key === 'equipos' ? '01/ EQUIPOS' : key === 'materiales' ? '02/ MAT.' : '03/ VINC.';
                                                            
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => toggleBudget(key)}
                                                                    className={`p-2 border rounded text-left transition-all duration-300 cursor-pointer ${
                                                                        active 
                                                                        ? 'bg-bg-deep border-brand/50 shadow-sm' 
                                                                        : 'bg-surface/10 border-border-thin opacity-35 hover:opacity-60'
                                                                    }`}
                                                                >
                                                                    <p className="text-[7.5px] text-text-dim font-bold font-mono">{label}</p>
                                                                    <p className="text-[11px] font-bold text-text-main mt-0.5 font-mono">${value.toLocaleString()}</p>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Barra de progreso de ejecución */}
                                                    <div className="space-y-1 bg-surface/30 p-2.5 rounded border border-border-thin/30">
                                                        <div className="flex justify-between text-[8px] font-mono text-text-dim">
                                                            <span>Límite Institucional Ejecutado</span>
                                                            <span className="font-bold text-text-main">{budgetPct}%</span>
                                                        </div>
                                                        <div className="w-full bg-border-thin h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-brand transition-all duration-500 ease-out" 
                                                                style={{ width: `${budgetPct}%` }} 
                                                            />
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Nota al pie interactiva */}
                                                <div className="text-[7.5px] font-mono text-text-dim text-center leading-none">
                                                    HAZ CLIC EN LAS TARJETAS PARA SIMULAR EL FLUJO DE CAJA
                                                </div>

                                            </div>
                                        )}

                                        {/* 2. MÓDULO ACTIVO: SEGUIMIENTO (Hitos) */}
                                        {activeModule === 2 && (
                                            <div className="h-full flex flex-col justify-between animate-fade-in">
                                                
                                                {/* Header del widget */}
                                                <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[9px] font-mono text-text-dim">
                                                    <span className="font-semibold text-text-main">// MONITOREO Y HITOS</span>
                                                    <span>MOD-02</span>
                                                </div>

                                                {/* Contenido principal de hitos */}
                                                <div className="flex-1 flex flex-col justify-center gap-3 my-2">
                                                    
                                                    {/* Lista de hitos interactivos */}
                                                    <div className="space-y-1.5">
                                                        {hitos.map((h) => (
                                                            <button 
                                                                key={h.id} 
                                                                onClick={() => toggleHito(h.id)} 
                                                                className={`flex items-center justify-between p-2 border border-border-thin rounded bg-bg-deep/45 w-full text-left transition-all duration-200 hover:border-success/30 cursor-pointer`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-300 ${
                                                                        h.completed 
                                                                        ? 'bg-success/15 border-success text-success' 
                                                                        : 'bg-surface/20 border-border-thin text-transparent'
                                                                    }`}>
                                                                        <Check size={8} strokeWidth={3} />
                                                                    </span>
                                                                    <span className={`text-[10px] font-semibold font-sans ${h.completed ? 'text-success' : 'text-text-dim'}`}>
                                                                        {h.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[7.5px] font-mono text-text-dim">
                                                                    {h.completed ? 'COMPLETADO' : 'PENDIENTE'}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Mapa de avance de docente (MC) interactivo */}
                                                    <div className="bg-surface/30 p-2.5 rounded border border-border-thin/30 space-y-1">
                                                        <span className="text-[7px] text-text-dim block uppercase font-mono tracking-wider">
                                                            // AVANCE DOCENTE EN VIVO: J. DOICELA
                                                        </span>
                                                        <div className="relative h-4.5 mt-1 flex items-center">
                                                            <div className="absolute w-full bg-border-thin h-1 rounded-full" />
                                                            <div 
                                                                className="absolute h-1 bg-success rounded-full transition-all duration-500 ease-out" 
                                                                style={{ width: `${(hitosCompletedCount / hitosTotalCount) * 100}%` }}
                                                            />
                                                            <div 
                                                                className="absolute w-4.5 h-4.5 rounded-full bg-brand text-white border-2 border-surface flex items-center justify-center text-[6px] font-sans font-bold transition-all duration-500 ease-out shadow-md"
                                                                style={{ left: `calc(${(hitosCompletedCount / hitosTotalCount) * 100}% - 9px)` }}
                                                            >
                                                                JD
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Nota al pie */}
                                                <div className="text-[7.5px] font-mono text-text-dim text-center leading-none">
                                                    HAZ CLIC EN LOS HITOS PARA ALTERNAR EL ESTADO DE REVISIÓN
                                                </div>

                                            </div>
                                        )}

                                        {/* 3. MÓDULO ACTIVO: SENADI */}
                                        {activeModule === 3 && (
                                            <div className="h-full flex flex-col justify-between animate-fade-in">
                                                
                                                {/* Header del widget */}
                                                <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[9px] font-mono text-text-dim">
                                                    <span className="font-semibold text-text-main">// PROPIEDAD INTELECTUAL</span>
                                                    <span>MOD-03</span>
                                                </div>

                                                {/* Descargas interactivas */}
                                                <div className="flex-1 flex flex-col justify-center gap-3.5 my-3">
                                                    
                                                    {Object.keys(downloadStates).map((fileName) => {
                                                        const state = downloadStates[fileName];
                                                        return (
                                                            <button 
                                                                key={fileName} 
                                                                onClick={() => triggerDownload(fileName)} 
                                                                className="p-2.5 border border-border-thin rounded bg-bg-deep flex flex-col gap-1 text-left w-full transition-all duration-300 hover:border-brand/40 cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-center font-sans">
                                                                    <span className="text-[10px] text-text-main font-bold font-mono">{fileName}</span>
                                                                    <span className="text-brand text-[8px] font-bold font-mono bg-brand-subtle px-2 py-0.5 rounded border border-brand/20">
                                                                        {state === 'idle' ? 'DESCARGAR' : state === 'success' ? 'COMPLETO ✓' : `DESCARGANDO: ${state}%`}
                                                                    </span>
                                                                </div>
                                                                {typeof state === 'number' && (
                                                                    <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden mt-1.5">
                                                                        <div className="h-full bg-brand transition-all duration-200" style={{ width: `${state}%` }} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                </div>

                                                {/* Nota al pie */}
                                                <div className="text-[7.5px] font-mono text-text-dim text-center leading-none">
                                                    HAZ CLIC EN LOS ARCHIVOS PARA VERIFICAR FIRMAS DIGITALES
                                                </div>

                                            </div>
                                        )}

                                        {/* 4. MÓDULO ACTIVO: ACREDITACIÓN (Terminal) */}
                                        {activeModule === 4 && (
                                            <div className="h-full flex flex-col justify-between animate-fade-in">
                                                
                                                {/* Header del widget */}
                                                <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[9px] font-mono text-text-dim">
                                                    <span className="font-semibold text-text-main">// CONSOLA DE AUDITORÍA</span>
                                                    <span>MOD-04</span>
                                                </div>

                                                {/* Consola con logs e interactividad */}
                                                <div className="flex-1 flex flex-col justify-between my-2 text-[8px] font-mono text-text-dim bg-bg-deep/70 p-2.5 rounded border border-border-thin/40 gap-2">
                                                    
                                                    {/* Caja de scroll de Logs */}
                                                    <div className="overflow-y-auto max-h-[85px] space-y-0.5 scrollbar-none pr-1">
                                                        {terminalLogs.map((log, idx) => (
                                                            <p 
                                                                key={idx} 
                                                                className={
                                                                    log.startsWith('✓') 
                                                                    ? 'text-success' 
                                                                    : log.startsWith('⟳') 
                                                                    ? 'text-warning' 
                                                                    : 'text-text-main'
                                                                }
                                                            >
                                                                {log}
                                                            </p>
                                                        ))}
                                                        {logRunning && (
                                                            <div className="text-brand flex items-center gap-1 mt-0.5">
                                                                <Loader2 size={8} className="animate-spin" />
                                                                <span>Ejecutando proceso...</span>
                                                            </div>
                                                        )}
                                                        {!logRunning && (
                                                            <p className="text-text-dim mt-0.5">
                                                                guest@diitra:~$ <span className="w-1.5 h-3 bg-brand inline-block animate-pulse align-middle" />
                                                            </p>
                                                        )}
                                                        <div ref={terminalEndRef} />
                                                    </div>

                                                    {/* Botonera de comandos */}
                                                    <div className="flex gap-1.5 font-sans justify-end pt-1.5 border-t border-border-thin/20">
                                                        <button 
                                                            onClick={() => runCommand('sync')} 
                                                            disabled={logRunning} 
                                                            className="px-2 py-1 bg-brand text-white rounded font-bold font-mono text-[7.5px] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                                        >
                                                            SYNC SIIES
                                                        </button>
                                                        <button 
                                                            onClick={() => runCommand('audit')} 
                                                            disabled={logRunning} 
                                                            className="px-2 py-1 bg-success text-white rounded font-bold font-mono text-[7.5px] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                                        >
                                                            AUDITAR
                                                        </button>
                                                        <button 
                                                            onClick={() => runCommand('clear')} 
                                                            disabled={logRunning} 
                                                            className="px-2 py-1 border border-border-thin text-text-dim rounded font-bold font-mono text-[7.5px] hover:text-text-main cursor-pointer"
                                                        >
                                                            CLEAR
                                                        </button>
                                                    </div>

                                                </div>

                                                {/* Nota al pie */}
                                                <div className="text-[7.5px] font-mono text-text-dim text-center leading-none">
                                                    EJECUTA ACCIONES DE CONSOLA PARA CONTRAPARTES EXTERNAS
                                                </div>

                                            </div>
                                        )}

                                    </div>

                                </div>
                            </div>

                            {/* CUERPO/BASE DE LA LAPTOP */}
                            <div className="laptop-base-wrapper">
                                <div className="laptop-base">
                                    <div className="laptop-notch" />
                                </div>
                                <div className="laptop-shadow" />
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
};

export default Modulos;
