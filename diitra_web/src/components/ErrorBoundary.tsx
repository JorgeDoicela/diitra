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
                <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-[#fafafa] p-4">
                    <div className="w-full max-w-sm p-6 rounded-lg border border-[#27272a] bg-[#121214] flex flex-col items-center text-center space-y-4 shadow-xl">
                        <div className="flex items-center gap-2.5">
                            <AlertOctagon size={18} className="text-[#f43f5e] shrink-0" />
                            <h3 className="text-sm font-medium text-white">Error de Reconciliación</h3>
                        </div>
                        <p className="text-xs text-[#a1a1aa] leading-relaxed">
                            {isDomError 
                                ? 'Una extensión o traductor externo del navegador alteró la estructura visual de la aplicación.'
                                : 'Ocurrió un error inesperado al procesar la interfaz.'}
                        </p>
                        {isDomError && (
                            <div className="text-[10px] text-[#71717a] bg-[#18181b] p-2.5 rounded border border-[#27272a] text-left w-full">
                                <strong>Tip:</strong> Prueba desactivando la traducción automática o extensiones bloqueadoras para este sitio.
                            </div>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium text-black bg-white hover:bg-[#e4e4e7] transition-all duration-150 active:scale-[0.98]"
                        >
                            <RefreshCw size={12} />
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
