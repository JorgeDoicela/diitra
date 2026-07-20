import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getRubricaForRevision, submitEvaluation,
    getDictamenPreview, DICTAMEN_CONFIG
} from '../../../../services/peerReviewService';
import type { RubricaDinamicaDto, CriterioRubricaDto } from '../../../../services/peerReviewService';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';

export interface EvaluacionDetalle {
    idCriterio: number;
    criterio: string;
    puntaje: number;
    observaciones: string;
    max: number;
}

export const DEFAULT_RANGES = [
    { label: 'Insatisfactorio', max: 50, badgeClass: 'text-error bg-error/10 border-error/20' },
    { label: 'Poco Satisfactorio', max: 70, badgeClass: 'text-warning bg-warning/10 border-warning/20' },
    { label: 'Satisfactorio', max: 90, badgeClass: 'text-info bg-info/10 border-info/20' },
    { label: 'Excelente', max: 100, badgeClass: 'text-success bg-success/10 border-success/20' }
];

/** Hook de animación de conteo numérico con easing cuadrático */
export const useAnimatedScore = (targetValue: number, duration: number = 500): number => {
    const [displayValue, setDisplayValue] = useState(targetValue);
    const targetRef = useRef(targetValue);
    const animRef = useRef<number | null>(null);
    const startValueRef = useRef(targetValue);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (targetValue === targetRef.current) return;

        targetRef.current = targetValue;
        startValueRef.current = displayValue;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = (timestamp - startTimeRef.current) / duration;

            if (progress >= 1) {
                setDisplayValue(targetValue);
                animRef.current = null;
            } else {
                const ease = progress * (2 - progress);
                const current = startValueRef.current + (targetValue - startValueRef.current) * ease;
                setDisplayValue(current);
                animRef.current = requestAnimationFrame(animate);
            }
        };

        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [targetValue, duration, displayValue]);

    return displayValue;
};

export const useEvaluacionPage = () => {
    const { revisionUuid } = useParams<{ revisionUuid: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();

    const [rubrica, setRubrica] = useState<RubricaDinamicaDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');
    const [observacionesGral, setObservacionesGral] = useState('');

    const [detalles, setDetalles] = useState<EvaluacionDetalle[]>([]);
    const [activeTab, setActiveTab] = useState<'document' | 'rubric'>('document');
    const [cacesRanges, setCacesRanges] = useState<any[]>([]);

    // Cargar rangos cualitativos del CACES
    useEffect(() => {
        const fetchCacesRanges = async () => {
            try {
                const res = await api.get('/catalogs/config-general?prefix=Caces.RangosEvaluacion');
                const rangeConfig = res.data?.find((c: any) => c.clave === 'Caces.RangosEvaluacion');
                if (rangeConfig && rangeConfig.valor) {
                    const parsed = JSON.parse(rangeConfig.valor);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setCacesRanges(parsed);
                        return;
                    }
                }
            } catch (e) {
                console.warn('[DIITRA] No se pudieron cargar los rangos cualitativos del CACES de la BD. Usando fallbacks.', e);
            }
            setCacesRanges(DEFAULT_RANGES);
        };
        fetchCacesRanges();
    }, []);

    // Cargar rúbrica de la revisión
    useEffect(() => {
        if (!revisionUuid) return;
        setLoading(true);
        getRubricaForRevision(revisionUuid)
            .then((data: RubricaDinamicaDto) => {
                setRubrica(data);

                const isCompletada = data.estado_revision === 'Completada';
                let initialObservaciones = data.observaciones_gral || '';
                let initialDetalles = data.criterios.map((c: CriterioRubricaDto) => ({
                    idCriterio: c.id_criterio,
                    criterio: c.nombre,
                    puntaje: isCompletada ? (c.puntaje_obtenido ?? 0) : 0,
                    observaciones: isCompletada ? (c.observaciones_criterio ?? '') : '',
                    max: c.puntaje_maximo
                }));

                // Cargar borrador local si no está completada
                if (!isCompletada) {
                    const draftStr = localStorage.getItem(`diitra_peer_review_draft_${revisionUuid}`);
                    if (draftStr) {
                        try {
                            const draft = JSON.parse(draftStr);
                            if (draft && draft.detalles) {
                                initialDetalles = initialDetalles.map((fetched: EvaluacionDetalle) => {
                                    const draftDet = draft.detalles.find((d: any) => d.idCriterio === fetched.idCriterio);
                                    if (draftDet) {
                                        return {
                                            ...fetched,
                                            puntaje: draftDet.puntaje,
                                            observaciones: draftDet.observaciones || ''
                                        };
                                    }
                                    return fetched;
                                });
                            }
                            if (draft && typeof draft.observacionesGral === 'string') {
                                initialObservaciones = draft.observacionesGral;
                            }
                        } catch (e) {
                            console.error('[DIITRA] Error al parsear borrador local:', e);
                        }
                    }
                }

                setObservacionesGral(initialObservaciones);
                setDetalles(initialDetalles);
            })
            .catch(() => setError('No se pudo cargar la rúbrica de evaluación.'))
            .finally(() => setLoading(false));
    }, [revisionUuid]);

    const puntajeTotal = detalles.reduce((acc, d) => acc + d.puntaje, 0);
    const minimo = rubrica?.puntaje_minimo_aprobacion ?? 70;
    const dictamenPreview = getDictamenPreview(puntajeTotal, minimo);
    const dictamenCfg = DICTAMEN_CONFIG[dictamenPreview];
    const isReadOnly = rubrica?.estado_revision === 'Completada';

    // Auto-save
    useEffect(() => {
        if (isReadOnly || loading || !revisionUuid || detalles.length === 0) return;

        const timer = setTimeout(() => {
            const draftData = {
                detalles,
                observacionesGral,
                timestamp: Date.now()
            };
            localStorage.setItem(`diitra_peer_review_draft_${revisionUuid}`, JSON.stringify(draftData));
        }, 1000);

        return () => clearTimeout(timer);
    }, [detalles, observacionesGral, isReadOnly, loading, revisionUuid]);

    // Puntaje animado
    const animatedTotalScore = useAnimatedScore(puntajeTotal);

    const handlePuntajeChange = (idx: number, val: number) => {
        setDetalles(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], puntaje: val };
            return copy;
        });
    };

    const handleObsChange = (idx: number, val: string) => {
        setDetalles(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], observaciones: val };
            return copy;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revisionUuid) return;
        if (!observacionesGral.trim()) {
            setError('Por favor, escriba una conclusión general antes de enviar la evaluación.');
            return;
        }
        setEnviando(true);
        setError('');
        try {
            await submitEvaluation({
                revision_uuid: revisionUuid,
                detalles: detalles.map(d => ({
                    id_criterio: d.idCriterio > 0 ? d.idCriterio : undefined,
                    criterio: d.criterio,
                    puntaje: d.puntaje,
                    observaciones: d.observaciones || undefined,
                })),
                observaciones_gral: observacionesGral,
            });

            localStorage.removeItem(`diitra_peer_review_draft_${revisionUuid}`);
            setEnviado(true);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al enviar la evaluación. Intente de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    const handleDescargarCiego = async () => {
        if (!rubrica) return;
        try {
            const response = await api.post(
                `/projects/generate-pdf?isDraft=false&isBlind=true`,
                { uuid: rubrica.proyecto_uuid },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `PROTOCOLO_CIEGO_${rubrica.proyecto_uuid.split('-')[0].toUpperCase()}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch {
            addToast('Error de Descarga', 'No se pudo descargar el protocolo.', 'error');
        }
    };

    const handleDescargarRubrica = async () => {
        if (!rubrica) return;
        try {
            const pertinencia = detalles.find(d => d.criterio.includes('Pertinencia'))?.puntaje ?? 0;
            const metodologia = detalles.find(d => d.criterio.includes('Metodología') || d.criterio.includes('Metodologia'))?.puntaje ?? 0;
            const viabilidad = detalles.find(d => d.criterio.includes('Viabilidad') || d.criterio.includes('Presupuesto') || d.criterio.includes('Viabilidad y Presupuesto'))?.puntaje ?? 0;
            const impacto = detalles.find(d => d.criterio.includes('Impacto'))?.puntaje ?? 0;

            const payload = {
                titulo: rubrica.proyecto_titulo,
                entity_uuid: rubrica.proyecto_uuid,
                fecha_evaluacion: new Date().toLocaleDateString('es-EC'),
                Pertinencia: pertinencia,
                Metodologia: metodologia,
                Viabilidad: viabilidad,
                Impacto: impacto,
                ComentariosGenerales: observacionesGral,
                RecomendacionFinal: puntajeTotal >= (rubrica.puntaje_minimo_aprobacion ?? 70) ? "Aprobado sin modificaciones" : "Rechazado"
            };

            const response = await api.post(
                `/documents/render?templateCode=RUBRICA_EVALUACION&isDraft=false&isBlind=true`,
                payload,
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `RUBRICA_CALIFICADA_${rubrica.proyecto_uuid.split('-')[0].toUpperCase()}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('[DIITRA] Error al descargar la rúbrica calificada:', err);
            addToast('Error', 'No se pudo generar ni descargar la rúbrica de evaluación.', 'error');
        }
    };

    const porcentajeCompletado = (puntajeTotal / 100) * 100;
    const criteriosEvaluadosCount = detalles.filter(d => d.puntaje > 0 || d.observaciones.trim() !== '').length;

    return {
        rubrica,
        loading,
        enviando,
        enviado,
        error,
        observacionesGral,
        setObservacionesGral,
        detalles,
        activeTab,
        setActiveTab,
        cacesRanges,
        puntajeTotal,
        minimo,
        dictamenPreview,
        dictamenCfg,
        isReadOnly,
        animatedTotalScore,
        porcentajeCompletado,
        criteriosEvaluadosCount,
        handlePuntajeChange,
        handleObsChange,
        handleSubmit,
        handleDescargarCiego,
        handleDescargarRubrica,
        navigate
    };
};
