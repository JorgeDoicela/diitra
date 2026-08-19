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

            // En desarrollo → lee directamente del código fuente (hot-reload).
            // En producción → lee desde el directorio de publicación (copiado por .csproj).
            _sourceRoot = _isDevelopment
                ? FindSourceRoot()
                : Path.Combine(AppContext.BaseDirectory, TemplatesRelativePath);
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
        /// Carga el CSS de una plantilla dado su código (ej: "PROTOCOLO_INVESTIGACION").
        /// Devuelve null si el archivo .css hermano no existe.
        /// </summary>
        public async Task<string?> LoadCssAsync(string templateCode)
        {
            var htmlPath = ResolveFilePath(templateCode);
            var cssPath = Path.ChangeExtension(htmlPath, ".css");

            if (!File.Exists(cssPath))
            {
                return null;
            }

            _logger?.LogDebug("TemplateFileLoader: Cargando CSS asociado '{Code}' desde '{Path}'.", templateCode, cssPath);
            return await File.ReadAllTextAsync(cssPath);
        }

        /// <summary>
        /// Sincroniza el HTML (y opcionalmente CSS) actualizado de una plantilla hacia el archivo físico en disco.
        /// </summary>
        public async Task SaveAsync(string templateCode, string htmlContent, string? customCss = null)
        {
            try
            {
                var filePath = ResolveFilePath(templateCode);
                var dir = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                await File.WriteAllTextAsync(filePath, htmlContent, System.Text.Encoding.UTF8);

                if (customCss != null)
                {
                    var cssPath = Path.ChangeExtension(filePath, ".css");
                    await File.WriteAllTextAsync(cssPath, customCss, System.Text.Encoding.UTF8);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "TemplateFileLoader: No se pudo guardar en disco para la plantilla '{Code}'", templateCode);
            }
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
                ["RUBRICA_EVALUACION"]            = "Investigacion/RubricaEvaluacion.html",
                ["INFORME_AVANCE"]                = "Investigacion/InformeAvance.html",
                ["REPORTE_ANALITICAS"]            = "Investigacion/ReporteAnaliticas.html",
                ["DICTAMEN_ARBITRAJE"]            = "Investigacion/DictamenArbitraje.html",
                ["OFICIO_APROBACION"]             = "Investigacion/OficioAprobacion.html",
                ["CERTIFICADO_COMPLETACION"]      = "Investigacion/CertificadoCompletacion.html",
                ["CERTIFICADO_PARTICIPACION_GRUPO"] = "Investigacion/CertificadoGrupo.html",
                ["PROPUESTA_GRUPO_INVESTIGACION"] = "Investigacion/PropuestaGrupoInvestigacion.html",
            };

            if (map.TryGetValue(templateCode, out var relativePath))
            {
                return Path.Combine(_sourceRoot, relativePath);
            }

            // BÚSQUEDA RECURSIVA DESACOPLADA (Zero-Configuration):
            // Si no está mapeado explícitamente, buscamos de forma recursiva en el árbol de directorios 
            // de templates si existe un archivo llamado "{templateCode}.html" (sin importar mayúsculas/minúsculas).
            var targetFileName = $"{templateCode}.html";
            try
            {
                if (Directory.Exists(_sourceRoot))
                {
                    var files = Directory.GetFiles(_sourceRoot, "*.html", SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        var name = Path.GetFileName(file);
                        if (name.Equals(targetFileName, StringComparison.OrdinalIgnoreCase))
                        {
                            return file;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "TemplateFileLoader: Error en la búsqueda recursiva de la plantilla '{Code}'.", templateCode);
            }

            // Fallback clásico por defecto
            return Path.Combine(_sourceRoot, targetFileName);
        }

        /// <summary>
        /// Localiza la carpeta raíz del proyecto de infraestructura navegando hacia arriba
        /// desde el directorio de salida del ejecutable (bin/Debug/net8.0).
        /// Esto es solo para el entorno de Desarrollo.
        /// </summary>
        private string FindSourceRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                // check if the current directory contains the sibling "diitra_infrastructure" subfolder
                var infraPath = Path.Combine(dir.FullName, "diitra_infrastructure");
                if (Directory.Exists(infraPath))
                {
                    var targetPath = Path.Combine(infraPath, TemplatesRelativePath);
                    if (Directory.Exists(targetPath))
                    {
                        return targetPath;
                    }
                }

                // or if we are already inside "diitra_infrastructure"
                if (dir.Name.Equals("diitra_infrastructure", StringComparison.OrdinalIgnoreCase))
                {
                    var targetPath = Path.Combine(dir.FullName, TemplatesRelativePath);
                    if (Directory.Exists(targetPath))
                    {
                        return targetPath;
                    }
                }

                dir = dir.Parent;
            }

            return Path.Combine(AppContext.BaseDirectory, TemplatesRelativePath);
        }
    }
}
