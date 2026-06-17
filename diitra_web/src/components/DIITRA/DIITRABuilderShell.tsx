import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, FileText, Save, Users, Clock, Settings, Shield, MessageSquare, AlertCircle, ChevronLeft, X } from 'lucide-react';
import api from '../../api/axios_config';
import type { CoWorkHandle } from '../../core/cowork/types';
import CollaborationSidebar from './CollaborationSidebar';
import { DocumentDataContext } from '../../core/documents/context/DocumentDataContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * DIITRA BUILDER CORE — SHELL UNIVERSAL DE DOCUMENTACIÓN v2.0
 * -------------------------------------------------------------------------
 * Marco profesional e institucional reutilizable para TODOS los tipos de
 * documentos del sistema DIITRA (Protocolos, Rúbricas, Informes, Actas...).
 *
 * PRINCIPIO DE DISEÑO (v2.0 — Inversión de Dependencia):
 * El Shell ya no instancia useCoWork() internamente. Recibe el CoWorkHandle
 * como prop desde el padre. Esto permite:
 *
 *   1. Usar el Shell con colaboración real:
 *      const cowork = useCoWork({ documentId, user });
 *      <DIITRABuilderShell cowork={cowork} ... />
 *   2. Usar el Shell SIN colaboración (documentos del Director, reportes, etc.):
 *      const cowork = createNoOpCoWork();
 *      <DIITRABuilderShell cowork={cowork} ... />
 *
 * GUÍA DE REUSABILIDAD:
 * Para crear un nuevo documento, NO modifiques este archivo.
 * Registra el esquema en DocumentTemplateRegistry y el componente
 * en DocumentComponentRegistry. El DocumentEditor lo ensambla todo.
 */

interface BuilderSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface DIITRABuilderShellProps {
    title: string;
    subtitle: string;
    templateCode: string;
    sections: BuilderSection[];
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    localChangeCount?: number;                            // ← Agregado para controlar el auto-guardado
    cowork: CoWorkHandle;                                // ← Inyectado desde el padre (v2.0)
    onSave?: (data: any) => Promise<void>;
    onClose: () => void;
    readOnly?: boolean;                                  // ← Bandera de sólo lectura
    readOnlyReason?: string;
    projectStatus?: string;
    entityUuid?: string;                                 // ← UUID real del proyecto
    children: (activeTab: string, cowork: CoWorkHandle) => React.ReactNode;
    canSign?: boolean;
}

const DIITRABuilderShell: React.FC<DIITRABuilderShellProps> = ({
    title,
    subtitle,
    templateCode,
    sections,
    formData,
    localChangeCount = 0,                                // ← Valor por defecto
    onSave,
    onClose,
    cowork,      // ← Recibido como prop
    readOnly = false, // ← Bandera de sólo lectura
    readOnlyReason,
    projectStatus,
    entityUuid,
    children,
    canSign = true
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);

    const sectionParam = queryParams.get('section');
    const activeTab = sectionParam || sections[0]?.id || 'general';
    const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('left_sidebar_width');
        return saved ? parseInt(saved, 10) : 320;
    });

    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('right_sidebar_width');
        return saved ? parseInt(saved, 10) : 260;
    });

    const [isLeftSidebarOpen, setIsLeftSidebarOpenState] = useState<boolean>(() => {
        return localStorage.getItem('left_sidebar_open') !== 'false';
    });

    const setIsLeftSidebarOpen = useCallback((open: boolean) => {
        localStorage.setItem('left_sidebar_open', String(open));
        if (open) {
            // Al reabrir, siempre restauramos a un ancho cómodo, no al último valor cercano al límite
            const comfortableWidth = 260;
            setLeftSidebarWidth(comfortableWidth);
            localStorage.setItem('left_sidebar_width', String(comfortableWidth));
            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.width = `${comfortableWidth}px`;
            }
        }
        setIsLeftSidebarOpenState(open);
    }, []);

    const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(() => {
        // En móviles/teléfonos (pantallas < 1024px), no iniciamos el chat abierto por defecto
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            return false;
        }
        return localStorage.getItem('document_sidebar_open') !== 'false';
    });

    const setIsSidebarOpen = useCallback((open: boolean) => {
        localStorage.setItem('document_sidebar_open', String(open));
        if (open) {
            // Al reabrir, siempre restauramos a un ancho cómodo, no al último valor cercano al límite
            const comfortableWidth = 260;
            setRightSidebarWidth(comfortableWidth);
            localStorage.setItem('right_sidebar_width', String(comfortableWidth));
            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.width = `${comfortableWidth}px`;
            }
        }
        setIsSidebarOpenState(open);
    }, []);

    const setActiveTab = useCallback((tabId: string) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('section', tabId);
        navigate({ search: searchParams.toString() }, { replace: true });
    }, [location.search, navigate]);

    // Ref para evitar notificar la misma sección múltiples veces
    const lastNotifiedTabRef = useRef<string | null>(null);

    useEffect(() => {
        if (cowork && cowork.notifySectionActivity && activeTab && !readOnly) {
            // Solo notificar cuando la sección realmente cambia (no en cada re-render)
            if (lastNotifiedTabRef.current !== activeTab) {
                lastNotifiedTabRef.current = activeTab;
                cowork.notifySectionActivity(cowork.session.documentId, activeTab, "ha entrado a redactar");
            }
        }
    }, [cowork, activeTab, readOnly]);

    const leftSidebarRef = useRef<HTMLDivElement>(null);
    const rightSidebarRef = useRef<HTMLDivElement>(null);
    const isDraggingLeft = useRef(false);
    const isDraggingRight = useRef(false);

    const [navTopPercent, setNavTopPercent] = useState<number>(50);
    const [chatTopPercent, setChatTopPercent] = useState<number>(50);
    const [navXOffset, setNavXOffset] = useState<number>(0);
    const [chatXOffset, setChatXOffset] = useState<number>(0);
    const [isDraggingNav, setIsDraggingNav] = useState(false);
    const [isDraggingChat, setIsDraggingChat] = useState(false);
    const bodyContainerRef = useRef<HTMLDivElement>(null);

    const navTopPercentRef = useRef(50);
    const chatTopPercentRef = useRef(50);
    const navXOffsetRef = useRef(0);
    const chatXOffsetRef = useRef(0);
    useEffect(() => { navTopPercentRef.current = navTopPercent; }, [navTopPercent]);
    useEffect(() => { chatTopPercentRef.current = chatTopPercent; }, [chatTopPercent]);
    useEffect(() => { navXOffsetRef.current = navXOffset; }, [navXOffset]);
    useEffect(() => { chatXOffsetRef.current = chatXOffset; }, [chatXOffset]);

    const startDraggingLeft = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();

        isDraggingLeft.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        if (leftSidebarRef.current) {
            leftSidebarRef.current.style.transition = 'none';
        }

        const startWidth = leftSidebarWidth;
        const startX = mouseDownEvent.clientX;
        let maxDelta = 0;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = mouseMoveEvent.clientX - startX;
            maxDelta = Math.max(maxDelta, Math.abs(deltaX));

            const newWidth = Math.max(0, Math.min(500, startWidth + deltaX));
            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.width = `${newWidth}px`;
            }
        };

        const stopDrag = () => {
            isDraggingLeft.current = false;
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);

            const currentWidth = leftSidebarRef.current
                ? parseInt(leftSidebarRef.current.style.width, 10)
                : startWidth;

            const clicked = maxDelta <= 4;
            const releasedInCollapseZone = maxDelta > 4 && currentWidth < 220;
            const shouldCollapse = clicked || releasedInCollapseZone;

            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.transition = 'width 300ms ease-in-out';
            }

            if (shouldCollapse) {
                setIsLeftSidebarOpen(false);
            } else {
                const finalWidth = Math.max(200, Math.min(500, currentWidth));
                setLeftSidebarWidth(finalWidth);
                localStorage.setItem('left_sidebar_width', String(finalWidth));
                if (leftSidebarRef.current) {
                    leftSidebarRef.current.style.width = `${finalWidth}px`;
                }
            }
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [leftSidebarWidth, setIsLeftSidebarOpen]);

    const startDraggingRight = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();

        isDraggingRight.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        if (rightSidebarRef.current) {
            rightSidebarRef.current.style.transition = 'none';
        }

        const startWidth = rightSidebarWidth;
        const startX = mouseDownEvent.clientX;
        let maxDelta = 0;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = startX - mouseMoveEvent.clientX;
            maxDelta = Math.max(maxDelta, Math.abs(deltaX));

            const newWidth = Math.max(0, Math.min(600, startWidth + deltaX));
            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.width = `${newWidth}px`;
            }
        };

        const stopDrag = () => {
            isDraggingRight.current = false;
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);

            const currentWidth = rightSidebarRef.current
                ? parseInt(rightSidebarRef.current.style.width, 10)
                : startWidth;

            const clicked = maxDelta <= 4;
            const releasedInCollapseZone = maxDelta > 4 && currentWidth < 250;
            const shouldCollapse = clicked || releasedInCollapseZone;

            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.transition = 'width 300ms ease-in-out';
            }

            if (shouldCollapse) {
                setIsSidebarOpen(false);
            } else {
                const finalWidth = Math.max(240, Math.min(600, currentWidth));
                setRightSidebarWidth(finalWidth);
                localStorage.setItem('right_sidebar_width', String(finalWidth));
                if (rightSidebarRef.current) {
                    rightSidebarRef.current.style.width = `${finalWidth}px`;
                }
            }
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [rightSidebarWidth, setIsSidebarOpen]);

    const startDraggingNav = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDraggingNav(true);

        const isTouch = 'touches' in e;
        const startClientY = isTouch ? e.touches[0].clientY : e.clientY;
        const startClientX = isTouch ? e.touches[0].clientX : e.clientX;
        const rect = bodyContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const initialTopPx = (navTopPercentRef.current / 100) * rect.height;
        const initialLeftPx = navXOffsetRef.current;
        let hasMoved = false;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent && moveEvent.cancelable) {
                moveEvent.preventDefault();
            }

            const currentTouch = 'touches' in moveEvent ? moveEvent.touches[0] : moveEvent;
            const deltaY = currentTouch.clientY - startClientY;
            const deltaX = currentTouch.clientX - startClientX;

            if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
                hasMoved = true;
            }

            const newTopPx = initialTopPx + deltaY;
            const newPercent = Math.max(10, Math.min(90, (newTopPx / rect.height) * 100));
            setNavTopPercent(newPercent);

            // Pull to the right (positive offset for Left nav tab)
            const newX = Math.max(0, Math.min(120, initialLeftPx + deltaX));
            setNavXOffset(newX);
        };

        const handleEnd = () => {
            setIsDraggingNav(false);
            setNavXOffset(0); // Snap back to edge!

            if (isTouch) {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            } else {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleEnd);
            }

            if (!hasMoved) {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setShowMobileSections(true);
                } else {
                    setIsLeftSidebarOpen(true);
                }
            }
        };

        if (isTouch) {
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        } else {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        }
    }, [setIsLeftSidebarOpen]);

    const startDraggingChat = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDraggingChat(true);

        const isTouch = 'touches' in e;
        const startClientY = isTouch ? e.touches[0].clientY : e.clientY;
        const startClientX = isTouch ? e.touches[0].clientX : e.clientX;
        const rect = bodyContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const initialTopPx = (chatTopPercentRef.current / 100) * rect.height;
        const initialRightPx = chatXOffsetRef.current;
        let hasMoved = false;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent && moveEvent.cancelable) {
                moveEvent.preventDefault();
            }

            const currentTouch = 'touches' in moveEvent ? moveEvent.touches[0] : moveEvent;
            const deltaY = currentTouch.clientY - startClientY;
            const deltaX = startClientX - currentTouch.clientX; // Pull to the left (positive X value when dragging left)

            if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
                hasMoved = true;
            }

            const newTopPx = initialTopPx + deltaY;
            const newPercent = Math.max(10, Math.min(90, (newTopPx / rect.height) * 100));
            setChatTopPercent(newPercent);

            const newX = Math.max(0, Math.min(120, initialRightPx + deltaX));
            setChatXOffset(newX);
        };

        const handleEnd = () => {
            setIsDraggingChat(false);
            setChatXOffset(0); // Snap back to edge!

            if (isTouch) {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            } else {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleEnd);
            }

            if (!hasMoved) {
                setIsSidebarOpen(true);
            }
        };

        if (isTouch) {
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        } else {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        }
    }, [setIsSidebarOpen]);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isDraftMode, setIsDraftMode] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [signaturePassword, setSignaturePassword] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [auditLogs, setAuditLogs] = useState<{ msg: string, type: string }[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showMobileSections, setShowMobileSections] = useState(false);

    const [hasSavedCert, setHasSavedCert] = useState(false);
    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [fechaConsentimientoFirma, setFechaConsentimientoFirma] = useState<string | null>(null);
    const [isSavingConsent, setIsSavingConsent] = useState(false);

    // ── Gestión de URL del PDF (revocación de ObjectURL para evitar memory leaks) ──
    // IMPORTANTE: revocar la URL ANTERIOR solo después de crear la nueva,
    // para que el <iframe> nunca apunte a una URL ya revocada (net::ERR_FAILED).
    useEffect(() => {
        if (!pdfBlob) { setPdfUrl(null); return; }
        const url = URL.createObjectURL(pdfBlob);
        // Guardamos la URL nueva PRIMERO para que el iframe la reciba antes de que limpiemos
        setPdfUrl(url);
        // Solo revocamos la URL al reemplazarla o al desmontar el componente
        return () => {
            setTimeout(() => URL.revokeObjectURL(url), 100);
        };
    }, [pdfBlob]);

    const addAudit = useCallback((msg: string, type: string = 'info') => {
        setAuditLogs(prev => [{ msg, type }, ...prev].slice(0, 8));
    }, []);

    const snapshotForm = (data: any): string => {
        try {
            const { Uuid, Titulo, Nombre, ...rest } = data;
            return JSON.stringify({ Uuid, Titulo, Nombre, ...rest });
        } catch { return ''; }
    };

    // ── Auto-save inteligente del núcleo (dirty-check + debounce 3s) ──
    const lastSavedSnapshotRef = useRef<string>(snapshotForm(formData));
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formDataRef = useRef(formData);
    const onSaveRef = useRef(onSave);
    const isSavingRef = useRef(false);

    useEffect(() => { formDataRef.current = formData; }, [formData]);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    const saveDirtyData = useCallback(async (isUnmounting = false) => {
        if (readOnly) {
            console.log("[DIITRA] saveDirtyData: Documento es sólo lectura, omitiendo guardado.");
            return;
        }
        if (isSavingRef.current) {
            console.log("[DIITRA] saveDirtyData: Guardado ya en curso, omitiendo.");
            return;
        }
        const data = formDataRef.current;
        const saveFn = onSaveRef.current;
        if (!saveFn) {
            console.warn("[DIITRA] saveDirtyData: onSave no está definido.");
            return;
        }

        const currentSnap = snapshotForm(data);
        if (currentSnap === lastSavedSnapshotRef.current) {
            console.log("[DIITRA] saveDirtyData: Sin cambios que guardar.");
            return;
        }
        if (!data.Uuid && !data.Titulo && !data.Nombre) {
            console.log("[DIITRA] saveDirtyData: Formulario vacío, omitiendo guardado.");
            return;
        }

        isSavingRef.current = true;
        if (!isUnmounting) {
            setIsSaving(true);
        }
        try {
            console.log(`[DIITRA] saveDirtyData: Iniciando guardado. isUnmounting=${isUnmounting}. Payload:`, data);
            await saveFn(data);
            lastSavedSnapshotRef.current = currentSnap;
            console.log("[DIITRA] saveDirtyData: Guardado exitoso.");
            if (!isUnmounting) {
                setLastSaved(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                addAudit('Sincronización de estado exitosa', 'success');
            }
        } catch (error) {
            console.error("[DIITRA] saveDirtyData: Error al guardar en base de datos:", error);
            if (!isUnmounting) {
                addAudit('Error al guardar el documento', 'error');
            }
        } finally {
            isSavingRef.current = false;
            if (!isUnmounting) {
                setIsSaving(false);
            }
        }
    }, [addAudit, readOnly]);

    const handleSave = useCallback(async () => {
        if (saveTimeoutRef.current) {
            console.log("[DIITRA] handleSave: Cancelando autoguardado programado por guardado manual inmediato.");
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        await saveDirtyData(false);
    }, [saveDirtyData]);

    useEffect(() => {
        if (readOnly) return;
        const currentSnap = snapshotForm(formDataRef.current);
        if (currentSnap === lastSavedSnapshotRef.current) {
            console.log("[DIITRA] useEffect AutoSave: Formulario sin cambios.");
            return;
        }
        if (!formDataRef.current.Uuid && !formDataRef.current.Titulo && !formDataRef.current.Nombre) {
            console.log("[DIITRA] useEffect AutoSave: Formulario vacío.");
            return;
        }

        console.log("[DIITRA] useEffect AutoSave: Cambios detectados. Programando autoguardado en 3s...");
        if (saveTimeoutRef.current) {
            console.log("[DIITRA] useEffect AutoSave: Limpiando timeout anterior.");
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            console.log("[DIITRA] useEffect AutoSave: Ejecutando autoguardado...");
            handleSave();
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) {
                console.log("[DIITRA] useEffect AutoSave Cleanup: Cancelando autoguardado pendiente.");
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [localChangeCount, handleSave, readOnly]);

    // Guardado al desmontar el componente (cambio de página o transición de React Router)
    const saveDirtyDataRef = useRef(saveDirtyData);
    useEffect(() => {
        saveDirtyDataRef.current = saveDirtyData;
    }, [saveDirtyData]);

    useEffect(() => {
        return () => {
            console.log("[DIITRA] DIITRABuilderShell desmontándose (unmount cleanup)...");
            const data = formDataRef.current;
            const currentSnap = snapshotForm(data);
            if (currentSnap !== lastSavedSnapshotRef.current && (data.Uuid || data.Titulo || data.Nombre)) {
                console.log("[DIITRA] Guardado forzado al desmontar (unmount).");
                saveDirtyDataRef.current(true);
            } else {
                console.log("[DIITRA] No se requiere guardado al desmontar.");
            }
        };
    }, []);

    useEffect(() => {
        const checkSavedCertificate = async () => {
            try {
                const res = await api.get('/lopdp/perfil');
                if (res.data?.has_p12_certificate) {
                    setHasSavedCert(true);
                } else {
                    setHasSavedCert(false);
                }
                setAceptoTerminos(!!res.data?.acepto_terminos_firma);
                setFechaConsentimientoFirma(res.data?.fecha_consentimiento_firma ?? null);
            } catch (err) {
                console.error('[DIITRA] Error checking saved certificate:', err);
            }
        };
        checkSavedCertificate();
    }, []);

    const handleConsentToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsSavingConsent(true);
        try {
            await api.post('/lopdp/consentimiento', {
                version_politica: 'FIRMA_ELECTRONICA'
            });
            setAceptoTerminos(checked);
            setFechaConsentimientoFirma(checked ? new Date().toISOString() : null);
        } catch (err) {
            console.error('[DIITRA] Error saving signature consent:', err);
        } finally {
            setIsSavingConsent(false);
        }
    };

    const handleRedirectToSettings = async () => {
        console.log("[DIITRA] handleRedirectToSettings: Guardando y redirigiendo a configuración.");
        if (!readOnly && saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            await handleSave();
        }
        onClose();
        navigate('/configuracion');
    };

    const handleClose = async () => {
        console.log("[DIITRA] handleClose: Iniciando cierre.");
        if (!readOnly && saveTimeoutRef.current) {
            console.log("[DIITRA] handleClose: Limpiando timeout y forzando handleSave.");
            clearTimeout(saveTimeoutRef.current);
            await handleSave();
        }
        onClose();
    };

    // ── Generación de PDF ──
    const handleGeneratePdf = async (blind = false) => {
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
        } catch {
            addAudit('Error al generar el documento PDF', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Firma Electrónica PAdES ──
    const handleSign = async () => {
        // MODO PRODUCCIÓN: descomentar para exigir contraseña
        // if (!signaturePassword) return alert('Ingresa la clave de tu firma (.p12)');

        setIsSigning(true);
        addAudit('Iniciando proceso de firma electrónica...');
        try {
            const formDataObj = new FormData();
            formDataObj.append('password', signaturePassword || '');
            // MODO PRODUCCIÓN: formDataObj.append('password', signaturePassword);
            formDataObj.append('projectUuid', entityUuid || formData.EntityUuid || formData.entityUuid || formData.Uuid || '');

            const response = await api.post(
                '/projects/sign',
                formDataObj,
                {
                    headers: { 'Content-Type': undefined },
                    transformRequest: [(data, headers) => {
                        if (data instanceof FormData) {
                            delete headers['Content-Type'];
                        }
                        return data;
                    }],
                    responseType: 'blob'
                }
            );
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit(
                import.meta.env.DEV
                    ? 'Firma electrónica aplicada (modo pruebas: sello de verificación puede estar omitido)'
                    : 'Firma electrónica aplicada e integrada',
                'success'
            );
            // MODO PRODUCCIÓN: addAudit('Firma digital aplicada e integrada', 'success');
        } catch (err: any) {
            console.error('[DIITRA] Error signing document:', err);

            // Intentar extraer el mensaje real del servidor (la respuesta es blob por responseType)
            let serverMessage = '';
            try {
                if (err?.response?.data instanceof Blob) {
                    const text = await err.response.data.text();
                    const parsed = JSON.parse(text);
                    serverMessage = parsed?.error || parsed?.message || '';
                } else if (err?.response?.data?.error) {
                    serverMessage = err.response.data.error;
                }
            } catch {
                // silenciar errores de parseo
            }

            // Detectar la barrera de consentimiento LOPDP
            const isLopdpGate = serverMessage.toLowerCase().includes('términos') ||
                serverMessage.toLowerCase().includes('lopdp') ||
                serverMessage.toLowerCase().includes('consentimiento');

            if (isLopdpGate) {
                addAudit('Firma bloqueada: Acepte los términos de firma en Configuración → Mi Cuenta y Firma', 'warning');
            } else if (serverMessage) {
                addAudit(`Error de firma: ${serverMessage}`, 'error');
            } else {
                addAudit('Error de firma: Clave o certificado inválido', 'error');
            }
        } finally {
            setIsSigning(false);
        }
    };

    // ── Indicadores de estado del CoWork (memoizados para evitar re-renders) ──
    const isOnline = cowork.session.isConnected;
    const isSyncing = isSaving || cowork.session.isSyncing;
    const users = cowork.session.connectedUsers;

    return (
        <DocumentDataContext.Provider value={formData}>
            <div className="fixed inset-0 z-[100] bg-bg-deep flex justify-center items-center p-0 md:p-0 backdrop-blur-sm">
                <div className="bg-surface w-full h-full flex flex-col shadow-2xl overflow-hidden animate-fade-in">

                    {/* ── Header Universal ── */}
                    <div className="px-4 md:px-8 py-3 md:py-5 border-b border-border-thin bg-bg-deep/50 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">
                        <div className="flex items-center justify-between w-full lg:w-auto gap-4 md:gap-6">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="p-2 md:p-3 bg-text-main rounded-xl shadow-lg shrink-0">
                                    <Shield size={18} className="text-bg-deep md:w-[20px]" />
                                </div>
                                <div>
                                    <h2 className="text-sm md:text-xl font-black text-text-main tracking-tighter uppercase leading-none">
                                        DIITRA <span className="text-text-dim font-light hidden sm:inline">Editor de documentos</span>
                                    </h2>
                                    <p className="text-[8px] md:text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">v1.0.0</p>
                                </div>
                                <div className="h-6 md:h-8 w-[1px] bg-border-thin mx-1 md:mx-2" />
                                <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1 md:py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[7px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">Activo</span>
                                </div>
                            </div>

                            {/* Botones móviles */}
                            <div className="lg:hidden flex items-center gap-2">
                                <button
                                    onClick={handleClose}
                                    className="p-2 bg-surface border border-border-thin rounded-lg text-text-dim hover:text-text-main hover:border-text-main transition-colors"
                                    title="Salir del documento"
                                    aria-label="Salir del documento"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full lg:w-auto gap-4 md:gap-8">
                            {/* ── Indicadores CoWork ── */}
                            <div className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-1.5 md:py-2 bg-bg-deep rounded-xl border border-border-thin">
                                {/* Estado de conexión */}
                                <div className="flex items-center gap-1.5 md:gap-2 pr-2 md:pr-4 border-r border-border-thin">
                                    {isOnline ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[7px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">En línea</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-[7px] md:text-[9px] font-black text-red-500 uppercase tracking-widest">Sin conexión</span>
                                        </>
                                    )}
                                </div>

                                {/* Avatares de colaboradores conectados */}
                                {users.length > 0 && (
                                    <div className="flex -space-x-1.5 md:-space-x-2">
                                        {users.map((u, i) => (
                                            <div
                                                key={`${u.id}-${i}`}
                                                className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-surface flex items-center justify-center text-[7px] md:text-[10px] font-black text-white shadow-lg cursor-help transition-transform hover:-translate-y-1"
                                                style={{ backgroundColor: u.color }}
                                                title={`${u.name} (${u.role})`}
                                            >
                                                {u.initials}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Estado de sincronización */}
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[7px] md:text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Sincronización</span>
                                <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] text-text-main font-black uppercase">
                                    {readOnly ? (
                                        <span className="text-warning font-medium">Desactivada</span>
                                    ) : isSyncing ? (
                                        <><Clock size={10} className="animate-spin" /> ...</>
                                    ) : (
                                        <><CheckCircle size={10} className="text-success" /> {lastSaved ? lastSaved : 'Listo'}</>
                                    )}
                                </div>
                            </div>

                            {/* Acciones de cabecera */}
                            <div className="flex gap-2 md:gap-3">
                                {readOnly ? (
                                    <span className="badge-vercel badge-vercel-warning flex-1 lg:flex-none px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs cursor-default select-none justify-center">
                                        <Shield size={12} /> Solo lectura
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-2.5 bg-text-main hover:opacity-90 rounded-md text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-bg-deep transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={12} /> <span className="hidden xs:inline">Guardar</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleClose}
                                    className="hidden lg:flex px-6 py-2.5 bg-surface hover:bg-bg-deep border border-border-thin rounded-md text-[10px] font-bold uppercase tracking-widest text-text-main transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden relative" ref={bodyContainerRef}>
                                     {/* Pestaña de reabrir Navegación — pegada al borde izquierdo */}
                        {(!isLeftSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024 && !showMobileSections)) && (
                            <button
                                onMouseDown={startDraggingNav}
                                onTouchStart={startDraggingNav}
                                style={{
                                    top: `${navTopPercent}%`,
                                    transform: `translateY(-50%) translateX(${navXOffset}px)`,
                                    transition: isDraggingNav ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                                className={`absolute left-0 z-[60] bg-surface hover:bg-bg-deep border border-border-thin text-text-dim hover:text-text-main py-8 px-2.5 shadow-xl flex flex-col items-center gap-2.5 transition-all duration-200 animate-fade-in group cursor-grab active:cursor-grabbing ${
                                    isDraggingNav || navXOffset > 5
                                        ? 'rounded-full scale-[1.05] shadow-2xl border-text-main text-text-main bg-bg-deep'
                                        : 'rounded-r-xl border-l-0'
                                }`}
                                title="Mostrar navegación del documento"
                            >
                                <FileText size={15} />
                                <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Nav</span>
                            </button>
                        )}

                        {/* Pestaña de reabrir Actividad — pegada al borde derecho */}
                        {!isSidebarOpen && (
                            <button
                                onMouseDown={startDraggingChat}
                                onTouchStart={startDraggingChat}
                                style={{
                                    top: `${chatTopPercent}%`,
                                    transform: `translateY(-50%) translateX(-${chatXOffset}px)`,
                                    transition: isDraggingChat ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                                className={`absolute right-0 z-[60] bg-surface hover:bg-bg-deep border border-border-thin text-text-dim hover:text-text-main py-8 px-2.5 shadow-xl flex flex-col items-center gap-2.5 transition-all duration-200 animate-fade-in group cursor-grab active:cursor-grabbing ${
                                    isDraggingChat || chatXOffset > 5
                                        ? 'rounded-full scale-[1.05] shadow-2xl border-text-main text-text-main bg-bg-deep'
                                        : 'rounded-l-xl border-r-0'
                                }`}
                                title="Mostrar actividad del equipo"
                            >
                                <MessageSquare size={15} className={isOnline ? 'animate-pulse' : ''} />
                                <span className="[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Chat</span>
                            </button>
                        )}
                        {/* ── Sidebar de Navegación ── */}
                        <div
                            ref={leftSidebarRef}
                            style={{
                                width: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? undefined
                                    : (isLeftSidebarOpen ? `${leftSidebarWidth}px` : '0px'),
                                transform: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? (showMobileSections ? 'translateX(0)' : 'translateX(-100%)')
                                    : undefined,
                                transition: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? 'transform 300ms ease-in-out, visibility 300ms ease-in-out'
                                    : 'width 300ms ease-in-out',
                                visibility: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? (showMobileSections ? 'visible' : 'hidden')
                                    : 'visible'
                            }}
                            className={`
                                overflow-hidden flex flex-col shrink-0 bg-bg-deep shadow-2xl lg:shadow-none
                                ${typeof window !== 'undefined' && window.innerWidth < 1024
                                    ? 'fixed inset-y-0 left-0 top-[60px] z-[70] h-[calc(100vh-60px)] border-r border-border-thin !w-[85vw] sm:!w-[320px]'
                                    : (isLeftSidebarOpen ? 'border-r border-border-thin lg:flex' : 'hidden lg:flex')
                                }
                            `}
                        >
                            <div style={{ width: showMobileSections ? '100%' : `${leftSidebarWidth}px` }} className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 h-full overflow-y-auto overflow-x-hidden shrink-0">
                                <div className="flex lg:hidden justify-between items-center mb-4">
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Navegación</p>
                                    <button
                                        onClick={() => setShowMobileSections(false)}
                                        className="p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                                        aria-label="Cerrar menú"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4 lg:ml-2">
                                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Navegación del Documento</p>
                                        <button
                                            onClick={() => setIsLeftSidebarOpen(false)}
                                            className="hidden lg:flex p-1.5 hover:bg-bg-deep rounded-lg text-text-dim hover:text-text-main transition-colors"
                                            title="Contraer navegación"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {sections.map(section => (
                                            <button
                                                key={section.id}
                                                onClick={() => { setActiveTab(section.id); setShowMobileSections(false); }}
                                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === section.id ? 'bg-text-main text-bg-deep shadow-xl lg:translate-x-2' : 'text-text-dim hover:bg-bg-deep hover:text-text-main'}`}
                                            >
                                                {section.icon} {section.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { setActiveTab('output'); setShowMobileSections(false); }}
                                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-8 border ${activeTab === 'output' ? 'bg-text-main text-bg-deep border-text-main shadow-xl' : 'text-text-dim border-border-thin hover:bg-bg-deep hover:text-text-main'}`}
                                        >
                                            <FileText size={18} /> Finalizar y Firmar
                                        </button>
                                    </div>
                                </div>

                                {/* ── Auditoría de Sesión ── */}
                                <div className="mt-auto hidden md:block">
                                    <div className="p-5 bg-surface rounded-2xl border border-border-thin">
                                        <p className="text-[10px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Clock size={14} className="text-text-dim" /> Auditoría de Sesión
                                        </p>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {auditLogs.length === 0 && <p className="text-[9px] italic text-text-dim">Sin actividad registrada aún</p>}
                                            {auditLogs.map((log, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className={`w-1 h-auto rounded-full ${log.type === 'success' ? 'bg-green-500' : log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-yellow-500' : 'bg-text-dim/30'}`} />
                                                    <p className={`text-[9px] font-bold uppercase tracking-tight leading-relaxed ${log.type === 'success' ? 'text-green-500/80' : log.type === 'error' ? 'text-red-500/80' : log.type === 'warning' ? 'text-yellow-500/80' : 'text-text-dim'}`}>
                                                        {log.msg}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drag Handle Left */}
                        {isLeftSidebarOpen && !showMobileSections && (
                            <div
                                onMouseDown={startDraggingLeft}
                                className="hidden lg:block w-[6px] -mx-[3px] bg-transparent hover:bg-border-hover/50 active:bg-text-dim cursor-col-resize select-none shrink-0 transition-colors duration-150 z-50 h-full relative"
                            />
                        )}

                        {/* ── Área Principal: Editor & Visor PDF ── */}
                        <div className="flex-1 bg-bg-deep overflow-hidden flex">
                            {activeTab !== 'output' ? (
                                <div className="flex-1 p-3 sm:p-6 md:p-12 overflow-y-auto custom-scrollbar">
                                    <div className="w-full mx-auto transition-all duration-300 max-w-[98%] sm:max-w-[94%]">
                                        <div className="mb-6 md:mb-12">
                                            <h3 className="text-lg sm:text-2xl font-black text-text-main tracking-tighter uppercase">{title}</h3>
                                            <p className="text-[8px] sm:text-xs text-text-dim font-bold uppercase tracking-[0.2em] mt-1">{subtitle}</p>
                                            <div className="w-12 sm:w-20 h-1 md:h-1.5 bg-text-main mt-3 md:mt-6 rounded-full" />
                                        </div>

                                        {readOnly && (
                                            <div className="callout-vercel callout-vercel-warning mb-8 animate-fade-in">
                                                <Shield size={16} className="text-warning mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="callout-vercel-title">Vista de solo lectura activa</p>
                                                    <p className="callout-vercel-body">
                                                        {readOnlyReason === 'state' ? (
                                                            `Este documento ha sido emitido y firmado formalmente (se encuentra en estado "${projectStatus || 'Oficial'}"), por lo que su contenido ha sido sellado para garantizar la integridad institucional. No se admiten modificaciones.`
                                                        ) : readOnlyReason === 'review' ? (
                                                            "Estás visualizando este documento en modo de solo lectura para fines de revisión y auditoría académica."
                                                        ) : (
                                                            "Has accedido a este documento en modalidad de solo lectura debido a que no figuras como un miembro activo con permisos de escritura en este proyecto. No podrás realizar modificaciones."
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {/* El cowork se pasa a los children para que los campos colaborativos lo consuman */}
                                        {children(activeTab, cowork)}
                                    </div>
                                </div>
                            ) : (
                                /* ── Panel de Finalización y Firma ── */
                                <div className="flex-1 p-3 md:p-5 lg:p-6 flex flex-col gap-3 md:gap-4 animate-fade-in overflow-hidden">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 flex-1 overflow-y-auto lg:overflow-hidden p-1">
                                        {/* Panel de Controles Unificado */}
                                        <div className="col-span-1 lg:col-span-3 bg-bg-deep border border-border-thin rounded-2xl shadow-sm flex flex-col lg:overflow-hidden lg:h-full">
                                            {/* Sección 1: Emisión */}
                                            <div className="p-5 flex flex-col gap-4 shrink-0">
                                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                                                    <Settings size={16} className="text-text-dim" /> Emisión
                                                </h4>
                                                <div className="space-y-4">
                                                    {/* Switch sin tarjeta contenedora - Vercel Style */}
                                                    <div className="flex items-center justify-between py-1">
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-main">Modo borrador</p>
                                                            <p className="text-xs text-text-dim">Marca de agua de seguridad</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" checked={isDraftMode} onChange={(e) => setIsDraftMode(e.target.checked)} className="sr-only peer" />
                                                            <div className="w-11 h-6 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:bg-text-main after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2.5">
                                                        <button onClick={() => handleGeneratePdf(false)} className="w-full bg-text-main hover:bg-text-main/90 text-bg-deep px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                                                            <FileText size={15} /> Generar vista previa
                                                        </button>
                                                        <button onClick={() => handleGeneratePdf(true)} className="w-full border border-border-thin bg-transparent hover:bg-surface text-text-main/80 hover:text-text-main px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                                                            <Users size={15} /> Vista sin identidades
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-border-thin shrink-0" />

                                            {/* Sección 2: Firma Electrónica */}
                                            <div className="p-5 flex-1 flex flex-col gap-4 min-h-0 lg:overflow-y-auto custom-scrollbar">
                                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                                                    <Shield size={16} className="text-text-dim" /> Firma Electrónica
                                                </h4>
                                                <p className="text-xs text-text-dim leading-relaxed">Firma digital PAdES con validez legal.</p>

                                                <div className="flex flex-col gap-4 mt-2">
                                                    {!canSign ? (
                                                        <div className="p-4 bg-surface border border-border-thin rounded-xl text-center space-y-2.5">
                                                            <div className="flex justify-center">
                                                                <div className="icon-circle icon-circle-warning !p-2">
                                                                    <Shield size={16} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-semibold text-text-main">Firma restringida</p>
                                                                <p className="text-xs text-text-dim leading-relaxed">
                                                                    Solo el Director de Proyecto o un Administrador del sistema están autorizados para firmar.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : hasSavedCert ? (
                                                        <div className="flex flex-col gap-4">
                                                            <div className={`p-3.5 border rounded-xl flex items-start gap-3 ${aceptoTerminos ? 'bg-green-500/5 border-green-500/10' : 'bg-surface border-border-thin'}`}>
                                                                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                                                                <div className="flex-1 min-w-0 space-y-2">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-text-main">Certificado listo</p>
                                                                        <p className="text-xs text-text-dim mt-0.5">Archivo .p12 cargado en tu cuenta.</p>
                                                                    </div>
                                                                    {aceptoTerminos ? (
                                                                        <p className="text-xs text-green-500 select-none">
                                                                            {fechaConsentimientoFirma
                                                                                ? `Consentimiento LOPDP otorgado el ${new Date(fechaConsentimientoFirma).toLocaleDateString()}`
                                                                                : 'Consentimiento LOPDP otorgado'}
                                                                        </p>
                                                                    ) : (
                                                                        <div className="flex items-start gap-2.5 pt-1 select-none">
                                                                            <input
                                                                                type="checkbox"
                                                                                id="lopdpSignConsent"
                                                                                className="mt-0.5 cursor-pointer accent-text-main h-4 w-4 rounded border-border-thin text-text-main focus:ring-0"
                                                                                checked={aceptoTerminos}
                                                                                disabled={isSavingConsent}
                                                                                onChange={handleConsentToggle}
                                                                            />
                                                                            <label htmlFor="lopdpSignConsent" className="text-xs text-text-dim leading-relaxed cursor-pointer font-medium">
                                                                                Acepto los términos de LOPDP y autorizo la custodia de mi firma para documentos académicos.
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold text-text-main block">Contraseña</label>
                                                                <input
                                                                    type="password"
                                                                    placeholder="Contraseña (opcional)"
                                                                    value={signaturePassword}
                                                                    onChange={(e) => setSignaturePassword(e.target.value)}
                                                                    className="w-full bg-surface border border-border-thin rounded-xl px-3.5 py-2.5 text-sm focus:border-text-main outline-none transition-all placeholder:text-text-dim/50"
                                                                />
                                                            </div>

                                                            <button
                                                                onClick={handleSign}
                                                                disabled={!pdfBlob || isSigning || !aceptoTerminos}
                                                                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${(!pdfBlob || !aceptoTerminos) ? 'bg-surface border border-border-thin text-text-dim cursor-not-allowed' : 'bg-text-main text-bg-deep hover:bg-text-main/90 shadow-sm'}`}
                                                            >
                                                                {isSigning ? <><Clock size={15} className="animate-spin" /> Firmando...</> : <><Shield size={15} /> Aplicar firma electrónica</>}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-surface border border-border-thin rounded-xl space-y-3.5 text-center flex flex-col items-center justify-center">
                                                            <div className="text-red-500 shrink-0">
                                                                <AlertCircle size={24} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-semibold text-text-main">Firma no configurada</p>
                                                                <p className="text-xs text-text-dim leading-relaxed">
                                                                    Configura tu certificado (.p12) en los ajustes para firmar.
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={handleRedirectToSettings}
                                                                className="w-full bg-text-main hover:bg-text-main/90 text-bg-deep px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                                                            >
                                                                Configurar firma
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visor de PDF */}
                                        <div className="col-span-1 lg:col-span-9 bg-bg-deep border border-border-thin rounded-2xl p-2 flex flex-col shadow-inner relative overflow-hidden min-h-[500px]">
                                            {isGenerating ? (
                                                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-text-main border-t-transparent rounded-full animate-spin shadow-lg" />
                                                    <div className="text-center px-4">
                                                        <p className="text-[10px] md:text-xs font-black text-text-main uppercase tracking-[0.3em]">Generando documento</p>
                                                        <p className="text-[8px] md:text-[9px] text-text-dim uppercase tracking-widest mt-2">Preparando vista previa...</p>
                                                    </div>
                                                </div>
                                            ) : pdfUrl ? (
                                                <iframe src={pdfUrl} className="flex-1 w-full bg-white rounded-xl border-none shadow-2xl" title={`Vista previa — ${title}`} />
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-text-dim/20 p-8">
                                                    <FileText size={80} strokeWidth={0.5} className="mb-6 lg:mb-8 md:w-[120px]" />
                                                    <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-center">Listo para generar</p>
                                                    <button onClick={() => handleGeneratePdf(false)} className="mt-6 px-6 py-3 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest lg:hidden">
                                                        Generar PDF
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drag Handle Right */}
                        {isSidebarOpen && (
                            <div
                                onMouseDown={startDraggingRight}
                                className="hidden lg:block w-[6px] -mx-[3px] bg-transparent hover:bg-border-hover/50 active:bg-text-dim cursor-col-resize select-none shrink-0 transition-colors duration-150 z-50 h-full relative"
                            />
                        )}

                        {/* ── Collaboration Sidebar (Derecha) ── */}
                        <div
                            ref={rightSidebarRef}
                            style={{
                                '--right-sidebar-width': `${rightSidebarWidth}px`,
                                width: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? undefined
                                    : (isSidebarOpen ? `${rightSidebarWidth}px` : '0px'),
                                transform: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? (isSidebarOpen ? 'translateX(0)' : 'translateX(100%)')
                                    : undefined,
                                transition: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? 'transform 300ms ease-in-out, visibility 300ms ease-in-out'
                                    : 'width 300ms ease-in-out',
                                visibility: (typeof window !== 'undefined' && window.innerWidth < 1024)
                                    ? (isSidebarOpen ? 'visible' : 'hidden')
                                    : 'visible'
                            } as React.CSSProperties}
                            className={`
                                overflow-hidden flex shrink-0 bg-bg-deep shadow-2xl lg:shadow-none z-40
                                ${typeof window !== 'undefined' && window.innerWidth < 1024
                                    ? 'fixed inset-y-0 right-0 top-[60px] z-[70] h-[calc(100vh-60px)] border-l border-border-thin !w-[85vw] sm:!w-[320px]'
                                    : (isSidebarOpen ? 'border-l border-border-thin lg:flex' : 'hidden lg:flex')
                                }
                            `}
                        >
                            <div className="h-full w-full lg:w-[var(--right-sidebar-width)] flex flex-col shrink-0">
                                <CollaborationSidebar
                                    instanceUuid={cowork.session.documentId}
                                    sectionName={activeTab}
                                    cowork={cowork}
                                    allSections={sections.map(s => s.id)}
                                    onClose={() => setIsSidebarOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DocumentDataContext.Provider>
    );
};

export default React.memo(DIITRABuilderShell);
