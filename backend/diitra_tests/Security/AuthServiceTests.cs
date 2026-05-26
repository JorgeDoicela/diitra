using Xunit;
using Moq;
using Microsoft.Extensions.Configuration;
using diitra_infrastructure.Security;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;

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

        // Setup common JWTSettings config for testing
        var mockJwtSection = new Mock<IConfigurationSection>();
        mockJwtSection.Setup(s => s["Secret"]).Returns("super_secret_key_for_testing_purposes_123_at_least_32_characters_long!");
        mockJwtSection.Setup(s => s["Issuer"]).Returns("auth_global_istpet");
        mockJwtSection.Setup(s => s["Audience"]).Returns("all");
        _mockConfig.Setup(c => c.GetSection("JWTSettings")).Returns(mockJwtSection.Object);
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

        Assert.Equal("auth_global_istpet", jwtToken.Issuer);
        Assert.Contains(jwtToken.Claims, c => c.Type == "nombre" && c.Value == "Test User");
        Assert.Contains(jwtToken.Claims, c => c.Type == "permission" && c.Value == "PROYECTOS:VER");
    }

    [Fact]
    public async Task LoginAsync_InvalidCredentials_ShouldReturnNull()
    {
        // Arrange
        var usersList = new List<diitra_domain.Identity.Entities.User>();
        var mockUsers = GetMockDbSet(usersList);
        _mockContext.Setup(c => c.Users).Returns(mockUsers.Object);

        var profesoresList = new List<Profesore>();
        var mockProfesores = GetMockDbSet(profesoresList);
        _mockContext.Setup(c => c.Profesores).Returns(mockProfesores.Object);

        var alumnosList = new List<Alumno>();
        var mockAlumnos = GetMockDbSet(alumnosList);
        _mockContext.Setup(c => c.Alumnos).Returns(mockAlumnos.Object);

        var service = new AuthService(_mockContext.Object, _mockConfig.Object, _mockAudit.Object);
        var request = new LoginRequest { Username = "wrong", Password = "wrong" };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        Assert.Null(result);
    }

    private Mock<DbSet<T>> GetMockDbSet<T>(List<T> sourceList) where T : class
    {
        var queryable = sourceList.AsQueryable();
        var dbSet = new Mock<DbSet<T>>();
        dbSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        dbSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        dbSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        dbSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());
        return dbSet;
    }
}

internal class TestAsyncQueryProvider<TEntity> : Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    internal TestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(System.Linq.Expressions.Expression expression)
    {
        return new TestAsyncEnumerable<TEntity>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(System.Linq.Expressions.Expression expression)
    {
        return new TestAsyncEnumerable<TElement>(expression);
    }

    public object? Execute(System.Linq.Expressions.Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(System.Linq.Expressions.Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(System.Linq.Expressions.Expression expression, CancellationToken cancellationToken = default)
    {
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethods()
            .First(method => method.Name == nameof(IQueryProvider.Execute) && method.IsGenericMethod)
            .MakeGenericMethod(expectedResultType)
            .Invoke(_inner, new[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(expectedResultType)
            .Invoke(null, new[] { executionResult })!;
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable)
    { }

    public TestAsyncEnumerable(System.Linq.Expressions.Expression expression) : base(expression)
    { }

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }
}
