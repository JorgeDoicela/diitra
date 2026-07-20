using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures.Subservices;

public class SignatureRevocationSubservice : ISignatureRevocationSubservice
{
    private readonly DiitraContext _context;
    private readonly ILogger<SignatureRevocationSubservice> _logger;

    public SignatureRevocationSubservice(
        DiitraContext context,
        ILogger<SignatureRevocationSubservice> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> RevokeAsync(int idUsuarioSolicitante, RevokeSignatureDto dto, bool esAdmin = false)
    {
        var firma = await _context.InvDocumentoFirmas
            .FirstOrDefaultAsync(f => f.FirmaCode == dto.FirmaCode);

        if (firma is null) return false;

        if (!esAdmin && firma.FirmanteId != idUsuarioSolicitante.ToString() && firma.FirmanteId != $"USR-{idUsuarioSolicitante}")
            throw new UnauthorizedAccessException("Solo el firmante original puede revocar esta firma.");

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

        firma.EsValida = false;
        firma.RevocadaEn = DateTime.UtcNow;
        firma.MotivoRevocacion = dto.MotivoRevocacion;

        var audit = new InvAuditAdmin
        {
            IdUsuarioAdmin = idUsuarioSolicitante,
            IdUsuarioAfectado = idFirmante,
            Accion = SignatureAuditEvent.SignatureRevoked.ToString(),
            Modulo = "Signatures",
            Detalle = $"Firma {dto.FirmaCode} revocada. Motivo: {dto.MotivoRevocacion}",
            ValoresAnteriores = JsonSerializer.Serialize(new { EsValida = true }),
            ValoresNuevos = JsonSerializer.Serialize(new { EsValida = false, MotivoRevocacion = dto.MotivoRevocacion }),
            Fecha = DateTime.UtcNow
        };
        _context.InvAuditAdmin.Add(audit);

        var lopdpAudit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = idUsuarioSolicitante,
            IdUsuarioAfectado = idFirmante ?? 0,
            TablaAfectada = "inv_documentos_firmas",
            ColumnaAfectada = "es_valida",
            Operacion = "ELIMINACION",
            Motivo = $"Revocación de firma digital. Código: {dto.FirmaCode}. Motivo: {dto.MotivoRevocacion}",
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(lopdpAudit);

        await _context.SaveChangesAsync();

        _logger.LogWarning(
            "[DIITRA Firma] Firma {Code} revocada por usuario {UserId}. Motivo: {Motivo}",
            dto.FirmaCode, idUsuarioSolicitante, dto.MotivoRevocacion);

        return true;
    }
}
