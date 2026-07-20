using diitra_application.Signatures;
using diitra_infrastructure.Signatures.Subservices;

namespace diitra_infrastructure.Signatures;

/// <summary>
/// Fachada (Facade Pattern) para el módulo DIITRA Firma.
/// Orquesta y delega responsabilidades a los subservicios especializados:
///   • ISignatureProfileSubservice: Gestión de perfiles de firma
///   • IDiitraInternalSignerSubservice: Firma DIITRA básica (HMAC + PDF Stamper)
///   • IP12SignatureSubservice: Firma electrónica avanzada PAdES (.p12)
///   • ISignatureVerificationSubservice: Consultas y verificación criptográfica
///   • ISignatureRevocationSubservice: Revocación de firmas y auditoría
/// </summary>
public class DiitraSignatureService : IDiitraSignatureService
{
    private readonly ISignatureProfileSubservice _profileSubservice;
    private readonly IDiitraInternalSignerSubservice _internalSignerSubservice;
    private readonly IP12SignatureSubservice _p12SignerSubservice;
    private readonly ISignatureVerificationSubservice _verificationSubservice;
    private readonly ISignatureRevocationSubservice _revocationSubservice;

    public DiitraSignatureService(
        ISignatureProfileSubservice profileSubservice,
        IDiitraInternalSignerSubservice internalSignerSubservice,
        IP12SignatureSubservice p12SignerSubservice,
        ISignatureVerificationSubservice verificationSubservice,
        ISignatureRevocationSubservice revocationSubservice)
    {
        _profileSubservice = profileSubservice;
        _internalSignerSubservice = internalSignerSubservice;
        _p12SignerSubservice = p12SignerSubservice;
        _verificationSubservice = verificationSubservice;
        _revocationSubservice = revocationSubservice;
    }

    // ── Perfil ──────────────────────────────────────────────────────

    public Task<UserSignatureProfileDto?> GetProfileAsync(int idUsuario) =>
        _profileSubservice.GetProfileAsync(idUsuario);

    public Task<UserSignatureProfileDto> UpsertProfileAsync(int idUsuario, UpdateSignatureProfileDto dto) =>
        _profileSubservice.UpsertProfileAsync(idUsuario, dto);

    // ── Firma ────────────────────────────────────────────────────────

    public Task<SignatureResultDto> SignDocumentAsync(
        int idUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto) =>
        _internalSignerSubservice.SignDocumentAsync(idUsuario, ipAddress, userAgent, dto);

    public Task<SignatureResultDto> SignDocumentWithP12Async(
        int idUsuario,
        string ipAddress,
        string userAgent,
        byte[] certificateBytes,
        string certificatePassword,
        string documentoUuid,
        string? rolFirmante) =>
        _p12SignerSubservice.SignDocumentWithP12Async(
            idUsuario, ipAddress, userAgent, certificateBytes, certificatePassword, documentoUuid, rolFirmante);

    // ── Consultas ────────────────────────────────────────────────────

    public Task<IEnumerable<SignatureRecordDto>> GetByDocumentAsync(string documentoUuid) =>
        _verificationSubservice.GetByDocumentAsync(documentoUuid);

    public Task<SignatureVerificationDto> VerifyAsync(string firmaCode) =>
        _verificationSubservice.VerifyAsync(firmaCode);

    // ── Revocación ───────────────────────────────────────────────────

    public Task<bool> RevokeAsync(int idUsuarioSolicitante, RevokeSignatureDto dto, bool esAdmin = false) =>
        _revocationSubservice.RevokeAsync(idUsuarioSolicitante, dto, esAdmin);
}
