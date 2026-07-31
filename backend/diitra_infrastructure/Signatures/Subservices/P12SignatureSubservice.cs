using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Security;
using Diitra.Infrastructure.Common.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures.Subservices;

public class P12SignatureSubservice : IP12SignatureSubservice
{
    private readonly DiitraContext _context;
    private readonly SignatureHashService _hashService;
    private readonly IConfiguration _config;
    private readonly IFileStorageService _storageService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<P12SignatureSubservice> _logger;

    public P12SignatureSubservice(
        DiitraContext context,
        SignatureHashService hashService,
        IConfiguration config,
        IFileStorageService storageService,
        IServiceProvider serviceProvider,
        ILogger<P12SignatureSubservice> logger)
    {
        _context = context;
        _hashService = hashService;
        _config = config;
        _storageService = storageService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<SignatureResultDto> SignDocumentWithP12Async(
        int idUsuario,
        string ipAddress,
        string userAgent,
        byte[] certificateBytes,
        string certificatePassword,
        string documentoUuid,
        string? rolFirmante)
    {
        var p12SignerService = _serviceProvider.GetRequiredService<IFirmaElectronicaService>();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        var skipAuth = _config.GetValue<bool>("Firma:SkipCertificateValidation");

        // 1. Validar certificado digital y contraseña
        string signerName = user.Nombre ?? "Firmante";
        string signerEntity = "Entidad de Certificación Digital";

        if (certificateBytes != null)
        {
            if (!p12SignerService.ValidateCertificate(certificateBytes, certificatePassword))
            {
                throw new InvalidOperationException("La contraseña del certificado no es válida o el archivo .p12 está corrupto.");
            }

            try
            {
                using var cert2 = new X509Certificate2(certificateBytes, certificatePassword);
                var parsedName = cert2.GetNameInfo(X509NameType.SimpleName, false);

                if (!skipAuth && !string.IsNullOrWhiteSpace(parsedName) && !string.IsNullOrWhiteSpace(user.Nombre))
                {
                    string normUser = NormalizeName(user.Nombre);
                    string normCert = NormalizeName(parsedName);
                    if (!ValidateNameMatch(normUser, normCert))
                    {
                        throw new InvalidOperationException($"El certificado digital cargado pertenece a '{parsedName}', pero usted ha iniciado sesión como '{user.Nombre}'. Por seguridad, solo puede firmar documentos usando su propio certificado personal.");
                    }
                }

                if (!string.IsNullOrWhiteSpace(parsedName)) signerName = parsedName;
                var parsedIssuer = cert2.GetNameInfo(X509NameType.SimpleName, true);
                if (!string.IsNullOrWhiteSpace(parsedIssuer)) signerEntity = parsedIssuer;
            }
            catch (Exception ex)
            {
                if (!skipAuth) throw;
                _logger.LogWarning(ex, "No se pudo extraer metadatos del certificado de firma. Se usará información del perfil.");
            }
        }
        else if (!skipAuth)
        {
            throw new InvalidOperationException("Debe adjuntar su archivo de firma digital (.p12) en cada solicitud de firma.");
        }

        // 2. Verificar que el documento existe y es accesible (buscando por Uuid de Instancia o Uuid de Entidad)
        var instancia = await _context.DocumentInstances
            .FirstOrDefaultAsync(d => d.Uuid == documentoUuid || d.EntityUuid == documentoUuid)
            ?? throw new KeyNotFoundException($"Documento '{documentoUuid}' no encontrado.");

        // 3. Verificar firma existente o permitir re-firma si el proyecto fue devuelto a corrección
        var existingFirmas = await _context.InvDocumentoFirmas
            .Where(f => (f.DocumentoUuid == instancia.Uuid || f.DocumentoUuid == instancia.EntityUuid)
                     && (f.FirmanteId == idUsuario.ToString() || f.FirmanteId == $"USR-{idUsuario}")
                     && f.TipoFirma == "FirmaEC"
                     && f.EsValida)
            .ToListAsync();

        if (existingFirmas.Any())
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == instancia.EntityUuid);
            var stateLower = project?.Estado?.ToLower().Trim() ?? "";
            var isFinalLockedState = stateLower == "enviado" || stateLower == "aprobado" || stateLower == "en ejecución" || stateLower == "en ejecucion" || stateLower == "finalizado";
            var isCorrectionMode = !isFinalLockedState || stateLower.Contains("devuelt") || stateLower.Contains("correc") || stateLower.Contains("observac") || stateLower.Contains("edici");

            if (isCorrectionMode)
            {
                foreach (var f in existingFirmas)
                {
                    f.EsValida = false;
                }
                await _context.SaveChangesAsync();
            }
            else
            {
                throw new InvalidOperationException("Ya existe una firma digital (FirmaEC) válida de este usuario en el documento.");
            }
        }

        // 4. Obtener PDF actual del documento
        var pdfBytes = await GetPdfBytesFromInstanceAsync(instancia);

        // 5. Firma criptográfica PAdES (FirmaEC)
        byte[] signedPdfBytes;
        if (certificateBytes != null && !skipAuth)
        {
            signedPdfBytes = p12SignerService.SignPdf(pdfBytes, certificateBytes, certificatePassword,
                reason: $"Firma Digital de Documento - {instancia.Title ?? "DIITRA"}",
                location: "Quito, Ecuador");
        }
        else
        {
            signedPdfBytes = pdfBytes;
        }

        // 6. Calcular hashes y códigos
        var docHash = SignatureHashService.ComputeSha256(signedPdfBytes);
        var firmaCode = SignatureHashService.GenerateFirmaCode();
        var firmadoEn = DateTime.UtcNow;

        var firmanteIdStr = $"USR-{idUsuario}";
        var hmacHash = _hashService.GenerateHmac(docHash, firmanteIdStr, firmadoEn, firmaCode);

        var signatureProfile = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        // 7. Iniciar transacción explícita de EF Core
        using var transaction = await _context.Database.BeginTransactionAsync();
        string? pdfPath = null;

        try
        {
            // 8. Guardar PDF firmado
            pdfPath = await SaveSignedPdfAsync(signedPdfBytes, documentoUuid, firmaCode);

            // 9. Actualizar DocumentInstance
            instancia.Finalize(pdfPath, docHash, firmaCode);

            // 10. Registrar en inv_documentos_firmas
            var snapshotJson = JsonSerializer.Serialize(new
            {
                nombre = signerName,
                cedula = user.IdSigafi,
                cargo = signatureProfile?.Cargo ?? rolFirmante,
                departamento = signatureProfile?.Departamento,
                rol = rolFirmante,
                metodo = "P12_PADES_ECUADOR",
            });

            var registroFirma = new InvDocumentoFirma
            {
                Uuid = Guid.NewGuid().ToString(),
                DocumentoUuid = documentoUuid,
                FirmanteId = firmanteIdStr,
                FirmanteRol = rolFirmante ?? "Firmante",
                FechaFirma = firmadoEn,
                TipoFirma = "FirmaEC",
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

            // 11. Auditoría LOPDP
            var lopdpService = _serviceProvider.GetRequiredService<diitra_application.Security.ILopdpService>();
            await lopdpService.AuditoriaAccesoDatosAsync(
                idUsuario, idUsuario, "inv_documentos_firmas", "firma_code", "ESCRITURA",
                $"Firma digital avanzada (.p12) de documento exitosa. Código: {firmaCode}.", ipAddress, userAgent);

            // 12. Transición de Estado de Workflow (Específico de PROTOCOLO_INVESTIGACION)
            if (instancia.TemplateCode == "PROTOCOLO_INVESTIGACION")
            {
                var workflowService = _serviceProvider.GetRequiredService<Diitra.Application.Research.IWorkflowEngineService>();
                await workflowService.TransicionarEstadoAsync(instancia.EntityUuid, "Enviado", 1, $"Firma Digital .p12 e Inmutabilidad Forense - Hash: {docHash}");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (!string.IsNullOrEmpty(pdfPath))
            {
                try { await _storageService.DeleteFileAsync(pdfPath); } catch { }
            }
            _logger.LogError(ex, "[DIITRA Firma] Error al firmar con .p12 para documento {DocUuid}", documentoUuid);
            throw;
        }

        var verificationBaseUrl = _config["FrontendUrl"] ?? _config["Email:FrontendUrl"] ?? "http://localhost:3000";
        var verificationUrl = $"{verificationBaseUrl.TrimEnd('/')}/verificacion/{firmaCode}";

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
        var dataOrchestrator = _serviceProvider.GetRequiredService<Diitra.Application.Common.Documents.IDocumentDataOrchestrator>();
        var documentEngine = _serviceProvider.GetRequiredService<Diitra.Application.Common.Documents.IDocumentEngine>();

        var docRequest = await dataOrchestrator.PrepareRequestAsync(instancia.Uuid, "sistema", forceDraftMode: false);
        var buildResult = await documentEngine.GenerateAsync(docRequest);

        return buildResult.PdfBytes;
    }

    private async Task<string> SaveSignedPdfAsync(byte[] pdfBytes, string documentoUuid, string firmaCode)
    {
        var fileName = $"{documentoUuid}_{firmaCode}.pdf";
        return await _storageService.SaveFileAsync(fileName, pdfBytes, "firmas");
    }

    private static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "";
        var normalized = name.ToLowerInvariant().Trim();
        normalized = normalized.Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n");
        return normalized;
    }

    private static bool ValidateNameMatch(string userNormalized, string certNormalized)
    {
        if (string.IsNullOrEmpty(userNormalized) || string.IsNullOrEmpty(certNormalized)) return false;
        if (userNormalized.Contains(certNormalized) || certNormalized.Contains(userNormalized)) return true;

        var userWords = userNormalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var certWords = certNormalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        int matches = 0;
        foreach (var uWord in userWords)
        {
            if (uWord.Length > 2 && certWords.Contains(uWord))
            {
                matches++;
            }
        }
        return matches >= 2;
    }
}
