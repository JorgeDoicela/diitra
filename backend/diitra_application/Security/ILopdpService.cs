using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface ILopdpService
{
    Task RegistrarConsentimientoAsync(int idUsuario, string versionPolitica, string? ip, string? userAgent);
    Task RegistrarSolicitudArcoAsync(int idUsuario, string tipoSolicitud, string detalleSolicitud);
    Task ResolverSolicitudArcoAsync(int idSolicitudArco, string resolucionDetalle, string estado, string? documentPath);
    Task<List<SolicitudArcoResponse>> GetMisSolicitudesArcoAsync(int idUsuario);
    Task<List<SolicitudArcoResponse>> GetAllSolicitudesArcoAsync();
    Task AuditoriaAccesoDatosAsync(int? idUsuarioActor, int idUsuarioAfectado, string tablaAfectada, string? columnaAfectada, string operacion, string? motivo, string? ip, string? userAgent);
}
