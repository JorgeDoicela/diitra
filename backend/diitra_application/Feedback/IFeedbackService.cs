using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Feedback.DTOs;

namespace diitra_application.Feedback;

public interface IFeedbackService
{
    FeedbackSupportConfigDto GetSupportConfig();
    Task<FeedbackReporteDto> CreateFeedbackAsync(CreateFeedbackDto dto, int? idUsuario, string? cedula, string nombreUsuario, string rolUsuario);
    Task<List<FeedbackReporteDto>> GetAllFeedbackAsync(string? tipo = null, string? estado = null);
    Task<List<FeedbackReporteDto>> GetMyFeedbackAsync(int? idUsuario, string? cedula);
    Task<FeedbackReporteDto?> UpdateStatusAsync(int idFeedback, UpdateFeedbackStatusDto dto);
    Task<FeedbackReporteDto?> UpdateUserFeedbackAsync(int idFeedback, UpdateUserFeedbackDto dto, int? idUsuario, string? cedula, bool isSuperAdmin);
    Task<bool> DeleteFeedbackAsync(int idFeedback, int? idUsuario, string? cedula, bool isSuperAdmin);
}
