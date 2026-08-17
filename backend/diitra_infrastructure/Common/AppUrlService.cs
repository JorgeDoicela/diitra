using Microsoft.Extensions.Configuration;
using diitra_application.Common;

namespace diitra_infrastructure.Common;

/// <summary>
/// Implementación del servicio de resolución de URLs del Frontend.
/// Lee como fuente de la verdad la clave "FrontendUrl" de la configuración (appsettings.json,
/// appsettings.Production.json o variable de entorno FrontendUrl).
/// </summary>
public class AppUrlService : IAppUrlService
{
    private readonly IConfiguration _configuration;

    public AppUrlService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GetFrontendUrl()
    {
        // 1. Clave principal estándar: "FrontendUrl"
        // 2. Fallbacks de retrocompatibilidad: "App:FrontendUrl" o "Email:FrontendUrl"
        // 3. Fallback seguro local: "http://localhost:3000"
        var url = _configuration["FrontendUrl"]
                  ?? _configuration["App:FrontendUrl"]
                  ?? _configuration["Email:FrontendUrl"]
                  ?? "http://localhost:3000";

        return url.Trim().TrimEnd('/');
    }

    public string BuildFrontendUrl(string relativePath)
    {
        var baseUrl = GetFrontendUrl();
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return baseUrl;
        }

        var trimmedPath = relativePath.Trim();
        if (!trimmedPath.StartsWith("/"))
        {
            trimmedPath = "/" + trimmedPath;
        }

        return $"{baseUrl}{trimmedPath}";
    }
}
