using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Diitra.Infrastructure.Common.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures.Subservices;

public class DiitraInternalSignerSubservice : IDiitraInternalSignerSubservice
{
    private readonly DiitraContext _context;
    private readonly SignatureHashService _hashService;
    private readonly SignatureStamper _stamper;
    private readonly IConfiguration _config;
    private readonly IFileStorageService _storageService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DiitraInternalSignerSubservice> _logger;

    public DiitraInternalSignerSubservice(
        DiitraContext context,
        SignatureHashService hashService,
        SignatureStamper stamper,
        IConfiguration config,
        IFileStorageService storageService,
        IServiceProvider serviceProvider,
        ILogger<DiitraInternalSignerSubservice> logger)
    {
        _context = context;
        _hashService = hashService;
        _stamper = stamper;
        _config = config;
        _storageService = storageService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<SignatureResultDto> SignDocumentAsync(
        int idUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto)
    {
        // 1. Verificar contraseña DIITRA (re-autenticación para no repudio)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        var skipAuth = _config.GetValue<bool>("Firma:SkipCertificateValidation");

        if (skipAuth)
        {
            var env = _config["ASPNETCORE_ENVIRONMENT"] ?? _config["Environment"] ?? "Production";
            if (!env.Equals("Development", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError("[DIITRA Firma] CRÍTICO: Firma:SkipCertificateValidation=true en entorno '{Env}'. La re-autenticación está desactivada.", env);
                throw new InvalidOperationException("Configuración de seguridad inválida en producción. Contacte al administrador del sistema.");
            }
            _logger.LogWarning("[DIITRA Firma] ADVERTENCIA: Firma:SkipCertificateValidation=true — modo de desarrollo, sin verificación de contraseña.");
        }

        if (!skipAuth)
        {
            if (string.IsNullOrWhiteSpace(user.Contrasenia))
                throw new UnauthorizedAccessException("El usuario no tiene contraseña configurada.");

            bool isPasswordCorrect = false;
            try
            {
                if (BCrypt.Net.BCrypt.Verify(dto.Password, user.Contrasenia))
                {
                    isPasswordCorrect = true;
                }
            }
            catch
            {
                if (user.Contrasenia == dto.Password)
                {
                    isPasswordCorrect = true;
                    try
                    {
                        user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(dto.Password, 11);
                    }
                    catch { /* ignorar fallos de hash en caliente */ }
                }
            }

            if (!isPasswordCorrect)
            {
                _logger.LogWarning("[DIITRA Firma] Intento de firma fallido — contraseña incorrecta. Usuario {Id}", idUsuario);

                var failAudit = new InvAuditAdmin
                {
                    IdUsuarioAdmin = idUsuario,
                    IdUsuarioAfectado = idUsuario,
                    Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                    Modulo = "Signatures",
                    Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: contraseña incorrecta.",
                    IpOrigen = ipAddress,
                    UserAgent = userAgent,
                    Fecha = DateTime.UtcNow
                };
                _context.InvAuditAdmin.Add(failAudit);
                await _context.SaveChangesAsync();

                throw new UnauthorizedAccessException("Contraseña incorrecta. La firma requiere verificación de identidad.");
            }
        }

        var nombreUsuario = user.Nombre ?? user.IdSigafi ?? "Usuario DIITRA";
        var cedulaUsuario = user.IdSigafi;

        // 2. Verificar que el documento existe y es accesible
        var instancia = await _context.DocumentInstances
            .FirstOrDefaultAsync(d => d.Uuid == dto.DocumentoUuid)
            ?? throw new KeyNotFoundException($"Documento '{dto.DocumentoUuid}' no encontrado.");

        // 3. Verificar que el perfil de firma está configurado
        var perfilCheck = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);
        if (perfilCheck is null || !perfilCheck.EsConfigurado)
        {
            var failAudit = new InvAuditAdmin
            {
                IdUsuarioAdmin = idUsuario,
                IdUsuarioAfectado = idUsuario,
                Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                Modulo = "Signatures",
                Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: perfil de firma no configurado.",
                IpOrigen = ipAddress,
                UserAgent = userAgent,
                Fecha = DateTime.UtcNow
            };
            _context.InvAuditAdmin.Add(failAudit);
            await _context.SaveChangesAsync();

            throw new InvalidOperationException("El usuario no tiene un perfil de firma institucional configurado. Configure su cargo y trazo antes de firmar.");
        }

        // 4. Verificar que no está ya firmado por este usuario con DIITRA
        var existingFirma = await _context.InvDocumentoFirmas
            .AnyAsync(f => f.DocumentoUuid == dto.DocumentoUuid
                        && (f.FirmanteId == idUsuario.ToString() || f.FirmanteId == $"USR-{idUsuario}")
                        && f.TipoFirma == "DIITRA"
                        && f.EsValida);
        if (existingFirma)
        {
            var failAudit = new InvAuditAdmin
            {
                IdUsuarioAdmin = idUsuario,
                IdUsuarioAfectado = idUsuario,
                Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                Modulo = "Signatures",
                Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: ya existe una firma activa de este usuario.",
                IpOrigen = ipAddress,
                UserAgent = userAgent,
                Fecha = DateTime.UtcNow
            };
            _context.InvAuditAdmin.Add(failAudit);
            await _context.SaveChangesAsync();

            throw new InvalidOperationException("Ya existe una firma DIITRA válida de este usuario en el documento.");
        }

        // 5. Obtener el PDF actual del documento
        var pdfBytes = await GetPdfBytesFromInstanceAsync(instancia);

        // 6. Calcular el hash del PDF
        var docHash = SignatureHashService.ComputeSha256(pdfBytes);
        var firmaCode = SignatureHashService.GenerateFirmaCode();
        var firmadoEn = DateTime.UtcNow;

        // 7. Calcular el HMAC
        var firmanteIdStr = $"USR-{idUsuario}";
        var hmacHash = _hashService.GenerateHmac(
            docHash, firmanteIdStr, firmadoEn, firmaCode);

        // 8. Obtener perfil para estampar la imagen de firma
        var perfil = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        var firmaImagenB64 = await GetFirmaBase64Async(perfil?.FirmaImagenB64);

        // 9. Estampar el bloque visual en el PDF
        var verificationBaseUrl = _config["FrontendUrl"] ?? "https://diitra.ist.edu.ec";
        var verificationUrl = $"{verificationBaseUrl}/verificar-firma/{firmaCode}";

        var pdfFirmado = _stamper.StampSignatureBlock(
            pdfBytes: pdfBytes,
            nombreFirmante: nombreUsuario,
            cedula: cedulaUsuario,
            cargo: perfil?.Cargo ?? dto.RolFirmante,
            departamento: perfil?.Departamento,
            rolEnDocumento: dto.RolFirmante,
            firmaCode: firmaCode,
            firmaImagenB64: firmaImagenB64,
            verificationUrl: verificationUrl,
            firmadoEn: firmadoEn);

        // 10. Iniciar transacción explícita de EF Core
        using var transaction = await _context.Database.BeginTransactionAsync();
        string? pdfPath = null;

        try
        {
            // 11. Guardar el PDF firmado físicamente
            pdfPath = await SaveSignedPdfAsync(pdfFirmado, dto.DocumentoUuid, firmaCode);

            // 12. Actualizar DocumentInstance
            instancia.Finalize(
                pdfPath: pdfPath,
                hash: docHash,
                traceabilityCode: firmaCode);

            // 13. Persistir el registro de firma
            var snapshotJson = JsonSerializer.Serialize(new
            {
                nombre = nombreUsuario,
                cedula = cedulaUsuario,
                cargo = perfil?.Cargo,
                departamento = perfil?.Departamento,
                rol = dto.RolFirmante,
                metodo = "DIITRA_BASIC_V1",
            });

            var registroFirma = new InvDocumentoFirma
            {
                Uuid = Guid.NewGuid().ToString(),
                DocumentoUuid = dto.DocumentoUuid,
                FirmanteId = firmanteIdStr,
                FirmanteRol = dto.RolFirmante ?? "Firmante",
                FechaFirma = firmadoEn,
                TipoFirma = "DIITRA",
                FirmaCode = firmaCode,
                HmacHash = hmacHash,
                DocHash = docHash,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                FirmaMetadata = snapshotJson,
                ArchivoPdfFirmado = pdfPath,
                EsValida = true,
            };

            _context.InvDocumentoFirmas.Add(registroFirma);

            // Auditoría LOPDP
            var successAudit = new InvLopdpAuditoriaDatos
            {
                Uuid = Guid.NewGuid(),
                IdUsuarioActor = idUsuario,
                IdUsuarioAfectado = idUsuario,
                TablaAfectada = "inv_documentos_firmas",
                ColumnaAfectada = "firma_code",
                Operacion = "ESCRITURA",
                Motivo = $"Firma de documento exitosa. Código: {firmaCode}.",
                IpDireccion = ipAddress,
                UserAgent = userAgent,
                FechaAcceso = DateTime.UtcNow
            };
            _context.InvLopdpAuditoriaDatos.Add(successAudit);

            // Transición de Estado de Workflow (Específico de PROTOCOLO_INVESTIGACION)
            if (instancia.TemplateCode == "PROTOCOLO_INVESTIGACION")
            {
                var workflowService = _serviceProvider.GetRequiredService<Diitra.Application.Research.IWorkflowEngineService>();
                await workflowService.TransicionarEstadoAsync(instancia.EntityUuid, "Enviado", 1, $"Firma Digital DIITRA e Inmutabilidad Forense - Hash: {docHash}");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (!string.IsNullOrEmpty(pdfPath))
            {
                try
                {
                    await _storageService.DeleteFileAsync(pdfPath);
                }
                catch (Exception deleteEx)
                {
                    _logger.LogError(deleteEx, "[DIITRA Firma] No se pudo limpiar el PDF huérfano en {Path} tras error en transacción", pdfPath);
                }
            }
            _logger.LogError(ex, "[DIITRA Firma] Error durante el proceso de firma del documento {DocUuid}", dto.DocumentoUuid);
            throw;
        }

        _logger.LogInformation(
            "[DIITRA Firma] Documento {DocUuid} firmado. Código: {Code} | Usuario: {UserId} | Hash: {Hash}",
            dto.DocumentoUuid, firmaCode, idUsuario, docHash[..16] + "…");

        return new SignatureResultDto
        {
            FirmaCode = firmaCode,
            HmacHash = hmacHash,
            DocHash = docHash,
            FirmadoEn = firmadoEn,
            VerificationUrl = verificationUrl,
        };
    }

    private async Task<byte[]> GetPdfBytesFromInstanceAsync(Diitra.Domain.Common.Documents.DocumentInstance instancia)
    {
        if (string.IsNullOrWhiteSpace(instancia.FinalPdfPath))
        {
            _logger.LogInformation("[DIITRA Firma] El documento '{Uuid}' no tiene PDF generado. Generándolo temporalmente en memoria...", instancia.Uuid);

            var dataOrchestrator = _serviceProvider.GetRequiredService<Diitra.Application.Common.Documents.IDocumentDataOrchestrator>();
            var documentEngine = _serviceProvider.GetRequiredService<Diitra.Application.Common.Documents.IDocumentEngine>();

            var docRequest = await dataOrchestrator.PrepareRequestAsync(instancia.Uuid, "sistema");
            var buildResult = await documentEngine.GenerateAsync(docRequest);

            return buildResult.PdfBytes;
        }

        if (Path.IsPathRooted(instancia.FinalPdfPath) && File.Exists(instancia.FinalPdfPath))
        {
            return await File.ReadAllBytesAsync(instancia.FinalPdfPath);
        }

        return await _storageService.GetFileAsync(instancia.FinalPdfPath);
    }

    private async Task<string> SaveSignedPdfAsync(byte[] pdfBytes, string documentoUuid, string firmaCode)
    {
        var fileName = $"{documentoUuid}_{firmaCode}.pdf";
        return await _storageService.SaveFileAsync(fileName, pdfBytes, "firmas");
    }

    private async Task<string?> GetFirmaBase64Async(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        try
        {
            if (path.StartsWith("data:image/") || path.Length > 512)
            {
                return path;
            }

            var bytes = await _storageService.GetFileAsync(path);
            return $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[DIITRA Firma] No se pudo leer el archivo de firma desde {Path}", path);
            return null;
        }
    }
}
