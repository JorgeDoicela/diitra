using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class AsignacionesProfesore
{
    public string IdProfesor { get; set; } = null!;

    public int IdAsignatura { get; set; }

    public string IdPeriodo { get; set; } = null!;

    public int IdModalidad { get; set; }

    public int IdSeccion { get; set; }

    public int IdNivel { get; set; }

    public string Paralelo { get; set; } = null!;

    public sbyte? Activo { get; set; }

    public DateTime? FechaGrabar { get; set; }

    public DateTime? FechaModificacion { get; set; }

    public string? CodigoAsignacion { get; set; }

    public sbyte? EntregaActa { get; set; }

    public sbyte? IngresaNotas { get; set; }

    public string? UserAsignaciones { get; set; }

    public DateOnly? FechaFin { get; set; }

    public DateOnly? FechaInicial { get; set; }

    public string? UserActa { get; set; }

    public int IdAsignacion { get; set; }

    public sbyte? EsActivaAsignacion { get; set; }

    public decimal? NumeroHoras { get; set; }

    public sbyte? ContabilizarHoraDocente { get; set; }

    public decimal? HorasPracticoExperimental { get; set; }

    public virtual ICollection<HorarioDetalle> HorarioDetalles { get; set; } = new List<HorarioDetalle>();
}
