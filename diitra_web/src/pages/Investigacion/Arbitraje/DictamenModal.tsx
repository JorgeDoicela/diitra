import React from 'react';
import { X, Scale, CheckCircle2, XCircle, AlertTriangle, Award, Download, FileText } from 'lucide-react';
import { DICTAMEN_CONFIG, downloadDictamenPdf } from '../../../services/peerReviewService';
import type { DictamenDto } from '../../../services/peerReviewService';
import { useNotifications } from '../../../api/NotificationsContext';

interface Props {
    dictamen: DictamenDto;
    onClose: () => void;
}

const DictamenModal: React.FC<Props> = ({ dictamen, onClose }) => {
    const { addToast } = useNotifications();
    const cfg = DICTAMEN_CONFIG[dictamen.resultado] ?? DICTAMEN_CONFIG['Rechazado'];

    const ResultIcon = dictamen.resultado === 'Aprobado'
        ? CheckCircle2
        : dictamen.resultado === 'Rechazado'
            ? XCircle
            : AlertTriangle;

    const handleDescargarPdf = async () => {
        try {
            const blob = await downloadDictamenPdf(dictamen.proyecto_uuid);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DICTAMEN_${dictamen.codigo_institucional ?? dictamen.proyecto_uuid.split('-')[0].toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[DIITRA] Error al descargar acta:', err);
            addToast('Error', 'No se pudo descargar el dictamen en PDF.', 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-card !max-w-xl animate-fade-up">
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{ background: cfg.bg, color: cfg.color }}
                        >
                            <Scale size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold tracking-tighter text-text-main uppercase">
                                Dictamen Final Emitido
                            </h3>
                            <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest mt-0.5">
                                {new Date(dictamen.fecha_cierre).toLocaleDateString('es-EC', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-dim hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Resultado principal */}
                    <div
                        className="p-6 rounded-xl text-center"
                        style={{ background: cfg.bg, borderColor: cfg.color + '40', border: '1px solid' }}
                    >
                        <ResultIcon size={36} className="mx-auto mb-3" style={{ color: cfg.color }} />
                        <p className="text-2xl font-semibold tracking-tighter uppercase" style={{ color: cfg.color }}>
                            {cfg.label}
                        </p>
                        <p className="text-xs text-text-dim mt-2 font-medium">
                            Promedio: <span className="font-semibold text-text-main">{dictamen.puntaje_promedio.toFixed(2)}/100</span>
                            {' '}· Mínimo: <span className="font-semibold text-text-main">{dictamen.puntaje_minimo_aprobacion}/100</span>
                        </p>
                    </div>

                    {/* Info del proyecto */}
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-1">Proyecto</p>
                                <p className="text-sm font-semibold text-text-main">{dictamen.proyecto_titulo}</p>
                            </div>
                            {dictamen.codigo_institucional && (
                                <span className="status-tag text-text-main border-text-main/30 shrink-0 ml-4">
                                    {dictamen.codigo_institucional}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="status-tag text-text-dim">{dictamen.estado_anterior}</span>
                            <span className="text-text-dim text-xs">→</span>
                            <span className="status-tag text-text-main border-text-main/30">{dictamen.estado_nuevo}</span>
                        </div>
                    </div>

                    {/* Aviso de desempate */}
                    {dictamen.resultado === 'Desempate' && dictamen.mensaje_desempate && (
                        <div className="p-4 rounded-lg border border-warning/30 bg-warning/5 space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-warning" />
                                <p className="text-xs font-semibold text-text-main">Acción Requerida</p>
                            </div>
                            <p className="text-xs text-text-dim leading-relaxed">{dictamen.mensaje_desempate}</p>
                        </div>
                    )}

                    <div className="divider-vercel" />

                    {/* Detalle de evaluaciones */}
                    <div>
                        <div className="section-label mb-3">
                            <FileText size={10} />
                            <span>Evaluaciones Individuales</span>
                        </div>
                        <div className="space-y-2">
                            {dictamen.evaluaciones.map((ev, idx) => (
                                <div key={ev.uuid} className="flex items-center justify-between p-3 rounded-lg bg-surface/30 border border-border-thin/50">
                                    <div className="flex items-center gap-3">
                                        <div className="icon-circle icon-circle-neutral !p-1.5 shrink-0">
                                            <Award size={12} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-text-main">
                                                Árbitro #{idx + 1}
                                            </p>
                                            <p className="text-[10px] text-text-dim">
                                                {ev.es_externo ? 'Par Externo' : 'Par Interno'} · {ev.es_doble_ciego ? 'Anónimo' : 'Abierto'}
                                            </p>
                                        </div>
                                    </div>
                                    {ev.puntaje_total != null && (
                                        <span className={`text-lg font-semibold ${ev.puntaje_total >= 70 ? 'text-success' : 'text-error'}`}>
                                            {ev.puntaje_total.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        onClick={handleDescargarPdf}
                        className="btn-vercel-secondary flex items-center gap-2"
                    >
                        <Download size={14} /> Descargar Acta PDF
                    </button>
                    <button onClick={onClose} className="btn-vercel-primary">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DictamenModal;
