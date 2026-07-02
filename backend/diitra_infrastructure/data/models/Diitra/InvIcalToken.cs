namespace diitra_infrastructure.data.models;

public partial class InvIcalToken
{
    public int IdToken { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdUsuario { get; set; }
    public string Token { get; set; } = null!;
    public bool Activo { get; set; } = true;
    public DateTime FechaGenerado { get; set; }
    public DateTime? FechaUltimoUso { get; set; }
}
