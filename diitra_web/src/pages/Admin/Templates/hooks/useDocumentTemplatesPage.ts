/**
 * @file useDocumentTemplatesPage.ts
 * @description Custom Hook centralizado para la administración de plantillas de documentos en DIITRA.
 * 
 * @responsibility
 * - Gestión del catálogo de plantillas institucionales y tema global.
 * - Carga, decodificación y persistencia de bloques estructurales en base64/JSON.
 * - Manejo de la interacción Drag-and-Drop con dnd-kit.
 * - Control de dirty-state (previene salir de la pestaña con cambios sin guardar).
 * - Notificaciones de publicación de plantillas en tiempo real.
 */

import { useState, useEffect, useRef } from 'react';
import api from '../../../../api/axios_config';
import { notifyTemplatePublished } from '../../../../core/events/templateEvents';
import {
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import type { DocumentTemplateDto, DocumentBlock, BlockType } from '../types';
import { mergeWithDefaults } from '../utils/theme-schema';
import { generateHtmlFromBlocks } from '../utils/HtmlGenerator';
import { generateDefaultBlocksForTemplate } from '../utils/defaultBlocksFactory';

/** Sensor inteligente de puntero para evitar interrupciones al hacer clic en inputs o botones editables */
class SmartPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: 'onPointerDown' as const,
            handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
                let cur = event.target as HTMLElement | null;
                while (cur) {
                    if (
                        cur.tagName === 'INPUT' ||
                        cur.tagName === 'TEXTAREA' ||
                        cur.tagName === 'SELECT' ||
                        cur.tagName === 'BUTTON' ||
                        cur.tagName === 'A' ||
                        cur.contentEditable === 'true' ||
                        (cur.classList && (cur.classList.contains('no-drag') || cur.classList.contains('interactive-element')))
                    ) {
                        return false;
                    }
                    cur = cur.parentElement;
                }
                return true;
            },
        },
    ];
}

export const useDocumentTemplatesPage = () => {
    const [templates, setTemplates] = useState<DocumentTemplateDto[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

    const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'canvas' | 'properties'>('catalog');
    const paletteRef = useRef<HTMLDivElement>(null);
    const [headerCollapsed, setHeaderCollapsed] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    useEffect(() => {
        const handleStateChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.isCollapsed === 'boolean') {
                setIsSidebarCollapsed(customEvent.detail.isCollapsed);
            }
        };
        window.addEventListener('diitra-sidebar-state-change', handleStateChange);
        return () => window.removeEventListener('diitra-sidebar-state-change', handleStateChange);
    }, []);

    const toggleSidebar = () => {
        window.dispatchEvent(new CustomEvent('diitra-toggle-sidebar'));
    };

    const { addToast } = useNotifications();
    const confirm = useConfirm();

    // Observador para cambios en el tema claro/oscuro institucional
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Notificar al Layout sobre el estado colapsable del header
    useEffect(() => {
        const event = new CustomEvent('diitra-topbar-collapse-change', { detail: { collapsed: headerCollapsed } });
        window.dispatchEvent(event);
    }, [headerCollapsed]);

    useEffect(() => {
        return () => {
            const event = new CustomEvent('diitra-topbar-collapse-change', { detail: { collapsed: false } });
            window.dispatchEvent(event);
        };
    }, []);

    // Prevenir el cierre/recarga si existen cambios pendientes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar en la plantilla. ¿Seguro que deseas salir?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const sensors = useSensors(
        useSensor(SmartPointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setBlocks(prev => {
            const oldIdx = prev.findIndex(b => b.id === active.id);
            const newIdx = prev.findIndex(b => b.id === over.id);
            return arrayMove(prev, oldIdx, newIdx);
        });
        setIsDirty(true);
    };

    // Cerrar paleta al hacer clic fuera del contenedor
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                setShowPalette(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // El catálogo se carga mediante fetchTemplates definido después de handleSelectTemplate

    const handleSelectTemplate = async (tmpl: DocumentTemplateDto) => {
        try {
            setLoading(true);
            let fullData: any;
            let loadedBlocks: DocumentBlock[] = [];

            if (tmpl.code === 'GLOBAL_THEME') {
                const res = await api.get('/admin/templates/global-theme');
                fullData = {
                    id: 0,
                    code: 'GLOBAL_THEME',
                    name: 'Diseño Global Institucional',
                    description: 'Configuración visual por defecto para todos los documentos de la institución.',
                    category: 0,
                    version: 1,
                    isActive: true,
                    requiresLopdpClause: false,
                    supportsBlindMode: false,
                    requiresElectronicSignature: false,
                    signatureType: 'none',
                    themeConfigJson: res.data.themeConfigJson,
                    htmlContent: '',
                    customCss: '',
                    collaborativeFieldsJson: '',
                    updatedAt: new Date().toISOString(),
                    updatedBy: null
                };
                setSelectedTemplate(fullData);

                let parsedTheme: any = {};
                if (res.data.themeConfigJson) {
                    try {
                        parsedTheme = JSON.parse(res.data.themeConfigJson);
                    } catch {}
                }
                const savedCoverConfig = parsedTheme?.brand?.coverConfig || {};

                loadedBlocks = [
                    {
                        id: "sample-cover",
                        type: "cover" as const,
                        title: "Previsualización: Portada Institucional",
                        isActive: true,
                        config: {
                            tituloSuperior: "PORTADA DE PRUEBA DE IDENTIDAD VISUAL",
                            carreraPorDefecto: "CARRERA / UNIDAD ACADÉMICA DE MUESTRA",
                            periodoPorDefecto: "PERIODO ACADÉMICO DE PRUEBA",
                            colorTema: "#1e2a4a",
                            showInstitution: true,
                            textoInstitucion: "INSTITUTO TECNOLÓGICO SUPERIOR TRAVERSARI",
                            posInstitution: "top",
                            alignInstitution: "center",
                            showTitle: true,
                            posTitle: "middle",
                            alignTitle: "center",
                            showCarrera: true,
                            posCarrera: "bottom",
                            alignCarrera: "center",
                            showPeriodo: true,
                            posPeriodo: "bottom",
                            alignPeriodo: "center",
                            ...savedCoverConfig
                        }
                    },
                    {
                        id: "sample-title",
                        type: "title" as const,
                        title: "Previsualización: Títulos de Sección",
                        isActive: true,
                        config: {
                            text: "1. EJEMPLO DE ENCABEZADO DE SECCIÓN",
                            fontSize: "H2",
                            color: "#222c57",
                            alignment: "left"
                        }
                    },
                    {
                        id: "sample-text",
                        type: "rich_text" as const,
                        title: "Previsualización: Párrafos de Texto",
                        isActive: true,
                        config: {
                            html: "<p>Este es un párrafo de ejemplo para previsualizar la tipografía, interlineado y colores del tema visual institucional. Todos los reportes generados heredarán estas propiedades a menos que tengan overrides individuales.</p>"
                        }
                    },
                    {
                        id: "sample-table",
                        type: "advanced_table" as const,
                        title: "Previsualización: Tablas Avanzadas",
                        isActive: true,
                        config: {
                            headers: ["Elemento de Muestra", "Valor Configurado"],
                            colWidths: ["50%", "50%"],
                            rows: [
                                { cells: ["Fila de prueba 1", "Valor de prueba A"] },
                                { cells: ["Fila de prueba 2", "Valor de prueba B"] }
                            ]
                        }
                    }
                ];
            } else {
                const res = await api.get(`/admin/templates/${tmpl.code}`);
                fullData = res.data;
                setSelectedTemplate(fullData);

                if (fullData.htmlContent) {
                    const match = fullData.htmlContent.match(/<!-- DIITRA_SECTIONS_JSON: (.*?) -->/);
                    if (match && match[1]) {
                        try {
                            const decoded = decodeURIComponent(escape(atob(match[1])));
                            loadedBlocks = JSON.parse(decoded);
                        } catch { }
                    }
                }

                if (loadedBlocks.length === 0 && fullData.collaborativeFieldsJson) {
                    try {
                        const parsed = JSON.parse(fullData.collaborativeFieldsJson);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                            loadedBlocks = parsed;
                        }
                    } catch { }
                }
            }

            if (loadedBlocks.length === 0) {
                loadedBlocks = generateDefaultBlocksForTemplate(tmpl, fullData);
            }

            setBlocks(loadedBlocks);
            setActiveBlockId(loadedBlocks[0]?.id || null);
            setActiveMobileTab('canvas');
            setIsDirty(false);
        } catch (err: any) {
            console.error(err);
            addToast("Error al Detallar", `No se pudo abrir el constructor de la plantilla.`, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/templates');
            const data = res.data || [];
            setTemplates(data);
        } catch (err: any) {
            console.error(err);
            addToast("Error al Cargar", "No se pudo obtener el catálogo de plantillas.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleAddBlock = (type: BlockType) => {
        const newId = `block-${Date.now()}`;
        let newBlock: DocumentBlock;

        switch (type) {
            case 'title':
                newBlock = {
                    id: newId, type, title: 'Título de Sección', isActive: true,
                    config: { text: 'NUEVA SECCIÓN DE DOCUMENTO', fontSize: 'H2', color: '#1e2a4a', alignment: 'left' }
                };
                break;
            case 'rich_text':
                newBlock = {
                    id: newId, type, title: 'Párrafo de Texto Enriquecido', isActive: true,
                    config: { html: '<p>Escribe el contenido aquí. Puedes usar <strong>negritas</strong>, <em>cursiva</em>, listas y hasta insertar tablas internas.</p>' }
                };
                break;
            case 'advanced_table':
                newBlock = {
                    id: newId, type, title: 'Tabla Avanzada', isActive: true,
                    config: {
                        headerStyle: 'blue',
                        headers: ['Campo', 'Descripción'],
                        colWidths: ['30%', '70%'],
                        rows: [{ cells: ['', ''] }, { cells: ['', ''] }]
                    }
                };
                break;
            case 'multi_section_table':
                newBlock = {
                    id: newId, type, title: 'Tabla Multi-Sección', isActive: true,
                    config: {
                        sections: [
                            { title: 'Sección 1', headerStyle: 'blue', headers: ['Descripción', 'Cantidad', 'Fuente'], colWidths: ['50%', '25%', '25%'], rows: [{ cells: ['', '', ''] }] },
                            { title: 'Sección 2', headerStyle: 'gold', headers: ['Descripción', 'Costo'], colWidths: ['70%', '30%'], rows: [{ cells: ['', ''] }] },
                        ]
                    }
                };
                break;
            case 'two_column':
                newBlock = {
                    id: newId, type, title: 'Bloque Dos Columnas', isActive: true,
                    config: {
                        leftTitle: 'COLUMNA IZQUIERDA', leftHeaderStyle: 'blue', leftContent: '<p>Contenido izquierdo...</p>',
                        rightTitle: 'COLUMNA DERECHA', rightHeaderStyle: 'blue', rightContent: '<p>Contenido derecho...</p>'
                    }
                };
                break;
            case 'page_break':
                newBlock = { id: newId, type, title: 'Salto de Página', isActive: true, config: {} };
                break;
            case 'gantt':
                newBlock = {
                    id: newId, type, title: 'Cronograma de Actividades (Gantt)', isActive: true,
                    config: {
                        ganttMonths: ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Febrero'],
                        ganttObjectives: [
                            {
                                id: `obj-${Date.now()}`,
                                name: 'OBJETIVO N° 1',
                                activities: [
                                    { id: `act-${Date.now()}`, name: 'Especificar la actividad', resources: '', startMonth: 0, startWeek: 0, endMonth: 1, endWeek: 3, color: '#60a5fa' as const },
                                    { id: `act-${Date.now() + 1}`, name: 'Especificar la actividad', resources: '', startMonth: 2, startWeek: 0, endMonth: 3, endWeek: 3, color: '#f97316' as const },
                                ]
                            }
                        ]
                    }
                };
                break;
            case 'cover':
                newBlock = {
                    id: newId, type, title: 'Portada Institucional', isActive: true,
                    config: { tituloSuperior: 'NUEVO DOCUMENTO', carreraPorDefecto: 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE', periodoPorDefecto: 'PERIODO ACADÉMICO 2025-2026', colorTema: '#1e2a4a' }
                };
                break;
            case 'researchers_table':
                newBlock = {
                    id: newId, type, title: 'Tabla de Participantes', isActive: true,
                    config: { mostrarCedula: true, mostrarHoras: true, mostrarEmail: false, mostrarNivelAcademico: false, mostrarTelefono: false }
                };
                break;
            case 'rubric_table':
                newBlock = {
                    id: newId, type, title: 'Tabla de Criterios (Rúbrica)', isActive: true,
                    config: { mostrarDescripcionCriterio: true, mostrarObservacionesCriterio: true }
                };
                break;
            case 'signatures':
                newBlock = {
                    id: newId, type, title: 'Bloque de Firmas y Trazabilidad', isActive: true,
                    config: {
                        signatories: [
                            { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
                            { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' }
                        ],
                        textoPieFirma: 'Comisión de Acreditación e Investigación IST Traversari'
                    }
                };
                break;
            case 'project_general_section':
                newBlock = { id: newId, type, title: 'Ficha de Identificación del Proyecto', isActive: true, config: {} };
                break;
            case 'project_technical_section':
                newBlock = { id: newId, type, title: 'Plan Técnico de Redacción', isActive: true, config: {} };
                break;
            case 'project_budget_section':
            case 'resources':
                newBlock = { id: newId, type, title: 'Recursos y Financiamiento del Proyecto', isActive: true, config: {} };
                break;
            case 'project_progress_report':
                newBlock = { id: newId, type, title: 'Avance de Ejecución y Monitoreo', isActive: true, config: {} };
                break;
            case 'expected_products':
                newBlock = { id: newId, type, title: 'Productos Esperados', isActive: true, config: { productosTitle: '5. Productos Esperados' } };
                break;
            case 'impacts':
                newBlock = { id: newId, type, title: 'Matriz de Impactos', isActive: true, config: {} };
                break;
            case 'project_approval_notice':
                newBlock = { id: newId, type, title: 'Oficio de Aprobación de Proyecto', isActive: true, config: {} };
                break;
            case 'progress_header_section':
                newBlock = { id: newId, type, title: 'Encabezado Informe Avance', isActive: true, config: { headerTitle: '1. DATOS GENERALES DEL INFORME DE AVANCE' } };
                break;
            case 'progress_activity_section':
                newBlock = { id: newId, type, title: 'Matriz Actividades Avance', isActive: true, config: { activityVariant: 'ejecutadas', activityTableTitle: 'MATRIZ DE ACTIVIDADES EJECUTADAS', activityHeaderColor: 'navy' } };
                break;
            case 'progress_status_section':
                newBlock = { id: newId, type, title: 'Estado y Observaciones', isActive: true, config: { statusTitle: 'ESTADO Y OBSERVACIONES' } };
                break;
            case 'final_report_header_section':
                newBlock = { id: newId, type, title: 'Encabezado Informe Final', isActive: true, config: { finalReportTitle: 'DATOS DEL PROYECTO DE INVESTIGACIÓN', finalReportHeaderColor: 'navy', showTipoInvestigacion: true, showAlcanceProyecto: true, showFechasProyecto: true, showTablaInvestigadores: true } };
                break;
            case 'final_report_writing_section':
                newBlock = { id: newId, type, title: 'Plan de Redacción Informe Final', isActive: true, config: { writingHeaderColor: 'navy', writingLayoutMode: 'table_2col' } };
                break;
            case 'arbitration_dictamen_section':
                newBlock = {
                    id: newId,
                    type,
                    title: 'Acta de Dictamen de Arbitraje Consolidado',
                    isActive: true,
                    config: {
                        mostrarAvisoDobleCiego: true,
                        mostrarDatosProyectoDictamen: true,
                        mostrarPanelArbitros: true,
                        mostrarTarjetaResolucion: true,
                        mostrarObservacionesConsolidadas: true,
                        mostrarCertificacionInstitucional: true
                    }
                };
                break;
            case 'certificate_header':
                newBlock = {
                    id: newId,
                    type,
                    title: 'Encabezado de Certificado',
                    isActive: true,
                    config: {
                        certificateTitle: 'CERTIFICADO DE COMPLETACIÓN',
                        certificateSubtitle: 'DIRECCIÓN DE INVESTIGACIÓN, INNOVACIÓN Y TRANSFERENCIA TECNOLÓGICA (DIITRA)',
                        certificateNumber: 'DIITRA-CERT-2026-XXXX'
                    }
                };
                break;
            case 'certificate_recipient_badge':
                newBlock = {
                    id: newId,
                    type,
                    title: 'Destinatario y Rol del Certificado',
                    isActive: true,
                    config: {
                        recipientName: '{{ RecipientName }}',
                        recipientRole: '{{ RecipientRole }}',
                        recipientCedula: '{{ RecipientCedula }}'
                    }
                };
                break;
            case 'certificate_body':
                newBlock = {
                    id: newId,
                    type,
                    title: 'Cuerpo y Logro del Certificado',
                    isActive: true,
                    config: {
                        textAchievement: 'Por su destacada y honorable participación en el proyecto de investigación y desarrollo tecnológico institucional.',
                        projectTitle: '{{ ProjectTitle }}',
                        completionDate: '{{ IssueDate }}'
                    }
                };
                break;
            default:
                return;
        }

        setBlocks(prev => [...prev, newBlock]);
        setActiveBlockId(newId);
        setIsDirty(true);
    };

    const handleDuplicateBlock = (id: string) => {
        const original = blocks.find(b => b.id === id);
        if (!original) return;
        const cloneId = `block-${Date.now()}`;
        const clone: DocumentBlock = {
            ...original,
            id: cloneId,
            title: `${original.title} (copia)`,
            config: JSON.parse(JSON.stringify(original.config)),
        };
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === id);
            const next = [...prev];
            next.splice(idx + 1, 0, clone);
            return next;
        });
        setActiveBlockId(cloneId);
        setIsDirty(true);
        addToast("Bloque Duplicado", `Se creó una copia de '${original.title}'.`, "success");
    };

    const handleDeleteBlock = (id: string) => {
        if (blocks.length <= 1) {
            addToast("Operación no Permitida", "El documento debe contener al menos un bloque estructural.", "warning");
            return;
        }
        setBlocks(prev => prev.filter(b => b.id !== id));
        setIsDirty(true);
        if (activeBlockId === id) {
            const index = blocks.findIndex(b => b.id === id);
            const fallbackId = blocks[index === 0 ? 1 : index - 1]?.id;
            setActiveBlockId(fallbackId || null);
        }
    };

    const handleToggleActive = (index: number) => {
        setBlocks(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], isActive: !copy[index].isActive };
            return copy;
        });
        setIsDirty(true);
    };

    const handleUpdateConfig = (blockId: string, key: string, value: any) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === blockId) {
                return {
                    ...b,
                    config: { ...b.config, [key]: value }
                };
            }
            return b;
        }));
        setIsDirty(true);
    };

    const handleUpdateThemeConfig = (newThemeJson: string) => {
        setSelectedTemplate(prev => prev ? { ...prev, themeConfigJson: newThemeJson } : null);
        setIsDirty(true);
    };

    const extractScribanVariables = (htmlContent: string): string[] => {
        const regex = /\{\{\s*(?:#each\s+|#if\s+|this\.)?([a-zA-Z0-9_]+)/g;
        const matches = new Set<string>();
        let match;
        while ((match = regex.exec(htmlContent)) !== null) {
            if (match[1]) {
                matches.add(match[1]);
            }
        }
        const blacklist = new Set([
            'logo_base64', 'portada_base64', 'participantes', 'criterios_evaluados',
            'puntaje_total', 'firma_trazabilidad', 'fecha_emision', 'this', 'each',
            'if', 'else', 'end', 'with', 'index', 'parent', 'carreras_coejecutoras',
            'investigador_director', 'investigadores_docentes', 'investigadores_estudiantes',
            'titulo'
        ]);

        return Array.from(matches).filter(v => !blacklist.has(v.toLowerCase()));
    };

    const handleSaveTemplate = async () => {
        if (!selectedTemplate) return;

        if (selectedTemplate.code === 'GLOBAL_THEME') {
            const ok = await confirm({
                title: 'Guardar Estilos Globales',
                message: '¿Estás seguro de que deseas actualizar los estilos y la identidad visual institucional global? Todos los nuevos reportes y documentos que no posean estilos específicos heredarán esta configuración.',
                confirmText: 'Sí, guardar',
                cancelText: 'Cancelar',
                variant: 'primary'
            });

            if (!ok) return;

            setSaving(true);
            try {
                const coverBlock = blocks.find(b => b.id === 'sample-cover');
                let updatedThemeConfigJson = selectedTemplate.themeConfigJson || '{}';
                if (coverBlock) {
                    try {
                        const parsed = JSON.parse(updatedThemeConfigJson);
                        if (!parsed.brand) parsed.brand = {};
                        parsed.brand.coverConfig = coverBlock.config;
                        updatedThemeConfigJson = JSON.stringify(parsed);
                    } catch (e) {
                        console.error("Error parsing themeConfigJson during save:", e);
                    }
                }

                await api.put('/admin/templates/global-theme', {
                    themeConfigJson: updatedThemeConfigJson
                });

                setSelectedTemplate(prev => prev ? { ...prev, themeConfigJson: updatedThemeConfigJson } : null);
                addToast("Diseño Global Guardado", "El tema visual institucional ha sido actualizado con éxito.", "success");
                setIsDirty(false);
            } catch (err) {
                console.error(err);
                addToast("Error al Guardar", "No se pudo actualizar el diseño global institucional.", "error");
            } finally {
                setSaving(false);
            }
            return;
        }

        let usageMessage = `¿Estás seguro de que deseas publicar la plantilla '${selectedTemplate.name}'? Todos los nuevos documentos generados utilizarán esta versión.`;
        try {
            const usageRes = await api.get(`/admin/templates/${selectedTemplate.code}/usage-count`);
            const activeDocsCount = usageRes.data?.count || 0;
            if (activeDocsCount > 0) {
                usageMessage = `Hay ${activeDocsCount} documento(s) activo(s) (borradores o en revisión) creados con esta plantilla. Al publicar una nueva versión, los documentos creados previamente conservarán la configuración de la versión con la que fueron inicializados. ¿Estás seguro de que deseas continuar con la publicación de esta nueva versión?`;
            }
        } catch (e) {
            console.error('[DIITRA] Error al consultar usage-count:', e);
        }

        const ok = await confirm({
            title: 'Publicar Plantilla',
            message: usageMessage,
            confirmText: 'Sí, publicar',
            cancelText: 'Cancelar',
            variant: 'primary'
        });

        if (!ok) return;

        setSaving(true);
        try {
            const themeConfig = mergeWithDefaults(selectedTemplate.themeConfigJson);
            const generatedHtml = generateHtmlFromBlocks(blocks, themeConfig);
            const blocksJson = JSON.stringify(blocks);
            const htmlWithEmbeddedJson = `<!-- DIITRA_SECTIONS_JSON: ${btoa(unescape(encodeURIComponent(blocksJson)))} -->\n${generatedHtml}`;

            const extractedFields = extractScribanVariables(generatedHtml);
            const collaborativeFieldsJson = JSON.stringify(extractedFields);

            await api.put(`/admin/templates/${selectedTemplate.code}`, {
                htmlContent: htmlWithEmbeddedJson,
                customCss: selectedTemplate.customCss || null,
                collaborativeFieldsJson,
                themeConfigJson: selectedTemplate.themeConfigJson || null
            });

            addToast("Plantilla Publicada", `La maqueta visual de la plantilla '${selectedTemplate.name}' ha sido publicada con éxito.`, "success");
            const st = selectedTemplate as any;
            const pubCode = st?.code || st?.template_code || st?.codigo || '';
            const pubName = st?.name || st?.nombre || '';
            notifyTemplatePublished({ templateCode: pubCode, template_code: pubCode, name: pubName });
            setIsDirty(false);

            const resCatalog = await api.get('/admin/templates');
            setTemplates(resCatalog.data || []);

            const updated = resCatalog.data.find((t: any) => t.code === selectedTemplate.code);
            if (updated) {
                let extractedBlocks = blocks;
                if (updated.htmlContent) {
                    const match = updated.htmlContent.match(/<!-- DIITRA_SECTIONS_JSON: (.*?) -->/);
                    if (match && match[1]) {
                        try {
                            const decoded = decodeURIComponent(escape(atob(match[1])));
                            extractedBlocks = JSON.parse(decoded);
                        } catch { }
                    }
                }
                setSelectedTemplate(prev => prev ? { ...prev, ...updated } : null);
                setBlocks(extractedBlocks);
            }
        } catch (err: any) {
            console.error(err);
            addToast("Error al Guardar", err.response?.data?.error ?? "No se pudieron persistir los bloques estructurales.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleCellChange = (blockId: string, rowIndex: number, cellIndex: number, val: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === blockId && b.type === 'advanced_table') {
                const newRows = [...(b.config.rows || [])];
                const newCells = [...newRows[rowIndex].cells];
                newCells[cellIndex] = val;
                newRows[rowIndex] = { cells: newCells };
                return { ...b, config: { ...b.config, rows: newRows } };
            }
            return b;
        }));
        setIsDirty(true);
    };

    const handleAddRow = (blockId: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === blockId && b.type === 'advanced_table') {
                const colCount = b.config.headers?.length || b.config.rows?.[0]?.cells.length || 2;
                const newRow = { cells: Array(colCount).fill('') };
                return { ...b, config: { ...b.config, rows: [...(b.config.rows || []), newRow] } };
            }
            return b;
        }));
        setIsDirty(true);
    };

    const handleRemoveRow = (blockId: string, rowIndex: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === blockId && b.type === 'advanced_table') {
                const newRows = (b.config.rows || []).filter((_, idx) => idx !== rowIndex);
                return { ...b, config: { ...b.config, rows: newRows } };
            }
            return b;
        }));
        setIsDirty(true);
    };

    const activeBlock = blocks.find(b => b.id === activeBlockId);

    const handleReorderTemplates = async (newTemplates: DocumentTemplateDto[]) => {
        setTemplates(newTemplates);
        try {
            const codes = newTemplates.map(t => t.code);
            await api.put('/admin/templates/order', { codes });
        } catch (err: any) {
            console.error(err);
            addToast("Error al Reordenar", "No se pudo guardar el orden personalizado de las plantillas.", "error");
        }
    };

    return {
        templates,
        selectedTemplate,
        setSelectedTemplate,
        loading,
        saving,
        isDirty,
        isDark,
        blocks,
        setBlocks,
        activeBlockId,
        setActiveBlockId,
        showPalette,
        setShowPalette,
        activeMobileTab,
        setActiveMobileTab,
        paletteRef,
        headerCollapsed,
        setHeaderCollapsed,
        isSidebarCollapsed,
        toggleSidebar,
        sensors,
        activeBlock,
        fetchTemplates,
        handleSelectTemplate,
        handleAddBlock,
        handleDuplicateBlock,
        handleDeleteBlock,
        handleToggleActive,
        handleUpdateConfig,
        handleUpdateThemeConfig,
        handleSaveTemplate,
        handleCellChange,
        handleAddRow,
        handleRemoveRow,
        handleDragEnd,
        handleReorderTemplates,
    };
};
