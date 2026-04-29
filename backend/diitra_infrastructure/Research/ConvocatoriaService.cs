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
                FinanciamientoExt = c.FinanciamientoExt,
                MetaProduccion = c.MetaProduccion,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado
            })
            .ToListAsync();
    }

    public async Task<ConvocatoriaDto?> GetByUuidAsync(string uuid)
    {
        return await _context.InvConvocatorias
            .Include(c => c.IdPeriodoNavigation)
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
                FinanciamientoExt = c.FinanciamientoExt,
                MetaProduccion = c.MetaProduccion,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado
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
            FinanciamientoExt = dto.FinanciamientoExt,
            MetaProduccion = dto.MetaProduccion,
            FechaApertura = dto.FechaApertura,
            FechaCierre = dto.FechaCierre,
            Estado = "Borrador"
        };

        _context.InvConvocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();
        return convocatoria.Uuid;
    }

    public async Task<bool> UpdateAsync(string uuid, CreateConvocatoriaDto dto)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
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
        conv.FinanciamientoExt = dto.FinanciamientoExt;
        conv.MetaProduccion = dto.MetaProduccion;
        conv.FechaApertura = dto.FechaApertura;
        conv.FechaCierre = dto.FechaCierre;

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
        return await _context.Periodos
            .Where(p => p.Activo == true)
            .OrderByDescending(p => p.IdPeriodo)
            .Select(p => new PeriodoDto
            {
                IdPeriodo = p.IdPeriodo,
                Detalle = p.Detalle,
                Activo = p.Activo ?? false
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
}
