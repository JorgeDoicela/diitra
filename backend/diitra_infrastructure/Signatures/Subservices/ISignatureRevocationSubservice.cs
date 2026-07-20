using diitra_application.Signatures;

namespace diitra_infrastructure.Signatures.Subservices;

public interface ISignatureRevocationSubservice
{
    Task<bool> RevokeAsync(int idUsuarioSolicitante, RevokeSignatureDto dto, bool esAdmin = false);
}
