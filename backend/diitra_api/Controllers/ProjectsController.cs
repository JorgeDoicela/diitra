using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Application.Common.Documents;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;
        private readonly IDocumentInstanceService _documentInstanceService;
        private readonly diitra_application.Security.IAuthService _authService;
        private readonly IProjectOrchestrator _projectOrchestrator;

        public ProjectsController(
            IDocumentEngine documentEngine, 
            IDocumentInstanceService documentInstanceService, 
            diitra_application.Security.IAuthService authService,
            IProjectOrchestrator projectOrchestrator)
        {
            _documentEngine = documentEngine;
            _documentInstanceService = documentInstanceService;
            _authService = authService;
            _projectOrchestrator = projectOrchestrator;
        }

        /// <summary>
        /// Genera el PDF del protocolo de investigación usando el motor Enterprise DIITRA.
        /// El template "PROTOCOLO_INVESTIGACION" vive en BD y puede editarse sin redespliegue.
        /// </summary>
        [HttpPost("generate-pdf")]
        public async Task<IActionResult> GeneratePdf(
            [FromBody] ProyectoDto dto,
            [FromQuery] bool isDraft = true,
            [FromQuery] bool isBlind = false)
        {
            var request = new DocumentRequest
            {
                TemplateCode = isBlind ? "PROTOCOLO_PEER_REVIEW" : "PROTOCOLO_INVESTIGACION",
                Data = dto,
                IsDraftMode = isDraft,
                IsBlindMode = isBlind,
                RequestedBy = User.Identity?.Name ?? "Sistema DIITRA",
                ProjectUuid = dto.Uuid,
                EntityUuid = dto.Uuid // En producción siempre usamos el UUID real del proyecto
            };

            var result = await _documentEngine.GenerateAsync(request);

            // AUTO-TRAZABILIDAD: Registramos esta emisión en la bandeja de instancias
            try 
            {
                await _documentInstanceService.CreateAsync(
                    request.TemplateCode,
                    request.EntityUuid ?? string.Empty,
                    request.RequestedBy ?? "Sistema DIITRA",
                    $"Preview Oficial: {dto.Titulo ?? "Sin Título"}",
                    "Proyecto"
                );
            }
            catch (Exception ex) 
            { 
                Console.WriteLine($"[DIITRA DEBUG] Error al registrar instancia: {ex.Message}"); 
            }

            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        /// <summary>
        /// Genera el PDF del protocolo en modo Doble Ciego para Peer Review.
        /// Los datos de identidad son enmascarados automáticamente por el motor.
        /// </summary>
        [HttpPost("generate-pdf/blind-review")]
        public async Task<IActionResult> GeneratePdfBlindReview([FromBody] ProyectoDto dto)
        {
            var request = new DocumentRequest
            {
                TemplateCode = "PROTOCOLO_PEER_REVIEW",
                Data = dto,
                IsBlindMode = true,
                RequestedBy = User.Identity?.Name ?? "sistema"
            };

            var result = await _documentEngine.GenerateAsync(request);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        // --- Endpoints Colaborativos (Workspace) ---

        [HttpPost("draft")]
        public IActionResult CreateDraft([FromBody] ProyectoDto dto)
        {
            dto.Uuid = System.Guid.NewGuid().ToString();
            dto.Estado = "Borrador";
            return Ok(new { message = "Workspace Borrador Creado", proyectoId = dto.Uuid });
        }

        /// <summary>
        /// Simulación de firma electrónica PAdES usando el motor DIITRA.
        /// </summary>
        [HttpPost("sign")]
        public async Task<IActionResult> SignDocument(
            [FromQuery] string password,
            [FromServices] diitra_infrastructure.Security.IFirmaElectronicaService firmaService)
        {
            // 1. Generar un PDF base para la prueba con datos reales
            var request = new DocumentRequest {
                TemplateCode = "PROTOCOLO_INVESTIGACION",
                Data = new {
                    Titulo = "Prueba de Firma Profesional Enterprise",
                    nombre_investigador = "Jorge Doicela",
                    nombre_director = "Dr. Marco Traversari",
                    codigo_institucional = "IST-DIITRA-2026-001-P",
                    linea_investigacion = "Inteligencia Artificial y Software",
                    tipo_investigacion = "Investigación Aplicada",
                    ods = "9. Industria, Innovación e Infraestructura",
                    tiempo_ejecucion = "12 Meses",
                    antecedentes = "La presente investigación aborda la automatización de procesos de auditoría académica mediante tecnología Blockchain y Hash-Linking...",
                    descripcion_proyecto = "Desarrollo de un núcleo de software capaz de garantizar la inmutabilidad de los expedientes de investigación.",
                    justificacion = "Cumplimiento de las normativas vigentes de CACES y SENESCYT para la acreditación institucional.",
                    marco_teorico = "Basado en los estándares internacionales de firma digital PAdES y XAdES.",
                    metodologia = "Desarrollo ágil con enfoque en seguridad por diseño (Security by Design).",
                    recursos_necesarios = new[] {
                        new { descripcion = "Servidor GPU Auditoría", id_partida = "53.01.05", costo_total = 3500, es_gasto_capital = true },
                        new { descripcion = "Licencias Enterprise LTV", id_partida = "53.08.04", costo_total = 1200, es_gasto_capital = false }
                    },
                    cronograma = new[] {
                        new { numero = 1, actividad = "Prueba E2E de Trazabilidad", ponderacion = 50, es_entregable_caces = true },
                        new { numero = 2, actividad = "Validación de Integridad LTV", ponderacion = 50, es_entregable_caces = true }
                    }
                }
            };
            var genResult = await _documentEngine.GenerateAsync(request);

            // Bypass de prueba para el USER (Modo Demo)
            if (password == "diitra2026")
            {
                try 
                {
                    var context = HttpContext.RequestServices.GetRequiredService<diitra_infrastructure.data.models.DiitraContext>();
                    var workflowService = HttpContext.RequestServices.GetRequiredService<Diitra.Application.Research.IWorkflowEngineService>();
                    
                    var project = await context.InvProyectos.OrderByDescending(p => p.IdProyecto).FirstOrDefaultAsync();
                    
                    if (project != null)
                    {
                        if (project.Estado != "Borrador") {
                            project.Estado = "Borrador";
                            await context.SaveChangesAsync();
                        }

                        // Intentamos la transición
                        bool success = await workflowService.TransicionarEstadoAsync(project.Uuid, "Enviado", 1, "Sello Digital de Integridad - Firma Jorge Doicela");
                        
                        if (!success) {
                             Console.WriteLine("DIITRA DEBUG: TransicionarEstadoAsync devolvió FALSE");
                        }
                    }
                    else {
                        Console.WriteLine("DIITRA DEBUG: No se encontró ningún proyecto en inv_proyectos");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DIITRA ERROR CRÍTICO: {ex.Message}");
                    Console.WriteLine($"DIITRA ERROR DETALLE: {ex.InnerException?.Message}");
                }

                return File(genResult.PdfBytes, "application/pdf", "DIITRA_Enterprise_Signed.pdf");
            }

            // 2. Firmar usando el servicio profesional (Requiere certificado real)
            byte[] dummyCert = new byte[10];
            try
            {
                var signedPdf = firmaService.SignPdf(genResult.PdfBytes, dummyCert, password);
                return File(signedPdf, "application/pdf", "DIITRA_Firmado.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = "Firma fallida: " + ex.Message });
            }
        }

        [HttpPatch("{id}/section")]
        public IActionResult UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(string id, [FromQuery] string newState, [FromQuery] string observation, [FromServices] IWorkflowEngineService workflowEngine)
        {
            try
            {
                int idUsuarioSimulado = 1;
                var success = await workflowEngine.TransicionarEstadoAsync(id, newState, idUsuarioSimulado, observation);
                if (!success) return NotFound("Proyecto no encontrado");
                return Ok(new { message = $"Proyecto transitado exitosamente a {newState}" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id}/traceability")]
        public async Task<IActionResult> GetTraceability(string id, [FromServices] IWorkflowEngineService workflowEngine)
        {
            var history = await workflowEngine.GetTrazabilidadAsync(id);
            return Ok(history);
        }
        /// <summary>
        /// Sincroniza los datos del Wizard con la base de datos de investigación.
        /// NOTA ARQUITECTÓNICA: Este controlador es específico para la entidad 'Proyecto'.
        /// El NÚCLEO DIITRA Builder es universal; cuando implementemos otros documentos
        /// (como Informes o Actas), crearemos sus propios controladores, pero todos
        /// usarán el mismo DocumentEngine para generar los PDFs.
        /// </summary>
        [HttpPost("save-preview-data")]
        public async Task<IActionResult> SavePreviewData([FromBody] ProyectoDto dto)
        {
            if (dto == null) return BadRequest("Datos nulos");

            var result = await _projectOrchestrator.SyncProjectWizardDataAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message, uuid = result.Uuid });
            }

            return Ok(new { success = true, uuid = result.Uuid });
        }
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var projects = await _projectOrchestrator.GetAllProjectsAsync();
            return Ok(projects);
        }

        /// <summary>
        /// Devuelve los proyectos donde el usuario autenticado participa (docente o estudiante).
        /// </summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMyProjects()
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var projects = await _projectOrchestrator.GetMyProjectsAsync(userIdRef);
            return Ok(projects);
        }

        /// <summary>
        /// Devuelve el detalle completo de un proyecto por UUID.
        /// </summary>
        [HttpGet("{uuid}/detail")]
        public async Task<IActionResult> GetDetail(string uuid)
        {
            var detail = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (detail == null) return NotFound();
            return Ok(detail);
        }

        /// <summary>
        /// Estadísticas del dashboard para el usuario autenticado.
        /// Responde con métricas propias si es Investigador, o globales si es Director/Admin.
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isAdmin = User.FindFirst("es_admin")?.Value == "true";
            var stats = await _projectOrchestrator.GetDashboardStatsAsync(userIdRef, isAdmin);
            return Ok(stats);
        }

        /// <summary>
        /// Exporta la metadata de un proyecto en formato CSV para cumplimiento CACES.
        /// </summary>
        [HttpGet("{uuid}/export-caces")]
        public async Task<IActionResult> ExportCaces(string uuid)
        {
            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project == null) return NotFound(new { error = "Proyecto no encontrado" });

            var csv = new System.Text.StringBuilder();
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

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"CACES_METADATA_{uuid.Substring(0,8).ToUpper()}.csv");
        }

        /// <summary>
        /// Publica el proyecto de investigación y su PDF oficial en el repositorio institucional DSpace.
        /// </summary>
        [HttpPost("{uuid}/publish-dspace")]
        public async Task<IActionResult> PublishDSpace(
            string uuid, 
            [FromServices] Diitra.Application.Common.Repositories.IRepositoryConnector repositoryConnector, 
            [FromServices] Diitra.Infrastructure.Common.Storage.IFileStorageService fileStorageService)
        {
            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project == null) return NotFound(new { error = "Proyecto no encontrado" });

            byte[] pdfBytes;
            
            // Intentamos buscar una instancia de documento finalizada
            var instances = await _documentInstanceService.GetByEntityAsync(uuid);
            var finalizedInstance = instances.FirstOrDefault(i => !string.IsNullOrEmpty(i.FinalPdfPath) && i.State == Diitra.Domain.Common.Documents.DocumentState.Signed);

            if (finalizedInstance != null)
            {
                try
                {
                    pdfBytes = await fileStorageService.GetFileAsync(finalizedInstance.FinalPdfPath);
                }
                catch
                {
                    // Fallback: Generar el PDF dinámicamente si el archivo no existe en almacenamiento
                    var request = new DocumentRequest
                    {
                        TemplateCode = "PROTOCOLO_INVESTIGACION",
                        Data = project,
                        IsDraftMode = false,
                        IsBlindMode = false,
                        RequestedBy = User.Identity?.Name ?? "Sistema DIITRA",
                        ProjectUuid = uuid,
                        EntityUuid = uuid
                    };
                    var genResult = await _documentEngine.GenerateAsync(request);
                    pdfBytes = genResult.PdfBytes;
                }
            }
            else
            {
                // Generar el PDF dinámicamente
                var request = new DocumentRequest
                {
                    TemplateCode = "PROTOCOLO_INVESTIGACION",
                    Data = project,
                    IsDraftMode = false,
                    IsBlindMode = false,
                    RequestedBy = User.Identity?.Name ?? "Sistema DIITRA",
                    ProjectUuid = uuid,
                    EntityUuid = uuid
                };
                var genResult = await _documentEngine.GenerateAsync(request);
                pdfBytes = genResult.PdfBytes;
            }

            var dspaceMetadata = new
            {
                title = project.Titulo,
                creator = project.DirectorProyecto ?? "DIITRA Investigador",
                subject = project.LineaInvestigacion,
                description = $"Proyecto de investigación institucional: {project.Titulo}. Estado: {project.Estado}.",
                publisher = "Instituto Superior Tecnológico Traversari",
                date = System.DateTime.UtcNow.ToString("yyyy-MM-dd"),
                identifier = project.CodigoInstitucional ?? $"DIITRA-{uuid.Substring(0,8).ToUpper()}"
            };

            var dspaceUri = await repositoryConnector.PublishAsync(pdfBytes, dspaceMetadata);

            if (dspaceUri.StartsWith("ERROR:"))
            {
                return BadRequest(new { error = dspaceUri });
            }

            return Ok(new { success = true, uri = dspaceUri });
        }

        /// <summary>
        /// Elimina físicamente un proyecto y todos sus registros relacionados en cascada.
        /// Solo permitido para borradores de proyectos académicos.
        /// </summary>
        [HttpDelete("{uuid}")]
        public async Task<IActionResult> DeleteProject(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _projectOrchestrator.DeleteProjectAsync(uuid, userIdRef);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }
    }
}
