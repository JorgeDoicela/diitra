using diitra_application.Signatures;

namespace diitra_infrastructure.Signatures.Subservices;

public interface IDiitraInternalSignerSubservice
{
    Task<SignatureResultDto> SignDocumentAsync(
        int idUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto);
}
