using Microsoft.EntityFrameworkCore;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Security;

public class AdminService : IAdminService
{
    private readonly DiitraContext _context;

    public AdminService(DiitraContext context)
    {
        _context = context;
    }

    public async Task<List<UserManagementDto>> GetProfessorsAsync(string? searchTerm)
    {
        var query = _context.Profesores.Where(p => p.Activo == 1);
        
        if (!string.IsNullOrEmpty(searchTerm))
        {
            searchTerm = searchTerm.ToLower();
            query = query.Where(p => 
                (p.IdProfesor ?? "").Contains(searchTerm) || 
                (p.PrimerNombre ?? "").ToLower().Contains(searchTerm) || 
                (p.PrimerApellido ?? "").ToLower().Contains(searchTerm) ||
                (p.Email ?? "").ToLower().Contains(searchTerm) ||
                (p.EmailInstitucional ?? "").ToLower().Contains(searchTerm));
        }

        var professors = await query.Take(20).ToListAsync();
        var ids = professors.Select(p => p.IdProfesor.Trim()).ToList();

        // Buscar roles enganchados al Usuario centralizado (que coincide con la cédula/idProfesor)
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Include(ur => ur.User)
                .ThenInclude(u => u.InvUsuarioMetadata) // Necesitamos el UUID
            .Where(ur => ids.Contains(ur.User.Usuario) && (ur.EsActivo ?? true))
            .ToListAsync();

        return professors.Select(p => {
            var roleInfo = userRoles.Where(ur => ur.User.Usuario == p.IdProfesor.Trim()).ToList();
            var userMeta = roleInfo.FirstOrDefault()?.User?.InvUsuarioMetadata;

            return new UserManagementDto
            {
                IdProfesor = p.IdProfesor.Trim(),
                NombreCompleto = $"{p.PrimerNombre} {p.PrimerApellido}",
                Email = !string.IsNullOrEmpty(p.EmailInstitucional) ? p.EmailInstitucional : p.Email,
                UserUuid = userMeta?.Uuid ?? string.Empty,
                Roles = roleInfo.Select(ur => ur.Role.Nombre).ToList(),
                RoleCodes = roleInfo.Select(ur => ur.Role.CodigoRol).ToList()
            };
        }).ToList();
    }

    public async Task<bool> AssignRoleAsync(string idProfesor, string roleCode)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode);
        
        if (role == null)
            role = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == roleCode);

        if (role == null) return false;

        // Aseguramos que el usuario esté centralizado (Soporta ID o UUID)
        var user = await _context.Users
            .Include(u => u.InvUsuarioMetadata)
            .FirstOrDefaultAsync(u => u.Usuario == idProfesor || (u.InvUsuarioMetadata != null && u.InvUsuarioMetadata.Uuid == idProfesor));
        if (user == null)
        {
            var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == idProfesor);
            if (p != null)
            {
                user = new User
                {
                    Usuario = idProfesor,
                    Nombre = $"{p.PrimerNombre} {p.PrimerApellido}",
                    Contrasenia = p.Clave ?? "cambiame",
                    Activo = true,
                    TipoUsuario = "profesor",
                    IdSigafi = p.IdProfesor
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync(); // Importante: Guardar para generar IdUsuario

                // PROVISIÓN DE METADATA (Shielding)
                var metadata = new InvUsuarioMetadata
                {
                    IdUsuario = user.IdUsuario,
                    Uuid = Guid.NewGuid().ToString(),
                    Version = 1
                };
                _context.InvUsuariosMetadata.Add(metadata);
                await _context.SaveChangesAsync();
            }
        }

        if (user == null) return false;

        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.IdUsuario == user.IdUsuario && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            if (existing.EsActivo ?? true) return true;
            existing.EsActivo = true;
            existing.FechaModificacion = DateTime.UtcNow;
        }
        else
        {
            _context.UserRoles.Add(new UserRole
            {
                IdUsuario = user.IdUsuario,
                IdRol = role.IdRol,
                EsActivo = true,
                FechaCreacion = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeRoleAsync(string idProfesor, string roleCode)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode);
        
        if (role == null)
            role = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == roleCode);

        if (role == null) return false;

        var existing = await _context.UserRoles
            .Include(ur => ur.User)
                .ThenInclude(u => u.InvUsuarioMetadata)
            .FirstOrDefaultAsync(ur => (ur.User.Usuario == idProfesor || (ur.User.InvUsuarioMetadata != null && ur.User.InvUsuarioMetadata.Uuid == idProfesor)) && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            existing.EsActivo = false;
            existing.FechaModificacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
