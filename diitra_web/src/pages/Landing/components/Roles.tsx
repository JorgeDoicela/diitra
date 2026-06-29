import React, { useState } from 'react';
import { Users, LayoutDashboard, Scale, ShieldCheck, CheckCircle2, Cpu, Loader2, Terminal } from 'lucide-react';

const Roles: React.FC = () => {
    const [activeRole, setActiveRole] = useState<number>(0);
    
    // Estados internos para la consola interactiva
    const [invSigned, setInvSigned] = useState<boolean>(false);
    const [isSigning, setIsSigning] = useState<boolean>(false);
    const [assignState, setAssignState] = useState<'idle' | 'assigning' | 'assigned'>('idle');
    const [voteState, setVoteState] = useState<'idle' | 'approved' | 'rejected'>('idle');
    const [isVoting, setIsVoting] = useState<boolean>(false);
    const [apiTesting, setApiTesting] = useState<boolean>(false);
    const [apiResult, setApiResult] = useState<string>('');

    // Estados dinámicos adicionales para la interacción avanzada
    // Investigador
    const [selectedProject, setSelectedProject] = useState<'riego' | 'robot' | 'plagas'>('riego');
    const [hitoProgress, setHitoProgress] = useState<number>(50);

    // Director
    const [assignmentCriteria, setAssignmentCriteria] = useState<'linea' | 'carga' | 'aleatorio'>('linea');
    const [assignLog, setAssignLog] = useState<string>('Esperando asignación de pares evaluadores...');

    // Comité de Ética
    const [gradeMetodologia, setGradeMetodologia] = useState<number>(3);
    const [gradeEtica, setGradeEtica] = useState<boolean>(false);

    // Administrador
    const [selectedApi, setSelectedApi] = useState<'siies' | 'dspace' | 'senadi'>('siies');
    const [syncProgress, setSyncProgress] = useState<number>(0);
    const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'completed'>('idle');

    // Estado de interacción de la Cascada (Tooltip al pasar el mouse, null por defecto)
    const [hoveredStep, setHoveredStep] = useState<number | null>(null);

    const rolesData = [
        { 
            role: 'Investigador', 
            desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', 
            icon: Users,
            permissions: ['Crear propuestas de proyecto', 'Planificar presupuestos e hitos', 'Cargar evidencias de avance']
        },
        { 
            role: 'Director de Investigación', 
            desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', 
            icon: LayoutDashboard,
            permissions: ['Apertura de convocatorias', 'Asignación de pares doble ciego', 'Supervisión presupuestaria']
        },
        { 
            role: 'Comité de Ética / Revisores', 
            desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética de las propuestas.', 
            icon: Scale,
            permissions: ['Evaluación anónima doble ciego', 'Emisión de actas de dictamen', 'Firma electrónica de resoluciones']
        },
        { 
            role: 'Administrador', 
            desc: 'Configuración de períodos académicos, líneas de investigación e integraciones de API externas.', 
            icon: ShieldCheck,
            permissions: ['Configuración del sistema', 'Gestión de distributivos docentes', 'Integración y API (SIIES / DSpace)']
        },
    ];

    const runAssignSimulation = () => {
        if (assignState !== 'idle') return;
        setAssignState('assigning');
        setAssignLog('Filtrando investigadores afines a la línea científica...');
        setTimeout(() => {
            setAssignLog('Evaluando carga horaria y disponibilidad docente (CACES Criterio B.1.1)...');
            setTimeout(() => {
                setAssignLog('Verificando posibles conflictos de interés (doble ciego)...');
                setTimeout(() => {
                    setAssignState('assigned');
                    setAssignLog('✓ Asignación completada. Pares validados en distributivo SIGAFI.');
                }, 400);
            }, 400);
        }, 400);
    };

    const handleSignProposal = () => {
        setIsSigning(true);
        setTimeout(() => {
            setIsSigning(false);
            setInvSigned(true);
        }, 900);
    };

    const handleCastVote = (approved: boolean) => {
        setIsVoting(true);
        setTimeout(() => {
            setIsVoting(false);
            setVoteState(approved ? 'approved' : 'rejected');
        }, 800);
    };

    const runApiTest = () => {
        if (apiTesting) return;
        setApiTesting(true);
        setApiResult('');
        setTimeout(() => {
            setApiTesting(false);
            if (selectedApi === 'siies') {
                setApiResult('SIIES API (Conectado) | Latencia: 24ms | Sincronización CACES: Correcta');
            } else if (selectedApi === 'dspace') {
                setApiResult('DSpace Repo (Conectado) | Latencia: 48ms | Repositorio científico: Listo');
            } else {
                setApiResult('SENADI Gateway (Conectado) | Latencia: 15ms | Propiedad intelectual: En regla');
            }
        }, 1000);
    };

    const runSyncSimulation = () => {
        if (syncState === 'syncing') return;
        setSyncState('syncing');
        setSyncProgress(0);
        const interval = setInterval(() => {
            setSyncProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setSyncState('completed');
                    return 100;
                }
                return prev + 10;
            });
        }, 150);
    };

    const getWaterfallSteps = (roleIdx: number) => {
        switch (roleIdx) {
            case 0:
                return [
                    { 
                        name: 'Crear propuesta de proyecto', 
                        duration: '2d', 
                        startPercent: '0%', 
                        widthPercent: '30%', 
                        permission: 'PROYECTOS:CREAR',
                        desc: 'Creación del borrador inicial de la propuesta de investigación.',
                        colorClass: 'bg-success/10 border-l-2 border-success text-success shadow-[inset_1px_0_0_rgba(0,224,84,0.1)] hover:bg-success/20 cursor-pointer' 
                    },
                    { 
                        name: 'Planificar presupuesto e hitos', 
                        duration: '3d', 
                        startPercent: '30%', 
                        widthPercent: '50%', 
                        permission: 'PROYECTOS:GESTIONAR',
                        desc: 'Desglose financiero de equipos, materiales y cronograma de hitos.',
                        colorClass: 'bg-brand/10 border-l-2 border-brand text-brand shadow-[inset_1px_0_0_rgba(0,112,243,0.1)] hover:bg-brand/20 cursor-pointer' 
                    },
                    { 
                        name: hitoProgress === 100 
                            ? 'Cargar evidencias (Completado ✓)' 
                            : `Cargar evidencias (${hitoProgress}%)`, 
                        duration: '1d', 
                        startPercent: '80%', 
                        widthPercent: `${(hitoProgress / 100) * 20}%`, 
                        permission: 'PROYECTOS:EDITAR',
                        desc: 'Carga de entregables semanales firmados digitalmente para validación.',
                        colorClass: hitoProgress === 100
                            ? 'bg-success/10 border-l-2 border-success text-success transition-all duration-300 hover:bg-success/20 cursor-pointer'
                            : 'bg-warning/10 border-l-2 border-warning text-warning transition-all duration-300 hover:bg-warning/20 cursor-pointer' 
                    }
                ];
            case 1:
                return [
                    { 
                        name: 'Apertura de convocatorias', 
                        duration: '3d', 
                        startPercent: '0%', 
                        widthPercent: '42%', 
                        permission: 'CONVOCATORIAS:CREAR',
                        desc: 'Configuración y publicación de bases para nuevos proyectos.',
                        colorClass: 'bg-success/10 border-l-2 border-success text-success hover:bg-success/20 cursor-pointer' 
                    },
                    { 
                        name: 'Filtro y revisión de requisitos', 
                        duration: '2d', 
                        startPercent: '42%', 
                        widthPercent: '28%', 
                        permission: 'CONFIGURACION:VER',
                        desc: 'Validación horaria de distributivos docentes en SIGAFI.',
                        colorClass: 'bg-brand/10 border-l-2 border-brand text-brand hover:bg-brand/20 cursor-pointer' 
                    },
                    { 
                        name: assignState === 'assigned'
                            ? `Asignación completada (${assignmentCriteria}) ✓`
                            : assignState === 'assigning'
                                ? 'Buscando revisores en SIGAFI...'
                                : 'Esperando asignación de revisores', 
                        duration: '2d', 
                        startPercent: '70%', 
                        widthPercent: assignState === 'assigned' ? '30%' : '15%', 
                        permission: 'PROYECTOS:ASIGNAR',
                        desc: 'Asignación anónima doble ciego por línea de investigación o carga.',
                        colorClass: assignState === 'assigned'
                            ? 'bg-success/10 border-l-2 border-success text-success transition-all duration-300 hover:bg-success/20 cursor-pointer'
                            : assignState === 'assigning'
                                ? 'bg-brand/10 border-l-2 border-brand text-brand animate-pulse transition-all duration-300'
                                : 'bg-warning/5 border-l-2 border-warning/30 text-text-dim/80 transition-all duration-300 hover:bg-warning/10 cursor-pointer' 
                    }
                ];
            case 2:
                return [
                    { 
                        name: 'Evaluación anónima doble ciego', 
                        duration: '5d', 
                        startPercent: '0%', 
                        widthPercent: '60%', 
                        permission: 'PROYECTOS:VER',
                        desc: 'Revisión ciega del protocolo científico sin datos de autoría.',
                        colorClass: 'bg-success/10 border-l-2 border-success text-success hover:bg-success/20 cursor-pointer' 
                    },
                    { 
                        name: 'Emisión de acta de dictamen', 
                        duration: '2d', 
                        startPercent: '60%', 
                        widthPercent: '25%', 
                        permission: 'PROYECTOS:APROBAR',
                        desc: 'Calificación metodológica y registro de dictamen en el acta.',
                        colorClass: 'bg-brand/10 border-l-2 border-brand text-brand hover:bg-brand/20 cursor-pointer' 
                    },
                    { 
                        name: voteState === 'approved'
                            ? 'Resolución de ética aprobada ✓'
                            : voteState === 'rejected'
                                ? 'Resolución de ética rechazada ✗'
                                : 'Firma de resolución de ética', 
                        duration: '1d', 
                        startPercent: '85%', 
                        widthPercent: '15%', 
                        permission: 'PROYECTOS:APROBAR',
                        desc: 'Sello digital del acta mediante firmas criptográficas .p12.',
                        colorClass: voteState === 'approved'
                            ? 'bg-success/10 border-l-2 border-success text-success transition-all duration-300 hover:bg-success/20 cursor-pointer'
                            : voteState === 'rejected'
                                ? 'bg-error/10 border-l-2 border-error text-error transition-all duration-300 hover:bg-error/20 cursor-pointer'
                                : 'bg-warning/5 border-l-2 border-warning/30 text-text-dim/80 hover:bg-warning/10 cursor-pointer' 
                    }
                ];
            case 3:
                return [
                    { 
                        name: 'Configurar período académico', 
                        duration: '1d', 
                        startPercent: '0%', 
                        widthPercent: '25%', 
                        permission: 'CONFIGURACION:EDITAR',
                        desc: 'Habilitación de fechas de postulación e indicadores CACES.',
                        colorClass: 'bg-success/10 border-l-2 border-success text-success hover:bg-success/20 cursor-pointer' 
                    },
                    { 
                        name: syncState === 'completed'
                            ? 'Sincronizar repositorio DSpace (100%) ✓'
                            : syncState === 'syncing'
                                ? `Sincronizando DSpace (${syncProgress}%)`
                                : 'Sincronizar repositorio DSpace (Pendiente)', 
                        duration: '2d', 
                        startPercent: '25%', 
                        widthPercent: syncState === 'completed' ? '50%' : syncState === 'syncing' ? `${(syncProgress / 100) * 50}%` : '20%', 
                        permission: 'CONFIGURACION:EDITAR',
                        desc: 'Carga automática de metadatos del proyecto al repositorio.',
                        colorClass: syncState === 'completed'
                            ? 'bg-success/10 border-l-2 border-success text-success transition-all duration-300 hover:bg-success/20 cursor-pointer'
                            : syncState === 'syncing'
                                ? 'bg-brand/10 border-l-2 border-brand text-brand transition-all duration-150 animate-pulse'
                                : 'bg-warning/5 border-l-2 border-warning/30 text-text-dim/80 hover:bg-warning/10 cursor-pointer'
                    },
                    { 
                        name: 'Auditoría e informes generales', 
                        duration: '1d', 
                        startPercent: '75%', 
                        widthPercent: '25%', 
                        permission: 'USUARIOS:VER',
                        desc: 'Generación de reportes de cumplimiento de horas CACES.',
                        colorClass: syncState === 'completed'
                            ? 'bg-success/10 border-l-2 border-success text-success hover:bg-success/20 cursor-pointer'
                            : 'bg-warning/5 border-l-2 border-warning/30 text-text-dim/80 hover:bg-warning/10 cursor-pointer' 
                    }
                ];
            default:
                return [];
        }
    };

    return (
        <section id="roles" className="py-20 lg:-ml-24 lg:-mr-24 space-y-10">
            {/* Header Limpio */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border-thin">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tighter leading-[0.95] text-text-main">
                        Estructura & Niveles de Acceso.
                    </h2>
                </div>
                <p className="text-xs text-text-dim max-w-md leading-relaxed font-medium">
                    Gestión de flujos institucionales con roles claramente definidos y segregación de funciones para asegurar la integridad de la producción científica. Explora el flujo simulado y nivel de acceso de cada rol.
                </p>
            </div>

            {/* Panel Principal Dashboard Rediseñado */}
            <div className="border border-border-thin rounded-xl bg-surface/35 shadow-xl font-sans relative overflow-hidden backdrop-blur-sm flex flex-col md:flex-row min-h-[480px]">
                
                {/* Lateral: Selector de Roles */}
                <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border-thin bg-surface/50 p-3 flex flex-col gap-1.5 shrink-0">
                    {rolesData.map((item, idx) => {
                        const Icon = item.icon;
                        const isSelected = activeRole === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setActiveRole(idx);
                                    // Resetear estados al cambiar de rol
                                    setInvSigned(false);
                                    setHitoProgress(50);
                                    setAssignState('idle');
                                    setAssignLog('Esperando asignación de pares evaluadores...');
                                    setVoteState('idle');
                                    setGradeMetodologia(3);
                                    setGradeEtica(false);
                                    setApiResult('');
                                    setSyncState('idle');
                                    setSyncProgress(0);
                                    setHoveredStep(null);
                                }}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                                    isSelected 
                                        ? 'bg-brand-subtle border border-brand/20 text-brand shadow-[0_2px_10px_rgba(0,112,243,0.04)] font-semibold scale-[1.02]' 
                                        : 'hover:bg-surface-hover/60 border border-transparent text-text-dim hover:text-text-main hover:translate-x-0.5'
                                }`}
                            >
                                <div className={`p-1.5 rounded border transition-colors ${
                                    isSelected ? 'bg-brand/10 border-brand/35 text-brand' : 'bg-bg-deep border-border-thin text-text-dim'
                                }`}>
                                    <Icon size={13} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] tracking-tight truncate leading-none">
                                        {item.role}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Área de Trabajo Derecha */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-6 min-w-0">
                    
                    {/* Info de Rol & Badges de Permisos */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-text-main">
                                    {rolesData[activeRole].role}
                                </h3>
                                <span className="text-[9px] font-mono px-2 py-0.5 border border-brand/20 bg-brand-subtle text-brand rounded-full uppercase font-bold">
                                    Nivel 0{activeRole + 1}
                                </span>
                            </div>
                            <p className="text-xs text-text-dim leading-relaxed max-w-2xl">
                                {rolesData[activeRole].desc}
                            </p>
                        </div>

                        {/* Acciones/Permisos en formato Badges */}
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-2">
                                {rolesData[activeRole].permissions.map((perm, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-1.5 text-[9px] text-text-main font-sans border border-border-thin bg-surface/50 px-2.5 py-1 rounded">
                                        <CheckCircle2 size={10} className="text-brand shrink-0" />
                                        <span>{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Flujo de Actividades (Waterfall) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-text-dim/60 uppercase tracking-wider">
                            <span>Secuencia del flujo de trabajo:</span>
                            <span className="text-[8.5px] lowercase font-bold text-brand bg-brand-subtle border border-brand/20 px-1.5 rounded transition-all duration-300">
                                {activeRole === 0 
                                    ? `proceso_${selectedProject}_activo()` 
                                    : activeRole === 1 
                                        ? `asignar_pares_criterio_${assignmentCriteria}()` 
                                        : activeRole === 2 
                                            ? `evaluacion_doble_ciego_${voteState === 'idle' ? 'pendiente' : voteState === 'approved' ? 'aprobada' : 'rechazada'}()` 
                                            : `sincronizacion_modulo_${selectedApi}()`}
                            </span>
                        </div>
                        
                        <div className="border border-border-thin rounded-lg bg-bg-deep/30 p-3 space-y-2 font-mono text-[9px]">
                            {getWaterfallSteps(activeRole).map((step, idx) => (
                                <div 
                                    key={idx} 
                                    className="relative h-6 flex items-center rounded border border-border-thin/40 px-2.5 overflow-hidden transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setHoveredStep(idx)}
                                    onMouseLeave={() => setHoveredStep(null)}
                                >
                                    <div 
                                        className={`absolute inset-y-0 rounded-r transition-all duration-500 ease-out ${step.colorClass}`} 
                                        style={{ 
                                            left: step.startPercent, 
                                            width: step.widthPercent 
                                        }} 
                                    />
                                    <span className="text-text-main text-[9px] z-10 pl-3 relative flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-border-thin" />
                                        <span className="font-sans font-medium truncate pr-2">{step.name}</span>
                                    </span>
                                    
                                    <span className="ml-auto text-text-dim text-[8px] font-bold z-10 bg-bg-deep/70 px-1.5 py-0.5 rounded border border-border-thin/30">
                                        {step.duration}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Detalle interactivo del paso actual (Altamente estable y libre de Layout Shift) */}
                        <div className={`transition-all duration-300 rounded px-3 py-1.5 min-h-[34px] flex items-center justify-center border ${
                            hoveredStep !== null 
                                ? 'border-border-thin bg-surface/20 opacity-100' 
                                : 'border-transparent bg-transparent opacity-0'
                        }`}>
                            {hoveredStep !== null && getWaterfallSteps(activeRole)[hoveredStep] && (
                                <p className="text-[8.5px] text-text-dim leading-relaxed flex flex-wrap items-center gap-1.5 font-sans transition-opacity duration-300">
                                    <span className="font-mono text-brand font-bold bg-brand-subtle border border-brand/20 px-1.5 py-0.5 rounded text-[7.5px] tracking-wider uppercase">
                                        {getWaterfallSteps(activeRole)[hoveredStep].permission}
                                    </span>
                                    <span className="text-text-main font-semibold">{getWaterfallSteps(activeRole)[hoveredStep].name}:</span>
                                    <span>{getWaterfallSteps(activeRole)[hoveredStep].desc}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Simulación interactiva */}
                    <div className="border border-border-thin rounded-lg bg-surface/50 p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim uppercase tracking-wider">
                            <Terminal size={12} className="text-brand" />
                            <span>Simulador de Acciones de Rol</span>
                        </div>

                        <div className="min-h-[70px] flex flex-col justify-center">
                            {/* Consola: Investigador */}
                            {activeRole === 0 && (
                                <div className="space-y-3 animate-fade-in text-[10px] font-mono">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="border border-border-thin rounded p-2.5 bg-bg-deep/40 space-y-1">
                                            <span className="text-[8px] text-text-dim uppercase block">Proyecto actual</span>
                                            <select 
                                                value={selectedProject} 
                                                onChange={(e) => {
                                                    setSelectedProject(e.target.value as any);
                                                    setInvSigned(false);
                                                    setHitoProgress(50);
                                                }}
                                                className="bg-surface text-text-main text-[9.5px] rounded border border-border-thin px-1.5 py-0.5 outline-none w-full focus:border-brand mt-0.5 cursor-pointer"
                                            >
                                                <option value="riego">01/ Riego IoT</option>
                                                <option value="robot">02/ Limpieza Solar</option>
                                                <option value="plagas">03/ Visión Artificial</option>
                                            </select>
                                            <span className="text-[8px] text-warning font-semibold block mt-0.5">Hito 2 en Proceso</span>
                                        </div>
                                        
                                        <div className="border border-border-thin rounded p-2.5 bg-bg-deep/40 space-y-1.5">
                                            <span className="text-[8px] text-text-dim uppercase block">Progreso de evidencias: {hitoProgress}%</span>
                                            <div className="w-full bg-border-thin/50 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand transition-all duration-300" 
                                                    style={{ width: `${hitoProgress}%` }} 
                                                />
                                            </div>
                                            <div className="flex gap-2 items-center justify-between mt-1">
                                                <button 
                                                    onClick={() => setHitoProgress(prev => Math.min(prev + 25, 100))}
                                                    disabled={hitoProgress === 100 || invSigned}
                                                    className="px-2 py-0.5 border border-border-thin rounded bg-surface hover:bg-surface-hover text-[8.5px] text-text-main cursor-pointer disabled:opacity-40"
                                                >
                                                    Avanzar (+25%)
                                                </button>
                                                {hitoProgress === 100 && (
                                                    <span className="text-success text-[8.5px] font-sans font-semibold">✓ Listo</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-between gap-2">
                                            <span className="text-[8px] text-text-dim uppercase block">Firma de entregable (.p12)</span>
                                            {isSigning ? (
                                                <div className="w-full py-2 bg-brand-subtle border border-brand/20 text-brand rounded font-bold text-[8.5px] flex items-center justify-center gap-1.5 flex-1 animate-pulse">
                                                    <Loader2 size={10} className="animate-spin" />
                                                    Firmando...
                                                </div>
                                            ) : invSigned ? (
                                                <div className="space-y-1.5 text-left font-mono text-[7.5px] leading-tight">
                                                    <div className="bg-success/15 border border-success/30 text-success text-[8.5px] py-0.5 rounded font-bold text-center">
                                                        ✓ FIRMADO CON EXITO
                                                    </div>
                                                    <div className="text-text-dim space-y-0.5 bg-bg-deep/50 p-1 rounded border border-border-thin/50">
                                                        <p>Autoridad: BCE Ecuador</p>
                                                        <p className="truncate">Sello: ECDSA_256_FirmaEC</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setInvSigned(false);
                                                            setHitoProgress(50);
                                                        }}
                                                        className="w-full text-center text-text-dim hover:text-text-main text-[8px] underline cursor-pointer inline-block"
                                                    >
                                                        Reiniciar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={handleSignProposal}
                                                    disabled={hitoProgress < 100}
                                                    className={`w-full py-1.5 rounded font-semibold text-[9px] uppercase tracking-wider cursor-pointer text-center transition-all ${
                                                        hitoProgress === 100 
                                                            ? 'bg-brand text-white hover:opacity-90 active:scale-95' 
                                                            : 'bg-surface border border-border-thin text-text-dim cursor-not-allowed'
                                                    }`}
                                                    title={hitoProgress < 100 ? "Completa el progreso antes de firmar" : ""}
                                                >
                                                    Firmar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Consola: Director */}
                            {activeRole === 1 && (
                                <div className="space-y-3 animate-fade-in text-[10px] font-mono">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-between gap-3">
                                            <div>
                                                <span className="text-[8px] text-text-dim uppercase block">Criterio de coincidencia científica</span>
                                                <select 
                                                    value={assignmentCriteria} 
                                                    onChange={(e) => {
                                                        setAssignmentCriteria(e.target.value as any);
                                                        setAssignState('idle');
                                                        setAssignLog('Esperando asignación de pares evaluadores...');
                                                    }}
                                                    className="bg-surface text-text-main text-[9.5px] rounded border border-border-thin px-1.5 py-0.5 outline-none w-full focus:border-brand mt-1 cursor-pointer"
                                                >
                                                    <option value="linea">Por Línea de Investigación</option>
                                                    <option value="carga">Por Menor Carga Docente (SIGAFI)</option>
                                                    <option value="aleatorio">Asignación Aleatoria</option>
                                                </select>
                                            </div>
                                            <button 
                                                onClick={runAssignSimulation}
                                                disabled={assignState !== 'idle'}
                                                className={`w-full py-1.5 rounded font-semibold text-[8.5px] uppercase tracking-wider cursor-pointer transition-all ${
                                                    assignState === 'assigning'
                                                        ? 'bg-surface border border-border-thin text-text-dim'
                                                        : assignState === 'assigned'
                                                            ? 'bg-success/15 border border-success/30 text-success'
                                                            : 'bg-text-main text-bg-deep hover:opacity-95'
                                                }`}
                                            >
                                                {assignState === 'assigning' ? 'Asignando...' : assignState === 'assigned' ? 'Pares Asignados ✓' : 'Asignar Pares'}
                                            </button>
                                        </div>
                                        <div className="border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-center min-h-[75px] space-y-1">
                                            <span className="text-[8px] text-text-dim uppercase block">Registro de auditoría (CACES B.1.1)</span>
                                            <p className={`text-[8.5px] font-mono leading-tight ${assignState === 'assigning' ? 'text-brand animate-pulse' : assignState === 'assigned' ? 'text-success font-semibold' : 'text-text-dim'}`}>
                                                {assignLog}
                                            </p>
                                            {assignState === 'assigned' && (
                                                <div className="space-y-1 mt-1 animate-fade-in">
                                                    <p className="text-[8px] text-text-dim uppercase tracking-wider">// REVISORES DOBLE CIEGO ASIGNADOS</p>
                                                    <div className="flex gap-2 text-[8px] font-mono">
                                                        {assignmentCriteria === 'linea' && (
                                                            <>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Dr. Anon_#184b</span>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Dra. Anon_#92df</span>
                                                            </>
                                                        )}
                                                        {assignmentCriteria === 'carga' && (
                                                            <>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Par A: Anon_#048f (SIGAFI OK)</span>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Par B: Anon_#3382 (SIGAFI OK)</span>
                                                            </>
                                                        )}
                                                        {assignmentCriteria === 'aleatorio' && (
                                                            <>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Revisor Anon_#randA</span>
                                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Revisor Anon_#randB</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Consola: Comité */}
                            {activeRole === 2 && (
                                <div className="space-y-3 animate-fade-in text-[10px] font-mono">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                        <div className="sm:col-span-5 border border-border-thin rounded p-2.5 bg-bg-deep/40 space-y-2 text-left">
                                            <div>
                                                <span className="text-[8px] text-text-dim uppercase block">1. Calidad Metodológica (1-5)</span>
                                                <div className="flex gap-1.5 mt-1">
                                                    {[1, 2, 3, 4, 5].map((val) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => {
                                                                setGradeMetodologia(val);
                                                                setVoteState('idle');
                                                            }}
                                                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] cursor-pointer transition-all border ${
                                                                gradeMetodologia === val 
                                                                    ? 'bg-brand border-brand text-white shadow-sm' 
                                                                    : 'bg-surface border-border-thin text-text-dim hover:text-text-main'
                                                            }`}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-text-dim uppercase block">2. Aspectos Éticos & LOPDP</span>
                                                <button
                                                    onClick={() => {
                                                        setGradeEtica(!gradeEtica);
                                                        setVoteState('idle');
                                                    }}
                                                    className={`w-full py-1 mt-1 text-[9px] font-semibold border rounded cursor-pointer text-center transition-all ${
                                                        gradeEtica 
                                                            ? 'bg-success/15 border-success/35 text-success' 
                                                            : 'bg-error/15 border-error/35 text-error'
                                                    }`}
                                                >
                                                    {gradeEtica ? '✓ Cumple Normas de Ética' : '✗ Pendiente de Dictamen Ético'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-7 border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-between gap-3 text-left">
                                            <div className="space-y-1">
                                                <span className="text-[8px] text-text-dim uppercase block">Simulación de dictamen previo</span>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[9px] text-text-dim font-sans">Puntos: {gradeMetodologia}/5</span>
                                                    <span className="text-text-dim opacity-50">•</span>
                                                    {gradeMetodologia >= 4 && gradeEtica ? (
                                                        <span className="text-success font-bold text-[9px] flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                                            Aprobación viable
                                                        </span>
                                                    ) : gradeMetodologia < 4 && gradeEtica ? (
                                                        <span className="text-warning font-bold text-[9px] flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                                            Requiere correcciones
                                                        </span>
                                                    ) : (
                                                        <span className="text-error font-bold text-[9px] flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                                            Rechazo ético inmediato
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {isVoting ? (
                                                    <button disabled className="flex-1 py-1.5 bg-text-main/80 text-bg-deep rounded font-semibold text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                                                        <Loader2 size={10} className="animate-spin" />
                                                        Emitiendo...
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleCastVote(gradeMetodologia >= 4 && gradeEtica)}
                                                        disabled={voteState !== 'idle'}
                                                        className="flex-1 py-1.5 bg-text-main text-bg-deep rounded font-semibold text-[8.5px] uppercase tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        Emitir Dictamen
                                                    </button>
                                                )}
                                                {voteState !== 'idle' && (
                                                    <button 
                                                        onClick={() => setVoteState('idle')}
                                                        className="px-2 py-1.5 border border-border-thin rounded text-text-dim hover:text-text-main text-[8px] font-mono cursor-pointer"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>

                                            {voteState === 'approved' && (
                                                <div className="space-y-1 bg-success/10 border border-success/30 p-1.5 rounded text-success text-[8.5px] leading-tight font-sans animate-fade-in">
                                                    <p className="font-bold">✓ DICTAMEN APROBADO EMITIDO</p>
                                                    <p className="text-[7.5px] opacity-90">Resolución de ética firmada. Acta enviada a DSpace repositorio.</p>
                                                </div>
                                            )}
                                            {voteState === 'rejected' && (
                                                <div className={`space-y-1 p-1.5 rounded text-[8.5px] leading-tight font-sans animate-fade-in border ${
                                                    gradeEtica === false 
                                                        ? 'bg-error/10 border-error/30 text-error' 
                                                        : 'bg-warning/10 border-warning/30 text-warning'
                                                }`}>
                                                    <p className="font-bold">
                                                        {gradeEtica === false ? '✗ DICTAMEN DE RECHAZO EMITIDO' : '⚠ RETORNADO PARA CORRECCIONES'}
                                                    </p>
                                                    <p className="text-[7.5px] opacity-90">
                                                        {gradeEtica === false 
                                                            ? 'No cumple con criterios bioéticos mínimos o LOPDP.' 
                                                            : 'Puntuación metodológica inferior a 4.0/5.0.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Consola: Administrador */}
                            {activeRole === 3 && (
                                <div className="space-y-3 animate-fade-in text-[10px] font-mono">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                                        <div className="sm:col-span-5 border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-between gap-2.5 text-left">
                                            <div>
                                                <span className="text-[8px] text-text-dim uppercase block">Pasarela externa de sincronización</span>
                                                <select 
                                                    value={selectedApi} 
                                                    onChange={(e) => {
                                                        setSelectedApi(e.target.value as any);
                                                        setApiResult('');
                                                    }}
                                                    className="bg-surface text-text-main text-[9.5px] rounded border border-border-thin px-1.5 py-0.5 outline-none w-full focus:border-brand mt-1 cursor-pointer"
                                                >
                                                    <option value="siies">SIIES API (Acreditación CACES)</option>
                                                    <option value="dspace">DSpace (Repositorio Científico)</option>
                                                    <option value="senadi">SENADI (Propiedad Intelectual)</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={runApiTest}
                                                    disabled={apiTesting}
                                                    className="w-full py-1.5 bg-brand text-white rounded font-semibold text-[8px] uppercase tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {apiTesting && <Loader2 size={8} className="animate-spin" />}
                                                    {!apiTesting && <Cpu size={8} />}
                                                    Probar Conexión
                                                </button>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-7 border border-border-thin rounded p-2.5 bg-bg-deep/40 flex flex-col justify-between gap-3 min-h-[75px] text-left">
                                            <div>
                                                <span className="text-[8px] text-text-dim uppercase block">Respuesta de latencia de red</span>
                                                <div className="min-h-[22px] flex items-center mt-1">
                                                    {apiTesting ? (
                                                        <p className="text-brand animate-pulse text-[8.5px] font-sans">Realizando diagnóstico...</p>
                                                    ) : apiResult ? (
                                                        <p className="text-success text-[8.5px] leading-tight font-sans">{apiResult}</p>
                                                    ) : (
                                                        <p className="text-text-dim text-[8.5px] font-sans">Haz clic en probar para conectarte al gateway.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t border-border-thin/20 pt-2 space-y-1.5">
                                                <div className="flex justify-between items-center text-[8px] text-text-dim uppercase">
                                                    <span>Sincronizar base de datos general</span>
                                                    <span>{syncProgress}%</span>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <div className="flex-1 bg-border-thin/50 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-success transition-all duration-150" 
                                                            style={{ width: `${syncProgress}%` }} 
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={runSyncSimulation}
                                                        disabled={syncState === 'syncing'}
                                                        className="px-2 py-0.5 bg-text-main text-bg-deep rounded font-semibold text-[8px] uppercase cursor-pointer hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        {syncState === 'syncing' ? '...' : syncState === 'completed' ? '✓ Listo' : 'Sincronizar'}
                                                    </button>
                                                </div>
                                                {syncState === 'completed' && (
                                                    <p className="text-success text-[7.5px] font-sans leading-none">✓ Evidencias académicas y distributivos sincronizados con SIGAFI.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Roles;
