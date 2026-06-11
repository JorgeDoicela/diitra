using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using diitra_infrastructure.Security;

namespace diitra_infrastructure.Research;

/// <summary>
/// Implementación del servicio de Informes de Avance.
/// Gestiona creación, validación y firma digital de informes periódicos de proyectos
/// conforme al Criterio I5 de calidad CACES.
/// </summary>
public class InformeAvanceService : IInformeAvanceService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;
    private readonly IFirmaElectronicaService _firmaService;
    private readonly ILogger<InformeAvanceService> _logger;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _env;

    public InformeAvanceService(
        DiitraContext context,
        IAuditService auditService,
        IFirmaElectronicaService firmaService,
        ILogger<InformeAvanceService> logger,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
    {
        _context = context;
        _auditService = auditService;
        _firmaService = firmaService;
        _logger = logger;
        _configuration = configuration;
        _env = env;
    }

    // ══════════════════════════════════════════════════════════════
    //  CONSULTAS
    // ══════════════════════════════════════════════════════════════

    public async Task<InformeAvanceDto?> GetByIdAsync(int id)
    {
        var informe = await _context.InvInformesAvance
            .Include(i => i.IdProyectoNavigation)
            .Include(i => i.ValidadoPorNavigation)
            .Include(i => i.InvEvidencias)
                .ThenInclude(e => e.IdTipoEvidenciaNavigation)
            .FirstOrDefaultAsync(i => i.IdInforme == id);

        return informe == null ? null : MapToDto(informe);
    }

    public async Task<IEnumerable<InformeAvanceDto>> GetByProjectAsync(int projectId)
    {
        var informes = await _context.InvInformesAvance
            .Include(i => i.IdProyectoNavigation)
            .Include(i => i.ValidadoPorNavigation)
            .Include(i => i.InvEvidencias)
                .ThenInclude(e => e.IdTipoEvidenciaNavigation)
            .Where(i => i.IdProyecto == projectId)
            .OrderBy(i => i.NumeroInforme)
            .ToListAsync();

        return informes.Select(i => MapToDto(i));
    }

    // ══════════════════════════════════════════════════════════════
    //  CREACIÓN
    // ══════════════════════════════════════════════════════════════

    public async Task<InformeAvanceDto> CreateAsync(CreateInformeAvanceDto dto, int directorId)
    {
        var project = await _context.InvProyectos.FindAsync(dto.IdProyecto)
            ?? throw new ArgumentException($"Proyecto {dto.IdProyecto} no encontrado.");

        if (project.Estado != "En Ejecución")
            throw new InvalidOperationException(
                $"Solo se pueden crear informes de avance en proyectos 'En Ejecución'. Estado actual: '{project.Estado}'.");

        // Número de informe: siguiente correlativo dentro del proyecto
        var ultimoNumero = await _context.InvInformesAvance
            .Where(i => i.IdProyecto == dto.IdProyecto)
            .MaxAsync(i => (int?)i.NumeroInforme) ?? 0;

        var informe = new InvInformeAvance
        {
            Uuid = Guid.NewGuid(),
            IdProyecto = dto.IdProyecto,
            NumeroInforme = ultimoNumero + 1,
            FechaReporte = dto.FechaReporte,
            ResumenActividades = dto.ResumenActividades,
            Estado = "Pendiente"
        };

        _context.InvInformesAvance.Add(informe);
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(directorId, "CREAR_INFORME_AVANCE",
            $"Informe #{informe.NumeroInforme} creado para el proyecto '{project.Titulo}'.",
            "INFORME_AVANCE",
            null,
            System.Text.Json.JsonSerializer.Serialize(new { informe.IdInforme, informe.NumeroInforme, informe.Estado }));

        _logger.LogInformation("[DIITRA] Informe de avance #{Num} creado para proyecto {PId}.",
            informe.NumeroInforme, dto.IdProyecto);

        return MapToDto(informe, project);
    }

    // ══════════════════════════════════════════════════════════════
    //  VALIDACIÓN POR EL DIRECTOR DE INVESTIGACIÓN
    // ══════════════════════════════════════════════════════════════

    public async Task<InformeAvanceDto?> AprobarAsync(int id, int directorInvestigacionId)
    {
        var informe = await _context.InvInformesAvance
            .Include(i => i.IdProyectoNavigation)
            .Include(i => i.InvEvidencias)
                .ThenInclude(e => e.IdTipoEvidenciaNavigation)
            .FirstOrDefaultAsync(i => i.IdInforme == id);

        if (informe == null) return null;

        if (informe.Estado == "Aprobado")
            throw new InvalidOperationException("El informe ya está aprobado.");

        string estadoAnterior = informe.Estado;
        informe.Estado = "Aprobado";
        informe.ValidadoPor = directorInvestigacionId;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(directorInvestigacionId, "APROBAR_INFORME_AVANCE",
            $"Informe #{informe.NumeroInforme} del proyecto '{informe.IdProyectoNavigation?.Titulo}' aprobado.",
            "INFORME_AVANCE",
            System.Text.Json.JsonSerializer.Serialize(new { Estado = estadoAnterior }),
            System.Text.Json.JsonSerializer.Serialize(new { informe.Estado, informe.ValidadoPor }));

        _logger.LogInformation("[DIITRA] Informe #{Num} aprobado por usuario {UserId}.",
            informe.NumeroInforme, directorInvestigacionId);

        var director = await _context.Users.FindAsync(directorInvestigacionId);
        informe.ValidadoPorNavigation = director;
        return MapToDto(informe);
    }

    public async Task<InformeAvanceDto?> ObservarAsync(int id, string observacion, int directorInvestigacionId)
    {
        var informe = await _context.InvInformesAvance
            .Include(i => i.IdProyectoNavigation)
            .Include(i => i.InvEvidencias)
                .ThenInclude(e => e.IdTipoEvidenciaNavigation)
            .FirstOrDefaultAsync(i => i.IdInforme == id);

        if (informe == null) return null;

        if (informe.Estado == "Aprobado")
            throw new InvalidOperationException("No se puede observar un informe ya aprobado.");

        string estadoAnterior = informe.Estado;

        // Preservar la observación como prefijo en ResumenActividades para trazabilidad
        informe.ResumenActividades = $"[OBSERVACIÓN DEL DIRECTOR DE INVESTIGACIÓN]: {observacion}\n\n---\n\n{informe.ResumenActividades}";
        informe.Estado = "Observado";
        informe.ValidadoPor = directorInvestigacionId;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(directorInvestigacionId, "OBSERVAR_INFORME_AVANCE",
            $"Informe #{informe.NumeroInforme} marcado como Observado. Motivo: {observacion}",
            "INFORME_AVANCE",
            System.Text.Json.JsonSerializer.Serialize(new { Estado = estadoAnterior }),
            System.Text.Json.JsonSerializer.Serialize(new { informe.Estado, Observacion = observacion }));

        _logger.LogInformation("[DIITRA] Informe #{Num} observado por usuario {UserId}. Motivo: {Obs}",
            informe.NumeroInforme, directorInvestigacionId, observacion);

        var director = await _context.Users.FindAsync(directorInvestigacionId);
        informe.ValidadoPorNavigation = director;
        return MapToDto(informe);
    }

    // ══════════════════════════════════════════════════════════════
    //  FIRMA DIGITAL (PAdES)
    // ══════════════════════════════════════════════════════════════

    public async Task<bool> FirmarDigitalmenteAsync(int id, byte[] certificateData, string password)
    {
        var informe = await _context.InvInformesAvance.FindAsync(id);
        if (informe == null) return false;

        var skipCertificateValidation = _env.IsDevelopment()
            || _configuration.GetValue<bool>("Firma:SkipCertificateValidation");

        if (!skipCertificateValidation && !_firmaService.ValidateCertificate(certificateData, password))
            throw new InvalidOperationException("El certificado digital proporcionado no es válido o la contraseña es incorrecta.");

        // Generar contenido a firmar: hash SHA-256 del contenido del informe
        string contenidoFirma = $"{informe.Uuid}|{informe.IdProyecto}|{informe.NumeroInforme}|{informe.ResumenActividades}|{informe.FechaReporte}";
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        byte[] hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(contenidoFirma));
        string hashHex = Convert.ToHexString(hashBytes).ToLower();

        informe.EsFirmadoDigital = true;
        informe.HashFirma = hashHex;
        informe.FechaFirma = DateTime.Now;

        await _context.SaveChangesAsync();

        _logger.LogInformation("[DIITRA] Informe #{Num} firmado digitalmente. Hash: {Hash}",
            informe.NumeroInforme, hashHex[..16] + "…");

        return true;
    }

    // ══════════════════════════════════════════════════════════════
    //  MAPEO
    // ══════════════════════════════════════════════════════════════

    private static InformeAvanceDto MapToDto(InvInformeAvance i, InvProyecto? project = null)
    {
        var p = project ?? i.IdProyectoNavigation;
        return new InformeAvanceDto
        {
            IdInforme = i.IdInforme,
            Uuid = i.Uuid,
            IdProyecto = i.IdProyecto,
            ProyectoTitulo = p?.Titulo,
            CodigoInstitucional = p?.CodigoInstitucional,
            NumeroInforme = i.NumeroInforme,
            FechaReporte = i.FechaReporte,
            ResumenActividades = i.ResumenActividades,
            EsFirmadoDigital = i.EsFirmadoDigital,
            HashFirma = i.HashFirma,
            FechaFirma = i.FechaFirma,
            ValidadoPor = i.ValidadoPor,
            ValidadoPorNombre = i.ValidadoPorNavigation?.Nombre,
            Estado = i.Estado,
            Evidencias = i.InvEvidencias.Select(e => new EvidenciaDto
            {
                IdEvidencia = e.IdEvidencia,
                Uuid = e.Uuid,
                Descripcion = e.Descripcion,
                RutaArchivo = e.RutaArchivo,
                TipoEvidencia = e.IdTipoEvidenciaNavigation?.Nombre,
                FechaRegistro = e.FechaRegistro
            }).ToList()
        };
    }
}
