import React from 'react';
import CollaborativeEditor from '../components/Collaboration/CollaborativeEditor';
import { Activity, Sun, Moon } from 'lucide-react';

interface Props {
    theme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

const CollaborationDemo: React.FC<Props> = ({ theme, toggleTheme }) => {
    return (
        <div className="min-h-screen bg-bg-deep bg-glow p-10 flex flex-col items-center selection:bg-selection-bg selection:text-selection-fg transition-colors duration-300">
            <header className="mb-16 w-full max-w-6xl px-2 animate-fade-up flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em] mb-4">
                        <Activity size={10} strokeWidth={2} className="text-text-main" />
                        <span>Módulo de Colaboración</span>
                    </div>
                    <h1 className="text-5xl font-bold text-text-main tracking-tighter mb-4">
                        Núcleo de Colaboración <span className="text-text-dim">DIITRA</span>
                    </h1>
                    <p className="text-sm text-text-dim max-w-2xl font-medium leading-relaxed">
                        Experimente la edición sincrónica de documentos académicos en tiempo real. 
                        Utilice múltiples dispositivos para observar la convergencia de datos mediante CRDTs y SignalR.
                    </p>
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
            </header>

            <main className="w-full max-w-6xl h-[75vh] animate-fade-up [animation-delay:200ms]">
                <CollaborativeEditor 
                    documentId="test-doc-101" 
                    title="Propuesta de Investigación: Energía Eólica en el Azuay"
                />
            </main>
            
            <footer className="mt-12 text-text-dim text-[10px] font-mono uppercase tracking-widest animate-fade-up [animation-delay:400ms]">
                Arquitectura Limpia &bull; Monolito Modular &bull; SignalR v7.0 &bull; YJS CRDT
            </footer>
        </div>
    );
};

export default CollaborationDemo;
