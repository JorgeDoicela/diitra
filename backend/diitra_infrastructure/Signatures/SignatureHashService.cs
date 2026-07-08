using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace diitra_infrastructure.Signatures;

/// <summary>
/// Servicio de criptografía para el módulo DIITRA Firma.
/// Proporciona HMAC-SHA256 y generación del código único de firma.
///
/// Fórmula del HMAC (inmutable — cambiarla invalidaría firmas previas):
///   INPUT  = SHA256(pdfBytes) + ":" + userUuid + ":" + issuedAt.ISO8601 + ":" + firmaCode
///   OUTPUT = HMAC-SHA256(INPUT, DIITRA_SIGNING_SECRET)
/// </summary>
public class SignatureHashService
{
    private readonly string _secret;

    public SignatureHashService(IConfiguration config)
    {
        _secret = config["DiitraFirma:SigningSecret"]
            ?? throw new InvalidOperationException(
                "DiitraFirma:SigningSecret no está configurado en appsettings. " +
                "Agrega 'DiitraFirma__SigningSecret' como variable de entorno o en appsettings.Development.json.");
    }

    /// <summary>
    /// Genera un código único de firma legible para el PDF y el usuario.
    /// Formato: DFRM-{AÑO}-{8 chars hex del GUID}
    /// </summary>
    public static string GenerateFirmaCode()
    {
        var year = DateTime.UtcNow.Year;
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpper();
        return $"DFRM-{year}-{suffix}";
    }

    /// <summary>
    /// Calcula el SHA-256 de un array de bytes (usado para el hash del PDF).
    /// </summary>
    public static string ComputeSha256(byte[] data)
    {
        byte[] hash = SHA256.HashData(data);
        return Convert.ToHexString(hash).ToLower();
    }

    /// <summary>
    /// Genera el HMAC-SHA256 que actúa como prueba criptográfica de la firma.
    /// Vincula: hash del PDF + identidad del usuario + momento exacto + código único.
    /// </summary>
    public string GenerateHmac(string docHash, string userUuid, DateTime issuedAt, string firmaCode)
    {
        var input = $"{docHash}:{userUuid}:{issuedAt:O}:{firmaCode}";
        var key   = Encoding.UTF8.GetBytes(_secret);
        var data  = Encoding.UTF8.GetBytes(input);

        using var hmac = new HMACSHA256(key);
        byte[] result = hmac.ComputeHash(data);
        return Convert.ToHexString(result).ToLower();
    }

    /// <summary>
    /// Verifica la autenticidad del HMAC almacenado contra los datos originales.
    /// Usa comparación de tiempo constante para prevenir timing attacks.
    /// </summary>
    public bool VerifyHmac(string docHash, string userUuid, DateTime issuedAt, string firmaCode, string storedHmac)
    {
        var computed = GenerateHmac(docHash, userUuid, issuedAt, firmaCode);
        return CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(computed),
            Convert.FromHexString(storedHmac));
    }
}
