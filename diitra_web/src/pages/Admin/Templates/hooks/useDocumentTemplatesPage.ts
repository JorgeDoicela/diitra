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
                const baseCover = {
                    id: "block-1",
                    type: "cover" as const,
                    title: "Portada Institucional (Rombos)",
                    isActive: true,
                    config: {
                        tituloSuperior: tmpl.code === "INFORME_AVANCE"
                            ? "INFORME DE AVANCE DE INVESTIGACIÓN"
                            : tmpl.code === "INFORME_FINAL_INVESTIGACION"
                                ? "INFORME FINAL DEL PROYECTO DE INVESTIGACIÓN"
                                : tmpl.code === "DICTAMEN_ARBITRAJE"
                                    ? "ACTA DE DICTAMEN DE ARBITRAJE"
                                    : tmpl.code === "REPORTE_ANALITICAS"
                                        ? "REPORTE DE ANALÍTICAS DE INVESTIGACIÓN"
                                        : "PROYECTO DE INVESTIGACIÓN",
                        colorTituloSuperior: tmpl.code === "INFORME_FINAL_INVESTIGACION" ? "gold" : "navy",
                        carreraPorDefecto: "TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE",
                        periodoPorDefecto: "PERIODO ACADÉMICO MARZO 2025 - SEPTIEMBRE 2025",
                        colorTema: "#1e2a4a"
                    }
                };

                const baseSignatures = {
                    id: "block-8",
                    type: "signatures" as const,
                    title: "Bloque de Firmas y Trazabilidad",
                    isActive: true,
                    config: {
                        textoPieFirma: "Comisión de Acreditación e Investigación IST Traversari"
                    }
                };

                if (tmpl.code === "INFORME_AVANCE") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-progress-1", type: "progress_header_section", title: "1. Encabezado e Identificación", isActive: true,
                            config: { progressHeaderColor: "navy", progressHeaderBorder: "solid" }
                        },
                        {
                            id: "block-progress-2", type: "progress_activity_section", title: "2. Matriz de Actividades Ejecutadas", isActive: true,
                            config: { activityVariant: "ejecutadas", activityTableTitle: "MATRIZ DE ACTIVIDADES EJECUTADAS", activityHeaderColor: "navy" }
                        },
                        {
                            id: "block-progress-3", type: "progress_activity_section", title: "3. Actividades No Previstas (NP)", isActive: true,
                            config: { activityVariant: "no_previstas", activityTableTitle: "ACTIVIDADES NO PREVISTAS (NP)", activityHeaderColor: "navy" }
                        },
                        {
                            id: "block-progress-4", type: "progress_activity_section", title: "4. Obstáculos y Acciones Correctivas (OBS)", isActive: true,
                            config: { activityVariant: "obstaculos", activityTableTitle: "OBSTÁCULOS Y ACTIVIDADES CORRECTIVAS (OBS)", activityHeaderColor: "gold" }
                        },
                        {
                            id: "block-progress-5", type: "progress_status_section", title: "5. Estado de Ejecución y Observaciones", isActive: true,
                            config: { progressStatusHeaderColor: "navy" }
                        },
                        baseSignatures
                    ];
                } else if (tmpl.code === "INFORME_FINAL_INVESTIGACION") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-final-1", type: "final_report_header_section", title: "1. Datos del Proyecto de Investigación", isActive: true,
                            config: { finalReportTitle: "DATOS DEL PROYECTO DE INVESTIGACIÓN", finalReportHeaderColor: "navy", showTipoInvestigacion: true, showAlcanceProyecto: true, showFechasProyecto: true, showTablaInvestigadores: true }
                        },
                        {
                            id: "block-indice", type: "rich_text", title: "ÍNDICE", isActive: true,
                            config: { title: "ÍNDICE", placeholder: "Elaborar un índice detallado con los títulos y subtítulos del informe, numerando cada sección de acuerdo con el formato del documento.\nIncluir las páginas correspondientes a cada sección.\nIncluir el índice de tablas.\nIncluir el índice de imágenes." }
                        },
                        {
                            id: "block-resumen", type: "rich_text", title: "RESUMEN", isActive: true,
                            config: { title: "RESUMEN", placeholder: "(250-300 palabras, 3-4 párrafos)\nPresentar una síntesis clara del proyecto, destacando el problema abordado, los objetivos, la metodología, los principales resultados y conclusiones.\nDebe redactarse en tercera persona y sin incluir citas." }
                        },
                        {
                            id: "block-introduccion", type: "rich_text", title: "INTRODUCCIÓN", isActive: true,
                            config: { title: "INTRODUCCIÓN", placeholder: "(500-700 palabras, 5-7 párrafos)\nExplicar el contexto y la relevancia del proyecto de investigación.\nDefinir el problema central y justificar su importancia.\nDescribir brevemente el enfoque metodológico utilizado.\nMencionar el impacto esperado del proyecto.\nIncluir citas según normas APA 7ª edición." }
                        },
                        {
                            id: "block-objetivos", type: "rich_text", title: "OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS", isActive: true,
                            config: { title: "OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS", placeholder: "Escriba su objetivo general.\nEscriba sus objetivos específicos, en forma de lista, orientados a la consecución del objetivo general." }
                        },
                        {
                            id: "block-fundamentos", type: "rich_text", title: "FUNDAMENTOS", isActive: true,
                            config: { title: "FUNDAMENTOS", placeholder: "(EXTENSIÓN VARIABLE)\nDescribir los conceptos clave, antecedentes y fundamentos teóricos que respaldan el proyecto.\nIncluir referencias a estudios previos, normativas o metodologías relacionadas.\nCITAR USANDO normas APA 7ª edición.\nPuede extenderse según la necesidad del tema." }
                        },
                        {
                            id: "block-metodos", type: "rich_text", title: "MÉTODOS", isActive: true,
                            config: { title: "MÉTODOS", placeholder: "(700-900 palabras, 5-8 párrafos)\nExplicar detalladamente la metodología utilizada en la investigación.\nDescribir las técnicas, herramientas e instrumentos empleados para la recolección y análisis de datos.\nJustificar la elección de métodos y procedimientos.\nIncluir un cuadro o esquema si es necesario." }
                        },
                        {
                            id: "block-resultados", type: "rich_text", title: "RESULTADOS", isActive: true,
                            config: { title: "RESULTADOS", placeholder: "(800-1200 palabras, 6-12 párrafos)\nExponer los hallazgos obtenidos en la investigación.\nPresentar datos relevantes a través de gráficos, tablas o figuras si es necesario.\nInterpretar los resultados de manera objetiva.\nComparar con investigaciones previas si aplica." }
                        },
                        {
                            id: "block-productos", type: "rich_text", title: "PRODUCTOS", isActive: true,
                            config: { title: "PRODUCTOS", placeholder: "(400-600 palabras, 4-6 párrafos)\nDescribir los productos generados a partir del proyecto (publicaciones, prototipos, software, modelos, documentos técnicos, etc.).\nIncluir evidencia tangible de estos productos si aplica." }
                        },
                        {
                            id: "block-impactos", type: "rich_text", title: "IMPACTOS", isActive: true,
                            config: { title: "IMPACTOS", placeholder: "(500-800 palabras, 5-8 párrafos)\nExplicar los impactos generados por el proyecto en términos científicos, tecnológicos, sociales, económicos o educativos.\nPresentar evidencia de la aplicación práctica de los resultados." }
                        },
                        {
                            id: "block-transferencia", type: "rich_text", title: "TRANSFERENCIA DE RESULTADOS", isActive: true,
                            config: { title: "TRANSFERENCIA DE RESULTADOS", placeholder: "(400-600 palabras, 4-6 párrafos)\nDescribir cómo se han compartido o aplicado los resultados del proyecto en otros ámbitos.\nMencionar convenios, publicaciones, capacitaciones o implementaciones en organizaciones externas." }
                        },
                        {
                            id: "block-informe_financiero", type: "rich_text", title: "INFORME FINANCIERO DE GASTOS", isActive: true,
                            config: { title: "INFORME FINANCIERO DE GASTOS", placeholder: "(Extensión variable)\nPresentar un desglose detallado de los recursos utilizados en el proyecto.\nIncluir tablas que especifiquen montos, conceptos y justificaciones de los gastos." }
                        },
                        {
                            id: "block-conclusiones", type: "rich_text", title: "CONCLUSIONES", isActive: true,
                            config: { title: "CONCLUSIONES", placeholder: "(500-700 palabras, 5-7 párrafos)\nResumir los principales hallazgos del proyecto.\nExplicar si los objetivos planteados fueron alcanzados.\nMencionar limitaciones y posibles mejoras futuras." }
                        },
                        {
                            id: "block-recomendaciones", type: "rich_text", title: "RECOMENDACIONES", isActive: true,
                            config: { title: "RECOMENDACIONES", placeholder: "(500-700 palabras, 5-7 párrafos)\nProponer acciones concretas basadas en los hallazgos del proyecto.\nSugerir mejoras en la metodología, implementación o futuras líneas de investigación.\nIndicar estrategias para la aplicación práctica de los resultados en contextos académicos, industriales o sociales.\nConsiderar limitaciones detectadas y cómo superarlas en investigaciones futuras.\nLas recomendaciones deben ser viables, realistas y alineadas con los objetivos del proyecto." }
                        },
                        {
                            id: "block-bibliografia", type: "rich_text", title: "BIBLIOGRAFÍA", isActive: true,
                            config: { title: "BIBLIOGRAFÍA", placeholder: "(Extensión variable)\nListar fuentes adicionales que hayan sido consultadas, tanto las usadas como aquellas que no necesariamente han sido citadas en el texto." }
                        },
                        {
                            id: "block-anexos", type: "rich_text", title: "ANEXOS", isActive: true,
                            config: { title: "ANEXOS", placeholder: "(Extensión variable)\nIncluir documentos complementarios como cuestionarios, encuestas, imágenes, gráficos, diagramas, o capturas de pantalla de herramientas utilizadas." }
                        },
                        baseSignatures
                    ];
                } else if (tmpl.code === "DICTAMEN_ARBITRAJE") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2", type: "title", title: "Título de Sección", isActive: true,
                            config: { text: "1. IDENTIFICACIÓN DE LA EVALUACIÓN", fontSize: "H2", color: "#1e2a4a", alignment: "left" }
                        },
                        {
                            id: "block-3", type: "advanced_table", title: "Tabla de Identificación", isActive: true,
                            config: {
                                headers: ["Campo", "Detalle de la Evaluación"], colWidths: ["30%", "70%"],
                                rows: [{ cells: ["Nombre del Proyecto:", "{{titulo}}"] }, { cells: ["Evaluador Técnico:", "{{evaluador}}"] }, { cells: ["Fecha de Evaluación:", "{{fecha_evaluacion}}"] }]
                            }
                        },
                        {
                            id: "block-6", type: "title", title: "Título de Sección", isActive: true,
                            config: { text: "2. CRITERIOS DE EVALUACIÓN", fontSize: "H2", color: "#1e2a4a", alignment: "left" }
                        },
                        {
                            id: "block-7", type: "rubric_table", title: "Tabla de Criterios (Rúbrica)", isActive: true,
                            config: { mostrarDescripcionCriterio: true, mostrarObservacionesCriterio: true }
                        },
                        baseSignatures
                    ];
                } else if (tmpl.code === "REPORTE_ANALITICAS") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2", type: "title", title: "Título de Sección", isActive: true,
                            config: { text: "1. RESUMEN DE MÉTRICAS E INDICADORES", fontSize: "H2", color: "#1e2a4a", alignment: "left" }
                        },
                        {
                            id: "block-3", type: "advanced_table", title: "Resumen de Indicadores", isActive: true,
                            config: {
                                headers: ["Indicador de Investigación", "Valor Alcanzado"], colWidths: ["60%", "40%"],
                                rows: [{ cells: ["Total de Proyectos Aprobados:", "{{total_aprobados}}"] }, { cells: ["Presupuesto Total Asignado:", "{{total_presupuesto}}"] }, { cells: ["Investigadores Activos:", "{{total_investigadores}}"] }]
                            }
                        },
                        baseSignatures
                    ];
                } else if (tmpl.code === "OFICIO_APROBACION") {
                    loadedBlocks = [
                        {
                            id: "block-1", type: "title", title: "Encabezado del Oficio", isActive: true,
                            config: { text: "OFICIO DE APROBACIÓN DE PROYECTO DE INVESTIGACIÓN", fontSize: "H1", color: "#1b263b", alignment: "center" }
                        },
                        {
                            id: "block-2", type: "project_approval_notice", title: "Resumen y Dictamen del Proyecto", isActive: true,
                            config: {
                                ciudad_emision: "Quito",
                                mostrarLogoHeader: false,
                                parrafo_aprobacion: 'Reciba un cordial saludo y por medio del presente, es un placer informarle que, tras la evaluación correspondiente, su proyecto de investigación titulado "{{proyecto_titulo}}" ha sido aprobado por la Coordinación de la Unidad de Investigación.',
                                parrafo_fundamento: 'La aprobación se basa en la relevancia y viabilidad del proyecto, así como en su alineación con los objetivos académicos de nuestra institución, quedando establecidos la siguiente información:',
                                textoCACES: "Las actividades complementarias al desarrollo del proyecto son los Informes de Seguimiento mensuales, con sus respectivos anexos que respalden las actividades ejecutadas, además de, el Plan de Aprendizaje y Evaluación del Plan de Aprendizaje por cada estudiante que forme parte del grupo de investigación y culminando con la Difusión de Resultados obtenidos del proyecto ejecutado.",
                                parrafo_invitacion: "Le animamos a proceder con la ejecución del proyecto, manteniendo los estándares de calidad y ética que nos caracterizan. Asimismo, quedamos a su disposición para brindarle el apoyo necesario durante el desarrollo de su investigación.",
                                frase_cierre: "Con sentimientos de distinguida consideración.",
                                frase_despedida: "Atentamente,",
                                coordinador_nombre: "Ing. Estefani Sánchez Mgtr.",
                                coordinador_cargo: "Coordinadora de la Unidad de Investigación e Innovación",
                                firmante_institucion: "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI",
                                mostrarCompromisosCACES: true,
                                mostrarTablaFechas: true
                            }
                        },
                        {
                            id: "block-3", type: "signatures", title: "Firma Electrónica de la Coordinación", isActive: true,
                            config: {
                                signatories: [
                                    { label: "Atentamente,", name: "Ing. Estefani Sánchez Mgtr.", role: "Coordinadora de la Unidad de Investigación e Innovación" }
                                ],
                                textoPieFirma: "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI"
                            }
                        }
                    ];
                } else {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2", type: "advanced_table", title: "Tabla de Identificación", isActive: true,
                            config: {
                                headers: ["Campo", "Detalle del Proyecto"], colWidths: ["30%", "70%"],
                                rows: [{ cells: ["Nombre del Proyecto:", "{{titulo}}"] }, { cells: ["Programa de Investigación:", "{{programa}}"] }, { cells: ["Línea de Investigación:", "{{linea_investigacion}}"] }, { cells: ["Director del Proyecto:", "{{director_proyecto}}"] }]
                            }
                        },
                        {
                            id: "block-4", type: "researchers_table", title: "Tabla de Participantes", isActive: true,
                            config: { mostrarCedula: true, mostrarHoras: true }
                        },
                        baseSignatures
                    ];
                }
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
            case 'project_ethics_report':
                newBlock = { id: newId, type, title: 'Acta del Comité de Ética', isActive: true, config: {} };
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
