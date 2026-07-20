import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../../../api/axios_config';
import { buildWorkspacePath } from '../../../../core/documents/templateUrl';
import { useConfirm } from '../../../../api/ConfirmContext';
import type { SelectedPerson } from '../components/RecipientPicker';
import type {
    EmailTemplate, Proyecto, Convocatoria, PeerReview, AttachmentFile
} from '../emailEngineTypes';
import {
    AUTO_TOKENS,
    TEMPLATE_RECOMMENDED_CONTEXT,
    applyTokenReplacements,
    buildBodyWithAdditionalMessage,
    buildEmailSendPayload,
    buildTemplateDataForSend,
    getSubjectVariants,
    getPreviewDefaults
} from '../emailEngineConfig';
import {
    buildExtraDataForPreview,
    clearContextTokenValues,
    renderMasterLayoutPreview,
    resolveActionUrlForPreview,
    stripEmbeddedContextBlocks
} from '../emailPreviewLayout';

export interface UseEmailComposerProps {
    templates: EmailTemplate[];
    projects: Proyecto[];
    convocatorias: Convocatoria[];
    peerReviews: PeerReview[];
}

export interface UseEmailComposerResult {
    selectedTemplateId: string;
    setSelectedTemplateId: (id: string) => void;
    subjectVariantId: string;
    setSubjectVariantId: (id: string) => void;
    customSubject: string;
    setCustomSubject: (s: string) => void;
    additionalMessage: string;
    setAdditionalMessage: (m: string) => void;
    selectedPeople: SelectedPerson[];
    setSelectedPeople: React.Dispatch<React.SetStateAction<SelectedPerson[]>>;
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    selectedCarreraId: string;
    setSelectedCarreraId: (id: string) => void;
    contextType: string;
    setContextType: (type: string) => void;
    selectedEntityUuid: string;
    setSelectedEntityUuid: (uuid: string) => void;
    systemAttachments: Record<string, boolean>;
    setSystemAttachments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    emailSubject: string;
    setEmailSubject: (s: string) => void;
    emailBody: string;
    setEmailBody: (b: string) => void;
    detectedTokens: string[];
    tokenValues: Record<string, string>;
    setTokenValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    attachments: AttachmentFile[];
    signatureFile: File | null;
    setSignatureFile: (file: File | null) => void;
    signaturePassword: string;
    setSignaturePassword: (p: string) => void;
    sending: boolean;
    sendResult: { success: boolean; message: string } | null;
    setSendResult: (res: { success: boolean; message: string } | null) => void;
    selectedTemplate: EmailTemplate | undefined;
    subjectVariants: Array<{ id: string; label: string; asunto: string }>;
    userFacingTokens: string[];
    autoFilledTokens: string[];
    parsedPreview: { subject: string; body: string; fullHtml: string; recipientName: string };
    handleTemplateChange: (templateId: string) => void;
    handleSubjectVariantChange: (variantId: string) => void;
    handleTokenValChange: (token: string, value: string) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeAttachment: (index: number) => void;
    handleSendEmail: (e: React.FormEvent) => Promise<void>;
}

export const useEmailComposer = ({
    templates,
    projects,
    convocatorias,
    peerReviews
}: UseEmailComposerProps): UseEmailComposerResult => {
    const hasAutoSelectedRef = useRef(false);
    const confirm = useConfirm();

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subjectVariantId, setSubjectVariantId] = useState<string>('default');
    const [customSubject, setCustomSubject] = useState<string>('');
    const [additionalMessage, setAdditionalMessage] = useState<string>('');
    const [selectedPeople, setSelectedPeople] = useState<SelectedPerson[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedCarreraId, setSelectedCarreraId] = useState<string>('');
    const [contextType, setContextType] = useState<string>('');
    const [selectedEntityUuid, setSelectedEntityUuid] = useState<string>('');
    const [systemAttachments, setSystemAttachments] = useState<Record<string, boolean>>({
        'PROTOCOLO_INVESTIGACION': false,
        'DICTAMEN_ARBITRAJE': false,
        'RUBRICA_DINAMICA': false
    });
    const [emailSubject, setEmailSubject] = useState<string>('');
    const [emailBody, setEmailBody] = useState<string>('');
    const [detectedTokens, setDetectedTokens] = useState<string[]>([]);
    const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePassword, setSignaturePassword] = useState<string>('');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

    const selectedTemplate = useMemo(
        () => templates.find(t => t.idEmailTemplate.toString() === selectedTemplateId),
        [templates, selectedTemplateId]
    );

    const subjectVariants = useMemo(
        () => (selectedTemplate ? getSubjectVariants(selectedTemplate) : []),
        [selectedTemplate]
    );

    const applyTemplate = useCallback((templateId: string) => {
        const t = templates.find(temp => temp.idEmailTemplate.toString() === templateId);
        if (!t) {
            setSelectedTemplateId('');
            setEmailBody('');
            setSubjectVariantId('default');
            setEmailSubject('');
            setCustomSubject('');
            setContextType('');
            setSelectedEntityUuid('');
            return;
        }

        setSelectedTemplateId(templateId);
        setEmailBody(t.cuerpoHtml);

        const variants = getSubjectVariants(t);
        const defaultVariant = variants[0];
        setSubjectVariantId(defaultVariant?.id ?? 'default');
        setEmailSubject(defaultVariant?.asunto ?? t.asunto);
        setCustomSubject('');

        const recommended = TEMPLATE_RECOMMENDED_CONTEXT[t.codigo];
        if (recommended) {
            setContextType(recommended.entityType);
            setSelectedEntityUuid('');
        }
    }, [templates]);

    useEffect(() => {
        const active = templates.filter(t => t.activo);
        if (active.length > 0 && !selectedTemplateId && !hasAutoSelectedRef.current) {
            applyTemplate(active[0].idEmailTemplate.toString());
            hasAutoSelectedRef.current = true;
        }
    }, [templates, selectedTemplateId, applyTemplate]);

    // Auto-detect variables tokens like [[variable_name]]
    useEffect(() => {
        const text = emailSubject + ' ' + emailBody;
        const regex = /\[\[([a-zA-Z0-9_]+)\]\]/g;
        const found: string[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            const token = match[0];
            if (!found.includes(token)) {
                found.push(token);
            }
        }
        setDetectedTokens(found);

        setTokenValues(prev => {
            const next: Record<string, string> = {};
            found.forEach(tok => {
                next[tok] = prev[tok] !== undefined ? prev[tok] : '';
            });
            return next;
        });
    }, [emailSubject, emailBody]);

    const handleTemplateChange = (templateId: string) => {
        applyTemplate(templateId);
    };

    const handleSubjectVariantChange = (variantId: string) => {
        setSubjectVariantId(variantId);
        if (variantId === 'personalizado') return;
        const variant = subjectVariants.find(v => v.id === variantId);
        if (variant) setEmailSubject(variant.asunto);
    };

    const buildFinalBody = useCallback(
        () => buildBodyWithAdditionalMessage(emailBody, additionalMessage),
        [emailBody, additionalMessage]
    );

    const resolveFinalSubject = useCallback(() => {
        if (subjectVariantId === 'personalizado') return customSubject.trim() || emailSubject;
        return emailSubject;
    }, [subjectVariantId, customSubject, emailSubject]);

    const userFacingTokens = useMemo(() => {
        return detectedTokens.filter(tok => !AUTO_TOKENS.has(tok) && tok !== '[[mensaje_adicional]]');
    }, [detectedTokens]);

    const autoFilledTokens = useMemo(() => {
        return detectedTokens.filter(tok => AUTO_TOKENS.has(tok));
    }, [detectedTokens]);

    // Vaciar tokens de contexto cuando no hay instancia vinculada
    useEffect(() => {
        if (!contextType) return;
        if (selectedEntityUuid) return;
        setTokenValues(prev => clearContextTokenValues(prev, contextType));
    }, [contextType, selectedEntityUuid]);

    // Auto-inject dynamic context values based on entity type and uuid
    useEffect(() => {
        if (!contextType || !selectedEntityUuid) return;

        if (contextType === 'Proyecto') {
            const p = projects.find(proj => proj.uuid === selectedEntityUuid);
            if (p) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[proyecto_titulo]]': p.titulo || '',
                    '[[proyecto_codigo]]': p.codigo_institucional || 'N/A',
                    '[[proyecto_descripcion]]': p.descripcion || 'Sin descripción',
                    '[[proyecto_estado]]': p.estado || 'En Ejecución',
                    '[[linea_investigacion]]': p.linea_investigacion || 'General',
                    '[[proyecto_workspace_url]]': `${window.location.origin}${buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid)}`
                }));
            }
        } else if (contextType === 'Convocatoria') {
            const c = convocatorias.find(conv => conv.uuid === selectedEntityUuid);
            if (c) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[convocatoria_titulo]]': c.titulo || '',
                    '[[convocatoria_codigo]]': c.codigoConvocatoria || 'N/A',
                    '[[convocatoria_anio]]': (c.anio || new Date().getFullYear()).toString(),
                    '[[convocatoria_apertura]]': c.fechaApertura ? c.fechaApertura.split('T')[0] : '',
                    '[[convocatoria_cierre]]': c.fechaCierre ? c.fechaCierre.split('T')[0] : '',
                    '[[convocatoria_presupuesto]]': c.presupuestoTotal ? `$${c.presupuestoTotal.toLocaleString()}` : '$0.00',
                    '[[convocatoria_monto_maximo]]': (c.montoMaximoProyecto ?? c.presupuestoTotal) ? `$${(c.montoMaximoProyecto ?? c.presupuestoTotal)?.toLocaleString()}` : '$0.00',
                    '[[convocatoria_bases_url]]': c.urlBases || '',
                    '[[convocatoria_estado]]': c.estado || 'Borrador'
                }));
            }
        } else if (contextType === 'PeerReview') {
            const r = peerReviews.find(rev => rev.uuid === selectedEntityUuid);
            if (r) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[revisor_nombre]]': r.revisorNombre || 'Revisor Externo',
                    '[[revisor_email]]': r.revisorEmail || '',
                    '[[proyecto_titulo]]': r.proyectoTitulo || 'Sin título',
                    '[[peer_review_dictamen]]': r.dictamenRevisor || 'Pendiente',
                    '[[peer_review_estado]]': r.estado || 'Pendiente',
                    '[[peer_review_fecha_limite]]': r.fechaLimite ? r.fechaLimite.split('T')[0] : '',
                    '[[peer_review_puntaje]]': r.puntajeTotal?.toString() || '0',
                    '[[peer_review_observaciones]]': r.observacionesGral || '',
                    '[[peer_review_tipo]]': r.esExterno ? 'Externo' : 'Interno',
                    '[[peer_review_anonimo]]': r.esDobleCiego ? 'Anónimo' : 'Abierto'
                }));
            }
        }
    }, [contextType, selectedEntityUuid, projects, convocatorias, peerReviews]);

    const handleTokenValChange = (token: string, value: string) => {
        setTokenValues(prev => ({
            ...prev,
            [token]: value
        }));
    };

    const previewReplacements = useMemo(() => {
        const base = { ...tokenValues };
        if (selectedPeople[0]) {
            base['[[destinatario_nombre]]'] = selectedPeople[0].nombre;
            if (selectedPeople[0].email?.includes('@')) {
                base['[[destinatario_email]]'] = selectedPeople[0].email;
            }
        }
        return base;
    }, [tokenValues, selectedPeople]);

    const hasLinkedContext = Boolean(contextType && selectedEntityUuid);

    const parsedPreview = useMemo(() => {
        const origin = window.location.origin;
        const subjectTemplate = resolveFinalSubject();
        const bodyTemplate = buildFinalBody();
        const subject = applyTokenReplacements(subjectTemplate, previewReplacements, 'text');
        let innerBody = applyTokenReplacements(bodyTemplate, previewReplacements, 'html');
        if (!hasLinkedContext) {
            innerBody = stripEmbeddedContextBlocks(innerBody);
        }
        const recipientName =
            previewReplacements['[[destinatario_nombre]]'] ??
            getPreviewDefaults(origin)['[[destinatario_nombre]]'];
        const extraData = hasLinkedContext
            ? buildExtraDataForPreview(previewReplacements)
            : undefined;
        const actionUrl = hasLinkedContext
            ? resolveActionUrlForPreview(previewReplacements, innerBody, origin)
            : resolveActionUrlForPreview(
                { '[[sistema_url]]': origin },
                innerBody,
                origin
            );
        const fullHtml = renderMasterLayoutPreview({
            title: subject || 'Notificación DIITRA',
            recipientName,
            innerBodyHtml: innerBody,
            origin,
            actionUrl,
            extraData
        });
        return { subject, body: innerBody, fullHtml, recipientName };
    }, [
        previewReplacements,
        resolveFinalSubject,
        buildFinalBody,
        hasLinkedContext
    ]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const base64String = (event.target.result as string).split(',')[1];
                    setAttachments(prev => [
                        ...prev,
                        {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            base64: base64String
                        }
                    ]);
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendResult(null);

        const emailsList = Array.from(new Set(
            selectedPeople.map(p => p.email).filter(e => e.includes('@'))
        ));
        const userIdsList = Array.from(new Set(
            selectedPeople
                .filter(p => p.idUsuario != null && p.idUsuario > 0)
                .map(p => p.idUsuario as number)
        ));

        if (!selectedTemplateId || !selectedTemplate) {
            setSendResult({ success: false, message: 'Seleccione un tipo de comunicación (plantilla) para continuar.' });
            setSending(false);
            return;
        }

        if (emailsList.length === 0 && userIdsList.length === 0 && !selectedRole && !selectedCarreraId) {
            setSendResult({ success: false, message: 'Debe agregar al menos un destinatario o seleccionar un filtro de rol/carrera.' });
            setSending(false);
            return;
        }

        const finalSubject = resolveFinalSubject();
        const finalBody = buildFinalBody();
        if (!finalSubject.trim()) {
            setSendResult({ success: false, message: 'El asunto del correo no puede estar vacío.' });
            setSending(false);
            return;
        }

        const totalSpecific = selectedPeople.length;
        if (totalSpecific > 100) {
            setSendResult({ success: false, message: 'No puedes enviar a más de 100 destinatarios específicos por lote. Por favor, remueve algunos destinatarios.' });
            setSending(false);
            return;
        }

        const isMassive = Boolean(selectedRole || selectedCarreraId);
        if (isMassive || totalSpecific > 5) {
            const destText = isMassive 
                ? "un envío de difusión masiva según los filtros seleccionados"
                : `un envío a ${totalSpecific} destinatarios específicos`;

            const accepted = await confirm({
                title: "Confirmar Envío de Correos",
                message: `Estás a punto de procesar ${destText}. El motor de correos los encolará en segundo plano aplicando un retardo controlado de 1.5 segundos por correo para evitar ser catalogados como spam. ¿Estás seguro de continuar?`,
                confirmText: "Confirmar Envío",
                cancelText: "Cancelar",
                variant: "primary"
            });

            if (!accepted) {
                setSending(false);
                return;
            }
        }

        let certificateBase64: string | null = null;
        if (signatureFile) {
            certificateBase64 = await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        const base64String = (event.target.result as string).split(',')[1];
                        resolve(base64String);
                    } else {
                        resolve(null);
                    }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(signatureFile);
            });
        }

        const payload = buildEmailSendPayload({
            templateCodigo: selectedTemplate.codigo,
            destinatariosEmails: emailsList,
            destinatariosUserIds: userIdsList,
            targetRole: selectedRole || null,
            targetCarreraId: selectedCarreraId ? parseInt(selectedCarreraId, 10) : null,
            customSubject: finalSubject,
            customBody: finalBody,
            templateData: buildTemplateDataForSend(tokenValues),
            attachments: [
                ...attachments.map(a => ({
                    nombreArchivo: a.name,
                    base64Content: a.base64,
                    contentType: a.type
                })),
                ...Object.entries(systemAttachments)
                    .filter(([_, active]) => active)
                    .map(([code]) => ({
                        nombreArchivo: `${code.toLowerCase()}_autogenerado.pdf`,
                        rutaArchivo: `SYSTEM:${code}`,
                        contentType: 'application/pdf'
                    }))
            ],
            entityUuid: selectedEntityUuid || null,
            entityType: contextType || null,
            certificateBase64: certificateBase64,
            signaturePassword: signaturePassword || null
        });

        try {
            const res = await api.post('/Admin/email-engine/send', payload);
            setSendResult({ success: true, message: res.data.message || 'Lote de correos encolado exitosamente. Se procesará en segundo plano.' });

            // Clean fields upon success
            setSelectedPeople([]);
            setAttachments([]);
            setContextType('');
            setSelectedEntityUuid('');
            setSystemAttachments({
                'PROTOCOLO_INVESTIGACION': false,
                'DICTAMEN_ARBITRAJE': false,
                'RUBRICA_DINAMICA': false
            });
            setSelectedRole('');
            setSelectedCarreraId('');
            setTokenValues({});
            setAdditionalMessage('');
            setSignatureFile(null);
            setSignaturePassword('');
            if (selectedTemplateId) applyTemplate(selectedTemplateId);
        } catch (err: any) {
            console.error('[DIITRA EMAIL ENGINE] Error sending templated email:', err);
            const apiMessage = err.response?.data?.message;
            setSendResult({
                success: false,
                message: apiMessage
                    || (err.response?.status === 400
                        ? 'No se encontraron destinatarios válidos. Verifique los correos ingresados.'
                        : 'Error al despachar el correo. Revise el historial de envíos o la configuración del servidor de correo.')
            });
        } finally {
            setSending(false);
        }
    };

    return {
        selectedTemplateId,
        setSelectedTemplateId,
        subjectVariantId,
        setSubjectVariantId,
        customSubject,
        setCustomSubject,
        additionalMessage,
        setAdditionalMessage,
        selectedPeople,
        setSelectedPeople,
        selectedRole,
        setSelectedRole,
        selectedCarreraId,
        setSelectedCarreraId,
        contextType,
        setContextType,
        selectedEntityUuid,
        setSelectedEntityUuid,
        systemAttachments,
        setSystemAttachments,
        emailSubject,
        setEmailSubject,
        emailBody,
        setEmailBody,
        detectedTokens,
        tokenValues,
        setTokenValues,
        attachments,
        signatureFile,
        setSignatureFile,
        signaturePassword,
        setSignaturePassword,
        sending,
        sendResult,
        setSendResult,
        selectedTemplate,
        subjectVariants,
        userFacingTokens,
        autoFilledTokens,
        parsedPreview,
        handleTemplateChange,
        handleSubjectVariantChange,
        handleTokenValChange,
        handleFileChange,
        removeAttachment,
        handleSendEmail
    };
};
