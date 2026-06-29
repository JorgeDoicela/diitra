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
    Plus,
    ChevronUp,
    ChevronDown,
    Key,
    RefreshCw
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
        },
        {
            id: 5,
            title: "Firma Electrónica",
            subtitle: "Firma Electrónica IST",
            icon: Key,
            desc: "Integración nativa con archivos .p12. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa, cumpliendo de forma estricta con la normativa vigente de firma electrónica en el Ecuador."
        }
    ];

    // Lógica para cambiar de módulo de forma inmediata y fluida
    const handleModuleSelect = (id: number | null) => {
        setActiveModule(id);
        if (id !== null) {
            setShowDetail(true);
        } else {
            setShowDetail(false);
        }
    };

    const handleNextModule = () => {
        if (activeModule === null) {
            handleModuleSelect(1);
        } else {
            const next = activeModule === 5 ? 1 : activeModule + 1;
            handleModuleSelect(next);
        }
    };

    const handlePrevModule = () => {
        if (activeModule === null) {
            handleModuleSelect(5);
        } else {
            const prev = activeModule === 1 ? 5 : activeModule - 1;
            handleModuleSelect(prev);
        }
    };

    // Estados para la firma electrónica interactiva
    const [signState, setSignState] = useState<'idle' | 'scanning' | 'signed'>('idle');
    const [signProgress, setSignProgress] = useState<number>(0);
    const [signTimestamp, setSignTimestamp] = useState<string>('');

    useEffect(() => {
        let interval: any;
        if (signState === 'scanning') {
            setSignProgress(0);
            interval = setInterval(() => {
                setSignProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        const now = new Date();
                        setSignTimestamp(now.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));
                        setSignState('signed');
                        return 100;
                    }
                    return prev + 5;
                });
            }, 80);
        }
        return () => clearInterval(interval);
    }, [signState]);

    const startSigning = () => {
        if (signState !== 'idle') return;
        setSignState('scanning');
    };

    const resetSignature = () => {
        setSignState('idle');
        setSignProgress(0);
    };

    // Estadísticas del sistema fluctuantes en tiempo real para el Módulo 4
    const [systemStats, setSystemStats] = useState({ cpu: 14, ram: 42, net: 5 });

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemStats({
                cpu: Math.floor(Math.random() * (28 - 8) + 8),
                ram: Math.floor(Math.random() * (46 - 40) + 40),
                net: Math.floor(Math.random() * (12 - 3) + 3)
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Commits del Repositorio simulados para el Módulo 3
    const [commits, setCommits] = useState([
        { hash: 'e8a3d9f', msg: 'feat: integracion senadi api', time: 'Hace 2 min' },
        { hash: '4f1a2c9', msg: 'refactor: validacion p12', time: 'Hace 12 min' },
        { hash: '9b8c2d1', msg: 'init: esqueleto del proyecto', time: 'Hace 1 hora' }
    ]);

    const handlePushCommit = () => {
        const msgs = [
            'fix: corregido buffer de firma criptografica',
            'docs: actualizado manual de indicadores CACES',
            'style: mejoras visuales en panel de monitoreo',
            'perf: optimizada pasarela de sincronizacion SIIES'
        ];
        const newMsg = msgs[Math.floor(Math.random() * msgs.length)];
        const newHash = Math.random().toString(36).substring(2, 9);
        setCommits(prev => [
            { hash: newHash, msg: newMsg, time: 'Ahora mismo' },
            ...prev.slice(0, 2)
        ]);
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
        '[OK] [14:02:15] Validando Distributivo de Investigadores...',
        '[OK] [14:02:16] Evidencias compiladas de Proyectos (12/12)',
        '[OK] [14:02:17] Sistema listo para auditoría CACES.'
    ]);
    const [logRunning, setLogRunning] = useState<boolean>(false);
    const terminalContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal local sin mover la pantalla global
    useEffect(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
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
                '[RUN] Conectando con pasarela SIIES mediante WS-Security...',
                '[OK] Autenticación de certificado digital firmaEC completada.',
                '[RUN] Transmitiendo lote de evidencias académicas (12 proyectos registrados)...',
                '[OK] Repositorio DSpace institucional sincronizado con éxito.',
                '[OK] Carga finalizada con éxito. Código de respuesta: 200 (OK).'
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
                '[RUN] Iniciando motor de auditoría interna de acreditación...',
                '[RUN] Evaluando Criterio C1: Plan de Desarrollo Científico (WS-CACES)...',
                '[OK] Indicador C1: CUMPLE (Publicaciones indexadas Scopus/SJR al 100%)',
                '[RUN] Evaluando Criterio C2: Distributivo Docente de I+D...',
                '[OK] Indicador C2: CUMPLE (Horas sincronizadas para 24 docentes de planta)',
                '[OK] Auditoría local finalizada: DIITRA APTO PARA ACREDITACIÓN.'
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
        <section id="modulos" className="py-24 relative lg:-ml-24 lg:-mr-24 px-6 overflow-hidden space-y-16">
            {/* Estilos Inline CSS para la Laptop Realista Matte Black de mayor tamaño */}
            <style>{`
                .laptop-container {
                    perspective: 1200px;
                    width: 100%;
                    max-width: 680px; /* Laptop más grande */
                    margin: 0 auto;
                    overflow: visible;
                    transition: transform 0.3s ease;
                }
                @media (min-width: 1024px) {
                    .laptop-container {
                        transform: translateX(-24px); /* Desplazar levemente a la izquierda */
                    }
                }
                .laptop-lid {
                    background: #0a0a0a; /* Negro profundo mate */
                    border: 12px solid #0a0a0a;
                    border-bottom: 2px solid #0a0a0a; /* Muy delgado para que la pantalla baje al máximo */
                    border-radius: 18px 18px 0 0;
                    box-shadow: 
                        inset 0 1px 1px rgba(255, 255, 255, 0.08), 
                        inset 0 -1px 1px rgba(0, 0, 0, 0.9);
                    position: relative;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 2;
                }
                [data-theme="light"] .laptop-lid {
                    background: #121212; /* Sigue siendo negra mate */
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
                .laptop-shadow {
                    display: none;
                }
                [data-theme="light"] .laptop-shadow {
                    display: none;
                }
                .screen-transition {
                    animation: screenFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes screenFadeIn {
                    from {
                        opacity: 0.9;
                        transform: scale(0.99);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .custom-blur-panel {
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                }
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                }
                .animate-scan-line {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #0070f3;
                    box-shadow: 0 0 10px #0070f3, 0 0 4px #0070f3;
                    animation: scanLine 2s linear infinite;
                }
            `}</style>

            {/* Header de la sección */}
            <div className="space-y-4">
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
                                    className={`flex items-center gap-3.5 px-4.5 py-3 rounded-full border text-xs font-mono uppercase tracking-wider text-left transition-all duration-300 shrink-0 cursor-pointer ${isSelected
                                            ? 'bg-text-main text-bg-deep border-text-main font-bold'
                                            : 'bg-surface border-border-thin text-text-main hover:bg-surface-hover hover:border-border-hover'
                                        }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 ${isSelected
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
                    <div className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetail && activeModule !== null
                            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                            : 'opacity-0 translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden lg:h-auto lg:opacity-0'
                        }`}>
                        {activeModule !== null && (
                            <div className="custom-blur-panel bg-surface/85 dark:bg-black/75 border border-border-thin rounded-2xl p-6.5 relative space-y-4.5 animate-scale-up">

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
                <div className="lg:col-span-8 flex flex-col items-center justify-center relative overflow-visible">

                    <div className="relative w-full flex flex-col items-center justify-center overflow-visible">

                        {/* ÚNICO BOTÓN X flotante en la esquina superior derecha del contenedor de la laptop */}
                        {activeModule !== null && (
                            <button
                                onClick={() => handleModuleSelect(null)}
                                className="absolute -top-6 right-0 lg:-right-4 z-30 w-8 h-8 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface/95 dark:bg-black/90 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                                title="Cerrar detalle"
                            >
                                <X size={14} className="stroke-[2.5]" />
                            </button>
                        )}

                        {/* Botonera de navegación vertical (Subir / Bajar módulo) */}
                        {activeModule !== null && (
                            <div className="absolute -left-6 lg:-left-12 top-[74%] -translate-y-1/2 z-30 flex flex-col gap-2">
                                <button
                                    onClick={handlePrevModule}
                                    className="w-8.5 h-8.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface dark:bg-black/95 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:border-border-hover"
                                    title="Módulo Anterior"
                                >
                                    <ChevronUp size={14} className="stroke-[2.5]" />
                                </button>
                                <button
                                    onClick={handleNextModule}
                                    className="w-8.5 h-8.5 rounded-full border border-border-thin text-text-dim hover:text-text-main bg-surface dark:bg-black/95 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md hover:border-border-hover"
                                    title="Módulo Siguiente"
                                >
                                    <ChevronDown size={14} className="stroke-[2.5]" />
                                </button>
                            </div>
                        )}

                        {/* TAPA/PANTALLA DE LA LAPTOP */}
                        <div className="laptop-lid w-full">
                            <div className="laptop-screen-glass">

                                {/* Cámara Web de la laptop */}
                                <div className="laptop-camera" />

                                {/* Reflejo/Brillo sobre el cristal */}
                                <div className="laptop-screen-glare" />

                                {/* PANTALLA ACTIVA */}
                                <div className={`laptop-display p-4 flex flex-col justify-between select-none screen-transition`} key={activeModule ?? 'dashboard'}>

                                    {/* PANTALLA: WIDGETS INTERACTIVOS */}

                                    {/* 0. VISTA GENERAL (Dashboard consolidado de 4 cuadrantes) */}
                                    {activeModule === null && (
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
                                                    onClick={() => handleModuleSelect(1)}
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
                                                    onClick={() => handleModuleSelect(2)}
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
                                                    onClick={() => handleModuleSelect(3)}
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
                                                    onClick={() => handleModuleSelect(4)}
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
                                                    onClick={() => handleModuleSelect(5)}
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
                                    )}

                                    {/* 1. MÓDULO ACTIVO: POSTULACIÓN (Presupuesto) */}
                                    {activeModule === 1 && (
                                        <div className="h-full flex flex-col gap-3">

                                            {/* Header del widget */}
                                            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                                                <span className="font-semibold text-text-main">// PRESUPUESTO MODULAR</span>
                                                <span>MOD-01</span>
                                            </div>

                                            {/* Contenido principal del Presupuesto */}
                                            <div className="flex-1 flex flex-col justify-center gap-3">

                                                {/* Gráfico Financiero de Barras Interactivo */}
                                                <div className="grid grid-cols-12 gap-3 bg-surface/20 p-2.5 rounded border border-border-thin/30 text-left font-mono">
                                                    
                                                    {/* Desglose visual de columnas */}
                                                    <div className="col-span-6 flex items-end justify-around h-16 border-b border-border-thin/40 pb-1">
                                                        <div className="flex flex-col items-center w-8">
                                                            <div className="rounded-t transition-all duration-500 ease-out shadow-sm" style={{ width: '18px', height: budgetToggles.equipos ? '46px' : '0px', backgroundColor: '#0070f3' }} />
                                                            <span className="text-[7px] text-text-dim mt-1">EQ</span>
                                                        </div>
                                                        <div className="flex flex-col items-center w-8">
                                                            <div className="rounded-t transition-all duration-500 ease-out shadow-sm" style={{ width: '18px', height: budgetToggles.materiales ? '22px' : '0px', backgroundColor: '#10b981' }} />
                                                            <span className="text-[7px] text-text-dim mt-1">MAT</span>
                                                        </div>
                                                        <div className="flex flex-col items-center w-8">
                                                            <div className="rounded-t transition-all duration-500 ease-out shadow-sm" style={{ width: '18px', height: budgetToggles.vinculacion ? '34px' : '0px', backgroundColor: '#f59e0b' }} />
                                                            <span className="text-[7px] text-text-dim mt-1">VINC</span>
                                                        </div>
                                                    </div>

                                                    {/* Métricas dinámicas en vivo */}
                                                    <div className="col-span-6 flex flex-col justify-center text-[8.5px] border-l border-border-thin/20 pl-3 gap-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-text-dim">Disponible:</span>
                                                            <span className="text-text-main font-bold">$4,500.00</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-dim">Utilizado:</span>
                                                            <span className="text-brand font-bold">${currentBudgetTotal.toLocaleString()}.00</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-border-thin/10 pt-1">
                                                            <span className="text-text-dim">Restante:</span>
                                                            <span className={`${4500 - currentBudgetTotal > 1500 ? 'text-success' : 'text-warning'} font-bold`}>
                                                                ${(4500 - currentBudgetTotal).toLocaleString()}.00
                                                            </span>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Encabezado presupuestario */}
                                                <div className="flex justify-between items-center bg-surface/30 p-2.5 rounded border border-border-thin/40">
                                                    <span className="text-[9.5px] font-mono text-text-dim uppercase">// PRESUPUESTO PROYECTO</span>
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
                                                                className={`p-2 border rounded text-left transition-all duration-300 cursor-pointer ${active
                                                                        ? 'bg-bg-deep border-brand/50 shadow-sm'
                                                                        : 'bg-surface/10 border-border-thin opacity-35 hover:opacity-60'
                                                                    }`}
                                                            >
                                                                <p className="text-[8px] text-text-dim font-bold font-mono">{label}</p>
                                                                <p className="text-[11px] font-bold text-text-main mt-0.5 font-mono">${value.toLocaleString()}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Barra de progreso de ejecución y viabilidad */}
                                                <div className="space-y-1.5 bg-surface/30 p-2.5 rounded border border-border-thin/30 text-left font-mono">
                                                    <div className="flex justify-between text-[8.5px] text-text-dim">
                                                        <span>Límite Institucional Ejecutado</span>
                                                        <span className="font-bold text-text-main">{budgetPct}%</span>
                                                    </div>
                                                    <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-brand transition-all duration-500 ease-out" 
                                                            style={{ width: `${budgetPct}%` }} 
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[8px] pt-1.5 border-t border-border-thin/10">
                                                        <span>VIABILIDAD FINANCIERA:</span>
                                                        {currentBudgetTotal > 2500 ? (
                                                            <span className="text-warning font-bold">ALERTA DE COSTOS (REQUERIDO DECANO)</span>
                                                        ) : (
                                                            <span className="text-success font-bold">FONDOS APROBADOS (VIABLE)</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Leyenda removida */}

                                            </div>
                                        </div>
                                    )}

                                    {/* 2. MÓDULO ACTIVO: SEGUIMIENTO (Hitos) */}
                                    {activeModule === 2 && (
                                        <div className="h-full flex flex-col gap-3">

                                            {/* Header del widget */}
                                            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                                                <span className="font-semibold text-text-main">// MONITOREO Y HITOS</span>
                                                <span>MOD-02</span>
                                            </div>

                                            {/* Contenido principal de hitos */}
                                            <div className="flex-1 flex flex-col justify-center gap-2.5">

                                                {/* Panel de Auditoría y Progreso SVG en vivo */}
                                                <div className="grid grid-cols-12 gap-3 bg-surface/20 p-2.5 rounded border border-border-thin/30 text-left font-mono">
                                                    
                                                    {/* SVG Circular de Progreso */}
                                                    <div className="col-span-5 flex items-center justify-center relative">
                                                        <svg className="w-14 h-14 transform -rotate-90">
                                                            <circle cx="28" cy="28" r="22" className="stroke-border-thin" strokeWidth="2.5" fill="transparent" />
                                                            <circle cx="28" cy="28" r="22" className="stroke-success transition-all duration-500 ease-out" strokeWidth="2.5" fill="transparent"
                                                                strokeDasharray={2 * Math.PI * 22}
                                                                strokeDashoffset={2 * Math.PI * 22 - (2 * Math.PI * 22 * (hitosCompletedCount / hitosTotalCount))}
                                                            />
                                                        </svg>
                                                        <div className="absolute font-bold text-[10px] text-text-main flex flex-col items-center">
                                                            <span>{Math.round((hitosCompletedCount / hitosTotalCount) * 100)}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Feed de Auditoría de Carga */}
                                                    <div className="col-span-7 flex flex-col justify-center text-[8.5px] border-l border-border-thin/20 pl-3 gap-1 min-h-[56px]">
                                                        <div className="text-[7.5px] text-text-dim uppercase font-mono tracking-wider mb-0.5">// AUDITORÍA DOCENTE</div>
                                                        <div className="space-y-0.5">
                                                            <p className={`${hitos[0].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                                                {hitos[0].completed ? '[OK] Cargo marco_teorico.pdf' : '[-] Falta Marco Teórico'}
                                                            </p>
                                                            <p className={`${hitos[1].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                                                {hitos[1].completed ? '[OK] Subio algoritmo_desglose.py' : '[-] Falta Diseño Algoritmo'}
                                                            </p>
                                                            <p className={`${hitos[2].completed ? 'text-success' : 'text-text-dim/50'} transition-all`}>
                                                                {hitos[2].completed ? '[OK] Cargo evidencias_caces.docx' : '[-] Falta Evidencias y Pruebas'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* Lista de hitos interactivos */}
                                                <div className="space-y-1.5">
                                                    {hitos.map((h) => (
                                                        <button
                                                            key={h.id}
                                                            onClick={() => toggleHito(h.id)}
                                                            className={`flex items-center justify-between p-2 border border-border-thin rounded bg-bg-deep/45 w-full text-left transition-all duration-200 hover:border-success/30 cursor-pointer`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all duration-300 ${h.completed
                                                                        ? 'bg-success/15 border-success text-success'
                                                                        : 'bg-surface/20 border-border-thin text-transparent'
                                                                    }`}>
                                                                    <Check size={8} strokeWidth={3} />
                                                                </span>
                                                                <span className={`text-[10px] font-semibold font-sans ${h.completed ? 'text-success' : 'text-text-dim'}`}>
                                                                    {h.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-[8.5px] font-mono text-text-dim">
                                                                {h.completed ? 'COMPLETADO' : 'PENDIENTE'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Mapa de avance de docente (MC) interactivo */}
                                                <div className="bg-surface/30 p-2.5 rounded border border-border-thin/30 space-y-1 text-left font-mono">
                                                    <div className="flex justify-between items-center text-[8px] text-text-dim">
                                                        <span>// AVANCE DOCENTE EN VIVO: J. DOICELA</span>
                                                        {hitosCompletedCount === hitosTotalCount ? (
                                                            <span className="text-success font-bold font-sans text-[9.5px]">PROYECTO AL DÍA</span>
                                                        ) : (
                                                            <span className="text-warning font-bold font-sans text-[9.5px]">EN EJECUCIÓN</span>
                                                        )}
                                                    </div>
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
                                        </div>
                                    )}

                                    {/* 3. MÓDULO ACTIVO: SENADI */}
                                    {activeModule === 3 && (
                                        <div className="h-full flex flex-col gap-3">

                                            {/* Header del widget */}
                                            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                                                <span className="font-semibold text-text-main">// PROPIEDAD INTELECTUAL</span>
                                                <span>MOD-03</span>
                                            </div>

                                            {/* Descargas interactivas */}
                                            <div className="flex-1 flex flex-col justify-center gap-2.5">

                                                {/* Monitor de Commits Git de la Universidad Interactivo */}
                                                <div className="grid grid-cols-12 gap-3 bg-surface/20 p-2.5 rounded border border-border-thin/30 text-left font-mono">
                                                    
                                                    {/* Lista de commits */}
                                                    <div className="col-span-7 space-y-1">
                                                        <div className="text-[8px] text-text-dim uppercase font-mono tracking-wider font-bold">// COMMITS REPOSITORIO</div>
                                                        <div className="space-y-0.5 max-h-[48px] overflow-hidden">
                                                            {commits.map((c, idx) => (
                                                                <div key={c.hash + idx} className="flex justify-between items-center text-[8.5px] gap-1 animate-fade-in">
                                                                    <span className="text-brand font-bold">{c.hash}</span>
                                                                    <span className="text-text-main truncate max-w-[85px]">{c.msg}</span>
                                                                    <span className="text-[7px] text-text-dim whitespace-nowrap">{c.time}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Acción de Simular Commit / Push */}
                                                    <div className="col-span-5 flex flex-col items-center justify-center border-l border-border-thin/20 pl-3">
                                                        <button 
                                                            onClick={handlePushCommit}
                                                            className="w-full py-1.5 px-2 bg-text-main text-bg-deep rounded font-bold font-sans text-[8.5px] uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer text-center"
                                                        >
                                                            SIMULAR COMMIT
                                                        </button>
                                                        <span className="text-[7px] text-text-dim/80 mt-1 block uppercase font-mono text-center">Branch: main</span>
                                                    </div>

                                                </div>

                                                <div className="flex justify-between items-center text-[9px] font-mono text-text-dim border border-dashed border-border-thin bg-surface/20 p-2.5 rounded text-left">
                                                    <span>REGISTRO SENADI ACTIVO:</span>
                                                    <span className="text-success font-bold text-[9.5px]">REG-SENADI-2026-00459 (VIGENTE)</span>
                                                </div>

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
                                                                <span className="text-brand text-[8.5px] font-bold font-mono bg-brand-subtle px-2 py-0.5 rounded border border-brand/20">
                                                                    {state === 'idle' ? 'DESCARGAR' : state === 'success' ? 'COMPLETO' : `DESCARGANDO: ${state}%`}
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

                                        </div>
                                    )}

                                     {/* 4. MÓDULO ACTIVO: ACREDITACIÓN (Terminal) */}
                                    {activeModule === 4 && (
                                        <div className="h-full flex flex-col gap-3">

                                            {/* Header del widget */}
                                            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                                                <span className="font-semibold text-text-main">// CONSOLA DE AUDITORÍA</span>
                                                <span>MOD-04</span>
                                            </div>

                                            {/* Monitor de Recursos del Servidor en Vivo */}
                                            <div className="grid grid-cols-3 gap-2 bg-surface/20 p-2 rounded border border-border-thin/30 text-[8px] font-mono text-text-dim text-left">
                                                <div className="space-y-0.5">
                                                    <div className="flex justify-between">
                                                        <span>CPU LIMIT</span>
                                                        <span className="text-text-main font-bold">{systemStats.cpu}%</span>
                                                    </div>
                                                    <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand transition-all duration-500 ease-out" style={{ width: `${systemStats.cpu}%` }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5 border-l border-border-thin/20 pl-2">
                                                    <div className="flex justify-between">
                                                        <span>RAM LIMIT</span>
                                                        <span className="text-text-main font-bold">{systemStats.ram}%</span>
                                                    </div>
                                                    <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: `${systemStats.ram}%` }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5 border-l border-border-thin/20 pl-2">
                                                    <div className="flex justify-between">
                                                        <span>NET STATS</span>
                                                        <span className="text-text-main font-bold">{systemStats.net} MB/s</span>
                                                    </div>
                                                    <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-warning transition-all duration-500 ease-out" style={{ width: `${(systemStats.net / 12) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Consola con logs e interactividad */}
                                            <div className="flex-1 flex flex-col justify-between my-2 text-[8.5px] font-mono text-text-dim bg-bg-deep/70 p-2.5 rounded border border-border-thin/40 gap-2">

                                                {/* Caja de scroll de Logs */}
                                                <div ref={terminalContainerRef} className="overflow-y-auto flex-1 space-y-0.5 scrollbar-none pr-1 min-h-[140px] max-h-[220px]">
                                                    {terminalLogs.map((log, idx) => (
                                                        <p
                                                            key={idx}
                                                            className={
                                                                log && log.startsWith('[OK]')
                                                                    ? 'text-success'
                                                                    : log && log.startsWith('[RUN]')
                                                                         ? 'text-warning'
                                                                         : 'text-text-main'
                                                            }
                                                        >
                                                            {log || ''}
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
                                                </div>

                                                {/* Botonera de comandos */}
                                                <div className="flex gap-1.5 font-sans justify-end pt-1.5 border-t border-border-thin/20">
                                                    <button
                                                        onClick={() => runCommand('sync')}
                                                        disabled={logRunning}
                                                        className="px-2 py-1 bg-brand text-white rounded font-bold font-mono text-[8px] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        SYNC SIIES
                                                    </button>
                                                    <button
                                                        onClick={() => runCommand('audit')}
                                                        disabled={logRunning}
                                                        className="px-2 py-1 bg-success text-white rounded font-bold font-mono text-[8px] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        AUDITAR
                                                    </button>
                                                    <button
                                                        onClick={() => runCommand('clear')}
                                                        disabled={logRunning}
                                                        className="px-2 py-1 border border-border-thin text-text-dim rounded font-bold font-mono text-[8px] hover:text-text-main cursor-pointer"
                                                    >
                                                        CLEAR
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* 5. MÓDULO ACTIVO: FIRMA ELECTRÓNICA */}
                                    {activeModule === 5 && (
                                        <div className="h-full flex flex-col gap-3">
                                            
                                            {/* Header del widget */}
                                            <div className="flex justify-between items-center border-b border-border-thin/40 pb-2 text-[10px] font-mono text-text-dim">
                                                <span className="font-semibold text-text-main">// FIRMA DIGITAL ACTA</span>
                                                <span>MOD-05</span>
                                            </div>

                                            {/* Panel interactivo de firma */}
                                            <div className="flex-1 flex flex-col justify-center font-mono text-[9px]">
                                                
                                                {/* Folio del Documento Digital Interactivo */}
                                                <div className="bg-surface/30 p-2 rounded border border-border-thin/30 text-left font-mono mb-2">
                                                    <div className="flex justify-between items-center text-[8.5px] border-b border-border-thin/20 pb-1.5 mb-1">
                                                        <span className="font-bold text-text-main">DOCUMENTO: acta_aprobacion_id.pdf</span>
                                                        <span className={`text-[7.5px] px-1.5 py-0.5 rounded-full font-bold font-sans uppercase tracking-wider ${
                                                            signState === 'signed' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning animate-pulse'
                                                        }`}>
                                                            {signState === 'signed' ? 'FIRMADO' : 'PENDIENTE FIRMA'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 opacity-65 text-[7.5px] text-text-dim">
                                                        <p>PROYECTO: Automatización de Convocatorias Académicas (DIITRA-2026)</p>
                                                    </div>
                                                </div>

                                                {signState === 'idle' && (
                                                    <div className="space-y-3">
                                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono">// DISPOSITIVO DE FIRMA LISTO</p>
                                                        <div className="p-3.5 border border-dashed border-border-thin rounded flex items-center justify-center bg-bg-deep/30">
                                                            <span className="text-[9px] text-text-dim/80">Certificado digital p12 cargado.</span>
                                                        </div>
                                                        <button
                                                            onClick={startSigning}
                                                            className="w-full py-3 bg-text-main text-bg-deep rounded font-bold font-sans text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                                        >
                                                            <Key size={12} />
                                                            Firmar Acta de Aprobación
                                                        </button>
                                                    </div>
                                                )}

                                                {signState === 'scanning' && (
                                                    <div className="space-y-3">
                                                        <div className="relative h-20 border border-brand/20 bg-bg-deep rounded flex flex-col items-center justify-center overflow-hidden">
                                                            <div className="animate-scan-line" />
                                                            <Key size={28} className="text-brand/60 animate-pulse" />
                                                            <span className="text-[9px] text-brand font-semibold mt-2 tracking-widest animate-pulse">GENERANDO FIRMA CRIPTOGRÁFICA...</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[9px] text-brand/80 font-mono">
                                                                <span>APLICANDO SELLO CRIPTOGRÁFICO P12</span>
                                                                <span>{signProgress}%</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-border-thin rounded-full overflow-hidden">
                                                                <div className="h-full bg-brand transition-all duration-75" style={{ width: `${signProgress}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {signState === 'signed' && (
                                                    <div className="space-y-3 animate-fade-in text-left">
                                                        {/* Encabezado del Certificado Digital */}
                                                        <div className="flex justify-between items-center bg-success/10 border border-success/30 p-2.5 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                                                                    <Check size={12} strokeWidth={3} className="animate-scale-up" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9.5px] font-bold text-success font-sans leading-none">CERTIFICACIÓN VÁLIDA</p>
                                                                    <p className="text-[8px] text-text-dim mt-0.5 font-mono">Banco Central del Ecuador</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={resetSignature}
                                                                className="text-text-dim hover:text-text-main text-[8.5px] font-mono border border-border-thin px-2 py-1 rounded cursor-pointer transition-all hover:bg-surface/50 active:scale-95 flex items-center gap-1.5 bg-surface/30"
                                                            >
                                                                <RefreshCw size={10} /> REINICIAR
                                                            </button>
                                                        </div>

                                                        {/* Detalles del Firmante Oficial */}
                                                        <div className="bg-surface/35 border border-border-thin/40 p-3 rounded-lg space-y-2 text-[9px] font-mono">
                                                            <div className="grid grid-cols-2 gap-2 border-b border-border-thin/20 pb-2">
                                                                <div>
                                                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Firmante</span>
                                                                    <span className="text-text-main font-semibold block mt-0.5">Dr. Jorge Doicela</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Cargo</span>
                                                                    <span className="text-text-main font-semibold block mt-0.5">Director I+D</span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                                <div>
                                                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Fecha de Firma</span>
                                                                    <span className="text-text-main font-semibold block mt-0.5">{signTimestamp}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[8px] text-text-dim block uppercase font-sans">Entidad</span>
                                                                    <span className="text-success font-semibold block mt-0.5">FirmaEC (IST)</span>
                                                                </div>
                                                            </div>
                                                            <div className="border-t border-border-thin/20 pt-2 mt-1">
                                                                <span className="text-[7.5px] text-text-dim block uppercase font-sans">Hash Criptográfico</span>
                                                                <span className="text-brand font-bold text-[8.5px] block truncate font-mono mt-0.5">
                                                                    8f3b2a1c9e8d7f6c4b2a3e9c8a7b6c5d4e3f2a1b
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Leyenda removida */}

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

        </section>
    );
};

export default Modulos;
