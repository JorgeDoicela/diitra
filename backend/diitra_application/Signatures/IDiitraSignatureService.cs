using diitra_domain.Signatures;

namespace diitra_application.Signatures;

/// <summary>
/// Contrato principal del módulo DIITRA Firma.
/// Implementaciones intercambiables: DiitraSignatureService (Fase 1),
/// futuras con OTP/biometría deben implementar esta misma interfaz.
/// </summary>
public interface IDiitraSignatureService
{
    // ── Perfil ──────────────────────────────────────────────────────
    
    /// <summary>Obtiene el perfil de firma del usuario autenticado.</summary>
    Task<UserSignatureProfileDto?> GetProfileAsync(int idUsuario);

    /// <summary>
    /// Crea o actualiza el perfil de firma del usuario.
    /// Registra el evento PROFILE_CREATED o PROFILE_UPDATED en el log.
    /// </summary>
    Task<UserSignatureProfileDto> UpsertProfileAsync(int idUsuario, UpdateSignatureProfileDto dto);

    // ── Firma ────────────────────────────────────────────────────────

    /// <summary>
    /// Firma un documento con la identidad DIITRA del usuario.
    /// Requiere re-autenticación (contraseña) para garantizar no repudio.
    /// Genera código DFRM-{AÑO}-{UUID8}, HMAC-SHA256, SHA-256 del PDF.
    /// Estampa el bloque visual profesional en el PDF y registra el evento.
    /// </summary>
    Task<SignatureResultDto> SignDocumentAsync(
        int    idUsuario,
        string nombreUsuario,
        string? cedulaUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto);

    // ── Consultas ────────────────────────────────────────────────────

    /// <summary>Lista todas las firmas DIITRA de un documento.</summary>
    Task<IEnumerable<SignatureRecordDto>> GetByDocumentAsync(string documentoUuid);

    /// <summary>
    /// Verifica la autenticidad de una firma por su código público.
    /// No requiere autenticación — endpoint público para QR o email.
    /// </summary>
    Task<SignatureVerificationDto> VerifyAsync(string firmaCode);

    // ── Revocación ───────────────────────────────────────────────────

    /// <summary>
    /// Revoca una firma con un motivo. Solo el firmante o un admin puede revocarla.
    /// Registra el evento REVOCADA en el log de auditoría.
    /// </summary>
    Task<bool> RevokeAsync(int idUsuarioSolicitante, RevokeSignatureDto dto, bool esAdmin = false);
}
