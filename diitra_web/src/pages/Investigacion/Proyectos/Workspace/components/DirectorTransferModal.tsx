import React from 'react';
import { RefreshCw, Search } from 'lucide-react';

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

interface DirectorTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    transferDirector: any;
    transferSearchQuery: string;
    setTransferSearchQuery: (val: string) => void;
    showTransferSearchResults: boolean;
    setShowTransferSearchResults: (val: boolean) => void;
    transferSearchResults: any[];
    isTransferSearching: boolean;
    newDirectorCedula: string;
    setNewDirectorCedula: (val: string) => void;
    transferMotivo: string;
    setTransferMotivo: (val: string) => void;
    transferDescripcion: string;
    setTransferDescripcion: (val: string) => void;
    isTransferring: boolean;
}

export const DirectorTransferModal: React.FC<DirectorTransferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    transferDirector,
    transferSearchQuery,
    setTransferSearchQuery,
    showTransferSearchResults,
    setShowTransferSearchResults,
    transferSearchResults,
    isTransferSearching,
    newDirectorCedula,
    setNewDirectorCedula,
    transferMotivo,
    setTransferMotivo,
    transferDescripcion,
    setTransferDescripcion,
    isTransferring
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <div className="modal-card modal-card--lg animate-fade-up">
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <RefreshCw size={16} className="text-brand-light" />
                        <h3 className="text-[10px] font-semibold uppercase tracking-widest">Transferencia de Dirección</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-text-dim hover:text-text-main transition-colors text-sm">✕</button>
                </div>

                {transferDirector && (
                    <div className="mx-6 mt-4 badge-vercel badge-vercel-violet !rounded-md !p-3 !text-[11px] space-y-1">
                        <span className="font-semibold block uppercase tracking-wider text-[10px]">Director a Relevar:</span>
                        <p className="font-semibold text-text-main text-xs">{formatNombre(transferDirector.nombre)}</p>
                        <p className="text-text-dim font-mono text-[10px]">C.I. {transferDirector.cedula} | {transferDirector.rol}</p>
                    </div>
                )}

                <form onSubmit={onSubmit} className="modal-body space-y-4">
                    <div className="relative space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Buscar Nuevo Director</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input 
                                type="text"
                                value={transferSearchQuery}
                                onChange={(e) => setTransferSearchQuery(e.target.value)}
                                onFocus={() => setShowTransferSearchResults(true)}
                                placeholder="Buscar por nombre o cédula..."
                                className="input-vercel !text-xs !py-3 !pl-9"
                            />
                            {isTransferSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-brand rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {showTransferSearchResults && transferSearchQuery.trim() && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowTransferSearchResults(false)}></div>
                                <div className="absolute left-0 right-0 top-full mt-1 bg-bg-deep border border-border-thin rounded-lg shadow-2xl max-h-48 overflow-y-auto z-30">
                                    {transferSearchResults.length === 0 ? (
                                        <div className="p-4 text-center text-[10px] text-text-dim uppercase tracking-wider">Sin resultados</div>
                                    ) : (
                                        transferSearchResults.map((su: any) => (
                                            <button 
                                                key={su.cedula}
                                                type="button"
                                                onClick={() => {
                                                    setNewDirectorCedula(su.cedula);
                                                    setTransferSearchQuery(formatNombre(su.nombre));
                                                    setShowTransferSearchResults(false);
                                                }}
                                                className="w-full p-3 flex items-center justify-between hover:bg-surface text-left text-xs transition-colors border-b border-border-thin last:border-b-0"
                                            >
                                                <div>
                                                    <p className="font-semibold text-text-main">{formatNombre(su.nombre)}</p>
                                                    <p className="text-text-dim font-mono text-[10px]">C.I. {su.cedula}</p>
                                                </div>
                                                <span className={`badge-vercel text-[8px] font-semibold ${su.tipo === 'profesor' ? 'badge-vercel-violet' : 'badge-vercel-success'}`}>
                                                    {su.tipo === 'profesor' ? 'Docente' : 'Estudiante'}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {newDirectorCedula && (
                        <div className="badge-vercel badge-vercel-success !rounded-md !p-3 !text-[11px] flex justify-between items-center animate-fade-in w-full">
                            <div>
                                <span className="font-semibold block uppercase tracking-wider text-[10px]">Nuevo Director:</span>
                                <p className="font-semibold text-text-main text-xs">{transferSearchQuery}</p>
                                <p className="text-text-dim font-mono text-[10px]">C.I. {newDirectorCedula}</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setNewDirectorCedula(''); setTransferSearchQuery(''); }}
                                className="text-[10px] text-error hover:opacity-80 font-semibold uppercase tracking-wider"
                            >
                                Quitar
                            </button>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Motivo</label>
                        <select 
                            value={transferMotivo}
                            onChange={(e) => setTransferMotivo(e.target.value)}
                            className="input-vercel !text-xs"
                        >
                            <option value="Reasignación institucional">Reasignación institucional</option>
                            <option value="Renuncia voluntaria">Renuncia voluntaria</option>
                            <option value="Licencia o permiso de estudios">Licencia o permiso de estudios</option>
                            <option value="Otro motivo administrativo">Otro motivo administrativo</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Justificación</label>
                        <textarea 
                            rows={3}
                            required
                            placeholder="Describe el motivo del relevo institucional..."
                            value={transferDescripcion}
                            onChange={(e) => setTransferDescripcion(e.target.value)}
                            className="input-vercel !text-xs resize-none"
                        />
                    </div>

                    <div className="modal-footer !px-0 !pb-0 !border-0 !bg-transparent">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="btn-vercel-secondary !py-2"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isTransferring || !newDirectorCedula}
                            className={`btn-vercel-primary !py-2 ${isTransferring || !newDirectorCedula ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isTransferring ? (
                                <>
                                    <div className="animate-spin h-3 w-3 border-2 border-t-transparent border-text-dim rounded-full"></div>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={12} />
                                    <span>Confirmar Relevo</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DirectorTransferModal;
