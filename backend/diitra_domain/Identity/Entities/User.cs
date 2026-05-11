using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class User
{
    public int IdUsuario { get; set; }
    public string IdSigafi { get; set; } = string.Empty; // Mapped to idSigafi column
    public string TablaSigafi { get; set; } = "profesor"; // alumno, profesor, otros
    public string? Nombre { get; set; }
    public string Contrasenia { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public bool Administrador { get; set; } = false;
    
    // Nuevos campos según DESCRIBE
    public string? EmailInstitucional { get; set; }
    public bool EmailValidado { get; set; } = false;
    public string? HashEmailToken { get; set; }
    public DateTime? FechaEmailValidacion { get; set; }

    // Relaciones
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}


