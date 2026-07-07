import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an uncaught error:', error, errorInfo);

        const isDomError = error.message?.includes('removeChild') || 
                           error.message?.includes('parentNode') ||
                           error.message?.includes('Failed to execute');

        if (isDomError) {
            const now = Date.now();
            const lastAutoReload = sessionStorage.getItem('last_auto_reload');
            const timeDiff = lastAutoReload ? now - parseInt(lastAutoReload, 10) : Infinity;

            // Intentar autocurarse (recargar automáticamente) solo si no se ha recargado en los últimos 10 segundos
            if (timeDiff > 10000) {
                sessionStorage.setItem('last_auto_reload', now.toString());
                window.location.reload();
            }
        }
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            const isDomError = this.state.error?.message?.includes('removeChild') || 
                               this.state.error?.message?.includes('parentNode') ||
                               this.state.error?.message?.includes('Failed to execute');

            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] p-6 selection:bg-white selection:text-black">
                    <div className="w-full max-w-md p-8 rounded-xl border border-[#27272a] bg-[#121214] shadow-2xl flex flex-col items-center text-center space-y-6">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-red-400">
                            <AlertOctagon size={24} className="text-[#f43f5e]" />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold tracking-tight text-white">
                                Interrupción del Sistema
                            </h2>
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">
                                {isDomError 
                                    ? 'Detectamos que una extensión del navegador (como un traductor o bloqueador) alteró la estructura visual de la aplicación, provocando un fallo de renderizado.'
                                    : 'Ocurrió un error inesperado al procesar la interfaz visual.'}
                            </p>
                            {isDomError && (
                                <p className="text-xs text-[#71717a] mt-2 italic bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                                    Tip: Intenta desactivar la traducción automática o el bloqueador de publicidad para este sitio.
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <button
                            onClick={this.handleReload}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-black bg-white hover:bg-[#e4e4e7] transition-all duration-200 shadow-sm active:scale-[0.98]"
                        >
                            <RefreshCw size={14} className="animate-spin-hover" />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
