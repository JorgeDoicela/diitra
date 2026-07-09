using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Signatures;

/// <summary>
/// Implementación principal del módulo DIITRA Firma (Fase 1).
/// Responsabilidades:
///   • Gestión del perfil de firma de cada usuario
///   • Firma criptográfica de documentos con HMAC-SHA256
///   • Estampado del bloque visual profesional en el PDF
///   • Auditoría forense completa en inv_documentos_firmas
///   • Verificación pública y revocación
/// </summary>
public class DiitraSignatureService : IDiitraSignatureService
{
    private readonly DiitraContext       _context;
    private readonly SignatureHashService _hashService;
    private readonly SignatureStamper    _stamper;
    private readonly IPasswordHasher<object> _passwordHasher;
    private readonly IConfiguration      _config;
    private readonly ILogger<DiitraSignatureService> _logger;

    public DiitraSignatureService(
        DiitraContext                    context,
        SignatureHashService              hashService,
        SignatureStamper                  stamper,
        IPasswordHasher<object>          passwordHasher,
        IConfiguration                   config,
        ILogger<DiitraSignatureService>  logger)
    {
        _context        = context;
        _hashService    = hashService;
        _stamper        = stamper;
        _passwordHasher = passwordHasher;
        _config         = config;
        _logger         = logger;
    }

    // ══════════════════════════════════════════════════════════════
    //  PERFIL DE FIRMA
    // ══════════════════════════════════════════════════════════════

    public async Task<UserSignatureProfileDto?> GetProfileAsync(int idUsuario)
    {
        var perfil = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        // Si tiene perfil registrado, lo obtenemos
        UserSignatureProfileDto? dto = null;
        if (perfil != null)
        {
            dto = MapToProfileDto(perfil);
            // Si el perfil ya existe pero tiene cargo o departamento vacíos, procedemos a autocompletar lo que falte
            if (!string.IsNullOrWhiteSpace(dto.Cargo) && !string.IsNullOrWhiteSpace(dto.Departamento))
            {
                return dto;
            }
        }

        // Buscamos la información institucional del usuario (SIGAFI)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
        if (user == null) return dto;

        string? cargoAuto = dto?.Cargo;
        string? deptoAuto = dto?.Departamento;

        if (user.TablaSigafi == "profesor" && !string.IsNullOrEmpty(user.IdSigafi))
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
        var perfil = await _context.InvUserSignaturePerfiles
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        if (perfil is null)
        {
            perfil = new InvUserSignaturePerfil
            {
                Uuid      = Guid.NewGuid().ToString(),
                IdUsuario = idUsuario,
                CreadoEn  = DateTime.UtcNow,
            };
            _context.InvUserSignaturePerfiles.Add(perfil);
        }

        perfil.FirmaImagenB64 = dto.FirmaImagenB64;
        perfil.Iniciales      = dto.Iniciales?.Trim().ToUpper();
        perfil.Cargo          = dto.Cargo?.Trim();
        perfil.Departamento   = dto.Departamento?.Trim();
        perfil.EsConfigurado  = !string.IsNullOrWhiteSpace(dto.Cargo) && !string.IsNullOrWhiteSpace(dto.Departamento);
        perfil.ActualizadoEn  = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("[DIITRA Firma] Perfil de firma actualizado para usuario {Id}", idUsuario);
        return MapToProfileDto(perfil);
    }

    // ══════════════════════════════════════════════════════════════
    //  FIRMA DE DOCUMENTO
    // ══════════════════════════════════════════════════════════════

    public async Task<SignatureResultDto> SignDocumentAsync(
        int    idUsuario,
        string nombreUsuario,
        string? cedulaUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto)
    {
        // 1. Verificar contraseña DIITRA (re-autenticación para no repudio)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        var skipAuth = _config.GetValue<bool>("Firma:SkipCertificateValidation");
        if (!skipAuth)
        {
            if (string.IsNullOrWhiteSpace(user.Contrasenia))
                throw new UnauthorizedAccessException("El usuario no tiene contraseña configurada.");

            var result = _passwordHasher.VerifyHashedPassword(new object(), user.Contrasenia, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                _logger.LogWarning("[DIITRA Firma] Intento de firma fallido — contraseña incorrecta. Usuario {Id}", idUsuario);
                throw new UnauthorizedAccessException("Contraseña incorrecta. La firma requiere verificación de identidad.");
            }
        }

        // 2. Verificar que el documento existe y es accesible
        var instancia = await _context.DocumentInstances
            .FirstOrDefaultAsync(d => d.Uuid == dto.DocumentoUuid)
            ?? throw new KeyNotFoundException($"Documento '{dto.DocumentoUuid}' no encontrado.");

        // 3. Verificar que no está ya firmado por este usuario con DIITRA
        var existingFirma = await _context.InvDocumentoFirmas
            .AnyAsync(f => f.DocumentoUuid == dto.DocumentoUuid
                        && f.FirmanteId   == idUsuario.ToString()
                        && f.TipoFirma    == "DIITRA"
                        && f.EsValida);
        if (existingFirma)
            throw new InvalidOperationException("Ya existe una firma DIITRA válida de este usuario en el documento.");

        // 4. Obtener el PDF actual del documento
        var pdfBytes = await GetPdfBytesFromInstance(instancia);

        // 5. Calcular el hash del PDF (prueba de integridad del "qué se firmó")
        var docHash  = SignatureHashService.ComputeSha256(pdfBytes);
        var firmaCode = SignatureHashService.GenerateFirmaCode();
        var firmadoEn = DateTime.UtcNow;

        // 6. Calcular el HMAC (prueba criptográfica de autenticidad)
        var hmacHash = _hashService.GenerateHmac(
            docHash, idUsuario.ToString(), firmadoEn, firmaCode);

        // 7. Obtener perfil para estampar la imagen de firma
        var perfil = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        // 8. Estampar el bloque visual en el PDF
        var verificationBaseUrl = _config["FrontendUrl"] ?? "https://diitra.ist.edu.ec";
        var verificationUrl = $"{verificationBaseUrl}/verificar-firma/{firmaCode}";

        var pdfFirmado = _stamper.StampSignatureBlock(
            pdfBytes:       pdfBytes,
            nombreFirmante: user.Nombre ?? user.IdSigafi ?? "Usuario DIITRA",
            cedula:         cedulaUsuario,
            cargo:          perfil?.Cargo ?? dto.RolFirmante,
            departamento:   perfil?.Departamento,
            rolEnDocumento: dto.RolFirmante,
            firmaCode:      firmaCode,
            firmaImagenB64: perfil?.FirmaImagenB64,
            verificationUrl: verificationUrl,
            firmadoEn:      firmadoEn);

        // 9. Guardar el PDF firmado físicamente
        var pdfPath = await SaveSignedPdfAsync(pdfFirmado, dto.DocumentoUuid, firmaCode);

        // 10. Persistir el registro de firma (inmutable)
        var snapshotJson = JsonSerializer.Serialize(new
        {
            nombre       = nombreUsuario,
            cedula       = cedulaUsuario,
            cargo        = perfil?.Cargo,
            departamento = perfil?.Departamento,
            rol          = dto.RolFirmante,
            metodo       = "DIITRA_BASIC_V1",
        });

        var registroFirma = new InvDocumentoFirma
        {
            Uuid             = Guid.NewGuid().ToString(),
            DocumentoUuid    = dto.DocumentoUuid,
            FirmanteId       = idUsuario.ToString(),
            FirmanteRol      = dto.RolFirmante ?? "Firmante",
            FechaFirma       = firmadoEn,
            TipoFirma        = "DIITRA",
            FirmaCode        = firmaCode,
            HmacHash         = hmacHash,
            DocHash          = docHash,
            IpAddress        = ipAddress,
            UserAgent        = userAgent,
            FirmaMetadata    = snapshotJson,
            ArchivoPdfFirmado = pdfPath,
            EsValida         = true,
        };

        _context.InvDocumentoFirmas.Add(registroFirma);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "[DIITRA Firma] Documento {DocUuid} firmado. Código: {Code} | Usuario: {UserId} | Hash: {Hash}",
            dto.DocumentoUuid, firmaCode, idUsuario, docHash[..16] + "…");

        return new SignatureResultDto
        {
            FirmaCode       = firmaCode,
            HmacHash        = hmacHash,
            DocHash         = docHash,
            FirmadoEn       = firmadoEn,
            VerificationUrl = verificationUrl,
        };
    }

    // ══════════════════════════════════════════════════════════════
    //  CONSULTAS
    // ══════════════════════════════════════════════════════════════

    public async Task<IEnumerable<SignatureRecordDto>> GetByDocumentAsync(string documentoUuid)
    {
        var firmas = await _context.InvDocumentoFirmas
            .AsNoTracking()
            .Where(f => f.DocumentoUuid == documentoUuid && f.TipoFirma == "DIITRA")
            .OrderByDescending(f => f.FechaFirma)
            .ToListAsync();

        return firmas.Select(MapToRecordDto);
    }

    public async Task<SignatureVerificationDto> VerifyAsync(string firmaCode)
    {
        var firma = await _context.InvDocumentoFirmas
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.FirmaCode == firmaCode);

        if (firma is null)
        {
            return new SignatureVerificationDto
            {
                EsValida      = false,
                FirmaCode     = firmaCode,
                MensajeEstado = "Código de firma no encontrado en el sistema.",
            };
        }

        // Obtener el nombre del firmante desde el snapshot
        string firmanteNombre = firma.FirmanteId;
        try
        {
            var snapshot = JsonDocument.Parse(firma.FirmaMetadata ?? "{}");
            firmanteNombre = snapshot.RootElement.TryGetProperty("nombre", out var n)
                ? n.GetString() ?? firma.FirmanteId
                : firma.FirmanteId;
        }
        catch { /* usa FirmanteId si el JSON falla */ }

        if (!firma.EsValida)
        {
            return new SignatureVerificationDto
            {
                EsValida        = false,
                FirmaCode       = firmaCode,
                FirmanteNombre  = firmanteNombre,
                FirmanteRol     = firma.FirmanteRol,
                DocumentoUuid   = firma.DocumentoUuid,
                FechaFirma      = firma.FechaFirma,
                DocHash         = firma.DocHash ?? string.Empty,
                MensajeEstado   = firma.RevocadaEn.HasValue
                    ? $"Firma revocada el {firma.RevocadaEn:dd/MM/yyyy HH:mm}. Motivo: {firma.MotivoRevocacion}"
                    : "Firma no válida.",
            };
        }

        return new SignatureVerificationDto
        {
            EsValida        = true,
            FirmaCode       = firmaCode,
            FirmanteNombre  = firmanteNombre,
            FirmanteRol     = firma.FirmanteRol,
            DocumentoUuid   = firma.DocumentoUuid,
            FechaFirma      = firma.FechaFirma,
            DocHash         = firma.DocHash ?? string.Empty,
            MensajeEstado   = $"Firma válida — emitida el {firma.FechaFirma:dd/MM/yyyy HH:mm} UTC",
        };
    }

    // ══════════════════════════════════════════════════════════════
    //  REVOCACIÓN
    // ══════════════════════════════════════════════════════════════

    public async Task<bool> RevokeAsync(int idUsuarioSolicitante, RevokeSignatureDto dto, bool esAdmin = false)
    {
        var firma = await _context.InvDocumentoFirmas
            .FirstOrDefaultAsync(f => f.FirmaCode == dto.FirmaCode);

        if (firma is null) return false;

        // Solo el firmante original o un admin puede revocar
        if (!esAdmin && firma.FirmanteId != idUsuarioSolicitante.ToString())
            throw new UnauthorizedAccessException("Solo el firmante original puede revocar esta firma.");

        if (!firma.EsValida)
            throw new InvalidOperationException("La firma ya estaba revocada.");

        firma.EsValida         = false;
        firma.RevocadaEn       = DateTime.UtcNow;
        firma.MotivoRevocacion = dto.MotivoRevocacion;

        await _context.SaveChangesAsync();

        _logger.LogWarning(
            "[DIITRA Firma] Firma {Code} revocada por usuario {UserId}. Motivo: {Motivo}",
            dto.FirmaCode, idUsuarioSolicitante, dto.MotivoRevocacion);

        return true;
    }

    // ══════════════════════════════════════════════════════════════
    //  HELPERS PRIVADOS
    // ══════════════════════════════════════════════════════════════

    private async Task<byte[]> GetPdfBytesFromInstance(Diitra.Domain.Common.Documents.DocumentInstance instancia)
    {
        if (!string.IsNullOrWhiteSpace(instancia.FinalPdfPath) && File.Exists(instancia.FinalPdfPath))
            return await File.ReadAllBytesAsync(instancia.FinalPdfPath);

        throw new InvalidOperationException(
            $"El documento '{instancia.Uuid}' no tiene PDF generado. " +
            "Genere el PDF antes de firmarlo.");
    }

    private async Task<string> SaveSignedPdfAsync(byte[] pdfBytes, string documentoUuid, string firmaCode)
    {
        var storageRoot = _config["Storage:DocumentsPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage", "Documents");
        var firmasDir   = Path.Combine(storageRoot, "Firmas");
        Directory.CreateDirectory(firmasDir);

        var fileName = $"{documentoUuid}_{firmaCode}.pdf";
        var fullPath = Path.Combine(firmasDir, fileName);
        await File.WriteAllBytesAsync(fullPath, pdfBytes);

        return Path.Combine("Firmas", fileName); // ruta relativa
    }

    // ── Mappers ────────────────────────────────────────────────────

    private static UserSignatureProfileDto MapToProfileDto(InvUserSignaturePerfil p) => new()
    {
        IdUsuario      = p.IdUsuario,
        EsConfigurado  = p.EsConfigurado,
        FirmaImagenB64 = p.FirmaImagenB64,
        Iniciales      = p.Iniciales,
        Cargo          = p.Cargo,
        Departamento   = p.Departamento,
        ActualizadoEn  = p.ActualizadoEn,
    };

    private static SignatureRecordDto MapToRecordDto(InvDocumentoFirma f) => new()
    {
        IdFirma          = f.IdFirma,
        FirmaCode        = f.FirmaCode ?? string.Empty,
        FirmanteNombre   = f.FirmanteId,
        FirmanteRol      = f.FirmanteRol,
        FechaFirma       = f.FechaFirma,
        Estado           = f.EsValida ? SignatureState.Valid : SignatureState.Revoked,
        DocHash          = f.DocHash,
        MotivoRevocacion = f.MotivoRevocacion,
        RevocadaEn       = f.RevocadaEn,
    };
}
