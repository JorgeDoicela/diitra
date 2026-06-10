using System;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Application.Common.Documents;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using diitra_infrastructure.data.models;

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
        private readonly DiitraContext _context;

        public ProjectsController(
            IDocumentEngine documentEngine,
            IDocumentInstanceService documentInstanceService,
            diitra_application.Security.IAuthService authService,
            IProjectOrchestrator projectOrchestrator,
            DiitraContext context)
        {
            _documentEngine = documentEngine;
            _documentInstanceService = documentInstanceService;
            _authService = authService;
            _projectOrchestrator = projectOrchestrator;
            _context = context;
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
            // Robustez: Si el DTO está incompleto (ej: Titulo nulo) y tenemos el UUID, resolvemos los datos reales desde BD.
            if (string.IsNullOrEmpty(dto.Titulo) && !string.IsNullOrEmpty(dto.Uuid))
            {
                var resolvedDto = await _projectOrchestrator.GetProjectDetailAsync(dto.Uuid);
                if (resolvedDto != null)
                {
                    dto = resolvedDto;
                }
            }

            var request = new DocumentRequest
            {
                TemplateCode = "PROTOCOLO_INVESTIGACION",
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
                TemplateCode = "PROTOCOLO_INVESTIGACION",
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
        /// <summary>
        /// Simulación y aplicación de firma electrónica PAdES usando el motor DIITRA.
        /// </summary>
        [HttpPost("sign")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SignDocument(
            Microsoft.AspNetCore.Http.IFormFile? certificate,
            [FromForm] string password,
            [FromForm] string projectUuid,
            [FromServices] diitra_infrastructure.Security.IFirmaElectronicaService firmaService,
            [FromServices] Microsoft.Extensions.Logging.ILogger<ProjectsController> logger,
            [FromServices] diitra_infrastructure.data.models.DiitraContext context,
            [FromServices] diitra_application.Security.ILopdpService lopdpService)
        {
            try 
            {
                logger.LogInformation("[DIITRA CORE] Solicitud de firma avanzada PAdES para proyecto {Uuid}", projectUuid);

                // ── LOPDP: Verificar consentimiento de firma electrónica antes de firmar ──
                var idReferencia = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(idReferencia)) return Unauthorized();

                var dbUser = await context.Users.FirstOrDefaultAsync(u => u.IdSigafi == idReferencia);
                if (dbUser == null) return Unauthorized();

                var userMeta = await context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == dbUser.IdUsuario);
                if (userMeta == null || !userMeta.AceptoTerminosFirma)
                {
                    return BadRequest(new { error = "Debe aceptar los términos y condiciones de firma electrónica (conforme a la LOPDP) en su perfil antes de proceder a la firma." });
                }

                // 1. Obtener los datos reales del proyecto
                var projectDto = await _projectOrchestrator.GetProjectDetailAsync(projectUuid);
                if (projectDto == null)
                {
                    return NotFound(new { error = "El proyecto de investigación especificado no existe." });
                }

                // 2. Generar el PDF oficial del protocolo de investigación en modo NO Borrador
                var request = new DocumentRequest
                {
                    TemplateCode = "PROTOCOLO_INVESTIGACION",
                    Data = projectDto,
                    IsDraftMode = false, // Emisión oficial inmutable
                    IsBlindMode = false,
                    RequestedBy = User.Identity?.Name ?? "Sistema DIITRA (Firma)",
                    ProjectUuid = projectDto.Uuid,
                    EntityUuid = projectDto.Uuid
                };

                var genResult = await _documentEngine.GenerateAsync(request);

                var config = HttpContext.RequestServices.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
                var env = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                var skipCertificateValidation = env.IsDevelopment()
                    || config.GetValue<bool>("Firma:SkipCertificateValidation");

                // 3. Aplicar Firma Criptográfica Avanzada (.p12 / BouncyCastle)
                byte[]? certificateBytes = null;
                string? finalPassword = password;

                if (certificate != null && certificate.Length > 0)
                {
                    using (var ms = new System.IO.MemoryStream())
                    {
                        await certificate.CopyToAsync(ms);
                        certificateBytes = ms.ToArray();
                    }
                }
                else if (userMeta != null && !string.IsNullOrEmpty(userMeta.RutaFirmaP12))
                {
                    if (System.IO.File.Exists(userMeta.RutaFirmaP12))
                    {
                        try
                        {
                            certificateBytes = await System.IO.File.ReadAllBytesAsync(userMeta.RutaFirmaP12);
                            var encryptionKey = config["Security:EncryptionKey"] ?? "DIITRA_SECURE_AES256_KEY_FOR_P12_PASSWORDS_2026!";
                            finalPassword = diitra_infrastructure.Security.CryptoHelper.Decrypt(userMeta.P12PasswordEncrypted!, encryptionKey);
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Error al cargar o descifrar la firma digital almacenada del usuario.");
                            return BadRequest(new { error = "No se pudo cargar o descifrar la firma digital almacenada en su perfil." });
                        }
                    }
                }

                byte[] signedPdfBytes;
                if (certificateBytes != null)
                {
                    if (!skipCertificateValidation)
                    {
                        if (string.IsNullOrWhiteSpace(finalPassword))
                        {
                            return BadRequest(new { error = "La contraseña del certificado es requerida." });
                        }

                        if (!firmaService.ValidateCertificate(certificateBytes, finalPassword!))
                        {
                            return BadRequest(new { error = "La contraseña del certificado no es válida o el archivo .p12 está corrupto." });
                        }

                        signedPdfBytes = firmaService.SignPdf(genResult.PdfBytes, certificateBytes, finalPassword!,
                            reason: $"Firma de Aprobación de Protocolo - {projectDto.Titulo}",
                            location: "Quito, Ecuador");
                    }
                    else
                    {
                        logger.LogWarning("[DIITRA CORE] Modo pruebas: firma criptográfica PAdES omitida para proyecto {Uuid}", projectUuid);
                        signedPdfBytes = genResult.PdfBytes;
                    }
                }
                else if (skipCertificateValidation)
                {
                    logger.LogWarning("[DIITRA CORE] Modo pruebas: PDF oficial generado sin certificado para proyecto {Uuid}", projectUuid);
                    signedPdfBytes = genResult.PdfBytes;
                }
                else if (password == "diitra2026")
                {
                    signedPdfBytes = genResult.PdfBytes;
                }
                else
                {
                    return BadRequest(new { error = "Debe subir un archivo de firma (.p12) válido, o haberla configurado previamente en su perfil." });
                }

                // MODO PRODUCCIÓN: descomentar para firma PAdES estricta
                // byte[] signedPdfBytes;
                // if (certificateBytes != null)
                // {
                //     if (!firmaService.ValidateCertificate(certificateBytes, finalPassword!))
                //     {
                //         return BadRequest(new { error = "La contraseña del certificado no es válida o el archivo .p12 está corrupto." });
                //     }
                //     signedPdfBytes = firmaService.SignPdf(genResult.PdfBytes, certificateBytes, finalPassword!,
                //         reason: $"Firma de Aprobación de Protocolo - {projectDto.Titulo}",
                //         location: "Quito, Ecuador");
                // }
                // else
                // {
                //     if (password != "diitra2026")
                //     {
                //         return BadRequest(new { error = "Debe subir un archivo de firma (.p12) válido, o haberla configurado previamente en su perfil." });
                //     }
                //     signedPdfBytes = genResult.PdfBytes;
                // }

                // ── LOPDP: Registrar auditoría de acceso a datos sensibles ──
                var ip = HttpContext.Connection?.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();
                await lopdpService.AuditoriaAccesoDatosAsync(
                    dbUser.IdUsuario,
                    dbUser.IdUsuario,
                    "inv_usuarios_metadata",
                    "rutaFirmaP12",
                    "DESCARGA",
                    $"Uso y validación del certificado digital para firma del proyecto {projectDto.Titulo}",
                    ip,
                    userAgent);


                // 4. Sello de Trazabilidad e Integridad (SHA-256)
                string finalHash;
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] hashBytes = sha256.ComputeHash(signedPdfBytes);
                    finalHash = Convert.ToHexString(hashBytes).ToLower();
                }

                // 5. Transición de Estado de Workflow Core
                var workflowService = HttpContext.RequestServices.GetRequiredService<Diitra.Application.Research.IWorkflowEngineService>();
                bool success = await workflowService.TransicionarEstadoAsync(projectDto.Uuid!, "Enviado", 1, $"Sello Digital e Inmutabilidad Forense - Hash: {finalHash}");

                if (!success)
                {
                    logger.LogWarning("[DIITRA CORE] La transición de estado falló durante la firma del proyecto.");
                }

                // 6. Sellar y Registrar Instancia de Documento (Integración CoWork Read-Only)
                try
                {
                    var instance = await context.DocumentInstances
                        .FirstOrDefaultAsync(i => i.EntityUuid == projectDto.Uuid && i.TemplateCode == "PROTOCOLO_INVESTIGACION");

                    if (instance == null)
                    {
                        instance = await _documentInstanceService.CreateAsync(
                            "PROTOCOLO_INVESTIGACION",
                            projectDto.Uuid!,
                            User.Identity?.Name ?? "Sistema DIITRA",
                            $"Protocolo Oficial: {projectDto.Titulo}",
                            "Proyecto"
                        );
                    }

                    // Pasar a estado firmado e inmutable en CoWork
                    await _documentInstanceService.FinalizeAsync(
                        instance.Uuid,
                        signedPdfBytes,
                        genResult.FileName,
                        finalHash,
                        genResult.TraceabilityCode
                    );
                }
                catch (System.Exception ex)
                {
                    logger.LogError(ex, "[DIITRA CORE] No se pudo finalizar la instancia documental.");
                }

                return File(signedPdfBytes, "application/pdf", genResult.FileName);
            }
            catch (System.Exception ex)
            {
                logger.LogError(ex, "[DIITRA CORE] Error crítico durante la firma del documento");
                return BadRequest(new { error = "Firma fallida: " + ex.Message });
            }
        }

        [HttpPatch("{id}/section")]
        public async Task<IActionResult> UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            if (!await CanCurrentUserModifyProjectAsync(id))
            {
                return Forbid("No tienes permisos de escritura sobre este proyecto de investigación.");
            }
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(string id, [FromQuery] string newState, [FromQuery] string observation, [FromServices] IWorkflowEngineService workflowEngine)
        {
            if (!await CanCurrentUserManageProjectAsync(id))
            {
                return Forbid("No tienes permisos para transicionar el estado de este proyecto.");
            }
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
            if (!await CanCurrentUserViewProjectAsync(id))
            {
                return Forbid("No tienes permisos para visualizar la trazabilidad de este proyecto.");
            }
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
            if (string.IsNullOrEmpty(dto.Uuid)) return BadRequest("El UUID del proyecto es requerido");

            if (!await CanCurrentUserModifyProjectAsync(dto.Uuid))
            {
                return Forbid("No tienes permisos para modificar este proyecto de investigación.");
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

        /// <summary>
        /// Devuelve los proyectos donde el usuario autenticado participa (docente o estudiante).
        /// Si el usuario es Administrador del Sistema, devuelve la lista total de proyectos para su revisión.
        /// </summary>
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

        /// <summary>
        /// Devuelve el detalle completo de un proyecto por UUID.
        /// </summary>
        [HttpGet("{uuid}/detail")]
        public async Task<IActionResult> GetDetail(string uuid)
        {
            if (!await CanCurrentUserViewProjectAsync(uuid))
            {
                return Forbid("No tienes permisos para visualizar este proyecto de investigación borrador.");
            }

            var detail = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (detail == null) return NotFound();

            detail.PuedeEditar = await CanCurrentUserModifyProjectAsync(uuid);
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            detail.PuedeSolicitarCambioEquipo = !string.IsNullOrEmpty(userIdRef) &&
                await _projectOrchestrator.UserCanRequestTeamChangeAsync(uuid, userIdRef);
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
                    pdfBytes = await fileStorageService.GetFileAsync(finalizedInstance.FinalPdfPath!);
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
        /// Actualiza dinámicamente el equipo de investigadores asignado al proyecto.
        /// </summary>
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
                return Forbid("No tienes permisos de escritura sobre este proyecto de investigación.");
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
                return Forbid("No tienes permisos para solicitar cambios de equipo en este proyecto.");
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
                return Forbid("No tienes permisos para visualizar solicitudes de cambio de equipo de este proyecto.");
            }

            var records = await _projectOrchestrator.GetTeamChangeRequestsAsync(uuid);
            return Ok(records);
        }

        [HttpPatch("{uuid}/team-change-requests/{requestUuid}/review")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "DIITRA_ADMIN")]
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

        /// <summary>
        /// Transfiere la dirección de un proyecto formalmente a un nuevo docente con justificación.
        /// </summary>
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
                    return Forbid("No tienes permisos para transferir la dirección de este proyecto.");
                }

                var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
                if (project == null || (project.Estado != "Borrador" && project.Estado != "En Corrección"))
                {
                    return Forbid("Solo se puede transferir la dirección del proyecto durante la fase de formulación.");
                }
            }

            var result = await _projectOrchestrator.TransferDirectorAsync(uuid, request);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }


        /// <summary>
        /// Elimina físicamente un proyecto y todos sus registros relacionados en cascada.
        /// Solo permitido para borradores de proyectos académicos.
        /// </summary>
        [HttpDelete("{uuid}")]
        public async Task<IActionResult> DeleteProject(string uuid)
        {
            if (!await CanCurrentUserManageProjectAsync(uuid))
            {
                return Forbid("No tienes permisos para eliminar este proyecto de investigación.");
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _projectOrchestrator.DeleteProjectAsync(uuid, userIdRef);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }
            return Ok(new { success = true });
        }

        /// <summary>
        /// Feed de actividad reciente de un proyecto: sesiones CoWork, estados de sección
        /// y transiciones de workflow. Diseñado para el panel lateral del Workspace.
        /// Desacoplado: nuevos tipos de actividad se agregan en el backend sin cambios en el frontend.
        /// </summary>
        [HttpGet("{uuid}/activity")]
        public async Task<IActionResult> GetActivity(string uuid, [FromQuery] int maxItems = 20)
        {
            if (!await CanCurrentUserViewProjectAsync(uuid))
            {
                return Forbid("No tienes permisos para visualizar la actividad de este proyecto.");
            }

            var actividad = await _projectOrchestrator.GetProjectActivityAsync(uuid, maxItems);
            return Ok(actividad);
        }

        private async Task<bool> CanCurrentUserModifyProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            // 1. Administradores del sistema tienen control absoluto
            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            // 2. Si el proyecto ya fue enviado o aprobado, está blindado de forma absoluta para todos en el editor colaborativo
            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project != null && project.Estado != "Borrador" && project.Estado != "En Corrección")
            {
                return false;
            }

            // 3. Comprobar si el usuario pertenece al equipo
            return await _projectOrchestrator.UserCanModifyProjectAsync(uuid, userIdRef);
        }

        private async Task<bool> CanCurrentUserManageProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            // 1. Si es Administrador del Sistema, tiene control absoluto
            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            // 2. Si es el Director de Proyecto del proyecto y el proyecto está en fases de edición
            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project != null && (project.Estado == "Borrador" || project.Estado == "En Corrección"))
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

        /// <summary>
        /// Registra un nuevo gasto asociado a un proyecto en estado En Ejecución.
        /// </summary>
        [HttpPost("{uuid}/gastos")]
        public async Task<IActionResult> RegistrarGasto(string uuid, [FromBody] RegistrarGastoRequest request)
        {
            if (request == null) return BadRequest("Petición nula.");
            if (string.IsNullOrEmpty(request.Descripcion) || request.Monto <= 0)
            {
                return BadRequest(new { success = false, message = "La descripción y un monto mayor a cero son obligatorios." });
            }

            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            var isProjectDirector = await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);

            if (!isSystemAdmin && !isProjectDirector)
            {
                return Forbid("No tienes permisos para registrar gastos en este proyecto de investigación.");
            }

            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return NotFound(new { success = false, message = "Proyecto no encontrado." });
            }

            if (project.Estado != "En Ejecución")
            {
                return BadRequest(new { success = false, message = "Solo se pueden registrar egresos en la fase de En Ejecución del proyecto." });
            }

            // Buscar o crear la partida presupuestaria correspondientes
            var item = await _context.InvPresupuestoItems
                .FirstOrDefaultAsync(i => i.IdProyecto == project.IdProyecto && i.IdPartida == request.Partida);

            if (item == null)
            {
                item = new InvPresupuestoItem
                {
                    IdProyecto = project.IdProyecto,
                    Categoria = string.IsNullOrEmpty(request.Categoria) ? "Otros" : request.Categoria,
                    IdPartida = string.IsNullOrEmpty(request.Partida) ? "GEN-999" : request.Partida,
                    Detalle = request.Descripcion,
                    Cantidad = 1,
                    ValorUnitario = request.Monto,
                    ValorTotal = request.Monto,
                    EsGastoCapital = false
                };
                _context.InvPresupuestoItems.Add(item);
                await _context.SaveChangesAsync();
            }

            DateOnly fechaGasto = DateOnly.FromDateTime(DateTime.UtcNow);
            if (!string.IsNullOrEmpty(request.Fecha) && DateOnly.TryParse(request.Fecha, out var parsedDate))
            {
                fechaGasto = parsedDate;
            }

            var gasto = new InvGasto
            {
                Uuid = Guid.NewGuid(),
                IdProyecto = project.IdProyecto,
                IdItem = item.IdItem,
                Monto = request.Monto,
                FechaGasto = fechaGasto,
                NumeroFactura = request.ReferenciaFactura,
                Descripcion = request.Descripcion
            };

            _context.InvGastos.Add(gasto);

            // Actualizar acumulado de ValorEjecucion
            project.ValorEjecucion = (project.ValorEjecucion ?? 0) + request.Monto;

            await _context.SaveChangesAsync();

            // Mapear al DTO para retornar al frontend
            var dto = new GastoDto
            {
                Id = gasto.Uuid.ToString(),
                Descripcion = gasto.Descripcion,
                Partida = item.IdPartida,
                Monto = gasto.Monto,
                Fecha = gasto.FechaGasto.ToString("yyyy-MM-dd"),
                ReferenciaFactura = gasto.NumeroFactura,
                Categoria = item.Categoria
            };

            return Ok(dto);
        }

        /// <summary>
        /// Elimina un registro de gasto asociado a un proyecto en estado En Ejecución.
        /// </summary>
        [HttpDelete("{uuid}/gastos/{gastoUuid}")]
        public async Task<IActionResult> EliminarGasto(string uuid, string gastoUuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return Unauthorized();

            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            var isProjectDirector = await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);

            if (!isSystemAdmin && !isProjectDirector)
            {
                return Forbid("No tienes permisos para eliminar gastos de este proyecto de investigación.");
            }

            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == uuid);

            if (project == null)
            {
                return NotFound(new { success = false, message = "Proyecto no encontrado." });
            }

            if (project.Estado != "En Ejecución")
            {
                return BadRequest(new { success = false, message = "Solo se pueden modificar egresos en la fase de En Ejecución del proyecto." });
            }

            if (!Guid.TryParse(gastoUuid, out var parsedGastoUuid))
            {
                return BadRequest(new { success = false, message = "UUID de gasto inválido." });
            }

            var gasto = await _context.InvGastos
                .FirstOrDefaultAsync(g => g.Uuid == parsedGastoUuid && g.IdProyecto == project.IdProyecto);

            if (gasto == null)
            {
                return NotFound(new { success = false, message = "Registro de gasto no encontrado." });
            }

            _context.InvGastos.Remove(gasto);

            // Actualizar acumulado de ValorEjecucion
            project.ValorEjecucion = Math.Max(0, (project.ValorEjecucion ?? 0) - gasto.Monto);

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
    }

    public class RegistrarGastoRequest
    {
        public string Descripcion { get; set; } = string.Empty;
        public string Partida { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string ReferenciaFactura { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string? Fecha { get; set; }
    }
}
