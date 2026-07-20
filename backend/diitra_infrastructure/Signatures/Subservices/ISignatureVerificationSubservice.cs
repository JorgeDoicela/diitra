using diitra_application.Signatures;

namespace diitra_infrastructure.Signatures.Subservices;

public interface ISignatureVerificationSubservice
{
    Task<IEnumerable<SignatureRecordDto>> GetByDocumentAsync(string documentoUuid);
    Task<SignatureVerificationDto> VerifyAsync(string firmaCode);
}
