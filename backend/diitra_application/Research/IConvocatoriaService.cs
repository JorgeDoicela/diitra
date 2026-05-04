using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IConvocatoriaService
{
    Task<IEnumerable<ConvocatoriaDto>> GetAllAsync();
    Task<ConvocatoriaDto?> GetByUuidAsync(string uuid);
    Task<string> CreateAsync(CreateConvocatoriaDto dto);
    Task<bool> UpdateAsync(string uuid, CreateConvocatoriaDto dto);
    Task<bool> ChangeStatusAsync(string uuid, string newState);
    Task<bool> DeleteAsync(string uuid);
    Task<IEnumerable<PeriodoDto>> GetActivePeriodsAsync();
    Task<IEnumerable<object>> GetCatalogosTiposAsync();
    Task<IEnumerable<object>> GetCatalogosAgendasAsync();
    Task<IEnumerable<object>> GetCatalogosRubricasAsync();
    Task<IEnumerable<object>> GetCatalogosLineasAsync();
}
