using Diitra.Domain.Common.Documents;
using System.Collections.Generic;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Catálogo de plantillas institucionales precargadas.
    /// Estas plantillas son el PUNTO DE PARTIDA. El administrador del instituto puede
    /// editarlas desde el panel DIITRA sin necesidad de programar ni redesplegar.
    /// 
    /// Variables disponibles en todas las plantillas (inyectadas automáticamente):
    ///   {{ fecha_emision }}        → "06 de mayo de 2026"
    ///   {{ fecha_emision_corta }}  → "06/05/2026"
    ///   {{ hora_emision }}         → "14:30"
    ///   {{ ciudad }}               → "Quito"
    ///   {{ pais }}                 → "Ecuador"
    ///   {{ es_doble_ciego }}       → true/false
    /// </summary>
    public static class DocumentTemplateSeed
    {
        public static DocumentTemplate? GetByCode(string code) => 
            GetSeedTemplates().FirstOrDefault(t => t.Code == code);

        public static IEnumerable<DocumentTemplate> GetSeedTemplates()
        {
            yield return DocumentTemplate.Create(
                code: "PROTOCOLO_INVESTIGACION",
                name: "Protocolo de Proyecto de Investigación",
                description: "Documento oficial para postulación de proyectos I+D+i. Incluye todas las secciones exigidas por el Reglamento del CES.",
                category: DocumentCategory.Protocolo,
                htmlContent: GetProtocoloHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"antecedentes\", \"justificacion\", \"objetivos\", \"metodologia\", \"marco_teorico\"]",
                version: 3);

            yield return DocumentTemplate.Create(
                code: "ACTA_APROBACION_PROYECTO",
                name: "Acta de Aprobación de Proyecto",
                description: "Resolución oficial del Comité de Investigación aprobando el proyecto. Genera el código institucional.",
                category: DocumentCategory.ActaAprobacion,
                htmlContent: GetActaAprobacionHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);

            yield return DocumentTemplate.Create(
                code: "PROTOCOLO_PEER_REVIEW",
                name: "Protocolo de Investigación (Evaluación por Pares)",
                description: "Versión anonimizada del protocolo para el proceso de revisión doble ciego.",
                category: DocumentCategory.Protocolo,
                htmlContent: GetProtocoloHtml(),
                requiresLopdp: true,
                supportsBlind: true,
                requiresTraceability: true,
                requiresSignature: false,
                collaborativeFields: "[\"comentario_evaluador\"]");

            yield return DocumentTemplate.Create(
                code: "INFORME_AVANCE",
                name: "Informe de Avance de Investigación",
                description: "Reporte mensual/trimestral de progreso del proyecto. Incluye secciones de actividades, presupuesto ejecutado y evidencias.",
                category: DocumentCategory.InformeAvance,
                htmlContent: GetInformeAvanceHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true,
                collaborativeFields: "[\"resumen_actividades\", \"conclusiones_tecnicas\", \"recomendaciones\"]");

            yield return DocumentTemplate.Create(
                code: "CONSENTIMIENTO_INFORMADO",
                name: "Consentimiento Informado (LOPDP/CEISH)",
                description: "Formulario de consentimiento para investigación con participantes humanos. Cumple LOPDP y normas CEISH.",
                category: DocumentCategory.ConsentimientoInformado,
                htmlContent: GetConsentimientoInformadoHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: false);

            yield return DocumentTemplate.Create(
                code: "ACTA_SEMILLERO",
                name: "Acta de Conformación de Semillero de Investigación",
                description: "Documento oficial que formaliza la creación de un semillero y acredita la participación de estudiantes.",
                category: DocumentCategory.ActaConformacionSemillero,
                htmlContent: GetActaSemilleroHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);

            yield return DocumentTemplate.Create(
                code: "CERTIFICADO_PARTICIPACION",
                name: "Certificado de Participación en Investigación",
                description: "Certificado para docentes y estudiantes que participaron en proyectos de investigación. Válido para registro SENESCYT.",
                category: DocumentCategory.CertificadoParticipacion,
                htmlContent: GetCertificadoParticipacionHtml(),
                requiresLopdp: false,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);

            yield return DocumentTemplate.Create(
                code: "CESION_DERECHOS_AUTOR",
                name: "Contrato de Cesión de Derechos de Autor (SENADI)",
                description: "Contrato legal para transferir derechos sobre obras intelectuales (artículos, libros, software) generadas en el instituto al SENADI.",
                category: DocumentCategory.CesionDerechos,
                htmlContent: GetCesionDerechosHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);

            yield return DocumentTemplate.Create(
                code: "TDR_COMPRAS",
                name: "Términos de Referencia (SERCOP)",
                description: "Documento técnico para procesos de contratación pública del presupuesto de investigación. Formato exigido por SERCOP.",
                category: DocumentCategory.TerminosDeReferencia,
                htmlContent: GetTdrHtml(),
                requiresLopdp: false,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);

            yield return DocumentTemplate.Create(
                code: "REPORTE_DISTRIBUTIVO",
                name: "Reporte Cruce Distributivo-Investigación",
                description: "Informe de validación de carga horaria del docente investigador vs. horas asignadas al proyecto. Exigido por el CACES.",
                category: DocumentCategory.ReporteDistributivoCruce,
                htmlContent: GetReporteDistributivoHtml(),
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: true);
        }

        // ────────────────────────────────────────────────────────────────
        // PLANTILLAS HTML BASE (editables desde el panel de administración)
        // ────────────────────────────────────────────────────────────────

        private static string GetProtocoloHtml() => @"
<div class=""doc-title"">PROTOCOLO DE PROYECTO DE INVESTIGACIÓN</div>
<div class=""doc-subtitle"">Convocatoria: {{default convocatoria 'No Especificada'}}</div>

<div class=""section-title"">1. Identificación General</div>
<table class=""info-table"">
    <tr><td>Código Institucional:</td><td>{{default codigo_institucional 'Por Asignar'}}</td></tr>
    <tr><td>Título del Proyecto:</td><td><strong>{{ titulo }}</strong></td></tr>
    <tr><td>Línea de Investigación:</td><td>{{default linea_investigacion 'N/A'}}</td></tr>
    <tr><td>Tipo de Investigación:</td><td>{{default tipo_investigacion 'N/A'}}</td></tr>
    <tr><td>ODS Asociado:</td><td>{{default ods 'N/A'}}</td></tr>
    <tr><td>Tiempo de Ejecución:</td><td>{{default tiempo_ejecucion 'N/A'}}</td></tr>
    <tr><td>Fecha de Registro:</td><td>{{ fecha_emision }}</td></tr>
</table>

<div class=""section-title"">2. Descripción Técnica</div>
<div class=""field-label"">Antecedentes:</div>
<div class=""text-field"">{{default antecedentes 'No proporcionado'}}</div>

<div class=""field-label"">Descripción del Proyecto:</div>
<div class=""text-field"">{{default descripcion_proyecto 'No proporcionado'}}</div>

<div class=""field-label"">Justificación:</div>
<div class=""text-field"">{{default justificacion 'No proporcionado'}}</div>

<div class=""section-title"">3. Fundamentación Científica</div>
<div class=""field-label"">Marco Teórico:</div>
<div class=""text-field"">{{default marco_teorico 'No proporcionado'}}</div>

<div class=""field-label"">Metodología:</div>
<div class=""text-field"">{{default metodologia 'No proporcionado'}}</div>

<div class=""section-title"">4. Firmas de Responsabilidad</div>
<div class=""firmas-row"">
    <table class=""firma-table"">
        <tr>
            <td class=""signature-box"">
                <div class=""firma-placeholder"">Espacio reservado para Firma Electrónica (FirmaEC)</div>
                <div class=""firma-line""></div>
                <div class=""firma-name"">{{ default nombre_investigador '[ NOMBRE DEL INVESTIGADOR ]' }}</div>
                <div class=""firma-role"">Docente Investigador Principal</div>
            </td>
            <td class=""signature-box"">
                <div class=""firma-placeholder"">Espacio reservado para Firma Electrónica (FirmaEC)</div>
                <div class=""firma-line""></div>
                <div class=""firma-name"">{{ default nombre_director '[ NOMBRE DEL DIRECTOR I+D+i ]' }}</div>
                <div class=""firma-role"">Director de Investigación e Innovación</div>
            </td>
        </tr>
    </table>
</div>";

        private static string GetActaAprobacionHtml() => @"
<div class=""doc-title"">ACTA DE APROBACIÓN DE PROYECTO DE INVESTIGACIÓN</div>
<div class=""doc-subtitle"">Resolución N.° {{default numero_resolucion 'DIITRA-RES-AUTOGENERADA'}}</div>

<p>En la ciudad de {{ ciudad }}, a los {{ fecha_emision }}, reunido el Comité Institucional de Investigación e Innovación, 
<strong>RESUELVE:</strong></p>

<div class=""section-title"">1. Datos del Proyecto Aprobado</div>
<table class=""info-table"">
    <tr><td>Código Institucional:</td><td><strong>{{ codigo_institucional }}</strong></td></tr>
    <tr><td>Título:</td><td>{{ titulo }}</td></tr>
    <tr><td>Investigador Principal:</td><td>{{ nombre_investigador }}</td></tr>
    <tr><td>Puntaje de Evaluación:</td><td>{{default puntaje_evaluacion 'N/A'}} / 100</td></tr>
    <tr><td>Fecha de Inicio:</td><td>{{default fecha_inicio 'Por definir'}}</td></tr>
    <tr><td>Fecha de Fin:</td><td>{{default fecha_fin 'Por definir'}}</td></tr>
    <tr><td>Presupuesto Aprobado:</td><td>$ {{default presupuesto_aprobado '0.00'}}</td></tr>
</table>

<div class=""section-title"">2. Resolución</div>
<p>El Comité APRUEBA el proyecto descrito, asignando el código institucional indicado y autorizando la 
ejecución según el cronograma presentado. El investigador queda comprometido a presentar informes de 
avance según el Reglamento de Régimen Académico del CES.</p>

<div class=""section-title"">3. Firmas del Comité</div>
<div class=""firmas-row"">
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
        <div class=""firma-name"">{{default nombre_director '____________________________'}}</div>
        <div class=""firma-role"">Director de Investigación e Innovación</div>
    </div>
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
        <div class=""firma-name"">{{default nombre_rector '____________________________'}}</div>
        <div class=""firma-role"">Rector / Vicerrector Académico</div>
    </div>
</div>";

        private static string GetInformeAvanceHtml() => @"
<div class=""doc-title"">INFORME DE AVANCE DE INVESTIGACIÓN</div>
<div class=""doc-subtitle"">Período: {{default periodo 'No especificado'}} — Corte: {{ fecha_emision }}</div>

<div class=""section-title"">1. Identificación</div>
<table class=""info-table"">
    <tr><td>Código del Proyecto:</td><td>{{ codigo_institucional }}</td></tr>
    <tr><td>Título:</td><td>{{ titulo }}</td></tr>
    <tr><td>Investigador:</td><td>{{ nombre_investigador }}</td></tr>
    <tr><td>N.° de Informe:</td><td>{{default numero_informe '1'}}</td></tr>
</table>

<div class=""section-title"">2. Actividades Ejecutadas</div>
<div class=""text-field"">{{default actividades_ejecutadas 'Sin información registrada.'}}</div>

<div class=""section-title"">3. Ejecución Presupuestaria</div>
<table class=""data-table"">
    <thead><tr><th>Rubro</th><th>Presupuesto</th><th>Ejecutado</th><th>Saldo</th></tr></thead>
    <tbody>
        <tr><td>Total del Período</td><td>$ {{default presupuesto_periodo '0.00'}}</td><td>$ {{default ejecutado_periodo '0.00'}}</td><td>$ {{default saldo_periodo '0.00'}}</td></tr>
    </tbody>
</table>

<div class=""section-title"">4. Problemas y Ajustes Solicitados</div>
<div class=""text-field"">{{default problemas_ajustes 'Sin novedades.'}}</div>

<div class=""section-title"">5. Firma del Investigador</div>
<div class=""firma-ec-block"" style=""max-width:300px"">
    <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
    <div class=""firma-name"">{{ nombre_investigador }}</div>
    <div class=""firma-role"">Investigador Principal</div>
</div>";

        private static string GetConsentimientoInformadoHtml() => @"
<div class=""doc-title"">FORMULARIO DE CONSENTIMIENTO INFORMADO</div>
<div class=""doc-subtitle"">Investigación con Participantes Humanos — Cumplimiento CEISH y LOPDP</div>

<p>Yo, <strong>______________________________________</strong>, con cédula de identidad 
<strong>_____________________</strong>, en pleno uso de mis facultades, declaro:</p>

<div class=""section-title"">1. Información del Estudio</div>
<table class=""info-table"">
    <tr><td>Título del Estudio:</td><td>{{ titulo }}</td></tr>
    <tr><td>Investigador Principal:</td><td>{{ nombre_investigador }}</td></tr>
    <tr><td>Institución:</td><td>Instituto Superior Tecnológico — DIITRA</td></tr>
</table>

<div class=""field-label"">Propósito y Procedimientos:</div>
<div class=""text-field"">{{default descripcion_estudio 'Ver hoja adjunta de información al participante.'}}</div>

<div class=""section-title"">3. Declaración de Consentimiento (LOPDP)</div>
<p>Conforme a la <strong>Ley Orgánica de Protección de Datos Personales (R.O. N.° 459, 26/05/2021)</strong>, 
consiento voluntariamente en participar en esta investigación y autorizo el tratamiento de mis datos personales 
<strong>exclusivamente</strong> para los fines descritos. Entiendo que puedo retirar mi consentimiento en 
cualquier momento sin perjuicio alguno.</p>

<div style=""margin-top:40px; display:flex; gap:40px;"">
    <div style=""flex:1; text-align:center;"">
        <div style=""border-top:1px solid #333; padding-top:5px;"">Firma del Participante</div>
        <div style=""font-size:8pt; color:#666;"">C.I.: _____________________</div>
    </div>
    <div style=""flex:1; text-align:center;"">
        <div style=""border-top:1px solid #333; padding-top:5px;"">Firma del Investigador</div>
        <div style=""font-size:8pt; color:#666;"">{{ nombre_investigador }}</div>
    </div>
</div>";

        private static string GetActaSemilleroHtml() => @"
<div class=""doc-title"">ACTA DE CONFORMACIÓN DE SEMILLERO DE INVESTIGACIÓN</div>
<div class=""doc-subtitle"">{{ nombre_semillero | default: 'Semillero de Investigación' }}</div>

<p>En la ciudad de {{ ciudad }}, el día {{ fecha_emision }}, el Departamento de Investigación e Innovación 
CERTIFICA la conformación oficial del semillero:</p>

<div class=""section-title"">1. Datos del Semillero</div>
<table class=""info-table"">
    <tr><td>Nombre del Semillero:</td><td>{{ nombre_semillero }}</td></tr>
    <tr><td>Línea de Investigación:</td><td>{{default linea_investigacion 'N/A'}}</td></tr>
    <tr><td>Docente Tutor:</td><td>{{ nombre_tutor }}</td></tr>
    <tr><td>Proyecto Vinculado:</td><td>{{default codigo_proyecto 'Sin proyecto asignado'}}</td></tr>
</table>

<div class=""section-title"">2. Integrantes</div>
<table class=""data-table"">
    <thead><tr><th>#</th><th>Nombres y Apellidos</th><th>Cédula</th><th>Carrera</th><th>Rol</th></tr></thead>
    <tbody>
        <tr><td colspan=""5"" style=""text-align:center;font-style:italic;"">Ver listado adjunto en sistema DIITRA (Código: {{default traceability_code 'N/A'}})</td></tr>
    </tbody>
</table>

<div class=""section-title"">3. Firmas</div>
<div class=""firmas-row"">
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
        <div class=""firma-name"">{{ nombre_tutor }}</div>
        <div class=""firma-role"">Docente Tutor del Semillero</div>
    </div>
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
        <div class=""firma-name"">{{ nombre_director }}</div>
        <div class=""firma-role"">Director de Investigación e Innovación</div>
    </div>
</div>";

        private static string GetCertificadoParticipacionHtml() => @"
<div class=""doc-title"">CERTIFICADO DE PARTICIPACIÓN EN INVESTIGACIÓN</div>
<div style=""text-align:center; font-size:9pt; color:#555; margin-bottom:20px;"">DIITRA — Departamento de Investigación e Innovación Traversari</div>

<p style=""text-align:center; font-size:11pt; margin:20px 0;"">EL DEPARTAMENTO DE INVESTIGACIÓN E INNOVACIÓN</p>
<p style=""text-align:center; font-size:10pt;""><strong>CERTIFICA</strong></p>
<p style=""text-align:justify; margin:15px 0;"">
    Que <strong>{{ nombre_participante }}</strong>, con cédula <strong>{{ cedula }}</strong>, 
    en calidad de <strong>{{default rol 'Investigador'}}</strong>, participó activamente 
    en el proyecto de investigación:
</p>

<div style=""background:#f0f4f8; padding:15px; text-align:center; margin:15px 0; border-left:4px solid #1a3a6b;"">
    <strong>{{ titulo }}</strong><br/>
    <span style=""font-size:9pt;"">Código: {{ codigo_institucional }} | Período: {{ periodo }}</span>
</div>

<p style=""text-align:justify;"">
    Aportando un total de <strong>{{default horas_participacion 'N/A'}} horas</strong> 
    de trabajo de investigación. El presente certificado es válido para los fines académicos 
    y profesionales que el portador estime convenientes.
</p>

<div class=""firma-ec-block"" style=""max-width:320px; margin:40px auto 0;"">
    <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
    <div class=""firma-name"">{{ nombre_director }}</div>
    <div class=""firma-role"">Director de Investigación e Innovación Traversari</div>
</div>";

        private static string GetCesionDerechosHtml() => @"
<div class=""doc-title"">CONTRATO DE CESIÓN DE DERECHOS PATRIMONIALES DE AUTOR</div>
<div class=""doc-subtitle"">Conforme a la Ley de Propiedad Intelectual y Normativa SENADI</div>

<p>Entre el <strong>Instituto Superior Tecnológico</strong> (CESIONARIO) y <strong>{{ nombre_autor }}</strong>, 
C.I. {{ cedula_autor }} (CEDENTE), se suscribe el presente contrato:</p>

<div class=""section-title"">1. Objeto de la Cesión</div>
<table class=""info-table"">
    <tr><td>Tipo de Obra:</td><td>{{default tipo_obra 'Artículo Científico'}}</td></tr>
    <tr><td>Título de la Obra:</td><td>{{ titulo_obra }}</td></tr>
    <tr><td>ISBN/ISSN:</td><td>{{default isbn_issn 'Pendiente de asignación'}}</td></tr>
    <tr><td>Proyecto de Origen:</td><td>{{ codigo_proyecto }}</td></tr>
</table>

<div class=""section-title"">2. Alcance de la Cesión</div>
<p>El CEDENTE transfiere al CESIONARIO los derechos patrimoniales de reproducción, distribución y 
comunicación pública de la obra, para fines académicos e institucionales, sin perjuicio de los 
derechos morales irrenunciables del autor conforme al Código Orgánico de la Economía Social del 
Conocimiento, Creatividad e Innovación (INGENIOS).</p>

<div class=""firmas-row"" style=""margin-top:30px;"">
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma del Cedente (FirmaEC)</div>
        <div class=""firma-name"">{{ nombre_autor }}</div>
        <div class=""firma-role"">C.I.: {{ cedula_autor }}</div>
    </div>
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Firma del Cesionario (FirmaEC)</div>
        <div class=""firma-name"">{{ nombre_rector }}</div>
        <div class=""firma-role"">Representante Legal de la Institución</div>
    </div>
</div>";

        private static string GetTdrHtml() => @"
<div class=""doc-title"">TÉRMINOS DE REFERENCIA</div>
<div class=""doc-subtitle"">Proceso de Contratación Pública — SERCOP</div>

<div class=""section-title"">1. Datos del Proceso</div>
<table class=""info-table"">
    <tr><td>Proyecto de Investigación:</td><td>{{ codigo_institucional }} — {{ titulo }}</td></tr>
    <tr><td>Tipo de Contratación:</td><td>{{default tipo_contratacion 'Ínfima Cuantía'}}</td></tr>
    <tr><td>Monto Estimado:</td><td>$ {{default monto_estimado '0.00'}}</td></tr>
    <tr><td>Partida Presupuestaria:</td><td>{{default partida_presupuestaria 'Ver POA Institucional'}}</td></tr>
</table>

<div class=""section-title"">2. Objeto de la Contratación</div>
<div class=""text-field"">{{default objeto_contratacion 'No especificado'}}</div>

<div class=""section-title"">3. Especificaciones Técnicas Mínimas</div>
<div class=""text-field"">{{default especificaciones_tecnicas 'Ver Anexo Técnico'}}</div>

<div class=""section-title"">4. Forma de Pago y Obligaciones</div>
<div class=""text-field"">{{default condiciones_pago 'Conforme al Reglamento de Contratación Pública vigente.'}}</div>

<div class=""firma-ec-block"" style=""max-width:300px; margin-top:30px;"">
    <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
    <div class=""firma-name"">{{ nombre_director }}</div>
    <div class=""firma-role"">Director de Investigación — Administrador del Contrato</div>
</div>";

        private static string GetReporteDistributivoHtml() => @"
<div class=""doc-title"">REPORTE DE CRUCE DISTRIBUTIVO — INVESTIGACIÓN</div>
<div class=""doc-subtitle"">Validación de Carga Horaria conforme al RRA — Exigencia CACES Criterio: Investigación</div>

<div class=""section-title"">1. Datos del Período Académico</div>
<table class=""info-table"">
    <tr><td>Período Académico:</td><td>{{ periodo_academico }}</td></tr>
    <tr><td>Fecha de Corte:</td><td>{{ fecha_emision }}</td></tr>
</table>

<div class=""section-title"">2. Matriz de Cruce Horario</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th>Docente</th>
            <th>Cédula</th>
            <th>Horas Distrib. (Total)</th>
            <th>Horas Investigación (Asignadas)</th>
            <th>Proyectos Activos</th>
            <th>Estado</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td colspan=""6"" style=""text-align:center; font-style:italic;"">
                Datos generados dinámicamente desde el sistema DIITRA.
                Ver reporte exportado con código: {{ fecha_emision_corta }}.
            </td>
        </tr>
    </tbody>
</table>

<div class=""field-label"">Observaciones:</div>
<div class=""text-field"">{{default observaciones 'Sin observaciones.'}}</div>

<div class=""firma-ec-block"" style=""max-width:300px; margin-top:30px;"">
    <div class=""firma-label"">Firma Electrónica (FirmaEC)</div>
    <div class=""firma-name"">{{ nombre_director }}</div>
    <div class=""firma-role"">Director de Investigación e Innovación</div>
</div>";
    }
}
