import React from 'react';
import {
    CheckCircle, XCircle, ChevronRight, FileText,
    Mic, Loader2
} from 'lucide-react';
import { AudioBubblePlayer } from '../AudioBubblePlayer';
import { formatNombre } from './utils';
import type { useGroupsReview } from './hooks/useGroupsReview';
import api from '../../../../api/axios_config';

interface GroupReviewModalProps {
    review: ReturnType<typeof useGroupsReview>;
}

export const GroupReviewModal: React.FC<GroupReviewModalProps> = ({ review }) => {
    const {
        reviewingGroup,
        isReviewModalOpen,
        reviewResolution,
        setReviewResolution,
        rejectObservations,
        setRejectObservations,
        isReviewRejecting,
        setIsReviewRejecting,
        sendingFeedback,
        isConfirming,
        handleCloseReviewModal,
        handleApprove,
        handleRejectReview,
        voiceRecorder
    } = review;

    if (!isReviewModalOpen || !reviewingGroup) return null;

    const handleOpenProposalPdf = async () => {
        try {
            const response = await api.get(`/groups/${reviewingGroup.uuid}/proposal-document/pdf`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (e) {
            console.error('Error al abrir propuesta:', e);
        }
    };

    const {
        isRecording,
        audioUrl,
        recordingTime,
        startRecording,
        stopRecording,
        clearAudio,
        audioBlob
    } = voiceRecorder;

    return (
        <div className="fixed inset-0 z-[10000] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleCloseReviewModal}
            />
            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                <div className="modal-header shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`icon-circle ${isReviewRejecting ? 'icon-circle-error' : 'icon-circle-success'}`}>
                            {isReviewRejecting ? <XCircle size={20} /> : <CheckCircle size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-main tracking-tight">
                                Evaluar Propuesta de Grupo
                            </h3>
                            <p className="section-label text-text-dim">Revisión y Aprobación Normativa Institucional</p>
                        </div>
                    </div>
                    <button onClick={handleCloseReviewModal} className="text-text-dim hover:text-text-main transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Evaluation Mode Toggle tabs */}
                <div className="flex border-b border-border-thin bg-surface-hover/20 shrink-0">
                    <button
                        onClick={() => setIsReviewRejecting(false)}
                        className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                            !isReviewRejecting
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <CheckCircle size={14} />
                        <span>Aprobar Propuesta</span>
                    </button>
                    <button
                        onClick={() => setIsReviewRejecting(true)}
                        className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                            isReviewRejecting
                                ? 'border-red-500 text-red-400 bg-red-500/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <XCircle size={14} />
                        <span>Rechazar Propuesta</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-bg-deep/30 border border-border-thin rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-text-dim tracking-widest block">Propuesta Bajo Revisión</span>
                            <button
                                type="button"
                                onClick={handleOpenProposalPdf}
                                className="btn-vercel-secondary text-[10px] py-1 px-2.5 flex items-center gap-1.5 font-bold"
                                title="Ver documento oficial que se firmará"
                            >
                                <FileText size={12} className="text-brand" />
                                <span>Ver PDF Oficial</span>
                            </button>
                        </div>
                        <h4 className="text-sm font-semibold text-text-main">{reviewingGroup.nombre}</h4>
                        <div className="flex gap-2 text-[9px] font-mono text-text-dim font-bold uppercase">
                            <span>Siglas: {reviewingGroup.siglas || 'S/S'}</span>
                            <span>|</span>
                            <span>Coordinador: {formatNombre(reviewingGroup.nombre_coordinador)}</span>
                        </div>
                    </div>

                    {!isReviewRejecting ? (
                        /* APPROVAL VIEW */
                        <div className="space-y-6 animate-fade-up">
                            <div className="space-y-2 text-xs text-text-dim leading-relaxed">
                                <p>
                                    Confirmar la aprobación activará el estado del grupo de investigación a <span className="text-emerald-400 font-extrabold">APROBADO</span>, habilitándolo para vincular proyectos y convocatorias institucionales.
                                </p>
                                <p>
                                    Defina el identificador de la Resolución de Aprobación del Consejo de Investigación o Dirección:
                                </p>
                            </div>

                            <div className="bento-card static p-5 space-y-3">
                                <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} className="text-emerald-400" /> Resolución de Aprobación Oficial
                                </label>
                                <div className="divider-vercel !my-0" />
                                <input
                                    required
                                    type="text"
                                    value={reviewResolution}
                                    onChange={(e) => setReviewResolution(e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 uppercase font-mono font-medium"
                                    placeholder="Ej: ACTA-DI-2026-008"
                                />
                            </div>
                        </div>
                    ) : (
                        /* REJECTION VIEW */
                        <div className="space-y-6 animate-fade-up">
                            <div className="space-y-2 text-xs text-text-dim leading-relaxed">
                                <p>
                                    Rechazar la propuesta devolverá el grupo al estado <span className="text-red-400 font-extrabold">RECHAZADO</span>.
                                    El equipo proponente recibirá una notificación y podrá editar la propuesta para adaptarla a sus observaciones.
                                </p>
                                <p>
                                    Proporcione los motivos de manera profesional. Puede escribir los detalles y/o **grabar una explicación verbal** (audio explicativo) para mayor claridad:
                                </p>
                            </div>

                            {/* Text Observations */}
                            <div className="bento-card static p-5 space-y-3">
                                <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} className="text-red-400" /> Observaciones Escritas
                                </label>
                                <div className="divider-vercel !my-0" />
                                <textarea
                                    rows={4}
                                    value={rejectObservations}
                                    onChange={(e) => setRejectObservations(e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin focus:border-red-500 rounded-lg p-3 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                    placeholder="Describa los aspectos a corregir o completar (ej: replantear la visión, reestructurar los semilleristas)..."
                                />
                            </div>

                            {/* Audio Rejection Recorder */}
                            <div className="bento-card static p-5 space-y-4">
                                <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    <Mic size={12} className="text-red-400" /> Retroalimentación de Audio (Voz)
                                </label>
                                <div className="divider-vercel !my-0" />

                                {isRecording ? (
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col items-center gap-4 justify-center animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                            <span className="text-xs font-black uppercase text-red-400 tracking-wider font-mono">
                                                GRABANDO RETROALIMENTACIÓN DE VOZ ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                            </span>
                                        </div>

                                        {/* Equalizer animation */}
                                        <div className="flex items-end gap-1 h-8 justify-center w-full">
                                            {Array.from({ length: 14 }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className="w-1 bg-red-500 rounded-full animate-bounce"
                                                    style={{
                                                        height: '100%',
                                                        animationDelay: `${i * 100}ms`,
                                                        animationDuration: '0.6s'
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                                        >
                                            Detener Grabación
                                        </button>
                                    </div>
                                ) : audioUrl ? (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 items-center justify-center animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={14} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono">GRABACIÓN LISTA PARA SER ENVIADA</span>
                                        </div>
                                        <AudioBubblePlayer src={audioUrl} />
                                        <button
                                            type="button"
                                            onClick={clearAudio}
                                            className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Descartar y Grabar de Nuevo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-6 border border-dashed border-border-thin rounded-xl bg-bg-deep/20 flex flex-col items-center justify-center gap-3">
                                        <Mic size={24} className="text-text-dim/40" />
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">¿Desea agregar comentarios de voz?</p>
                                            <p className="text-[8px] text-text-dim max-w-[280px] uppercase font-mono">El equipo docente apreciará una explicación verbal detallada sobre el rechazo.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="px-5 py-2.5 bg-text-main text-bg-deep font-bold text-[9px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
                                        >
                                            <Mic size={12} strokeWidth={2.5} /> Grabar Comentarios de Voz
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer shrink-0">
                    <button
                        onClick={handleCloseReviewModal}
                        className="btn-vercel-secondary"
                    >
                        Cancelar
                    </button>

                    {!isReviewRejecting ? (
                        <button
                            onClick={handleApprove}
                            disabled={isConfirming}
                            className="btn-vercel-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isConfirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            {isConfirming ? 'Procesando...' : 'Confirmar y Aprobar'}
                        </button>
                    ) : (
                        <button
                            disabled={sendingFeedback || (!rejectObservations.trim() && !audioBlob)}
                            onClick={handleRejectReview}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] uppercase tracking-widest rounded-md transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
                        >
                            {sendingFeedback ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Confirmar y Rechazar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
