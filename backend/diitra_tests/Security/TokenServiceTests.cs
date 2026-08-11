using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Xunit;
using Microsoft.Extensions.Configuration;
using diitra_application.Security.DTOs;
using diitra_infrastructure.Security;
using System.Collections.Generic;

namespace diitra_tests.Security;

/// <summary>
/// Tests unitarios para TokenService.
/// Valida la generación y estructura de tokens JWT y refresh tokens:
///  - GenerateToken produce un JWT válido de 3 partes
///  - El token tiene fecha de expiración futura
///  - El token contiene el identificador del usuario (IdReferencia)
///  - GenerateRefreshToken produce tokens únicos y no vacíos
/// </summary>
public class TokenServiceTests
{
    private static IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JWTSettings:Secret"]        = "YOUR_JWT_SHARED_SECRET_KEY_CHANGE_IN_PRODUCTION",
                ["JWTSettings:Issuer"]        = "diitra-test-issuer",
                ["JWTSettings:Audience"]      = "diitra-test-audience",
                ["JWTSettings:ExpiryMinutes"] = "60",
            })
            .Build();

    private static AuthResponse BuildAuth(int id = 1, string idRef = "sigafi-001") => new AuthResponse
    {
        IdReferencia   = idRef,
        NombreCompleto = "Test User",
        Role           = "DOCENTE",
        Roles          = new List<string> { "DOCENTE" },
        RoleCodes      = new List<string> { "DOCENTE" },
        TipoUsuario    = "profesor",
        Permissions    = new List<string>(),
        Token          = string.Empty,
        Administrador  = false,
        IdUsuario      = id,
        UserUuid       = Guid.NewGuid().ToString(),
        Sistemas       = "DIITRA"
    };

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateToken_RetornaJwtConTresParts()
    {
        var token = new TokenService(CreateConfig()).GenerateToken(BuildAuth());
        Assert.NotNull(token);
        Assert.Equal(3, token.Split('.').Length);
        Assert.True(new JwtSecurityTokenHandler().CanReadToken(token));
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateToken_ExpiresEnFuturo()
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(new TokenService(CreateConfig()).GenerateToken(BuildAuth(2, "s002")));
        Assert.True(jwt.ValidTo > DateTime.UtcNow);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateToken_ContieneIdReferenciaEnPayload()
    {
        const string idRef = "sigafi-unique-999";
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(new TokenService(CreateConfig()).GenerateToken(BuildAuth(3, idRef)));
        Assert.Contains(jwt.Claims, c => c.Value == idRef);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateToken_IssuedByConfiguredIssuer()
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(new TokenService(CreateConfig()).GenerateToken(BuildAuth()));
        Assert.Equal("diitra-test-issuer", jwt.Issuer);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateRefreshToken_LongitudSegura()
    {
        var token = new TokenService(CreateConfig()).GenerateRefreshToken("sigafi-test");
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.True(token.Length >= 20);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "TokenService")]
    public void GenerateRefreshToken_DosLlamadas_TokensUnicos()
    {
        var sut = new TokenService(CreateConfig());
        Assert.NotEqual(sut.GenerateRefreshToken("u1"), sut.GenerateRefreshToken("u2"));
    }
}
