import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
    currentTheme: 'dark' | 'light';
}

const Hero: React.FC<HeroProps> = ({ currentTheme }) => {
    const navigate = useNavigate();
    const [isRainbow, setIsRainbow] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [clickedIndex, setClickedIndex] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const isHoveringRef = useRef(false);
    const lastAngleRef = useRef(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        const normX = x / (rect.width / 2);
        const normY = y / (rect.height / 2);
        const dist = Math.min(Math.sqrt(normX * normX + normY * normY), 1.5);

        let angle = Math.atan2(y, x) * (180 / Math.PI);

        if (!isHoveringRef.current) {
            isHoveringRef.current = true;
            lastAngleRef.current = angle;
        } else {
            let diff = angle - lastAngleRef.current;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            angle = lastAngleRef.current + diff;
            lastAngleRef.current = angle;
        }

        const el = containerRef.current;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
        el.style.setProperty('--norm-x', `${normX}`);
        el.style.setProperty('--norm-y', `${normY}`);
        el.style.setProperty('--angle', `${angle}deg`);
        el.style.setProperty('--dist', `${dist}`);
    };

    const handleMouseLeave = () => {
        isHoveringRef.current = false;
        if (!containerRef.current) return;
        const el = containerRef.current;
        el.style.setProperty('--mouse-x', '0px');
        el.style.setProperty('--mouse-y', '0px');
        el.style.setProperty('--norm-x', '0');
        el.style.setProperty('--norm-y', '0');
        el.style.setProperty('--angle', '0deg');
        el.style.setProperty('--dist', '0');
    };

    const rightColumnData = [
        {
            title: 'ECOSISTEMA INTELIGENTE',
            collapsed: 'TECNOLÓGICO TRAVERSARI',
            expanded: 'DIITRA ES EL ECOSISTEMA INTELIGENTE DEL TECNOLÓGICO TRAVERSARI.'
        },
        {
            title: 'GESTIÓN CIENTÍFICA',
            collapsed: 'FIRMA Y ACREDITACIÓN',
            expanded: 'GESTIÓN, FIRMA Y ACREDITACIÓN DE LA PRODUCCIÓN CIENTÍFICA INSTITUCIONAL DE FORMA INTELIGENTE Y AUTOMATIZADA.'
        },
        {
            title: 'ASEGURAMIENTO CALIDAD',
            collapsed: 'EVALUACIÓN CACES 2024-2026',
            expanded: 'DISEÑADO PARA ESTRUCTURAR, FIRMAR Y REPORTAR LA PRODUCCIÓN CIENTÍFICA.'
        },
        {
            title: 'REGULACIÓN NACIONAL',
            collapsed: 'RÉGIMEN ACADÉMICO CES',
            expanded: 'BAJO LA NORMATIVA DEL CACES, CES Y SENESCYT.'
        }
    ];

    const institutionalLogos = [
        {
            name: 'SENESCYT',
            icon: (
                <svg className="w-6.5 h-6.5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            ),
            text: <span className="font-sans font-extrabold tracking-tight text-[16px]">SENESCYT</span>
        },
        {
            name: 'CES',
            icon: (
                <svg className="w-5.5 h-5.5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19h16M4 5h16M7 5v14M12 5v14M17 5v14" />
                </svg>
            ),
            text: <span className="font-serif font-bold italic tracking-wide text-[18px]">CES</span>
        },
        {
            name: 'CACES',
            icon: (
                <svg className="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14 9 11" />
                </svg>
            ),
            text: <span className="font-mono font-bold tracking-tighter text-[13px]">CACES</span>
        },
        {
            name: 'SENADI',
            icon: (
                <svg className="w-6.5 h-6.5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20" />
                </svg>
            ),
            text: <span className="font-sans font-light tracking-[0.10em] text-[16px]">SENA<strong className="font-bold">DI</strong></span>
        },
        {
            name: 'FIRMA.EC',
            icon: (
                <svg className="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
            ),
            text: <span className="font-sans font-black italic tracking-tighter text-[16px]">firma<span className="text-brand">.ec</span></span>
        },
        {
            name: 'DSPACE',
            icon: (
                <svg className="w-6.5 h-6.5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                    <path d="M12 22.08V12" />
                </svg>
            ),
            text: <span className="font-sans font-bold tracking-tight text-[16px]">DSPACE</span>
        }
    ];

    const activeIndex = hoveredIndex !== null ? hoveredIndex : clickedIndex;
    const hasActive = activeIndex !== null;

    return (
        <section className="h-[calc(100vh-7.5rem)] min-h-[550px] flex flex-col justify-between pt-4 pb-2 relative">

            {/* El grid principal de 3 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto relative">

                {/* Columna Izquierda: Mensaje y Call To Actions */}
                <div className="lg:col-span-4 space-y-7 z-10 animate-fade-up lg:-ml-24">
                    <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                        <span>Tecnológico Traversari — ISTPET</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal text-text-main tracking-tighter leading-[0.85] lg:whitespace-nowrap">
                        Investigación <br />
                        & Innovación.
                    </h1>
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

                {/* Espaciador central para mantener la estructura del grid de 12 columnas en desktop */}
                <div className="lg:col-span-4 hidden lg:block pointer-events-none h-[400px]" />

                {/* Columna Central: Logo de DIITRA */}
                <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[400px] lg:h-[400px] flex justify-center items-center relative py-16 lg:py-0 select-none min-h-[400px] overflow-visible logo-container z-20"
                >
                    {/* =========================================================================
                        [MODO 1: SIN COLORES] (isRainbow === false)
                        - Brillo de fondo monocromático/blanco centrado en el logo.
                        - Sigue suavemente al cursor y reacciona al movimiento.
                        ========================================================================= */}
                    {/* Capa 1: Brillo de fondo amplio y dinámico de colores */}
                    {currentTheme === 'dark' ? (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                opacity: isRainbow ? 0 : 1,
                                transform: isRainbow ? 'scale(0.3) rotate(-10deg)' : 'scale(1) rotate(0deg)',
                                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                                zIndex: 0
                            }}
                        >
                            {/* Luz Rosa (Arriba-Izquierda) */}
                            <div
                                className="absolute pointer-events-none glow-bulb"
                                style={{
                                    left: '30%',
                                    top: '30%',
                                    width: '650px',
                                    height: '650px',
                                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
                                    transform: 'translate(calc(-50% + var(--mouse-x, 0px) * 0.15), calc(-50% + var(--mouse-y, 0px) * 0.15)) scale(calc(1 - var(--norm-x, 0) * 0.60 - var(--norm-y, 0) * 0.60))',
                                    filter: 'blur(calc(90px - var(--dist, 0) * 15px))',
                                    borderRadius: '50%',
                                }}
                            />
                            {/* Luz Cian (Abajo-Derecha) */}
                            <div
                                className="absolute pointer-events-none glow-bulb"
                                style={{
                                    left: '70%',
                                    top: '70%',
                                    width: '650px',
                                    height: '650px',
                                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, transparent 70%)',
                                    transform: 'translate(calc(-50% + var(--mouse-x, 0px) * 0.15), calc(-50% + var(--mouse-y, 0px) * 0.15)) scale(calc(1 + var(--norm-x, 0) * 0.60 + var(--norm-y, 0) * 0.60))',
                                    filter: 'blur(calc(90px - var(--dist, 0) * 15px))',
                                    borderRadius: '50%',
                                }}
                            />
                            {/* Luz Verde (Abajo-Centro) */}
                            <div
                                className="absolute pointer-events-none glow-bulb"
                                style={{
                                    left: '50%',
                                    top: '80%',
                                    width: '550px',
                                    height: '550px',
                                    background: 'radial-gradient(circle, rgba(14, 116, 144, 0.08) 0%, transparent 70%)',
                                    transform: 'translate(calc(-50% + var(--mouse-x, 0px) * 0.10), calc(-50% + var(--mouse-y, 0px) * 0.15)) scale(calc(1 + var(--norm-y, 0) * 0.70))',
                                    filter: 'blur(calc(80px - var(--dist, 0) * 15px))',
                                    borderRadius: '50%',
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className="absolute pointer-events-none glow-core"
                            style={{
                                left: '50%',
                                top: '50%',
                                width: '700px',
                                height: '700px',
                                transform: isRainbow
                                    ? 'translate(-50%, -50%) scale(0.25)'
                                    : 'translate(calc(-50% + var(--mouse-x, 0px) * 0.12), calc(-50% + var(--mouse-y, 0px) * 0.12)) scale(calc(1 + var(--dist, 0) * 0.06))',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 80%)',
                                filter: 'blur(calc(70px - var(--dist, 0) * 10px))',
                                borderRadius: '50%',
                                opacity: isRainbow ? 0 : 1,
                                zIndex: 0,
                            }}
                        />
                    )}

                    {/* Capa 2: Haces de luz monocromáticos */}
                    <div
                        className="absolute pointer-events-none glow-conic"
                        style={{
                            left: '50%',
                            top: '50%',
                            width: currentTheme === 'dark' ? '700px' : '600px',
                            height: currentTheme === 'dark' ? '700px' : '600px',
                            transform: isRainbow
                                ? 'translate(-50%, -50%) scale(0.25)'
                                : 'translate(calc(-50% + var(--mouse-x, 0px) * 0.08), calc(-50% + var(--mouse-y, 0px) * 0.08)) scale(calc(1 + var(--dist, 0) * 0.06)) rotate(var(--angle, 0deg))',
                            opacity: isRainbow ? 0 : 'calc(0.25 + var(--dist, 0) * 0.65)',
                            zIndex: 0,
                        }}
                    >
                        <div
                            className="w-full h-full"
                            style={{
                                background: currentTheme === 'dark'
                                    ? `conic-gradient(
                                        from 0deg at 50% 50%,
                                        transparent 15deg,
                                        rgba(139, 92, 246, 0.18) 50deg,
                                        rgba(37, 99, 235, 0.50) 90deg,
                                        rgba(14, 116, 144, 0.18) 130deg,
                                        transparent 165deg
                                    )`
                                    : `conic-gradient(
                                        from 0deg at 50% 50%,
                                        transparent 15deg,
                                        rgba(255, 255, 255, 0.70) 50deg,
                                        rgba(255, 255, 255, 0.95) 90deg,
                                        rgba(255, 255, 255, 0.70) 130deg,
                                        transparent 165deg
                                    )`,
                                filter: currentTheme === 'dark' ? 'blur(calc(30px - var(--dist, 0) * 10px))' : 'blur(calc(24px - var(--dist, 0) * 6px))',
                                maskImage: 'radial-gradient(circle, black 25%, transparent 60%)',
                                WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 60%)',
                                animation: isRainbow ? 'none' : 'glow-pulse 10s ease-in-out infinite',
                            }}
                        />
                    </div>

                    {/* Capa 3: Brillo central de alta intensidad */}
                    <div
                        className="absolute pointer-events-none glow-core"
                        style={{
                            left: '50%',
                            top: '50%',
                            width: currentTheme === 'dark' ? '300px' : '240px',
                            height: currentTheme === 'dark' ? '300px' : '240px',
                            transform: isRainbow
                                ? 'translate(-50%, -50%) scale(0.25)'
                                : 'translate(calc(-50% + var(--mouse-x, 0px) * 0.32), calc(-50% + var(--mouse-y, 0px) * 0.32)) scale(calc(1 + var(--dist, 0) * 0.15))',
                            background: currentTheme === 'dark'
                                ? 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(99, 102, 241, 0.35) 25%, rgba(37, 99, 235, 0.10) 55%, transparent 75%)'
                                : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.90) 25%, transparent 60%)',
                            filter: currentTheme === 'dark' ? 'blur(calc(24px - var(--dist, 0) * 8px))' : 'blur(calc(15px - var(--dist, 0) * 5px))',
                            borderRadius: '50%',
                            opacity: isRainbow ? 0 : 'calc(0.85 + var(--dist, 0) * 0.15)',
                            zIndex: 0,
                        }}
                    />

                    {/* =========================================================================
                        [MODO 2: CON COLORES - MODO INNOVACIÓN] (isRainbow === true)
                        - Efectos de brillo de ambiente con gradientes cónicos y dinámicos (arcoíris).
                        ========================================================================= */}
                    {/* Capa 1: Brillo de ambiente profundo */}
                    <div
                        className="absolute pointer-events-none rainbow-glow-1"
                        style={{
                            width: '800px',
                            height: '800px',
                            left: '50%',
                            top: '50%',
                            transform: isRainbow
                                ? 'translate(calc(-50% + var(--mouse-x, 0px) * 0.015), calc(-50% + var(--mouse-y, 0px) * 0.015)) scale(calc(1.1 + var(--dist, 0) * 0.04)) rotate(calc(var(--angle, 0deg) * -0.06))'
                                : 'translate(-50%, -50%) scale(0.25)',
                            opacity: isRainbow ? 0.75 : 0,
                            filter: isRainbow
                                ? 'brightness(1.1) saturate(1.15) hue-rotate(calc(var(--angle, 0deg) * -0.1))'
                                : 'brightness(0.7) saturate(0.7) blur(15px)',
                            zIndex: 0,
                        }}
                    >
                        <div
                            className="w-full h-full"
                            style={{
                                background: `conic-gradient(
                                    from -15deg at 50% 50%,
                                    rgba(60, 120, 255, 0.95) 35deg,
                                    transparent 75deg,
                                    rgba(40, 220, 180, 0.95) 125deg,
                                    transparent 165deg,
                                    rgba(200, 240, 80, 0.95) 215deg,
                                    transparent 255deg,
                                    rgba(255, 80, 160, 0.95) 305deg,
                                    transparent 345deg,
                                    rgba(60, 120, 255, 0.95) 395deg
                                )`,
                                filter: 'blur(55px)',
                                maskImage: 'radial-gradient(circle, black 15%, transparent 70%)',
                                WebkitMaskImage: 'radial-gradient(circle, black 15%, transparent 70%)',
                                animation: isRainbow ? 'glow-pulse 8s ease-in-out infinite' : 'none',
                            }}
                        />
                    </div>

                    {/* Capa 2: Brillo de acento nítido */}
                    <div
                        className="absolute pointer-events-none rainbow-glow-2"
                        style={{
                            width: '700px',
                            height: '700px',
                            left: '50%',
                            top: '50%',
                            transform: isRainbow
                                ? 'translate(calc(-50% + var(--mouse-x, 0px) * 0.03), calc(-50% + var(--mouse-y, 0px) * 0.03)) scale(calc(1 + var(--dist, 0) * 0.08)) rotate(calc(var(--angle, 0deg) * 0.12))'
                                : 'translate(-50%, -50%) scale(0.25)',
                            opacity: isRainbow ? 0.95 : 0,
                            filter: isRainbow
                                ? 'brightness(1.15) saturate(1.25) hue-rotate(calc(var(--angle, 0deg) * 0.15))'
                                : 'brightness(0.8) saturate(0.8) blur(10px)',
                            zIndex: 0,
                        }}
                    >
                        <div
                            className="w-full h-full"
                            style={{
                                background: `conic-gradient(
                                    from -15deg at 50% 50%,
                                    rgba(60, 120, 255, 0.95) 35deg,
                                    transparent 75deg,
                                    rgba(40, 220, 180, 0.95) 125deg,
                                    transparent 165deg,
                                    rgba(200, 240, 80, 0.95) 215deg,
                                    transparent 255deg,
                                    rgba(255, 80, 160, 0.95) 305deg,
                                    transparent 345deg,
                                    rgba(60, 120, 255, 0.95) 395deg
                                )`,
                                filter: 'blur(35px)',
                                maskImage: 'radial-gradient(circle, black 15%, transparent 70%)',
                                WebkitMaskImage: 'radial-gradient(circle, black 15%, transparent 70%)',
                                animation: isRainbow ? 'glow-pulse 6s ease-in-out infinite' : 'none',
                            }}
                        />
                    </div>

                    {/* Logo encima de todo */}
                    <button
                        onClick={() => setIsRainbow(!isRainbow)}
                        className="relative flex justify-center items-center group active:scale-95 transition-all duration-300 focus:outline-none cursor-pointer"
                        style={{ zIndex: 1, perspective: '1000px', transformStyle: 'preserve-3d' }}
                    >
                        <img
                            src={currentTheme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                            alt="DIITRA Logo"
                            className="h-44 md:h-[220px] w-auto object-contain select-none logo-img"
                            style={{
                                filter: isRainbow
                                    ? 'drop-shadow(calc(var(--norm-x, 0) * -6px) calc(var(--norm-y, 0) * -6px) 15px rgba(60, 120, 255, 0.35)) drop-shadow(calc(var(--norm-x, 0) * 6px) calc(var(--norm-y, 0) * 6px) 25px rgba(255, 80, 160, 0.35))'
                                    : currentTheme === 'dark'
                                        ? 'drop-shadow(calc(var(--norm-x, 0) * -8px - 3px) calc(var(--norm-y, 0) * -8px - 3px) calc(6px + var(--dist, 0) * 4px) rgba(139, 92, 246, 0.50)) drop-shadow(calc(var(--norm-x, 0) * 8px + 3px) calc(var(--norm-y, 0) * 8px + 3px) calc(8px + var(--dist, 0) * 6px) rgba(37, 99, 235, 0.55)) drop-shadow(0px calc(var(--norm-y, 0) * 4px + 5px) calc(10px + var(--dist, 0) * 5px) rgba(14, 116, 144, 0.40)) drop-shadow(0 0 15px rgba(255, 255, 255, 0.15))'
                                        : 'drop-shadow(calc(var(--norm-x, 0) * 12px) calc(var(--norm-y, 0) * 12px) calc(12px + var(--dist, 0) * 14px) rgba(0, 0, 0, 0.16)) drop-shadow(0 0 18px rgba(0, 0, 0, 0.08))',
                                transform: isRainbow
                                    ? 'none'
                                    : currentTheme === 'dark'
                                        ? 'rotateX(calc(var(--norm-y, 0) * -15deg)) rotateY(calc(var(--norm-x, 0) * 15deg)) translateZ(10px)'
                                        : 'none',
                                transformStyle: 'preserve-3d',
                            }}
                        />
                    </button>
                </div>

                {/* Columna Derecha: Bloque Técnico Monospace (Estilo Vercel) */}
                <div className="lg:col-span-4 hidden lg:flex flex-col justify-center gap-8 text-left lg:pl-24 uppercase">
                    {rightColumnData.map((row, idx) => {
                        const isExpanded = hoveredIndex === idx || (hoveredIndex === null && clickedIndex === idx);
                        const isDimmed = hasActive && !isExpanded;
                        return (
                            <div
                                key={idx}
                                className={`space-y-1.5 cursor-pointer technical-row transition-all duration-500 ease-out select-none ${isDimmed ? 'opacity-30 scale-[0.98]' : 'opacity-100 scale-100'
                                    }`}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onClick={() => setClickedIndex(clickedIndex === idx ? null : idx)}
                            >
                                <p className="font-mono text-xs tracking-wider transition-colors duration-300 font-bold text-text-main">
                                    {row.title}
                                </p>
                                <div className={`grid-wrapper ${isExpanded ? 'expanded mt-1.5' : 'opacity-0'}`}>
                                    <div className="overflow-hidden font-mono text-[10px] tracking-wider leading-relaxed text-text-main/80">
                                        {row.expanded}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Ticker / Logos de Instituciones Integradas Centrados abajo, estilo Vercel */}
            <div className="w-full lg:w-auto pt-12 pb-4 flex flex-wrap justify-center lg:justify-between items-center gap-x-8 lg:gap-x-0 gap-y-6 text-black dark:text-white select-none lg:-ml-24 lg:-mr-24">
                {institutionalLogos.map((logo) => (
                    <div
                        key={logo.name}
                        className="flex items-center gap-2.5 opacity-90"
                    >
                        {logo.icon}
                        {logo.text}
                    </div>
                ))}
            </div>

        </section>
    );
};

export default Hero;
