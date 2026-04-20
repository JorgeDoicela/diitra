using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class SubcategoriasActividade
{
    public int IdSubcategoria { get; set; }

    public int? IdCategoria { get; set; }

    public string? Subcategoria { get; set; }

    public sbyte? EsDocencia { get; set; }

    public sbyte? Activa { get; set; }
    public virtual ICollection<ProfesoresActividade> ProfesoresActividades { get; set; } = new List<ProfesoresActividade>();
}
