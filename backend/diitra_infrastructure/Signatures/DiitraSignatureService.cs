using System.Text.Json;
using diitra_application.Signatures;
using diitra_domain.Signatures;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Diitra.Infrastructure.Common.Storage;

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
    private readonly IFileStorageService _storageService;

    public DiitraSignatureService(
        DiitraContext                    context,
        SignatureHashService              hashService,
        SignatureStamper                  stamper,
        IPasswordHasher<object>          passwordHasher,
        IConfiguration                   config,
        ILogger<DiitraSignatureService>  logger,
        IFileStorageService              storageService)
    {
        _context        = context;
        _hashService    = hashService;
        _stamper        = stamper;
        _passwordHasher = passwordHasher;
        _config         = config;
        _logger         = logger;
        _storageService = storageService;
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
            dto = await MapToProfileDtoAsync(perfil);
            // Si el perfil ya existe pero tiene cargo o departamento vacíos, procedemos a autocompletar lo que falte
            if (!string.IsNullOrWhiteSpace(dto.Cargo) && !string.IsNullOrWhiteSpace(dto.Departamento))
            {
                return dto;
            }
        }

        // Buscamos el usuario
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
        // Validar tamaño de la imagen base64 (límite: 300 KB en base64 ≈ ~225 KB imagen real)
        const int MaxBase64Length = 307_200; // 300 KB
        string? firmaPath = null;

        if (!string.IsNullOrWhiteSpace(dto.FirmaImagenB64))
        {
            var rawB64 = dto.FirmaImagenB64.Contains(',')
                ? dto.FirmaImagenB64.Split(',')[1]
                : dto.FirmaImagenB64;

            if (rawB64.Length > MaxBase64Length)
                throw new ArgumentException(
                    $"La imagen de firma excede el tamaño máximo permitido (300 KB). " +
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
        string? valoresAnteriores = null;

        if (isNew)
        {
            perfil = new InvUserSignaturePerfil
            {
                Uuid      = Guid.NewGuid().ToString(),
                IdUsuario = idUsuario,
                CreadoEn  = DateTime.UtcNow,
            };
            _context.InvUserSignaturePerfiles.Add(perfil);
        }
        else
        {
            valoresAnteriores = JsonSerializer.Serialize(new
            {
                perfil.Cargo,
                perfil.Departamento,
                perfil.Iniciales,
                perfil.EsConfigurado
            });
        }

        // Si antes tenía un archivo guardado, eliminarlo del disco
        if (!string.IsNullOrWhiteSpace(perfil.FirmaImagenB64)
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

        perfil.FirmaImagenB64 = firmaPath;
        perfil.Iniciales      = dto.Iniciales?.Trim().ToUpper();
        perfil.Cargo          = dto.Cargo?.Trim();
        perfil.Departamento   = dto.Departamento?.Trim();
        perfil.EsConfigurado  = !string.IsNullOrWhiteSpace(dto.Cargo)
                              && !string.IsNullOrWhiteSpace(dto.Departamento)
                              && !string.IsNullOrWhiteSpace(firmaPath);
        perfil.ActualizadoEn  = DateTime.UtcNow;

        // Auditoría LOPDP (Escritura de datos personales sensibles)
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

    // ══════════════════════════════════════════════════════════════
    //  FIRMA DE DOCUMENTO
    // ══════════════════════════════════════════════════════════════

    public async Task<SignatureResultDto> SignDocumentAsync(
        int    idUsuario,
        string ipAddress,
        string userAgent,
        SignDocumentDto dto)
    {
        // 1. Verificar contraseña DIITRA (re-autenticación para no repudio)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        var skipAuth = _config.GetValue<bool>("Firma:SkipCertificateValidation");

        // Guard: SkipCertificateValidation no debe estar activo en producción
        if (skipAuth)
        {
            var env = _config["ASPNETCORE_ENVIRONMENT"] ?? _config["Environment"] ?? "Production";
            if (!env.Equals("Development", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError("[DIITRA Firma] CRÍTICO: Firma:SkipCertificateValidation=true en entorno '{Env}'. La re-autenticación está desactivada. Corrija appsettings de producción.", env);
                throw new InvalidOperationException("Configuración de seguridad inválida en producción. Contacte al administrador del sistema.");
            }
            _logger.LogWarning("[DIITRA Firma] ADVERTENCIA: Firma:SkipCertificateValidation=true — modo de desarrollo, sin verificación de contraseña.");
        }

        if (!skipAuth)
        {
            if (string.IsNullOrWhiteSpace(user.Contrasenia))
                throw new UnauthorizedAccessException("El usuario no tiene contraseña configurada.");

            var result = _passwordHasher.VerifyHashedPassword(new object(), user.Contrasenia, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                _logger.LogWarning("[DIITRA Firma] Intento de firma fallido — contraseña incorrecta. Usuario {Id}", idUsuario);

                var failAudit = new InvAuditAdmin
                {
                    IdUsuarioAdmin = idUsuario,
                    IdUsuarioAfectado = idUsuario,
                    Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                    Modulo = "Signatures",
                    Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: contraseña incorrecta.",
                    IpOrigen = ipAddress,
                    UserAgent = userAgent,
                    Fecha = DateTime.UtcNow
                };
                _context.InvAuditAdmin.Add(failAudit);
                await _context.SaveChangesAsync();

                throw new UnauthorizedAccessException("Contraseña incorrecta. La firma requiere verificación de identidad.");
            }
        }

        // Resolver nombre y cédula internamente desde la entidad usuario
        var nombreUsuario = user.Nombre ?? user.IdSigafi ?? "Usuario DIITRA";
        var cedulaUsuario = user.IdSigafi;

        // 2. Verificar que el documento existe y es accesible
        var instancia = await _context.DocumentInstances
            .FirstOrDefaultAsync(d => d.Uuid == dto.DocumentoUuid)
            ?? throw new KeyNotFoundException($"Documento '{dto.DocumentoUuid}' no encontrado.");

        // 3. Verificar que el perfil de firma está configurado (validación backend)
        var perfilCheck = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);
        if (perfilCheck is null || !perfilCheck.EsConfigurado)
        {
            var failAudit = new InvAuditAdmin
            {
                IdUsuarioAdmin = idUsuario,
                IdUsuarioAfectado = idUsuario,
                Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                Modulo = "Signatures",
                Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: perfil de firma no configurado.",
                IpOrigen = ipAddress,
                UserAgent = userAgent,
                Fecha = DateTime.UtcNow
            };
            _context.InvAuditAdmin.Add(failAudit);
            await _context.SaveChangesAsync();

            throw new InvalidOperationException("El usuario no tiene un perfil de firma institucional configurado. Configure su cargo y trazo antes de firmar.");
        }

        // 4. Verificar que no está ya firmado por este usuario con DIITRA
        var existingFirma = await _context.InvDocumentoFirmas
            .AnyAsync(f => f.DocumentoUuid == dto.DocumentoUuid
                        && (f.FirmanteId   == idUsuario.ToString() || f.FirmanteId == $"USR-{idUsuario}")
                        && f.TipoFirma    == "DIITRA"
                        && f.EsValida);
        if (existingFirma)
        {
            var failAudit = new InvAuditAdmin
            {
                IdUsuarioAdmin = idUsuario,
                IdUsuarioAfectado = idUsuario,
                Accion = SignatureAuditEvent.SignatureFailed.ToString(),
                Modulo = "Signatures",
                Detalle = $"Intento de firma fallido para el documento {dto.DocumentoUuid}: ya existe una firma activa de este usuario.",
                IpOrigen = ipAddress,
                UserAgent = userAgent,
                Fecha = DateTime.UtcNow
            };
            _context.InvAuditAdmin.Add(failAudit);
            await _context.SaveChangesAsync();

            throw new InvalidOperationException("Ya existe una firma DIITRA válida de este usuario en el documento.");
        }

        // 5. Obtener el PDF actual del documento
        var pdfBytes = await GetPdfBytesFromInstance(instancia);

        // 6. Calcular el hash del PDF (prueba de integridad del "qué se firmó")
        var docHash   = SignatureHashService.ComputeSha256(pdfBytes);
        var firmaCode = SignatureHashService.GenerateFirmaCode();
        var firmadoEn = DateTime.UtcNow;

        // 7. Calcular el HMAC (prueba criptográfica de autenticidad)
        var firmanteIdStr = $"USR-{idUsuario}";
        var hmacHash = _hashService.GenerateHmac(
            docHash, firmanteIdStr, firmadoEn, firmaCode);

        // 8. Obtener perfil para estampar la imagen de firma
        var perfil = await _context.InvUserSignaturePerfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdUsuario == idUsuario);

        var firmaImagenB64 = await GetFirmaBase64Async(perfil?.FirmaImagenB64);

        // 9. Estampar el bloque visual en el PDF
        var verificationBaseUrl = _config["FrontendUrl"] ?? "https://diitra.ist.edu.ec";
        var verificationUrl = $"{verificationBaseUrl}/verificar-firma/{firmaCode}";

        var pdfFirmado = _stamper.StampSignatureBlock(
            pdfBytes:        pdfBytes,
            nombreFirmante:  nombreUsuario,
            cedula:          cedulaUsuario,
            cargo:           perfil?.Cargo ?? dto.RolFirmante,
            departamento:    perfil?.Departamento,
            rolEnDocumento:  dto.RolFirmante,
            firmaCode:       firmaCode,
            firmaImagenB64:  firmaImagenB64,
            verificationUrl: verificationUrl,
            firmadoEn:       firmadoEn);

        // 10. Guardar el PDF firmado físicamente
        var pdfPath = await SaveSignedPdfAsync(pdfFirmado, dto.DocumentoUuid, firmaCode);

        // 11. Actualizar DocumentInstance para que el workspace sirva siempre el PDF firmado más reciente
        // Usamos el método de dominio Finalize() que actualiza FinalPdfPath (private set), FileHash y State
        instancia.Finalize(
            pdfPath:          pdfPath,
            hash:             docHash,
            traceabilityCode: firmaCode);

        // 12. Persistir el registro de firma (inmutable) + actualizar instancia en un solo transaction
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
            Uuid              = Guid.NewGuid().ToString(),
            DocumentoUuid     = dto.DocumentoUuid,
            FirmanteId        = firmanteIdStr,
            FirmanteRol       = dto.RolFirmante ?? "Firmante",
            FechaFirma        = firmadoEn,
            TipoFirma         = "DIITRA",
            FirmaCode         = firmaCode,
            HmacHash          = hmacHash,
            DocHash           = docHash,
            IpAddress         = ipAddress,
            UserAgent         = userAgent,
            FirmaMetadata     = snapshotJson,
            ArchivoPdfFirmado = pdfPath,
            EsValida          = true,
        };

        _context.InvDocumentoFirmas.Add(registroFirma);

        // Auditoría de firma exitosa (LOPDP Escritura)
        var successAudit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = idUsuario,
            IdUsuarioAfectado = idUsuario,
            TablaAfectada = "inv_documentos_firmas",
            ColumnaAfectada = "firma_code",
            Operacion = "ESCRITURA",
            Motivo = $"Firma de documento exitosa. Código: {firmaCode}.",
            IpDireccion = ipAddress,
            UserAgent = userAgent,
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(successAudit);

        await _context.SaveChangesAsync(); // Firma + actualización de instancia + auditoría en un solo commit

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

        // Obtener el nombre del firmante desde el snapshot JSON (fuente de verdad forense)
        string firmanteNombre = firma.FirmanteId;
        int? idFirmante = null;
        if (!string.IsNullOrWhiteSpace(firma.FirmanteId))
        {
            var cleanId = firma.FirmanteId.StartsWith("USR-")
                ? firma.FirmanteId.Replace("USR-", "")
                : firma.FirmanteId;
            if (int.TryParse(cleanId, out int id))
            {
                idFirmante = id;
            }
        }

        try
        {
            var snapshot = JsonDocument.Parse(firma.FirmaMetadata ?? "{}");
            firmanteNombre = snapshot.RootElement.TryGetProperty("nombre", out var n)
                ? n.GetString() ?? firma.FirmanteId
                : firma.FirmanteId;
        }
        catch { /* usa FirmanteId si el JSON falla */ }

        // Registrar auditoría de verificación (LOPDP Lectura de datos sensibles)
        var audit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = null, // Verificación pública
            IdUsuarioAfectado = idFirmante ?? 0,
            TablaAfectada = "inv_documentos_firmas",
            ColumnaAfectada = "firma_metadata",
            Operacion = "LECTURA",
            Motivo = $"Verificación pública de la firma. Código: {firmaCode}.",
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(audit);
        await _context.SaveChangesAsync();

        // Verificar integridad criptográfica del HMAC (detección de manipulación en BD)
        bool hmacValido = false;
        if (!string.IsNullOrWhiteSpace(firma.HmacHash) && !string.IsNullOrWhiteSpace(firma.DocHash))
        {
            try
            {
                hmacValido = _hashService.VerifyHmac(
                    firma.DocHash,
                    firma.FirmanteId,
                    firma.FechaFirma,
                    firma.FirmaCode ?? string.Empty,
                    firma.HmacHash);
            }
            catch
            {
                hmacValido = false;
            }
        }

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

        // Firma válida en BD pero HMAC no coincide → manipulación detectada
        if (!hmacValido)
        {
            _logger.LogWarning(
                "[DIITRA Firma] ALERTA: El HMAC de la firma {Code} no pasa verificación criptográfica. Posible manipulación.",
                firmaCode);

            return new SignatureVerificationDto
            {
                EsValida        = false,
                FirmaCode       = firmaCode,
                FirmanteNombre  = firmanteNombre,
                FirmanteRol     = firma.FirmanteRol,
                DocumentoUuid   = firma.DocumentoUuid,
                FechaFirma      = firma.FechaFirma,
                DocHash         = firma.DocHash ?? string.Empty,
                MensajeEstado   = "Firma no verificable: la integridad criptográfica del registro ha sido comprometida.",
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
        if (!esAdmin && firma.FirmanteId != idUsuarioSolicitante.ToString() && firma.FirmanteId != $"USR-{idUsuarioSolicitante}")
            throw new UnauthorizedAccessException("Solo el firmante original puede revocar esta firma.");

        int? idFirmante = null;
        if (!string.IsNullOrWhiteSpace(firma.FirmanteId))
        {
            var cleanId = firma.FirmanteId.StartsWith("USR-")
                ? firma.FirmanteId.Replace("USR-", "")
                : firma.FirmanteId;
            if (int.TryParse(cleanId, out int id))
            {
                idFirmante = id;
            }
        }

        firma.EsValida         = false;
        firma.RevocadaEn       = DateTime.UtcNow;
        firma.MotivoRevocacion = dto.MotivoRevocacion;

        // Auditoría de revocación (Control Administrativo/Seguridad)
        var audit = new InvAuditAdmin
        {
            IdUsuarioAdmin = idUsuarioSolicitante,
            IdUsuarioAfectado = idFirmante,
            Accion = SignatureAuditEvent.SignatureRevoked.ToString(),
            Modulo = "Signatures",
            Detalle = $"Firma {dto.FirmaCode} revocada. Motivo: {dto.MotivoRevocacion}",
            ValoresAnteriores = JsonSerializer.Serialize(new { EsValida = true }),
            ValoresNuevos = JsonSerializer.Serialize(new { EsValida = false, MotivoRevocacion = dto.MotivoRevocacion }),
            Fecha = DateTime.UtcNow
        };
        _context.InvAuditAdmin.Add(audit);

        // Auditoría LOPDP (Eliminación / Modificación lógica de datos personales sensibles)
        var lopdpAudit = new InvLopdpAuditoriaDatos
        {
            Uuid = Guid.NewGuid(),
            IdUsuarioActor = idUsuarioSolicitante,
            IdUsuarioAfectado = idFirmante ?? 0,
            TablaAfectada = "inv_documentos_firmas",
            ColumnaAfectada = "es_valida",
            Operacion = "ELIMINACION",
            Motivo = $"Revocación de firma digital. Código: {dto.FirmaCode}. Motivo: {dto.MotivoRevocacion}",
            FechaAcceso = DateTime.UtcNow
        };
        _context.InvLopdpAuditoriaDatos.Add(lopdpAudit);

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

    private async Task<UserSignatureProfileDto> MapToProfileDtoAsync(InvUserSignaturePerfil p) => new()
    {
        IdUsuario      = p.IdUsuario,
        EsConfigurado  = p.EsConfigurado,
        FirmaImagenB64 = await GetFirmaBase64Async(p.FirmaImagenB64),
        Iniciales      = p.Iniciales,
        Cargo          = p.Cargo,
        Departamento   = p.Departamento,
        ActualizadoEn  = p.ActualizadoEn,
    };

    private async Task<string?> GetFirmaBase64Async(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        try
        {
            // Soporte para datos heredados: si ya es Base64 directamente (empieza con prefijo de imagen o es muy largo)
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

    private static SignatureRecordDto MapToRecordDto(InvDocumentoFirma f)
    {
        // Extraer el nombre real del snapshot JSON (más fiable que el FirmanteId numérico)
        string firmanteNombre = f.FirmanteId;
        try
        {
            var snapshot = JsonDocument.Parse(f.FirmaMetadata ?? "{}");
            firmanteNombre = snapshot.RootElement.TryGetProperty("nombre", out var n)
                ? n.GetString() ?? f.FirmanteId
                : f.FirmanteId;
        }
        catch { /* fallback a FirmanteId */ }

        return new SignatureRecordDto
        {
            IdFirma          = f.IdFirma,
            FirmaCode        = f.FirmaCode ?? string.Empty,
            FirmanteNombre   = firmanteNombre,
            FirmanteRol      = f.FirmanteRol,
            FechaFirma       = f.FechaFirma,
            Estado           = f.EsValida ? SignatureState.Valid : SignatureState.Revoked,
            DocHash          = f.DocHash,
            MotivoRevocacion = f.MotivoRevocacion,
            RevocadaEn       = f.RevocadaEn,
        };
    }
}
