import React, { useState } from 'react';
import { Users, CheckCircle2, DollarSign, CalendarRange, BookOpen, PenTool } from 'lucide-react';

const Workspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(1);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Simulación de co-edición en tiempo real
    const [coEditing, setCoEditing] = useState<boolean>(false);
    const [typedText, setTypedText] = useState<string>('');
    const fullCoEditText = ' Integrando bases de datos y firma digital FirmaEC.';

    // Partidas presupuestarias interactivas en la pestaña 3
    const [budgetItems, setBudgetItems] = useState([
        { id: 1, name: '01/ EQUIPOS', val: 2100, active: true },
        { id: 2, name: '02/ MATERIALES', val: 900, active: true },
        { id: 3, name: '03/ VINCULACIÓN', val: 1500, active: false }
    ]);

    const toggleBudgetItem = (id: number) => {
        setIsSaving(true);
        setBudgetItems(budgetItems.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
        ));
        setTimeout(() => setIsSaving(false), 600);
    };

    const activeBudgetTotal = budgetItems
        .filter(item => item.active)
        .reduce((sum, item) => sum + item.val, 0);

    const budgetMax = budgetItems.reduce((sum, item) => sum + item.val, 0);
    const budgetPct = Math.round((activeBudgetTotal / budgetMax) * 100);

    // Hitos interactivos en la pestaña 4
    const [timelinePhases, setTimelinePhases] = useState([
        { name: '1. Requerimientos', status: 'Completado', color: 'text-success border-success/30 bg-success-subtle' },
        { name: '2. Desarrollo Core', status: 'En Proceso', color: 'text-warning border-warning/30 bg-warning-subtle' },
        { name: '3. Acreditación CACES', status: 'Pendiente', color: 'text-text-dim border-border-thin bg-surface/50' }
    ]);

    const cyclePhaseStatus = (idx: number) => {
        setIsSaving(true);
        setTimelinePhases(timelinePhases.map((phase, pIdx) => {
            if (pIdx === idx) {
                if (phase.status === 'Pendiente') {
                    return { ...phase, status: 'En Proceso', color: 'text-warning border-warning/30 bg-warning-subtle' };
                } else if (phase.status === 'En Proceso') {
                    return { ...phase, status: 'Completado', color: 'text-success border-success/30 bg-success-subtle' };
                } else {
                    return { ...phase, status: 'Pendiente', color: 'text-text-dim border-border-thin bg-surface/50' };
                }
            }
            return phase;
        }));
        setTimeout(() => setIsSaving(false), 600);
    };

    const features = [
        { tabId: 1, title: 'Edición en tiempo real', desc: 'Protocolos colaborativos sin bloqueos ni conflictos.' },
        { tabId: 2, title: 'Doble ciego automático', desc: 'Evaluaciones anónimas y transparentes del comité.' },
        { tabId: 3, title: 'Presupuesto modular', desc: 'Control e indicadores de gastos en tiempo real.' },
        { tabId: 4, title: 'Control de distributivo', desc: 'Validación en tiempo real de horas de investigación.' }
    ];

    const selectTabWithAnimation = (tabId: number) => {
        setIsSaving(true);
        setActiveTab(tabId);
        setTimeout(() => setIsSaving(false), 500);
    };

    const triggerCoEdit = () => {
        if (coEditing) return;
        setCoEditing(true);
        setTypedText('');
        setIsSaving(true);
        
        let charsTyped = 0;
        const interval = setInterval(() => {
            charsTyped++;
            setTypedText(fullCoEditText.substring(0, charsTyped));
            if (charsTyped >= fullCoEditText.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsSaving(false);
                    setCoEditing(false);
                }, 1200);
            }
        }, 60);
    };

    const textLength = 348 + typedText.length;
    const lineCount = 14 + (typedText.length > 20 ? 1 : 0);

    return (
        <section id="workspace" className="py-20 lg:-ml-24 lg:-mr-24">
            {/* Título superior al estilo Vercel */}
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl mb-16">
                Un espacio de trabajo <br className="hidden md:inline" /> para el investigador.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                {/* Izquierda (col-span-7): Mockup Interactivo */}
                <div className="lg:col-span-7 border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm select-none">
                    {/* Decoraciones del editor */}
                    <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                            <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
                        </div>
                        <span className="text-[10px] text-text-dim font-mono">Workspace://proyecto-investigacion-ia.doc</span>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-mono transition-all duration-300 ${
                            isSaving 
                                ? 'border-warning/30 bg-warning-subtle text-warning' 
                                : 'border-success/30 bg-success-subtle text-success'
                        }`}>
                            {isSaving ? 'GUARDANDO...' : 'SINCRONIZADO'}
                        </span>
                    </div>

                    {/* Layout del mockup */}
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
                        {/* Panel Izquierdo (Estructura del Proyecto / Pestañas) */}
                        <div className="w-full md:col-span-4 border-b md:border-b-0 md:border-r border-border-thin pb-4 md:pb-0 md:pr-4 space-y-2 text-[10px] text-text-dim">
                            <p className="text-text-main font-semibold mb-2 font-mono">// ESTRUCTURA</p>
                            
                            <button
                                onClick={() => selectTabWithAnimation(1)}
                                className={`w-full text-left p-1.5 rounded border flex items-center justify-between font-sans cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                    activeTab === 1 
                                        ? 'bg-surface border-border-thin text-text-main font-semibold shadow-sm' 
                                        : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                  }`}
                            >
                                <span>1. Resumen</span>
                                <CheckCircle2 size={10} className="text-success" />
                            </button>

                            <button
                                onClick={() => selectTabWithAnimation(2)}
                                className={`w-full text-left p-1.5 rounded border flex items-center justify-between font-sans cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                    activeTab === 2 
                                        ? 'bg-surface border-border-thin text-text-main font-semibold shadow-sm' 
                                        : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                  }`}
                            >
                                <span>2. Metodología</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                            </button>

                            <button
                                onClick={() => selectTabWithAnimation(3)}
                                className={`w-full text-left p-1.5 rounded border flex items-center justify-between font-sans cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                    activeTab === 3 
                                        ? 'bg-surface border-border-thin text-text-main font-semibold shadow-sm' 
                                        : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                  }`}
                            >
                                <span>3. Presupuesto</span>
                                <DollarSign size={10} className="text-brand-light" />
                            </button>

                            <button
                                onClick={() => selectTabWithAnimation(4)}
                                className={`w-full text-left p-1.5 rounded border flex items-center justify-between font-sans cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                    activeTab === 4 
                                        ? 'bg-surface border-border-thin text-text-main font-semibold shadow-sm' 
                                        : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                  }`}
                            >
                                <span>4. Cronograma</span>
                                <CalendarRange size={10} className="text-warning" />
                            </button>
                        </div>

                        {/* Contenido del editor central dinamizado */}
                        <div className="w-full md:col-span-8 space-y-4 font-sans min-h-[220px] flex flex-col justify-between">
                            {activeTab === 1 && (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// LÍNEA DE INVESTIGACIÓN</p>
                                        <p className="text-text-main font-semibold text-[10px]">Desarrollo de Software y Automatización Industrial</p>
                                    </div>
                                    <div className="space-y-1 border-t border-border-thin pt-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// RESUMEN EJECUTIVO (Borrador)</p>
                                            <button 
                                                onClick={triggerCoEdit}
                                                disabled={coEditing}
                                                className="text-[8px] text-brand border border-brand/30 px-1.5 py-0.5 rounded font-bold font-mono cursor-pointer hover:bg-brand/10 transition-colors uppercase disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <PenTool size={8} /> {coEditing ? 'Co-escribiendo...' : 'Simular Co-Edición'}
                                            </button>
                                        </div>
                                        <p className="text-text-dim text-[10px] leading-relaxed">
                                            Este proyecto plantea el diseño de un módulo automatizado de control de procesos en tiempo real para optimizar la eficiencia operativa...
                                            <span className="text-text-main font-semibold">{typedText}</span>
                                            {coEditing ? (
                                                <span className="relative inline-block ml-0.5">
                                                    <span className="w-1 h-3 bg-purple-500 inline-block animate-pulse align-middle" />
                                                    <span className="absolute -top-3.5 left-0 bg-purple-500 text-white text-[5.5px] px-1 rounded whitespace-nowrap font-mono select-none">
                                                        J. Doicela escribiendo
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="w-1.5 h-3 bg-brand inline-block animate-pulse ml-0.5 translate-y-0.5" />
                                            )}
                                        </p>
                                    </div>
                                    <div className="border border-border-thin rounded p-2 bg-surface/50 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                                            <Users size={14} />
                                        </div>
                                        <div className="text-[10px]">
                                            <p className="text-text-main font-semibold font-mono">Docentes Colaborando</p>
                                            <p className="text-text-dim">Ing. M. Cevallos, Ing. J. Doicela</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 2 && (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// METODOLOGÍA & DISEÑO</p>
                                        <p className="text-text-main font-semibold text-[10px]">Desarrollo con Arquitectura Limpia (Clean Architecture)</p>
                                    </div>
                                    <div className="space-y-1 border-t border-border-thin pt-2">
                                        <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// TÉCNICAS A APLICAR</p>
                                        <p className="text-text-dim text-[10px] leading-relaxed">
                                            Se utilizarán WebSockets para la comunicación bidireccional y persistencia optimizada. Implementación de anonimización para revisión doble ciego...
                                            <span className="w-1.5 h-3 bg-success inline-block animate-pulse ml-0.5 translate-y-0.5" />
                                        </p>
                                    </div>
                                    <div className="border border-border-thin rounded p-2 bg-surface/50 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
                                            <BookOpen size={14} />
                                        </div>
                                        <div className="text-[10px]">
                                            <p className="text-text-main font-semibold font-mono">Doble Ciego Habilitado</p>
                                            <p className="text-text-dim">Revisión anónima de protocolos de investigación.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 3 && (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// PRESUPUESTO PROYECTO (Haz clic en ítems)</p>
                                        <span className="text-brand font-bold text-[10px] font-sans">Total: ${activeBudgetTotal.toLocaleString()}.00</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {budgetItems.map((item) => (
                                            <button 
                                                key={item.id}
                                                onClick={() => toggleBudgetItem(item.id)}
                                                className={`p-1.5 border rounded text-left cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                                    item.active 
                                                        ? 'bg-bg-deep border-brand/40 shadow-sm' 
                                                        : 'bg-surface/20 border-border-thin opacity-50 hover:opacity-80'
                                                }`}
                                            >
                                                <p className="text-[7px] text-text-dim font-semibold font-mono">{item.name}</p>
                                                <p className="text-text-main font-bold mt-0.5 font-sans">${item.val.toLocaleString()}.00</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-[8px] font-mono text-text-dim">
                                            <span>Asignación presupuestaria modular</span>
                                            <span>{budgetPct}% (${activeBudgetTotal} / ${budgetMax})</span>
                                        </div>
                                        <div className="w-full bg-border-thin h-2 rounded-full overflow-hidden flex gap-[1px]">
                                            <div 
                                                className="h-full bg-brand transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                                                style={{ width: budgetItems[0].active ? `${(budgetItems[0].val / budgetMax) * 100}%` : '0%' }}
                                            />
                                            <div 
                                                className="h-full bg-warning transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                                                style={{ width: budgetItems[1].active ? `${(budgetItems[1].val / budgetMax) * 100}%` : '0%' }}
                                            />
                                            <div 
                                                className="h-full bg-success transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                                                style={{ width: budgetItems[2].active ? `${(budgetItems[2].val / budgetMax) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 4 && (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="flex justify-between items-center border-b border-border-thin pb-1">
                                        <p className="text-[10px] text-text-dim uppercase tracking-wider font-mono">// CRONOGRAMA DE HITOS (Haz clic para cambiar estado)</p>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        {timelinePhases.map((phase, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => cyclePhaseStatus(idx)}
                                                className="w-full p-1.5 border border-border-thin rounded bg-bg-deep flex justify-between items-center text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/40 cursor-pointer font-sans"
                                            >
                                                <span className="text-[9px] text-text-main font-medium">{phase.name}</span>
                                                <span className={`text-[7.5px] border px-2 py-0.5 rounded font-mono uppercase font-semibold transition-all duration-300 ${phase.color}`}>
                                                    {phase.status}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Gantt Chart reactive preview */}
                                    <div className="border border-border-thin/60 rounded p-2 bg-bg-deep/40 space-y-1.5 font-mono text-[8px]">
                                        <div className="flex justify-between text-text-dim border-b border-border-thin/35 pb-1">
                                            <span>CRONOGRAMA GANTT</span>
                                            <span>DÍAS 1 - 45</span>
                                        </div>
                                        <div className="space-y-1 font-sans">
                                            <div className="flex items-center gap-2">
                                                <span className="w-16 truncate text-text-dim text-[7.5px]">Requerimientos</span>
                                                <div className="flex-1 bg-surface/30 h-2 rounded-sm relative overflow-hidden">
                                                    <div 
                                                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-sm ${
                                                            timelinePhases[0].status === 'Completado' 
                                                                ? 'bg-success w-[25%]' 
                                                                : timelinePhases[0].status === 'En Proceso' 
                                                                    ? 'bg-warning w-[25%] animate-pulse' 
                                                                    : 'bg-text-dim/20 w-0'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-16 truncate text-text-dim text-[7.5px]">Core Dev</span>
                                                <div className="flex-1 bg-surface/30 h-2 rounded-sm relative overflow-hidden">
                                                    <div 
                                                        className={`absolute left-[25%] top-0 h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-sm ${
                                                            timelinePhases[1].status === 'Completado' 
                                                                ? 'bg-success w-[50%]' 
                                                                : timelinePhases[1].status === 'En Proceso' 
                                                                    ? 'bg-warning w-[50%] animate-pulse' 
                                                                    : 'bg-text-dim/20 w-0'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-16 truncate text-text-dim text-[7.5px]">Acreditación</span>
                                                <div className="flex-1 bg-surface/30 h-2 rounded-sm relative overflow-hidden">
                                                    <div 
                                                        className={`absolute left-[75%] top-0 h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-sm ${
                                                            timelinePhases[2].status === 'Completado' 
                                                                ? 'bg-success w-[25%]' 
                                                                : timelinePhases[2].status === 'En Proceso' 
                                                                    ? 'bg-warning w-[25%] animate-pulse' 
                                                                    : 'bg-text-dim/20 w-0'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fila de logs de estadísticas en vivo */}
                            <div className="flex justify-between items-center text-[8px] text-text-dim/80 pt-2 border-t border-border-thin/40 font-mono">
                                <span>LÍNEAS: {activeTab === 1 ? lineCount : activeTab === 2 ? '16' : activeTab === 3 ? '22' : '28'} | CARACTERES: {activeTab === 1 ? textLength : activeTab === 2 ? '412' : activeTab === 3 ? '250' : '390'}</span>
                                <span className="flex items-center gap-1">
                                    <span className={`w-1 h-1 rounded-full ${isSaving ? 'bg-warning animate-ping' : 'bg-success'}`} />
                                    {isSaving ? 'Guardando en la nube...' : 'Sincronizado'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Derecha (col-span-5): Párrafo descriptivo y menú de características */}
                <div className="lg:col-span-5 space-y-8">
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        Olvídate de los formularios rígidos secuenciales. DIITRA implementa un entorno dinámico donde coordinadores, docentes y estudiantes redactan propuestas, planifican el presupuesto y configuran hitos de forma simultánea.
                    </p>

                    <div className="space-y-4">
                        <span className="font-mono text-[10px] text-text-dim/80 uppercase tracking-[0.2em] font-semibold block">// Características</span>
                        <div className="flex flex-col border-t border-border-thin divide-y divide-border-thin">
                            {features.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectTabWithAnimation(item.tabId)}
                                    className={`py-4 border-b border-border-thin flex justify-between items-center w-full text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 cursor-pointer ${
                                        activeTab === item.tabId ? 'translate-x-2 text-brand font-semibold' : 'text-text-dim'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {activeTab === item.tabId && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping shrink-0" />}
                                        <div className="space-y-1">
                                            <span className={`font-mono text-[11px] font-bold tracking-wider uppercase block transition-colors ${
                                                activeTab === item.tabId ? 'text-brand' : 'text-text-main'
                                            }`}>{item.title}</span>
                                            <span className="text-[10px] text-text-dim block leading-none">{item.desc}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${
                                        activeTab === item.tabId ? 'text-brand font-bold' : 'text-text-dim'
                                    }`}>0{idx + 1}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Workspace;
