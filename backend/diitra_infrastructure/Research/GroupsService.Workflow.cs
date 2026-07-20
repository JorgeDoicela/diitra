using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research;

public partial class GroupsService
{
    public async Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion)
    {
        var group = await _context.InvGruposInvestigacion
            .Include(g => g.InvGruposMiembros)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);
        if (group == null) return false;

        var beforeState = new
        {
            Nombre = group.Nombre,
            Siglas = group.Siglas,
            TipoGrupo = group.TipoGrupo,
            IdDominio = group.IdDominio,
            IdCoordinador = group.IdCoordinador,
            ObjetivoGeneral = group.ObjetivoGeneral,
            Mision = group.Mision,
            Vision = group.Vision,
            ResolucionAprobacion = group.ResolucionAprobacion,
            FechaCreacion = group.FechaCreacion,
            Activo = group.Activo,
            Estado = group.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        if (aprobado)
        {
            group.Estado = "Aprobado";
            group.Activo = true;
            group.ResolucionAprobacion = resolucion;

            var afterState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                IdDominio = group.IdDominio,
                IdCoordinador = group.IdCoordinador,
                ObjetivoGeneral = group.ObjetivoGeneral,
                Mision = group.Mision,
                Vision = group.Vision,
                ResolucionAprobacion = group.ResolucionAprobacion,
                FechaCreacion = group.FechaCreacion,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "APROBAR_GRUPO", $"Aprobación del grupo {group.Nombre} con resolución {resolucion}", "INVESTIGACION", beforeJson, afterJson);
        }
        else
        {
            group.Estado = "Rechazado";
            group.Activo = false;
            group.ResolucionAprobacion = null;

            var afterState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                IdDominio = group.IdDominio,
                IdCoordinador = group.IdCoordinador,
                ObjetivoGeneral = group.ObjetivoGeneral,
                Mision = group.Mision,
                Vision = group.Vision,
                ResolucionAprobacion = group.ResolucionAprobacion,
                FechaCreacion = group.FechaCreacion,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "RECHAZAR_GRUPO", $"Rechazo del grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
        }

        await _context.SaveChangesAsync();

        var title = aprobado ? "Propuesta de Grupo Aprobada" : "Propuesta de Grupo Rechazada";
        var body = aprobado
            ? $"La propuesta del grupo \"{group.Nombre}\" ({group.Siglas}) ha sido APROBADA formalmente bajo la resolución {resolucion}."
            : $"La propuesta del grupo \"{group.Nombre}\" ({group.Siglas}) ha sido RECHAZADA. Revise el Buzón de Retroalimentación para ver los motivos y audios explicativos.";

        var membersToNotify = new List<int>();
        if (group.IdCoordinador.HasValue)
        {
            membersToNotify.Add(group.IdCoordinador.Value);
        }

        foreach (var member in group.InvGruposMiembros.Where(m => m.Activo == true))
        {
            if (!membersToNotify.Contains(member.IdUsuario))
            {
                membersToNotify.Add(member.IdUsuario);
            }
        }

        if (membersToNotify.Count > 0)
        {
            var groupUuid = group.Uuid;
            var groupNombre = group.Nombre;
            var groupEstado = group.Estado;
            var memberIds = membersToNotify.ToList();

            DispatchNotificationsInBackground(async sp =>
            {
                var notificationService = sp.GetRequiredService<INotificationService>();
                foreach (var userId in memberIds)
                {
                    try
                    {
                        await notificationService.NotifyUserAsync(
                            userId,
                            title,
                            body,
                            "INVESTIGACION",
                            $"/grupos?open={groupUuid}",
                            new Dictionary<string, string>
                            {
                                { "GrupoUuid", groupUuid },
                                { "Nombre del Grupo", groupNombre },
                                { "Estado", groupEstado }
                            });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al notificar al integrante {UserId} del grupo {GroupUuid}", userId, groupUuid);
                    }
                }
            });
        }

        return true;
    }

    public async Task<bool> StartReviewAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
        if (group == null) return false;

        if (group.Estado != "En Evaluación")
        {
            var beforeState = new { Estado = group.Estado };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            group.Estado = "En Evaluación";
            await _context.SaveChangesAsync();

            var afterState = new { Estado = group.Estado };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "INICIAR_EVALUACION_GRUPO", $"Inicio de evaluación para el grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
        }

        return true;
    }

    public async Task<bool> CancelReviewAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
        if (group == null) return false;

        if (group.Estado == "En Evaluación")
        {
            var beforeState = new { Estado = group.Estado };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            group.Estado = "Pendiente";
            await _context.SaveChangesAsync();

            var afterState = new { Estado = group.Estado };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "CANCELAR_EVALUACION_GRUPO", $"Cancelación de evaluación para el grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
        }

        return true;
    }
}
