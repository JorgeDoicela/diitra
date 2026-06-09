import { 
    Shield, History, Settings2, Mail, Award
} from 'lucide-react';
import type { HelpConfig, MockupProps } from '../types';

export const USUARIOS_CONFIG: HelpConfig = {
    icon: <Shield size={24} className="text-brand" />,
    title: "Consola de Gestión de Usuarios y Roles",
    summary: "Control administrativo de identidades, perfiles académicos y asignación de capacidades del claustro.",
    description: "Sección exclusiva para la administración central orientada a la gestión de accesos y configuración de permisos de usuarios en DIITRA. Facilita la asignación rápida de roles clave, la habilitación de firmas digitales y el registro exhaustivo de evaluadores y revisores pares externos para procesos de evaluación doble ciego.",
    steps: [
        {
            title: "Asignación dinámica de roles y capacidades",
            description: "Administra los accesos activando o desactivando permisos específicos directamente en la lista de usuarios. Puedes otorgar múltiples roles a un docente (por ejemplo: Docente e Investigador o Revisor Externo) lo que modificará de inmediato las vistas, opciones del menú lateral y facultades operativas del usuario al iniciar sesión.",
            highlight: 'content-bottom'
        },
        {
            title: "Registro formal de evaluadores externos",
            description: "Usa el botón de acción rápida 'Nuevo Externo' para registrar profesionales evaluadores de otras universidades del país o del extranjero. Es obligatorio detallar su cédula o pasaporte, afiliación institucional, correo electrónico formal, especialidad UNESCO y su enlace de perfil ORCID para la validación automática de producción científica.",
            highlight: 'content-top'
        },
        {
            title: "Auditoría de firmas y perfiles digitales académicos",
            description: "Haz clic en cualquier usuario de la tabla para abrir el panel lateral de detalles de metadatos. Aquí se almacena la información complementaria de la hoja de vida académica, el estado de validación de su firma electrónica (firma en archivo o token), su historial de accesos recientes e IP de conexión para fines de control de seguridad.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Respalda la transparencia en la conformación del tribunal evaluador externo exigido por el CACES, asegurando el debido proceso y la idoneidad técnica en las evaluaciones de proyectos bajo normas nacionales e internacionales.",
    tips: [
        "Al crear un nuevo evaluador externo, el sistema le enviará de manera automática un correo con sus credenciales de acceso seguras y un enlace temporal de activación de firma electrónica.",
        "Utiliza el filtro de roles para listar únicamente a los usuarios con permisos de revisión académica externa para agilizar las designaciones de tribunales."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Controls Area */}
            <div className={`rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[4px] text-text-dim uppercase font-mono tracking-wider font-semibold">Control de Accesos</span>
                        <span className="text-[7px] text-text-main font-bold">Gestión de Usuarios</span>
                    </div>
                    <div className="px-1.5 py-0.5 bg-brand text-white rounded text-[5px] font-bold">
                        + Nuevo Externo
                    </div>
                </div>
                {/* Segmented Tab Switcher */}
                <div className="flex gap-1.5 border-b border-border-thin pb-0.5 text-[5px] font-medium">
                    <span className="text-brand font-semibold border-b border-brand pb-0.5">Todos</span>
                    <span className="text-text-dim pb-0.5">Docentes</span>
                    <span className="text-text-dim pb-0.5">Externos</span>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="text-[4px] text-text-dim font-mono">Solo Activos</span>
                        <div className="w-4 h-2.5 rounded-full bg-brand p-[1px] flex justify-end items-center"><div className="w-1.8 h-1.8 rounded-full bg-white"/></div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                <table className="w-full text-left border-collapse text-[4.5px]">
                    <thead>
                        <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                            <th className="pb-1 font-bold">Usuario</th>
                            <th className="pb-1 font-bold">Filiación / ORCID</th>
                            <th className="pb-1 font-bold">Roles</th>
                            <th className="pb-1 font-bold">Firma</th>
                            <th className="pb-1 font-bold text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin/30">
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Dr. Carlos Mendoza</span>
                                <span className="text-[3.5px] font-mono text-text-dim">c.mendoza@diitra.edu</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main block leading-tight">Dpto. Sistemas</span>
                                <span className="text-[3.5px] font-mono text-brand font-semibold">0000-0002-3489-1209</span>
                            </td>
                            <td className="py-1">
                                <div className="flex flex-wrap gap-0.5">
                                    <span className="px-0.5 py-0.2 bg-brand/10 border border-brand/20 text-brand rounded-[2px] text-[3.5px]">Docente</span>
                                    <span className="px-0.5 py-0.2 bg-success/10 border border-success/20 text-success rounded-[2px] text-[3.5px]">Investigador</span>
                                </div>
                            </td>
                            <td className="py-1">
                                <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded-[2px] text-[3.5px] font-semibold">
                                    ✓ Archivo
                                </span>
                            </td>
                            <td className="py-1 text-right">
                                <span className="text-success font-semibold">● Activo</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Dra. Elena Rostova</span>
                                <span className="text-[3.5px] font-mono text-text-dim">e.rostova@univ-paris.fr</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main block leading-tight">Univ. de Paris (Ext)</span>
                                <span className="text-[3.5px] font-mono text-brand font-semibold">0000-0001-8890-4122</span>
                            </td>
                            <td className="py-1">
                                <div className="flex flex-wrap gap-0.5">
                                    <span className="px-0.5 py-0.2 bg-warning/10 border border-warning/20 text-warning rounded-[2px] text-[3.5px]">Revisor Ext.</span>
                                </div>
                            </td>
                            <td className="py-1">
                                <span className="px-1 py-0.2 bg-text-dim/15 border border-border-thin text-text-dim rounded-[2px] text-[3.5px] font-semibold">
                                    No Def.
                                </span>
                            </td>
                            <td className="py-1 text-right">
                                <span className="text-success font-semibold">● Activo</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
};

export const AUDITORIA_CONFIG: HelpConfig = {
    icon: <History size={24} className="text-brand" />,
    title: "Trazabilidad de Auditoría Forense",
    summary: "Bitácora inmutable de transacciones y control de cambios forenses en la base de datos.",
    description: "Módulo forense de alta seguridad diseñado para el registro cronológico e inmutable de toda acción crítica realizada en la base de datos de DIITRA. Permite rastrear con precisión absoluta qué usuario realizó una modificación, qué campos cambiaron, la fecha, hora exacta, dirección IP, User Agent de conexión y el hash de verificación de la transacción.",
    steps: [
        {
            title: "Filtros de búsqueda y parametrización forense",
            description: "Utiliza el panel de búsqueda superior para filtrar las transacciones. Puedes acotar los registros por módulo específico del sistema (por ejemplo: Proyectos, Usuarios, Finanzas), acción ejecutada (Inserción, Actualización, Eliminación), rango de fechas con marcas de tiempo y el identificador único del usuario operante.",
            highlight: 'content-top'
        },
        {
            title: "Inspección de diferencias estructuradas (Diff)",
            description: "Haz clic en cualquier registro de la bitácora para desplegar el visor de diferencias comparativo. El sistema mostrará un análisis de campos estructurado, indicando el estado del registro 'Antes' de la modificación (en color rojo/negativo) y el estado del registro 'Después' de la modificación (en color verde/positivo) en formato JSON.",
            highlight: 'content-bottom'
        },
        {
            title: "Exportación certificada de reportes y firmas criptográficas",
            description: "Utiliza el botón 'Exportar Reporte' para generar un archivo Excel certificado digitalmente. Este archivo incluye todas las columnas de auditoría técnica y se encuentra firmado con el hash SHA-256 del servidor de base de datos, garantizando que los registros no han sido alterados manualmente desde su creación.",
            highlight: 'content-top'
        }
    ],
    compliance: "Garantiza el cumplimiento estricto de los estándares internacionales de seguridad y la normativa de inmutabilidad de la información exigida en los procesos de auditoría tecnológica y licenciamiento del CACES y entes reguladores de protección de datos (LOPDP).",
    tips: [
        "Puedes copiar directamente el fragmento JSON del Diff de cambios con el botón de copiado rápido en el panel lateral para compartirlo con el equipo de soporte técnico en caso de auditorías externas.",
        "Los registros de eliminación de borradores de proyectos guardan el contenido completo del protocolo para permitir su recuperación rápida en caso de incidentes."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Filters Area */}
            <div className={`rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[4px] text-text-dim uppercase font-mono tracking-wider font-semibold">Seguridad e Integridad</span>
                        <span className="text-[7px] text-text-main font-bold">Bitácora de Auditoría Forense</span>
                    </div>
                    <div className="px-1.5 py-0.5 bg-text-main/10 border border-border-thin text-text-main rounded text-[5px] font-bold flex items-center gap-0.5">
                        📥 Exportar Reporte <span className="text-[3.5px] text-text-dim font-mono">(SHA-256)</span>
                    </div>
                </div>
                <div className="flex gap-1 text-[4.5px]">
                    <div className="flex-1 h-3.5 bg-surface-hover/20 border border-border-thin rounded-md px-1 flex items-center justify-between text-text-dim">
                        <span>Filtro: Todos los módulos</span>
                        <span>▼</span>
                    </div>
                    <div className="w-18 h-3.5 bg-surface-hover/20 border border-border-thin rounded-md px-1 flex items-center justify-between text-text-dim">
                        <span>Rango: Hoy</span>
                        <span>▼</span>
                    </div>
                </div>
            </div>

            {/* Split Workspace Layout */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left side: Forensic Logs Table */}
                <div className={`flex-[1.8] rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <table className="w-full text-left border-collapse text-[4px]">
                        <thead>
                            <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                                <th className="pb-1 font-bold">Fecha / IP</th>
                                <th className="pb-1 font-bold">Usuario</th>
                                <th className="pb-1 font-bold">Módulo</th>
                                <th className="pb-1 font-bold">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin/30">
                            <tr className="bg-surface-hover/10">
                                <td className="py-1 font-mono">
                                    <span className="text-text-main font-semibold block leading-none">08:24:12</span>
                                    <span className="text-[3.5px] text-text-dim">192.168.10.45</span>
                                </td>
                                <td className="py-1">
                                    <span className="text-text-main font-semibold block leading-none">jdoicela</span>
                                    <span className="text-[3.5px] text-text-dim font-mono">ID: 408</span>
                                </td>
                                <td className="py-1 text-text-dim">Proyectos</td>
                                <td className="py-1">
                                    <span className="px-1 py-0.2 bg-warning/10 border border-warning/20 text-warning rounded-[2px] text-[3.5px] font-semibold">
                                        UPDATE
                                    </span>
                                </td>
                            </tr>
                            <tr className="hover:bg-surface/30">
                                <td className="py-1 font-mono">
                                    <span className="text-text-main font-semibold block leading-none">08:21:05</span>
                                    <span className="text-[3.5px] text-text-dim">192.168.10.45</span>
                                </td>
                                <td className="py-1">
                                    <span className="text-text-main font-semibold block leading-none">jdoicela</span>
                                    <span className="text-[3.5px] text-text-dim font-mono">ID: 408</span>
                                </td>
                                <td className="py-1 text-text-dim">Firmas</td>
                                <td className="py-1">
                                    <span className="px-1 py-0.2 bg-success/10 border border-success/20 text-success rounded-[2px] text-[3.5px] font-semibold">
                                        INSERT
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Right side: JSON Diff Viewer */}
                <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 bg-bg-deep/80 ${highlightBottomClass}`}>
                    <span className="text-[4px] font-bold text-text-main uppercase block border-b border-border-thin/40 pb-0.5">Visor de Cambios (JSON Diff)</span>
                    <div className="flex-1 font-mono text-[3.5px] leading-tight overflow-y-auto space-y-0.5">
                        <div className="text-text-dim">{"{"}</div>
                        <div className="pl-1.5 text-text-dim">"id": 104,</div>
                        <div className="pl-1.5 text-text-dim">"codigo": "PROY-001",</div>
                        <div className="pl-1.5 bg-error/15 text-error-hover border-l border-error block w-full px-0.5">
                            - "estado": "Borrador",
                        </div>
                        <div className="pl-1.5 bg-success/15 text-success-hover border-l border-success block w-full px-0.5">
                            + "estado": "Enviado",
                        </div>
                        <div className="pl-1.5 text-text-dim">"updatedAt": "2026-06-05"</div>
                        <div className="text-text-dim">{"}"}</div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const CONFIGURACION_CONFIG: HelpConfig = {
    icon: <Settings2 size={24} className="text-brand" />,
    title: "Parámetros Normativos",
    summary: "Panel de control para la parametrización de catálogos oficiales, ciclos académicos e indicadores del CACES.",
    description: "Módulo administrativo enfocado en la configuración global de los parámetros operativos de DIITRA. Permite a los directivos actualizar las líneas oficiales de investigación del instituto, dar mantenimiento a las ponderaciones de productos académicos, establecer períodos académicos de postulación y definir las metas anuales de los indicadores del CACES.",
    steps: [
        {
            title: "Catálogo de líneas y dominios de investigación",
            description: "Define, edita y administra el catálogo oficial de líneas y sublíneas de investigación alineadas con los dominios académicos aprobados por el Consejo de Educación Superior (CES) y la SENESCYT. Las nuevas propuestas de proyectos deberán alinearse de forma obligatoria a estas directrices para ser admitidas.",
            highlight: 'content-bottom'
        },
        {
            title: "Administración de periodos académicos y productos",
            description: "Abre o cierra los semestres de investigación del sistema. Configura los tipos de productos científicos admisibles (artículos en Scopus, Latindex, libros, capítulos de libros, patentes) indicando las evidencias digitales obligatorias para cada uno y su puntaje de peso relativo dentro del indicador institucional.",
            highlight: 'content-bottom'
        },
        {
            title: "Ponderaciones y metas cuantitativas del CACES",
            description: "Introduce las metas anuales exigidas por la normativa vigente para acreditar los indicadores institucionales (como la relación de horas del cuerpo académico, número mínimo de artículos indexados por docente). El módulo de Analíticas comparará los datos reales con estos parámetros definidos para medir el nivel de preparación institucional.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Estructura la base paramétrica e institucional de clasificación científica exigida por el CES, la SENESCYT y los entes de acreditación nacional para los reportes oficiales anuales de producción de educación superior.",
    tips: [
        "Desactivar una línea de investigación no afectará a los proyectos en curso que la utilicen, pero impedirá que nuevos investigadores la seleccionen en futuras convocatorias.",
        "Establece las fechas de cierre de periodos académicos con suficiente antelación para que el sistema envíe recordatorios automáticos de carga horaria a los docentes."
    ],
    Mockup: ({ highlightBottomClass }: MockupProps) => (
        <>
            {/* Header / Tabs */}
            <div className="flex gap-1 shrink-0 border-b border-border-thin">
                {['Líneas Inv.', 'Períodos', 'Metas CACES', 'Productos'].map((tab, idx) => (
                    <div 
                        key={idx} 
                        className={`px-2 py-0.5 rounded-t-md border-t border-x text-[5px] font-semibold cursor-pointer ${
                            idx === 2 
                                ? 'bg-surface border-border-thin text-brand border-b-transparent relative z-10 -mb-[1px]' 
                                : 'bg-surface-hover/10 border-border-thin/40 text-text-dim hover:text-text-main border-b-border-thin'
                        }`}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {/* Config Content / Catalog Table */}
            <div className={`flex-1 rounded-b-lg border-x border-b p-2 flex flex-col gap-1.5 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                <div className="flex justify-between items-center pb-1 border-b border-border-thin/40">
                    <span className="text-[6px] font-bold text-text-main">Ponderaciones y Metas del CACES</span>
                    <span className="text-[4px] text-text-dim font-mono">Modelo 2026</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {/* Catalog Item 1 */}
                    <div className="border border-border-thin rounded-md p-1 bg-surface flex justify-between items-center hover:border-brand/40">
                        <div className="space-y-0.5">
                            <span className="text-[5.5px] font-semibold text-text-main block">B.1.2 Relación Artículos / Docente FTE</span>
                            <span className="text-[3.5px] text-text-dim uppercase font-mono">Meta Anual: 0.50 Artículos/Docente</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="text-right">
                                <span className="text-[5px] font-bold text-text-main block">0.48 / 0.50</span>
                                <span className="text-[3px] text-warning font-mono">96% del objetivo</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                        </div>
                    </div>
                    {/* Catalog Item 2 */}
                    <div className="border border-border-thin rounded-md p-1 bg-surface flex justify-between items-center hover:border-brand/40">
                        <div className="space-y-0.5">
                            <span className="text-[5.5px] font-semibold text-text-main block">B.1.1 Presupuesto de Investigación</span>
                            <span className="text-[3.5px] text-text-dim uppercase font-mono">Meta Anual: 6.00% del Presupuesto</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="text-right">
                                <span className="text-[5px] font-bold text-text-main block">6.25% / 6.00%</span>
                                <span className="text-[3px] text-success font-mono">Meta cumplida</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const EMAILS_CONFIG: HelpConfig = {
    icon: <Mail size={24} className="text-brand" />,
    title: "Motor de Plantillas y Correos",
    summary: "Consola de administración para la edición de plantillas de correo electrónico transaccionales y notificaciones del sistema.",
    description: "Módulo exclusivo para administradores diseñado para configurar y parametrizar los correos electrónicos que el sistema envía de forma automatizada (alertas de firma, invitaciones de arbitraje, recordatorios de hitos y credenciales de usuarios).",
    steps: [
        {
            title: "Selección y edición de plantillas dinámicas",
            description: "Navega por el catálogo de plantillas de correo categorizadas por módulo. Puedes editar el contenido HTML utilizando variables dinámicas del sistema como el nombre del docente, título del proyecto o enlace de firma.",
            highlight: 'content-bottom'
        },
        {
            title: "Configuración de SMTP y envío de prueba",
            description: "Administra los parámetros de conexión con el servidor de correo institucional y realiza pruebas de entrega en tiempo real para verificar la correcta visualización del diseño y etiquetas.",
            highlight: 'content-top'
        }
    ],
    compliance: "Garantiza la formalidad de la comunicación institucional y el debido proceso administrativo en las notificaciones del ciclo de vida de los proyectos de investigación científica.",
    tips: [
        "Utiliza las variables dinámicas entre llaves dobles (ej. {{nombre_usuario}}) con precaución para no alterar la estructura de datos del renderizador.",
        "Siempre realiza un envío de prueba a tu dirección de correo antes de guardar y aplicar cambios globales en una plantilla activa."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & SMTP Test Controls */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[4px] text-brand uppercase font-mono tracking-wider font-semibold">Notificaciones</span>
                    <span className="text-[7px] text-text-main font-bold">Motor de Plantillas Transaccionales</span>
                </div>
                <div className="flex gap-1">
                    <div className="px-1.5 py-0.5 bg-brand text-white rounded text-[5px] font-bold shadow-sm">
                        ⚡ Probar SMTP
                    </div>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left side: Templates List */}
                <div className={`flex-[1.2] rounded-lg border p-1 flex flex-col gap-1 transition-all duration-300 bg-surface-hover/10 min-h-0 ${highlightBottomClass}`}>
                    <span className="text-[4.5px] font-bold text-text-main uppercase block border-b border-border-thin/40 pb-0.5">Plantillas</span>
                    <div className="space-y-0.5 overflow-y-auto pr-0.5">
                        <div className="p-0.5 border border-brand bg-surface rounded-[3px] text-[4px] leading-tight font-semibold text-brand">
                            📧 inv_evaluacion
                        </div>
                        <div className="p-0.5 border border-border-thin/40 bg-surface/40 rounded-[3px] text-[4px] leading-tight text-text-dim">
                            📧 firma_pendiente
                        </div>
                        <div className="p-0.5 border border-border-thin/40 bg-surface/40 rounded-[3px] text-[4px] leading-tight text-text-dim">
                            📧 proyecto_devuelto
                        </div>
                    </div>
                </div>

                {/* Right side: HTML / Variables Code Editor */}
                <div className={`flex-[2] rounded-lg border p-1 flex flex-col gap-1 bg-bg-deep transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <div className="border-b border-border-thin/40 pb-1 flex justify-between items-center">
                        <span className="text-[3.5px] font-mono text-text-dim">Asunto: Invitación a Evaluar - DIITRA</span>
                        <span className="text-[3.5px] text-success font-mono font-bold">✓ HTML Válido</span>
                    </div>
                    {/* Code editor pane */}
                    <div className="flex-1 font-mono text-[3.5px] leading-normal text-text-dim overflow-y-auto bg-surface/40 rounded p-1 space-y-0.5">
                        <div><span className="text-text-main">1</span> &lt;<span className="text-brand">p</span>&gt;Estimado(a) {"{"}{"{"}nombre{"}"}{"}"},&lt;/<span className="text-brand">p</span>&gt;</div>
                        <div><span className="text-text-main">2</span> &lt;<span className="text-brand">p</span>&gt;Ha sido designado(a) para evaluar el proyecto: &lt;/<span className="text-brand">p</span>&gt;</div>
                        <div><span className="text-text-main">3</span> &lt;<span className="text-brand">strong</span>&gt;&lt;<span className="text-brand">em</span>&gt;{"{"}{"{"}titulo_proyecto{"}"}{"}"}&lt;/<span className="text-brand">em</span>&gt;&lt;/<span className="text-brand">strong</span>&gt;</div>
                        <div><span className="text-text-main">4</span> &lt;<span className="text-brand">br</span> /&gt;</div>
                        <div><span className="text-text-main">5</span> &lt;<span className="text-brand">a</span> <span className="text-success">href</span>="{"{"}{"{"}url_evaluacion{"}"}{"}"}"&gt;Ir al Portal&lt;/<span className="text-brand">a</span>&gt;</div>
                    </div>
                    {/* Editor Action footer */}
                    <div className="flex justify-between items-center border-t border-border-thin/40 pt-1 text-[3.5px]">
                        <span className="text-text-dim">Variables: 3 detectadas</span>
                        <button className="px-1 py-0.2 bg-success text-white font-bold rounded-[2px]">Guardar</button>
                    </div>
                </div>
            </div>
        </>
    )
};

export const GRUPOS_CONFIG: HelpConfig = {
    icon: <Award size={24} className="text-brand" />,
    title: "Grupos de Investigación",
    summary: "Registro institucional, estructura colaborativa y proyectos de los grupos de investigación oficiales.",
    description: "Panel para la postulación, formalización y seguimiento de los grupos de investigación de la institución. Permite a los directores y coordinadores registrar líneas de investigación grupales, integrar miembros docentes y estudiantes, y reportar la producción colectiva.",
    steps: [
        {
            title: "Directorio y visualización de grupos activos",
            description: "Explora la lista completa de grupos de investigación aprobados por el consejo científico. Revisa sus líneas de acción, miembros activos y la producción científica acumulada durante el ciclo.",
            highlight: 'content-bottom'
        },
        {
            title: "Creación y postulación de nuevo grupo",
            description: "Inicia una solicitud para la creación de un nuevo grupo de investigación completando los campos de justificación académica, plan de trabajo bienal, líneas de investigación institucionales y presupuesto estimado.",
            highlight: 'content-top'
        },
        {
            title: "Gestión de miembros y roles del grupo",
            description: "Configura el equipo de trabajo asignando el rol de Director de Grupo, Co-investigadores docentes o estudiantes colaboradores de semilleros para fortalecer el indicador de investigación formativa.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Mapea el Criterio B.1.2 del CACES sobre fomento a la investigación formativa y asociatividad científica, promoviendo la consolidación de redes de investigación internas y externas.",
    tips: [
        "Asegúrate de incluir al menos un estudiante colaborador para cumplir con los requerimientos institucionales de semilleros de investigación.",
        "Actualiza el plan de trabajo bienal de tu grupo para evitar el estado de inactividad temporal en el sistema."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Controls Area */}
            <div className={`rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[4px] text-text-dim uppercase font-mono tracking-wider font-semibold">Investigación y Desarrollo</span>
                        <span className="text-[7px] text-text-main font-bold">Grupos de Investigación</span>
                    </div>
                    <div className="px-1.5 py-0.5 bg-brand text-white rounded text-[5px] font-bold">
                        + Proponer Grupo
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="flex-1 h-3.5 bg-surface-hover/20 border border-border-thin rounded-md px-1 flex items-center gap-1 text-[5px] text-text-dim">
                        🔍 <span className="truncate">Buscar grupos por nombre, siglas...</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                <table className="w-full text-left border-collapse text-[4.5px]">
                    <thead>
                        <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                            <th className="pb-1 font-bold">Grupo</th>
                            <th className="pb-1 font-bold">Coordinador</th>
                            <th className="pb-1 font-bold">Vinculación</th>
                            <th className="pb-1 font-bold">Estado</th>
                            <th className="pb-1 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin/30">
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Grupo de Computación Ubicua</span>
                                <span className="text-[3.5px] font-mono text-text-dim font-bold bg-bg-deep px-0.5 rounded border border-border-thin/40">GCU</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Dr. Juan Pérez</span>
                                <span className="text-[3.5px] text-text-dim uppercase font-semibold">Sistemas</span>
                            </td>
                            <td className="py-1 text-text-dim leading-normal font-mono">
                                <div>2 Líneas Inv.</div>
                                <div>3 Carreras</div>
                            </td>
                            <td className="py-1">
                                <div className="flex flex-col gap-0.5 items-start">
                                    <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded-[2px] text-[3.5px] font-semibold flex items-center gap-0.5">
                                        ● Aprobado
                                    </span>
                                    <span className="text-[3px] text-success uppercase tracking-wider font-mono">● Vigente</span>
                                </div>
                            </td>
                            <td className="py-1 text-right">
                                <span className="text-text-dim font-mono">👁 ⚙ 🗑</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Grupo de Energía Sostenible</span>
                                <span className="text-[3.5px] font-mono text-text-dim font-bold bg-bg-deep px-0.5 rounded border border-border-thin/40">GES</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Mgs. Ana Gomez</span>
                                <span className="text-[3.5px] text-text-dim uppercase font-semibold">Electricidad</span>
                            </td>
                            <td className="py-1 text-text-dim leading-normal font-mono">
                                <div>1 Líneas Inv.</div>
                                <div>2 Carreras</div>
                            </td>
                            <td className="py-1">
                                <div className="flex flex-col gap-0.5 items-start">
                                    <span className="px-1 py-0.2 bg-warning/15 border border-warning/35 text-warning rounded-[2px] text-[3.5px] font-semibold flex items-center gap-0.5">
                                        ● Pendiente
                                    </span>
                                    <span className="text-[3px] text-text-dim/60 uppercase tracking-wider font-mono">● Inactivo</span>
                                </div>
                            </td>
                            <td className="py-1 text-right">
                                <span className="text-text-dim font-mono">👁 ⚙ 🗑</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
};
