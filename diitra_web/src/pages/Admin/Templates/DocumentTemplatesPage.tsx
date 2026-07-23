import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios_config';
import { PageHeader } from '../../../components/Common/PageHeader';
import {
    FileCode2,
    Save,
    RefreshCw,
    Plus,
    ChevronDown,
    Heading1,
    AlignLeft,
    Grid,
    Image,
    Users,
    Award,
    PenLine,
    Columns2,
    LayoutTemplate,
    Minus,
    BarChart2,
    BookOpen,
    Target,
    DollarSign,
    FileText
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useNotifications } from '../../../api/NotificationsContext';
import type { DocumentTemplateDto, DocumentBlock, BlockType } from './types';
import { TemplateCatalog } from './components/TemplateCatalog';
import { BlockCanvas } from './components/BlockCanvas';
import { BlockProperties } from './components/BlockProperties';
import { generateHtmlFromBlocks } from './utils/HtmlGenerator';

const UNIQUE_BLOCK_TYPES: BlockType[] = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'project_ethics_report',
    'researchers_table',
    'gantt',
    'signatures',
    'impacts',
    'rubric_table'
];

const DocumentTemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<DocumentTemplateDto[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    // Lista de Bloques del Documento (Gutenberg/Word Style)
    const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'canvas' | 'properties'>('catalog');
    const paletteRef = useRef<HTMLDivElement>(null);

    // Prevenir la recarga/cierre de la pestaña si hay cambios pendientes
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

    // Sensores para Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

    // Cerrar paleta al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
                setShowPalette(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const { addToast } = useNotifications();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/templates');
            setTemplates(res.data || []);
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

    const handleSelectTemplate = async (tmpl: DocumentTemplateDto) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/templates/${tmpl.code}`);
            const fullData = res.data;
            setSelectedTemplate(fullData);

            let loadedBlocks: DocumentBlock[] = [];
            
            // Intentar extraer los bloques desde el comentario HTML
            if (fullData.htmlContent) {
                const match = fullData.htmlContent.match(/<!-- DIITRA_SECTIONS_JSON: (.*?) -->/);
                if (match && match[1]) {
                    try {
                        const decoded = decodeURIComponent(escape(atob(match[1])));
                        loadedBlocks = JSON.parse(decoded);
                    } catch {}
                }
            }

            if (loadedBlocks.length === 0 && fullData.collaborativeFieldsJson) {
                try {
                    const parsed = JSON.parse(fullData.collaborativeFieldsJson);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                        loadedBlocks = parsed;
                    }
                } catch {}
            }

            // Estructura por defecto
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
                            ? "INFORME FINAL DE INVESTIGACIÓN"
                            : tmpl.code === "DICTAMEN_ARBITRAJE"
                            ? "ACTA DE DICTAMEN DE ARBITRAJE"
                            : tmpl.code === "REPORTE_ANALITICAS"
                            ? "REPORTE DE ANALÍTICAS DE INVESTIGACIÓN"
                            : "PROYECTO DE INVESTIGACIÓN",
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

                if (tmpl.code === "DICTAMEN_ARBITRAJE") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2",
                            type: "title",
                            title: "Título de Sección",
                            isActive: true,
                            config: {
                                text: "1. IDENTIFICACIÓN DE LA EVALUACIÓN",
                                fontSize: "H2",
                                color: "#1e2a4a",
                                alignment: "left"
                            }
                        },
                        {
                            id: "block-3",
                            type: "advanced_table",
                            title: "Tabla de Identificación",
                            isActive: true,
                            config: {
                                headers: ["Campo", "Detalle de la Evaluación"],
                                colWidths: ["30%", "70%"],
                                rows: [
                                    { cells: ["Nombre del Proyecto:", "{{titulo}}"] },
                                    { cells: ["Evaluador Técnico:", "{{evaluador}}"] },
                                    { cells: ["Fecha de Evaluación:", "{{fecha_evaluacion}}"] }
                                ]
                            }
                        },
                        {
                            id: "block-6",
                            type: "title",
                            title: "Título de Sección",
                            isActive: true,
                            config: {
                                text: "2. CRITERIOS DE EVALUACIÓN",
                                fontSize: "H2",
                                color: "#1e2a4a",
                                alignment: "left"
                            }
                        },
                        {
                            id: "block-7",
                            type: "rubric_table",
                            title: "Tabla de Criterios (Rúbrica)",
                            isActive: true,
                            config: {
                                mostrarDescripcionCriterio: true,
                                mostrarObservacionesCriterio: true
                            }
                        },
                        baseSignatures
                    ];
                } else if (tmpl.code === "REPORTE_ANALITICAS") {
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2",
                            type: "title",
                            title: "Título de Sección",
                            isActive: true,
                            config: {
                                text: "1. RESUMEN DE MÉTRICAS E INDICADORES",
                                fontSize: "H2",
                                color: "#1e2a4a",
                                alignment: "left"
                            }
                        },
                        {
                            id: "block-3",
                            type: "advanced_table",
                            title: "Resumen de Indicadores",
                            isActive: true,
                            config: {
                                headers: ["Indicador de Investigación", "Valor Alcanzado"],
                                colWidths: ["60%", "40%"],
                                rows: [
                                    { cells: ["Total de Proyectos Aprobados:", "{{total_aprobados}}"] },
                                    { cells: ["Presupuesto Total Asignado:", "{{total_presupuesto}}"] },
                                    { cells: ["Investigadores Activos:", "{{total_investigadores}}"] }
                                ]
                            }
                        },
                        baseSignatures
                    ];
                } else {
                    // PROTOCOLO_INVESTIGACION, INFORME_FINAL_INVESTIGACION, INFORME_AVANCE (CUALQUIERA OTRAS GENÉRICAS)
                    loadedBlocks = [
                        baseCover,
                        {
                            id: "block-2",
                            type: "advanced_table",
                            title: "Tabla de Identificación",
                            isActive: true,
                            config: {
                                headers: ["Campo", "Detalle del Proyecto"],
                                colWidths: ["30%", "70%"],
                                rows: [
                                    { cells: ["Nombre del Proyecto:", "{{titulo}}"] },
                                    { cells: ["Programa de Investigación:", "{{programa}}"] },
                                    { cells: ["Línea de Investigación:", "{{linea_investigacion}}"] },
                                    { cells: ["Director del Proyecto:", "{{director_proyecto}}"] }
                                ]
                            }
                        },
                        {
                            id: "block-4",
                            type: "researchers_table",
                            title: "Tabla de Participantes",
                            isActive: true,
                            config: {
                                mostrarCedula: true,
                                mostrarHoras: true
                            }
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

    const handleAddBlock = (type: BlockType) => {
        const newId = `block-${Date.now()}`;
        let newBlock: DocumentBlock;

        switch (type) {
            case 'title':
                newBlock = { id: newId, type, title: 'Título de Sección', isActive: true,
                    config: { text: 'NUEVA SECCIÓN DE DOCUMENTO', fontSize: 'H2', color: '#1e2a4a', alignment: 'left' } };
                break;
            case 'rich_text':
                newBlock = { id: newId, type, title: 'Párrafo de Texto Enriquecido', isActive: true,
                    config: { html: '<p>Escribe el contenido aquí. Puedes usar <strong>negritas</strong>, <em>cursiva</em>, listas y hasta insertar tablas internas.</p>' } };
                break;
            case 'advanced_table':
                newBlock = { id: newId, type, title: 'Tabla Avanzada', isActive: true,
                    config: {
                        headerStyle: 'blue',
                        headers: ['Campo', 'Descripción'],
                        colWidths: ['30%', '70%'],
                        rows: [{ cells: ['', ''] }, { cells: ['', ''] }]
                    } };
                break;
            case 'multi_section_table':
                newBlock = { id: newId, type, title: 'Tabla Multi-Sección', isActive: true,
                    config: {
                        sections: [
                            { title: 'Sección 1', headerStyle: 'blue', headers: ['Descripción', 'Cantidad', 'Fuente'], colWidths: ['50%', '25%', '25%'], rows: [{ cells: ['', '', ''] }] },
                            { title: 'Sección 2', headerStyle: 'gold', headers: ['Descripción', 'Costo'], colWidths: ['70%', '30%'], rows: [{ cells: ['', ''] }] },
                        ]
                    } };
                break;
            case 'two_column':
                newBlock = { id: newId, type, title: 'Bloque Dos Columnas', isActive: true,
                    config: {
                        leftTitle: 'COLUMNA IZQUIERDA', leftHeaderStyle: 'blue', leftContent: '<p>Contenido izquierdo...</p>',
                        rightTitle: 'COLUMNA DERECHA', rightHeaderStyle: 'blue', rightContent: '<p>Contenido derecho...</p>'
                    } };
                break;
            case 'page_break':
                newBlock = { id: newId, type, title: 'Salto de Página', isActive: true, config: {} };
                break;
            case 'gantt':
                newBlock = { id: newId, type, title: 'Cronograma de Actividades (Gantt)', isActive: true,
                    config: {
                        ganttMonths: ['Marzo','Abril','Mayo','Junio','Julio','Agosto','Sept','Octubre','Nov','Dic','Enero','Febrero'],
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
                    } };
                break;
            case 'cover':
                newBlock = { id: newId, type, title: 'Portada Institucional', isActive: true,
                    config: { tituloSuperior: 'NUEVO DOCUMENTO', carreraPorDefecto: 'TECNOLOGÍA SUPERIOR EN DESARROLLO DE SOFTWARE', periodoPorDefecto: 'PERIODO ACADÉMICO 2025-2026', colorTema: '#1e2a4a' } };
                break;
            case 'researchers_table':
                newBlock = { id: newId, type, title: 'Tabla de Participantes', isActive: true,
                    config: { mostrarCedula: true, mostrarHoras: true, mostrarEmail: false, mostrarNivelAcademico: false, mostrarTelefono: false } };
                break;
            case 'rubric_table':
                newBlock = { id: newId, type, title: 'Tabla de Criterios (Rúbrica)', isActive: true,
                    config: { mostrarDescripcionCriterio: true, mostrarObservacionesCriterio: true } };
                break;
            case 'signatures':
                newBlock = { id: newId, type, title: 'Bloque de Firmas y Trazabilidad', isActive: true,
                    config: {
                        signatories: [
                            { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
                            { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' }
                        ],
                        textoPieFirma: 'Comisión de Acreditación e Investigación IST Traversari'
                    } };
                break;
            case 'project_general_section':
                newBlock = { id: newId, type, title: 'Ficha de Identificación del Proyecto', isActive: true, config: {} };
                break;
            case 'project_technical_section':
                newBlock = { id: newId, type, title: 'Plan Técnico de Redacción', isActive: true, config: {} };
                break;
            case 'project_budget_section':
                newBlock = { id: newId, type, title: 'Recursos y Financiamiento del Proyecto', isActive: true, config: {} };
                break;
            case 'project_progress_report':
                newBlock = { id: newId, type, title: 'Avance de Ejecución y Monitoreo', isActive: true, config: {} };
                break;
            case 'project_ethics_report':
                newBlock = { id: newId, type, title: 'Acta del Comité de Ética', isActive: true, config: {} };
                break;
            case 'impacts':
                newBlock = { id: newId, type, title: 'Matriz de Impactos y Productos Esperados', isActive: true, config: {} };
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
            config: JSON.parse(JSON.stringify(original.config)), // deep clone
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

    const extractScribanVariables = (htmlContent: string): string[] => {
        // Busca expresiones {{variable}}, {{#each variable}}, {{#if variable}} o {{this.variable}}
        const regex = /\{\{\s*(?:#each\s+|#if\s+|this\.)?([a-zA-Z0-9_]+)/g;
        const matches = new Set<string>();
        let match;
        while ((match = regex.exec(htmlContent)) !== null) {
            if (match[1]) {
                matches.add(match[1]);
            }
        }

        // Lista negra de variables del sistema o palabras reservadas de Scriban
        const blacklist = new Set([
            'logo_base64', 'portada_base64', 'participantes', 'criterios_evaluados',
            'puntaje_total', 'firma_trazabilidad', 'fecha_emision', 'this', 'each',
            'if', 'else', 'end', 'with', 'index', 'parent', 'carreras_coejecutoras',
            'investigador_director', 'investigadores_docentes', 'investigadores_estudiantes',
            'titulo' // 'titulo' se carga del proyecto general
        ]);

        return Array.from(matches).filter(v => !blacklist.has(v.toLowerCase()));
    };

    const handleSaveTemplate = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const generatedHtml = generateHtmlFromBlocks(blocks);
            const blocksJson = JSON.stringify(blocks);
            const htmlWithEmbeddedJson = `<!-- DIITRA_SECTIONS_JSON: ${btoa(unescape(encodeURIComponent(blocksJson)))} -->\n${generatedHtml}`;

            const extractedFields = extractScribanVariables(generatedHtml);
            const collaborativeFieldsJson = JSON.stringify(extractedFields);

            await api.put(`/admin/templates/${selectedTemplate.code}`, {
                htmlContent: htmlWithEmbeddedJson,
                customCss: selectedTemplate.customCss || null,
                collaborativeFieldsJson
            });

            await api.put(`/admin/templates/${selectedTemplate.code}/signature-config`, {
                requiresSignature: selectedTemplate.requiresElectronicSignature,
                signatureType: selectedTemplate.signatureType
            });

            addToast("Plantilla Publicada", `La maqueta visual de la plantilla '${selectedTemplate.name}' ha sido publicada con éxito.`, "success");
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
                        } catch {}
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

    return (
        <main className="flex-1 bg-bg-deep p-4 md:px-10 md:pt-8 md:pb-4 flex flex-col h-[calc(100vh-56px)] overflow-hidden font-sans">
            {/* Cabecera Principal */}
            <PageHeader
                kicker="Administración de Plantillas"
                icon={FileCode2}
                title="Editor de Plantillas"
                description="Creador visual de documentos. Arrastra bloques, añade tablas y define la maquetación del PDF oficial."
                className="relative z-30"
            >
                {selectedTemplate && (
                    <div className="flex items-center gap-2 mt-3 md:mt-0 md:translate-y-11">
 

                        {/* Paleta de bloques tipo Notion */}
                        <div ref={paletteRef} className="relative">
                            <button
                                onClick={() => setShowPalette(p => !p)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-thin text-text-main bg-surface hover:bg-surface-hover hover:border-border-hover text-xs font-medium transition-all cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar Bloque
                                <ChevronDown className={`w-3 h-3 transition-transform ${showPalette ? 'rotate-180' : ''}`} />
                            </button>
 
                            {showPalette && (
                                <div className="absolute top-full right-0 mt-2 z-50 bg-surface border border-border-thin rounded-md shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-4 w-[520px] max-h-[80vh] overflow-y-auto animate-fade-in-up flex flex-col gap-4">
                                    {/* ── Bloques de Contenido ── */}
                                    <div>
                                        <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques Estructurales & Contenido</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                { type: 'cover' as const,             icon: Image,         label: 'Portada Institucional',   desc: 'Portada del PDF con logos y título.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'title' as const,             icon: Heading1,      label: 'Título de Sección',       desc: 'Encabezado de sección para el PDF.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'rich_text' as const,         icon: AlignLeft,     label: 'Párrafo Enriquecido',     desc: 'Editor colaborativo en el Workspace.', color: 'text-pink-500 bg-pink-500/5' },
                                                { type: 'advanced_table' as const,    icon: Grid,          label: 'Tabla Avanzada',          desc: 'Tabla con filas y columnas fijas.',   color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'multi_section_table' as const,icon: LayoutTemplate,label: 'Tabla Multi-Sección',    desc: 'Conjunto de sub-tablas fijas.',          color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'two_column' as const,        icon: Columns2,      label: 'Dos Columnas',            desc: 'Dos bloques de texto lado a lado.',  color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'page_break' as const,        icon: Minus,         label: 'Salto de Página',         desc: 'Forzar salto de página en el PDF.',  color: 'text-zinc-400 bg-zinc-400/5' },
                                                { type: 'gantt' as const,              icon: BarChart2,     label: 'Diagrama de Gantt',        desc: 'Pestaña de Cronograma en Workspace.',  color: 'text-indigo-500 bg-indigo-500/5' },
                                            ]).map(item => {
                                                const ItemIcon = item.icon;
                                                const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                return (
                                                    <button key={item.type}
                                                        disabled={alreadyExists}
                                                        onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                        className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                    >
                                                        <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                            <ItemIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                <span>{item.label}</span>
                                                                {alreadyExists && <span className="text-[8px] font-medium font-mono bg-surface-hover border border-border-thin/30 px-1.5 py-0.5 rounded text-text-dim shrink-0">Añadido</span>}
                                                            </p>
                                                            <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ── Bloques Dinámicos ── */}
                                    <div className="border-t border-border-thin/30 pt-3">
                                        <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques de Base de Datos (Dinámicos)</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                { type: 'project_general_section' as const, icon: BookOpen, label: 'Ficha de Identificación', desc: 'Metadatos (título, carrera, plazos).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'researchers_table' as const, icon: Users,   label: 'Equipo de Investigadores', desc: 'Participantes del proyecto científico.',        color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_technical_section' as const, icon: FileText, label: 'Plan Técnico', desc: '8 sub-secciones de redacción (Antecedentes, Metodología, etc.).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_budget_section' as const, icon: DollarSign, label: 'Recursos y Presupuesto', desc: 'Tablas de recursos y financiamiento del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_progress_report' as const, icon: BarChart2, label: 'Avance de Ejecución', desc: 'Hitos, evidencias y avance presupuestario.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_ethics_report' as const, icon: Award, label: 'Acta de Comité de Ética', desc: 'Dictamen final de pertinencia ética y bioética.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'impacts' as const,           icon: Target,  label: 'Matriz de Impactos',       desc: 'Impactos y productos esperados.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'rubric_table' as const,      icon: Award,   label: 'Rúbrica de Calificación',  desc: 'Criterios para los revisores pares.',  color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'signatures' as const,        icon: PenLine, label: 'Bloque de Firmas',         desc: 'Firmas físicas o electrónica CACES.',color: 'text-emerald-500 bg-emerald-500/5' },
                                            ]).map(item => {
                                                const ItemIcon = item.icon;
                                                const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                return (
                                                    <button key={item.type}
                                                        disabled={alreadyExists}
                                                        onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                        className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                    >
                                                        <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                            <ItemIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                <span>{item.label}</span>
                                                                {alreadyExists && <span className="text-[8px] font-medium font-mono bg-emerald-500/5 border border-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-600 shrink-0">Añadido</span>}
                                                            </p>
                                                            <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSaveTemplate}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-text-main text-bg-deep text-xs font-medium hover:opacity-90 transition-all shadow-none disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Guardar y Publicar v{selectedTemplate.version}
                        </button>
                    </div>
                )}
            </PageHeader>
 
            {selectedTemplate && (
                <div className="flex xl:hidden items-center bg-surface border border-border-thin rounded-md p-1 shrink-0 mt-3 gap-0.5">
                    {([
                        { key: 'catalog',    label: 'Catálogo' },
                        { key: 'canvas',     label: `Documento (${blocks.length})` },
                        { key: 'properties', label: 'Propiedades' },
                    ] as const).map(tab => (
                        <button key={tab.key}
                            onClick={() => setActiveMobileTab(tab.key)}
                            className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                activeMobileTab === tab.key
                                    ? 'bg-surface-hover text-text-main border border-border-thin'
                                    : 'text-text-dim hover:text-text-main'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
 
            {loading && templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1">
                    <RefreshCw className="w-8 h-8 text-brand animate-spin mb-2" />
                    <span className="text-xs text-text-dim">Cargando catálogo Traversari...</span>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden min-h-0 mt-4 gap-3 flex-col xl:flex-row">
 
                    {/* ── CATÁLOGO ── */}
                    <div className={`w-full xl:w-60 shrink-0 flex flex-col min-h-0 ${
                        selectedTemplate && activeMobileTab !== 'catalog' ? 'hidden xl:flex' : 'flex'
                    }`}>
                        <TemplateCatalog
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onSelectTemplate={handleSelectTemplate}
                        />
                    </div>
 
                    {selectedTemplate ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            {/* ── ESTRUCTURA (Lienzo visual A4 central) ── */}
                            <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${
                                activeMobileTab === 'canvas' ? 'flex' : 'hidden xl:flex'
                            }`}>
                                <BlockCanvas
                                    blocks={blocks}
                                    activeBlockId={activeBlockId}
                                    onSelectBlock={(id) => {
                                        setActiveBlockId(id);
                                        setActiveMobileTab('properties');
                                    }}
                                    onToggleActive={handleToggleActive}
                                    onDeleteBlock={handleDeleteBlock}
                                    onDuplicateBlock={handleDuplicateBlock}
                                    templateName={selectedTemplate.name}
                                    isDirty={isDirty}
                                />
                            </div>
 
                            {/* ── PROPIEDADES ── */}
                            <div className={`xl:w-96 shrink-0 flex flex-col min-h-0 ${
                                activeMobileTab === 'properties' ? 'flex w-full' : 'hidden xl:flex'
                            }`}>
                                <BlockProperties
                                    activeBlock={activeBlock}
                                    onUpdateConfig={handleUpdateConfig}
                                    onCellChange={handleCellChange}
                                    onAddRow={handleAddRow}
                                    onRemoveRow={handleRemoveRow}
                                />
                            </div>
                        </DndContext>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center select-none border border-border-thin rounded-md bg-surface">
                            <div className="p-4 bg-surface-hover rounded-full text-text-dim/60 mb-3 border border-border-thin/60">
                                <FileCode2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-sm font-bold text-text-main">
                                Ninguna plantilla seleccionada
                            </h3>
                            <p className="text-xs text-text-dim max-w-xs mt-1 leading-normal">
                                Selecciona una plantilla de la lista de la izquierda para comenzar a estructurar tu documento visualmente.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

export default DocumentTemplatesPage;
