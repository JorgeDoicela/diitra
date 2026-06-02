using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using diitra_application.Common.Notifications;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;
using Diitra.Application.Common.Documents;
using Diitra.Application.Research;

namespace diitra_infrastructure.Common.Notifications
{
    public class EmailEngineService : IEmailEngineService
    {
        private readonly DiitraContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailEngineService> _logger;
        private readonly IDocumentEngine _documentEngine;
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly diitra_infrastructure.Security.IFirmaElectronicaService _firmaElectronicaService;

        public EmailEngineService(
            DiitraContext context,
            IConfiguration configuration,
            ILogger<EmailEngineService> logger,
            IDocumentEngine documentEngine,
            IProjectOrchestrator projectOrchestrator,
            diitra_infrastructure.Security.IFirmaElectronicaService firmaElectronicaService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _documentEngine = documentEngine;
            _projectOrchestrator = projectOrchestrator;
            _firmaElectronicaService = firmaElectronicaService;
        }

        public async Task<IEnumerable<EmailTemplateDto>> GetTemplatesAsync()
        {
            var list = await _context.InvEmailTemplates
                .OrderByDescending(t => t.FechaCreado)
                .ToListAsync();

            return list.Select(MapToTemplateDto);
        }

        public async Task<EmailTemplateDto?> GetTemplateByIdAsync(int id)
        {
            var template = await _context.InvEmailTemplates.FindAsync(id);
            return template != null ? MapToTemplateDto(template) : null;
        }

        public async Task<EmailTemplateDto?> GetTemplateByCodigoAsync(string codigo)
        {
            var template = await _context.InvEmailTemplates
                .FirstOrDefaultAsync(t => t.Codigo == codigo);
            return template != null ? MapToTemplateDto(template) : null;
        }

        public async Task<EmailTemplateDto> CreateTemplateAsync(EmailTemplateDto dto)
        {
            var entity = new InvEmailTemplate
            {
                Uuid = string.IsNullOrEmpty(dto.Uuid) ? Guid.NewGuid().ToString() : dto.Uuid,
                Codigo = dto.Codigo,
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                Asunto = dto.Asunto,
                CuerpoHtml = dto.CuerpoHtml,
                Activo = dto.Activo,
                FechaCreado = DateTime.UtcNow,
                FechaActualizado = DateTime.UtcNow
            };

            _context.InvEmailTemplates.Add(entity);
            await _context.SaveChangesAsync();
            
            return MapToTemplateDto(entity);
        }

        public async Task<EmailTemplateDto> UpdateTemplateAsync(EmailTemplateDto dto)
        {
            var entity = await _context.InvEmailTemplates.FindAsync(dto.IdEmailTemplate);
            if (entity == null) throw new KeyNotFoundException("Plantilla no encontrada");

            entity.Codigo = dto.Codigo;
            entity.Nombre = dto.Nombre;
            entity.Descripcion = dto.Descripcion;
            entity.Asunto = dto.Asunto;
            entity.CuerpoHtml = dto.CuerpoHtml;
            entity.Activo = dto.Activo;
            entity.FechaActualizado = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToTemplateDto(entity);
        }

        public async Task DeleteTemplateAsync(int id)
        {
            var template = await _context.InvEmailTemplates.FindAsync(id);
            if (template != null)
            {
                _context.InvEmailTemplates.Remove(template);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<EmailHistorialDto>> GetEmailHistoryAsync(int limit = 100)
        {
            var list = await _context.InvEmailHistorials
                .Include(h => h.IdUsuarioDestinatarioNavigation)
                .OrderByDescending(h => h.FechaEnvio)
                .Take(limit)
                .ToListAsync();

            return list.Select(MapToHistorialDto);
        }

        public async Task<bool> SendTemplatedEmailAsync(EmailSendRequest request)
        {
            _logger.LogInformation("Iniciando envío de correo dinámico por el motor de email...");

            // 1. Obtener destinatarios
            var recipientEmails = new List<(string Email, int? UserId, string Name)>();

            // Destinatarios explícitos por correo
            foreach (var email in request.DestinatariosEmails)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailInstitucional == email);
                recipientEmails.Add((email, user?.IdUsuario, user?.Nombre ?? "Investigador/a"));
            }

            // Destinatarios por IdUsuario
            foreach (var userId in request.DestinatariosUserIds)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null && !string.IsNullOrEmpty(user.EmailInstitucional))
                {
                    recipientEmails.Add((user.EmailInstitucional, user.IdUsuario, user.Nombre ?? "Investigador/a"));
                }
            }

            // Destinatarios por Rol y Carrera
            if (!string.IsNullOrEmpty(request.TargetRole) || request.TargetCarreraId.HasValue)
            {
                IQueryable<User> usersQuery = _context.Users.Where(u => u.Activo);

                if (!string.IsNullOrEmpty(request.TargetRole))
                {
                    var roleCodes = new List<string> { request.TargetRole, $"DIITRA_{request.TargetRole}" };
                    usersQuery = _context.UserRoles
                        .Include(ur => ur.User)
                        .Include(ur => ur.Role)
                        .Where(ur => roleCodes.Contains(ur.Role.CodigoRol) && (ur.EsActivo ?? true))
                        .Select(ur => ur.User)
                        .Where(u => u != null && u.Activo);
                }

                if (request.TargetCarreraId.HasValue)
                {
                    var userIdsInCarrera = await _context.InvProyectosProfesores
                        .Include(pp => pp.IdProyectoNavigation)
                        .ThenInclude(p => p.InvProyectosCarreras)
                        .Where(pp => pp.IdProyectoNavigation.InvProyectosCarreras.Any(pc => pc.IdCarrera == request.TargetCarreraId.Value))
                        .Select(pp => pp.IdUsuario)
                        .Distinct()
                        .ToListAsync();

                    usersQuery = usersQuery.Where(u => userIdsInCarrera.Contains(u.IdUsuario));
                }

                var list = await usersQuery.ToListAsync();
                foreach (var u in list)
                {
                    if (!string.IsNullOrEmpty(u.EmailInstitucional))
                    {
                        recipientEmails.Add((u.EmailInstitucional, u.IdUsuario, u.Nombre ?? "Investigador/a"));
                    }
                }
            }

            // Eliminar duplicados
            recipientEmails = recipientEmails.GroupBy(r => r.Email.ToLower().Trim()).Select(g => g.First()).ToList();

            if (!recipientEmails.Any())
            {
                _logger.LogWarning("No se encontraron destinatarios válidos para el envío de correo.");
                return false;
            }

            // 2. Obtener plantilla o usar cuerpo personalizado
            string subjectTemplate = request.CustomSubject ?? "Notificación DIITRA";
            string bodyTemplate = request.CustomBody ?? "";

            if (!string.IsNullOrEmpty(request.TemplateCodigo))
            {
                var template = await GetTemplateByCodigoAsync(request.TemplateCodigo);
                if (template != null)
                {
                    subjectTemplate = request.CustomSubject ?? template.Asunto;
                    bodyTemplate = request.CustomBody ?? template.CuerpoHtml;
                }
                else
                {
                    _logger.LogWarning("Plantilla '{TemplateCodigo}' no encontrada. Usando valores custom/default.", request.TemplateCodigo);
                }
            }

            // 3. Configurar SMTP
            var host = _configuration["Email:Host"];
            var isMock = string.IsNullOrEmpty(host);

            var port = int.Parse(_configuration["Email:Port"] ?? "587");
            var smtpUser = _configuration["Email:Username"];
            var smtpPass = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:FromEmail"] ?? "no-reply@diitra.istpet.edu.ec";
            var fromName = _configuration["Email:FromName"] ?? "DIITRA Notificaciones";

            var frontendUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";

            var isAllSuccess = true;

            // 3.5. Cargar variables de contexto dinámico (una sola vez por envío)
            var contextReplacements = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(request.EntityType) && !string.IsNullOrEmpty(request.EntityUuid))
            {
                try
                {
                    if (request.EntityType.Equals("Proyecto", StringComparison.OrdinalIgnoreCase))
                    {
                        var proj = await _context.InvProyectos
                            .Include(p => p.IdSublineaNavigation)
                            .ThenInclude(s => s!.IdLineaNavigation)
                            .Include(p => p.InvProyectosProfesores)
                            .ThenInclude(pp => pp.IdUsuarioNavigation)
                            .FirstOrDefaultAsync(p => p.Uuid == request.EntityUuid);
                        if (proj != null)
                        {
                            var dir = proj.InvProyectosProfesores.FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false)?.IdUsuarioNavigation;
                            contextReplacements["[[proyecto_titulo]]"] = proj.Titulo ?? "";
                            contextReplacements["[[proyecto_codigo]]"] = proj.CodigoInstitucional ?? "";
                            contextReplacements["[[proyecto_descripcion]]"] = proj.DescripcionProyecto ?? "";
                            contextReplacements["[[proyecto_estado]]"] = proj.Estado ?? "";
                            contextReplacements["[[proyecto_director]]"] = dir?.Nombre ?? "Sin asignar";
                            contextReplacements["[[proyecto_director_email]]"] = dir?.EmailInstitucional ?? "";
                            contextReplacements["[[linea_investigacion]]"] = proj.IdSublineaNavigation?.IdLineaNavigation?.NombreLinea ?? "General";
                            contextReplacements["[[proyecto_sublinea]]"] = proj.IdSublineaNavigation?.Nombre ?? "No asignada";
                            contextReplacements["[[proyecto_workspace_url]]"] = $"{frontendUrl}/investigacion/proyectos/workspace/{proj.Uuid}";
                        }
                    }
                    else if (request.EntityType.Equals("Convocatoria", StringComparison.OrdinalIgnoreCase))
                    {
                        var conv = await _context.InvConvocatorias
                            .FirstOrDefaultAsync(c => c.Uuid == request.EntityUuid);
                        if (conv != null)
                        {
                            contextReplacements["[[convocatoria_titulo]]"] = conv.Titulo ?? "";
                            contextReplacements["[[convocatoria_codigo]]"] = conv.CodigoConvocatoria ?? "";
                            contextReplacements["[[convocatoria_anio]]"] = conv.Anio.ToString();
                            contextReplacements["[[convocatoria_apertura]]"] = conv.FechaApertura.ToString("yyyy-MM-dd");
                            contextReplacements["[[convocatoria_cierre]]"] = conv.FechaCierre.ToString("yyyy-MM-dd");
                            contextReplacements["[[convocatoria_presupuesto]]"] = conv.PresupuestoTotal?.ToString("C") ?? "$0.00";
                            contextReplacements["[[convocatoria_monto_maximo]]"] = conv.MontoMaximoProyecto?.ToString("C") ?? "$0.00";
                            contextReplacements["[[convocatoria_bases_url]]"] = conv.UrlBases ?? "";
                            contextReplacements["[[convocatoria_estado]]"] = conv.Estado ?? "";
                        }
                    }
                    else if (request.EntityType.Equals("PeerReview", StringComparison.OrdinalIgnoreCase) || request.EntityType.Equals("RevisionesPares", StringComparison.OrdinalIgnoreCase))
                    {
                        var rev = await _context.InvRevisionesPares
                            .Include(r => r.Revisor)
                            .Include(r => r.Proyecto)
                            .FirstOrDefaultAsync(r => r.Uuid == request.EntityUuid);
                        if (rev != null)
                        {
                            contextReplacements["[[revisor_nombre]]"] = rev.Revisor?.Nombre ?? "Sin asignar";
                            contextReplacements["[[revisor_email]]"] = rev.Revisor?.EmailInstitucional ?? "";
                            contextReplacements["[[proyecto_titulo]]"] = rev.Proyecto?.Titulo ?? "";
                            contextReplacements["[[peer_review_dictamen]]"] = rev.DictamenRevisor ?? "";
                            contextReplacements["[[peer_review_estado]]"] = rev.Estado ?? "";
                            contextReplacements["[[peer_review_fecha_limite]]"] = rev.FechaLimite.ToString("yyyy-MM-dd");
                            contextReplacements["[[peer_review_puntaje]]"] = rev.PuntajeTotal?.ToString() ?? "0";
                            contextReplacements["[[peer_review_observaciones]]"] = rev.ObservacionesGral ?? "";
                            contextReplacements["[[peer_review_tipo]]"] = rev.EsExterno ? "Externo" : "Interno";
                            contextReplacements["[[peer_review_anonimo]]"] = rev.EsDobleCiego ? "Doble Ciego" : "Abierto";
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al cargar variables de contexto dinámico para '{EntityType}' con UUID '{EntityUuid}'", request.EntityType, request.EntityUuid);
                }
            }

            foreach (var recipient in recipientEmails)
            {
                // Inyectar variables específicas del destinatario y del contexto
                var replacements = new Dictionary<string, string>(request.TemplateData);
                foreach (var kvp in contextReplacements)
                {
                    replacements[kvp.Key] = kvp.Value;
                }
                replacements["[[destinatario_nombre]]"] = recipient.Name;
                replacements["[[destinatario_email]]"] = recipient.Email;
                replacements["[[anio_actual]]"] = DateTime.UtcNow.Year.ToString();
                replacements["[[institucion_nombre]]"] = "Instituto Superior Tecnológico Traversari";
                replacements["[[sistema_url]]"] = frontendUrl;

                // Reemplazar tokens en asunto y cuerpo
                var finalSubject = ReplaceTokens(subjectTemplate, replacements);
                var finalBody = ReplaceTokens(bodyTemplate, replacements);

                var historyEntry = new InvEmailHistorial
                {
                    Uuid = Guid.NewGuid().ToString(),
                    Destinatario = recipient.Email,
                    IdUsuarioDestinatario = recipient.UserId,
                    Asunto = finalSubject,
                    Cuerpo = finalBody,
                    Estado = "Pendiente",
                    FechaEnvio = DateTime.UtcNow,
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        entityUuid = request.EntityUuid,
                        entityType = request.EntityType,
                        templateCodigo = request.TemplateCodigo
                    })
                };

                // Procesar adjuntos
                var mailAttachments = new List<Attachment>();
                var attachmentsMeta = new List<object>();

                foreach (var adj in request.Attachments)
                {
                    Attachment? mailAttachment = null;

                    if (!string.IsNullOrEmpty(adj.Base64Content))
                    {
                        var bytes = Convert.FromBase64String(adj.Base64Content);
                        var ms = new MemoryStream(bytes);
                        mailAttachment = new Attachment(ms, adj.NombreArchivo, adj.ContentType ?? "application/octet-stream");
                    }
                    else if (!string.IsNullOrEmpty(adj.RutaArchivo))
                    {
                        if (adj.RutaArchivo.StartsWith("SYSTEM:"))
                        {
                            var templateCode = adj.RutaArchivo.Substring("SYSTEM:".Length);
                            try
                            {
                                _logger.LogInformation("Generando documento dinámico del sistema '{TemplateCode}' para adjuntarlo al correo...", templateCode);
                                
                                object? documentData = null;
                                string? projectUuidRef = null;
                                string? entityUuidRef = request.EntityUuid;

                                if (templateCode.Equals("PROTOCOLO_INVESTIGACION", StringComparison.OrdinalIgnoreCase))
                                {
                                    if (!string.IsNullOrEmpty(request.EntityUuid))
                                    {
                                        documentData = await _projectOrchestrator.GetProjectDetailAsync(request.EntityUuid);
                                        projectUuidRef = request.EntityUuid;
                                    }
                                    else
                                    {
                                        _logger.LogWarning("No se proporcionó EntityUuid para generar PROTOCOLO_INVESTIGACION. Se omitirá.");
                                    }
                                }
                                else if (templateCode.Equals("DICTAMEN_ARBITRAJE", StringComparison.OrdinalIgnoreCase))
                                {
                                    if (!string.IsNullOrEmpty(request.EntityUuid))
                                    {
                                        documentData = await BuildDictamenArbitrajeDataAsync(request.EntityUuid);
                                        projectUuidRef = request.EntityUuid;
                                    }
                                    else
                                    {
                                        _logger.LogWarning("No se proporcionó EntityUuid para generar DICTAMEN_ARBITRAJE. Se omitirá.");
                                    }
                                }
                                else if (templateCode.Equals("RUBRICA_EVALUACION", StringComparison.OrdinalIgnoreCase) || templateCode.Equals("RUBRICA_DINAMICA", StringComparison.OrdinalIgnoreCase))
                                {
                                    if (!string.IsNullOrEmpty(request.EntityUuid))
                                    {
                                        documentData = await _projectOrchestrator.GetProjectDetailAsync(request.EntityUuid);
                                        projectUuidRef = request.EntityUuid;
                                    }
                                }

                                if (documentData != null)
                                {
                                    var docRequest = new DocumentRequest
                                    {
                                        TemplateCode = templateCode.Equals("RUBRICA_DINAMICA", StringComparison.OrdinalIgnoreCase) ? "RUBRICA_EVALUACION" : templateCode,
                                        Data = documentData,
                                        IsDraftMode = false,
                                        IsBlindMode = false,
                                        RequestedBy = "Sistema DIITRA Email Engine",
                                        ProjectUuid = projectUuidRef,
                                        EntityUuid = entityUuidRef
                                    };

                                    var docResult = await _documentEngine.GenerateAsync(docRequest);
                                    if (docResult?.PdfBytes != null && docResult.PdfBytes.Length > 0)
                                    {
                                        byte[] finalBytes = docResult.PdfBytes;

                                        // Aplicar firma electrónica digital avanzada si se provee certificado y contraseña (DIITRA Builder Style)
                                        if (!string.IsNullOrEmpty(request.CertificateBase64) && !string.IsNullOrEmpty(request.SignaturePassword))
                                        {
                                            try
                                            {
                                                _logger.LogInformation("DIITRA Email Engine: Aplicando firma electrónica PAdES al documento del sistema '{TemplateCode}'...", templateCode);
                                                byte[] certificateBytes = Convert.FromBase64String(request.CertificateBase64);

                                                if (_firmaElectronicaService.ValidateCertificate(certificateBytes, request.SignaturePassword))
                                                {
                                                    finalBytes = _firmaElectronicaService.SignPdf(docResult.PdfBytes, certificateBytes, request.SignaturePassword,
                                                        reason: $"Firma de Aprobación de Documento - {templateCode}",
                                                        location: "Quito, Ecuador");
                                                    _logger.LogInformation("Firma digital aplicada exitosamente al documento del sistema '{TemplateCode}'", templateCode);

                                                    // Actualizar el hash del archivo firmado en inv_document_audit para no romper la cadena de custodia CACES
                                                    try
                                                    {
                                                        using var sha256 = System.Security.Cryptography.SHA256.Create();
                                                        var signedHash = Convert.ToHexString(sha256.ComputeHash(finalBytes)).ToLower();

                                                        var auditEntry = await _context.DocumentAuditEntries
                                                            .FirstOrDefaultAsync(a => a.TraceabilityCode == docResult.TraceabilityCode);
                                                         if (auditEntry != null)
                                                         {
                                                             auditEntry.UpdateFileHash(signedHash);
                                                             await _context.SaveChangesAsync();
                                                            _logger.LogInformation("Se actualizó el hash del documento firmado en inv_document_audit a: {Hash}", signedHash);
                                                        }
                                                    }
                                                    catch (Exception ex)
                                                    {
                                                        _logger.LogError(ex, "Error al actualizar el hash del PDF firmado en inv_document_audit para la plantilla '{TemplateCode}'", templateCode);
                                                    }
                                                }
                                                else
                                                {
                                                    _logger.LogWarning("La firma electrónica para '{TemplateCode}' falló: Certificado corrupto o clave incorrecta.", templateCode);
                                                }
                                            }
                                            catch (Exception ex)
                                            {
                                                _logger.LogError(ex, "Error crítico aplicando firma digital en Email Engine para '{TemplateCode}'", templateCode);
                                            }
                                        }

                                        var ms = new MemoryStream(finalBytes);
                                        mailAttachment = new Attachment(ms, docResult.FileName ?? $"{templateCode.ToLower()}_{DateTime.Now:yyyyMMdd}.pdf", "application/pdf");
                                        _logger.LogInformation("Documento '{FileName}' generado y adjuntado con éxito.", docResult.FileName);
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning("No se pudieron resolver datos válidos para la plantilla '{TemplateCode}'.", templateCode);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error crítico al generar el PDF del sistema '{TemplateCode}' para el correo.", templateCode);
                            }
                        }
                        else
                        {
                            var storagePath = _configuration["Storage:BasePath"] ?? Path.Combine(AppContext.BaseDirectory, "diitra_data");
                            var fullPath = Path.Combine(storagePath, adj.RutaArchivo);
                            if (File.Exists(fullPath))
                            {
                                mailAttachment = new Attachment(fullPath);
                                mailAttachment.Name = adj.NombreArchivo;
                            }
                        }
                    }

                    if (mailAttachment != null)
                    {
                        mailAttachments.Add(mailAttachment);
                        attachmentsMeta.Add(new { nombre = adj.NombreArchivo, ruta = adj.RutaArchivo });
                    }
                }

                historyEntry.AdjuntosJson = JsonSerializer.Serialize(attachmentsMeta);

                if (isMock)
                {
                    _logger.LogWarning("[MOCK EMAIL ENGINE] De: {From} a {To} | Asunto: {Subject}", fromEmail, recipient.Email, finalSubject);
                    historyEntry.Estado = "Enviado";
                    _context.InvEmailHistorials.Add(historyEntry);
                    await _context.SaveChangesAsync();
                    continue;
                }

                try
                {
                    using var client = new SmtpClient(host, port)
                    {
                        Credentials = new NetworkCredential(smtpUser, smtpPass),
                        EnableSsl = true
                    };

                    using var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName),
                        Subject = finalSubject,
                        Body = finalBody,
                        IsBodyHtml = true
                    };
                    mailMessage.To.Add(recipient.Email);

                    foreach (var att in mailAttachments)
                    {
                        mailMessage.Attachments.Add(att);
                    }

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Email enviado con éxito a {Recipient}", recipient.Email);

                    historyEntry.Estado = "Enviado";
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar email a {Recipient}", recipient.Email);
                    historyEntry.Estado = "Fallido";
                    historyEntry.ErrorMensaje = ex.ToString();
                    isAllSuccess = false;
                }
                finally
                {
                    foreach (var att in mailAttachments)
                    {
                        att.ContentStream?.Dispose();
                    }
                }

                _context.InvEmailHistorials.Add(historyEntry);
                await _context.SaveChangesAsync();
            }

            return isAllSuccess;
        }

        public async Task<IEnumerable<object>> GetUnfinishedProjectsAsync()
        {
            var list = await _context.InvProyectos
                .Include(p => p.IdSublineaNavigation)
                .ThenInclude(s => s!.IdLineaNavigation)
                .Include(p => p.InvProyectosProfesores)
                .ThenInclude(pp => pp.IdUsuarioNavigation)
                .Where(p => p.Activo != false && (p.Estado == "Inconcluso" || p.DisponibleAdopcion == true))
                .OrderByDescending(p => p.FechaModificacion)
                .ToListAsync();
 
            return list.Select(p => {
                var currentDirector = p.InvProyectosProfesores
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false);
                return new
                {
                    id_proyecto = p.IdProyecto,
                    uuid = p.Uuid,
                    titulo = p.Titulo,
                    codigo_institucional = p.CodigoInstitucional,
                    descripcion = p.DescripcionProyecto,
                    estado = p.Estado,
                    disponible_adopcion = p.DisponibleAdopcion,
                    linea_investigacion = p.IdSublineaNavigation?.IdLineaNavigation?.NombreLinea ?? "General",
                    sublinea = p.IdSublineaNavigation?.Nombre ?? "No asignada",
                    director_anterior = currentDirector?.IdUsuarioNavigation?.Nombre ?? "Sin asignar",
                    director_anterior_email = currentDirector?.IdUsuarioNavigation?.EmailInstitucional ?? ""
                };
            });
        }

        public async Task<bool> MarkProjectAsUnfinishedAsync(int projectId, string reason)
        {
            var project = await _context.InvProyectos.FindAsync(projectId);
            if (project == null) return false;

            string beforeJson = JsonSerializer.Serialize(new { estado = project.Estado, disponibleAdopcion = project.DisponibleAdopcion });

            project.Estado = "Inconcluso";
            project.DisponibleAdopcion = true;
            project.FechaModificacion = DateTime.Now;

            var trazabilidad = new InvTrazabilidadProyecto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdUsuario = 1,
                EstadoAnterior = beforeJson,
                EstadoNuevo = "Inconcluso",
                Observacion = $"Proyecto marcado como Inconcluso y Disponible para Adopción. Motivo: {reason}",
                FechaTransicion = DateTime.Now
            };

            var ult = await _context.InvTrazabilidadProyectos
                .Where(t => t.IdProyecto == project.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .FirstOrDefaultAsync();

            trazabilidad.HashAnterior = ult?.HashActual;
            string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion}";
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
            }

            _context.InvTrazabilidadProyectos.Add(trazabilidad);
            await _context.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                {
                    var dto = JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson);
                    if (dto != null)
                    {
                        dto.Estado = "Inconcluso";
                        project.MetadataCacesJson = JsonSerializer.Serialize(dto);
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al sincronizar metadata de CACES");
            }

            var sublinea = await _context.InvSublineas
                .Include(s => s.IdLineaNavigation)
                .FirstOrDefaultAsync(s => s.IdSublinea == project.IdSublinea);

            var sendRequest = new EmailSendRequest
            {
                TemplateCodigo = "PROYECTO_INCONCLUSO_DISPONIBLE",
                TargetRole = "DOCENTE_INV",
                EntityUuid = project.Uuid,
                EntityType = "Proyecto",
                TemplateData = new Dictionary<string, string>
                {
                    { "[[proyecto_codigo]]", project.CodigoInstitucional ?? "Sin código" },
                    { "[[proyecto_titulo]]", project.Titulo ?? "Sin título" },
                    { "[[linea_investigacion]]", sublinea?.IdLineaNavigation?.NombreLinea ?? "General" },
                    { "[[proyecto_descripcion]]", project.DescripcionProyecto ?? "Sin descripción detallada" },
                    { "[[url_adopcion]]", $"/investigacion/adopcion" }
                }
            };

            _ = Task.Run(async () => {
                try
                {
                    await SendTemplatedEmailAsync(sendRequest);
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Error al enviar correos de difusión de proyecto inconcluso");
                }
            });

            return true;
        }

        public async Task<bool> AdoptProjectAsync(int projectId, int newDirectorUserId)
        {
            var project = await _context.InvProyectos
                .Include(p => p.InvProyectosProfesores)
                .FirstOrDefaultAsync(p => p.IdProyecto == projectId);

            if (project == null || project.Estado != "Inconcluso" || project.DisponibleAdopcion != true)
            {
                return false;
            }

            var newDirectorUser = await _context.Users.FindAsync(newDirectorUserId);
            if (newDirectorUser == null) return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var oldDirector = project.InvProyectosProfesores
                    .FirstOrDefault(pp => pp.EsDirector == true && pp.Activo != false);

                if (oldDirector != null)
                {
                    oldDirector.Activo = false;
                    oldDirector.FechaFin = DateTime.Now;
                    oldDirector.MotivoCambio = $"Proyecto reasignado por adopción del docente {newDirectorUser.Nombre}";
                    oldDirector.EsDirector = false;
                }

                var existingProf = project.InvProyectosProfesores
                    .FirstOrDefault(pp => pp.IdUsuario == newDirectorUserId);

                if (existingProf != null)
                {
                    existingProf.Rol = "Director de Proyecto";
                    existingProf.EsDirector = true;
                    existingProf.Activo = true;
                    existingProf.FechaInicio = DateTime.Now;
                    existingProf.FechaFin = null;
                    existingProf.MotivoCambio = null;
                }
                else
                {
                    _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                    {
                        IdProyecto = project.IdProyecto,
                        IdUsuario = newDirectorUserId,
                        Rol = "Director de Proyecto",
                        NivelAcademico = "Tercer Nivel",
                        Telefono = "",
                        EsDirector = true,
                        Activo = true,
                        FechaInicio = DateTime.Now
                    });
                }

                project.DisponibleAdopcion = false;
                project.Estado = "En Ejecución"; 
                project.FechaModificacion = DateTime.Now;

                var trazabilidad = new InvTrazabilidadProyecto
                {
                    Uuid = Guid.NewGuid().ToString(),
                    IdProyecto = project.IdProyecto,
                    IdUsuario = newDirectorUserId,
                    EstadoAnterior = "Inconcluso",
                    EstadoNuevo = "En Ejecución",
                    Observacion = $"Proyecto adoptado y reanudado por el docente director: {newDirectorUser.Nombre}",
                    FechaTransicion = DateTime.Now
                };

                var ult = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == project.IdProyecto)
                    .OrderByDescending(t => t.FechaTransicion)
                    .FirstOrDefaultAsync();

                trazabilidad.HashAnterior = ult?.HashActual;
                string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion}";
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                    trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
                }

                _context.InvTrazabilidadProyectos.Add(trazabilidad);
                await _context.SaveChangesAsync();

                try
                {
                    if (!string.IsNullOrEmpty(project.MetadataCacesJson))
                    {
                        var dto = JsonSerializer.Deserialize<ProyectoDto>(project.MetadataCacesJson);
                        if (dto != null)
                        {
                            dto.Estado = "En Ejecución";
                            
                            var updatedProfs = await _context.InvProyectosProfesores
                                .Include(pp => pp.IdUsuarioNavigation)
                                .Where(pp => pp.IdProyecto == project.IdProyecto)
                                .ToListAsync();

                            dto.Investigadores = updatedProfs.Select(pp => new InvestigadorDto
                            {
                                Nombre = pp.IdUsuarioNavigation?.Nombre,
                                Cedula = pp.IdUsuarioNavigation?.IdSigafi,
                                Rol = pp.Rol,
                                NivelAcademico = pp.NivelAcademico,
                                Telefono = pp.Telefono,
                                Activo = pp.Activo ?? true,
                                FechaInicio = pp.FechaInicio,
                                FechaFin = pp.FechaFin,
                                MotivoCambio = pp.MotivoCambio
                            }).ToList();

                            project.MetadataCacesJson = JsonSerializer.Serialize(dto);
                            await _context.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al sincronizar metadata de CACES en la adopción");
                }

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al procesar la adopción del proyecto {ProjectId}", projectId);
                return false;
            }
        }

        private string ReplaceTokens(string template, Dictionary<string, string> replacements)
        {
            if (string.IsNullOrEmpty(template)) return "";
            var result = template;
            foreach (var kvp in replacements)
            {
                result = result.Replace(kvp.Key, kvp.Value ?? "");
            }
            return result;
        }

        private EmailTemplateDto MapToTemplateDto(InvEmailTemplate entity)
        {
            return new EmailTemplateDto
            {
                IdEmailTemplate = entity.IdEmailTemplate,
                Uuid = entity.Uuid,
                Codigo = entity.Codigo,
                Nombre = entity.Nombre,
                Descripcion = entity.Descripcion,
                Asunto = entity.Asunto,
                CuerpoHtml = entity.CuerpoHtml,
                Activo = entity.Activo,
                FechaCreado = entity.FechaCreado,
                FechaActualizado = entity.FechaActualizado
            };
        }

        private EmailHistorialDto MapToHistorialDto(InvEmailHistorial entity)
        {
            return new EmailHistorialDto
            {
                IdEmailHistorial = entity.IdEmailHistorial,
                Uuid = entity.Uuid,
                Destinatario = entity.Destinatario,
                IdUsuarioDestinatario = entity.IdUsuarioDestinatario,
                NombreDestinatario = entity.IdUsuarioDestinatarioNavigation?.Nombre,
                Asunto = entity.Asunto,
                Cuerpo = entity.Cuerpo,
                Estado = entity.Estado,
                ErrorMensaje = entity.ErrorMensaje,
                FechaEnvio = entity.FechaEnvio,
                AdjuntosJson = entity.AdjuntosJson,
                MetadataJson = entity.MetadataJson
            };
        }

        private async Task<object?> BuildDictamenArbitrajeDataAsync(string entityUuid)
        {
            // Try to find the peer review first
            var peerReview = await _context.InvRevisionesPares
                .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdSublineaNavigation)
                .Include(r => r.Proyecto)
                .ThenInclude(p => p.IdConvocatoriaNavigation)
                .FirstOrDefaultAsync(r => r.Uuid == entityUuid);

            InvProyecto? project = null;
            if (peerReview != null)
            {
                project = peerReview.Proyecto;
            }
            else
            {
                // Try to find as project
                project = await _context.InvProyectos
                    .Include(p => p.IdSublineaNavigation)
                    .Include(p => p.IdConvocatoriaNavigation)
                    .FirstOrDefaultAsync(p => p.Uuid == entityUuid);
            }

            if (project == null) return null;

            var revisiones = await _context.InvRevisionesPares
                .Include(r => r.Revisor)
                .Where(r => r.IdProyecto == project.IdProyecto && r.Estado != "Cancelado")
                .ToListAsync();

            if (!revisiones.Any()) return null;

            var puntajes = revisiones.Where(r => r.PuntajeTotal.HasValue).Select(r => r.PuntajeTotal!.Value).ToList();
            decimal promedio = puntajes.Any() ? puntajes.Average() : 0.00m;
            decimal puntajeMinimo = project.IdConvocatoriaNavigation?.PuntajeMinimoAprobacion ?? 70.00m;

            var votos = revisiones.Select(r => r.DictamenRevisor).ToList();
            string resultado = "Pendiente";
            if (votos.Contains("Rechaza") && !votos.Contains("Aprueba"))
            {
                resultado = "Rechazado";
            }
            else if (votos.Contains("Aprueba") && !votos.Contains("Rechaza"))
            {
                resultado = "Aprobado";
            }
            else if (promedio >= puntajeMinimo)
            {
                resultado = "Aprobado";
            }
            else
            {
                resultado = "Rechazado";
            }

            int aprueba = votos.Count(v => v == "Aprueba");
            int rechaza = votos.Count(v => v == "Rechaza");
            string? mensajeDesempate = null;
            if (aprueba == rechaza && revisiones.Count >= 2)
            {
                resultado = "Desempate";
                mensajeDesempate = $"Panel dividido: {aprueba} aprueba(n) vs {rechaza} rechaza(n). Se requiere un tercer árbitro dirimente.";
            }

            var revisionsData = new List<Dictionary<string, object?>>();
            foreach (var r in revisiones)
            {
                var meta = r.IdRevisor.HasValue ? await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == r.IdRevisor.Value) : null;

                revisionsData.Add(new Dictionary<string, object?>
                {
                    ["revisor_nombre"] = r.Revisor?.Nombre ?? "Revisor Externo",
                    ["es_externo"] = r.EsExterno,
                    ["revisor_grado"] = meta?.GradoAcademicoMaximo ?? "N/I",
                    ["puntaje_total"] = r.PuntajeTotal?.ToString("F1"),
                    ["dictamen_revisor"] = r.DictamenRevisor,
                    ["estado"] = r.Estado,
                    ["observaciones_gral"] = r.ObservacionesGral,
                    ["fecha_completado"] = r.FechaCompletado
                });
            }

            var director = await _context.Users
                .FirstOrDefaultAsync(u => _context.UserRoles.Any(ur => ur.IdUsuario == u.IdUsuario && ur.Role.CodigoRol == "DIR_INV" && (ur.EsActivo ?? true)));

            return new Dictionary<string, object?>
            {
                ["proyecto_titulo"] = project.Titulo,
                ["codigo_institucional"] = project.CodigoInstitucional,
                ["convocatoria_titulo"] = project.IdConvocatoriaNavigation?.Titulo ?? "N/A",
                ["linea_investigacion"] = project.IdSublineaNavigation?.Nombre ?? "N/A",
                ["fecha_postulacion"] = project.FechaPresentacion,
                ["fecha_cierre"] = DateTime.Now,
                ["fecha_generacion"] = DateTime.Now,
                ["puntaje_promedio"] = promedio.ToString("F2"),
                ["puntaje_minimo"] = puntajeMinimo.ToString("F2"),
                ["dictamen_resultado"] = resultado,
                ["estado_anterior"] = project.Estado,
                ["estado_nuevo"] = resultado == "Aprobado" ? "Aprobado" : (resultado == "Desempate" ? "En Revisión" : "Rechazado"),
                ["es_doble_ciego"] = true,
                ["director_nombre"] = director?.Nombre ?? "Director de Investigación",
                ["mensaje_desempate"] = mensajeDesempate,
                ["revisiones"] = revisionsData,
                ["institucion_nombre"] = "Instituto Superior Tecnológico Traversari"
            };
        }
    }
}
