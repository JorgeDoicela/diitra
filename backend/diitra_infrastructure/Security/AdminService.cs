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

        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ids.Contains(ur.IdReferencia) && ur.TipoReferencia == "profesor" && ur.Activo)
            .ToListAsync();

        return professors.Select(p => new UserManagementDto
        {
            IdProfesor = p.IdProfesor.Trim(),
            NombreCompleto = $"{p.PrimerNombre} {p.PrimerApellido}",
            Email = !string.IsNullOrEmpty(p.EmailInstitucional) ? p.EmailInstitucional : p.Email,
            Roles = userRoles
                .Where(ur => ur.IdReferencia == p.IdProfesor.Trim())
                .Select(ur => ur.Role.Nombre)
                .ToList()
        }).ToList();
    }

    public async Task<bool> AssignRoleAsync(string idProfesor, string roleName)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == roleName);
        if (role == null) return false;

        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.IdReferencia == idProfesor && ur.IdRol == role.IdRol && ur.TipoReferencia == "profesor");

        if (existing != null)
        {
            if (existing.Activo) return true;
            existing.Activo = true;
        }
        else
        {
            _context.UserRoles.Add(new UserRole
            {
                IdReferencia = idProfesor,
                TipoReferencia = "profesor",
                IdRol = role.IdRol,
                Activo = true,
                FechaAsignacion = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeRoleAsync(string idProfesor, string roleName)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == roleName);
        if (role == null) return false;

        var existing = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.IdReferencia == idProfesor && ur.IdRol == role.IdRol && ur.TipoReferencia == "profesor");

        if (existing != null)
        {
            existing.Activo = false;
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
