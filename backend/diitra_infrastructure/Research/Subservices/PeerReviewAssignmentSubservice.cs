using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using diitra_application.Common.Notifications;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research.Subservices
{
    public class PeerReviewAssignmentSubservice : IPeerReviewAssignmentSubservice
    {
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PeerReviewAssignmentSubservice(
            DiitraContext context,
            IAuthService authService,
            IAuditService auditService,
            INotificationService notificationService,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _notificationService = notificationService;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
        {
            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);

            if (project == null)
                throw new ArgumentException($"Proyecto con UUID '{dto.ProjectUuid}' no encontrado.");

            if (project.Activo == false)
            {
                throw new InvalidOperationException("No se pueden asignar árbitros a un proyecto inactivo.");
            }

            if (project.Estado != "En Revisión")
            {
                throw new InvalidOperationException($"No se pueden asignar árbitros a un proyecto en estado '{project.Estado}'. El proyecto debe estar en estado 'En Revisión' tras la aprobación técnica del administrador.");
            }

            var revisorUser = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == dto.IdRevisor);
            if (revisorUser == null || !revisorUser.Activo)
            {
                throw new InvalidOperationException("El revisor seleccionado no existe o no está activo en el sistema.");
            }

            if (revisorUser.TablaSigafi == "alumno")
            {
                throw new InvalidOperationException("Un estudiante no puede ser asignado como árbitro/evaluador de un proyecto de investigación.");
            }

            if (dto.EsExterno)
            {
                if (revisorUser.TablaSigafi != "otros")
                {
                    throw new InvalidOperationException("El revisor seleccionado no es un evaluador externo registrado.");
                }
            }
            else
            {
                if (revisorUser.TablaSigafi != "profesor")
                {
                    throw new InvalidOperationException("El revisor seleccionado es un evaluador externo, pero se ha indicado que es una asignación interna.");
                }
            }

            if (dto.IdRevisor == directorId)
            {
                throw new InvalidOperationException("Conflicto de interés: El director o coordinador que realiza la asignación no puede asignarse a sí mismo como árbitro.");
            }

            var alreadyAssigned = await _context.Set<InvRevisionesPares>()
                .AnyAsync(r => r.IdProyecto == project.IdProyecto && r.IdRevisor == dto.IdRevisor);
            if (alreadyAssigned)
            {
                throw new InvalidOperationException($"El revisor '{revisorUser.Nombre}' ya ha sido asignado a este proyecto.");
            }

            var isMember = await _context.Set<InvProyectoParticipante>()
                .AnyAsync(pp => pp.IdProyecto == project.IdProyecto && pp.IdUsuario == dto.IdRevisor);
            if (isMember)
            {
                throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado es miembro (director o docente/alumno investigador) de este proyecto.");
            }

            if (project.IdGrupo.HasValue)
            {
                var isGroupMember = await _context.Set<InvGrupoMiembro>()
                    .AnyAsync(gm => gm.IdGrupo == project.IdGrupo.Value && gm.IdUsuario == dto.IdRevisor && gm.Activo == true);
                if (isGroupMember)
                {
                    throw new InvalidOperationException("Conflicto de interés: El revisor seleccionado pertenece al mismo grupo de investigación del proyecto.");
                }
            }

            var reviewerProjects = await _context.Set<InvProyectoParticipante>()
                .Where(pp => pp.IdUsuario == dto.IdRevisor)
                .Select(pp => pp.IdProyecto)
                .ToListAsync();

            if (reviewerProjects.Any())
            {
                var currentProjectMembers = await _context.Set<InvProyectoParticipante>()
                    .Where(pp => pp.IdProyecto == project.IdProyecto)
                    .Select(pp => pp.IdUsuario)
                    .ToListAsync();

                var hasCrossReview = await _context.Set<InvRevisionesPares>()
                    .AnyAsync(r => reviewerProjects.Contains(r.IdProyecto) && r.IdRevisor.HasValue && currentProjectMembers.Contains(r.IdRevisor.Value));

                if (hasCrossReview)
                {
                    throw new InvalidOperationException("Conflicto de interés (Evaluación cruzada): Un miembro de este proyecto ya está asignado para evaluar un proyecto del revisor seleccionado.");
                }
            }

            var currentReviewsCount = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdProyecto == project.IdProyecto);
            if (currentReviewsCount >= 3)
            {
                throw new InvalidOperationException($"El proyecto ya cuenta con el límite máximo de evaluaciones permitidas ({currentReviewsCount} asignadas).");
            }

            var activeReviewsCount = await _context.Set<InvRevisionesPares>()
                .CountAsync(r => r.IdRevisor == dto.IdRevisor && r.Estado == "Pendiente");
            if (activeReviewsCount >= 3)
            {
                throw new InvalidOperationException($"El revisor seleccionado tiene demasiadas evaluaciones pendientes activas (límite de 3 simultáneas, actualmente tiene {activeReviewsCount}).");
            }

            if (dto.FechaLimite <= DateTime.Now.AddHours(23))
            {
                throw new InvalidOperationException("La fecha límite de evaluación debe ser al menos 24 horas en el futuro.");
            }
            if (dto.FechaLimite > DateTime.Now.AddDays(90))
            {
                throw new InvalidOperationException("La fecha límite de evaluación no puede ser mayor a 90 días en el futuro.");
            }

            project.AutoExtendDeadlines = dto.AutoExtendDeadlines;
            project.AutoExtendDays = dto.AutoExtendDays;

            var revision = new InvRevisionesPares
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdRevisor = dto.IdRevisor,
                FechaLimite = dto.FechaLimite,
                EsExterno = dto.EsExterno,
                EsDobleCiego = dto.EsDobleCiego,
                Estado = "Pendiente",
                FechaAsignacion = DateTime.Now
            };

            _context.Set<InvRevisionesPares>().Add(revision);
            await _context.SaveChangesAsync();

            if (dto.EsExterno)
            {
                if (revisorUser != null && !string.IsNullOrEmpty(revisorUser.EmailInstitucional))
                {
                    var plainToken = await _authService.CreateMagicLinkAsync(revisorUser.IdUsuario, dto.FechaLimite);
                    var baseUrl = GetFrontendUrl();
                    var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";
                    var emailTitle = $"Acceso de Arbitraje Científico - DIITRA";
                    string emailBody;

                    var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "AsignarArbitroExterno.html");
                    if (File.Exists(templatePath))
                    {
                        bool mostrarCredenciales = BCrypt.Net.BCrypt.Verify("Diitra2026*", revisorUser.Contrasenia);
                        var templateHtml = await File.ReadAllTextAsync(templatePath);
                        var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
                        emailBody = template(new
                        {
                            project_title = project.Titulo,
                            fecha_limite = dto.FechaLimite.ToString("dd/MM/yyyy"),
                            username = revisorUser.IdSigafi,
                            mostrar_credenciales = mostrarCredenciales
                        });
                    }
                    else
                    {
                        emailBody = $"<p>Ha sido asignado/a para realizar el arbitraje técnico del proyecto de investigación: <strong>{project.Titulo}</strong>.</p>" +
                                    $"<p>Fecha límite: {dto.FechaLimite:dd/MM/yyyy}</p>";
                    }

                    await _notificationService.NotifyUserAsync(
                        revisorUser.IdUsuario,
                        emailTitle,
                        emailBody,
                        "PEER_REVIEW",
                        magicLinkUrl
                    );
                }
            }
            else
            {
                if (revisorUser != null)
                {
                    var emailTitle = $"Nueva Asignación de Arbitraje Científico - DIITRA";
                    string emailBody;

                    var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "AsignarArbitroInterno.html");
                    if (File.Exists(templatePath))
                    {
                        var templateHtml = await File.ReadAllTextAsync(templatePath);
                        var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
                        emailBody = template(new
                        {
                            project_title = project.Titulo,
                            fecha_limite = dto.FechaLimite.ToString("dd/MM/yyyy")
                        });
                    }
                    else
                    {
                        emailBody = $"<p>Estimado/a docente, ha sido asignado/a como árbitro científico para evaluar el proyecto: <strong>{project.Titulo}</strong> antes de la fecha límite {dto.FechaLimite:dd/MM/yyyy}.</p>";
                    }

                    await _notificationService.NotifyUserAsync(
                        revisorUser.IdUsuario,
                        emailTitle,
                        emailBody,
                        "PEER_REVIEW",
                        "/revisiones"
                    );
                }
            }

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                ProyectoUuid = dto.ProjectUuid,
                IdRevisor = dto.IdRevisor,
                EsExterno = dto.EsExterno,
                EsDobleCiego = dto.EsDobleCiego,
                FechaLimite = dto.FechaLimite.ToString("dd/MM/yyyy"),
                EstadoProyecto = project.Estado
            });

            await _auditService.LogActionAsync(directorId, "ASIGNAR_ARBITRO",
                $"Árbitro asignado al proyecto '{project.Titulo}'", "PEER_REVIEW", null, afterState);

            return revision.Uuid;
        }

        public async Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
            => await AsignarArbitroAsync(dto, dto.IdRevisor);

        public async Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

            if (revision == null || revision.Estado == "Completada") return false;

            var beforeState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                EstadoAnterior = revision.Estado
            });

            _context.Set<InvRevisionesPares>().Remove(revision);
            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(directorId, "REVOCAR_ARBITRO",
                $"Asignación de árbitro revocada (UUID: {revisionUuid})", "PEER_REVIEW", beforeState, null);

            return true;
        }

        public async Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId)
        {
            var revision = await _context.Set<InvRevisionesPares>()
                .Include(r => r.Proyecto)
                .FirstOrDefaultAsync(r => r.Uuid == revisionUuid);

            if (revision == null || revision.Estado == "Completada") return false;

            var beforeState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                FechaLimiteAnterior = revision.FechaLimite.ToString("dd/MM/yyyy"),
                Estado = revision.Estado
            });

            revision.FechaLimite = nuevaFecha;

            if (revision.EsExterno)
            {
                var magicLinks = await _context.Set<InvMagicLink>()
                    .Where(l => l.IdUsuario == revision.IdRevisor && !l.Utilizado)
                    .ToListAsync();

                foreach (var link in magicLinks)
                {
                    link.FechaExpiracion = nuevaFecha;
                }
            }

            await _context.SaveChangesAsync();

            var afterState = System.Text.Json.JsonSerializer.Serialize(new
            {
                RevisionUuid = revisionUuid,
                FechaLimiteNueva = nuevaFecha.ToString("dd/MM/yyyy"),
                Estado = revision.Estado
            });

            var proyectoTitulo = revision.Proyecto?.Titulo ?? "N/A";
            await _auditService.LogActionAsync(directorId, "EXTENDER_PLAZO_ARBITRAJE",
                $"Plazo de arbitraje extendido para evaluador en proyecto '{proyectoTitulo}'", "PEER_REVIEW", beforeState, afterState);

            return true;
        }

        public async Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto)
        {
            var project = await _context.InvProyectos
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null) return false;

            project.AutoExtendDeadlines = dto.AutoExtendDeadlines;
            project.AutoExtendDays = dto.AutoExtendDays;

            await _context.SaveChangesAsync();
            return true;
        }

        private string GetFrontendUrl()
        {
            var configuredUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
            
            var httpContext = _httpContextAccessor?.HttpContext;
            if (httpContext != null)
            {
                var request = httpContext.Request;
                var host = request.Host.Value;
                
                if ((host.Contains("localhost") || host.Contains("127.0.0.1")) && 
                    (configuredUrl.Contains("localhost:3000") || configuredUrl.Contains("localhost:5173")))
                {
                    return configuredUrl;
                }
                
                var scheme = request.Scheme;
                return $"{scheme}://{host}/diitra";
            }

            return configuredUrl;
        }
    }
}
