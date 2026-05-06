using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Diitra.Infrastructure.Common.Storage
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Guarda un archivo binario en el almacenamiento.
        /// </summary>
        /// <returns>La ruta relativa del archivo guardado.</returns>
        Task<string> SaveFileAsync(string fileName, byte[] content, string subFolder = "documents");
        
        Task<byte[]> GetFileAsync(string filePath);
        
        Task DeleteFileAsync(string filePath);
    }

    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;

        public LocalFileStorageService(IConfiguration configuration)
        {
            // El programador puede configurar esto en appsettings.json
            // Si no existe, usamos una carpeta por defecto fuera del root por seguridad
            _basePath = configuration["Storage:BasePath"] ?? Path.Combine(AppContext.BaseDirectory, "diitra_data");
            
            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
            }
        }

        public async Task<string> SaveFileAsync(string fileName, byte[] content, string subFolder = "documents")
        {
            var folderPath = Path.Combine(_basePath, subFolder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // Evitar colisiones de nombres usando un timestamp + nombre original
            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{fileName}";
            var fullPath = Path.Combine(folderPath, uniqueFileName);

            await File.WriteAllBytesAsync(fullPath, content);

            // Retornamos la ruta relativa (para guardar en la base de datos)
            return Path.Combine(subFolder, uniqueFileName);
        }

        public async Task<byte[]> GetFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_basePath, filePath);
            if (!File.Exists(fullPath))
                throw new FileNotFoundException("El archivo no existe en el almacenamiento.");

            return await File.ReadAllBytesAsync(fullPath);
        }

        public async Task DeleteFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_basePath, filePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
            await Task.CompletedTask;
        }
    }
}
