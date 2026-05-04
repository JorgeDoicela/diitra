using System.IO;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Infrastructure.Research.Documents;
using QuestPDF.Fluent;

namespace Diitra.Infrastructure.Research
{
    public class PdfGeneratorService : IPdfGeneratorService
    {
        public Task<byte[]> GenerateProjectPdfAsync(ProyectoDto proyecto)
        {
            var template = new ProjectDocumentTemplate(proyecto);
            var pdfBytes = template.GeneratePdf();
            
            return Task.FromResult(pdfBytes);
        }
    }
}
