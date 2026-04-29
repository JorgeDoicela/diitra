using System;
using System.Collections.Generic;

namespace diitra_domain.Identity.Entities;

public class User
{
    public int IdUsuario { get; set; }
    public string Usuario { get; set; } = string.Empty; // Cedula/Username
    public string Nombre { get; set; } = string.Empty;
    public string Contrasenia { get; set; } = string.Empty;
    public bool? Activo { get; set; } = true;
    public bool? Administrador { get; set; }
    public string TablaSigafi { get; set; } = "profesor"; // profesor, alumno, externo, admin
    public string? IdSigafi { get; set; } // Reference to legacy idProfesor/idAlumno

    // Relaciones
    public virtual InvUsuarioMetadata? InvUsuarioMetadata { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
