using System.Threading.Tasks;

namespace Diitra.Application.Research
{
    public interface IProjectPublishingService
    {
        Task<CacesExportResult> ExportCacesCsvAsync(string projectUuid);
        Task<PublishDSpaceResult> PublishDSpaceAsync(string projectUuid, string? requestedBy);
    }

    public class CacesExportResult
    {
        public bool Success { get; set; }
        public byte[]? CsvBytes { get; set; }
        public string? FileName { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class PublishDSpaceResult
    {
        public bool Success { get; set; }
        public string? Uri { get; set; }
        public string? ErrorMessage { get; set; }
        public int StatusCode { get; set; } = 400;
    }
}
