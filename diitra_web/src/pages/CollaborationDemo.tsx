import React from 'react';
import { useCoWork, CoWorkEditor } from '../core/cowork';
import { Activity, Sun, Moon, Shield } from 'lucide-react';

interface Props {
    theme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

const CollaborationDemo: React.FC<Props> = ({ theme, toggleTheme }) => {
    // Usamos el motor profesional en el demo antiguo
    const cowork = useCoWork({
        documentId: "demo-public-doc",
        user: {
            id: "demo-user-" + Math.floor(Math.random() * 1000),
            name: "Visitante de Demo",
            role: "Investigador",
            color: '#0070f3',
            initials: 'VD'
        }
    });

    return (
        <div className="min-h-screen bg-bg-deep bg-glow p-10 flex flex-col items-center selection:bg-selection-bg selection:text-selection-fg transition-colors duration-300">
            <header className="mb-16 w-full max-w-6xl px-2 animate-fade-up flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em] mb-4">
                        <Activity size={10} strokeWidth={2} className="text-text-main" />
                        <span>Módulo de Colaboración Profesional</span>
                    </div>
                    <h1 className="text-5xl font-bold text-text-main tracking-tighter mb-4">
                        DIITRA <span className="text-text-dim">CoWork</span> Core
                    </h1>
                    <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                        Experimente la edición sincrónica empresarial. Este núcleo utiliza Tiptap + Yjs para una 
                        convergencia de datos perfecta y persistencia en tiempo real en la base de datos del instituto.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-thin rounded-full">
                        <Shield size={12} className="text-green-500" />
                        <span className="text-[10px] font-bold text-text-main uppercase tracking-wider">Enterprise Ready</span>
                    </div>
                    
                    <button 
                        onClick={toggleTheme}
                        className="p-3 rounded-full bg-surface border border-border-thin text-text-main hover:bg-surface-hover transition-all group shadow-sm active:scale-95"
                        aria-label="Cambiar tema"
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} strokeWidth={1.5} className="group-hover:rotate-45 transition-transform duration-500" />
                        ) : (
                            <Moon size={18} strokeWidth={1.5} className="group-hover:[-rotate-12] transition-transform duration-500" />
                        )}
                    </button>
                </div>
            </header>

            <main className="w-full max-w-6xl h-[75vh] animate-fade-up [animation-delay:200ms] shadow-2xl">
                <CoWorkEditor 
                    cowork={cowork} 
                    placeholder="Prueba la potencia del nuevo motor DIITRA CoWork..." 
                />
            </main>
            
            <footer className="mt-12 text-text-dim text-[10px] font-mono uppercase tracking-widest animate-fade-up [animation-delay:400ms]">
                DIITRA v3.0 &bull; Tiptap Core &bull; Yjs CRDT &bull; SignalR Persistence
            </footer>
        </div>
    );
};

export default CollaborationDemo;
