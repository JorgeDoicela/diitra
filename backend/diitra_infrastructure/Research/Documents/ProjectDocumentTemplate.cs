using Diitra.Application.Research.Dtos;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Diitra.Infrastructure.Research.Documents
{
    public class ProjectDocumentTemplate : IDocumentTemplate
    {
        private readonly ProyectoDto _proyecto;

        public ProjectDocumentTemplate(ProyectoDto proyecto)
        {
            _proyecto = proyecto;
        }

        public string GetDocumentName() => $"Proyecto_{_proyecto.CodigoInstitucional ?? _proyecto.Titulo}.pdf";

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(ComposeContent);
                    page.Footer().Element(ComposeFooter);
                });
        }

        private void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("PROYECTO DE INVESTIGACIÓN").FontSize(16).SemiBold().FontColor(Colors.Blue.Darken4).AlignCenter();
                    column.Item().Text(_proyecto.Titulo?.ToUpper()).FontSize(14).SemiBold().AlignCenter();
                    column.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });
            });
        }

        private void ComposeContent(IContainer container)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(20);

                // Sección 1: Identificación
                column.Item().Text("1. IDENTIFICACIÓN DEL PROYECTO").FontSize(12).SemiBold().FontColor(Colors.Blue.Darken4);
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(150);
                        columns.RelativeColumn();
                    });

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("NOMBRE DEL PROYECTO:");
                    table.Cell().Border(1).Padding(5).Text(_proyecto.Titulo);

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("LÍNEA DE INVESTIGACIÓN:");
                    table.Cell().Border(1).Padding(5).Text(_proyecto.LineaInvestigacion ?? "No seleccionada");

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("TIPO DE INVESTIGACIÓN:");
                    table.Cell().Border(1).Padding(5).Text(_proyecto.TipoInvestigacion ?? "No seleccionada");

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("ODS RELACIONADO:");
                    table.Cell().Border(1).Padding(5).Text(_proyecto.Ods ?? "No seleccionado");

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("TIEMPO DE EJECUCIÓN:");
                    table.Cell().Border(1).Padding(5).Text(_proyecto.TiempoEjecucion ?? "No especificado");
                });

                // Sección 3: Especificación
                column.Item().Text("3. ESPECIFICACIÓN DEL PROYECTO").FontSize(12).SemiBold().FontColor(Colors.Blue.Darken4);
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                    });

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("ANTECEDENTES").SemiBold();
                    table.Cell().Border(1).Padding(5).Text(_proyecto.Antecedentes ?? "N/A");

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("DESCRIPCIÓN").SemiBold();
                    table.Cell().Border(1).Padding(5).Text(_proyecto.DescripcionProyecto ?? "N/A");

                    table.Cell().Border(1).Background(Colors.Grey.Lighten4).Padding(5).Text("METODOLOGÍA").SemiBold();
                    table.Cell().Border(1).Padding(5).Text(_proyecto.Metodologia ?? "N/A");
                });
                
                // Firmas Placeholder
                column.Item().PaddingTop(50).Row(row => 
                {
                    row.RelativeItem().AlignCenter().Column(col => 
                    {
                        col.Item().LineHorizontal(1).LineColor(Colors.Black);
                        col.Item().Text("Firma del Docente").AlignCenter();
                    });
                    
                    row.ConstantItem(50); // Espacio
                    
                    row.RelativeItem().AlignCenter().Column(col => 
                    {
                        col.Item().LineHorizontal(1).LineColor(Colors.Black);
                        col.Item().Text("Firma del Director").AlignCenter();
                    });
                });
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
            {
                x.Span("Página ");
                x.CurrentPageNumber();
                x.Span(" de ");
                x.TotalPages();
                x.Span(" - Generado por DIITRA");
            });
        }
    }
}
