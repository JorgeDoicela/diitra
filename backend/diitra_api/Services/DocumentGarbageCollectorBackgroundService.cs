using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Diitra.Application.Common.Documents;

namespace diitra_api.Services
{
    /// <summary>
    /// Servicio en segundo plano para purgar de forma programada a medianoche los archivos PDF
    /// obsoletos que correspondan a revisiones intermedias ya corregidas y superadas.
    /// </summary>
    public class DocumentGarbageCollectorBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DocumentGarbageCollectorBackgroundService> _logger;

        public DocumentGarbageCollectorBackgroundService(
            IServiceProvider serviceProvider, 
            ILogger<DocumentGarbageCollectorBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DIITRA Document Garbage Collector Service iniciado.");

            // Esperar 45 segundos al iniciar para no sobrecargar el arranque de la API
            await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Ejecutando depuración programada de PDFs preliminares obsoletos.");
                    using var scope = _serviceProvider.CreateScope();
                    var documentInstanceService = scope.ServiceProvider.GetRequiredService<IDocumentInstanceService>();
                    
                    int purgedCount = await documentInstanceService.PurgeAllObsoleteDocumentFilesAsync("SYSTEM_BACKGROUND_JOB", stoppingToken);
                    
                    if (purgedCount > 0)
                    {
                        _logger.LogInformation("Depuración completada. Se eliminaron físicamente {Count} archivos obsoletos del almacenamiento.", purgedCount);
                    }
                    else
                    {
                        _logger.LogInformation("Depuración completada. No se encontraron archivos obsoletos para depurar.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error durante la depuración automática de archivos de documentos.");
                }

                // Ejecutar una vez al día (cada 24 horas)
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
