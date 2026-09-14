using System;

namespace diitra_infrastructure.data.models;

public partial class InvCatRol
{
    public int IdRol { get; set; }
    public string Uuid { get; set; } = null!;
    public string Codigo { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string Ambito { get; set; } = "AMBOS"; // PROYECTO | GRUPO | AMBOS
    public string TipoPersona { get; set; } = "TODOS"; // DOCENTE | ESTUDIANTE | ADMINISTRATIVO | EXTERNO | TODOS
    public string? Descripcion { get; set; }
    public bool EsDirector { get; set; } = false;
    public bool Activo { get; set; } = true;
    public int Orden { get; set; } = 0;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}
