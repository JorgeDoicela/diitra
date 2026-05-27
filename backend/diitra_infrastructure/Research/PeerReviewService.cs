using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly DiitraContext _context;
    private readonly IAuditService _auditService;

    public PeerReviewService(DiitraContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId)
    {
        return await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
            .Where(r => r.IdRevisor == revisorId && r.Estado == "Pendiente")
            .Select(r => new PeerReviewDto
            {
                Uuid = r.Uuid,
                IdProyecto = r.IdProyecto,
                ProyectoUuid = r.Proyecto.Uuid,
                ProyectoTitulo = r.Proyecto.Titulo,
                IdRevisor = r.IdRevisor,
                FechaAsignacion = r.FechaAsignacion,
                FechaLimite = r.FechaLimite,
                Estado = r.Estado,
                EsExterno = r.EsExterno
            })
            .ToListAsync();
    }

    public async Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
    {
        var project = await _context.InvProyectos.FindAsync(dto.IdProyecto);
        string estadoAnterior = project?.Estado ?? "Desconocido";

        var revision = new InvRevisionesPares
        {
            Uuid = Guid.NewGuid().ToString(),
            IdProyecto = dto.IdProyecto,
            IdRevisor = dto.IdRevisor,
            FechaLimite = dto.FechaLimite,
            EsExterno = dto.EsExterno,
            Estado = "Pendiente"
        };

        _context.Set<InvRevisionesPares>().Add(revision);
        
        if (project != null && project.Estado == "Enviado")
        {
            project.Estado = "En Revisión";
        }

        await _context.SaveChangesAsync();

        var afterState = new
        {
            Proyecto = project?.Titulo ?? "N/A",
            IdRevisor = dto.IdRevisor,
            EsExterno = dto.EsExterno,
            FechaLimite = dto.FechaLimite.ToString("dd/MM/yyyy"),
            EstadoRevision = "Pendiente",
            EstadoProyecto = project?.Estado ?? "N/A"
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(dto.IdRevisor, "ASIGNAR_REVISOR", $"Revisor asignado al proyecto \"{project?.Titulo ?? "N/A"}\"", "PROYECTOS", null, afterJson);

        return revision.Uuid;
    }

    public async Task<bool> SubmitEvaluationAsync(EvaluationDto dto)
    {
        var revision = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .FirstOrDefaultAsync(r => r.Uuid == dto.RevisionUuid);

        if (revision == null) return false;

        var project = await _context.InvProyectos.FindAsync(revision.IdProyecto);
        string estadoAnteriorProyecto = project?.Estado ?? "Desconocido";

        var beforeState = new
        {
            EstadoRevision = revision.Estado,
            EstadoProyecto = estadoAnteriorProyecto,
            PuntajeEvaluacion = project?.PuntajeEvaluacion
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        revision.Estado = "Completada";
        revision.ObservacionesGral = dto.ObservacionesGral;

        foreach (var detail in dto.Detalles)
        {
            revision.Detalles.Add(new InvEvaluacionesDetalle
            {
                Criterio = detail.Criterio,
                Puntaje = detail.Puntaje,
                Observaciones = detail.Observaciones
            });
        }

        var totalScore = dto.Detalles.Sum(d => d.Puntaje);

        if (project != null)
        {
            project.PuntajeEvaluacion = totalScore;
            
            var convocatoria = await _context.InvConvocatorias.FindAsync(project.IdConvocatoria);
            if (convocatoria != null && totalScore >= convocatoria.PuntajeMinimoAprobacion)
            {
                project.Estado = "Aprobado";
                project.FechaModificacion = DateTime.Now;
            }
            else
            {
                project.Estado = "Rechazado";
                project.FechaModificacion = DateTime.Now;
            }
        }

        await _context.SaveChangesAsync();

        var afterState = new
        {
            EstadoRevision = "Completada",
            EstadoProyecto = project?.Estado ?? "N/A",
            PuntajeEvaluacion = project?.PuntajeEvaluacion,
            PuntajeTotal = totalScore
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(revision.IdRevisor, "EVALUAR_PROYECTO", $"Evaluación completada del proyecto \"{project?.Titulo ?? "N/A"}\" con puntaje {totalScore}", "PROYECTOS", beforeJson, afterJson);

        return true;
    }

    public async Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
    {
        return await _context.Set<InvRevisionesPares>()
            .Include(r => r.Proyecto)
            .Where(r => r.IdProyecto == projectId)
            .Select(r => new PeerReviewDto
            {
                Uuid = r.Uuid,
                IdProyecto = r.IdProyecto,
                ProyectoUuid = r.Proyecto.Uuid,
                ProyectoTitulo = r.Proyecto.Titulo,
                IdRevisor = r.IdRevisor,
                FechaAsignacion = r.FechaAsignacion,
                FechaLimite = r.FechaLimite,
                Estado = r.Estado,
                EsExterno = r.EsExterno
            })
            .ToListAsync();
    }
}