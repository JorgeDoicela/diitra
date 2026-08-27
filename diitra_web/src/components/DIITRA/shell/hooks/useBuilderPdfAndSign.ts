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
    const [isSignedModalOpen, setIsSignedModalOpen] = useState(false);
    const [signedModalData, setSignedModalData] = useState<{
        documentTitle?: string;
        rolFirmante?: string;
        fechaFirma?: string;
    } | null>(null);

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
            let instanceData: any = null;
            const currentDocId = documentUuid || formData.Uuid || formData.uuid;
            if (currentDocId && !currentDocId.startsWith('temp_')) {
                try {
                    const directRes = await api.get(`/documents/instances/${currentDocId}`);
                    if (directRes?.data?.finalPdfPath || directRes?.data?.final_pdf_path) {
                        instanceData = directRes.data;
                    }
                } catch { }
            }

            if (!instanceData) {
                const instanceRes = await api.get(`/documents/instances/resolve`, {
                    params: { templateCode, entityUuid: targetUuid }
                });
                instanceData = instanceRes.data;
            }

            const finalPath = instanceData?.finalPdfPath || instanceData?.final_pdf_path || instanceData?.FinalPdfPath;

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

    // Autocargar PDF firmado si existe; si no, mantener estado inicial en borrador
    useEffect(() => {
        let isMounted = true;
        const initPdf = async () => {
            const hasSigned = await fetchSignedPdf();
            if (hasSigned) {
                if (isMounted) setIsDraftMode(false);
                return;
            }

            if (isMounted) {
                setIsDraftMode(true);
            }
        };
        initPdf();
        return () => { isMounted = false; };
    }, [entityUuid, documentUuid, projectStatus, signatureRefreshTrigger, fetchSignedPdf]);

    // ── Firma Electrónica PAdES — Upload-on-Demand ──
    const handleSign = async () => {
        if (!signatureCertFile) {
            addAudit('Debe adjuntar su archivo de firma digital (.p12) para continuar.', 'warning');
            return;
        }

        setIsSigning(true);
        addAudit('Iniciando proceso de firma electrónica...');
        try {
            const calculatedRol = (templateCode === 'OFICIO_APROBACION' || templateCode === 'EVALUACION_PLAN_APRENDIZAJE')
                ? 'Coordinador de Investigación'
                : 'Director de Proyecto';

            let targetDocUuid = documentUuid || formData?.Uuid || formData?.uuid;
            const pUuid = entityUuid || formData?.EntityUuid || formData?.entityUuid;

            if ((!targetDocUuid || targetDocUuid.startsWith('temp_') || targetDocUuid === pUuid) && pUuid && templateCode) {
                try {
                    const res = await api.get('/documents/instances/resolve', {
                        params: { templateCode, entityUuid: pUuid }
                    });
                    targetDocUuid = res.data?.uuid || res.data?.Uuid || targetDocUuid;
                } catch {}
            }

            const formDataObj = new FormData();
            formDataObj.append('certificate', signatureCertFile);
            formDataObj.append('password', signaturePassword || '');
            formDataObj.append('documentoUuid', targetDocUuid || '');
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

            const docLabel = templateCode === 'OFICIO_APROBACION' 
                ? 'Oficio de Aprobación Institucional' 
                : 'Protocolo de Investigación';

            setSignedModalData({
                documentTitle: docLabel,
                rolFirmante: calculatedRol,
                fechaFirma: new Date().toLocaleString()
            });
            setIsSignedModalOpen(true);

            if (templateCode === 'OFICIO_APROBACION') {
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
            const isProfileMissing = serverMessage.toLowerCase().includes('perfil') ||
                serverMessage.toLowerCase().includes('cargo') ||
                serverMessage.toLowerCase().includes('trazo') ||
                serverMessage.toLowerCase().includes('firma institucional');

            let finalMsg = '';
            if (isLopdpGate) {
                finalMsg = 'Firma bloqueada: Acepte los términos de firma en Configuración → Mi Cuenta y Firma';
                addAudit(finalMsg, 'warning');
                addToast('Firma Bloqueada', finalMsg, 'warning', '/configuracion?mainTab=perfil#lopdp', undefined, 'Configurar');
            } else if (isProfileMissing) {
                finalMsg = serverMessage;
                addAudit(`Error de firma: ${serverMessage}`, 'error');
                addToast('Error de Firma', finalMsg, 'error', '/configuracion?editFirma=true#perfil-firma', undefined, 'Configurar');
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
            const calculatedRol = (templateCode === 'OFICIO_APROBACION' || templateCode === 'EVALUACION_PLAN_APRENDIZAJE')
                ? 'Coordinador de Investigación'
                : 'Director de Proyecto';

            let targetDocUuid = documentUuid || formData?.Uuid || formData?.uuid;
            const pUuid = entityUuid || formData?.EntityUuid || formData?.entityUuid;

            if ((!targetDocUuid || targetDocUuid.startsWith('temp_') || targetDocUuid === pUuid) && pUuid && templateCode) {
                try {
                    const res = await api.get('/documents/instances/resolve', {
                        params: { templateCode, entityUuid: pUuid }
                    });
                    targetDocUuid = res.data?.uuid || res.data?.Uuid || targetDocUuid;
                } catch {}
            }

            const dto = {
                documento_uuid: targetDocUuid || '',
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

            const docLabel = templateCode === 'OFICIO_APROBACION' 
                ? 'Oficio de Aprobación Institucional' 
                : 'Protocolo de Investigación';

            setSignedModalData({
                documentTitle: docLabel,
                rolFirmante: calculatedRol,
                fechaFirma: new Date().toLocaleString()
            });
            setIsSignedModalOpen(true);

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
            const lowerMsg = finalMsg.toLowerCase();
            const isProfileMissing = lowerMsg.includes('perfil') || 
                                     lowerMsg.includes('trazo') || 
                                     lowerMsg.includes('cargo') || 
                                     lowerMsg.includes('configure') || 
                                     lowerMsg.includes('firma institucional');
            const isLopdpGate = lowerMsg.includes('términos') || 
                                lowerMsg.includes('lopdp') || 
                                lowerMsg.includes('consentimiento');

            addAudit(`Error de firma: ${finalMsg}`, 'error');
            
            if (isProfileMissing) {
                addToast(
                    'Error de Firma', 
                    finalMsg, 
                    'error', 
                    '/configuracion?editFirma=true#perfil-firma', 
                    undefined, 
                    'Configurar'
                );
            } else if (isLopdpGate) {
                addToast(
                    'Firma Bloqueada', 
                    finalMsg, 
                    'warning', 
                    '/configuracion?mainTab=perfil#lopdp', 
                    undefined, 
                    'Configurar'
                );
            } else {
                addToast('Error de Firma', finalMsg, 'error');
            }
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
        isSignedModalOpen,
        setIsSignedModalOpen,
        signedModalData,
        handleGeneratePdf,
        handleSign,
        handleSignDiitra
    };
};
