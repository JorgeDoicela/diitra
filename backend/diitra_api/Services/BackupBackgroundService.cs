using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySqlConnector; // Proporcionado por Pomelo.EntityFrameworkCore.MySql de forma transitiva
using diitra_infrastructure.data.models;

namespace diitra_api.Services;

/// <summary>
/// Servicio en segundo plano para la automatización de copias de seguridad locales 
/// de la base de datos (filtradas por prefijo "inv_") y de los archivos físicos (uploads),
/// además de la aplicación de la política de retención (eliminación).
/// </summary>
public class BackupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackupBackgroundService> _logger;
    private readonly IConfiguration _configuration;
    private DateTime _lastRunDate = DateTime.MinValue.Date;

    public BackupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<BackupBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DIITRA Backup Background Service iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;
                
                // Programación automática (CRON simplificado, ej. "0 2 * * *" -> 2:00 AM)
                var scheduleTimeRaw = _configuration["BackupSettings:AutoScheduleCron"] ?? "0 2 * * *";
                int targetHour = 2; // Por defecto a las 2 AM
                
                var parts = scheduleTimeRaw.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2 && int.TryParse(parts[1], out int parsedHour))
                {
                    targetHour = parsedHour;
                }

                if (now.Hour == targetHour && now.Date > _lastRunDate)
                {
                    _logger.LogInformation("Iniciando ejecución programada de respaldos DIITRA.");
                    await RunBackupAndRetentionAsync(stoppingToken);
                    _lastRunDate = now.Date;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el ciclo del servicio de respaldos DIITRA.");
            }

            // Esperar 15 minutos antes de volver a verificar el horario
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }

    public async Task RunBackupAndRetentionAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<DiitraContext>();
        
        var sourceFolder = _configuration["BackupSettings:SourceFolder"] ?? "uploads";
        var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
        var tablePrefix = _configuration["BackupSettings:TablePrefix"] ?? "inv_";
        int retentionDays = int.TryParse(_configuration["BackupSettings:RetentionDays"], out int days) ? days : 30;

        // Rutas absolutas auto-contenidas
        var rootDir = Directory.GetCurrentDirectory();
        var sourceAbsPath = Path.GetFullPath(Path.Combine(rootDir, sourceFolder));
        var destAbsPath = Path.GetFullPath(Path.Combine(rootDir, destFolder));

        if (!Directory.Exists(destAbsPath))
        {
            Directory.CreateDirectory(destAbsPath);
        }

        string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

        // 1. RESPALDO DE BASE DE DATOS (Solo tablas del módulo DIITRA prefixed con inv_)
        await RespaldoBaseDatosAsync(context, destAbsPath, tablePrefix, timestamp, cancellationToken);

        // 2. RESPALDO DE ARCHIVOS FÍSICOS (Uploads)
        await RespaldoArchivosFisicosAsync(context, sourceAbsPath, destAbsPath, timestamp, cancellationToken);

        // 3. APLICAR POLÍTICA DE RETENCIÓN (Eliminar respaldos locales antiguos)
        await AplicarRetencionAsync(context, destAbsPath, retentionDays);
    }

    private async Task RespaldoBaseDatosAsync(
        DiitraContext context, 
        string destAbsPath, 
        string prefix, 
        string timestamp, 
        CancellationToken cancellationToken)
    {
        var log = new InvBackupLog
        {
            Uuid = Guid.NewGuid(),
            Tipo = "BaseDatos",
            Destino = destAbsPath,
            Estado = "En_Proceso",
            FechaBackup = DateTime.Now,
            NombreArchivo = $"db_backup_{timestamp}.sql"
        };

        context.InvBackupLogs.Add(log);
        await context.SaveChangesAsync(cancellationToken);

        var fileBackupPath = Path.Combine(destAbsPath, log.NombreArchivo);

        try
        {
            var connString = _configuration.GetConnectionString("default_connection");
            if (string.IsNullOrEmpty(connString)) throw new InvalidOperationException("Cadena de conexión vacía.");

            using var conn = new MySqlConnection(connString);
            await conn.OpenAsync(cancellationToken);

            // Obtener tablas con el prefijo inv_
            var tables = new System.Collections.Generic.List<string>();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SHOW TABLES;";
                using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        var tName = reader.GetString(0);
                        if (tName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                        {
                            tables.Add(tName);
                        }
                    }
                }
            }

            var sb = new StringBuilder();
            sb.AppendLine("-- =============================================================================");
            sb.AppendLine($"-- DIITRA DATABASE BACKUP (FILTRADO POR PREFIJO '{prefix}')");
            sb.AppendLine($"-- Generado: {DateTime.Now}");
            sb.AppendLine("-- =============================================================================");
            sb.AppendLine("SET FOREIGN_KEY_CHECKS = 0;");
            sb.AppendLine();

            foreach (var table in tables)
            {
                // 1. Estructura de la Tabla
                sb.AppendLine($"-- Estructura de tabla para `{table}`");
                sb.AppendLine($"DROP TABLE IF EXISTS `{table}`;");
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"SHOW CREATE TABLE `{table}`;";
                    using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
                    {
                        if (await reader.ReadAsync(cancellationToken))
                        {
                            var createScript = reader.GetString(1);
                            sb.AppendLine(createScript + ";");
                        }
                    }
                }
                sb.AppendLine();

                // 2. Volcado de Datos de la Tabla
                sb.AppendLine($"-- Datos de la tabla `{table}`");
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = $"SELECT * FROM `{table}`;";
                    using (var reader = await cmd.ExecuteReaderAsync(cancellationToken))
                    {
                        var colNames = new System.Collections.Generic.List<string>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            colNames.Add($"`{reader.GetName(i)}`");
                        }
                        var colStr = string.Join(", ", colNames);

                        while (await reader.ReadAsync(cancellationToken))
                        {
                            var values = new System.Collections.Generic.List<string>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                if (reader.IsDBNull(i))
                                {
                                    values.Add("NULL");
                                }
                                else
                                {
                                    var val = reader.GetValue(i);
                                    if (val is string || val is Guid || val is DateTime || val is DateOnly || val is TimeOnly)
                                    {
                                        var escapedVal = val.ToString()!.Replace("'", "''");
                                        values.Add($"'{escapedVal}'");
                                    }
                                    else if (val is bool b)
                                    {
                                        values.Add(b ? "1" : "0");
                                    }
                                    else if (val is byte[] bytes)
                                    {
                                        var hex = BitConverter.ToString(bytes).Replace("-", "");
                                        values.Add($"0x{hex}");
                                    }
                                    else
                                    {
                                        // Números
                                        values.Add(val.ToString()!.Replace(",", ".")); // Asegura punto decimal en SQL
                                    }
                                }
                            }
                            sb.AppendLine($"INSERT INTO `{table}` ({colStr}) VALUES ({string.Join(", ", values)});");
                        }
                    }
                }
                sb.AppendLine();
            }

            sb.AppendLine("SET FOREIGN_KEY_CHECKS = 1;");

            await File.WriteAllTextAsync(fileBackupPath, sb.ToString(), Encoding.UTF8, cancellationToken);

            var fileInfo = new FileInfo(fileBackupPath);
            log.TamanioBytes = fileInfo.Length;
            log.Estado = "Exitoso";
            log.HashVerificacion = await GetSHA256HashAsync(fileBackupPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al respaldar la base de datos.");
            log.Estado = "Fallido";
            log.ErrorMensaje = ex.Message;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task RespaldoArchivosFisicosAsync(
        DiitraContext context, 
        string sourceAbsPath, 
        string destAbsPath, 
        string timestamp, 
        CancellationToken cancellationToken)
    {
        var log = new InvBackupLog
        {
            Uuid = Guid.NewGuid(),
            Tipo = "Archivos",
            Destino = destAbsPath,
            Estado = "En_Proceso",
            FechaBackup = DateTime.Now,
            NombreArchivo = $"uploads_backup_{timestamp}.zip"
        };

        context.InvBackupLogs.Add(log);
        await context.SaveChangesAsync(cancellationToken);

        var fileBackupPath = Path.Combine(destAbsPath, log.NombreArchivo);

        try
        {
            if (!Directory.Exists(sourceAbsPath))
            {
                throw new DirectoryNotFoundException($"La carpeta origen de archivos '{sourceAbsPath}' no existe.");
            }

            // Comprimir la carpeta de subidas en un archivo zip en segundo plano
            await Task.Run(() => ZipFile.CreateFromDirectory(sourceAbsPath, fileBackupPath, CompressionLevel.Optimal, false), cancellationToken);

            var fileInfo = new FileInfo(fileBackupPath);
            log.TamanioBytes = fileInfo.Length;
            log.Estado = "Exitoso";
            log.HashVerificacion = await GetSHA256HashAsync(fileBackupPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al respaldar archivos físicos.");
            log.Estado = "Fallido";
            log.ErrorMensaje = ex.Message;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task AplicarRetencionAsync(DiitraContext context, string destAbsPath, int retentionDays)
    {
        try
        {
            var limitDate = DateTime.Now.AddDays(-retentionDays);

            // Obtener respaldos exitosos registrados antes de la fecha límite
            var oldLogs = await context.InvBackupLogs
                .Where(l => l.FechaBackup < limitDate && l.Estado == "Exitoso")
                .ToListAsync();

            foreach (var log in oldLogs)
            {
                var filePath = Path.Combine(destAbsPath, log.NombreArchivo);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation("Archivo de respaldo antiguo eliminado por retención: {File}", log.NombreArchivo);
                }

                // Actualizamos el estado del log para indicar que fue purgado físicamente
                log.Estado = "Fallido";
                log.ErrorMensaje = $"Archivo eliminado automáticamente por política de retención ({retentionDays} días).";
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al aplicar política de retención de respaldos.");
        }
    }

    private static async Task<string> GetSHA256HashAsync(string filePath)
    {
        using var sha256 = SHA256.Create();
        using var stream = File.OpenRead(filePath);
        byte[] hashBytes = await sha256.ComputeHashAsync(stream);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }
}
