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
                IdTipoConvocatoria = c.IdTipoConvocatoria,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado,
                Proyectos = c.Proyectos.Select(p => new ConvocatoriaProyectoDto {
                    Uuid = p.Uuid,
                    Titulo = p.Titulo,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Estado = p.Estado
                }).ToList()
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
                IdTipoConvocatoria = c.IdTipoConvocatoria,
                FechaApertura = c.FechaApertura,
                FechaCierre = c.FechaCierre,
                Estado = c.Estado,
                Proyectos = c.Proyectos.Select(p => new ConvocatoriaProyectoDto {
                    Uuid = p.Uuid,
                    Titulo = p.Titulo,
                    CodigoInstitucional = p.CodigoInstitucional,
                    Estado = p.Estado
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

    private void ValidateConvocatoria(CreateConvocatoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Titulo))
            throw new InvalidOperationException("El título de la convocatoria es obligatorio.");

        if (string.IsNullOrWhiteSpace(dto.Anio))
            throw new InvalidOperationException("El año calendario es obligatorio.");

        var anioRegex = new System.Text.RegularExpressions.Regex(@"^(?:19|20|21)\d{2}(?:\s*[-\/]\s*(?:19|20|21)\d{2})?$");
        if (!anioRegex.IsMatch(dto.Anio.Trim()))
            throw new InvalidOperationException("El año calendario debe ser un año de 4 dígitos (ej: 2026) o un rango de años válido (ej: 2026 - 2027).");

        if (dto.IdTipoConvocatoria == null || dto.IdTipoConvocatoria <= 0)
            throw new InvalidOperationException("El tipo de convocatoria es obligatorio.");

        if (dto.FechaApertura > dto.FechaCierre)
            throw new InvalidOperationException("La fecha de apertura debe ser anterior o igual a la fecha de cierre.");
    }

    public async Task<string> CreateAsync(CreateConvocatoriaDto dto)
    {
        ValidateConvocatoria(dto);
        await EnsureCodigoConvocatoriaUniqueAsync(dto.CodigoConvocatoria);

        var convocatoria = new InvConvocatoria
        {
            Uuid = Guid.NewGuid().ToString(),
            CodigoConvocatoria = dto.CodigoConvocatoria.Trim(),
            Titulo = dto.Titulo.Trim(),
            IdPeriodo = dto.IdPeriodo,
            Anio = dto.Anio.Trim(),
            IdTipoConvocatoria = dto.IdTipoConvocatoria,
            FechaApertura = dto.FechaApertura,
            FechaCierre = dto.FechaCierre,
            Estado = "Borrador"
        };

        _context.InvConvocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();

        var afterState = new
        {
            convocatoria.Uuid,
            convocatoria.CodigoConvocatoria,
            convocatoria.Titulo,
            convocatoria.Anio,
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
        ValidateConvocatoria(dto);
        var conv = await _context.InvConvocatorias
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
            conv.IdTipoConvocatoria,
            conv.FechaApertura,
            conv.FechaCierre,
            conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        conv.CodigoConvocatoria = dto.CodigoConvocatoria.Trim();
        conv.Titulo = dto.Titulo.Trim();
        conv.IdPeriodo = dto.IdPeriodo;
        conv.Anio = dto.Anio.Trim();
        conv.IdTipoConvocatoria = dto.IdTipoConvocatoria;
        conv.FechaApertura = dto.FechaApertura;
        conv.FechaCierre = dto.FechaCierre;

        await _context.SaveChangesAsync();

        var afterState = new
        {
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.IdTipoConvocatoria,
            conv.FechaApertura,
            conv.FechaCierre,
            conv.Estado
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

        await _auditService.LogActionAsync(null, "EDITAR_CONVOCATORIA", $"Edición de convocatoria {conv.Titulo}", "CONVOCATORIAS", beforeJson, afterJson);

        return true;
    }

    public async Task<bool> PublishWithAudienceAsync(string uuid, PublishConvocatoriaRequest request)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        var oldState = conv.Estado;
        conv.Estado = "Abierta";
        await _context.SaveChangesAsync();

        var afterState = new
        {
            conv.Titulo,
            conv.CodigoConvocatoria,
            EstadoNuevo = conv.Estado,
            AudienceRequest = request
        };
        string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);
        await _auditService.LogActionAsync(null, "PUBLICAR_CONVOCATORIA_CON_AUDIENCIA", $"Publicación y difusión de convocatoria \"{conv.Titulo}\"", "CONVOCATORIAS", null, afterJson);

        try
        {
            var titulo = conv.Titulo;
            var anio = conv.Anio.ToString();
            var codigo = conv.CodigoConvocatoria ?? "N/A";
            var fechaAperturaStr = conv.FechaApertura.ToString("dd/MM/yyyy");
            var fechaCierreStr = conv.FechaCierre.ToString("dd/MM/yyyy");
            var periodoId = conv.IdPeriodo;

            DispatchNotificationsInBackground(async sp =>
            {
                var db = sp.GetRequiredService<DiitraContext>();
                var drivers = sp.GetServices<INotificationDriver>();
                var emailDriver = drivers.FirstOrDefault(d => d.Name == "Email");

                var recipientList = new List<(string Email, int? UserId, string Name)>();

                // 1. Destinatarios explícitos por User ID
                if (request.DestinatariosUserIds != null && request.DestinatariosUserIds.Any())
                {
                    var users = await db.Users.AsNoTracking().Where(u => request.DestinatariosUserIds.Contains(u.IdUsuario)).ToListAsync();
                    foreach (var u in users)
                    {
                        var email = u.EmailInstitucional?.Trim();
                        if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                        {
                            recipientList.Add((email, u.IdUsuario, u.Nombre?.Trim() ?? "Docente Investigador"));
                        }
                    }
                }

                // 2. Destinatarios explícitos por Email
                if (request.DestinatariosEmails != null && request.DestinatariosEmails.Any())
                {
                    foreach (var em in request.DestinatariosEmails)
                    {
                        var trimmed = em?.Trim();
                        if (!string.IsNullOrEmpty(trimmed) && trimmed.Contains('@'))
                        {
                            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.EmailInstitucional == trimmed);
                            recipientList.Add((trimmed, user?.IdUsuario, user?.Nombre?.Trim() ?? trimmed.Split('@')[0]));
                        }
                    }
                }

                // 3. Docentes con horas de investigación
                if (request.IncluirDocentesConHoras)
                {
                    var researchSubcatId = await db.SubcategoriasActividades.AsNoTracking()
                        .Where(s => s.Subcategoria != null && (s.Subcategoria.ToLower().Contains("investiga") || s.Subcategoria.ToLower().Contains("i+d")))
                        .Select(s => (int?)s.IdSubcategoria)
                        .FirstOrDefaultAsync();

                    var profQuery = db.Profesores.AsNoTracking().Where(p => p.Activo == 1);
                    if (researchSubcatId.HasValue && !string.IsNullOrEmpty(periodoId))
                    {
                        profQuery = profQuery.Where(p => db.ProfesoresActividades.Any(pa =>
                            pa.IdProfesor == p.IdProfesor &&
                            pa.IdSubcategoria == researchSubcatId.Value &&
                            pa.IdPeriodo == periodoId));
                    }

                    var profs = await profQuery.ToListAsync();
                    var profIds = profs.Select(p => p.IdProfesor.Trim()).ToList();
                    var linkedUsers = await db.Users.AsNoTracking().Where(u => profIds.Contains(u.IdSigafi.Trim())).ToListAsync();

                    foreach (var p in profs)
                    {
                        var linked = linkedUsers.FirstOrDefault(u => u.IdSigafi.Trim() == p.IdProfesor.Trim());
                        var email = linked?.EmailInstitucional ?? p.EmailInstitucional ?? p.Email;
                        var name = $"{p.PrimerNombre} {p.PrimerApellido}".Trim();
                        if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                        {
                            recipientList.Add((email.Trim(), linked?.IdUsuario, string.IsNullOrWhiteSpace(name) ? "Docente Investigador" : name));
                        }
                    }
                }

                // 4. Todos los docentes
                if (request.IncluirTodosDocentes)
                {
                    var allProfs = await db.Profesores.AsNoTracking().Where(p => p.Activo == 1).ToListAsync();
                    var profIds = allProfs.Select(p => p.IdProfesor.Trim()).ToList();
                    var linkedUsers = await db.Users.AsNoTracking().Where(u => profIds.Contains(u.IdSigafi.Trim())).ToListAsync();

                    foreach (var p in allProfs)
                    {
                        var linked = linkedUsers.FirstOrDefault(u => u.IdSigafi.Trim() == p.IdProfesor.Trim());
                        var email = linked?.EmailInstitucional ?? p.EmailInstitucional ?? p.Email;
                        var name = $"{p.PrimerNombre} {p.PrimerApellido}".Trim();
                        if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                        {
                            recipientList.Add((email.Trim(), linked?.IdUsuario, string.IsNullOrWhiteSpace(name) ? "Docente" : name));
                        }
                    }
                }

                // 5. Autoridades y Departamentos (Rectorado, Vicerrectorado, Comunicación, etc.)
                if (request.IncluirAutoridadesYDepartamentos)
                {
                    var adminProfs = await db.Profesores.AsNoTracking().Where(p => p.Activo == 1 &&
                        db.Contratos.Any(c => c.IdProfesor == p.IdProfesor && (c.EsActivo == 1 || c.EsActivo == null) &&
                            ((c.DepartamentoNavigation != null && (
                                c.DepartamentoNavigation.NombreDepartamento.ToLower().Contains("rector") ||
                                c.DepartamentoNavigation.NombreDepartamento.ToLower().Contains("vicerrector") ||
                                c.DepartamentoNavigation.NombreDepartamento.ToLower().Contains("comunicaci") ||
                                c.DepartamentoNavigation.NombreDepartamento.ToLower().Contains("investiga")
                            )) ||
                            (c.CargoInstitutoNavigation != null && (
                                c.CargoInstitutoNavigation.Nombre.ToLower().Contains("rector") ||
                                c.CargoInstitutoNavigation.Nombre.ToLower().Contains("vicerrector") ||
                                c.CargoInstitutoNavigation.Nombre.ToLower().Contains("comunicaci") ||
                                c.CargoInstitutoNavigation.Nombre.ToLower().Contains("director") ||
                                c.CargoInstitutoNavigation.Nombre.ToLower().Contains("coordinador")
                            )))))
                        .ToListAsync();

                    var adminIds = adminProfs.Select(p => p.IdProfesor.Trim()).ToList();
                    var linkedUsers = await db.Users.AsNoTracking().Where(u => adminIds.Contains(u.IdSigafi.Trim())).ToListAsync();

                    foreach (var p in adminProfs)
                    {
                        var linked = linkedUsers.FirstOrDefault(u => u.IdSigafi.Trim() == p.IdProfesor.Trim());
                        var email = linked?.EmailInstitucional ?? p.EmailInstitucional ?? p.Email;
                        var name = $"{p.PrimerNombre} {p.PrimerApellido}".Trim();
                        if (!string.IsNullOrEmpty(email) && email.Contains('@'))
                        {
                            recipientList.Add((email.Trim(), linked?.IdUsuario, string.IsNullOrWhiteSpace(name) ? "Autoridad Institucional" : name));
                        }
                    }
                }

                // Deduplicar por Email
                var uniqueRecipients = new Dictionary<string, (string Email, int? UserId, string Name)>(StringComparer.OrdinalIgnoreCase);
                foreach (var r in recipientList)
                {
                    if (!uniqueRecipients.ContainsKey(r.Email))
                    {
                        uniqueRecipients[r.Email] = r;
                    }
                }

                var extraData = new Dictionary<string, string>
                {
                    { "Año", anio },
                    { "Código", codigo },
                    { "Fecha Apertura", fechaAperturaStr },
                    { "Fecha Cierre", fechaCierreStr }
                };

                var title = $"Apertura Oficial: Convocatoria {codigo} - {titulo}";
                var body = $"Estimado(a) colega, se ha publicado oficialmente la convocatoria {codigo}: \"{titulo}\". Las postulaciones para proyectos de investigación e innovación se encuentran formalmente habilitadas desde el {fechaAperturaStr} hasta el {fechaCierreStr}.";

                foreach (var r in uniqueRecipients.Values)
                {
                    try
                    {
                        if (emailDriver != null)
                        {
                            await emailDriver.SendAsync(r.Email, title, body, "/convocatorias", r.Name, extraData);
                        }

                        if (r.UserId.HasValue)
                        {
                            var notif = new InvNotificacion
                            {
                                Uuid = Guid.NewGuid(),
                                Destinatario = r.UserId.Value,
                                Titulo = "Nueva Convocatoria Abierta",
                                Mensaje = $"Se ha publicado la convocatoria: {titulo}. Ya puedes empezar a postular proyectos.",
                                Categoria = "INVESTIGACION",
                                UrlAccion = "/convocatorias",
                                FechaEnvio = DateTime.UtcNow,
                                Leido = false
                            };
                            db.InvNotificaciones.Add(notif);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al despachar notificación a {Email}", r.Email);
                    }
                }

                await db.SaveChangesAsync();
                _logger.LogInformation("Convocatoria {Uuid} publicada. Total de destinatarios únicos notificados: {Count}", uuid, uniqueRecipients.Count);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al encolar despacho de convocatoria {Uuid}", uuid);
        }

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
                var fechaAperturaStr = conv.FechaApertura.ToString("dd/MM/yyyy");
                var fechaCierreStr = conv.FechaCierre.ToString("dd/MM/yyyy");

                DispatchNotificationsInBackground(async sp =>
                {
                    var notificationService = sp.GetRequiredService<INotificationService>();
                    await notificationService.BroadcastAsync(
                        "Nueva Convocatoria Abierta",
                        $"Se ha publicado la convocatoria: {titulo}. Ya puedes empezar a postular tus proyectos de investigación o innovación.",
                        "DOCENTE",
                        "/convocatorias",
                        new Dictionary<string, string>
                        {
                            { "Año", anio },
                            { "Código", codigo },
                            { "Fecha Apertura", fechaAperturaStr },
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

    public async Task<bool> DeleteAsync(string uuid, string? userIdRef = null)
    {
        var conv = await _context.InvConvocatorias.FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        // Validar si existen proyectos asociados
        var tieneProyectos = await _context.InvProyectos.AnyAsync(p => p.IdConvocatoria == conv.IdConvocatoria);
        if (tieneProyectos)
        {
            throw new InvalidOperationException("No se puede eliminar la convocatoria porque tiene proyectos asociados.");
        }

        var beforeState = new
        {
            conv.Uuid,
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
        int? internalUserId = internalUser?.IdUsuario;

        conv.Eliminado = true;
        conv.FechaEliminacion = DateTime.UtcNow;
        conv.EliminadoPorUsuarioId = internalUserId;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(internalUserId, "ELIMINAR_CONVOCATORIA_TEMPORAL", $"Convocatoria enviada a la papelera: {conv.Titulo}", "CONVOCATORIAS", beforeJson, null);

        return true;
    }

    public async Task<bool> RestoreAsync(string uuid, string? userIdRef = null)
    {
        var conv = await _context.InvConvocatorias
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
        int? internalUserId = internalUser?.IdUsuario;

        conv.Eliminado = false;
        conv.FechaEliminacion = null;
        conv.EliminadoPorUsuarioId = null;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(internalUserId, "RESTAURAR_CONVOCATORIA", $"Convocatoria restaurada de la papelera: {conv.Titulo}", "CONVOCATORIAS", null, null);

        return true;
    }

    public async Task<bool> PurgeAsync(string uuid, string? userIdRef = null)
    {
        var conv = await _context.InvConvocatorias
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Uuid == uuid);
        if (conv == null) return false;

        var tieneProyectos = await _context.InvProyectos.AnyAsync(p => p.IdConvocatoria == conv.IdConvocatoria);
        if (tieneProyectos)
        {
            throw new InvalidOperationException("No se puede eliminar permanentemente la convocatoria porque tiene proyectos asociados.");
        }

        var beforeState = new
        {
            conv.Uuid,
            conv.CodigoConvocatoria,
            conv.Titulo,
            conv.Anio,
            conv.Estado
        };
        string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

        var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
        int? internalUserId = internalUser?.IdUsuario;

        _context.InvConvocatorias.Remove(conv);
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(internalUserId, "ELIMINAR_CONVOCATORIA", $"Eliminación física de convocatoria: {conv.Titulo}", "CONVOCATORIAS", beforeJson, null);

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
