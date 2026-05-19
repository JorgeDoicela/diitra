using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Infrastructure.Common.Storage;
using System.IO;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/storage")]
    public class StorageController : ControllerBase
    {
        private readonly IFileStorageService _storageService;

        public StorageController(IFileStorageService storageService)
        {
            _storageService = storageService;
        }

        [HttpGet("{*filePath}")]
        [AllowAnonymous] // Dependiendo de las políticas de privacidad, puede requerir [Authorize]
        public async Task<IActionResult> GetFile(string filePath)
        {
            try
            {
                var fileBytes = await _storageService.GetFileAsync(filePath);
                
                // Determinar el MIME type básico (se puede mejorar usando FileExtensionContentTypeProvider)
                var extension = Path.GetExtension(filePath).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".jpg" => "image/jpeg",
                    ".jpeg" => "image/jpeg",
                    ".gif" => "image/gif",
                    ".pdf" => "application/pdf",
                    _ => "application/octet-stream"
                };

                return File(fileBytes, contentType);
            }
            catch (FileNotFoundException)
            {
                return NotFound();
            }
        }
    }
}
