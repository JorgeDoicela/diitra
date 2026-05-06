using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Clase base para todos los documentos institucionales de DIITRA.
    /// Garantiza que todos los documentos tengan el mismo "Look \u0026 Feel".
    /// </summary>
    public abstract class BaseInstitutionalTemplate : IDocument
    {
        public virtual DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                // Estructura común
                page.Header().Element(ComposeHeaderInternal);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooterInternal);
            });
        }

        // Obligatorio para las clases hijas
        public abstract void ComposeContent(IContainer container);

        // Opcional para las clases hijas
        protected virtual string GetTitle() => "DOCUMENTO INSTITUCIONAL";
        protected virtual string GetSubtitle() => "DIITRA - SISTEMA DE GESTIÓN";

        private void ComposeHeaderInternal(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(GetTitle().ToUpper()).FontSize(14).SemiBold().FontColor(Colors.Blue.Medium);
                    column.Item().Text(GetSubtitle()).FontSize(10).FontColor(Colors.Grey.Medium);
                });

                // Branding Unificado
                row.ConstantItem(100).Height(40).Background(Colors.Blue.Darken4).AlignCenter().AlignMiddle().Text("DIITRA").FontColor(Colors.White).Bold();
            });
            
            container.PaddingTop(5).LineHorizontal(1.5f).LineColor(Colors.Blue.Darken4);
        }

        private void ComposeFooterInternal(IContainer container)
        {
            container.PaddingTop(10).Column(c => {
                c.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
                c.Item().Row(row =>
                {
                    row.RelativeItem().Text(x =>
                    {
                        x.Span("Generado automáticamente por el Motor DIITRA | ").FontSize(8);
                        x.Span(System.DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                    });
                    row.RelativeItem().AlignRight().Text(x =>
                    {
                        x.Span("Página ").FontSize(8);
                        x.CurrentPageNumber().FontSize(8);
                        x.Span(" de ").FontSize(8);
                        x.TotalPages().FontSize(8);
                    });
                });
            });
        }

        // Helpers útiles para las plantillas hijas
        protected void ComposeSectionTitle(IContainer container, string title)
        {
            container.Background(Colors.Grey.Lighten4).Padding(5).Text(title).FontSize(11).Bold().FontColor(Colors.Blue.Darken4);
        }

        protected void AddTableRow(TableDescriptor table, string label, string? value)
        {
            table.Cell().Padding(3).Text(label).SemiBold();
            table.Cell().Padding(3).Text(value ?? "N/A");
        }
    }
}
