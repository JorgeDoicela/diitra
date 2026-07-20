using diitra_application.Signatures;

namespace diitra_infrastructure.Signatures.Subservices;

public interface IP12SignatureSubservice
{
    Task<SignatureResultDto> SignDocumentWithP12Async(
        int idUsuario,
        string ipAddress,
        string userAgent,
        byte[] certificateBytes,
        string certificatePassword,
        string documentoUuid,
        string? rolFirmante);
}
