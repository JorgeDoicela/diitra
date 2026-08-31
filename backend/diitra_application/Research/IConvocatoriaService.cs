using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IConvocatoriaService
{
    Task<IEnumerable<ConvocatoriaDto>> GetAllAsync();
    Task<ConvocatoriaDto?> GetByUuidAsync(string uuid);
    Task<string> CreateAsync(CreateConvocatoriaDto dto);
    Task<bool> UpdateAsync(string uuid, CreateConvocatoriaDto dto);
    Task<bool> ChangeStatusAsync(string uuid, string newState);
    Task<bool> PublishWithAudienceAsync(string uuid, PublishConvocatoriaRequest request);
    Task<bool> DeleteAsync(string uuid, string? userIdRef = null);
    Task<bool> RestoreAsync(string uuid, string? userIdRef = null);
    Task<bool> PurgeAsync(string uuid, string? userIdRef = null);
    Task<IEnumerable<PeriodoDto>> GetActivePeriodsAsync();
    Task<IEnumerable<object>> GetCatalogosTiposAsync();
    Task<IEnumerable<object>> GetCatalogosAgendasAsync();
    Task<IEnumerable<object>> GetCatalogosRubricasAsync();
    Task<IEnumerable<object>> GetCatalogosLineasAsync();
}
