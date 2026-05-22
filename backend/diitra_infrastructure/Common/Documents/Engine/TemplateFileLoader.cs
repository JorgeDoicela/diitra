using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Cargador de plantillas HTML desde el sistema de archivos.
    ///
    /// FLUJO DE DESARROLLO:
    ///   - En modo Development → lee el archivo .html directamente desde el código fuente
    ///     (no requiere recompilar para ver cambios de diseño).
    ///   - En modo Production  → lee el archivo .html desde la carpeta de publicación
    ///     (copiado automáticamente por el .csproj).
    ///
    /// AGREGAR UNA NUEVA PLANTILLA:
    ///   1. Crear el archivo .html en Templates/{Categoria}/{NombrePlantilla}.html
    ///   2. Registrar el código en DocumentTemplateRegistry.cs usando TemplateFileLoader.LoadAsync()
    ///   3. Agregar la entrada <None Update="..."> en el .csproj (o usar el glob existente)
    ///   ¡Listo! Sin recompilar, sin cambiar versiones, sin tocar C#.
    /// </summary>
    public class TemplateFileLoader
    {
        private readonly string _sourceRoot;
        private readonly bool _isDevelopment;
        private readonly ILogger<TemplateFileLoader>? _logger;

        /// <summary>
        /// Ruta relativa desde la raíz del proyecto de infraestructura hasta la carpeta de plantillas.
        /// </summary>
        private const string TemplatesRelativePath = "Common/Documents/Templates";

        public TemplateFileLoader(IHostEnvironment environment, ILogger<TemplateFileLoader>? logger = null)
        {
            _isDevelopment = environment.IsDevelopment();
            _logger = logger;

            // En desarrollo, apuntamos directamente al código fuente para edición en caliente.
            // En producción, el .csproj ya se encarga de copiar los .html al directorio de salida.
            _sourceRoot = _isDevelopment
                ? FindSourceRoot()
                : Path.Combine(AppContext.BaseDirectory, "Templates");
        }

        /// <summary>
        /// Carga el HTML de una plantilla dado su código (ej: "PROTOCOLO_INVESTIGACION").
        /// Devuelve null si el archivo no existe (permitiendo fallback al registro estático).
        /// </summary>
        public async Task<string?> LoadAsync(string templateCode)
        {
            var filePath = ResolveFilePath(templateCode);

            if (!File.Exists(filePath))
            {
                _logger?.LogDebug(
                    "TemplateFileLoader: Archivo no encontrado para '{Code}' en '{Path}'. Usando fallback estático.",
                    templateCode, filePath);
                return null;
            }

            _logger?.LogDebug("TemplateFileLoader: Cargando plantilla '{Code}' desde '{Path}'.", templateCode, filePath);
            return await File.ReadAllTextAsync(filePath);
        }

        /// <summary>
        /// Resuelve la ruta física del archivo .html para un código de plantilla dado.
        /// Convención de nombres: PROTOCOLO_INVESTIGACION → ProyectoInvestigacion.html
        /// Mapa explícito de código → nombre de archivo.
        /// </summary>
        private string ResolveFilePath(string templateCode)
        {
            // Mapa: código de plantilla → ruta relativa dentro de Templates/
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["PROTOCOLO_INVESTIGACION"]       = "Investigacion/ProyectoInvestigacion.html",
                ["INFORME_FINAL_INVESTIGACION"]   = "Investigacion/InformeFinal.html",
                // Al agregar una nueva plantilla, añadir aquí una línea más:
                // ["MI_NUEVO_CODIGO"] = "Categoria/NombreArchivo.html",
            };

            if (!map.TryGetValue(templateCode, out var relativePath))
            {
                // Si no está en el mapa, intentar con el propio código como nombre de archivo
                relativePath = $"{templateCode}.html";
            }

            return Path.Combine(_sourceRoot, relativePath);
        }

        /// <summary>
        /// Localiza la carpeta raíz del proyecto de infraestructura navegando hacia arriba
        /// desde el directorio de salida del ejecutable (bin/Debug/net8.0).
        /// Esto es solo para el entorno de Desarrollo.
        /// </summary>
        private string FindSourceRoot()
        {
            // Subimos desde bin/Debug/net8.0 → bin/Debug → bin → [proyecto]
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && dir.Name != "diitra_infrastructure")
            {
                dir = dir.Parent;
                // Salvaguarda: si llegamos a la raíz del disco, usamos BaseDirectory
                if (dir?.Parent == null)
                {
                    return Path.Combine(AppContext.BaseDirectory, "Templates");
                }
            }

            return dir != null
                ? Path.Combine(dir.FullName, TemplatesRelativePath)
                : Path.Combine(AppContext.BaseDirectory, "Templates");
        }
    }
}
