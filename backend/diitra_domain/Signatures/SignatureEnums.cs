namespace diitra_domain.Signatures;

/// <summary>
/// Estado de validez de una firma registrada en el sistema.
/// Diseñado para crecer: añadir Expirada, Suspendida, etc. sin romper nada.
/// </summary>
public enum SignatureState
{
    Valid    = 1,   // Firma activa y verificable
    Revoked  = 2,   // Anulada explícitamente por el firmante o un administrador
    Expired  = 3,   // Expirada por vencimiento (para flujos con deadline en Fase 3)
}

/// <summary>
/// Método de firma utilizado. Extiéndelo para Fase 2+ (Biometric, OTP, MobileApp).
/// </summary>
public enum SigningMethod
{
    DiitraBasic  = 1,   // Firma institucional DIITRA (Fase 1)
    DiitraCanvas = 2,   // Firma con trazo dibujado + canvas (Fase 2)
    Biometric    = 3,   // Verificación biométrica (Fase 4 - reservado)
    MobileOtp    = 4,   // Push OTP vía app DIITRA (Fase 5 - reservado)
}

/// <summary>
/// Eventos de auditoría del ciclo de vida de una firma (append-only log).
/// </summary>
public enum SignatureAuditEvent
{
    ProfileCreated    = 1,  // El usuario creó/configuró su perfil de firma
    ProfileUpdated    = 2,  // El usuario actualizó su imagen o cargo
    DocumentSigned    = 3,  // Se firmó un documento exitosamente
    SignatureVerified = 4,  // Alguien consultó la verificación pública
    SignatureRevoked  = 5,  // Se anuló la firma
    SignatureFailed   = 6,  // Intento fallido (contraseña incorrecta, etc.)
}
