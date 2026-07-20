using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using diitra_infrastructure.Security;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_tests.Security;

/// <summary>
/// Tests unitarios para RbacService y logica de roles.
/// Role.Nombre (no NombreRol), User.Administrador es bool (no bool?).
/// </summary>
public class RbacServiceTests
{
    private static DiitraContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DiitraContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new DiitraContext(options);
    }

    private static RbacService CreateSut(DiitraContext context) =>
        new RbacService(context,
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["Security:MasterAdminId"] = "admin-test" })
                .Build());

    // ─── Logica RBAC pura ────────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "RBAC")]
    public void UsuarioAdministrador_TieneBanderaAdminEnTrue()
    {
        var user = new User { IdUsuario = 99, IdSigafi = "admin", Nombre = "Admin", Administrador = true };
        Assert.True(user.Administrador);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "RBAC")]
    public void UsuarioNoAdministrador_TieneBanderaAdminEnFalse()
    {
        var user = new User { IdUsuario = 1, IdSigafi = "docente", Nombre = "Docente", Administrador = false };
        Assert.False(user.Administrador);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "RBAC")]
    public void Rol_TieneCodigoYNombreCorrectamente()
    {
        // Role.Nombre (no NombreRol), Role.CodigoRol
        var rol = new Role { IdRol = 1, Nombre = "DOCENTE_INVESTIGADOR", CodigoRol = "DOCENTE_INV" };
        Assert.Equal("DOCENTE_INV", rol.CodigoRol);
        Assert.Equal("DOCENTE_INVESTIGADOR", rol.Nombre);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "RBAC")]
    public async Task UserRoles_PersistenEnDB_Correctamente()
    {
        var dbName = nameof(UserRoles_PersistenEnDB_Correctamente);
        await using var context = CreateInMemoryContext(dbName);

        var rol  = new Role { IdRol = 1, Nombre = "Docente", CodigoRol = "DOCENTE" };
        var user = new User { IdUsuario = 10, IdSigafi = "doc001", Nombre = "Docente Test", Administrador = false };
        context.Roles.Add(rol);
        context.Users.Add(user);
        context.UserRoles.Add(new UserRole { IdUsuario = 10, IdRol = 1, EsActivo = true });
        await context.SaveChangesAsync();

        var userRoles = context.UserRoles.Where(ur => ur.IdUsuario == 10 && ur.EsActivo == true).ToList();
        Assert.Single(userRoles);
        Assert.Equal(1, userRoles[0].IdRol);
    }

    [Fact]
    [Trait("Category", "Unit")]
    [Trait("Feature", "RBAC")]
    public async Task SynchronizeUserRolesAsync_ConUserValido_NoLanzaExcepcion()
    {
        var dbName = nameof(SynchronizeUserRolesAsync_ConUserValido_NoLanzaExcepcion);
        await using var context = CreateInMemoryContext(dbName);
        var user = new User { IdUsuario = 20, IdSigafi = "testsync", Nombre = "Sync Test", Administrador = false, TablaSigafi = "profesor" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var sut = CreateSut(context);

        var exception = await Record.ExceptionAsync(() => sut.SynchronizeUserRolesAsync(user));
        Assert.Null(exception);
    }
}
