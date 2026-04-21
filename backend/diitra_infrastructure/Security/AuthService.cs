using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;

namespace diitra_infrastructure.Security;

public class AuthService : IAuthService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;
    private const string MASTER_ADMIN_ID = "0302144159";

    public AuthService(DiitraContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        Console.WriteLine($"[DEBUG] Login attempt for user: {username}");
        // 1. Intentar buscar en la tabla centralizada (Usuarios)
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Usuario.Trim() == username && (u.Activo ?? true));
        
        Console.WriteLine($"[DEBUG] User find result: {(user != null ? "FOUND" : "NOT FOUND")}");

        if (user != null)
        {
            // Validamos contra la clave. Soporta tanto Hash como Texto Plano (para transición)
            bool isPasswordValid = false;
            
            try {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.Contrasenia);
            } catch {
                // Fallback: Si no es un hash válido, comparar como texto plano (Legacy)
                isPasswordValid = (user.Contrasenia == password);
                
                // MEJORA: Si entró con texto plano, actualizar a Hash automáticamente
                if (isPasswordValid)
                {
                    user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(password);
                    await _context.SaveChangesAsync();
                }
            }

            if (isPasswordValid)
            {
                // LOGICA DE REFUERZO: Si es el Master Admin, asegurar que tenga el flag de administrador activo
                if (username == MASTER_ADMIN_ID && !(user.Administrador ?? false))
                {
                    user.Administrador = true;
                    await _context.SaveChangesAsync();
                }

                return await GetAuthResponseAsync(user, user.TipoUsuario);
            }
        }

        // 2. PROVISIÓN BAJO DEMANDA: Buscar como Profesor (Legacy) si no está centralizado
        if (user == null)
        {
            Console.WriteLine($"[STEP 1] User not found. Checking if it's a teacher for provisioning...");
            var profesor = await _context.Profesores
                .FirstOrDefaultAsync(p => p.IdProfesor.Trim() == username && (p.Activo == 1 || p.Activo == null));

            if (profesor == null)
            {
                Console.WriteLine($"[DEBUG] Professor not found with ID: {username}");
                return null;
            }

            Console.WriteLine($"[STEP 2] Creating new user for: {profesor.PrimerNombre} {profesor.PrimerApellido}");
            user = new User
            {
                Usuario = username,
                Nombre = $"{profesor.PrimerNombre} {profesor.PrimerApellido}",
                Contrasenia = BCrypt.Net.BCrypt.HashPassword(password),
                Activo = true,
                Administrador = false,
                TipoUsuario = "profesor",
                IdSigafi = username
            };

            try {
                Console.WriteLine($"[STEP 3] Adding user to DB tracker...");
                _context.Users.Add(user);
                Console.WriteLine($"[STEP 4] Saving changes (User creation)...");
                await _context.SaveChangesAsync();
                Console.WriteLine($"[STEP 5] User created with ID: {user.IdUsuario}");
            } catch (Exception ex) {
                Console.WriteLine($"[ERROR STEP 4/5] Failed to create user: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[INNER] {ex.InnerException.Message}");
                throw;
            }

            // Asignar rol por defecto
            Console.WriteLine($"[STEP 6] Assigning default role...");
            var defaultRoleCodigo = username == MASTER_ADMIN_ID ? "ADMIN_SIST" : "DOCENTE_IN";
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == defaultRoleCodigo);

            if (defaultRole != null)
            {
                var newUserRole = new UserRole
                {
                    IdUsuario = user.IdUsuario,
                    IdRol = defaultRole.IdRol,
                    EsActivo = true,
                    FechaCreacion = DateTime.Now
                };
                _context.UserRoles.Add(newUserRole);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[STEP 7] Role assigned: {defaultRoleCodigo}");
            }
            return await GetAuthResponseAsync(user, "profesor");
        }

        // 3. PROVISIÓN BAJO DEMANDA: Buscar como Alumno (Legacy)
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => a.UserAlumno == username && a.Password == password);

        if (alumno != null)
        {
            if (user == null)
            {
                user = new User
                {
                    Usuario = username,
                    Nombre = $"{(alumno.PrimerNombre ?? "").Trim()} {(alumno.ApellidoPaterno ?? "").Trim()}",
                    Contrasenia = BCrypt.Net.BCrypt.HashPassword(password),
                    Activo = true,
                    TipoUsuario = "alumno",
                    IdSigafi = alumno.IdAlumno
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            return await GetAuthResponseAsync(user, "alumno");
        }

        return null;
    }

    private async Task<AuthResponse> GetAuthResponseAsync(User user, string tipoUsuario)
    {
        var cleanId = user.Usuario.Trim();

        Console.WriteLine($"[DEBUG] Loading roles for IdUsuario: {user.IdUsuario}");
        // Cargar Roles y sus configuraciones modulares
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Module)
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Operation)
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .ToListAsync();
        
        Console.WriteLine($"[DEBUG] Roles found: {userRoles.Count}");

        // LOGICA DE REFUERZO: Si es el Master Admin, asegurar que tenga el rol ADMIN_SIST
        if (cleanId == MASTER_ADMIN_ID && !userRoles.Any(ur => ur.Role.CodigoRol == "ADMIN_SIST"))
        {
            Console.WriteLine("[SECURITY] Master Admin missing ADMIN_SIST role. Forcing assignment...");
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == "ADMIN_SIST");
            if (adminRole != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    IdUsuario = user.IdUsuario,
                    IdRol = adminRole.IdRol,
                    EsActivo = true,
                    FechaCreacion = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                
                // Recargar roles
                userRoles = await _context.UserRoles
                    .Include(ur => ur.Role).ThenInclude(r => r.RoleModuleOperations).ThenInclude(rmo => rmo.ModuleOperation).ThenInclude(mo => mo.Module)
                    .Include(ur => ur.Role).ThenInclude(r => r.RoleModuleOperations).ThenInclude(rmo => rmo.ModuleOperation).ThenInclude(mo => mo.Operation)
                    .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
                    .ToListAsync();
            }
        }

        // LOGICA DE BOOTSTRAP: Asignar rol inicial si es nuevo en DIITRA
        if (!userRoles.Any() && tipoUsuario == "profesor")
        {
            Console.WriteLine("[DEBUG] No roles found, executing bootstrap assignment...");
            // MASTER ADMIN BLINDADO EN CÓDIGO
            var defaultRoleCodigo = cleanId == MASTER_ADMIN_ID ? "ADMIN_SIST" : "DOCENTE_IN";
            
            Console.WriteLine($"[DEBUG] Searching for default role: {defaultRoleCodigo}");
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == defaultRoleCodigo);
            
            if (defaultRole != null)
            {
                try {
                    Console.WriteLine($"[DEBUG] Assigning role: {defaultRole.Nombre} (ID: {defaultRole.IdRol})");
                    var newUserRole = new UserRole
                    {
                        IdUsuario = user.IdUsuario,
                        IdRol = defaultRole.IdRol,
                        EsActivo = true,
                        FechaCreacion = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(newUserRole);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("[DEBUG] Role assigned successfully.");

                    // Recargar
                    userRoles = await _context.UserRoles
                        .Include(ur => ur.Role)
                            .ThenInclude(r => r.RoleModuleOperations)
                                .ThenInclude(rmo => rmo.ModuleOperation)
                                    .ThenInclude(mo => mo.Module)
                        .Include(ur => ur.Role)
                            .ThenInclude(r => r.RoleModuleOperations)
                                .ThenInclude(rmo => rmo.ModuleOperation)
                                    .ThenInclude(mo => mo.Operation)
                        .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
                        .ToListAsync();
                } catch (Exception ex) {
                    Console.WriteLine($"[ERROR] Bootstrap role assignment failed: {ex.Message}");
                    throw;
                }
            } else {
                Console.WriteLine($"[WARNING] Default role {defaultRoleCodigo} NOT found in database!");
            }
        }

        // Determinar Rol Primario (para compatibilidad legada)
        var primaryRole = userRoles
            .OrderByDescending(ur => ur.Role.CodigoRol == "ADMIN_SIST")
            .ThenBy(ur => ur.IdRol)
            .FirstOrDefault()?.Role?.Nombre 
            ?? (tipoUsuario == "alumno" ? "Estudiante" : "Sin Rol");
        
        // Carga de Permisos Modulares (Formato MODULE:OPERATION)
        var permissions = userRoles
            .SelectMany(ur => ur.Role.RoleModuleOperations)
            .Where(rmo => (rmo.EsActivo ?? true) && rmo.ModuleOperation != null && (rmo.ModuleOperation.EsActivo ?? true))
            .Select(rmo => $"{rmo.ModuleOperation.Module.Nombre}:{rmo.ModuleOperation.Operation.NombreOperacion}".ToUpper())
            .Distinct()
            .ToList();

        // 3. LOGICA DE SHADOW PROFILE: Asegurar que el usuario tenga su metadata/uuid en DIITRA
        var metadata = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
        if (metadata == null)
        {
            Console.WriteLine($"[SECURITY] Provisioning DIITRA metadata for User: {user.Usuario}");
            metadata = new InvUsuarioMetadata
            {
                IdUsuario = user.IdUsuario,
                Uuid = Guid.NewGuid(),
                FechaRegistro = DateTime.UtcNow,
                FechaUltimoAcceso = DateTime.UtcNow,
                Version = 1
            };
            _context.InvUsuariosMetadata.Add(metadata);
            await _context.SaveChangesAsync();
        }
        else
        {
            metadata.FechaUltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        try
        {
            var response = new AuthResponse
            {
                IdReferencia = user.Usuario.Trim(),
                IdUsuario = user.IdUsuario,
                UserUuid = metadata.Uuid.ToString(),
                Usuario = user.Usuario,
                NombreCompleto = user.Nombre,
                Role = primaryRole,
                Roles = userRoles.Select(ur => ur.Role.Nombre).ToList(),
                RoleCodes = userRoles.Select(ur => ur.Role.CodigoRol).ToList(),
                TipoUsuario = user.TipoUsuario,
                Permissions = permissions,
                Administrador = (cleanId == MASTER_ADMIN_ID) || (user.Administrador ?? false)
            };

            // Generar el token y asignarlo
            response.Token = GenerateToken(response);
            
            return response;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[FATAL ERROR] GetAuthResponseAsync failed: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"[INNER] {ex.InnerException.Message}");
            return null!;
        }
    }

    public string GenerateToken(AuthResponse user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.IdReferencia),
            new Claim(ClaimTypes.Name, user.NombreCompleto),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("user_uuid", user.UserUuid),
            new Claim("tipo_usuario", user.TipoUsuario),
            new Claim("es_admin", user.Administrador.ToString().ToLower())
        };

        // Incluir todos los códigos de rol como claims de Role para mayor compatibilidad
        foreach (var roleCode in user.RoleCodes)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleCode));
        }

        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(double.Parse(jwtSettings["ExpiryInHours"] ?? "12")),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        Console.WriteLine($"[DEBUG] Token generated successfully for: {user.NombreCompleto}");
        return tokenString;
    }
}
