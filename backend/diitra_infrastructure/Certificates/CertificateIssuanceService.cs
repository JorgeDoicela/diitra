using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Diitra.Application.Common.Certificates;
using Diitra.Application.Common.Documents;
using Diitra.Domain.Common.Documents;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Diitra.Infrastructure.Certificates
{
    public class CertificateIssuanceService : ICertificateIssuanceService
    {
        private readonly DiitraContext _db;
        private readonly IDocumentEngine _documentEngine;
        private readonly ILogger<CertificateIssuanceService> _logger;

        public CertificateIssuanceService(
            DiitraContext db,
            IDocumentEngine documentEngine,
            ILogger<CertificateIssuanceService> logger)
        {
            _db = db;
            _documentEngine = documentEngine;
            _logger = logger;
        }

        public async Task<IEnumerable<IssuedCertificateResultDto>> IssueProjectCompletionCertificatesAsync(
            int proyectoId, string issuedBy, CancellationToken ct = default)
        {
            var proyecto = await _db.InvProyectos
                .AsNoTracking()
                .Include(p => p.InvProyectoParticipantes)
                    .ThenInclude(part => part.IdUsuarioNavigation)
                .FirstOrDefaultAsync(p => p.IdProyecto == proyectoId, ct);

            if (proyecto == null)
            {
                throw new ArgumentException($"No se encontró el proyecto de investigación con ID {proyectoId}.");
            }

            var results = new List<IssuedCertificateResultDto>();
            var participantes = proyecto.InvProyectoParticipantes.ToList();

            if (!participantes.Any())
            {
                _logger.LogWarning("El proyecto {ProyectoId} no tiene participantes asociados en inv_proyecto_participantes.", proyectoId);
            }

            foreach (var part in participantes)
            {
                string recipientName = part.IdUsuarioNavigation?.Nombre ?? "Investigador / Participante";
                string recipientCedula = part.IdUsuarioNavigation?.IdSigafi ?? part.IdUsuario.ToString();
                string recipientRole = part.EsDirector == true ? "Director de Proyecto" : (part.Rol ?? part.TipoParticipante ?? "Investigador");

                var certificateData = new
                {
                    RecipientName = recipientName,
                    RecipientRole = recipientRole,
                    RecipientCedula = recipientCedula,
                    ProjectTitle = proyecto.Titulo,
                    ProjectCode = proyecto.CodigoInstitucional ?? proyecto.Uuid,
                    CompletionDate = DateTime.UtcNow.ToString("dd 'de' MMMM 'de' yyyy"),
                    IssuerAuthority = "Dirección de Investigación y Transferencia Tecnológica",
                    InstitutionName = "Instituto Superior Tecnológico DIITRA"
                };

                var docReq = new DocumentRequest
                {
                    TemplateCode = "CERTIFICADO_COMPLETACION",
                    Data = certificateData,
                    RequestedBy = issuedBy,
                    ProjectUuid = proyecto.Uuid,
                    ExtraVariables = new Dictionary<string, object>
                    {
                        { "recipient_name", recipientName },
                        { "recipient_role", recipientRole },
                        { "recipient_cedula", recipientCedula },
                        { "project_title", proyecto.Titulo ?? "Proyecto de Investigación" },
                        { "completion_date", DateTime.UtcNow.ToString("dd/MM/yyyy") }
                    }
                };

                try
                {
                    var docResult = await _documentEngine.GenerateAsync(docReq, ct);
                    results.Add(new IssuedCertificateResultDto
                    {
                        DocumentUuid = docResult.TraceabilityCode,
                        RecipientName = recipientName,
                        RecipientRole = recipientRole,
                        RecipientCedula = recipientCedula,
                        Title = $"Certificado de Completación - {proyecto.Titulo}",
                        IssueDate = docResult.GeneratedAt,
                        TraceabilityCode = docResult.TraceabilityCode,
                        PdfBytes = docResult.PdfBytes,
                        FileName = $"Certificado_{recipientName.Replace(" ", "_")}_{docResult.TraceabilityCode[..Math.Min(6, docResult.TraceabilityCode.Length)]}.pdf"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al generar certificado para participante {Cedula} en proyecto {ProyectoId}", recipientCedula, proyectoId);
                }
            }

            return results;
        }

        public async Task<IEnumerable<IssuedCertificateResultDto>> IssueGroupMilestoneCertificatesAsync(
            int grupoId, string milestoneTitle, string issuedBy, CancellationToken ct = default)
        {
            var grupo = await _db.InvGruposInvestigacion
                .AsNoTracking()
                .Include(g => g.InvGruposMiembros)
                    .ThenInclude(m => m.IdUsuarioNavigation)
                .FirstOrDefaultAsync(g => g.IdGrupo == grupoId, ct);

            if (grupo == null)
            {
                throw new ArgumentException($"No se encontró el grupo de investigación con ID {grupoId}.");
            }

            var results = new List<IssuedCertificateResultDto>();
            var miembros = grupo.InvGruposMiembros.ToList();

            foreach (var miembro in miembros)
            {
                string recipientName = miembro.IdUsuarioNavigation?.Nombre ?? "Miembro Investigador";
                string recipientCedula = miembro.IdUsuarioNavigation?.IdSigafi ?? miembro.IdUsuario.ToString();
                string recipientRole = miembro.Rol ?? "Miembro";

                var certificateData = new
                {
                    RecipientName = recipientName,
                    RecipientRole = recipientRole,
                    RecipientCedula = recipientCedula,
                    GroupName = grupo.Nombre,
                    MilestoneTitle = milestoneTitle,
                    CompletionDate = DateTime.UtcNow.ToString("dd 'de' MMMM 'de' yyyy"),
                    InstitutionName = "Instituto Superior Tecnológico DIITRA"
                };

                var docReq = new DocumentRequest
                {
                    TemplateCode = "CERTIFICADO_PARTICIPACION_GRUPO",
                    Data = certificateData,
                    RequestedBy = issuedBy,
                    ExtraVariables = new Dictionary<string, object>
                    {
                        { "recipient_name", recipientName },
                        { "recipient_role", recipientRole },
                        { "recipient_cedula", recipientCedula },
                        { "group_name", grupo.Nombre ?? "Grupo de Investigación" },
                        { "milestone_title", milestoneTitle }
                    }
                };

                try
                {
                    var docResult = await _documentEngine.GenerateAsync(docReq, ct);
                    results.Add(new IssuedCertificateResultDto
                    {
                        DocumentUuid = docResult.TraceabilityCode,
                        RecipientName = recipientName,
                        RecipientRole = recipientRole,
                        RecipientCedula = recipientCedula,
                        Title = $"Certificado Grupo - {grupo.Nombre}",
                        IssueDate = docResult.GeneratedAt,
                        TraceabilityCode = docResult.TraceabilityCode,
                        PdfBytes = docResult.PdfBytes,
                        FileName = $"Certificado_Grupo_{recipientName.Replace(" ", "_")}.pdf"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al generar certificado de grupo para miembro {MiembroId}", miembro.IdGrupoMiembro);
                }
            }

            return results;
        }

        public async Task<IssuedCertificateResultDto> IssueIndividualCertificateAsync(
            string userCedula, string recipientRole, string certificateTitle, string certificateDescription,
            string templateCode, string issuedBy, CancellationToken ct = default)
        {
            string recipientName = "Investigador / Docente / Estudiante";
            var prof = await _db.Profesores.AsNoTracking().FirstOrDefaultAsync(p => p.IdProfesor == userCedula, ct);
            if (prof != null)
            {
                recipientName = $"{prof.Nombres} {prof.Apellidos}".Trim();
            }
            else
            {
                var alum = await _db.Alumnos.AsNoTracking().FirstOrDefaultAsync(a => a.IdAlumno == userCedula, ct);
                if (alum != null)
                {
                    recipientName = $"{alum.PrimerNombre} {alum.ApellidoPaterno}".Trim();
                }
            }

            var certificateData = new
            {
                RecipientName = recipientName,
                RecipientRole = recipientRole,
                RecipientCedula = userCedula,
                CertificateTitle = certificateTitle,
                CertificateDescription = certificateDescription,
                IssueDate = DateTime.UtcNow.ToString("dd 'de' MMMM 'de' yyyy"),
                InstitutionName = "Instituto Superior Tecnológico DIITRA"
            };

            var docReq = new DocumentRequest
            {
                TemplateCode = string.IsNullOrWhiteSpace(templateCode) ? "CERTIFICADO_COMPLETACION" : templateCode,
                Data = certificateData,
                RequestedBy = issuedBy,
                ExtraVariables = new Dictionary<string, object>
                {
                    { "recipient_name", recipientName },
                    { "recipient_role", recipientRole },
                    { "recipient_cedula", userCedula },
                    { "certificate_title", certificateTitle },
                    { "certificate_description", certificateDescription }
                }
            };

            var docResult = await _documentEngine.GenerateAsync(docReq, ct);

            return new IssuedCertificateResultDto
            {
                DocumentUuid = docResult.TraceabilityCode,
                RecipientName = recipientName,
                RecipientRole = recipientRole,
                RecipientCedula = userCedula,
                Title = certificateTitle,
                IssueDate = docResult.GeneratedAt,
                TraceabilityCode = docResult.TraceabilityCode,
                PdfBytes = docResult.PdfBytes,
                FileName = $"Certificado_{recipientName.Replace(" ", "_")}.pdf"
            };
        }

        public async Task<CertificateVerificationResultDto?> VerifyCertificateAsync(string certificateUuid, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(certificateUuid)) return null;

            var instance = await _db.DocumentInstances
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.TraceabilityCode == certificateUuid || d.Uuid == certificateUuid, ct);

            if (instance == null)
            {
                return new CertificateVerificationResultDto
                {
                    IsValid = false
                };
            }

            string recipientName = "Registrado en Certificado";
            string recipientRole = "Participante";
            string recipientCedula = "";

            if (!string.IsNullOrEmpty(instance.DataSnapshotJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(instance.DataSnapshotJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("RecipientName", out var pName)) recipientName = pName.GetString() ?? recipientName;
                    if (root.TryGetProperty("RecipientRole", out var pRole)) recipientRole = pRole.GetString() ?? recipientRole;
                    if (root.TryGetProperty("RecipientCedula", out var pCed)) recipientCedula = pCed.GetString() ?? recipientCedula;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "No se pudo parsear DataSnapshotJson para la verificación de certificado {TraceabilityCode}", instance.TraceabilityCode);
                }
            }

            return new CertificateVerificationResultDto
            {
                IsValid = true,
                RecipientName = recipientName,
                RecipientRole = recipientRole,
                RecipientCedula = recipientCedula,
                CertificateType = instance.TemplateCode,
                Title = $"Certificado Oficial - {instance.TemplateCode}",
                IssueDate = instance.CreatedAt,
                TraceabilityCode = instance.TraceabilityCode ?? instance.Uuid,
                TemplateVersion = instance.TemplateVersion,
                Issuer = "Instituto Superior Tecnológico DIITRA - Dirección de Investigación"
            };
        }

        public async Task<IEnumerable<IssuedCertificateResultDto>> GetCertificatesForUserAsync(string userCedulaOrId, CancellationToken ct = default)
        {
            var instances = await _db.DocumentInstances
                .AsNoTracking()
                .Where(d => d.TemplateCode.StartsWith("CERTIFICADO_") && (d.CreatedBy == userCedulaOrId || (d.DataSnapshotJson != null && d.DataSnapshotJson.Contains(userCedulaOrId))))
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync(ct);

            var list = new List<IssuedCertificateResultDto>();

            foreach (var inst in instances)
            {
                string recipientName = "Usuario";
                string recipientRole = "Participante";
                string recipientCedula = userCedulaOrId;

                if (!string.IsNullOrEmpty(inst.DataSnapshotJson))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(inst.DataSnapshotJson);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("RecipientName", out var pName)) recipientName = pName.GetString() ?? recipientName;
                        if (root.TryGetProperty("RecipientRole", out var pRole)) recipientRole = pRole.GetString() ?? recipientRole;
                        if (root.TryGetProperty("RecipientCedula", out var pCed)) recipientCedula = pCed.GetString() ?? recipientCedula;
                    }
                    catch { }
                }

                list.Add(new IssuedCertificateResultDto
                {
                    DocumentUuid = inst.Uuid,
                    RecipientName = recipientName,
                    RecipientRole = recipientRole,
                    RecipientCedula = recipientCedula,
                    Title = $"Certificado {inst.TemplateCode}",
                    IssueDate = inst.CreatedAt,
                    TraceabilityCode = inst.TraceabilityCode ?? inst.Uuid,
                    PdfBytes = Array.Empty<byte>(),
                    FileName = $"Certificado_{inst.Uuid[..Math.Min(6, inst.Uuid.Length)]}.pdf"
                });
            }

            return list;
        }
    }
}
