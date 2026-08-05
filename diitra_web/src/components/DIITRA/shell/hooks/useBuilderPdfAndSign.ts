import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';

export interface UseBuilderPdfAndSignProps {
    templateCode: string;
    formData: any;
    documentUuid?: string;
    entityUuid?: string;
    projectStatus?: string;
    signatureType?: string;
    addAudit: (msg: string, type?: string) => void;
}

export const useBuilderPdfAndSign = ({
    templateCode,
    formData,
    documentUuid,
    entityUuid,
    projectStatus,
    addAudit
}: UseBuilderPdfAndSignProps) => {
    const { addToast } = useNotifications();

    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isDraftMode, setIsDraftMode] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [signaturePassword, setSignaturePassword] = useState('');
    const [institutionalPassword, setInstitutionalPassword] = useState('');
    const [signatureCertFile, setSignatureCertFile] = useState<File | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [signatureRefreshTrigger, setSignatureRefreshTrigger] = useState(0);

    // ── Gestión de URL del PDF (revocación de ObjectURL para evitar memory leaks) ──
    useEffect(() => {
        if (!pdfBlob) { setPdfUrl(null); return; }
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        return () => {
            setTimeout(() => URL.revokeObjectURL(url), 100);
        };
    }, [pdfBlob]);

    // ── Generación de PDF ──
    const handleGeneratePdf = useCallback(async (blind = false) => {
        setIsGenerating(true);
        addAudit(blind ? 'Generando vista previa sin identidades...' : 'Generando vista previa del documento...');
        try {
            const response = await api.post(
                `/documents/render?templateCode=${templateCode}&isDraft=${isDraftMode}&isBlind=${blind}`,
                formData,
                { responseType: 'blob' }
            );
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit('PDF Generado exitosamente', 'success');
        } catch (err: any) {
            let errorMsg = err;
            if (err?.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    errorMsg = JSON.parse(text);
                } catch {}
            }
            console.error('[DIITRA] PDF render error:', errorMsg);
            addAudit('Error al generar el documento PDF', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [templateCode, isDraftMode, formData, addAudit]);

    // ── Cargar PDF firmado u oficial ──
    const fetchSignedPdf = useCallback(async (): Promise<boolean> => {
        const targetUuid = entityUuid || documentUuid || formData.Uuid || formData.uuid;
        if (!targetUuid || targetUuid.startsWith('temp_')) return false;

        try {
            const instanceRes = await api.get(`/documents/instances/resolve`, {
                params: { templateCode, entityUuid: targetUuid }
            });
            const finalPath = instanceRes.data?.finalPdfPath || instanceRes.data?.final_pdf_path || instanceRes.data?.FinalPdfPath;

            if (finalPath) {
                const cleanPath = finalPath.replace(/\\/g, '/');
                const fileRes = await api.get(`/storage/${cleanPath}`, { responseType: 'blob' });
                setPdfBlob(new Blob([fileRes.data], { type: 'application/pdf' }));
                setIsDraftMode(false);
                return true;
            }
        } catch (err) {
            console.error('[DIITRA] Error al consultar/cargar el PDF oficial firmado:', err);
        }
        return false;
    }, [entityUuid, documentUuid, formData.Uuid, formData.uuid, templateCode]);

    // ── Verificar si el proyecto está en fase de edición o corrección activa ──
    const isEditingOrCorrectionState = useCallback(() => {
        if (!projectStatus) return true;
        const normalized = projectStatus.toLowerCase().trim();
        return (
            normalized === 'borrador' ||
            normalized === 'en edición' ||
            normalized === 'en edicion' ||
            normalized === 'en corrección' ||
            normalized === 'en correccion' ||
            normalized === 'corregir' ||
            normalized === 'con observaciones' ||
            normalized === 'devuelto' ||
            normalized === 'rechazado' ||
            normalized.includes('edici') ||
            normalized.includes('correc')
        );
    }, [projectStatus]);

    // Autocargar PDF firmado únicamente si el proyecto está emitido u oficial.
    // Si está en borrador o corrección activa, mantenemos el estado inicial "Listo para generar" hasta que el usuario presione la vista previa.
    useEffect(() => {
        let isMounted = true;
        const initPdf = async () => {
            if (isEditingOrCorrectionState()) {
                setIsDraftMode(true);
                setPdfBlob(null);
                return;
            }

            // Si el proyecto se encuentra emitido u oficial (Enviado, Aprobado, etc.), cargamos el PDF oficial firmado.
            const hasSigned = await fetchSignedPdf();
            if (!hasSigned && isMounted) {
                setPdfBlob(null);
            }
        };
        initPdf();
        return () => { isMounted = false; };
    }, [entityUuid, documentUuid, formData.Uuid, formData.uuid, projectStatus, isEditingOrCorrectionState, fetchSignedPdf]);

    // ── Firma Electrónica PAdES — Upload-on-Demand ──
    const handleSign = async () => {
        if (!signatureCertFile) {
            addAudit('Debe adjuntar su archivo de firma digital (.p12) para continuar.', 'warning');
            return;
        }

        setIsSigning(true);
        addAudit('Iniciando proceso de firma electrónica...');
        try {
            const calculatedRol = templateCode === 'OFICIO_APROBACION'
                ? 'Coordinador de Investigación'
                : 'Director de Proyecto';

            const formDataObj = new FormData();
            formDataObj.append('certificate', signatureCertFile);
            formDataObj.append('password', signaturePassword || '');
            formDataObj.append('documentoUuid', documentUuid || formData.Uuid || formData.uuid || '');
            formDataObj.append('rolFirmante', calculatedRol);

            await api.post(
                '/signatures/sign-p12',
                formDataObj,
                {
                    headers: { 'Content-Type': undefined },
                    transformRequest: [(data, headers) => {
                        if (data instanceof FormData) {
                            delete headers['Content-Type'];
                        }
                        return data;
                    }]
                }
            );

            setIsDraftMode(false);
            const loaded = await fetchSignedPdf();
            if (!loaded) {
                await handleGeneratePdf(false);
            }

            setSignatureCertFile(null);
            setSignaturePassword('');
            addAudit('Firma digital avanzada (.p12) aplicada exitosamente.', 'success');

            if (templateCode === 'OFICIO_APROBACION') {
                const pUuid = entityUuid || formData.EntityUuid || formData.entityUuid;
                if (pUuid && !pUuid.startsWith('temp_')) {
                    try {
                        await api.post(`/PeerReviews/project/${pUuid}/iniciar-ejecucion`);
                        addAudit('Proyecto promovido oficialmente a la fase "En Ejecución".', 'success');
                    } catch (e) {
                        console.warn('[DIITRA] Transición a En Ejecución tras firma:', e);
                    }
                }
            }

            setSignatureRefreshTrigger(prev => prev + 1);
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
        } catch (err: any) {
            console.error('[DIITRA] Error signing document:', err);

            let serverMessage = '';
            try {
                if (err?.response?.data?.error) {
                    serverMessage = err.response.data.error;
                } else if (typeof err?.response?.data === 'string') {
                    serverMessage = err.response.data;
                } else if (err?.response?.data?.message) {
                    serverMessage = err.response.data.message;
                }
            } catch {}

            const isLopdpGate = serverMessage.toLowerCase().includes('términos') ||
                serverMessage.toLowerCase().includes('lopdp') ||
                serverMessage.toLowerCase().includes('consentimiento');

            let finalMsg = '';
            if (isLopdpGate) {
                finalMsg = 'Firma bloqueada: Acepte los términos de firma en Configuración → Mi Cuenta y Firma';
                addAudit(finalMsg, 'warning');
                addToast('Firma Bloqueada', finalMsg, 'warning');
            } else if (serverMessage) {
                finalMsg = serverMessage;
                addAudit(`Error de firma: ${serverMessage}`, 'error');
                addToast('Error de Firma', finalMsg, 'error');
            } else {
                finalMsg = 'Clave o certificado inválido';
                addAudit('Error de firma: Clave o certificado inválido', 'error');
                addToast('Error de Firma', finalMsg, 'error');
            }
        } finally {
            setIsSigning(false);
        }
    };

    const handleSignDiitra = async () => {
        if (!institutionalPassword.trim()) {
            addAudit('Debe ingresar su contraseña institucional para firmar.', 'warning');
            return;
        }

        setIsSigning(true);
        addAudit('Iniciando proceso de firma institucional DIITRA...');
        try {
            const calculatedRol = templateCode === 'OFICIO_APROBACION'
                ? 'Coordinador de Investigación'
                : 'Director de Proyecto';

            const dto = {
                documento_uuid: documentUuid || formData.Uuid || formData.uuid || '',
                rol_firmante: calculatedRol,
                password: institutionalPassword
            };

            await api.post('/signatures/sign', dto);

            setIsDraftMode(false);
            const loaded = await fetchSignedPdf();
            if (!loaded) {
                await handleGeneratePdf(false);
            }

            setInstitutionalPassword('');
            addAudit('Firma institucional DIITRA aplicada exitosamente.', 'success');

            if (templateCode === 'OFICIO_APROBACION') {
                const pUuid = entityUuid || formData.EntityUuid || formData.entityUuid;
                if (pUuid && !pUuid.startsWith('temp_')) {
                    try {
                        await api.post(`/PeerReviews/project/${pUuid}/iniciar-ejecucion`);
                        addAudit('Proyecto promovido oficialmente a la fase "En Ejecución".', 'success');
                    } catch (e) {
                        console.warn('[DIITRA] Transición a En Ejecución tras firma:', e);
                    }
                }
            }

            setSignatureRefreshTrigger(prev => prev + 1);
            window.dispatchEvent(new CustomEvent('diitra-projects-changed'));
        } catch (err: any) {
            console.error('[DIITRA] Error al aplicar firma institucional:', err);
            let serverMessage = '';
            try {
                if (err?.response?.data instanceof Blob) {
                    const text = await err.response.data.text();
                    const parsed = JSON.parse(text);
                    serverMessage = parsed?.error || parsed?.message || '';
                } else if (err?.response?.data?.error) {
                    serverMessage = err.response.data.error;
                } else if (err?.response?.data?.message) {
                    serverMessage = err.response.data.message;
                } else if (typeof err?.response?.data === 'string') {
                    serverMessage = err.response.data;
                }
            } catch {}
            
            const finalMsg = serverMessage || 'Contraseña incorrecta o error de red';
            addAudit(`Error de firma: ${finalMsg}`, 'error');
            addToast('Error de Firma', finalMsg, 'error');
        } finally {
            setIsSigning(false);
        }
    };

    return {
        pdfBlob,
        pdfUrl,
        isDraftMode,
        setIsDraftMode,
        isGenerating,
        signaturePassword,
        setSignaturePassword,
        institutionalPassword,
        setInstitutionalPassword,
        signatureCertFile,
        setSignatureCertFile,
        isSigning,
        signatureRefreshTrigger,
        handleGeneratePdf,
        handleSign,
        handleSignDiitra
    };
};
