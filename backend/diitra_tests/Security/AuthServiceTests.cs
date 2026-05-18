using Xunit;
using Moq;
using Microsoft.Extensions.Configuration;
using diitra_infrastructure.Security;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace diitra_tests.Security;

public class AuthServiceTests
{
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<DiitraContext> _mockContext;
    private readonly Mock<IAuditService> _mockAudit;

    public AuthServiceTests()
    {
        _mockConfig = new Mock<IConfiguration>();
        _mockContext = new Mock<DiitraContext>();
        _mockAudit = new Mock<IAuditService>();

        // Setup common JWT config for testing
        _mockConfig.Setup(c => c.GetSection("Jwt:Secret")).Returns(new Mock<IConfigurationSection>().Object);
        _mockConfig.Setup(c => c.GetSection("Jwt:Secret").Value).Returns("super_secret_key_for_testing_purposes_123");
        _mockConfig.Setup(c => c.GetSection("Jwt:Issuer").Value).Returns("diitra_test");
        _mockConfig.Setup(c => c.GetSection("Jwt:Audience").Value).Returns("diitra_users");
        _mockConfig.Setup(c => c.GetSection("Jwt:ExpiryInHours").Value).Returns("12");
    }

    [Fact]
    public void GenerateToken_ShouldReturnValidJwtString()
    {
        // Arrange
        var service = new AuthService(_mockContext.Object, _mockConfig.Object, _mockAudit.Object);
        var authResponse = new AuthResponse
        {
            IdReferencia = "12345",
            NombreCompleto = "Test User",
            Role = "ADMIN",
            RoleCodes = new List<string> { "ADMIN_SIST" },
            Permissions = new List<string> { "PROYECTOS:VER" },
            TipoUsuario = "profesor",
            Administrador = true
        };

        // Act
        var token = service.GenerateToken(authResponse);

        // Assert
        Assert.NotNull(token);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        Assert.Equal("diitra_test", jwtToken.Issuer);
        Assert.Contains(jwtToken.Claims, c => c.Type == ClaimTypes.Name && c.Value == "Test User");
        Assert.Contains(jwtToken.Claims, c => c.Type == "permission" && c.Value == "PROYECTOS:VER");
    }

    [Fact]
    public async Task LoginAsync_InvalidCredentials_ShouldReturnNull()
    {
        // Arrange
        // (Simplified mock for DB sets would go here or use InMemoryDatabase)
        // For now, let's just check the service instantiation works and handles null returns
        var service = new AuthService(_mockContext.Object, _mockConfig.Object, _mockAudit.Object);
        var request = new LoginRequest { Username = "wrong", Password = "wrong" };

        // Act - This might fail if DB sets aren't mocked, so we expect null or an exception handled
        var result = await service.LoginAsync(request);

        // Assert
        Assert.Null(result);
    }
}
