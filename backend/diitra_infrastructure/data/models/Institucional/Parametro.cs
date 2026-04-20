using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Parametro
{
    public string? CodigoInstitucion { get; set; }

    public string? NombreInstitucion { get; set; }

    public string? CadenaConexion { get; set; }

    public string? NombreRector { get; set; }

    public string? ArchivoFirma { get; set; }

    public string? ArchivoSello { get; set; }

    public string? EmailSolicitudes { get; set; }

    public string? ClaveEmailSolicitudes { get; set; }

    public sbyte? Activo { get; set; }

    public sbyte? PermiteActualizacionCompleta { get; set; }
}
