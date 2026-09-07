import { RefreshCw } from 'lucide-react';
import { GeistSelect } from '../../../../../components/Common/GeistSelect';

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
    investigadores?: any[];
}

export const DirectorTransferModal: React.FC<DirectorTransferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    transferDirector,
    newDirectorCedula,
    setNewDirectorCedula,
    transferMotivo,
    setTransferMotivo,
    transferDescripcion,
    setTransferDescripcion,
    isTransferring,
    investigadores = []
}) => {
    if (!isOpen) return null;

    const candidates = investigadores.filter(
        (m: any) => m.activo !== false && m.cedula !== transferDirector?.cedula
    );

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
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Seleccionar Nuevo Director</label>
                        <GeistSelect
                            value={newDirectorCedula}
                            onChange={(val) => setNewDirectorCedula(val)}
                            options={[
                                { value: '', label: '-- Seleccione un integrante del equipo --' },
                                ...candidates.map((su: any) => ({
                                    value: su.cedula,
                                    label: `${formatNombre(su.nombre)} (${su.rol})`
                                }))
                            ]}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">Motivo</label>
                        <GeistSelect 
                            value={transferMotivo}
                            onChange={(val) => setTransferMotivo(val)}
                            options={[
                                { value: 'Reasignación institucional', label: 'Reasignación institucional' },
                                { value: 'Renuncia voluntaria', label: 'Renuncia voluntaria' },
                                { value: 'Licencia o permiso de estudios', label: 'Licencia o permiso de estudios' },
                                { value: 'Otro motivo administrativo', label: 'Otro motivo administrativo' }
                            ]}
                        />
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
