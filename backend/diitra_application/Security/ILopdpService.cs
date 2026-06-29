using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface ILopdpService
{
    Task RegistrarConsentimientoAsync(int idUsuario, string versionPolitica, string? ip, string? userAgent);
    Task<List<ConsentimientoResponse>> GetAllConsentimientosAsync();
    Task AuditoriaAccesoDatosAsync(int? idUsuarioActor, int idUsuarioAfectado, string tablaAfectada, string? columnaAfectada, string operacion, string? motivo, string? ip, string? userAgent);
    Task<PerfilLopdpDto?> GetPerfilAsync(int idUsuario);
    Task UpdatePerfilAsync(int idUsuario, ActualizarPerfilRequest request);
    Task GuardarFirmaElectronicaAsync(int idUsuario, string rutaArchivo, string passwordCifrada);
    Task EliminarFirmaElectronicaAsync(int idUsuario);
}

