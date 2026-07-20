using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Diitra.Infrastructure.Common.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures.Subservices;

public class SignatureProfileSubservice : ISignatureProfileSubservice
{
    private readonly DiitraContext _context;
    private readonly IFileStorageService _storageService;
    private readonly ILogger<SignatureProfileSubservice> _logger;

    public SignatureProfileSubservice(
        DiitraContext context,
        IFileStorageService storageService,
        ILogger<SignatureProfileSubservice> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<UserSignatureProfileDto?> GetProfileAsync(int idUsuario)
    {
        var perfil = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        UserSignatureProfileDto? dto = null;
        if (perfil != null)
        {
            dto = await MapToProfileDtoAsync(perfil);
            if (!string.IsNullOrWhiteSpace(dto.Cargo) && !string.IsNullOrWhiteSpace(dto.Departamento))
            {
                return dto;
            }
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

        if (user == null) return dto;

        string? cargoAuto = dto?.Cargo;
        string? deptoAuto = dto?.Departamento;

        if (user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi))
        {
            if (string.IsNullOrWhiteSpace(cargoAuto) || string.IsNullOrWhiteSpace(deptoAuto))
            {
                var contrato = await _context.Contratos
                    .Include(c => c.DepartamentoNavigation)
                    .Include(c => c.CargoInstitutoNavigation)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.IdProfesor == user.IdSigafi && c.EsActivo == 1);

                if (contrato != null)
                {
                    if (string.IsNullOrWhiteSpace(cargoAuto))
                        cargoAuto = contrato.CargoInstitutoNavigation?.Nombre;

                    if (string.IsNullOrWhiteSpace(deptoAuto))
                        deptoAuto = contrato.DepartamentoNavigation?.NombreDepartamento;
                }
            }
        }
        else if (user.TablaSigafi == "alumno" && !string.IsNullOrEmpty(user.IdSigafi))
        {
            if (string.IsNullOrWhiteSpace(cargoAuto))
                cargoAuto = "Estudiante";

            if (string.IsNullOrWhiteSpace(deptoAuto))
            {
                var alumCarrera = await _context.AlumnosCarreras
                    .AsNoTracking()
                    .FirstOrDefaultAsync(ac => ac.IdAlumno == user.IdSigafi);

                if (alumCarrera != null)
                {
                    var carrera = await _context.Carreras
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.IdCarrera == alumCarrera.IdCarrera);

                    deptoAuto = carrera?.Carrera1;
                }
            }
        }

        string? iniciales = dto?.Iniciales;
        if (string.IsNullOrWhiteSpace(iniciales) && !string.IsNullOrWhiteSpace(user.Nombre))
        {
            var parts = user.Nombre.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            iniciales = string.Concat(parts.Take(2).Select(p => char.ToUpper(p[0])));
        }

        return new UserSignatureProfileDto
        {
            IdUsuario = idUsuario,
            EsConfigurado = dto?.EsConfigurado ?? false,
            FirmaImagenB64 = dto?.FirmaImagenB64,
            Iniciales = iniciales,
            Cargo = cargoAuto,
            Departamento = deptoAuto,
            ActualizadoEn = dto?.ActualizadoEn ?? DateTime.UtcNow
        };
    }

    public async Task<UserSignatureProfileDto> UpsertProfileAsync(int idUsuario, UpdateSignatureProfileDto dto)
    {
        const int MaxBase64Length = 307_200; // 300 KB
        string? firmaPath = null;

        if (!string.IsNullOrWhiteSpace(dto.FirmaImagenB64))
        {
            var rawB64 = dto.FirmaImagenB64.Contains(',')
                ? dto.FirmaImagenB64.Split(',')[1]
                : dto.FirmaImagenB64;

            if (rawB64.Length > MaxBase64Length)
                throw new ArgumentException(
                    "La imagen de firma excede el tamaño máximo permitido (300 KB). " +
                    "Reduzca la resolución o use la función de recorte antes de guardar.");

            try
            {
                var imageBytes = Convert.FromBase64String(rawB64);
                firmaPath = await _storageService.SaveFileAsync($"firma_{idUsuario}.png", imageBytes, "signatures");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DIITRA Firma] Error al guardar archivo de firma de usuario {IdUsuario}", idUsuario);
                throw new InvalidOperationException("No se pudo almacenar la imagen de la firma. Intente nuevamente.");
            }
        }

        var perfil = await _context.InvUserSignaturePerfiles
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        bool isNew = perfil is null;

        if (isNew)
        {
            perfil = new InvUserSignaturePerfil
            {
                Uuid = Guid.NewGuid().ToString(),
                IdUsuario = idUsuario,
                CreadoEn = DateTime.UtcNow,
            };
            _context.InvUserSignaturePerfiles.Add(perfil);
        }

        if (!isNew && !string.IsNullOrWhiteSpace(perfil!.FirmaImagenB64)
            && !perfil.FirmaImagenB64.StartsWith("data:image/")
            && perfil.FirmaImagenB64.Length <= 512)
        {
            try
            {
                await _storageService.DeleteFileAsync(perfil.FirmaImagenB64);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[DIITRA Firma] No se pudo eliminar la firma antigua en {Path}", perfil.FirmaImagenB64);
            }
        }

        perfil!.FirmaImagenB64 = firmaPath;
        perfil.Iniciales = dto.Iniciales?.Trim().ToUpper();
        perfil.Cargo = dto.Cargo?.Trim();
        perfil.Departamento = dto.Departamento?.Trim();
        perfil.EsConfigurado = !string.IsNullOrWhiteSpace(dto.Cargo)
                              && !string.IsNullOrWhiteSpace(dto.Departamento)
                              && !string.IsNullOrWhiteSpace(firmaPath);
        perfil.ActualizadoEn = DateTime.UtcNow;

        var audit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = idUsuario,
            IdUsuarioAfectado = idUsuario,
            TablaAfectada = "inv_user_signature_profiles",
            ColumnaAfectada = "firma_imagen_b64",
            Operacion = "ESCRITURA",
            Motivo = isNew ? "Creación de perfil de firma institucional." : "Actualización de perfil de firma institucional.",
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(audit);

        await _context.SaveChangesAsync();

        _logger.LogInformation("[DIITRA Firma] Perfil de firma actualizado para usuario {Id}", idUsuario);
        return await MapToProfileDtoAsync(perfil);
    }

    private async Task<UserSignatureProfileDto> MapToProfileDtoAsync(InvUserSignaturePerfil p) => new()
    {
        IdUsuario = p.IdUsuario,
        EsConfigurado = p.EsConfigurado,
        FirmaImagenB64 = await GetFirmaBase64Async(p.FirmaImagenB64),
        Iniciales = p.Iniciales,
        Cargo = p.Cargo,
        Departamento = p.Departamento,
        ActualizadoEn = p.ActualizadoEn,
    };

    private async Task<string?> GetFirmaBase64Async(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        try
        {
            if (path.StartsWith("data:image/") || path.Length > 512)
            {
                return path;
            }

            var bytes = await _storageService.GetFileAsync(path);
            return $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[DIITRA Firma] No se pudo leer el archivo de firma desde {Path}", path);
            return null;
        }
    }
}
