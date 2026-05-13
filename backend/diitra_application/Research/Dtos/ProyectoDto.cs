using System.Collections.Generic;

namespace Diitra.Application.Research.Dtos
{
    public class ProyectoDto
    {
        // ── Identificación básica ──
        public string? Uuid { get; set; }
        public string? Estado { get; set; }
        public string? CodigoInstitucional { get; set; }
        public int? IdConvocatoria { get; set; }
        public int? IdObjetivoPnd { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 1: IDENTIFICACIÓN DEL PROYECTO (Formato oficial SENESCYT/ISTPET)
        // ─────────────────────────────────────────────────────────────────────────
        public string? Titulo { get; set; }
        public string? Programa { get; set; }
        public string? GrupoInvestigacion { get; set; }
        public bool? TieneGrupoInvestigacion { get; set; } // Opcional para pruebas
        public string? Dominio { get; set; }
        public string? LineaInvestigacion { get; set; }
        public string? SublineaInvestigacion { get; set; }

        public string? TipoInvestigacion { get; set; }
        public string? CampoAmplio { get; set; }
        public string? CampoEspecifico { get; set; }
        public string? CampoDetallado { get; set; }
        public string? Carrera { get; set; }
        public string? PeriodoConvocatoria { get; set; }
        public string? TiempoEjecucion { get; set; }
        public string? DirectorProyecto { get; set; }
        public string? FechaPresentacion { get; set; }
        public string? FechaInicioEstimada { get; set; }
        public string? FechaFinEstimada { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 2: INVESTIGADORES
        // ─────────────────────────────────────────────────────────────────────────
        public List<InvestigadorDto>? Investigadores { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 3: ESPECIFICACIÓN
        // ─────────────────────────────────────────────────────────────────────────
        public string? Antecedentes { get; set; }
        public string? DescripcionProyecto { get; set; }
        public string? Justificacion { get; set; }
        public string? ObjetivoGeneral { get; set; }
        public List<string>? ObjetivosEspecificos { get; set; }
        public string? Ods { get; set; }
        public string? MarcoTeorico { get; set; }
        public string? Metodologia { get; set; }
        public string? Evaluacion { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 4: RECURSOS, COSTO Y FINANCIAMIENTO
        // ─────────────────────────────────────────────────────────────────────────
        public List<RecursoDisponibleDto>? RecursosDisponibles { get; set; }
        public List<RecursoNecesarioDto>? RecursosNecesarios { get; set; }
        public decimal? CostoTotal { get; set; } // ⚠ TODO: PRODUCTION-LOCK (Volver a decimal no-nulo)

        public string? FuenteFinanciamiento { get; set; }
        public string? NombreOtraFuente { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 5: PRODUCTOS ESPERADOS
        // ─────────────────────────────────────────────────────────────────────────
        public List<ProductoEsperadoDto>? ProductosEsperados { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 6: IMPACTO DEL PROYECTO
        // ─────────────────────────────────────────────────────────────────────────
        public ImpactoProyectoDto? Impacto { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 7: CRONOGRAMA
        // ─────────────────────────────────────────────────────────────────────────
        public List<ActividadCronogramaDto>? Cronograma { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 8: BIBLIOGRAFÍA
        // ─────────────────────────────────────────────────────────────────────────
        public List<string>? Bibliografia { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 9: FIRMAS
        // ─────────────────────────────────────────────────────────────────────────
        public string? NombreDirectorFirma { get; set; }
        public string? CargoDirectorFirma { get; set; }
        public string? NombreCoordinadorFirma { get; set; }
        public string? CargoCoordinadorFirma { get; set; }

        // --- Extensiones Core Enterprise ---
        public string? IdDspaceHandle { get; set; }
        public string? MetadataCacesJson { get; set; }

        // --- Compliance Enterprise ---
        public List<MmlRowDto>? MatrizMarcoLogico { get; set; }
        public List<DocumentoAdjuntoDto>? DocumentosAdjuntos { get; set; }
    }

    public class MmlRowDto
    {
        public string? Nivel { get; set; }
        public string? Resumen { get; set; }
        public string? Indicadores { get; set; }
        public string? Medios { get; set; }
        public string? Supuestos { get; set; }
    }

    public class DocumentoAdjuntoDto
    {
        public string? Uuid { get; set; }
        public int? IdDocReq { get; set; }
        public string? NombreArchivo { get; set; }
        public string? RutaArchivo { get; set; }
    }

    public class InvestigadorDto
    {
        public string? Nombre { get; set; }
        public string? Cedula { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? NivelAcademico { get; set; }
        public string? Rol { get; set; }
    }

    public class RecursoDisponibleDto
    {
        public string? Descripcion { get; set; }
        public string? Cantidad { get; set; }
        public string? Fuente { get; set; }
    }

    public class RecursoNecesarioDto
    {
        public string? Descripcion { get; set; }
        public string? Cantidad { get; set; }
        public decimal? CostoUnitario { get; set; } // ⚠ TODO: PRODUCTION-LOCK
        public decimal? CostoTotal { get; set; }    // ⚠ TODO: PRODUCTION-LOCK
        public string? IdPartida { get; set; }
        public bool? EsGastoCapital { get; set; }
    }

    public class ProductoEsperadoDto
    {
        public string? Tipo { get; set; }
        public string? Cantidad { get; set; }
    }

    public class ImpactoProyectoDto
    {
        public string? Social { get; set; }
        public string? Cientifico { get; set; }
        public string? Economico { get; set; }
        public string? Politico { get; set; }
        public string? Ambiental { get; set; }
        public string? Otro { get; set; }
    }

    public class ActividadCronogramaDto
    {
        public string? Objetivo { get; set; }
        public int? Numero { get; set; } // ⚠ TODO: PRODUCTION-LOCK
        public string? Actividad { get; set; }
        public string? RecursosNecesarios { get; set; }
        public decimal? Ponderacion { get; set; } // ⚠ TODO: PRODUCTION-LOCK
        public bool? EsEntregableCaces { get; set; }

        public List<bool>? Semanas { get; set; }
    }
}
