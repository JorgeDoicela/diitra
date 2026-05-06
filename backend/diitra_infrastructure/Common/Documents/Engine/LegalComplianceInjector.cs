using Diitra.Domain.Common.Documents;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Capa de Cumplimiento Legal.
    /// Intercepta la generación de documentos para aplicar obligaciones legales ecuatorianas.
    /// 
    /// Normativa aplicada:
    /// - LOPDP (Ley Orgánica de Protección de Datos Personales, RO 459, 2021)
    /// - Reglamento del CES para IST
    /// - Normas del CACES para evidencias de acreditación
    /// </summary>
    public class LegalComplianceInjector
    {
        // Cláusula LOPDP vigente (Registro Oficial No. 459, 26 de mayo de 2021)
        // Esta debe actualizarse desde la BD; este es el valor por defecto
        private const string DefaultLopdpClause =
            "Los datos personales contenidos en este documento son tratados bajo los principios de " +
            "licitud, lealtad y transparencia, conforme a la Ley Orgánica de Protección de Datos Personales " +
            "(R.O. N.° 459, 26/05/2021) y su reglamento. El responsable del tratamiento es la institución " +
            "emisora. Para ejercer sus derechos ARCO, diríjase al Delegado de Protección de Datos.";

        /// <summary>
        /// Enriquece el HTML generado con los elementos legales obligatorios:
        /// Pie de página con LOPDP, código de trazabilidad, y marcas de modo doble ciego.
        /// </summary>
        public string InjectLegalFooter(
            string renderedHtml,
            DocumentTemplate template,
            string traceabilityCode,
            bool isBlindMode,
            string? customLopdpClause = null)
        {
            var legalSections = new System.Text.StringBuilder();

            // 1. Aviso de modo doble ciego (si aplica)
            if (isBlindMode && template.SupportsBlindMode)
            {
                legalSections.AppendLine(@"
                <div class=""blind-mode-notice"">
                    ⚠️ DOCUMENTO ANONIMIZADO — Proceso de Evaluación Doble Ciego (Art. 10, Reglamento de Régimen Académico CES).<br/>
                    Los datos de identidad han sido suprimidos para garantizar la imparcialidad de la revisión.
                </div>");
            }

            // 2. Pie de página legal
            var lopdpText = customLopdpClause ?? DefaultLopdpClause;

            var footer = $@"
            <div class=""legal-footer"">
                <div class=""traceability-block"">
                    <div>
                        <span class=""trace-code"">Código de Verificación: <strong>{traceabilityCode}</strong></span>
                        &nbsp;|&nbsp;
                        <span class=""trace-code"">Versión de Plantilla: v{template.Version}</span>
                        &nbsp;|&nbsp;
                        <span class=""trace-code"">Categoría: {GetCategoryLabel(template.Category)}</span>
                    </div>
                    <div class=""trace-code"">
                        Generado por DIITRA · {DateTime.Now:dd/MM/yyyy HH:mm} UTC-5 (Quito, Ecuador)
                    </div>
                </div>";

            if (template.RequiresLopdpClause)
            {
                footer += $@"
                <div class=""lopdp-clause"">
                    <strong>Protección de Datos:</strong> {lopdpText}
                </div>";
            }

            if (template.RequiresElectronicSignature)
            {
                footer += @"
                <div class=""lopdp-clause"" style=""margin-top:4px"">
                    Este documento admite firma electrónica reconocida conforme a la Ley de Comercio 
                    Electrónico, Firmas y Mensajes de Datos (R.O. N.° 557-S, 17/04/2002) y la normativa 
                    de Entidades de Certificación (BCE/SECURITY DATA/ANF Ecuador).
                </div>";
            }

            footer += "</div>"; // cierra legal-footer

            // 3. Inyectar el aviso de doble ciego al inicio y el footer al final del body
            var result = renderedHtml;
            if (isBlindMode && template.SupportsBlindMode)
            {
                result = legalSections.ToString() + result;
            }

            return result + footer;
        }

        /// <summary>
        /// Genera el encabezado institucional DIITRA estandarizado.
        /// </summary>
        public string BuildInstitutionalHeader(string documentTitle, string documentSubtitle = "")
        {
            return $@"
            <div class=""diitra-header"">
                <div>
                    <div class=""inst-name"">Instituto Superior Tecnológico</div>
                    <div class=""inst-sub"">Departamento de Investigación e Innovación Traversari</div>
                    <div class=""inst-sub"">Sistema DIITRA · Quito, Ecuador</div>
                </div>
                <div class=""brand-block"">DIITRA</div>
            </div>
            <div class=""doc-title"">{documentTitle}</div>
            {(string.IsNullOrEmpty(documentSubtitle) ? "" : $@"<div class=""doc-subtitle"">{documentSubtitle}</div>")}";
        }

        private static string GetCategoryLabel(DocumentCategory category) => category switch
        {
            DocumentCategory.Protocolo => "Protocolo de Investigación",
            DocumentCategory.ActaAprobacion => "Acta de Aprobación",
            DocumentCategory.InformeAvance => "Informe de Avance",
            DocumentCategory.InformeFinal => "Informe Final",
            DocumentCategory.ActaLiquidacion => "Acta de Liquidación",
            DocumentCategory.TerminosDeReferencia => "Términos de Referencia (SERCOP)",
            DocumentCategory.EspecificacionTecnica => "Especificación Técnica (SERCOP)",
            DocumentCategory.CertificacionPresupuestaria => "Certificación Presupuestaria",
            DocumentCategory.ActaRecepcion => "Acta de Recepción a Satisfacción",
            DocumentCategory.ProtocoloBioetico => "Protocolo Bioético (CEISH)",
            DocumentCategory.ConsentimientoInformado => "Consentimiento Informado (LOPDP)",
            DocumentCategory.ActaExencion => "Acta de Exención Ética",
            DocumentCategory.CesionDerechos => "Contrato de Cesión de Derechos (SENADI)",
            DocumentCategory.SolicitudRegistroSoftware => "Solicitud de Registro de Software (SENADI)",
            DocumentCategory.ActaConformacionSemillero => "Acta de Conformación de Semillero",
            DocumentCategory.CertificadoParticipacion => "Certificado de Participación",
            DocumentCategory.ConvenioMarco => "Convenio Marco",
            DocumentCategory.ConvenioEspecifico => "Convenio Específico",
            DocumentCategory.MatrizIndicadoresCaces => "Matriz de Indicadores CACES",
            DocumentCategory.ReporteAnualSenescyt => "Reporte Anual SENESCYT",
            DocumentCategory.ReporteDistributivoCruce => "Reporte Distributivo-Investigación (RRA)",
            DocumentCategory.ResolucionCargaHoraria => "Resolución de Carga Horaria",
            DocumentCategory.CertificadoDocente => "Certificado de Docente-Investigador",
            _ => category.ToString()
        };
    }
}
