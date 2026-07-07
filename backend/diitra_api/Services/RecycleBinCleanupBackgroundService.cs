using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using diitra_infrastructure.data.models;
using diitra_application.Research;
using Diitra.Application.Research;

namespace diitra_api.Services
{
    /// <summary>
    /// Servicio en segundo plano para purgar automáticamente los elementos de la papelera
    /// de reciclaje que hayan superado los 30 días de retención.
    /// </summary>
    public class RecycleBinCleanupBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RecycleBinCleanupBackgroundService> _logger;

        public RecycleBinCleanupBackgroundService(
            IServiceProvider serviceProvider, 
            ILogger<RecycleBinCleanupBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DIITRA Recycle Bin Cleanup Service iniciado.");

            // Esperar un momento al iniciar para no retrasar el inicio de la aplicación
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Ejecutando limpieza programada de papelera de reciclaje.");
                    await CleanExpiredItemsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error durante la limpieza automática de la papelera.");
                }

                // Ejecutar una vez al día
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task CleanExpiredItemsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<DiitraContext>();
            var projectOrchestrator = scope.ServiceProvider.GetRequiredService<IProjectOrchestrator>();
            var convocatoriaService = scope.ServiceProvider.GetRequiredService<IConvocatoriaService>();
            var groupsService = scope.ServiceProvider.GetRequiredService<IGroupsService>();

            var expirationLimit = DateTime.UtcNow.AddDays(-30);

            // 1. Purgar Proyectos
            var expiredProjects = await context.InvProyectos
                .IgnoreQueryFilters()
                .Where(p => p.Eliminado == true && p.FechaEliminacion != null && p.FechaEliminacion < expirationLimit)
                .Select(p => p.Uuid)
                .ToListAsync();

            if (expiredProjects.Any())
            {
                _logger.LogInformation("Encontrados {Count} proyectos expirados en la papelera. Iniciando purga.", expiredProjects.Count);
                foreach (var uuid in expiredProjects)
                {
                    try
                    {
                        var result = await projectOrchestrator.PurgeProjectAsync(uuid, "SYSTEM_CLEANUP");
                        if (!result.Success)
                        {
                            _logger.LogWarning("No se pudo purgar proyecto {Uuid}: {Message}", uuid, result.Message);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error purgando proyecto expirado UUID: {Uuid}", uuid);
                    }
                }
            }

            // 2. Purgar Convocatorias
            var expiredConvs = await context.InvConvocatorias
                .IgnoreQueryFilters()
                .Where(c => c.Eliminado == true && c.FechaEliminacion != null && c.FechaEliminacion < expirationLimit)
                .Select(c => c.Uuid)
                .ToListAsync();

            if (expiredConvs.Any())
            {
                _logger.LogInformation("Encontrados {Count} convocatorias expiradas en la papelera. Iniciando purga.", expiredConvs.Count);
                foreach (var uuid in expiredConvs)
                {
                    try
                    {
                        var success = await convocatoriaService.PurgeAsync(uuid, "SYSTEM_CLEANUP");
                        if (!success)
                        {
                            _logger.LogWarning("No se pudo purgar convocatoria {Uuid}", uuid);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error purgando convocatoria expirada UUID: {Uuid}", uuid);
                    }
                }
            }

            // 3. Purgar Grupos
            var expiredGroups = await context.InvGruposInvestigacion
                .IgnoreQueryFilters()
                .Where(g => g.Eliminado == true && g.FechaEliminacion != null && g.FechaEliminacion < expirationLimit)
                .Select(g => g.Uuid)
                .ToListAsync();

            if (expiredGroups.Any())
            {
                _logger.LogInformation("Encontrados {Count} grupos expirados en la papelera. Iniciando purga.", expiredGroups.Count);
                foreach (var uuid in expiredGroups)
                {
                    try
                    {
                        var success = await groupsService.PurgeAsync(uuid, "SYSTEM_CLEANUP");
                        if (!success)
                        {
                            _logger.LogWarning("No se pudo purgar grupo {Uuid}", uuid);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error purgando grupo expirado UUID: {Uuid}", uuid);
                    }
                }
            }
        }
    }
}
