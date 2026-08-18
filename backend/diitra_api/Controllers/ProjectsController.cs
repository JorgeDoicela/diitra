using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    /// <summary>
    /// Fachada HTTP para el Módulo de Proyectos de Investigación.
    /// Controlador delgado que delega la lógica de negocio, firma, egresos y publicaciones
    /// a sub-servicios especializados de la capa de aplicación e infraestructura.
    /// </summary>
    [ApiController]
    [Route("api/projects")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly IProjectSigningService _projectSigningService;
        private readonly IProjectExpensesService _projectExpensesService;
        private readonly IProjectPublishingService _projectPublishingService;

        public ProjectsController(
            IProjectOrchestrator projectOrchestrator,
            IProjectSigningService projectSigningService,
            IProjectExpensesService projectExpensesService,
            IProjectPublishingService projectPublishingService)
        {
            _projectOrchestrator = projectOrchestrator;
            _projectSigningService = projectSigningService;
            _projectExpensesService = projectExpensesService;
            _projectPublishingService = projectPublishingService;
        }

        /// <summary>
        /// Genera el PDF del protocolo de investigación usando el motor DIITRA.
        /// </summary>
        [HttpPost("generate-pdf")]
        public async Task<IActionResult> GeneratePdf(
            [FromBody] ProyectoDto dto,
            [FromQuery] bool isDraft = true,
            [FromQuery] bool isBlind = false)
        {
            var result = await _projectSigningService.GeneratePdfAsync(dto, isDraft, isBlind, User.Identity?.Name);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        /// <summary>
        /// Genera el PDF del protocolo en modo Doble Ciego para Peer Review.
        /// </summary>
        [HttpPost("generate-pdf/blind-review")]
        public async Task<IActionResult> GeneratePdfBlindReview([FromBody] ProyectoDto dto)
        {
            var result = await _projectSigningService.GeneratePdfAsync(dto, isDraft: false, isBlind: true, User.Identity?.Name);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        [HttpPost("draft")]
        public IActionResult CreateDraft([FromBody] ProyectoDto dto)
        {
            dto.Uuid = Guid.NewGuid().ToString();
            dto.Estado = "Borrador";
            return Ok(new { message = "Workspace Borrador Creado", proyectoId = dto.Uuid });
        }

        /// <summary>
        /// Firma electrónica PAdES y sello digital del protocolo de investigación.
        /// </summary>
        [HttpPost("sign")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SignDocument(
            IFormFile? certificate,
            [FromForm] string? password,
            [FromForm] string projectUuid)
        {
            byte[]? certificateBytes = null;
            if (certificate != null && certificate.Length > 0)
            {
                using var ms = new System.IO.MemoryStream();
                await certificate.CopyToAsync(ms);
                certificateBytes = ms.ToArray();
            }

            var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers["User-Agent"].ToString();

            var result = await _projectSigningService.SignDocumentAsync(certificateBytes, password, projectUuid, User, ip, userAgent);

            if (!result.Success)
            {
                return StatusCode(result.StatusCode, new { error = result.ErrorMessage });
            }

            return File(result.PdfBytes!, "application/pdf", result.FileName!);
        }

        [HttpPatch("{id}/section")]
        public async Task<IActionResult> UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            if (!await CanCurrentUserModifyProjectAsync(id))
            {
                return StatusCode(403, new { message = "No tienes permisos de escritura sobre este proyecto de investigación." });
            }
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(
            string id,
            [FromQuery] string newState,
            [FromQuery] string observation,
            [FromQuery] string? fechaLimite,
            [FromServices] IWorkflowEngineService workflowEngine)
        {
            if (!await CanCurrentUserManageProjectAsync(id))
            {
                return StatusCode(403, new { message = "No tienes permisos para transicionar el estado de este proyecto." });
            }
            try
            {
                var userSigafiRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
                int idUsuario = (await _projectOrchestrator.GetUserInternalIdBySigafiIdAsync(userSigafiRef ?? "")) ?? 1;
                
                DateOnly? deadline = null;
                if (!string.IsNullOrEmpty(fechaLimite) && DateOnly.TryParse(fechaLimite, out var parsedDeadline))
                {
                    deadline = parsedDeadline;
                }

                var success = await workflowEngine.TransicionarEstadoAsync(id, newState, idUsuario, observation, deadline);
                if (!success) return NotFound("Proyecto no encontrado");
                return Ok(new { message = $"Proyecto transitado exitosamente a {newState}" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{id}/devolver-informe-final")]
        public async Task<IActionResult> DevolverInformeFinal(
            string id,
            [FromQuery] string observation,
            [FromQuery] string? fechaLimite,
            [FromServices] DiitraContext context,
            [FromServices] diitra_application.Common.Notifications.INotificationService notificationService)
        {
            if (!await CanCurrentUserManageProjectAsync(id))
            {
                return StatusCode(403, new { message = "No tienes permisos para auditar este proyecto." });
            }

            var project = await context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == id);
            if (project == null) return NotFound("Proyecto no encontrado");

            DateOnly? deadline = null;
            if (!string.IsNullOrEmpty(fechaLimite) && DateOnly.TryParse(fechaLimite, out var parsedDeadline))
            {
                deadline = parsedDeadline;
                project.FechaLimiteSubsanacionFinal = deadline;
            }

            // 1. Buscar y reabrir instancias de Informe Final
            var docInstances = await context.DocumentInstances
                .Where(d => d.EntityUuid == project.Uuid && 
                           (d.TemplateCode == "INFORME_FINAL_INVESTIGACION" || d.TemplateCode == "INFORME_FINAL_INNOVACION"))
                .ToListAsync();

            foreach (var doc in docInstances)
            {
                doc.ReopenForRevision();
                var firmas = await context.InvDocumentoFirmas
                    .Where(f => (f.DocumentoUuid == doc.Uuid || f.DocumentoUuid == project.Uuid) && f.EsValida)
                    .ToListAsync();
                foreach (var f in firmas)
                {
                    f.EsValida = false;
                }
            }

            // 2. Registrar Trazabilidad Inmutable
            var userSigafiRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int idUsuario = (await _projectOrchestrator.GetUserInternalIdBySigafiIdAsync(userSigafiRef ?? "")) ?? 1;

            string plazoInfo = deadline.HasValue ? $" (Plazo límite de entrega: {deadline.Value:dd/MM/yyyy})" : "";
            var trazabilidad = new InvTrazabilidadProyecto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdUsuario = idUsuario,
                EstadoAnterior = project.Estado,
                EstadoNuevo = project.Estado,
                Observacion = $"Devolución de Informe Final con observaciones: {observation}{plazoInfo}",
                FechaTransicion = DateTime.Now
            };
            context.InvTrazabilidadProyectos.Add(trazabilidad);

            await context.SaveChangesAsync();

            // 3. Notificar a los participantes del proyecto
            try
            {
                var participantUserIds = await context.InvProyectoParticipantes
                    .Where(pp => pp.IdProyecto == project.IdProyecto && pp.Activo != false)
                    .Select(pp => pp.IdUsuario)
                    .Distinct()
                    .ToListAsync();

                string actionUrl = $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{project.Uuid}?edit=informe-final-investigacion";

                string plazoTexto = deadline.HasValue ? $" Plazo límite de entrega: {deadline.Value:dd/MM/yyyy}." : "";
                foreach (var userId in participantUserIds)
                {
                    await notificationService.NotifyUserAsync(
                        userId,
                        "Informe Final Devuelto para Correcciones",
                        $"El Informe Final del proyecto '{project.Titulo}' ha sido devuelto con observaciones.{plazoTexto} Observación: {observation}",
                        "INVESTIGACION",
                        actionUrl
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIITRA] Error al notificar devolución de informe final: {ex.Message}");
            }

            return Ok(new { message = "Informe final devuelto correctamente para ajustes del docente." });
        }

        [HttpPost("{id}/issue-certificates")]
        public async Task<IActionResult> IssueProjectCertificatesByUuid(
            string id,
            [FromServices] DiitraContext context,
            [FromServices] Diitra.Application.Common.Certificates.ICertificateIssuanceService certificateService)
        {
            var project = await context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == id);
            if (project == null) return NotFound("Proyecto no encontrado");

            try
            {
                string issuedBy = User?.Identity?.Name ?? "Coordinación de Investigación";
                var certificates = await certificateService.IssueProjectCompletionCertificatesAsync(project.IdProyecto, issuedBy);
                var certList = certificates.ToList();
                if (certList.Count == 0)
                {
                    return BadRequest(new { error = "No se encontraron integrantes para emitir certificados en este proyecto." });
                }

                return Ok(new
                {
                    message = $"Se emitieron exitosamente {certList.Count} certificados oficiales para el equipo.",
                    count = certList.Count,
                    certificates = certList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error al emitir certificados: {ex.Message}" });
            }
        }

        [HttpGet("{id}/traceability")]
        public async Task<IActionResult> GetTraceability(string id, [FromServices] IWorkflowEngineService workflowEngine)
        {
            if (!await CanCurrentUserViewProjectAsync(id))
            {
                return StatusCode(403, new { message = "No tienes permisos para visualizar la trazabilidad de este proyecto." });
            }
            var history = await workflowEngine.GetTrazabilidadAsync(id);
            return Ok(history);
        }

        [HttpPost("save-preview-data")]
        public async Task<IActionResult> SavePreviewData([FromBody] ProyectoDto dto)
        {
            if (dto == null) return BadRequest("Datos nulos");
            if (string.IsNullOrEmpty(dto.Uuid)) return BadRequest("El UUID del proyecto es requerido");

            if (!await CanCurrentUserModifyProjectAsync(dto.Uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para modificar este proyecto de investigación." });
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _projectOrchestrator.SyncProjectWizardDataAsync(dto, userIdRef);

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

        [HttpGet("my")]
        public async Task<IActionResult> GetMyProjects()
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            if (isSystemAdmin)
            {
                var allProjects = await _projectOrchestrator.GetAllProjectsAsync();
                return Ok(allProjects);
            }

            var projects = await _projectOrchestrator.GetMyProjectsAsync(userIdRef);
            return Ok(projects);
        }

        [HttpGet("{uuid}/detail")]
        public async Task<IActionResult> GetDetail(string uuid)
        {
            if (!await CanCurrentUserViewProjectAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para visualizar este proyecto de investigación borrador." });
            }

            var detail = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (detail == null) return NotFound();

            detail.PuedeEditar = await CanCurrentUserModifyProjectAsync(uuid);
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            detail.PuedeSolicitarCambioEquipo = !string.IsNullOrEmpty(userIdRef) &&
                await _projectOrchestrator.UserCanRequestTeamChangeAsync(uuid, userIdRef);
            detail.PuedeFirmar = !string.IsNullOrEmpty(userIdRef) &&
                await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);
            return Ok(detail);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isAdmin = User.FindFirst("es_admin")?.Value == "true" || User.IsInRole("DIITRA_ADMIN");
            var stats = await _projectOrchestrator.GetDashboardStatsAsync(userIdRef, isAdmin);
            return Ok(stats);
        }

        [HttpGet("{uuid}/export-caces")]
        public async Task<IActionResult> ExportCaces(string uuid)
        {
            var result = await _projectPublishingService.ExportCacesCsvAsync(uuid);
            if (!result.Success)
            {
                return NotFound(new { error = result.ErrorMessage });
            }
            return File(result.CsvBytes!, "text/csv", result.FileName!);
        }

        [HttpPost("{uuid}/publish-dspace")]
        public async Task<IActionResult> PublishDSpace(string uuid)
        {
            var result = await _projectPublishingService.PublishDSpaceAsync(uuid, User.Identity?.Name);
            if (!result.Success)
            {
                return StatusCode(result.StatusCode, new { error = result.ErrorMessage });
            }
            return Ok(new { success = true, uri = result.Uri });
        }

        [HttpPatch("{uuid}/team")]
        public async Task<IActionResult> UpdateProjectTeam(
            string uuid,
            [FromBody] System.Collections.Generic.List<InvestigadorDto> investigadores,
            [FromQuery] string? grupoInvestigacion = null,
            [FromQuery] bool? tieneGrupoInvestigacion = null)
        {
            if (investigadores == null) return BadRequest("Lista de investigadores nula.");

            if (!await CanCurrentUserManageProjectAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos de escritura sobre este proyecto de investigación." });
            }

            var result = await _projectOrchestrator.UpdateProjectTeamAsync(uuid, investigadores, grupoInvestigacion, tieneGrupoInvestigacion);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }

        [HttpPost("{uuid}/team-change-requests")]
        public async Task<IActionResult> CreateTeamChangeRequest(string uuid, [FromBody] TeamChangeRequestDto request)
        {
            if (!await CanCurrentUserRequestTeamChangeAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para solicitar cambios de equipo en este proyecto." });
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var result = await _projectOrchestrator.CreateTeamChangeRequestAsync(uuid, userIdRef, request);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            return Ok(new { success = true, requestUuid = result.Uuid, message = result.Message });
        }

        [HttpGet("{uuid}/team-change-requests")]
        public async Task<IActionResult> GetTeamChangeRequests(string uuid)
        {
            if (!await CanCurrentUserViewProjectAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para visualizar solicitudes de cambio de equipo de este proyecto." });
            }

            var records = await _projectOrchestrator.GetTeamChangeRequestsAsync(uuid);
            return Ok(records);
        }

        [HttpPatch("{uuid}/team-change-requests/{requestUuid}/review")]
        [Authorize(Roles = "DIITRA_ADMIN")]
        public async Task<IActionResult> ReviewTeamChangeRequest(string uuid, string requestUuid, [FromBody] TeamChangeReviewDto review)
        {
            var reviewerSigafiId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(reviewerSigafiId)) return Unauthorized();

            var result = await _projectOrchestrator.ReviewTeamChangeRequestAsync(uuid, requestUuid, reviewerSigafiId, review);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            return Ok(new { success = true, message = result.Message });
        }

        [HttpPost("{uuid}/transfer-director")]
        public async Task<IActionResult> TransferDirector(string uuid, [FromBody] TransferDirectorRequest request)
        {
            if (request == null) return BadRequest("Petición nula.");
            if (string.IsNullOrEmpty(request.NuevoDirectorCedula) || string.IsNullOrEmpty(request.Motivo))
            {
                return BadRequest(new { success = false, message = "La cédula del nuevo director y el motivo son obligatorios." });
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            var isProjectDirector = await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);

            if (!isSystemAdmin)
            {
                if (!isProjectDirector)
                {
                    return StatusCode(403, new { message = "No tienes permisos para transferir la dirección de este proyecto." });
                }

                var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
                if (project == null || (project.Estado != "Borrador" && project.Estado != "En Corrección"))
                {
                    return StatusCode(403, new { message = "Solo se puede transferir la dirección del proyecto durante la fase de formulación." });
                }
            }

            var result = await _projectOrchestrator.TransferDirectorAsync(uuid, request);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }

        [HttpDelete("{uuid}")]
        public async Task<IActionResult> DeleteProject(string uuid)
        {
            if (!await CanCurrentUserManageProjectAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para eliminar este proyecto de investigación." });
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _projectOrchestrator.DeleteProjectAsync(uuid, userIdRef);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }

        [HttpGet("{uuid}/activity")]
        public async Task<IActionResult> GetActivity(string uuid, [FromQuery] int maxItems = 20)
        {
            if (!await CanCurrentUserViewProjectAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para visualizar la actividad de este proyecto." });
            }

            var actividad = await _projectOrchestrator.GetProjectActivityAsync(uuid, maxItems);
            return Ok(actividad);
        }

        [HttpPost("{uuid}/gastos")]
        public async Task<IActionResult> RegistrarGasto(string uuid, [FromBody] RegistrarGastoRequest request)
        {
            var result = await _projectExpensesService.RegistrarGastoAsync(uuid, request, User);
            if (!result.Success)
            {
                return StatusCode(result.StatusCode, new { success = false, message = result.Message });
            }
            return Ok(result.Data);
        }

        [HttpDelete("{uuid}/gastos/{gastoUuid}")]
        public async Task<IActionResult> EliminarGasto(string uuid, string gastoUuid)
        {
            var result = await _projectExpensesService.EliminarGastoAsync(uuid, gastoUuid, User);
            if (!result.Success)
            {
                return StatusCode(result.StatusCode, new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }

        private async Task<bool> CanCurrentUserModifyProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project == null) return false;

            if (project.Estado == "Prepropuesta" || project.Estado == "Prepropuesta Rechazada")
            {
                return await _projectOrchestrator.UserCanModifyProjectAsync(uuid, userIdRef);
            }

            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            if (project.Estado != "Borrador" && project.Estado != "En Corrección")
            {
                return false;
            }

            return await _projectOrchestrator.UserCanModifyProjectAsync(uuid, userIdRef);
        }

        private async Task<bool> CanCurrentUserManageProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project != null && (project.Estado == "Borrador" || project.Estado == "En Corrección" ||
                                    project.Estado == "Prepropuesta" || project.Estado == "Prepropuesta Rechazada"))
            {
                return await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);
            }

            return false;
        }

        private async Task<bool> CanCurrentUserRequestTeamChangeAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            return await _projectOrchestrator.UserCanRequestTeamChangeAsync(uuid, userIdRef);
        }

        private async Task<bool> CanCurrentUserViewProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            var isAdmin = User.FindFirst("es_admin")?.Value == "true" ||
                          User.IsInRole("DIITRA_ADMIN");

            if (isAdmin) return true;

            return await _projectOrchestrator.UserCanViewProjectAsync(uuid, userIdRef);
        }
    }
}
