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
                p.IdProfesor.Contains(searchTerm) || 
                p.PrimerNombre.ToLower().Contains(searchTerm) || 
                p.PrimerApellido.ToLower().Contains(searchTerm) ||
                p.Email.ToLower().Contains(searchTerm) ||
                p.EmailInstitucional.ToLower().Contains(searchTerm));
        }

        var professors = await query.Take(20).ToListAsync();
        var ids = professors.Select(p => p.IdProfesor.Trim()).ToList();

        // Buscar roles enganchados al Usuario centralizado (que coincide con la cédula/idProfesor)
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ids.Contains(ur.Usuario) && ur.EsActivo)
            .ToListAsync();

        return professors.Select(p => new UserManagementDto
        {
            IdProfesor = p.IdProfesor.Trim(),
            NombreCompleto = $"{p.PrimerNombre} {p.PrimerApellido}",
            Email = !string.IsNullOrEmpty(p.EmailInstitucional) ? p.EmailInstitucional : p.Email,
            Roles = userRoles
                .Where(ur => ur.Usuario == p.IdProfesor.Trim())
                .Select(ur => ur.Role.Nombre)
                .ToList(),
            RoleCodes = userRoles
                .Where(ur => ur.Usuario == p.IdProfesor.Trim())
                .Select(ur => ur.Role.CodigoRol)
                .ToList()
        }).ToList();
    }

    public async Task<bool> AssignRoleAsync(string idProfesor, string roleCode)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == roleCode);
        
        if (role == null)
            role = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == roleCode);

        if (role == null) return false;

        // Aseguramos que el usuario esté centralizado (On-demand en Admin)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Usuario == idProfesor);
        if (user == null)
        {
            var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == idProfesor);
            if (p != null)
            {
                user = new User
                {
                    Usuario = idProfesor,
                    Nombre = $"{p.PrimerNombre} {p.PrimerApellido}",
                    Clave = p.Clave ?? "cambiame",
                    Activo = true,
                    TipoUsuario = "profesor",
                    IdSigafi = p.IdProfesor
                };
                _context.Users.Add(user);
            }
        }

        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.Usuario == idProfesor && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            if (existing.EsActivo) return true;
            existing.EsActivo = true;
            existing.FechaModificacion = DateTime.UtcNow;
        }
        else
        {
            _context.UserRoles.Add(new UserRole
            {
                Usuario = idProfesor,
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
            .FirstOrDefaultAsync(ur => ur.Usuario == idProfesor && ur.IdRol == role.IdRol);

        if (existing != null)
        {
            existing.EsActivo = false;
            existing.FechaModificacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
