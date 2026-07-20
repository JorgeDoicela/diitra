using diitra_application.Signatures;

namespace diitra_infrastructure.Signatures.Subservices;

public interface ISignatureProfileSubservice
{
    Task<UserSignatureProfileDto?> GetProfileAsync(int idUsuario);
    Task<UserSignatureProfileDto> UpsertProfileAsync(int idUsuario, UpdateSignatureProfileDto dto);
}
