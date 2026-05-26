using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly DiitraContext _context;

    public PeerReviewService(DiitraContext context)
    {
        _context = context;
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
        
        // Update project status to 'En Revisión'
        var project = await _context.InvProyectos.FindAsync(dto.IdProyecto);
        if (project != null && project.Estado == "Enviado")
        {
            project.Estado = "En Revisión";
        }

        await _context.SaveChangesAsync();
        return revision.Uuid;
    }

    public async Task<bool> SubmitEvaluationAsync(EvaluationDto dto)
    {
        var revision = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Detalles)
            .FirstOrDefaultAsync(r => r.Uuid == dto.RevisionUuid);

        if (revision == null) return false;

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

        // Calculate total score if all reviewers finished (Business Logic)
        // For now, just update the project score based on this review
        var totalScore = dto.Detalles.Sum(d => d.Puntaje);
        var project = await _context.InvProyectos.FindAsync(revision.IdProyecto);
        if (project != null)
        {
            project.PuntajeEvaluacion = totalScore; // Simplified logic: one review sets the score
            
            // Auto-approval logic
            var convocatoria = await _context.InvConvocatorias.FindAsync(project.IdConvocatoria);
            if (convocatoria != null && totalScore >= convocatoria.PuntajeMinimoAprobacion)
            {
                project.Estado = "Aprobado";
                project.FechaModificacion = DateTime.Now;
            }
            else
            {
                project.Estado = "Rechazado";
            }
        }

        await _context.SaveChangesAsync();
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
