using iText.IO.Image;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Diitra.Infrastructure.Common.Documents.Engine
{
    /// <summary>
    /// Cargador de recursos de imagen desde el sistema de archivos.
    ///
    /// Las imágenes institucionales (portadas, fondos, logos) se almacenan como
    /// archivos físicos .jpg en Resources/Images/, en lugar de strings Base64
    /// embebidos en código C#.
    ///
    /// FLUJO DE DESARROLLO:
    ///   - En modo Development → busca directamente en el código fuente.
    ///   - En modo Production  → busca en el directorio de publicación (copiado por .csproj).
    ///
    /// AGREGAR UNA NUEVA IMAGEN:
    ///   1. Colocar el archivo .jpg en Resources/Images/nombre_imagen.jpg
    ///   2. Agregar <None Update="..."> en el .csproj o extender el glob existente
    ///   3. Llamar LoadAsBase64Async("nombre_imagen") o LoadAsImageDataAsync("nombre_imagen")
    /// </summary>
    public class ImageResourceLoader
    {
        private readonly string _sourceRoot;
        private readonly bool _isDevelopment;
        private readonly ILogger<ImageResourceLoader>? _logger;

        private const string ImagesRelativePath = "Common/Documents/Resources/Images";

        public ImageResourceLoader(IHostEnvironment environment, ILogger<ImageResourceLoader>? logger = null)
        {
            _isDevelopment = environment.IsDevelopment();
            _logger = logger;

            _sourceRoot = _isDevelopment
                ? FindSourceRoot()
                : Path.Combine(AppContext.BaseDirectory, ImagesRelativePath);
        }

        /// <summary>
        /// Carga una imagen como string Base64 (para inyectar en HTML/CSS vía Handlebars).
        /// Devuelve null si el archivo no existe.
        /// </summary>
        public async Task<string?> LoadAsBase64Async(string imageName)
        {
            var filePath = GetImagePath(imageName);

            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("ImageResourceLoader: Imagen '{Name}' no encontrada en '{Path}'.", imageName, filePath);
                return null;
            }

            var bytes = await File.ReadAllBytesAsync(filePath);
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Carga una imagen como iText ImageData (para usar directamente en el renderizador PDF).
        /// Devuelve null si el archivo no existe.
        /// </summary>
        public async Task<ImageData?> LoadAsImageDataAsync(string imageName)
        {
            var filePath = GetImagePath(imageName);

            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("ImageResourceLoader: Imagen '{Name}' no encontrada en '{Path}'.", imageName, filePath);
                return null;
            }

            var bytes = await File.ReadAllBytesAsync(filePath);
            return await Task.FromResult(ImageDataFactory.Create(bytes));
        }

        private string GetImagePath(string imageName)
        {
            // Añadimos la extensión si no la tiene
            var fileName = imageName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                           imageName.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
                ? imageName
                : $"{imageName}.jpg";

            return Path.Combine(_sourceRoot, fileName);
        }

        private string FindSourceRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && dir.Name != "diitra_infrastructure")
            {
                dir = dir.Parent;
                if (dir?.Parent == null)
                    return Path.Combine(AppContext.BaseDirectory, ImagesRelativePath);
            }

            return dir != null
                ? Path.Combine(dir.FullName, ImagesRelativePath)
                : Path.Combine(AppContext.BaseDirectory, ImagesRelativePath);
        }
    }
}
