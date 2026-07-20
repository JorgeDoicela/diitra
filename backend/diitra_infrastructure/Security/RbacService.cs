using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using diitra_application.Security;

namespace diitra_infrastructure.Security;

public class RbacService : IRbacService
{
    private readonly DiitraContext _context;
    private readonly string _masterAdminId;
    private static bool _rbacSeeded = false;

    public RbacService(DiitraContext context, IConfiguration configuration)
    {
        _context = context;
        _masterAdminId = configuration["Security:MasterAdminId"] ?? "0302144159";
    }

    public async Task SeedRbacStructureAsync()
    {
        if (_rbacSeeded) return;

        // 1. Asegurar Sistema
        var system = await _context.Systems.FirstOrDefaultAsync(s => s.Codigo == "DIITRA");
        if (system == null)
        {
            system = new SystemEntity { Codigo = "DIITRA", Detalle = "Dpto. Investigación e Innovación Traversari" };
            _context.Systems.Add(system);
            await _context.SaveChangesAsync();
        }

        // 2. Extraer todos los Módulos y Operaciones definidos en el Enum de Permisos
        var permissions = typeof(diitra_domain.Identity.Enums.Permissions)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetValue(null)?.ToString() ?? "")
            .Where(p => p.Contains(":"))
            .Select(p => {
                var parts = p.Split(':');
                return new { Modulo = parts[0], Operacion = parts[1] };
            })
            .Distinct()
            .ToList();

        if (!permissions.Any())
        {
            _rbacSeeded = true;
            return;
        }

        // 3. Traer todos los módulos, operaciones y relaciones de DIITRA a memoria en una sola tanda
        var existingModules = await _context.Modules
            .Where(m => m.IdSistema == system.IdSistema)
            .ToDictionaryAsync(m => m.Nombre, m => m);

        var existingOperations = await _context.Operations
            .ToDictionaryAsync(o => o.NombreOperacion, o => o);

        var existingRelations = await _context.ModuleOperations
            .Where(mo => mo.Module.IdSistema == system.IdSistema)
            .Select(mo => new { mo.IdModulos, mo.IdOperaciones })
            .ToListAsync();

        var relationSet = new HashSet<(int, int)>(
            existingRelations.Select(r => (r.IdModulos, r.IdOperaciones))
        );

        bool changesMade = false;

        foreach (var p in permissions)
        {
            // Asegurar Módulo en memoria / DB
            if (!existingModules.TryGetValue(p.Modulo, out var module))
            {
                module = new IdentityModule { Nombre = p.Modulo, IdSistema = system.IdSistema, EsActivo = true };
                _context.Modules.Add(module);
                changesMade = true;
                // Guardamos cambios temporalmente para obtener el ID generado por la base de datos
                await _context.SaveChangesAsync();
                existingModules[p.Modulo] = module;
            }

            // Asegurar Operación en memoria / DB
            if (!existingOperations.TryGetValue(p.Operacion, out var operation))
            {
                operation = new IdentityOperation { NombreOperacion = p.Operacion };
                _context.Operations.Add(operation);
                changesMade = true;
                await _context.SaveChangesAsync();
                existingOperations[p.Operacion] = operation;
            }

            // Asegurar Relación Módulo-Operación
            var relKey = (module.IdModulos, operation.IdOperaciones);
            if (!relationSet.Contains(relKey))
            {
                _context.ModuleOperations.Add(new ModuleOperation
                {
                    IdModulos = module.IdModulos,
                    IdOperaciones = operation.IdOperaciones,
                    EsActivo = true,
                    FechaCreacion = DateOnly.FromDateTime(DateTime.Now)
                });
                changesMade = true;
                relationSet.Add(relKey);
            }
        }

        if (changesMade)
        {
            await _context.SaveChangesAsync();
        }

        _rbacSeeded = true;
    }

    public async Task SynchronizeUserRolesAsync(User user)
    {
        var currentRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .ToListAsync();

        var requiredRoleCodes = new List<string>();

        // Reglas de negocio para roles automáticos
        if (user.IdSigafi == _masterAdminId || user.Administrador)
        {
            requiredRoleCodes.Add("DIITRA_ADMIN");
        }
        else if (user.TablaSigafi == "profesor") requiredRoleCodes.Add("DIITRA_DOCENTE");
        else if (user.TablaSigafi == "alumno") requiredRoleCodes.Add("DIITRA_ESTUDIANTE");
        else if (user.TablaSigafi == "otros") requiredRoleCodes.Add("DIITRA_REVISOR_EXTERNO");

        foreach (var requiredRoleCode in requiredRoleCodes)
        {
            if (!currentRoles.Any(r => r.Role.CodigoRol == requiredRoleCode))
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == requiredRoleCode);

                // Si el ROL no existe en la base de datos (tabla rbac_rol), lo CREAMOS automáticamente
                if (role == null)
                {
                    role = new Role
                    {
                        CodigoRol = requiredRoleCode,
                        Nombre = requiredRoleCode == "DIITRA_ADMIN" ? "Administrador DIITRA" :
                                 requiredRoleCode == "DIITRA_DOCENTE" ? "Docente Investigador DIITRA" :
                                 requiredRoleCode == "DIITRA_ESTUDIANTE" ? "Estudiante DIITRA" :
                                 requiredRoleCode == "DIITRA_REVISOR_EXTERNO" ? "Revisor Externo DIITRA" : requiredRoleCode,
                        EsActivo = true
                    };
                    _context.Roles.Add(role);
                    await _context.SaveChangesAsync();

                    // Asignar permisos por defecto al nuevo rol (AISLAMIENTO DE SISTEMA)
                    await AssignDefaultPermissionsToRoleAsync(role);
                }

                // Ahora que el rol existe, lo asignamos al usuario
                _context.UserRoles.Add(new UserRole
                {
                    IdUsuario = user.IdUsuario,
                    IdRol = role.IdRol,
                    EsActivo = true,
                    FechaCreacion = DateOnly.FromDateTime(DateTime.Now)
                });
                await _context.SaveChangesAsync();
            }
        }
    }

    public async Task AssignDefaultPermissionsToRoleAsync(Role role)
    {
        // Obtener el IdSistema de DIITRA primero (no se puede usar await dentro de Where lambda)
        var diitraSistemaId = await _context.Systems
            .Where(s => s.Codigo == "DIITRA")
            .Select(s => s.IdSistema)
            .FirstOrDefaultAsync();

        // Obtener todas las operaciones de DIITRA
        var diitraOps = await _context.ModuleOperations
            .Include(mo => mo.Module)
            .Include(mo => mo.Operation)
            .Where(mo => mo.Module.IdSistema == diitraSistemaId)
            .ToListAsync();

        foreach (var op in diitraOps)
        {
            bool shouldAssign = false;
            var perm = $"{op.Module.Nombre}:{op.Operation.NombreOperacion}".ToUpper();

            if (role.CodigoRol == "DIITRA_ADMIN") shouldAssign = true; // Admin tiene TODO de DIITRA
            else if (role.CodigoRol == "DIITRA_DOCENTE")
            {
                // Docentes: Gestión de proyectos y bitácora, pero no administración de sistema
                if (perm.StartsWith("PROYECTOS") || perm.StartsWith("BITACORA") || perm.StartsWith("SOLICITUDES")) shouldAssign = true;
                if (perm == "CONFIGURACION:VER") shouldAssign = true;
            }
            else if (role.CodigoRol == "DIITRA_ESTUDIANTE")
            {
                // Estudiantes: Solo ver y postular
                if (perm == "PROYECTOS:VER" || perm == "PROYECTOS:POSTULAR") shouldAssign = true;
            }
            else if (role.CodigoRol == "DIITRA_REVISOR_EXTERNO")
            {
                // Revisores Externos: Solo ver proyectos asignados y realizar revisiones
                if (perm == "PROYECTOS:VER" || perm.StartsWith("REVISIONES")) shouldAssign = true;
            }

            if (shouldAssign)
            {
                _context.RoleModuleOperations.Add(new RoleModuleOperation
                {
                    IdRol = role.IdRol,
                    IdModulosOperaciones = op.IdModulosOperaciones,
                    EsActivo = true,
                    FechaAsignacion = DateOnly.FromDateTime(DateTime.Now)
                });
            }
        }
        await _context.SaveChangesAsync();
    }
}
