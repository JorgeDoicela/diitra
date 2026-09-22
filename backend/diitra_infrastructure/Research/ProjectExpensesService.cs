using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public class ProjectExpensesService : IProjectExpensesService
    {
        private readonly DiitraContext _context;
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly ILogger<ProjectExpensesService> _logger;

        public ProjectExpensesService(
            DiitraContext context,
            IProjectOrchestrator projectOrchestrator,
            ILogger<ProjectExpensesService> logger)
        {
            _context = context;
            _projectOrchestrator = projectOrchestrator;
            _logger = logger;
        }

        public async Task<ExpenseOperationResult<PresupuestoResumenDto>> GetPresupuestoResumenAsync(string projectUuid, ClaimsPrincipal user)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .Include(p => p.InvPresupuestoItems)
                    .ThenInclude(i => i.InvGastos)
                .Include(p => p.InvFinanciamientos)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<PresupuestoResumenDto>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Proyecto no encontrado."
                };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            bool isSuperAdmin = await IsSuperAdminAsync(user, userIdRef);
            bool isDirector = !string.IsNullOrEmpty(userIdRef) && await _projectOrchestrator.IsProjectDirectorAsync(projectUuid, userIdRef);
            bool isMember = !string.IsNullOrEmpty(userIdRef) && await IsProjectMemberAsync(project.IdProyecto, userIdRef);

            bool puedeEditarPlanificacion = isSuperAdmin || ((isDirector || isMember) && 
                (project.Estado == "Borrador" || project.Estado == "En Corrección" || project.Estado == "Prepropuesta" || project.Estado == "En Ejecución"));

            var estadosEgresos = await ObtenerEstadosPermitidosEgresosAsync();
            bool puedeRegistrarGastos = isSuperAdmin || ((isDirector || isMember) && estadosEgresos.Contains(project.Estado));

            var itemsDto = project.InvPresupuestoItems.Select(item =>
            {
                decimal totalEjecutado = item.InvGastos.Sum(g => g.Monto);
                decimal saldoDisponible = Math.Max(0, item.ValorTotal - totalEjecutado);
                decimal pctEjec = item.ValorTotal > 0 ? Math.Round((totalEjecutado / item.ValorTotal) * 100, 2) : 0;

                return new PresupuestoItemDto
                {
                    IdItem = item.IdItem,
                    IdProyecto = item.IdProyecto,
                    Categoria = item.Categoria,
                    IdPartida = item.IdPartida,
                    Detalle = item.Detalle,
                    Cantidad = item.Cantidad,
                    ValorUnitario = item.ValorUnitario,
                    ValorTotal = item.ValorTotal,
                    EsGastoCapital = item.EsGastoCapital,
                    TotalEjecutado = totalEjecutado,
                    SaldoDisponible = saldoDisponible,
                    PorcentajeEjecucion = pctEjec,
                    CantidadFacturas = item.InvGastos.Count
                };
            }).OrderBy(i => i.Categoria).ThenBy(i => i.IdItem).ToList();

            var gastosDto = project.InvPresupuestoItems
                .SelectMany(i => i.InvGastos.Select(g => new { Gasto = g, Item = i }))
                .OrderByDescending(x => x.Gasto.FechaGasto)
                .ThenByDescending(x => x.Gasto.IdGasto)
                .Select(x => new GastoDetalleDto
                {
                    IdGasto = x.Gasto.IdGasto,
                    Uuid = x.Gasto.Uuid.ToString(),
                    IdProyecto = x.Gasto.IdProyecto,
                    IdItem = x.Gasto.IdItem,
                    CategoriaItem = x.Item.Categoria,
                    PartidaItem = x.Item.IdPartida,
                    DetalleItem = x.Item.Detalle,
                    Monto = x.Gasto.Monto,
                    FechaGasto = x.Gasto.FechaGasto.ToString("yyyy-MM-dd"),
                    NumeroFactura = x.Gasto.NumeroFactura,
                    RucProveedor = x.Gasto.RucProveedor,
                    ResponsableNombre = x.Gasto.ResponsableNombre,
                    Descripcion = x.Gasto.Descripcion,
                    IdEvidencia = x.Gasto.IdEvidencia
                }).ToList();

            var financiamientosDto = project.InvFinanciamientos.Select(f => new FinanciamientoItemDto
            {
                IdFinanciamiento = f.IdFinanciamiento,
                IdProyecto = f.IdProyecto,
                EsIstpet = f.EsIstpet,
                NombreEmpresa = f.NombreEmpresa,
                OtrasFuentes = f.OtrasFuentes,
                Monto = f.Monto
            }).ToList();

            decimal totalPlanificado = itemsDto.Sum(i => i.ValorTotal);
            decimal totalEjecutadoGlobal = gastosDto.Sum(g => g.Monto);
            decimal saldoDisponibleGlobal = Math.Max(0, totalPlanificado - totalEjecutadoGlobal);
            decimal porcentajeEjecucionGlobal = totalPlanificado > 0 
                ? Math.Round((totalEjecutadoGlobal / totalPlanificado) * 100, 2) 
                : 0;

            string semaforo = "ROJO";
            if (porcentajeEjecucionGlobal >= 70) semaforo = "VERDE";
            else if (porcentajeEjecucionGlobal >= 40) semaforo = "AMARILLO";

            decimal totalCapital = itemsDto.Where(i => i.EsGastoCapital).Sum(i => i.ValorTotal);
            decimal totalCorriente = itemsDto.Where(i => !i.EsGastoCapital).Sum(i => i.ValorTotal);

            var resumen = new PresupuestoResumenDto
            {
                PresupuestoTotalPlanificado = totalPlanificado,
                PresupuestoTotalEjecutado = totalEjecutadoGlobal,
                SaldoDisponible = saldoDisponibleGlobal,
                PorcentajeEjecucion = porcentajeEjecucionGlobal,
                SemaforoCaces = semaforo,
                TotalItems = itemsDto.Count,
                TotalGastos = gastosDto.Count,
                TotalGastoCapital = totalCapital,
                TotalGastoCorriente = totalCorriente,
                PuedeEditarPlanificacion = puedeEditarPlanificacion,
                PuedeRegistrarGastos = puedeRegistrarGastos,
                EstadoProyecto = project.Estado,
                Items = itemsDto,
                Gastos = gastosDto,
                Financiamientos = financiamientosDto
            };

            return new ExpenseOperationResult<PresupuestoResumenDto>
            {
                Success = true,
                StatusCode = 200,
                Data = resumen
            };
        }

        public async Task<ExpenseOperationResult<PresupuestoItemDto>> GuardarPresupuestoItemAsync(
            string projectUuid,
            GuardarPresupuestoItemRequest request,
            ClaimsPrincipal user)
        {
            if (request == null)
            {
                return new ExpenseOperationResult<PresupuestoItemDto> { Success = false, StatusCode = 400, Message = "Petición nula." };
            }

            if (string.IsNullOrWhiteSpace(request.Detalle) || request.ValorUnitario < 0 || request.Cantidad <= 0)
            {
                return new ExpenseOperationResult<PresupuestoItemDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "El detalle, una cantidad positiva y un valor unitario no negativo son obligatorios."
                };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<PresupuestoItemDto> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<PresupuestoItemDto> { Success = false, StatusCode = 403, Message = "No tienes permisos para modificar el presupuesto de este proyecto." };
            }

            InvPresupuestoItem item;
            decimal nuevoValorTotal = Math.Round(request.Cantidad * request.ValorUnitario, 2);

            if (request.IdItem.HasValue && request.IdItem.Value > 0)
            {
                item = await _context.InvPresupuestoItems
                    .Include(i => i.InvGastos)
                    .FirstOrDefaultAsync(i => i.IdItem == request.IdItem.Value && i.IdProyecto == project.IdProyecto);

                if (item == null)
                {
                    return new ExpenseOperationResult<PresupuestoItemDto> { Success = false, StatusCode = 404, Message = "Partida presupuestaria no encontrada." };
                }

                decimal ejecutadoActual = item.InvGastos.Sum(g => g.Monto);
                if (nuevoValorTotal < ejecutadoActual)
                {
                    return new ExpenseOperationResult<PresupuestoItemDto>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = $"No se puede reducir el valor de la partida a ${nuevoValorTotal:N2} porque ya cuenta con egresos ejecutados por ${ejecutadoActual:N2}."
                    };
                }

                item.Categoria = string.IsNullOrWhiteSpace(request.Categoria) ? "Otros" : request.Categoria.Trim();
                item.IdPartida = string.IsNullOrWhiteSpace(request.IdPartida) ? null : request.IdPartida.Trim();
                item.Detalle = request.Detalle.Trim();
                item.Cantidad = request.Cantidad;
                item.ValorUnitario = request.ValorUnitario;
                item.ValorTotal = nuevoValorTotal;
                item.EsGastoCapital = request.EsGastoCapital;
            }
            else
            {
                item = new InvPresupuestoItem
                {
                    IdProyecto = project.IdProyecto,
                    Categoria = string.IsNullOrWhiteSpace(request.Categoria) ? "Otros" : request.Categoria.Trim(),
                    IdPartida = string.IsNullOrWhiteSpace(request.IdPartida) ? null : request.IdPartida.Trim(),
                    Detalle = request.Detalle.Trim(),
                    Cantidad = request.Cantidad,
                    ValorUnitario = request.ValorUnitario,
                    ValorTotal = nuevoValorTotal,
                    EsGastoCapital = request.EsGastoCapital
                };
                _context.InvPresupuestoItems.Add(item);
            }

            await _context.SaveChangesAsync();

            // Recalcular presupuesto estimado en inv_proyectos
            var totalPlanificado = await _context.InvPresupuestoItems
                .Where(i => i.IdProyecto == project.IdProyecto)
                .SumAsync(i => i.ValorTotal);
            project.PresupuestoEstimado = totalPlanificado;
            await _context.SaveChangesAsync();

            decimal totalEjec = await _context.InvGastos.Where(g => g.IdItem == item.IdItem).SumAsync(g => (decimal?)g.Monto) ?? 0;
            decimal saldo = Math.Max(0, item.ValorTotal - totalEjec);
            decimal pct = item.ValorTotal > 0 ? Math.Round((totalEjec / item.ValorTotal) * 100, 2) : 0;

            var dto = new PresupuestoItemDto
            {
                IdItem = item.IdItem,
                IdProyecto = item.IdProyecto,
                Categoria = item.Categoria,
                IdPartida = item.IdPartida,
                Detalle = item.Detalle,
                Cantidad = item.Cantidad,
                ValorUnitario = item.ValorUnitario,
                ValorTotal = item.ValorTotal,
                EsGastoCapital = item.EsGastoCapital,
                TotalEjecutado = totalEjec,
                SaldoDisponible = saldo,
                PorcentajeEjecucion = pct,
                CantidadFacturas = await _context.InvGastos.CountAsync(g => g.IdItem == item.IdItem)
            };

            return new ExpenseOperationResult<PresupuestoItemDto>
            {
                Success = true,
                StatusCode = 200,
                Data = dto
            };
        }

        public async Task<ExpenseOperationResult<bool>> EliminarPresupuestoItemAsync(
            string projectUuid,
            int itemId,
            ClaimsPrincipal user)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 403, Message = "No tienes permisos para eliminar partidas presupuestarias." };
            }

            var item = await _context.InvPresupuestoItems
                .Include(i => i.InvGastos)
                .FirstOrDefaultAsync(i => i.IdItem == itemId && i.IdProyecto == project.IdProyecto);

            if (item == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Partida no encontrada." };
            }

            if (item.InvGastos != null && item.InvGastos.Any())
            {
                return new ExpenseOperationResult<bool>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"No es posible eliminar la partida '{item.Detalle}' porque tiene {item.InvGastos.Count} factura(s) registrada(s). Debe anular o eliminar los egresos asociados primero."
                };
            }

            _context.InvPresupuestoItems.Remove(item);
            await _context.SaveChangesAsync();

            var totalPlanificado = await _context.InvPresupuestoItems
                .Where(i => i.IdProyecto == project.IdProyecto)
                .SumAsync(i => (decimal?)i.ValorTotal) ?? 0;
            project.PresupuestoEstimado = totalPlanificado;
            await _context.SaveChangesAsync();

            return new ExpenseOperationResult<bool> { Success = true, StatusCode = 200, Data = true };
        }

        public async Task<ExpenseOperationResult<GastoDetalleDto>> RegistrarGastoAsync(
            string projectUuid,
            RegistrarGastoRequest request,
            ClaimsPrincipal user)
        {
            if (request == null)
            {
                return new ExpenseOperationResult<GastoDetalleDto> { Success = false, StatusCode = 400, Message = "Petición nula." };
            }

            if (request.Monto <= 0)
            {
                return new ExpenseOperationResult<GastoDetalleDto> { Success = false, StatusCode = 400, Message = "El monto del gasto debe ser mayor a 0." };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<GastoDetalleDto> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserManageExpensesAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<GastoDetalleDto> { Success = false, StatusCode = 403, Message = "No tienes permisos para registrar egresos en este proyecto." };
            }

            var estadosEgresos = await ObtenerEstadosPermitidosEgresosAsync();
            if (!estadosEgresos.Contains(project.Estado) && !await IsSuperAdminAsync(user, userIdRef))
            {
                return new ExpenseOperationResult<GastoDetalleDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"Solo se pueden registrar egresos en estados autorizados. Estado actual: '{project.Estado}'. Estados permitidos: {string.Join(", ", estadosEgresos)}."
                };
            }

            // Localizar el ítem de presupuesto
            InvPresupuestoItem? item = null;
            if (request.IdItem > 0)
            {
                item = await _context.InvPresupuestoItems.FirstOrDefaultAsync(i => i.IdItem == request.IdItem && i.IdProyecto == project.IdProyecto);
            }
            else if (!string.IsNullOrWhiteSpace(request.Partida))
            {
                item = await _context.InvPresupuestoItems.FirstOrDefaultAsync(i => i.IdProyecto == project.IdProyecto && i.IdPartida == request.Partida);
            }

            if (item == null)
            {
                return new ExpenseOperationResult<GastoDetalleDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "Debe asociar el comprobante a una partida presupuestaria planificada existente."
                };
            }

            // CONTROL ANTI-SOBREGIRO
            var gastosActualesPartida = await _context.InvGastos
                .Where(g => g.IdItem == item.IdItem)
                .SumAsync(g => (decimal?)g.Monto) ?? 0;

            decimal saldoDisponible = item.ValorTotal - gastosActualesPartida;
            if (request.Monto > saldoDisponible)
            {
                return new ExpenseOperationResult<GastoDetalleDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"Control Anti-Sobregiro: El monto de ${request.Monto:N2} excede el saldo disponible de ${saldoDisponible:N2} en la partida '{item.Detalle}' ({item.Categoria})."
                };
            }

            DateOnly fechaGasto = DateOnly.FromDateTime(DateTime.UtcNow);
            var fechaStr = !string.IsNullOrEmpty(request.FechaGasto) ? request.FechaGasto : request.Fecha;
            if (!string.IsNullOrEmpty(fechaStr) && DateOnly.TryParse(fechaStr, out var parsedDate))
            {
                fechaGasto = parsedDate;
            }

            var numFactura = !string.IsNullOrEmpty(request.NumeroFactura) ? request.NumeroFactura : request.ReferenciaFactura;
            var gasto = new InvGasto
            {
                Uuid = Guid.NewGuid(),
                IdProyecto = project.IdProyecto,
                IdItem = item.IdItem,
                Monto = request.Monto,
                FechaGasto = fechaGasto,
                NumeroFactura = numFactura,
                RucProveedor = request.RucProveedor,
                ResponsableNombre = request.ResponsableNombre,
                Descripcion = request.Descripcion,
                IdEvidencia = request.IdEvidencia
            };

            _context.InvGastos.Add(gasto);

            // Actualizar total ejecutado en inv_proyectos
            var nuevoTotalEjecutado = (project.ValorEjecucion ?? 0) + request.Monto;
            project.ValorEjecucion = nuevoTotalEjecutado;

            await _context.SaveChangesAsync();

            var dto = new GastoDetalleDto
            {
                IdGasto = gasto.IdGasto,
                Uuid = gasto.Uuid.ToString(),
                IdProyecto = gasto.IdProyecto,
                IdItem = gasto.IdItem,
                CategoriaItem = item.Categoria,
                PartidaItem = item.IdPartida,
                DetalleItem = item.Detalle,
                Monto = gasto.Monto,
                FechaGasto = gasto.FechaGasto.ToString("yyyy-MM-dd"),
                NumeroFactura = gasto.NumeroFactura,
                RucProveedor = gasto.RucProveedor,
                ResponsableNombre = gasto.ResponsableNombre,
                Descripcion = gasto.Descripcion,
                IdEvidencia = gasto.IdEvidencia
            };

            return new ExpenseOperationResult<GastoDetalleDto>
            {
                Success = true,
                StatusCode = 201,
                Data = dto
            };
        }

        public async Task<ExpenseOperationResult<bool>> EliminarGastoAsync(
            string projectUuid,
            string gastoUuid,
            ClaimsPrincipal user)
        {
            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserManageExpensesAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 403, Message = "No tienes permisos para anular o eliminar gastos en este proyecto." };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            if (!Guid.TryParse(gastoUuid, out var parsedGastoUuid))
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 400, Message = "UUID de gasto inválido." };
            }

            var gasto = await _context.InvGastos
                .FirstOrDefaultAsync(g => g.Uuid == parsedGastoUuid && g.IdProyecto == project.IdProyecto);

            if (gasto == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Registro de gasto no encontrado." };
            }

            _context.InvGastos.Remove(gasto);
            project.ValorEjecucion = Math.Max(0, (project.ValorEjecucion ?? 0) - gasto.Monto);

            await _context.SaveChangesAsync();

            return new ExpenseOperationResult<bool> { Success = true, StatusCode = 200, Data = true };
        }

        public async Task<ExpenseOperationResult<FinanciamientoItemDto>> GuardarFinanciamientoAsync(
            string projectUuid,
            GuardarFinanciamientoRequest request,
            ClaimsPrincipal user)
        {
            if (request == null)
            {
                return new ExpenseOperationResult<FinanciamientoItemDto> { Success = false, StatusCode = 400, Message = "Petición nula." };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<FinanciamientoItemDto> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<FinanciamientoItemDto> { Success = false, StatusCode = 403, Message = "No tienes permisos para modificar el financiamiento." };
            }

            InvFinanciamiento financiamiento;
            if (request.IdFinanciamiento.HasValue && request.IdFinanciamiento.Value > 0)
            {
                financiamiento = await _context.InvFinanciamientos
                    .FirstOrDefaultAsync(f => f.IdFinanciamiento == request.IdFinanciamiento.Value && f.IdProyecto == project.IdProyecto);

                if (financiamiento == null)
                {
                    return new ExpenseOperationResult<FinanciamientoItemDto> { Success = false, StatusCode = 404, Message = "Registro de financiamiento no encontrado." };
                }

                financiamiento.EsIstpet = request.EsIstpet;
                financiamiento.NombreEmpresa = request.NombreEmpresa;
                financiamiento.OtrasFuentes = request.OtrasFuentes;
                financiamiento.Monto = request.Monto;
            }
            else
            {
                financiamiento = new InvFinanciamiento
                {
                    IdProyecto = project.IdProyecto,
                    EsIstpet = request.EsIstpet,
                    NombreEmpresa = request.NombreEmpresa,
                    OtrasFuentes = request.OtrasFuentes,
                    Monto = request.Monto
                };
                _context.InvFinanciamientos.Add(financiamiento);
            }

            await _context.SaveChangesAsync();

            var dto = new FinanciamientoItemDto
            {
                IdFinanciamiento = financiamiento.IdFinanciamiento,
                IdProyecto = financiamiento.IdProyecto,
                EsIstpet = financiamiento.EsIstpet,
                NombreEmpresa = financiamiento.NombreEmpresa,
                OtrasFuentes = financiamiento.OtrasFuentes,
                Monto = financiamiento.Monto
            };

            return new ExpenseOperationResult<FinanciamientoItemDto> { Success = true, StatusCode = 200, Data = dto };
        }

        public async Task<ExpenseOperationResult<bool>> EliminarFinanciamientoAsync(
            string projectUuid,
            int financiamientoId,
            ClaimsPrincipal user)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 403, Message = "No tienes permisos para modificar el financiamiento." };
            }

            var f = await _context.InvFinanciamientos
                .FirstOrDefaultAsync(fin => fin.IdFinanciamiento == financiamientoId && fin.IdProyecto == project.IdProyecto);

            if (f == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Registro no encontrado." };
            }

            _context.InvFinanciamientos.Remove(f);
            await _context.SaveChangesAsync();

            return new ExpenseOperationResult<bool> { Success = true, StatusCode = 200, Data = true };
        }

        public async Task<ExpenseOperationResult<LiquidacionFinancieraDto>> ObtenerLiquidacionFinancieraAsync(
            string projectUuid,
            ClaimsPrincipal user)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .Include(p => p.InvPresupuestoItems)
                    .ThenInclude(i => i.InvGastos)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<LiquidacionFinancieraDto> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            decimal totalPlanificado = project.InvPresupuestoItems.Sum(i => i.ValorTotal);
            decimal totalEjecutado = project.InvPresupuestoItems.SelectMany(i => i.InvGastos).Sum(g => g.Monto);
            decimal desviacion = totalEjecutado - totalPlanificado;
            decimal remanente = Math.Max(0, totalPlanificado - totalEjecutado);
            decimal pctGlobal = totalPlanificado > 0 ? Math.Round((totalEjecutado / totalPlanificado) * 100, 2) : 0;

            string semaforo = "ROJO";
            if (pctGlobal >= 70) semaforo = "VERDE";
            else if (pctGlobal >= 40) semaforo = "AMARILLO";

            string criterio = pctGlobal >= 70 
                ? "CUMPLE SATISFACTORIAMENTE: Nivel óptimo de ejecución presupuestaria para auditoría CACES."
                : (pctGlobal >= 40 
                    ? "CUMPLIMIENTO PARCIAL: Ejecución presupuestaria media. Se requiere justificar saldos en informe final."
                    : "ALERTA DE SUBEJECUCIÓN: Menos del 40% del presupuesto ejecutado. Riesgo de observación institucional.");

            var desglose = project.InvPresupuestoItems.Select(i =>
            {
                decimal ejec = i.InvGastos.Sum(g => g.Monto);
                return new PartidaLiquidacionDto
                {
                    Categoria = i.Categoria,
                    IdPartida = i.IdPartida,
                    Detalle = i.Detalle,
                    Planificado = i.ValorTotal,
                    Ejecutado = ejec,
                    SaldoRemanente = Math.Max(0, i.ValorTotal - ejec),
                    PorcentajeCumplimiento = i.ValorTotal > 0 ? Math.Round((ejec / i.ValorTotal) * 100, 2) : 0
                };
            }).ToList();

            var activos = project.InvPresupuestoItems
                .Where(i => i.EsGastoCapital || i.Categoria.ToLower().Contains("equipo") || i.Categoria.ToLower().Contains("bienes"))
                .Select(i =>
                {
                    var primerGasto = i.InvGastos.OrderBy(g => g.FechaGasto).FirstOrDefault();
                    return new ActivoFijoInventariableDto
                    {
                        IdItem = i.IdItem,
                        Detalle = i.Detalle,
                        Categoria = i.Categoria,
                        Cantidad = i.Cantidad,
                        ValorUnitario = i.ValorUnitario,
                        ValorTotal = i.ValorTotal,
                        NumeroFactura = primerGasto?.NumeroFactura,
                        RucProveedor = primerGasto?.RucProveedor,
                        FechaAdquisicion = primerGasto?.FechaGasto.ToString("yyyy-MM-dd"),
                        EstadoCustodia = "Bienes verificables para Acta Entrega-Recepción ISTPET"
                    };
                }).ToList();

            var liquidacion = new LiquidacionFinancieraDto
            {
                PresupuestoPlanificado = totalPlanificado,
                PresupuestoEjecutado = totalEjecutado,
                DesviacionMonetaria = desviacion,
                RemanenteNoEjecutado = remanente,
                PorcentajeEjecucionGlobal = pctGlobal,
                SemaforoCaces = semaforo,
                CriterioAuditoria = criterio,
                ActivosInventariables = activos,
                DesglosePorPartida = desglose
            };

            return new ExpenseOperationResult<LiquidacionFinancieraDto>
            {
                Success = true,
                StatusCode = 200,
                Data = liquidacion
            };
        }

        private async Task<List<string>> ObtenerEstadosPermitidosEgresosAsync()
        {
            var estados = await _context.InvConfigWorkflows
                .Where(w => w.Activo && w.PermiteRegistroEgresos)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();

            if (estados == null || !estados.Any())
            {
                estados = new List<string> { "En Ejecución" };
            }

            return estados;
        }

        private async Task<bool> IsSuperAdminAsync(ClaimsPrincipal user, string? userIdRef)
        {
            if (user?.Identity == null || !user.Identity.IsAuthenticated) return false;

            var roles = user.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .Union(user.FindAll("roles").Select(c => c.Value))
                .Union(user.FindAll("role").Select(c => c.Value))
                .Distinct()
                .ToList();

            if (roles.Contains("DIITRA_SUPER_ADMIN") ||
                user.FindFirst("es_super_admin")?.Value == "true" ||
                user.FindFirst("es_superadmin")?.Value == "true")
            {
                return true;
            }

            if (!string.IsNullOrEmpty(userIdRef))
            {
                return await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            }

            return false;
        }

        private async Task<bool> CanUserEditProjectAsync(string uuid, string? userIdRef, ClaimsPrincipal user)
        {
            if (await IsSuperAdminAsync(user, userIdRef)) return true;
            if (string.IsNullOrEmpty(userIdRef)) return false;

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project != null && (project.Estado == "Borrador" || project.Estado == "En Corrección" ||
                                    project.Estado == "Prepropuesta" || project.Estado == "Prepropuesta Rechazada" ||
                                    project.Estado == "En Ejecución"))
            {
                return await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef) || 
                       await IsProjectMemberAsync(project.IdProyecto, userIdRef);
            }

            return false;
        }

        private async Task<bool> CanUserManageExpensesAsync(string uuid, string? userIdRef, ClaimsPrincipal user)
        {
            if (await IsSuperAdminAsync(user, userIdRef)) return true;
            if (string.IsNullOrEmpty(userIdRef)) return false;

            var isDirector = await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);
            if (isDirector) return true;

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project != null)
            {
                return await IsProjectMemberAsync(project.IdProyecto, userIdRef);
            }

            return false;
        }

        private async Task<bool> IsProjectMemberAsync(int idProyecto, string userIdRef)
        {
            if (int.TryParse(userIdRef, out int idUserInt))
            {
                return await _context.InvProyectoParticipantes
                    .AnyAsync(p => p.IdProyecto == idProyecto && p.IdUsuario == idUserInt);
            }
            return false;
        }
    }
}
