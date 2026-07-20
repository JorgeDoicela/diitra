using Xunit;
using diitra_infrastructure.Security;
using diitra_application.Security;

namespace diitra_tests.Security;

/// <summary>
/// Tests unitarios para PasswordService (nucleo de seguridad de autenticacion).
/// VerifyPassword retorna PasswordVerificationResult con propiedad Success.
/// AuthService tiene demasiadas dependencias para test directo.
/// </summary>
public class AuthServiceTests
{
    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_HashEsDiferenteAlTextoPlano()
    {
        var svc  = new PasswordService();
        var hash = svc.HashPassword("MiContrasenaDIITRA2026!");
        Assert.NotEqual("MiContrasenaDIITRA2026!", hash);
        Assert.True(hash.Length > 30);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_VerifyPassword_Correcto_RetornaSuccess()
    {
        var svc    = new PasswordService();
        var hash   = svc.HashPassword("Diitra@Seguro2026!");
        var result = svc.VerifyPassword("Diitra@Seguro2026!", hash);
        Assert.True(result.Success);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_VerifyPassword_Incorrecto_RetornaFailure()
    {
        var svc    = new PasswordService();
        var hash   = svc.HashPassword("ContraseñaReal!");
        var result = svc.VerifyPassword("ContraseñaEquivocada!", hash);
        Assert.False(result.Success);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_DosHashes_SonDiferentes_PeroAmbosValidos()
    {
        var svc   = new PasswordService();
        var hash1 = svc.HashPassword("MismaContrasena123!");
        var hash2 = svc.HashPassword("MismaContrasena123!");
        Assert.NotEqual(hash1, hash2);
        Assert.True(svc.VerifyPassword("MismaContrasena123!", hash1).Success);
        Assert.True(svc.VerifyPassword("MismaContrasena123!", hash2).Success);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_HashContrasenaVacia_ProduceHashValido()
    {
        var svc    = new PasswordService();
        var hash   = svc.HashPassword("");
        Assert.NotNull(hash);
        Assert.True(svc.VerifyPassword("", hash).Success);
        Assert.False(svc.VerifyPassword("no-vacia", hash).Success);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "Auth")]
    public void PasswordService_ContrasenaLarga_SeHasheaCorrectamente()
    {
        var svc           = new PasswordService();
        var passwordLarga = new string('A', 100) + new string('b', 100);
        Assert.True(svc.VerifyPassword(passwordLarga, svc.HashPassword(passwordLarga)).Success);
    }
}
