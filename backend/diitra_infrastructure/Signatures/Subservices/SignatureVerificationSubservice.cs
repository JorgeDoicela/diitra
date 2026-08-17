using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures.Subservices;

public class SignatureVerificationSubservice : ISignatureVerificationSubservice
{
    private readonly DiitraContext _context;
    private readonly SignatureHashService _hashService;
    private readonly ILogger<SignatureVerificationSubservice> _logger;

    public SignatureVerificationSubservice(
        DiitraContext context,
        SignatureHashService hashService,
        ILogger<SignatureVerificationSubservice> logger)
    {
        _context = context;
        _hashService = hashService;
        _logger = logger;
    }

    public async Task<IEnumerable<SignatureRecordDto>> GetByDocumentAsync(string documentoUuid)
    {
        var matchingDocUuids = new List<string> { documentoUuid };
        var entityInstances = await _context.DocumentInstances
            .AsNoTracking()
            .Where(d => d.EntityUuid == documentoUuid || d.Uuid == documentoUuid)
            .Select(d => d.Uuid)
            .ToListAsync();
        matchingDocUuids.AddRange(entityInstances);

        var firmas = await _context.InvDocumentoFirmas
            .AsNoTracking()
            .Where(f => matchingDocUuids.Contains(f.DocumentoUuid) && f.EsValida)
            .OrderByDescending(f => f.FechaFirma)
            .ToListAsync();

        return firmas.Select(MapToRecordDto);
    }

    public async Task<SignatureVerificationDto> VerifyAsync(string firmaCode)
    {
        var firma = await _context.InvDocumentoFirmas
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.FirmaCode == firmaCode);

        if (firma is null)
        {
            return new SignatureVerificationDto
            {
                EsValida = false,
                FirmaCode = firmaCode,
                MensajeEstado = "Código de firma no encontrado en el sistema.",
            };
        }

        string firmanteNombre = firma.FirmanteId;
        int? idFirmante = null;
        if (!string.IsNullOrWhiteSpace(firma.FirmanteId))
        {
            var cleanId = firma.FirmanteId.StartsWith("USR-")
                ? firma.FirmanteId.Replace("USR-", "")
                : firma.FirmanteId;
            if (int.TryParse(cleanId, out int id))
            {
                idFirmante = id;
            }
        }

        try
        {
            var snapshot = JsonDocument.Parse(firma.FirmaMetadata ?? "{}");
            firmanteNombre = snapshot.RootElement.TryGetProperty("nombre", out var n)
                ? n.GetString() ?? firma.FirmanteId
                : firma.FirmanteId;
        }
        catch { /* usa FirmanteId si el JSON falla */ }

        var audit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = null,
            IdUsuarioAfectado = idFirmante ?? 0,
            TablaAfectada = "inv_documentos_firmas",
            ColumnaAfectada = "firma_metadata",
            Operacion = "LECTURA",
            Motivo = $"Verificación pública de la firma. Código: {firmaCode}.",
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(audit);
        await _context.SaveChangesAsync();

        bool hmacValido = false;
        if (!string.IsNullOrWhiteSpace(firma.HmacHash) && !string.IsNullOrWhiteSpace(firma.DocHash))
        {
            try
            {
                hmacValido = _hashService.VerifyHmac(
                    firma.DocHash,
                    firma.FirmanteId,
                    firma.FechaFirma,
                    firma.FirmaCode ?? string.Empty,
                    firma.HmacHash);
            }
            catch
            {
                hmacValido = false;
            }
        }

        if (!firma.EsValida)
        {
            return new SignatureVerificationDto
            {
                EsValida = false,
                FirmaCode = firmaCode,
                FirmanteNombre = firmanteNombre,
                FirmanteRol = firma.FirmanteRol,
                DocumentoUuid = firma.DocumentoUuid,
                FechaFirma = firma.FechaFirma,
                DocHash = firma.DocHash ?? string.Empty,
                MensajeEstado = firma.RevocadaEn.HasValue
                    ? $"Firma revocada el {firma.RevocadaEn:dd/MM/yyyy HH:mm}. Motivo: {firma.MotivoRevocacion}"
                    : "Firma no válida.",
            };
        }

        if (!hmacValido)
        {
            _logger.LogWarning(
                "[DIITRA Firma] ALERTA: El HMAC de la firma {Code} no pasa verificación criptográfica. Posible manipulación.",
                firmaCode);

            return new SignatureVerificationDto
            {
                EsValida = false,
                FirmaCode = firmaCode,
                FirmanteNombre = firmanteNombre,
                FirmanteRol = firma.FirmanteRol,
                DocumentoUuid = firma.DocumentoUuid,
                FechaFirma = firma.FechaFirma,
                DocHash = firma.DocHash ?? string.Empty,
                MensajeEstado = "Firma no verificable: la integridad criptográfica del registro ha sido compromised.",
            };
        }

        return new SignatureVerificationDto
        {
            EsValida = true,
            FirmaCode = firmaCode,
            FirmanteNombre = firmanteNombre,
            FirmanteRol = firma.FirmanteRol,
            DocumentoUuid = firma.DocumentoUuid,
            FechaFirma = firma.FechaFirma,
            DocHash = firma.DocHash ?? string.Empty,
            MensajeEstado = $"Firma válida — emitida el {firma.FechaFirma:dd/MM/yyyy HH:mm} UTC",
        };
    }

    private static SignatureRecordDto MapToRecordDto(InvDocumentoFirma f)
    {
        string firmanteNombre = f.FirmanteId;
        try
        {
            var snapshot = JsonDocument.Parse(f.FirmaMetadata ?? "{}");
            firmanteNombre = snapshot.RootElement.TryGetProperty("nombre", out var n)
                ? n.GetString() ?? f.FirmanteId
                : f.FirmanteId;
        }
        catch { /* fallback a FirmanteId */ }

        return new SignatureRecordDto
        {
            IdFirma = f.IdFirma,
            FirmaCode = f.FirmaCode ?? string.Empty,
            FirmanteNombre = firmanteNombre,
            FirmanteRol = f.FirmanteRol,
            FechaFirma = f.FechaFirma,
            Estado = f.EsValida ? SignatureState.Valid : SignatureState.Revoked,
            DocHash = f.DocHash,
            MotivoRevocacion = f.MotivoRevocacion,
            RevocadaEn = f.RevocadaEn,
        };
    }
}
