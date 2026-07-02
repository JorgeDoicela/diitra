using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using diitra_application.Research;

namespace diitra_api.Services;

/// <summary>
/// Job en segundo plano que se ejecuta diariamente a las 7:00 AM (hora Ecuador UTC-5).
/// Procesa las alertas de email del calendario para eventos próximos configurados en
/// inv_calendario_eventos_normativos con alertaDias > 0.
/// Sigue el mismo patrón que BackupBackgroundService.
/// </summary>
public class CalendarioAlertasJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CalendarioAlertasJob> _logger;
    private DateTime _lastRunDate = DateTime.MinValue.Date;

    public CalendarioAlertasJob(
        IServiceProvider serviceProvider,
        ILogger<CalendarioAlertasJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[CalendarioAlertasJob] Iniciado. Ejecutará a las 7:00 AM diariamente.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var ahora = DateTime.Now;
                var hoyDate = ahora.Date;

                // Ejecutar solo una vez al día a las 7:00 AM
                if (ahora.Hour == 7 && _lastRunDate < hoyDate)
                {
                    _lastRunDate = hoyDate;
                    _logger.LogInformation("[CalendarioAlertasJob] Ejecutando proceso de alertas: {Fecha}", hoyDate.ToString("dd/MM/yyyy"));

                    using var scope = _serviceProvider.CreateScope();
                    var calendarioService = scope.ServiceProvider.GetRequiredService<ICalendarioService>();

                    await calendarioService.ProcesarAlertasDiariasAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CalendarioAlertasJob] Error en la ejecución del job.");
            }

            // Verificar cada 15 minutos
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
