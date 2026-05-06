using Diitra.Application.Research.Dtos;
using Diitra.Infrastructure.Common.Documents;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Diitra.Infrastructure.Research.Documents
{
    /// <summary>
    /// ⚠️ OBSOLETO — Migrado al Motor Enterprise DIITRA.
    /// 
    /// Este archivo fue reemplazado por el sistema de plantillas dinámicas.
    /// El formato completo del Protocolo de Investigación (9 secciones SENESCYT/ISTPET)
    /// ahora vive en la tabla `doc_templates` con Code = "PROTOCOLO_INVESTIGACION".
    /// 
    /// Para generar el PDF, usar:
    ///   await _documentEngine.GenerateAsync(new DocumentRequest {
    ///       TemplateCode = "PROTOCOLO_INVESTIGACION",
    ///       Data = proyectoDto
    ///   });
    /// 
    /// Para editar el formato sin recompilar:
    ///   PUT /api/admin/templates/PROTOCOLO_INVESTIGACION
    /// 
    /// Este archivo se mantiene solo como referencia histórica.
    /// Puede eliminarse de forma segura en la siguiente limpieza de deuda técnica.
    /// </summary>
    [Obsolete("Migrado al Motor Enterprise DIITRA. Usar IDocumentEngine con TemplateCode='PROTOCOLO_INVESTIGACION'.")]
    public class ProjectDocumentTemplate : BaseInstitutionalTemplate
    {
        private readonly ProyectoDto _proyecto;

        public ProjectDocumentTemplate(ProyectoDto proyecto)
        {
            _proyecto = proyecto;
        }

        protected override string GetTitle() => "PROTOCOLO DE PROYECTO DE INVESTIGACIÓN";
        protected override string GetSubtitle() => _proyecto.Titulo?.ToUpper() ?? "PROYECTO SIN TÍTULO";

        public string GetDocumentName() => $"Proyecto_{_proyecto.CodigoInstitucional ?? _proyecto.Titulo}.pdf";

        public override void ComposeContent(IContainer container)
        {
            container.PaddingVertical(0.5f, Unit.Centimetre).Column(column =>
            {
                column.Spacing(15);

                // Sección 1: Datos Generales
                column.Item().Element(e => ComposeSectionTitle(e, "1. IDENTIFICACIÓN GENERAL"));
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(140);
                        columns.RelativeColumn();
                    });

                    AddTableRow(table, "CÓDIGO:", _proyecto.CodigoInstitucional ?? "PND-2026-XXX");
                    AddTableRow(table, "LÍNEA DE INV.:", _proyecto.LineaInvestigacion);
                    AddTableRow(table, "TIPO DE INV.:", _proyecto.TipoInvestigacion);
                    AddTableRow(table, "ODS ASOCIADO:", _proyecto.Ods);
                    AddTableRow(table, "TIEMPO ESTIMADO:", _proyecto.TiempoEjecucion);
                });

                // Sección 2: Resumen y Descripción
                column.Item().Element(e => ComposeSectionTitle(e, "2. DESCRIPCIÓN TÉCNICA"));
                column.Item().Column(c => 
                {
                    c.Spacing(10);
                    ComposeTextSection(c, "ANTECEDENTES", _proyecto.Antecedentes);
                    ComposeTextSection(c, "DESCRIPCIÓN DEL PROYECTO", _proyecto.DescripcionProyecto);
                    ComposeTextSection(c, "JUSTIFICACIÓN", _proyecto.Justificacion);
                });

                // Sección 3: Marco Teórico y Metodología
                column.Item().Element(e => ComposeSectionTitle(e, "3. FUNDAMENTACIÓN CIENTÍFICA"));
                column.Item().Column(c => 
                {
                    c.Spacing(10);
                    ComposeTextSection(c, "MARCO TEÓRICO", _proyecto.MarcoTeorico);
                    ComposeTextSection(c, "METODOLOGÍA", _proyecto.Metodologia);
                });

                // Sección 4: Firmas y Responsabilidades
                column.Item().PaddingTop(30).Row(row => 
                {
                    row.RelativeItem().Column(col => 
                    {
                        col.Item().PaddingBottom(40).AlignCenter().Text("_________________________").FontSize(10);
                        col.Item().AlignCenter().Text("DOCENTE INVESTIGADOR").SemiBold();
                        col.Item().AlignCenter().Text("Responsable Técnico").FontSize(8);
                    });
                    
                    row.ConstantItem(40);
                    
                    row.RelativeItem().Column(col => 
                    {
                        col.Item().PaddingBottom(40).AlignCenter().Text("_________________________").FontSize(10);
                        col.Item().AlignCenter().Text("DIRECTOR DE INVESTIGACIÓN").SemiBold();
                        col.Item().AlignCenter().Text("Validación Institucional").FontSize(8);
                    });
                });
            });
        }

        private void ComposeTextSection(ColumnDescriptor column, string title, string? content)
        {
            column.Item().Column(c => {
                c.Item().Text(title).SemiBold().FontSize(9).FontColor(Colors.Grey.Darken2);
                c.Item().Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(8).Text(content ?? "Información no proporcionada").FontSize(10).LineHeight(1.2f);
            });
        }
    }
}


