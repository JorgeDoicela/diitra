using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Diitra.Application.Common.Documents;
using Diitra.Application.Common.Repositories;
using Diitra.Application.Research;
using Diitra.Domain.Common.Documents;
using Diitra.Infrastructure.Common.Storage;

namespace diitra_infrastructure.Research
{
    public class ProjectPublishingService : IProjectPublishingService
    {
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly IDocumentInstanceService _documentInstanceService;
        private readonly IDocumentEngine _documentEngine;
        private readonly IRepositoryConnector _repositoryConnector;
        private readonly IFileStorageService _fileStorageService;

        public ProjectPublishingService(
            IProjectOrchestrator projectOrchestrator,
            IDocumentInstanceService documentInstanceService,
            IDocumentEngine documentEngine,
            IRepositoryConnector repositoryConnector,
            IFileStorageService fileStorageService)
        {
            _projectOrchestrator = projectOrchestrator;
            _documentInstanceService = documentInstanceService;
            _documentEngine = documentEngine;
            _repositoryConnector = repositoryConnector;
            _fileStorageService = fileStorageService;
        }

        public async Task<CacesExportResult> ExportCacesCsvAsync(string projectUuid)
        {
            var project = await _projectOrchestrator.GetProjectDetailAsync(projectUuid);
            if (project == null)
            {
                return new CacesExportResult { Success = false, ErrorMessage = "Proyecto no encontrado" };
            }

            var csv = new StringBuilder();
            csv.AppendLine("CAMPO,VALOR");
            csv.AppendLine($"\"Código Institucional\",\"{project.CodigoInstitucional ?? "N/A"}\"");
            csv.AppendLine($"\"Título del Proyecto\",\"{project.Titulo?.Replace("\"", "\"\"") ?? "N/A"}\"");
            csv.AppendLine($"\"Estado Actual\",\"{project.Estado ?? "N/A"}\"");
            csv.AppendLine($"\"Línea de Investigación\",\"{project.LineaInvestigacion ?? "N/A"}\"");
            csv.AppendLine($"\"Tiempo de Ejecución\",\"{project.TiempoEjecucion ?? "N/A"}\"");
            csv.AppendLine($"\"Presupuesto Total Planificado\",\"${project.CostoTotal}\"");
            csv.AppendLine($"\"TRL Inicial\",\"{project.TrlInicial ?? 1}\"");
            csv.AppendLine($"\"TRL Actual\",\"{project.TrlActual ?? 1}\"");
            csv.AppendLine($"\"TRL Meta\",\"{project.TrlMeta ?? 1}\"");
            csv.AppendLine("");
            csv.AppendLine("INTEGRANTE,ROL,CEDULA,TELEFONO");

            if (project.Investigadores != null)
            {
                foreach (var inv in project.Investigadores)
                {
                    csv.AppendLine($"\"{inv.Nombre}\",\"{inv.Rol}\",\"{inv.Cedula}\",\"{inv.Telefono}\"");
                }
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            string shortUuid = projectUuid.Length >= 8 ? projectUuid.Substring(0, 8).ToUpper() : projectUuid.ToUpper();
            string fileName = $"CACES_METADATA_{shortUuid}.csv";

            return new CacesExportResult
            {
                Success = true,
                CsvBytes = bytes,
                FileName = fileName
            };
        }

        public async Task<PublishDSpaceResult> PublishDSpaceAsync(string projectUuid, string? requestedBy)
        {
            var project = await _projectOrchestrator.GetProjectDetailAsync(projectUuid);
            if (project == null)
            {
                return new PublishDSpaceResult { Success = false, StatusCode = 404, ErrorMessage = "Proyecto no encontrado" };
            }

            byte[] pdfBytes;
            var instances = await _documentInstanceService.GetByEntityAsync(projectUuid);
            var finalizedInstance = instances.FirstOrDefault(i => !string.IsNullOrEmpty(i.FinalPdfPath) && i.State == DocumentState.Signed);

            if (finalizedInstance != null)
            {
                try
                {
                    pdfBytes = await _fileStorageService.GetFileAsync(finalizedInstance.FinalPdfPath!);
                }
                catch
                {
                    var request = new DocumentRequest
                    {
                        TemplateCode = "PROTOCOLO_INVESTIGACION",
                        Data = project,
                        IsDraftMode = false,
                        IsBlindMode = false,
                        RequestedBy = requestedBy ?? "Sistema DIITRA",
                        ProjectUuid = projectUuid,
                        EntityUuid = projectUuid
                    };
                    var genResult = await _documentEngine.GenerateAsync(request);
                    pdfBytes = genResult.PdfBytes;
                }
            }
            else
            {
                var request = new DocumentRequest
                {
                    TemplateCode = "PROTOCOLO_INVESTIGACION",
                    Data = project,
                    IsDraftMode = false,
                    IsBlindMode = false,
                    RequestedBy = requestedBy ?? "Sistema DIITRA",
                    ProjectUuid = projectUuid,
                    EntityUuid = projectUuid
                };
                var genResult = await _documentEngine.GenerateAsync(request);
                pdfBytes = genResult.PdfBytes;
            }

            string shortUuid = projectUuid.Length >= 8 ? projectUuid.Substring(0, 8).ToUpper() : projectUuid.ToUpper();

            var dspaceMetadata = new
            {
                title = project.Titulo,
                creator = project.DirectorProyecto ?? "DIITRA Investigador",
                subject = project.LineaInvestigacion,
                description = $"Proyecto de investigación institucional: {project.Titulo}. Estado: {project.Estado}.",
                publisher = "Instituto Superior Tecnológico Traversari",
                date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                identifier = project.CodigoInstitucional ?? $"DIITRA-{shortUuid}"
            };

            var dspaceUri = await _repositoryConnector.PublishAsync(pdfBytes, dspaceMetadata);

            if (dspaceUri.StartsWith("ERROR:"))
            {
                return new PublishDSpaceResult { Success = false, StatusCode = 400, ErrorMessage = dspaceUri };
            }

            return new PublishDSpaceResult { Success = true, Uri = dspaceUri };
        }
    }
}
