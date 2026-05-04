using Microsoft.EntityFrameworkCore;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research;

public class ConvocatoriaService : IConvocatoriaService
{
    private readonly DiitraContext _context;

    public ConvocatoriaService(DiitraContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ConvocatoriaDto>> GetAllAsync()
    {
        return await _context.InvConvocatorias
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRubricaNavigation)
            .OrderByDescending(c => c.Anio)
            .Select(c => new ConvocatoriaDto
            {
                IdConvocatoria = c.IdConvocatoria,
                Uuid = c.Uuid,
                CodigoConvocatoria = c.CodigoConvocatoria,
                Titulo = c.Titulo,
                IdPeriodo = c.IdPeriodo,
                PeriodoNombre = c.IdPeriodoNavigation.Detalle,
                Anio = c.Anio,
                Descripcion = c.Descripcion,
                PresupuestoTotal = c.PresupuestoTotal,
                MontoMaximoProyecto = c.MontoMaximoProyecto,
                UrlBases = c.UrlBases,
                RequisitosMinimos = c.RequisitosMinimos,
                IdTipoConvocatoria = c.IdTipoConvocatoria,
                IdAgendaZonal = c.IdAgendaZonal,
                IdRubrica = c.IdRubrica,
                RubricaNombre = c.IdRubricaNavigation != null ? c.IdRubricaNavigation.Nombre : null,
                PuntajeMinimoAprobacion = c.PuntajeMinimoAprobacion,
                FinanciamientoExt = c.FinanciamientoExt,
                MetaProduccion = c.MetaProduccion,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado,
                LineasIds = c.Lineas.Select(l => l.IdLinea).ToList()
            })
            .ToListAsync();
    }

    public async Task<ConvocatoriaDto?> GetByUuidAsync(string uuid)
    {
        return await _context.InvConvocatorias
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRubricaNavigation)
            .Include(c => c.Lineas)
            .Where(c => c.Uuid == uuid)
            .Select(c => new ConvocatoriaDto
            {
                IdConvocatoria = c.IdConvocatoria,
                Uuid = c.Uuid,
                CodigoConvocatoria = c.CodigoConvocatoria,
                Titulo = c.Titulo,
                IdPeriodo = c.IdPeriodo,
                PeriodoNombre = c.IdPeriodoNavigation.Detalle,
                Anio = c.Anio,
                Descripcion = c.Descripcion,
                PresupuestoTotal = c.PresupuestoTotal,
                MontoMaximoProyecto = c.MontoMaximoProyecto,
                UrlBases = c.UrlBases,
                RequisitosMinimos = c.RequisitosMinimos,
                IdTipoConvocatoria = c.IdTipoConvocatoria,
                IdAgendaZonal = c.IdAgendaZonal,
                IdRubrica = c.IdRubrica,
                RubricaNombre = c.IdRubricaNavigation != null ? c.IdRubricaNavigation.Nombre : null,
                PuntajeMinimoAprobacion = c.PuntajeMinimoAprobacion,
                FinanciamientoExt = c.FinanciamientoExt,
                MetaProduccion = c.MetaProduccion,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado,
                LineasIds = c.Lineas.Select(l => l.IdLinea).ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<string> CreateAsync(CreateConvocatoriaDto dto)
    {
        var convocatoria = new InvConvocatoria
        {
            Uuid = Guid.NewGuid().ToString(),
            CodigoConvocatoria = dto.CodigoConvocatoria,
            Titulo = dto.Titulo,
            IdPeriodo = dto.IdPeriodo,
            Anio = dto.Anio,
            Descripcion = dto.Descripcion,
            PresupuestoTotal = dto.PresupuestoTotal,
            MontoMaximoProyecto = dto.MontoMaximoProyecto,
            UrlBases = dto.UrlBases,
            RequisitosMinimos = dto.RequisitosMinimos,
            IdTipoConvocatoria = dto.IdTipoConvocatoria,
            IdAgendaZonal = dto.IdAgendaZonal,
            IdRubrica = dto.IdRubrica,
            PuntajeMinimoAprobacion = dto.PuntajeMinimoAprobacion,
            FinanciamientoExt = dto.FinanciamientoExt,
            MetaProduccion = dto.MetaProduccion,
            FechaApertura = dto.FechaApertura,
            FechaCierre = dto.FechaCierre,
            Estado = "Borrador"
        };

        if (dto.LineasIds != null && dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion
                .Where(l => dto.LineasIds.Contains(l.IdLinea))
                .ToListAsync();
            foreach (var linea in lineas)
            {
                convocatoria.Lineas.Add(linea);
            }
        }

        _context.InvConvocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();
        return convocatoria.Uuid;
    }

    public async Task<bool> UpdateAsync(string uuid, CreateConvocatoriaDto dto)
    {
        var conv = await _context.InvConvocatorias
            .Include(c => c.Lineas)
            .FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        conv.CodigoConvocatoria = dto.CodigoConvocatoria;
        conv.Titulo = dto.Titulo;
        conv.IdPeriodo = dto.IdPeriodo;
        conv.Anio = dto.Anio;
        conv.Descripcion = dto.Descripcion;
        conv.PresupuestoTotal = dto.PresupuestoTotal;
        conv.MontoMaximoProyecto = dto.MontoMaximoProyecto;
        conv.UrlBases = dto.UrlBases;
        conv.RequisitosMinimos = dto.RequisitosMinimos;
        conv.IdTipoConvocatoria = dto.IdTipoConvocatoria;
        conv.IdAgendaZonal = dto.IdAgendaZonal;
        conv.IdRubrica = dto.IdRubrica;
        conv.PuntajeMinimoAprobacion = dto.PuntajeMinimoAprobacion;
        conv.FinanciamientoExt = dto.FinanciamientoExt;
        conv.MetaProduccion = dto.MetaProduccion;
        conv.FechaApertura = dto.FechaApertura;
        conv.FechaCierre = dto.FechaCierre;

        // Update Lineas
        conv.Lineas.Clear();
        if (dto.LineasIds != null && dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion
                .Where(l => dto.LineasIds.Contains(l.IdLinea))
                .ToListAsync();
            foreach (var linea in lineas)
            {
                conv.Lineas.Add(linea);
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangeStatusAsync(string uuid, string newState)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        conv.Estado = newState;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string uuid)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        _context.InvConvocatorias.Remove(conv);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<PeriodoDto>> GetActivePeriodsAsync()
    {
        // Eliminamos el filtro de esInstituto porque en tu DB todos están en 0.
        // Ahora mostrará cualquier periodo que esté marcado como activo (global o del instituto).
        return await _context.Periodos
            .Where(p => p.Activo == true || p.Periodoactivoinstituto == 1)
            .OrderByDescending(p => p.IdPeriodo)
            .Select(p => new PeriodoDto
            {
                IdPeriodo = p.IdPeriodo,
                Detalle = p.Detalle,
                Activo = p.Activo == true || p.Periodoactivoinstituto == 1
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetCatalogosTiposAsync()
    {
        return await _context.InvTiposConvocatoria
            .Select(t => new { id = t.IdTipoConvocatoria, nombre = t.Nombre })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetCatalogosAgendasAsync()
    {
        return await _context.InvAgendasZonales
            .Select(a => new { id = a.IdAgendaZonal, nombre = a.Nombre })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetCatalogosRubricasAsync()
    {
        return await _context.Set<InvRubrica>()
            .Where(r => r.Activo)
            .Select(r => new { id = r.IdRubrica, nombre = r.Nombre })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetCatalogosLineasAsync()
    {
        return await _context.InvLineasInvestigacion
            .Where(l => l.Activo == true)
            .Select(l => new { id = l.IdLinea, nombre = l.NombreLinea })
            .ToListAsync();
    }
}
