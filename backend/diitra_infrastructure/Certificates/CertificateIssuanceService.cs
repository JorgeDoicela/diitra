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
            var recipients = new List<(string Name, string Cedula, string Role)>();

            foreach (var part in proyecto.InvProyectoParticipantes)
            {
                string name = part.IdUsuarioNavigation?.Nombre ?? "Investigador / Participante";
                string cedula = part.IdUsuarioNavigation?.IdSigafi ?? part.IdUsuario.ToString();
                string role = part.EsDirector == true ? "Director de Proyecto" : (part.Rol ?? part.TipoParticipante ?? "Investigador");
                recipients.Add((name, cedula, role));
            }

            // Fallback 1: Firmantes oficiales del proyecto en InvDocumentoFirmas
            var docUuids = await _db.DocumentInstances
                .Where(d => d.EntityUuid == proyecto.Uuid)
                .Select(d => d.Uuid)
                .ToListAsync(ct);

            var firmas = await _db.InvDocumentoFirmas
                .AsNoTracking()
                .Where(f => (f.DocumentoUuid == proyecto.Uuid || docUuids.Contains(f.DocumentoUuid)) && f.EsValida)
                .ToListAsync(ct);

            foreach (var firma in firmas)
            {
                string fName = "";
                if (!string.IsNullOrEmpty(firma.FirmaMetadata))
                {
                    try
                    {
                        using var docF = JsonDocument.Parse(firma.FirmaMetadata);
                        if (docF.RootElement.TryGetProperty("nombre_completo", out var nc)) fName = nc.GetString() ?? "";
                        if (string.IsNullOrEmpty(fName) && docF.RootElement.TryGetProperty("NombreCompleto", out var ncc)) fName = ncc.GetString() ?? "";
                    }
                    catch { }
                }
                if (string.IsNullOrEmpty(fName)) fName = "Director de Proyecto";

                if (!string.IsNullOrEmpty(firma.FirmanteId) && !recipients.Any(r => r.Cedula == firma.FirmanteId))
                {
                    recipients.Add((fName, firma.FirmanteId, firma.FirmanteRol ?? "Director de Proyecto"));
                }
            }

            // Fallback 2: Parsear MetadataCacesJson
            if (!string.IsNullOrEmpty(proyecto.MetadataCacesJson))
            {
                try
                {
                    using var docMeta = JsonDocument.Parse(proyecto.MetadataCacesJson);
                    if (docMeta.RootElement.TryGetProperty("investigadores", out var invList) && invList.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in invList.EnumerateArray())
                        {
                            string name = elem.TryGetProperty("nombres_completos", out var n) ? n.GetString() ?? "" : "";
                            if (string.IsNullOrEmpty(name) && elem.TryGetProperty("nombresCompletos", out var nc)) name = nc.GetString() ?? "";
                            if (string.IsNullOrEmpty(name) && elem.TryGetProperty("nombre", out var nom)) name = nom.GetString() ?? "";
                            
                            string cedula = elem.TryGetProperty("cedula", out var c) ? c.GetString() ?? "" : "";
                            string role = elem.TryGetProperty("rol", out var ro) ? ro.GetString() ?? "Investigador" : "Investigador";

                            if (!string.IsNullOrEmpty(name) && !recipients.Any(r => r.Name.Equals(name, StringComparison.OrdinalIgnoreCase) || (!string.IsNullOrEmpty(cedula) && r.Cedula == cedula)))
                            {
                                recipients.Add((name, string.IsNullOrEmpty(cedula) ? name : cedula, role));
                            }
                        }
                    }
                }
                catch { }
            }

            Console.WriteLine($"[DIITRA] [CertificateService] Iniciando emisión para proyecto ID {proyectoId} ({proyecto.Titulo})...");
            Console.WriteLine($"[DIITRA] [CertificateService] Total destinatarios encontrados: {recipients.Count}");

            foreach (var (recipientName, recipientCedula, recipientRole) in recipients)
            {
                Console.WriteLine($"[DIITRA] [CertificateService] Generando certificado para: {recipientName} (ID/Cédula: {recipientCedula}, Rol: {recipientRole})");

                var certificateData = new
                {
                    RecipientName = recipientName,
                    RecipientRole = recipientRole,
                    RecipientCedula = recipientCedula,
                    ProjectTitle = proyecto.Titulo,
                    ProjectCode = proyecto.CodigoInstitucional ?? proyecto.Uuid,
                    CompletionDate = DateTime.UtcNow.ToString("dd 'de' MMMM 'de' yyyy"),
                    IssuerAuthority = "Dirección de Investigación y Transferencia Tecnológica",
                    InstitutionName = "Instituto Superior Tecnológico Mayor Pedro Traversari"
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
                    
                    var inst = DocumentInstance.Create(
                        templateCode: "CERTIFICADO_COMPLETACION",
                        templateVersion: 1,
                        entityUuid: recipientCedula,
                        createdBy: recipientCedula,
                        title: $"Certificado de Completación - {proyecto.Titulo}",
                        entityType: "Certificado",
                        dataSnapshotJson: JsonSerializer.Serialize(certificateData)
                    );
                    inst.Finalize(string.Empty, docResult.FileHash, docResult.TraceabilityCode);
                    _db.DocumentInstances.Add(inst);

                    Console.WriteLine($"[DIITRA] [CertificateService] Certificado emitido exitosamente. TraceabilityCode: {docResult.TraceabilityCode}");

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
                    Console.WriteLine($"[DIITRA] [CertificateService] ERROR al generar certificado para {recipientName}: {ex.Message}");
                    _logger.LogError(ex, "Error al generar certificado para participante {Cedula} en proyecto {ProyectoId}", recipientCedula, proyectoId);
                }
            }

            if (results.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
                Console.WriteLine($"[DIITRA] [CertificateService] {results.Count} certificados guardados en BD con éxito.");
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
                    InstitutionName = "Instituto Superior Tecnológico Mayor Pedro Traversari"
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

                    var inst = DocumentInstance.Create(
                        templateCode: "CERTIFICADO_PARTICIPACION_GRUPO",
                        templateVersion: 1,
                        entityUuid: recipientCedula,
                        createdBy: recipientCedula,
                        title: $"Certificado Grupo - {grupo.Nombre}",
                        entityType: "Certificado",
                        dataSnapshotJson: JsonSerializer.Serialize(certificateData)
                    );
                    inst.Finalize(string.Empty, docResult.FileHash, docResult.TraceabilityCode);
                    _db.DocumentInstances.Add(inst);

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

            if (results.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
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
                InstitutionName = "Instituto Superior Tecnológico Mayor Pedro Traversari"
            };

            string tplCode = string.IsNullOrWhiteSpace(templateCode) ? "CERTIFICADO_COMPLETACION" : templateCode;

            var docReq = new DocumentRequest
            {
                TemplateCode = tplCode,
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

            var inst = DocumentInstance.Create(
                templateCode: tplCode,
                templateVersion: 1,
                entityUuid: userCedula,
                createdBy: userCedula,
                title: certificateTitle,
                entityType: "Certificado",
                dataSnapshotJson: JsonSerializer.Serialize(certificateData)
            );
            inst.Finalize(string.Empty, docResult.FileHash, docResult.TraceabilityCode);
            _db.DocumentInstances.Add(inst);
            await _db.SaveChangesAsync(ct);

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
                Title = !string.IsNullOrWhiteSpace(instance.Title) ? instance.Title : $"Certificado Oficial - {instance.TemplateCode}",
                IssueDate = instance.CreatedAt,
                TraceabilityCode = instance.TraceabilityCode ?? instance.Uuid,
                TemplateVersion = instance.TemplateVersion,
                Issuer = "Instituto Superior Tecnológico Mayor Pedro Traversari - Dirección de Investigación (DIITRA)"
            };
        }

        public async Task<IEnumerable<IssuedCertificateResultDto>> GetCertificatesForUserAsync(string userCedulaOrId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userCedulaOrId)) return Enumerable.Empty<IssuedCertificateResultDto>();

            var userIdentities = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { userCedulaOrId };

            // Buscar usuario en base de datos para obtener todos sus alias/identificadores
            var dbUser = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdSigafi == userCedulaOrId || u.EmailInstitucional == userCedulaOrId || u.Nombre == userCedulaOrId || u.IdUsuario.ToString() == userCedulaOrId, ct);

            if (dbUser != null)
            {
                userIdentities.Add(dbUser.IdUsuario.ToString());
                if (!string.IsNullOrEmpty(dbUser.IdSigafi)) userIdentities.Add(dbUser.IdSigafi);
                if (!string.IsNullOrEmpty(dbUser.EmailInstitucional)) userIdentities.Add(dbUser.EmailInstitucional);
                if (!string.IsNullOrEmpty(dbUser.Nombre)) userIdentities.Add(dbUser.Nombre);
            }

            var instances = await _db.DocumentInstances
                .AsNoTracking()
                .Where(d => d.TemplateCode.StartsWith("CERTIFICADO_"))
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync(ct);

            // Filtrar en memoria por cualquiera de las identidades válidas
            var matchedInstances = instances.Where(d =>
                userIdentities.Contains(d.CreatedBy ?? "") ||
                userIdentities.Contains(d.EntityUuid ?? "") ||
                userIdentities.Any(id => d.DataSnapshotJson != null && d.DataSnapshotJson.Contains(id))
            ).ToList();

            Console.WriteLine($"[DIITRA] [GetCertificatesForUserAsync] Solicitado: '{userCedulaOrId}'. Alias: [{string.Join(", ", userIdentities)}]. Total certificados en BD: {instances.Count}. Coincidentes: {matchedInstances.Count}");

            var list = new List<IssuedCertificateResultDto>();

            foreach (var inst in matchedInstances)
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
                    DocumentUuid = inst.TraceabilityCode ?? inst.Uuid,
                    RecipientName = recipientName,
                    RecipientRole = recipientRole,
                    RecipientCedula = recipientCedula,
                    Title = !string.IsNullOrWhiteSpace(inst.Title) ? inst.Title : $"Certificado {inst.TemplateCode}",
                    IssueDate = inst.CreatedAt,
                    TraceabilityCode = inst.TraceabilityCode ?? inst.Uuid,
                    PdfBytes = Array.Empty<byte>(),
                    FileName = $"Certificado_{recipientName.Replace(" ", "_")}.pdf"
                });
            }

            return list;
        }
    }
}
