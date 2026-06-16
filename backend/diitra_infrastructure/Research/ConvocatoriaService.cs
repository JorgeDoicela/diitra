using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research;

public class ConvocatoriaService : IConvocatoriaService
{
    private readonly DiitraContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;
    private readonly ILogger<ConvocatoriaService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public ConvocatoriaService(
        DiitraContext context,
        INotificationService notificationService,
        IAuditService auditService,
        ILogger<ConvocatoriaService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    private void DispatchNotificationsInBackground(Func<IServiceProvider, Task> work)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                await work(scope.ServiceProvider);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificaciones en segundo plano");
            }
        });
    }

    public async Task<IEnumerable<ConvocatoriaDto>> GetAllAsync()
    {
        return await _context.InvConvocatorias
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRubricaNavigation)
            .Include(c => c.Hitos)
            .Include(c => c.DocumentosReq)
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
                LineasIds = c.Lineas.Select(l => l.IdLinea).ToList(),
                Hitos = c.Hitos.Select(h => new ConvocatoriaHitoDto {
                    IdHito = h.IdHito,
                    Uuid = h.Uuid,
                    NombreHito = h.NombreHito,
                    FechaHito = h.FechaHito,
                    EsCritico = h.EsCritico ?? false,
                    Descripcion = h.Descripcion
                }).ToList(),
                DocumentosReq = c.DocumentosReq.Select(d => new ConvocatoriaDocumentoReqDto {
                    IdDocReq = d.IdDocReq,
                    Uuid = d.Uuid,
                    NombreDocumento = d.NombreDocumento,
                    Descripcion = d.Descripcion,
                    EsObligatorio = d.EsObligatorio ?? false,
                    FormatoAceptado = d.FormatoAceptado
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<ConvocatoriaDto?> GetByUuidAsync(string uuid)
    {
        return await _context.InvConvocatorias
            .Include(c => c.IdPeriodoNavigation)
            .Include(c => c.IdRubricaNavigation)
            .Include(c => c.Lineas)
            .Include(c => c.Hitos)
            .Include(c => c.DocumentosReq)
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
                LineasIds = c.Lineas.Select(l => l.IdLinea).ToList(),
                Hitos = c.Hitos.Select(h => new ConvocatoriaHitoDto {
                    IdHito = h.IdHito,
                    Uuid = h.Uuid,
                    NombreHito = h.NombreHito,
                    FechaHito = h.FechaHito,
                    EsCritico = h.EsCritico ?? false,
                    Descripcion = h.Descripcion
                }).ToList(),
                DocumentosReq = c.DocumentosReq.Select(d => new ConvocatoriaDocumentoReqDto {
                    IdDocReq = d.IdDocReq,
                    Uuid = d.Uuid,
                    NombreDocumento = d.NombreDocumento,
                    Descripcion = d.Descripcion,
                    EsObligatorio = d.EsObligatorio ?? false,
                    FormatoAceptado = d.FormatoAceptado
                }).ToList()
            })
            .FirstOrDefaultAsync();
    }

    private async Task EnsureCodigoConvocatoriaUniqueAsync(string codigo, string? excludeUuid = null)
    {
        var normalized = codigo?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("El código de convocatoria es obligatorio.");

        var exists = await _context.InvConvocatorias
            .AnyAsync(c => c.CodigoConvocatoria == normalized && (excludeUuid == null || c.Uuid != excludeUuid));

        if (exists)
            throw new InvalidOperationException($"Ya existe una convocatoria con el código \"{normalized}\". Usa un código diferente.");
    }

    public async Task<string> CreateAsync(CreateConvocatoriaDto dto)
    {
        await EnsureCodigoConvocatoriaUniqueAsync(dto.CodigoConvocatoria);

        var convocatoria = new InvConvocatoria
        {
            Uuid = Guid.NewGuid().ToString(),
            CodigoConvocatoria = dto.CodigoConvocatoria.Trim(),
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

        if (dto.Hitos != null)
        {
            foreach (var h in dto.Hitos)
            {
                convocatoria.Hitos.Add(new InvConvocatoriaHito {
                    Uuid = Guid.NewGuid().ToString(),
                    NombreHito = h.NombreHito,
                    FechaHito = h.FechaHito,
                    EsCritico = h.EsCritico,
                    Descripcion = h.Descripcion
                });
            }
        }

        if (dto.DocumentosReq != null)
        {
            foreach (var d in dto.DocumentosReq)
            {
                convocatoria.DocumentosReq.Add(new InvConvocatoriaDocumentoReq {
                    Uuid = Guid.NewGuid().ToString(),
                    NombreDocumento = d.NombreDocumento,
                    Descripcion = d.Descripcion,
                    EsObligatorio = d.EsObligatorio,
                });
            }
        }

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

        var afterState = new
        {
            convocatoria.Uuid,
            convocatoria.CodigoConvocatoria,
            convocatoria.Titulo,
            convocatoria.Anio,
            convocatoria.PresupuestoTotal,
            convocatoria.MontoMaximoProyecto,
            convocatoria.FechaApertura,
            convocatoria.FechaCierre,
            convocatoria.Estado
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(null, "CREAR_CONVOCATORIA", $"Creación de convocatoria {convocatoria.Titulo}", "CONVOCATORIAS", null, afterJson);

        return convocatoria.Uuid;
    }

    public async Task<bool> UpdateAsync(string uuid, CreateConvocatoriaDto dto)
    {
        var conv = await _context.InvConvocatorias
            .Include(c => c.Lineas)
            .Include(c => c.Hitos)
            .Include(c => c.DocumentosReq)
            .FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        if (conv.Estado == "Cerrada")
            throw new InvalidOperationException("No se puede editar una convocatoria cerrada.");

        await EnsureCodigoConvocatoriaUniqueAsync(dto.CodigoConvocatoria, uuid);

        var beforeState = new
        {
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.Descripcion,
            conv.PresupuestoTotal,
            conv.MontoMaximoProyecto,
            conv.UrlBases,
            conv.RequisitosMinimos,
            conv.IdTipoConvocatoria,
            conv.IdAgendaZonal,
            conv.IdRubrica,
            conv.PuntajeMinimoAprobacion,
            conv.FinanciamientoExt,
            conv.MetaProduccion,
            conv.FechaApertura,
            conv.FechaCierre,
            conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        conv.CodigoConvocatoria = dto.CodigoConvocatoria.Trim();
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

        // Update Hitos
        _context.InvConvocatoriasHitos.RemoveRange(conv.Hitos);
        if (dto.Hitos != null)
        {
            foreach (var h in dto.Hitos)
            {
                conv.Hitos.Add(new InvConvocatoriaHito {
                    Uuid = Guid.NewGuid().ToString(),
                    NombreHito = h.NombreHito,
                    FechaHito = h.FechaHito,
                    EsCritico = h.EsCritico,
                    Descripcion = h.Descripcion
                });
            }
        }

        // Update DocumentosReq
        _context.InvConvocatoriasDocumentosReq.RemoveRange(conv.DocumentosReq);
        if (dto.DocumentosReq != null)
        {
            foreach (var d in dto.DocumentosReq)
            {
                conv.DocumentosReq.Add(new InvConvocatoriaDocumentoReq {
                    Uuid = Guid.NewGuid().ToString(),
                    NombreDocumento = d.NombreDocumento,
                    Descripcion = d.Descripcion,
                    EsObligatorio = d.EsObligatorio,
                });
            }
        }

        await _context.SaveChangesAsync();

        var afterState = new
        {
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.Descripcion,
            conv.PresupuestoTotal,
            conv.MontoMaximoProyecto,
            conv.UrlBases,
            conv.RequisitosMinimos,
            conv.IdTipoConvocatoria,
            conv.IdAgendaZonal,
            conv.IdRubrica,
            conv.PuntajeMinimoAprobacion,
            conv.FinanciamientoExt,
            conv.MetaProduccion,
            conv.FechaApertura,
            conv.FechaCierre,
            conv.Estado
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(null, "EDITAR_CONVOCATORIA", $"Edición de convocatoria {conv.Titulo}", "CONVOCATORIAS", beforeJson, afterJson);

        return true;
    }

    public async Task<bool> ChangeStatusAsync(string uuid, string newState)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        var beforeState = new
        {
            conv.Titulo,
            conv.CodigoConvocatoria,
            EstadoAnterior = conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        var oldState = conv.Estado;
        conv.Estado = newState;
        await _context.SaveChangesAsync();

        var afterState = new
        {
            conv.Titulo,
            conv.CodigoConvocatoria,
            EstadoNuevo = conv.Estado
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(null, "CAMBIAR_ESTADO_CONVOCATORIA", $"Convocatoria \"{conv.Titulo}\" cambió de {oldState} a {newState}", "CONVOCATORIAS", beforeJson, afterJson);

        if (newState == "Abierta" && oldState != "Abierta")
        {
            try
            {
                var titulo = conv.Titulo;
                var anio = conv.Anio.ToString();
                var codigo = conv.CodigoConvocatoria ?? "N/A";
                var fechaCierreStr = conv.FechaCierre.ToString("dd/MM/yyyy");

                DispatchNotificationsInBackground(async sp =>
                {
                    var notificationService = sp.GetRequiredService<INotificationService>();
                    await notificationService.BroadcastAsync(
                        "Nueva Convocatoria Abierta",
                        $"Se ha publicado la convocatoria: {titulo}. Ya puedes empezar a postular tus proyectos.",
                        "DOCENTE",
                        "/convocatorias",
                        new Dictionary<string, string>
                        {
                            { "Año", anio },
                            { "Código", codigo },
                            { "Fecha Cierre", fechaCierreStr }
                        }
                    );
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al encolar notificaciones de publicación para convocatoria {Uuid}", uuid);
            }
        }

        return true;
    }

    public async Task<bool> DeleteAsync(string uuid)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        var beforeState = new
        {
            conv.Uuid,
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        _context.InvConvocatorias.Remove(conv);
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(null, "ELIMINAR_CONVOCATORIA", $"Eliminación de convocatoria {conv.Titulo}", "CONVOCATORIAS", beforeJson, null);

        return true;
    }

    public async Task<IEnumerable<PeriodoDto>> GetActivePeriodsAsync()
    {
        // Filtrar utilizando la columna esInstituto de la base de datos (SIGAFI Compliance)
        return await _context.Periodos
            .Where(p => p.EsInstituto == 1)
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
