import React, { useState } from 'react';
import { Users, LayoutDashboard, Scale, ShieldCheck, CheckCircle2, Activity, Cpu, Loader2 } from 'lucide-react';

const Roles: React.FC = () => {
    const [activeRole, setActiveRole] = useState<number>(0);
    
    // Estados internos para la consola interactiva
    const [invSigned, setInvSigned] = useState<boolean>(false);
    const [assignState, setAssignState] = useState<'idle' | 'assigning' | 'assigned'>('idle');
    const [voteState, setVoteState] = useState<'idle' | 'approved' | 'rejected'>('idle');
    const [apiTesting, setApiTesting] = useState<boolean>(false);
    const [apiResult, setApiResult] = useState<string>('');

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
        setTimeout(() => setAssignState('assigned'), 1000);
    };

    const runApiTest = () => {
        if (apiTesting) return;
        setApiTesting(true);
        setApiResult('');
        setTimeout(() => {
            setApiTesting(false);
            setApiResult('CONEXIONES DE RED ACTIVAS. PING SIIES: 24ms (200 OK) | PING DSPACE: 48ms (200 OK)');
        }, 1200);
    };

    return (
        <section id="roles" className="py-20 lg:-ml-24 lg:-mr-24 space-y-12 select-none">
            <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                    Estructura & Niveles de Acceso.
                </h2>
                <p className="text-xs text-text-dim max-w-lg leading-relaxed font-medium">
                    Gestión de flujos institucionales con roles claramente definidos y segregación de funciones para asegurar la integridad de la producción científica. Clic en los roles para explorar sus permisos.
                </p>
            </div>

            {/* Grid de Tarjetas de Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesData.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setActiveRole(idx);
                            // Resetear estados al cambiar de rol
                            setInvSigned(false);
                            setAssignState('idle');
                            setVoteState('idle');
                            setApiResult('');
                        }}
                        className={`p-6 flex flex-col justify-between text-left rounded-lg border transition-all duration-500 min-h-[220px] cursor-pointer ${
                            activeRole === idx 
                                ? 'bg-surface border-brand shadow-[0_4px_25px_rgba(0,112,243,0.15)] scale-[1.01]' 
                                : 'bg-surface border-border-thin hover:border-border-hover'
                        }`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <div className={`p-2 border rounded bg-bg-deep transition-colors ${activeRole === idx ? 'border-brand/40 text-brand' : 'border-border-thin text-text-main'}`}>
                                <item.icon size={18} strokeWidth={1.5} />
                            </div>
                            <span className={`text-[9px] font-mono px-2 py-0.5 border rounded-full uppercase transition-colors ${
                                activeRole === idx ? 'border-brand/30 bg-brand-subtle text-brand font-bold' : 'border-border-thin text-text-dim'
                            }`}>Nivel_0{idx + 1}</span>
                        </div>
                        
                        <div className="mt-6 space-y-2 w-full">
                            <h4 className={`text-xs font-semibold tracking-tight uppercase font-mono transition-colors ${activeRole === idx ? 'text-brand' : 'text-text-main'}`}>
                                {item.role}
                            </h4>
                            <p className="text-[11px] text-text-dim leading-relaxed">
                                {item.desc}
                            </p>

                            {/* Detalle dinámico de permisos */}
                            <div className={`pt-3 border-t border-border-thin/60 space-y-1.5 transition-all duration-500 overflow-hidden ${
                                activeRole === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                                <p className="text-[8px] font-mono text-text-dim uppercase tracking-wider">// ACCIONES PERMITIDAS</p>
                                {item.permissions.map((perm, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-1.5 text-[9px] text-text-main font-sans">
                                        <CheckCircle2 size={10} className="text-brand shrink-0" />
                                        <span>{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Consola Interactiva Simulada de Vista Previa */}
            <div className="border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[10px] relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-4">
                    <span className="text-[10px] font-semibold text-text-main font-mono flex items-center gap-1.5">
                        <Activity size={12} className="text-brand animate-pulse" />
                        CONSOLA DE SIMULACIÓN DIITRA: VISTA PREVIA DEL ACCESO
                    </span>
                    <span className="text-[9px] text-text-dim font-mono uppercase tracking-wider">
                        ROL ACTIVO: {rolesData[activeRole].role}
                    </span>
                </div>

                <div className="min-h-[100px] flex flex-col justify-between">
                    {/* Consola: Investigador */}
                    {activeRole === 0 && (
                        <div className="space-y-4 animate-fade-in font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="border border-border-thin rounded p-3 bg-bg-deep/40 space-y-1">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// MIS PROYECTOS</span>
                                    <p className="text-text-main font-semibold text-[10.5px]">01/ Sistema de Riego IoT</p>
                                    <span className="text-[9px] text-warning border border-warning/20 bg-warning-subtle px-1.5 py-0.5 rounded font-mono uppercase font-bold inline-block">Hito 2 en Proceso</span>
                                </div>
                                <div className="border border-border-thin rounded p-3 bg-bg-deep/40 space-y-1">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// PRESUPUESTO ASIGNADO</span>
                                    <p className="text-text-main font-bold text-sm">$4,500.00</p>
                                    <span className="text-[8px] text-text-dim font-mono">Consumo actual: 66%</span>
                                </div>
                                <div className="border border-border-thin rounded p-3 bg-bg-deep/40 flex flex-col justify-between">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// ACCIONES RÁPIDAS</span>
                                    <button 
                                        onClick={() => setInvSigned(true)}
                                        disabled={invSigned}
                                        className={`w-full py-1.5 rounded font-bold font-sans text-[9px] uppercase tracking-wider cursor-pointer text-center transition-all ${
                                            invSigned 
                                                ? 'bg-success/20 border border-success/30 text-success' 
                                                : 'bg-brand text-white hover:opacity-90 active:scale-95'
                                        }`}
                                    >
                                        {invSigned ? '✓ EVIDENCIAS DE HITO FIRMADAS' : 'FIRMAR ENTREGABLE SEMANAL'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Consola: Director */}
                    {activeRole === 1 && (
                        <div className="space-y-4 animate-fade-in font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-border-thin rounded p-4 bg-bg-deep/40 space-y-2.5">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// PROYECTOS PENDIENTES DE REVISOR DOBLE CIEGO</span>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <div>
                                            <p className="text-text-main font-semibold">"Robot de Limpieza Solar"</p>
                                            <p className="text-text-dim text-[8px] font-mono">LÍNEA: Software & Automatización</p>
                                        </div>
                                        <button 
                                            onClick={runAssignSimulation}
                                            disabled={assignState !== 'idle'}
                                            className={`px-3 py-1.5 rounded font-bold text-[8.5px] uppercase tracking-wider cursor-pointer transition-all ${
                                                assignState === 'assigning'
                                                    ? 'bg-surface border border-border-thin text-text-dim'
                                                    : assignState === 'assigned'
                                                        ? 'bg-success/15 border border-success/30 text-success'
                                                        : 'bg-text-main text-bg-deep hover:opacity-95'
                                            }`}
                                        >
                                            {assignState === 'assigning' ? 'ASIGNANDO...' : assignState === 'assigned' ? 'ASIGNADOS ✓' : 'ASIGNAR PARES'}
                                        </button>
                                    </div>
                                </div>
                                <div className="border border-border-thin rounded p-4 bg-bg-deep/40 space-y-2">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// ESTADO REVISIÓN CIEGA</span>
                                    {assignState === 'idle' && <p className="text-text-dim text-[9.5px]">Esperando asignación de pares evaluadores...</p>}
                                    {assignState === 'assigning' && <p className="text-brand text-[9.5px] animate-pulse">Buscando algoritmos de coincidencia de perfil científico...</p>}
                                    {assignState === 'assigned' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <p className="text-success font-semibold text-[10px]">✓ PARES ASIGNADOS CORRECTAMENTE</p>
                                            <div className="flex gap-2 text-[8.5px] font-mono">
                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Evaluador A: Anon_#184b</span>
                                                <span className="border border-border-thin px-1.5 py-0.5 rounded bg-surface/50">Evaluador B: Anon_#92df</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Consola: Comité */}
                    {activeRole === 2 && (
                        <div className="space-y-4 animate-fade-in font-sans">
                            <div className="border border-border-thin rounded p-4 bg-bg-deep/40 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[8px] text-text-dim font-mono uppercase">// PANEL DE REVISIÓN DOBLE CIEGO</span>
                                        <h4 className="text-text-main font-semibold text-[10.5px] mt-0.5">Propuesta: "Detección de Plagas con Visión Artificial"</h4>
                                        <p className="text-text-dim text-[8px] font-mono mt-0.5">AUTOR: ANÓNIMO (Oculto para evaluador) | ID: #92842</p>
                                    </div>
                                    <span className="text-[9px] font-mono px-2 py-0.5 border border-warning/30 bg-warning-subtle text-warning font-bold rounded">
                                        Dictamen Pendiente
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button 
                                        onClick={() => setVoteState('approved')}
                                        className={`px-3 py-1.5 rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all ${
                                            voteState === 'approved' 
                                                ? 'bg-success text-bg-deep' 
                                                : 'bg-success/15 border border-success/30 text-success hover:bg-success/20'
                                        }`}
                                    >
                                        Emitir Aprobado
                                    </button>
                                    <button 
                                        onClick={() => setVoteState('rejected')}
                                        className={`px-3 py-1.5 rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all ${
                                            voteState === 'rejected' 
                                                ? 'bg-error text-bg-deep' 
                                                : 'bg-error/15 border border-error/30 text-error hover:bg-error/20'
                                        }`}
                                    >
                                        Emitir Rechazado
                                    </button>
                                    {voteState !== 'idle' && (
                                        <button 
                                            onClick={() => setVoteState('idle')}
                                            className="text-text-dim hover:text-text-main text-[8.5px] font-mono ml-auto border border-border-thin px-2 py-0.5 rounded cursor-pointer"
                                        >
                                            REINICIAR VOTO
                                        </button>
                                    )}
                                </div>

                                {voteState === 'approved' && (
                                    <p className="text-success font-semibold text-[9.5px] animate-fade-in">✓ VOTO EMITIDO: Propuesta aprobada metodológicamente. Acta FirmaEC en preparación.</p>
                                )}
                                {voteState === 'rejected' && (
                                    <p className="text-error font-semibold text-[9.5px] animate-fade-in">✗ VOTO EMITIDO: Propuesta rechazada. Se enviarán correcciones al docente de forma anónima.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Consola: Administrador */}
                    {activeRole === 3 && (
                        <div className="space-y-4 animate-fade-in font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <div className="md:col-span-4 border border-border-thin rounded p-3 bg-bg-deep/40 space-y-1.5">
                                    <span className="text-[8px] text-text-dim font-mono uppercase">// SISTEMA GENERAL</span>
                                    <div className="space-y-1 text-[9px]">
                                        <div className="flex justify-between text-text-main">
                                            <span>Usuarios:</span>
                                            <span className="font-mono font-bold">48 Activos</span>
                                        </div>
                                        <div className="flex justify-between text-text-main">
                                            <span>Conexión SIIES:</span>
                                            <span className="text-success font-semibold">Activa</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-8 border border-border-thin rounded p-3 bg-bg-deep/40 space-y-2 min-h-[75px] flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] text-text-dim font-mono uppercase">// DIAGNÓSTICO DE INTEGRACIONES API</span>
                                        <button 
                                            onClick={runApiTest}
                                            disabled={apiTesting}
                                            className="px-2.5 py-1 bg-text-main text-bg-deep rounded font-bold font-sans text-[8.5px] uppercase tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0"
                                        >
                                            {apiTesting && <Loader2 size={9} className="animate-spin" />}
                                            {!apiTesting && <Cpu size={9} />}
                                            Probar Gateway API
                                        </button>
                                    </div>
                                    {apiTesting ? (
                                        <p className="text-brand font-mono text-[8.5px] animate-pulse">Haciendo ping a servidores de SENESCYT, SIIES y repositorio DSpace...</p>
                                    ) : apiResult ? (
                                        <p className="text-success font-mono text-[8.5px] leading-tight animate-fade-in">{apiResult}</p>
                                    ) : (
                                        <p className="text-text-dim text-[9px]">Haz clic en probar para diagnosticar el estado del validador y las API externas.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Roles;
