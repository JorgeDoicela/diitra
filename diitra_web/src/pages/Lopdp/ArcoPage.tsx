import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Calendar, CheckCircle2, Info, Loader2, UploadCloud, Trash2, Paperclip } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

interface ArcoRequest {
    id_solicitud_arco: number;
    uuid: string;
    id_usuario: number;
    nombre_usuario: string;
    tipo_solicitud: string;
    detalle_solicitud: string;
    fecha_solicitud: string;
    fecha_limite_resolucion: string;
    estado: string;
    resolucion_detalle?: string;
    fecha_resolucion?: string;
    documento_resolucion_path?: string;
    evidencia_path?: string;
}

const ArcoPage: React.FC = () => {
    const { addToast } = useNotifications();

    const [arcoRequests, setArcoRequests] = useState<ArcoRequest[]>([]);
    const [isLoadingArco, setIsLoadingArco] = useState(false);
    const [newArcoType, setNewArcoType] = useState('Acceso');
    const [newArcoDetail, setNewArcoDetail] = useState('');
    const [isSubmittingArco, setIsSubmittingArco] = useState(false);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchArcoRequests();
    }, []);

    const fetchArcoRequests = async () => {
        setIsLoadingArco(true);
        try {
            const res = await api.get('/lopdp/arco/mis-solicitudes');
            setArcoRequests(res.data);
        } catch (err) {
            console.error('Error fetching ARCO requests:', err);
            addToast('Error', 'No se pudieron cargar sus solicitudes ARCO.', 'error');
        } finally {
            setIsLoadingArco(false);
        }
    };

    const getEvidenceUrl = (path: string) => {
        const base = api.defaults.baseURL || '/api';
        return `${base}/storage/${path}`;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            addToast('Archivo no permitido', 'Solo se permiten archivos PDF, PNG o JPG/JPEG.', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            addToast('Archivo muy grande', 'El tamaño del archivo no debe superar los 5MB.', 'warning');
            return;
        }
        setEvidenceFile(file);
    };

    const handleRemoveFile = () => {
        setEvidenceFile(null);
    };

    const handleCreateArco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArcoDetail.trim()) {
            addToast('Validación', 'El detalle de la solicitud es requerido.', 'warning');
            return;
        }

        setIsSubmittingArco(true);
        try {
            const formData = new FormData();
            formData.append('tipoSolicitud', newArcoType);
            formData.append('detalleSolicitud', newArcoDetail);
            if (evidenceFile) {
                formData.append('file', evidenceFile);
            }

            const res = await api.post('/lopdp/arco', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            addToast('Solicitud Enviada', res.data.message || 'Solicitud ARCO registrada.', 'success');
            setNewArcoDetail('');
            setEvidenceFile(null);
            fetchArcoRequests();
        } catch (err: any) {
            console.error('Error creating ARCO request:', err);
            addToast('Error', 'No se pudo registrar la solicitud ARCO.', 'error');
        } finally {
            setIsSubmittingArco(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Aprobado':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Rechazado':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'En_Analisis':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default:
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <ShieldCheck size={12} className="text-brand" />
                    <span>Derechos ARCO · LOPDP</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Mis Derechos ARCO</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Ejerza sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos personales en el sistema DIITRA, de acuerdo con la normativa legal vigente de protección de datos.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to submit ARCO */}
                <div className="bento-card static p-6 space-y-6 h-fit">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                        <ShieldCheck size={16} />
                        Nueva Solicitud ARCO
                    </h2>

                    <form onSubmit={handleCreateArco} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Tipo de Derecho</label>
                            <select
                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                value={newArcoType}
                                onChange={e => setNewArcoType(e.target.value)}
                            >
                                <option value="Acceso">Acceso (Ver qué datos se guardan)</option>
                                <option value="Rectificacion">Rectificación (Corregir datos incorrectos)</option>
                                <option value="Eliminacion">Eliminación (Borrar datos personales)</option>
                                <option value="Oposicion">Oposición (Oponerse al tratamiento de datos)</option>
                                <option value="Portabilidad">Portabilidad (Trasladar datos a otra entidad)</option>
                                <option value="Limitacion">Limitación (Limitar el tratamiento temporalmente)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Detalle y Justificación de la Solicitud</label>
                            <textarea
                                rows={5}
                                required
                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                placeholder="Detalle de forma clara qué datos desea consultar, corregir o eliminar, y el motivo de su solicitud."
                                value={newArcoDetail}
                                onChange={e => setNewArcoDetail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Evidencia / Documento de Soporte (Opcional)</label>
                            
                            {!evidenceFile ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                                        isDragging 
                                            ? 'border-brand bg-brand/5' 
                                            : 'border-border-thin bg-surface/50 hover:border-brand/40'
                                    }`}
                                    onClick={() => document.getElementById('evidence-upload')?.click()}
                                >
                                    <input
                                        id="evidence-upload"
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <UploadCloud size={24} className={`transition-colors ${isDragging ? 'text-brand animate-bounce' : 'text-text-dim hover:text-brand'}`} />
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-text-main">
                                            Arrastre un archivo o haga clic aquí
                                        </p>
                                        <p className="text-[10px] text-text-dim mt-0.5">
                                            Formatos permitidos: PDF, PNG, JPG hasta 5MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-surface border border-border-thin rounded-xl flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-2 bg-brand/10 text-brand rounded-lg">
                                            <Paperclip size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-text-main truncate" title={evidenceFile.name}>
                                                {evidenceFile.name}
                                            </p>
                                            <p className="text-[10px] text-text-dim font-mono">
                                                {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="p-1.5 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Eliminar archivo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
                            <Info className="text-amber-500 shrink-0" size={14} />
                            <p className="text-[10px] text-text-dim leading-normal">
                                <strong>Nota:</strong> Por ley (LOPDP), la institución cuenta con un plazo máximo de <strong>15 días</strong> laborables para dar resolución legal a su solicitud.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingArco}
                            className="btn-vercel-primary text-xs w-full justify-center"
                        >
                            {isSubmittingArco && <Loader2 className="animate-spin mr-1.5" size={14} />}
                            Registrar Solicitud
                        </button>
                    </form>
                </div>

                {/* List of requests */}
                <div className="lg:col-span-2 bento-card static p-6 space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                        <FileText size={16} />
                        Historial de Solicitudes ARCO
                    </h2>

                    {isLoadingArco ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="animate-spin text-brand" size={24} />
                        </div>
                    ) : arcoRequests.length === 0 ? (
                        <div className="py-16 text-center text-text-dim space-y-2">
                            <ShieldCheck className="mx-auto opacity-20" size={32} />
                            <p className="text-xs uppercase font-semibold tracking-widest">No ha presentado solicitudes</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {arcoRequests.map(req => (
                                <div key={req.id_solicitud_arco} className="p-4 bg-surface border border-border-thin rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-text-main">Derecho de {req.tipo_solicitud}</span>
                                            <span className="text-[10px] font-mono text-text-dim">· {req.uuid.substring(0, 8)}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getStatusStyle(req.estado)}`}>
                                            {req.estado.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="text-xs text-text-dim leading-relaxed">{req.detalle_solicitud}</p>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-thin/40 text-[10px] text-text-dim font-medium">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>Solicitado: {new Date(req.fecha_solicitud).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} className="text-amber-500" />
                                            <span>Límite de Respuesta: {req.fecha_limite_resolucion}</span>
                                        </div>
                                    </div>

                                    {req.evidencia_path && (
                                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-border-thin/20 text-[10px]">
                                            <Paperclip size={12} className="text-brand" />
                                            <span className="text-text-dim">Evidencia:</span>
                                            <a
                                                href={getEvidenceUrl(req.evidencia_path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand hover:underline font-semibold flex items-center gap-0.5"
                                            >
                                                Ver Documento
                                            </a>
                                        </div>
                                    )}

                                    {req.resolucion_detalle && (
                                        <div className="p-3 bg-surface-hover/50 border border-border-thin rounded-lg space-y-1">
                                            <h4 className="text-[10px] font-semibold text-text-main uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                Resolución Institucional
                                            </h4>
                                            <p className="text-xs text-text-dim leading-relaxed">{req.resolucion_detalle}</p>
                                            {req.fecha_resolucion && (
                                                <span className="block text-[9px] text-text-dim mt-1 font-mono">
                                                    Dictaminado el {new Date(req.fecha_resolucion).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArcoPage;
