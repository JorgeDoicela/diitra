import React from 'react';
import CollaborativeEditor from '../components/Collaboration/CollaborativeEditor';

const CollaborationDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                    Núcleo de Colaboración <span className="text-indigo-400">DIITRA</span>
                </h1>
                <p className="mt-4 text-slate-400 text-lg max-w-2xl">
                    Prueba la edición en tiempo real abriendo esta misma URL en otra pestaña o dispositivo. 
                    Los cambios se sincronizan instantáneamente mediante SignalR.
                </p>
            </header>

            <main className="w-full max-w-6xl h-[80vh]">
                <CollaborativeEditor 
                    documentId="test-doc-101" 
                    title="Propuesta de Investigación: Energía Eólica en el Azuay"
                    initialContent="Este es un documento de prueba para el sistema DIITRA..."
                />
            </main>
            
            <footer className="mt-8 text-slate-500 text-sm">
                Arquitectura Limpia &bull; Monolito Modular &bull; SignalR v7.0
            </footer>
        </div>
    );
};

export default CollaborationDemo;
