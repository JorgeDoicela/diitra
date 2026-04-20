import React, { useState, useEffect } from 'react';
import { Search, Command, FileText, User, PlusCircle, ArrowRight } from 'lucide-react';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-[2px]">
      <div className="w-full max-w-xl bg-bg-deep border border-border-thin rounded-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]">
        <div className="flex items-center px-4 py-4 border-b border-border-thin">
          <Search size={16} className="text-text-dim mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar archivos o comandos..."
            className="flex-1 bg-transparent border-none outline-none text-text-main text-sm placeholder:text-text-dim font-sans"
          />
          <kbd className="text-[10px] bg-surface px-2 py-1 rounded border border-border-thin text-text-dim font-mono">ESC</kbd>
        </div>
        
        <div className="p-2 space-y-0.5 max-h-[50vh] overflow-y-auto">
          <div className="px-3 pt-3 pb-1.5">
            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Navegación</h4>
          </div>
          <PaletteItem icon={PlusCircle} label="Nuevo Borrador de Investigación" shortcut="N" />
          <PaletteItem icon={FileText} label="Abrir Convocatorias Activas" shortcut="G" />
          
          <div className="px-3 pt-5 pb-1.5">
            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Actividad Reciente</h4>
          </div>
          <PaletteItem icon={ArrowRight} label="INV-2024-001: Análisis de Redes Neuronales" />
          <PaletteItem icon={User} label="Perfil: Dr. Jorge Doicela" />
        </div>

        <div className="bg-surface/30 px-4 py-3 border-t border-border-thin flex items-center justify-between">
            <span className="text-[10px] text-text-dim font-mono tracking-tighter uppercase">DIITRA_ISTPET_BUILD_v1.0.4</span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-active bg-white text-black px-2 py-0.5 rounded-sm font-bold">
                <Command size={10} />
                <span>COMANDOS</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const PaletteItem = ({ icon: Icon, label, shortcut }: { icon: any, label: string, shortcut?: string }) => (
  <div className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-surface cursor-pointer group transition-colors">
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-text-dim group-hover:text-white" strokeWidth={1.5} />
      <span className="text-sm text-text-dim group-hover:text-white transition-colors">{label}</span>
    </div>
    {shortcut && <kbd className="text-[10px] bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim font-mono">{shortcut}</kbd>}
  </div>
);
