using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class ProfesoresActividade
{
    public string IdPeriodo { get; set; } = null!;

    public string IdProfesor { get; set; } = null!;

    public int IdSubcategoria { get; set; }

    public int? HorasSemana { get; set; }

    public string? Usuario { get; set; }

    public DateTime? Fecha { get; set; }

    public virtual SubcategoriasActividade IdSubcategoriaNavigation { get; set; } = null!;
}
