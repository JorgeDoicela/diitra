import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../api/AuthContext';
import { getWelcomeConfigByRole } from '../../components/Layout/WelcomeModal/welcomeConfigs';

const formatTitleCase = (str?: string): string => {
    if (!str) return 'Colega';
    const first = str.trim().split(' ')[0] || '';
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

export const WelcomePage: React.FC = () => {
    const { user, isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName } = useAuth();
    const navigate = useNavigate();

    const config = getWelcomeConfigByRole(isAdmin, isDocente, isEstudiante, isRevisor);
    const userFirstName = formatTitleCase(user?.nombre_completo);

    const handleNavigate = (path?: string) => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto py-6 sm:py-10 px-4 sm:px-8 lg:px-12 animate-fade-in space-y-8 sm:space-y-10">
            
            {/* Header Hero Principal Integrado (Geist Style) */}
            <header className="relative bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-100/60 dark:bg-zinc-900/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-3xl">
                        {/* Breadcrumb de rol */}
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                DIITRA
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700 font-light">/</span>
                            <span className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-[11px] font-mono font-medium px-2.5 py-0.5 text-zinc-600 dark:text-zinc-400">
                                {roleDisplayName || config.roleLabel}
                            </span>
                        </div>

                        {/* Saludo Principal */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-950 dark:text-white tracking-[-0.03em] leading-tight">
                            Hola, {userFirstName}
                        </h1>

                        {/* Descripción concisa */}
                        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                            {config.systemDescription}
                        </p>
                    </div>

                    {/* Acción Primaria */}
                    <div className="shrink-0">
                        <button
                            onClick={() => handleNavigate(config.primaryActionPath)}
                            className="w-full sm:w-auto h-11 px-7 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-medium hover:bg-black dark:hover:bg-zinc-200 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 group"
                            title={config.primaryActionLabel}
                        >
                            <span>{config.primaryActionLabel}</span>
                            <ArrowRight size={15} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Sección de Ejes Estratégicos Bento Grid 2x2 */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                        {config.sectionTitle}
                    </h2>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                        Módulos Disponibles
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {config.benefits.map((benefit, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleNavigate(benefit.path)}
                            className={`group relative bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 ${
                                benefit.path ? 'cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {benefit.title}
                                    </h3>
                                    <span className="rounded-md border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono font-medium px-2.5 py-0.5 text-zinc-600 dark:text-zinc-400 shrink-0">
                                        {benefit.tag}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                    {benefit.description}
                                </p>
                            </div>

                            {benefit.path && (
                                <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                                    <span>Acceder al módulo</span>
                                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Cierre Institucional */}
            <footer className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/50 dark:border-zinc-800/50 gap-2">
                <div className="flex items-center gap-1.5 font-mono">
                    <ShieldCheck size={14} className="text-zinc-400" />
                    <span>DIITRA · Tecnológico Traversari · Normativa CACES</span>
                </div>
                <div className="font-mono">
                    Entorno de Producción Científica
                </div>
            </footer>
        </div>
    );
};
