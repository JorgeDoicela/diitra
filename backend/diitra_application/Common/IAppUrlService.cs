namespace diitra_application.Common;

/// <summary>
/// Provee la resolución centralizada y única de las URLs del Frontend para entornos de desarrollo y producción.
/// Permite que toda la plataforma (Magic Links, correos, validación QR de documentos y firmas) obtenga
/// la URL base directamente de la configuración (appsettings / variables de entorno) como única fuente de la verdad.
/// </summary>
public interface IAppUrlService
{
    /// <summary>
    /// Obtiene la URL base del frontend sin barra al final (ej: "http://localhost:3000" o "https://diitra.istpet.edu.ec").
    /// </summary>
    string GetFrontendUrl();

    /// <summary>
    /// Construye una URL absoluta hacia una ruta relativa del frontend.
    /// </summary>
    /// <param name="relativePath">Ruta relativa (ej: "/auth/magic-link" o "documentos/verificar/123")</param>
    string BuildFrontendUrl(string relativePath);
}
