using System;
using System.Collections.Generic;

namespace Diitra.Application.Research.Dtos
{
    public class PresupuestoResumenDto
    {
        public decimal PresupuestoTotalPlanificado { get; set; }
        public decimal PresupuestoTotalEjecutado { get; set; }
        public decimal SaldoDisponible { get; set; }
        public decimal PorcentajeEjecucion { get; set; }
        public string SemaforoCaces { get; set; } = "ROJO"; // VERDE (>=70%), AMARILLO (40-69%), ROJO (<40%)
        public int TotalItems { get; set; }
        public int TotalGastos { get; set; }
        public decimal TotalGastoCapital { get; set; }
        public decimal TotalGastoCorriente { get; set; }
        public bool PuedeEditarPlanificacion { get; set; }
        public bool PuedeRegistrarGastos { get; set; }
        public string EstadoProyecto { get; set; } = string.Empty;

        public List<PresupuestoItemDto> Items { get; set; } = new();
        public List<GastoDetalleDto> Gastos { get; set; } = new();
        public List<FinanciamientoItemDto> Financiamientos { get; set; } = new();
    }

    public class PresupuestoItemDto
    {
        public int IdItem { get; set; }
        public int IdProyecto { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string? IdPartida { get; set; }
        public string Detalle { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal ValorTotal { get; set; }
        public bool EsGastoCapital { get; set; }
        public decimal TotalEjecutado { get; set; }
        public decimal SaldoDisponible { get; set; }
        public decimal PorcentajeEjecucion { get; set; }
        public int CantidadFacturas { get; set; }
    }

    public class GuardarPresupuestoItemRequest
    {
        public int? IdItem { get; set; }
        public string Categoria { get; set; } = "Equipos";
        public string? IdPartida { get; set; }
        public string Detalle { get; set; } = string.Empty;
        public decimal Cantidad { get; set; } = 1;
        public decimal ValorUnitario { get; set; }
        public bool EsGastoCapital { get; set; }
    }

    public class GastoDetalleDto
    {
        public int IdGasto { get; set; }
        public string Uuid { get; set; } = string.Empty;
        public int IdProyecto { get; set; }
        public int IdItem { get; set; }
        public string CategoriaItem { get; set; } = string.Empty;
        public string? PartidaItem { get; set; }
        public string DetalleItem { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string FechaGasto { get; set; } = string.Empty;
        public string? NumeroFactura { get; set; }
        public string? RucProveedor { get; set; }
        public string? ResponsableNombre { get; set; }
        public string? Descripcion { get; set; }
        public int? IdEvidencia { get; set; }
    }

    public class RegistrarGastoRequest
    {
        public int IdItem { get; set; }
        public decimal Monto { get; set; }
        public string? FechaGasto { get; set; }
        public string? NumeroFactura { get; set; }
        public string? RucProveedor { get; set; }
        public string? ResponsableNombre { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public int? IdEvidencia { get; set; }

        // Campos legados para compatibilidad hacia atrás
        public string? Partida { get; set; }
        public string? ReferenciaFactura { get; set; }
        public string? Categoria { get; set; }
        public string? Fecha { get; set; }
    }

    public class FinanciamientoItemDto
    {
        public int IdFinanciamiento { get; set; }
        public int IdProyecto { get; set; }
        public bool? EsIstpet { get; set; }
        public string? NombreEmpresa { get; set; }
        public bool? OtrasFuentes { get; set; }
        public decimal? Monto { get; set; }
    }

    public class GuardarFinanciamientoRequest
    {
        public int? IdFinanciamiento { get; set; }
        public bool? EsIstpet { get; set; } = true;
        public string? NombreEmpresa { get; set; }
        public bool? OtrasFuentes { get; set; } = false;
        public decimal Monto { get; set; }
    }

    public class LiquidacionFinancieraDto
    {
        public decimal PresupuestoPlanificado { get; set; }
        public decimal PresupuestoEjecutado { get; set; }
        public decimal DesviacionMonetaria { get; set; }
        public decimal RemanenteNoEjecutado { get; set; }
        public decimal PorcentajeEjecucionGlobal { get; set; }
        public string SemaforoCaces { get; set; } = "ROJO";
        public string CriterioAuditoria { get; set; } = string.Empty;

        public List<ActivoFijoInventariableDto> ActivosInventariables { get; set; } = new();
        public List<PartidaLiquidacionDto> DesglosePorPartida { get; set; } = new();
    }

    public class ActivoFijoInventariableDto
    {
        public int IdItem { get; set; }
        public string Detalle { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal ValorTotal { get; set; }
        public string? NumeroFactura { get; set; }
        public string? RucProveedor { get; set; }
        public string? FechaAdquisicion { get; set; }
        public string EstadoCustodia { get; set; } = "Entregado a ISTPET";
    }

    public class PartidaLiquidacionDto
    {
        public string Categoria { get; set; } = string.Empty;
        public string? IdPartida { get; set; }
        public string Detalle { get; set; } = string.Empty;
        public decimal Planificado { get; set; }
        public decimal Ejecutado { get; set; }
        public decimal SaldoRemanente { get; set; }
        public decimal PorcentajeCumplimiento { get; set; }
    }
}
