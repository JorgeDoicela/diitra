import React, { useState, useRef } from 'react';
import {
    ArrowRight, Activity, Clock, ShieldCheck, Sun, Moon, Cpu,
    Users, Fingerprint, Scale, FileSignature, LayoutDashboard,
    Globe, MessageSquareCode, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Landing = ({ currentTheme, toggleTheme }: LandingProps) => {
    const navigate = useNavigate();
    const [isRainbow, setIsRainbow] = useState(false);

    return (
        <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-selection-bg selection:text-selection-fg transition-all duration-500 overflow-x-hidden relative">

            {/* Grid Overlay de fondo al estilo Vercel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-bg-deep to-bg-deep -z-10" />

            {/* Header Navigation */}
            <nav className="fixed top-0 w-full z-[60] border-b border-border-thin bg-bg-deep/70 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <img
                            src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                            alt="DIITRA Logo"
                            className="h-7 w-auto object-contain"
                        />
                        <div className="hidden md:flex items-center gap-6 text-[11px] font-medium text-text-dim">
                            <a href="#workspace" className="hover:text-text-main transition-colors">Workspace</a>
                            <a href="#caces" className="hover:text-text-main transition-colors">Acreditación</a>
                            <a href="#modulos" className="hover:text-text-main transition-colors">Módulos</a>
                            <a href="#roles" className="hover:text-text-main transition-colors">Estructura</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 text-text-dim hover:text-text-main transition-colors rounded-md hover:bg-surface-hover/30">
                            {currentTheme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-text-main text-bg-deep px-4 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all border border-transparent active:scale-95"
                        >
                            Acceder
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Space */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-40 space-y-32">

                {/* Hero Section Container (Estilo Vercel, Ticker centrado abajo) */}
                <section className="min-h-[80vh] flex flex-col justify-between py-8 relative">

                    {/* El grid principal de 3 columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto relative">

                        {/* Columna Izquierda: Mensaje y Call To Actions */}
                        <div className="lg:col-span-5 space-y-7 z-10 animate-fade-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin bg-surface-hover/20 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                                <Activity size={10} className="text-brand animate-pulse" />
                                <span>Tecnológico Traversari — ISTPET</span>
                            </div>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold text-text-main tracking-tighter leading-[0.85] lg:whitespace-nowrap">
                                Investigación <br />
                                & Innovación.
                            </h1>
                            <p className="text-xs md:text-sm text-text-dim/80 max-w-sm font-medium leading-relaxed">
                                DIITRA es el ecosistema inteligente del Tecnológico Traversari diseñado para estructurar, firmar y reportar la producción científica bajo la normativa del CACES, CES y SENESCYT.
                            </p>
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm"
                                >
                                    Iniciar Gestión
                                    <ArrowRight size={12} />
                                </button>
                                <a
                                    href="#caces"
                                    className="flex items-center justify-center gap-2 bg-transparent text-text-main px-6 py-2.5 rounded-full border border-border-thin text-[10px] font-bold uppercase tracking-widest hover:bg-surface-hover/40 hover:border-border-hover transition-all cursor-pointer"
                                >
                                    Normativa IST
                                </a>
                            </div>
                        </div>

                        {/* Columna Central: Logo de DIITRA */}
                        <div className="lg:col-span-4 flex justify-center items-center relative py-16 lg:py-0 select-none min-h-[400px] overflow-visible">
                            {/* ── Glow centrado en el logo (solo cuando !isRainbow) ── */}
                            {/* Brillo de ambiente muy suave y amplio en el fondo */}
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    width: currentTheme === 'dark' ? '600px' : '450px',
                                    height: currentTheme === 'dark' ? '600px' : '450px',
                                    transform: 'translate(-50%, -50%)',
                                    background: currentTheme === 'dark'
                                        ? 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(200,220,255,0.02) 50%, transparent 80%)'
                                        : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.90) 35%, rgba(255,255,255,0.40) 60%, transparent 75%)',
                                    filter: currentTheme === 'dark' ? 'blur(80px)' : 'blur(35px)',
                                    borderRadius: '50%',
                                    opacity: isRainbow ? 0 : 1,
                                    transition: 'opacity 0.5s ease',
                                    zIndex: 0,
                                }}
                            />

                            {/* ── Glow Vercel-style: intenso en centro, desvanece hacia afuera ── */}
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    width: '700px',
                                    height: '700px',
                                    left: '50%',
                                    top: '50%',
                                    transform: isRainbow
                                        ? 'translate(-50%, -50%) scale(1)'
                                        : 'translate(-50%, -50%) scale(0.85)',
                                    opacity: isRainbow ? 1 : 0,
                                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                                    zIndex: 0,
                                }}
                            >
                                {/* Rosa/Pink — arriba izquierda */}
                                <div style={{
                                    position: 'absolute',
                                    top: '210px', left: '270px',
                                    width: '350px', height: '350px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(255, 80, 160, 0.90) 0%, rgba(255, 100, 180, 0.55) 25%, rgba(255, 140, 200, 0.20) 50%, transparent 72%)',
                                    filter: 'blur(45px)',
                                    borderRadius: '50%',
                                }} />
                                {/* Azul/Blue — arriba derecha */}
                                <div style={{
                                    position: 'absolute',
                                    top: '210px', left: '430px',
                                    width: '340px', height: '340px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(60, 120, 255, 0.88) 0%, rgba(80, 140, 255, 0.50) 25%, rgba(120, 170, 255, 0.18) 50%, transparent 72%)',
                                    filter: 'blur(45px)',
                                    borderRadius: '50%',
                                }} />
                                {/* Verde/Cian — abajo derecha */}
                                <div style={{
                                    position: 'absolute',
                                    top: '440px', left: '430px',
                                    width: '360px', height: '350px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(40, 220, 180, 0.88) 0%, rgba(60, 230, 190, 0.50) 25%, rgba(100, 240, 210, 0.18) 50%, transparent 72%)',
                                    filter: 'blur(45px)',
                                    borderRadius: '50%',
                                }} />
                                {/* Amarillo/Verde — abajo izquierda */}
                                <div style={{
                                    position: 'absolute',
                                    top: '440px', left: '270px',
                                    width: '320px', height: '310px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(200, 240, 80, 0.75) 0%, rgba(180, 230, 100, 0.40) 25%, rgba(200, 240, 140, 0.15) 50%, transparent 70%)',
                                    filter: 'blur(45px)',
                                    borderRadius: '50%',
                                }} />
                                {/* Brillo blanco intenso — convergencia central */}
                                <div style={{
                                    position: 'absolute',
                                    top: '350px', left: '350px',
                                    width: '240px', height: '240px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.80) 20%, rgba(255,255,255,0.35) 45%, transparent 70%)',
                                    filter: 'blur(18px)',
                                    borderRadius: '50%',
                                }} />
                            </div>

                            {/* Logo encima de todo */}
                            <button
                                onClick={() => setIsRainbow(!isRainbow)}
                                className="relative flex justify-center items-center group active:scale-95 transition-all duration-300 focus:outline-none cursor-pointer"
                                style={{ zIndex: 1 }}
                                title={isRainbow ? 'Haz clic para desactivar' : 'Haz clic para activar el modo de innovación'}
                            >
                                <img
                                    src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                                    alt="DIITRA Logo"
                                    className="h-44 md:h-[220px] w-auto object-contain select-none transition-all duration-500 group-hover:scale-105"
                                    style={{
                                        filter: !isRainbow
                                            ? currentTheme === 'dark'
                                                ? 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 35px rgba(200, 220, 255, 0.35))'
                                                : 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.14)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08))'
                                            : 'none'
                                    }}
                                />
                            </button>
                        </div>

                        {/* Columna Derecha: Bloque Técnico Monospace (Estilo Vercel) */}
                        <div className="lg:col-span-3 hidden lg:flex flex-col justify-center gap-8 text-[10px] tracking-[0.2em] font-mono text-text-dim text-left uppercase">
                            <div className="space-y-1.5">
                                <p className="text-text-main font-bold">// REGULACIÓN NACIONAL</p>
                                <p className="text-[9px] text-text-dim/70">RÉGIMEN ACADÉMICO CES</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-text-main font-bold">// ASEGURAMIENTO CALIDAD</p>
                                <p className="text-[9px] text-text-dim/70">EVALUACIÓN CACES 2024-2026</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-text-main font-bold">// VINCULACIÓN PRÁCTICA</p>
                                <p className="text-[9px] text-text-dim/70">INNOVACIÓN APLICADA IST</p>
                            </div>
                        </div>

                    </div>

                    {/* Ticker / Logos de Instituciones Integradas Centrados abajo, estilo Vercel */}
                    <div className="w-full pt-12 flex flex-wrap justify-center items-center gap-x-16 gap-y-6 text-[10px] font-mono tracking-[0.25em] text-text-dim/40 select-none border-t border-border-thin/40">
                        {['SENESCYT', 'CES', 'CACES', 'SENADI', 'FIRMA.EC', 'DSPACE'].map((org) => (
                            <span
                                key={org}
                                className="hover:text-text-main transition-colors duration-300 cursor-pointer"
                            >
                                {org}
                            </span>
                        ))}
                    </div>

                </section>

                {/* Section: Workspace Colaborativo (Notion style) */}
                <section id="workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 items-center">

                    {/* Izquierda: Título y descripción */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-dim uppercase tracking-wider">
                            <span>01 / Ecosistema Colaborativo</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[0.95] text-text-main">
                            Un espacio de trabajo para el investigador.
                        </h2>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            Olvídate de los formularios rígidos secuenciales. DIITRA implementa un entorno dinámico donde coordinadores, docentes y estudiantes redactan propuestas, planifican el presupuesto y configuran hitos de forma simultánea.
                        </p>

                        {/* Lista de sub-características */}
                        <div className="space-y-3 pt-2">
                            {[
                                'Edición colaborativa en tiempo real de protocolos.',
                                'Ananonimización automática para evaluación doble ciego.',
                                'Construcción modular de metodología, cronograma y presupuesto.'
                            ].map((text, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[11px] text-text-dim">
                                    <CheckCircle2 size={13} className="text-text-main mt-0.5" />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Derecha: Mockup Interactivo de la Interfaz en HTML/CSS */}
                    <div className="lg:col-span-7 border border-border-thin rounded-xl bg-surface/35 shadow-xl p-4 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm group hover:border-border-hover transition-all duration-300">
                        {/* Decoraciones del editor */}
                        <div className="flex items-center justify-between border-b border-border-thin pb-3 mb-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
                                <span className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                                <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
                            </div>
                            <span className="text-[10px] text-text-dim">Workspace://proyecto-investigacion-ia.doc</span>
                            <span className="px-2 py-0.5 rounded border border-success/30 bg-success-subtle text-success text-[9px]">EN EDICIÓN</span>
                        </div>

                        {/* Layout del mockup */}
                        <div className="grid grid-cols-12 gap-4">
                            {/* Panel Izquierdo (Estructura del Proyecto) */}
                            <div className="col-span-4 border-r border-border-thin pr-4 space-y-2 text-[10px] text-text-dim">
                                <p className="text-text-main font-semibold mb-2">// ESTRUCTURA</p>
                                <div className="p-1.5 rounded bg-surface border border-border-thin text-text-main flex items-center justify-between">
                                    <span>1. Resumen Ejecutivo</span>
                                    <CheckCircle2 size={10} className="text-success" />
                                </div>
                                <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                                    <span>2. Metodología</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                                </div>
                                <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                                    <span>3. Presupuesto</span>
                                    <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                                </div>
                                <div className="p-1.5 rounded hover:bg-surface/50 border border-transparent flex items-center justify-between cursor-pointer">
                                    <span>4. Cronograma (Gantt)</span>
                                    <span className="text-[8px] border border-border-thin px-1 rounded">PEND</span>
                                </div>
                            </div>

                            {/* Contenido del editor central */}
                            <div className="col-span-8 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-text-dim uppercase tracking-wider">// LÍNEA DE INVESTIGACIÓN</p>
                                    <p className="text-text-main font-semibold">Desarrollo de Software y Automatización Industrial</p>
                                </div>
                                <div className="space-y-1 border-t border-border-thin pt-2">
                                    <p className="text-[10px] text-text-dim uppercase tracking-wider">// RESUMEN EJECUTIVO (Borrador)</p>
                                    <p className="text-text-dim text-[10px] leading-relaxed">
                                        Este proyecto plantea el diseño de un módulo automatizado de control de procesos en tiempo real para optimizar la eficiencia operativa...
                                    </p>
                                </div>
                                <div className="border border-border-thin rounded p-2 bg-surface/50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                        <Users size={14} />
                                    </div>
                                    <div className="text-[10px]">
                                        <p className="text-text-main font-semibold">Docentes Colaborando</p>
                                        <p className="text-text-dim">Ing. M. Cevallos, Ing. J. Doicela</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Section: Acreditacion CACES (Zapier style) */}
                <section id="caces" className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 items-center">

                    {/* Izquierda: Mockup en HTML/CSS de Indicadores CACES */}
                    <div className="lg:col-span-7 order-last lg:order-first border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm group hover:border-border-hover transition-all duration-300">
                        {/* Decoraciones del panel */}
                        <div className="flex items-center justify-between border-b border-border-thin pb-3 mb-4">
                            <span className="text-[10px] font-semibold text-text-main">// PANEL INDICADORES CACES (SIIES)</span>
                            <span className="text-[9px] text-text-dim">AÑO DE EVALUACIÓN: 2026</span>
                        </div>

                        {/* Indicadores listados */}
                        <div className="space-y-4">
                            {/* Indicador 1 */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-text-main">I+D+i: Proyectos de Investigación Aplicada</span>
                                    <span className="text-success font-semibold">100% CUMPLIDO</span>
                                </div>
                                <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-full" />
                                </div>
                            </div>

                            {/* Indicador 2 */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-text-main">Vinculación: Proyectos Sociales y Productivos</span>
                                    <span className="text-success font-semibold">85% EXCELENTE</span>
                                </div>
                                <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-[85%]" />
                                </div>
                            </div>

                            {/* Indicador 3 */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-text-main">Propiedad Intelectual: Patentes y Registros SENADI</span>
                                    <span className="text-warning font-semibold">60% EN PROGRESO</span>
                                </div>
                                <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                    <div className="h-full bg-warning w-[60%]" />
                                </div>
                            </div>
                        </div>

                        {/* Export block */}
                        <div className="mt-6 pt-4 border-t border-border-thin flex justify-between items-center bg-surface/20 p-2.5 rounded border border-border-thin">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-brand" />
                                <span className="text-[10px] text-text-main font-semibold">Reporte_Evidencias_CACES.csv</span>
                            </div>
                            <button className="px-3 py-1 rounded bg-text-main text-bg-deep font-semibold text-[9px] hover:opacity-90 active:scale-95 transition-all">
                                EXPORTAR SIIES
                            </button>
                        </div>
                    </div>

                    {/* Derecha: Título y descripción */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-dim uppercase tracking-wider">
                            <span>02 / Evaluación de Calidad</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[0.95] text-text-main">
                            Diseñado para superar la auditoría CACES.
                        </h2>
                        <p className="text-xs text-text-dim leading-relaxed font-medium">
                            El sistema genera automáticamente la documentación de soporte exigida por los evaluadores en el Modelo de Acreditación de Institutos. Exporta reportes listos en formato compatible con el SIIES.
                        </p>
                        <div className="space-y-3 pt-2">
                            {[
                                'Consolidación de evidencias de avance mensuales.',
                                'Control de horas del distributivo docente.',
                                'Reporte unificado de convenios y productos de desarrollo.'
                            ].map((text, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[11px] text-text-dim">
                                    <CheckCircle2 size={13} className="text-text-main mt-0.5" />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                {/* Section: Bento Grid Modulos (Geist / Vercel layout) */}
                <section id="modulos" className="space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tighter text-text-main">Módulos de Automatización</h2>
                        <div className="h-[2px] w-12 bg-text-main" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* A: Proyectos */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Fase_Convocatoria</span>
                            </div>
                            <div className="mt-12 space-y-2">
                                <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                                    Postulación & Peer Review
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Formularios simplificados con Gantt y presupuestos integrados. Asignación automatizada de revisores doble ciego bajo actas firmadas digitalmente.
                                </p>
                            </div>
                        </div>

                        {/* B: Seguimiento */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <Clock size={18} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Monitoreo_Docente</span>
                            </div>
                            <div className="mt-12 space-y-2">
                                <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                                    Seguimiento & Distributivo
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Verificación mensual de horas de investigación mediante carga de evidencias de hito. Control diario de la ejecución presupuestaria del proyecto.
                                </p>
                            </div>
                        </div>

                        {/* C: Innovacion */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Propiedad_Intelectual</span>
                            </div>
                            <div className="mt-12 space-y-2">
                                <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                                    SENADI & Repositorio
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Gestión del registro de derechos de autor y propiedad intelectual de desarrollos del ISTPET. Integración con DSpace para difusión del conocimiento.
                                </p>
                            </div>
                        </div>

                        {/* D: Calidad */}
                        <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                                    <ShieldCheck size={18} strokeWidth={1.5} className="text-text-main" />
                                </div>
                                <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Evaluación_Externa</span>
                            </div>
                            <div className="mt-12 space-y-2">
                                <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                                    Acreditación & Reportes
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Automatización de la recopilación de evidencias. Dashboard con el estado del cumplimiento del modelo de evaluación del CACES en tiempo real.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Roles (The Flow) */}
                <section id="roles" className="py-24 border-y border-border-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold tracking-tighter leading-tight text-text-main">
                                Estructura & Niveles <br /> de Acceso.
                            </h2>
                            <p className="text-[10px] text-text-dim leading-relaxed font-mono uppercase tracking-widest">
                                Gestión de flujos institucionales con roles claramente definidos.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { role: 'Investigador', desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', icon: Users },
                                { role: 'Director de Investigación', desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', icon: LayoutDashboard },
                                { role: 'Comité de Ética / Revisores', desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética.', icon: Scale },
                                { role: 'Administrador', desc: 'Configuración de períodos académicos, líneas de investigación e integraciones externas.', icon: ShieldCheck },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-lg border border-border-thin bg-surface/10 hover:border-border-hover transition-colors group">
                                    <div className="mt-1 p-2 rounded bg-surface border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-text-main transition-all flex-shrink-0">
                                        <item.icon size={14} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-[11px] font-semibold text-text-main uppercase tracking-widest">{item.role}</h5>
                                        <p className="text-[10px] text-text-dim leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section: Firma y Tecnologia */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bento-card static p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 border border-border-thin rounded bg-bg-deep text-text-main">
                                <FileSignature size={18} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-text-main">Firma Electrónica IST</h3>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            Integración nativa con archivos **.p12**. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa ante entes evaluadores.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                            <Fingerprint size={12} />
                            <span>Integración Segura FirmaEC</span>
                        </div>
                    </div>
                    <div className="bento-card static p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 border border-border-thin rounded bg-bg-deep text-text-main">
                                <Cpu size={18} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-text-main">Automatización e IA</h3>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            Verificación de formato en propuestas previas al envío y asistencia para mapear de manera precisa los proyectos a las líneas de investigación institucionales válidas.
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-text-main uppercase font-semibold">
                            <MessageSquareCode size={12} />
                            <span>Control Automatizado</span>
                        </div>
                    </div>
                </section>

                {/* Section: Interoperabilidad */}
                <section className="text-center space-y-8 py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-thin text-[10px] font-mono text-text-dim uppercase bg-surface/50">
                        <Globe size={10} />
                        Sincronización de Datos
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold tracking-tighter text-text-main">
                        Conectado con su <br /> Gestión Académica.
                    </h3>
                    <p className="text-xs text-text-dim max-w-md mx-auto leading-relaxed">
                        DIITRA se acopla a las bases de datos académicas para validar en tiempo real los distributivos y horas asignadas a investigación de cada docente del Tecnológico Traversari.
                    </p>
                </section>

            </main>

            {/* Detailed Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-border-thin text-text-dim">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <img
                                src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                                alt="DIITRA Logo"
                                className="h-9 w-auto object-contain"
                            />
                        </div>
                        <p className="text-[10px] max-w-xs leading-relaxed font-mono">
                            Tecnológico Traversari, Quito - Ecuador. <br />
                            Automatización de procesos científicos e innovación tecnológica institucional.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-[10px] font-mono uppercase tracking-[0.2em] font-semibold">
                        <div className="space-y-4 flex flex-col">
                            <span className="text-text-main font-bold">// Recursos</span>
                            <a href="#" className="hover:text-text-main transition-colors">DSpace</a>
                            <a href="#" className="hover:text-text-main transition-colors">SENESCYT</a>
                            <a href="#" className="hover:text-text-main transition-colors">Normativas</a>
                        </div>
                        <div className="space-y-4 flex flex-col">
                            <span className="text-text-main font-bold">// Soporte</span>
                            <a href="#" className="hover:text-text-main transition-colors">Ayuda</a>
                            <a href="#" className="hover:text-text-main transition-colors">Seguridad</a>
                            <a href="#" className="hover:text-text-main transition-colors">CACES</a>
                        </div>
                    </div>
                </div>
                <div className="mt-20 pt-10 border-t border-border-thin flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono">
                    <span>© {new Date().getFullYear()} DIITRA. TODOS LOS DERECHOS RESERVADOS.</span>
                    <span className="text-text-dim">TECNOLÓGICO TRAVERSARI - ISTPET</span>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
