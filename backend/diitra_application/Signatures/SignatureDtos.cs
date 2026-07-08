using diitra_domain.Signatures;

namespace diitra_application.Signatures;

// ══════════════════════════════════════════════════════════════
//  DTOs DE PERFIL DE FIRMA
// ══════════════════════════════════════════════════════════════

/// <summary>
/// Perfil de firma del usuario: imagen dibujada, cargo y datos institucionales.
/// </summary>
public class UserSignatureProfileDto
{
    public int      IdUsuario       { get; init; }
    public bool     EsConfigurado   { get; init; }
    public string?  FirmaImagenB64  { get; init; }   // PNG en Base64
    public string?  Iniciales       { get; init; }
    public string?  Cargo           { get; init; }
    public string?  Departamento    { get; init; }
    public DateTime ActualizadoEn   { get; init; }
}

/// <summary>
/// Request para guardar o actualizar el perfil de firma del usuario autenticado.
/// </summary>
public class UpdateSignatureProfileDto
{
    /// <summary>PNG en Base64 de la firma dibujada por el usuario en el canvas.</summary>
    public string? FirmaImagenB64 { get; init; }
    public string? Iniciales      { get; init; }

    /// <summary>Cargo institucional que aparecerá en el bloque visual del PDF.</summary>
    public string? Cargo          { get; init; }
    public string? Departamento   { get; init; }
}

// ══════════════════════════════════════════════════════════════
//  DTOs DE FIRMA DE DOCUMENTO
// ══════════════════════════════════════════════════════════════

/// <summary>
/// Request para firmar un documento. Exige re-autenticación de contraseña.
/// </summary>
public class SignDocumentDto
{
    /// <summary>UUID del documento a firmar.</summary>
    public required string DocumentoUuid  { get; init; }

    /// <summary>Contraseña DIITRA del usuario (re-autenticación para no repudio).</summary>
    public required string Password       { get; init; }

    /// <summary>Rol del firmante en este documento (ej: "Director", "Co-investigador").</summary>
    public string? RolFirmante            { get; init; }
}

/// <summary>
/// Resultado de una operación de firma exitosa.
/// </summary>
public class SignatureResultDto
{
    public required string FirmaCode     { get; init; }   // DFRM-2026-XXXX
    public required string HmacHash      { get; init; }   // Prueba criptográfica
    public required string DocHash       { get; init; }   // SHA-256 del PDF firmado
    public required DateTime FirmadoEn  { get; init; }
    public string VerificationUrl        { get; init; } = string.Empty;
}

// ══════════════════════════════════════════════════════════════
//  DTOs DE CONSULTA Y VERIFICACIÓN
// ══════════════════════════════════════════════════════════════

/// <summary>
/// Registro de una firma sobre un documento. Expuesto al frontend.
/// </summary>
public class SignatureRecordDto
{
    public int          IdFirma         { get; init; }
    public string       FirmaCode       { get; init; } = string.Empty;
    public string       FirmanteNombre  { get; init; } = string.Empty;
    public string       FirmanteRol     { get; init; } = string.Empty;
    public DateTime     FechaFirma      { get; init; }
    public SignatureState Estado         { get; init; }
    public string?      DocHash         { get; init; }
    public string?      MotivoRevocacion { get; init; }
    public DateTime?    RevocadaEn      { get; init; }
}

/// <summary>
/// Respuesta de la verificación pública de una firma. No requiere autenticación.
/// </summary>
public class SignatureVerificationDto
{
    public bool     EsValida        { get; init; }
    public string   FirmaCode       { get; init; } = string.Empty;
    public string   FirmanteNombre  { get; init; } = string.Empty;
    public string   FirmanteRol     { get; init; } = string.Empty;
    public string   DocumentoUuid   { get; init; } = string.Empty;
    public DateTime FechaFirma      { get; init; }
    public string   DocHash         { get; init; } = string.Empty;
    public string?  MensajeEstado   { get; init; }  // "Válida", "Revocada el ...", etc.
}

/// <summary>
/// Request para revocar una firma existente.
/// </summary>
public class RevokeSignatureDto
{
    public required string FirmaCode       { get; init; }
    public required string MotivoRevocacion { get; init; }
}
