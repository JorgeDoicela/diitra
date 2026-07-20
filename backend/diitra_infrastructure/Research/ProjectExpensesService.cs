using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public class ProjectExpensesService : IProjectExpensesService
    {
        private readonly DiitraContext _context;
        private readonly IProjectOrchestrator _projectOrchestrator;

        public ProjectExpensesService(
            DiitraContext context,
            IProjectOrchestrator projectOrchestrator)
        {
            _context = context;
            _projectOrchestrator = projectOrchestrator;
        }

        public async Task<ExpenseOperationResult<GastoDto>> RegistrarGastoAsync(
            string projectUuid,
            RegistrarGastoRequest request,
            ClaimsPrincipal user)
        {
            if (request == null)
            {
                return new ExpenseOperationResult<GastoDto> { Success = false, StatusCode = 400, Message = "Petición nula." };
            }

            if (string.IsNullOrEmpty(request.Descripcion) || request.Monto <= 0)
            {
                return new ExpenseOperationResult<GastoDto> { Success = false, StatusCode = 400, Message = "La descripción y un monto mayor a cero son obligatorios." };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef))
            {
                return new ExpenseOperationResult<GastoDto> { Success = false, StatusCode = 401, Message = "No autorizado." };
            }

            if (!await CanUserManageProjectAsync(projectUuid, userIdRef))
            {
                return new ExpenseOperationResult<GastoDto> { Success = false, StatusCode = 403, Message = "No tienes permisos para registrar gastos en este proyecto de investigación." };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<GastoDto> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var estadosEgresos = await _context.InvConfigWorkflows
                .Where(w => w.Activo && w.PermiteRegistroEgresos)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();

            if (estadosEgresos == null || !estadosEgresos.Any())
            {
                estadosEgresos = new List<string> { "En Ejecución" };
            }

            if (!estadosEgresos.Contains(project.Estado))
            {
                return new ExpenseOperationResult<GastoDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"Solo se pueden registrar egresos cuando el proyecto está en un estado activo de ejecución. Estado actual: '{project.Estado}'. Estados permitidos: {string.Join(", ", estadosEgresos)}."
                };
            }

            var item = await _context.InvPresupuestoItems
                .FirstOrDefaultAsync(i => i.IdProyecto == project.IdProyecto && i.IdPartida == request.Partida);

            if (item == null)
            {
                item = new InvPresupuestoItem
                {
                    IdProyecto = project.IdProyecto,
                    Categoria = string.IsNullOrEmpty(request.Categoria) ? "Otros" : request.Categoria,
                    IdPartida = string.IsNullOrEmpty(request.Partida) ? "GEN-999" : request.Partida,
                    Detalle = request.Descripcion,
                    Cantidad = 1,
                    ValorUnitario = request.Monto,
                    ValorTotal = request.Monto,
                    EsGastoCapital = false
                };
                _context.InvPresupuestoItems.Add(item);
                await _context.SaveChangesAsync();
            }

            DateOnly fechaGasto = DateOnly.FromDateTime(DateTime.UtcNow);
            if (!string.IsNullOrEmpty(request.Fecha) && DateOnly.TryParse(request.Fecha, out var parsedDate))
            {
                fechaGasto = parsedDate;
            }

            var gasto = new InvGasto
            {
                Uuid = Guid.NewGuid(),
                IdProyecto = project.IdProyecto,
                IdItem = item.IdItem,
                Monto = request.Monto,
                FechaGasto = fechaGasto,
                NumeroFactura = request.ReferenciaFactura,
                Descripcion = request.Descripcion
            };

            _context.InvGastos.Add(gasto);
            project.ValorEjecucion = (project.ValorEjecucion ?? 0) + request.Monto;

            await _context.SaveChangesAsync();

            var dto = new GastoDto
            {
                Id = gasto.Uuid.ToString(),
                Descripcion = gasto.Descripcion,
                Partida = item.IdPartida,
                Monto = gasto.Monto,
                Fecha = gasto.FechaGasto.ToString("yyyy-MM-dd"),
                ReferenciaFactura = gasto.NumeroFactura,
                Categoria = item.Categoria
            };

            return new ExpenseOperationResult<GastoDto>
            {
                Success = true,
                Data = dto
            };
        }

        public async Task<ExpenseOperationResult<bool>> EliminarGastoAsync(
            string projectUuid,
            string gastoUuid,
            ClaimsPrincipal user)
        {
            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef))
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 401, Message = "No autorizado." };
            }

            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            var isProjectDirector = await _projectOrchestrator.IsProjectDirectorAsync(projectUuid, userIdRef);

            if (!isSystemAdmin && !isProjectDirector)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 403, Message = "No tienes permisos para eliminar gastos de este proyecto de investigación." };
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null)
            {
                return new ExpenseOperationResult<bool> { Success = false, StatusCode = 404, Message = "Proyecto no encontrado." };
            }

            var estadosEgresos = await _context.InvConfigWorkflows
                .Where(w => w.Activo && w.PermiteRegistroEgresos)
                .Select(w => w.EstadoDestino)
                .Distinct()
                .ToListAsync();

            if (estadosEgresos == null || !estadosEgresos.Any())
            {
                estadosEgresos = new List<string> { "En Ejecución" };
            }

            if (!estadosEgresos.Contains(project.Estado))
            {
                return new ExpenseOperationResult<bool>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = $"Solo se pueden modificar egresos cuando el proyecto está en un estado activo de ejecución. Estado actual: '{project.Estado}'. Estados permitidos: {string.Join(", ", estadosEgresos)}."
                };
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

            return new ExpenseOperationResult<bool> { Success = true, Data = true };
        }

        private async Task<bool> CanUserManageProjectAsync(string uuid, string userIdRef)
        {
            if (await _projectOrchestrator.IsSystemAdminAsync(userIdRef)) return true;

            var project = await _projectOrchestrator.GetProjectDetailAsync(uuid);
            if (project != null && (project.Estado == "Borrador" || project.Estado == "En Corrección" ||
                                    project.Estado == "Prepropuesta" || project.Estado == "Prepropuesta Rechazada" ||
                                    project.Estado == "En Ejecución"))
            {
                return await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef);
            }

            return false;
        }
    }
}
