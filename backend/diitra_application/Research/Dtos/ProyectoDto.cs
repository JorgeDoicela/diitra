using System;
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
        public int? IdCarrera { get; set; }
        public int? IdObjetivoPnd { get; set; }

        // --- Núcleo de Innovación y Vinculación 2026 ---
        public int? IdEntidadAliada { get; set; }
        public int? TrlInicial { get; set; } = 1;
        public int? TrlActual { get; set; } = 1;
        public int? TrlMeta { get; set; } = 1;

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 1: IDENTIFICACIÓN DEL PROYECTO (Formato oficial SENESCYT/ISTPET)
        // ─────────────────────────────────────────────────────────────────────────
        public string? Titulo { get; set; }
        public string? Programa { get; set; }
        public string? GrupoInvestigacion { get; set; }
        public string? GrupoInvestigacionUuid { get; set; }
        public bool? TieneGrupoInvestigacion { get; set; } // Opcional para pruebas
        public string? GrupoInvestigacionTipo { get; set; }
        public string? GrupoInvestigacionNombre { get; set; }
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

        public string? Periodo { get; set; }
        public string? FechaInicio { get; set; }
        public string? FechaFin { get; set; }

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
        private List<string>? _objetivosEspecificos;

        [System.Text.Json.Serialization.JsonPropertyName("ObjetivosEspecificos")]
        public System.Text.Json.JsonElement? ObjetivosEspecificosElement { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public List<string>? ObjetivosEspecificos
        {
            get
            {
                if (_objetivosEspecificos != null) return _objetivosEspecificos;
                if (ObjetivosEspecificosElement == null) return null;

                var element = ObjetivosEspecificosElement.Value;
                if (element.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var item in element.EnumerateArray())
                    {
                        list.Add(item.GetString() ?? "");
                    }
                    return list;
                }
                else if (element.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    var str = element.GetString();
                    if (string.IsNullOrWhiteSpace(str)) return new List<string>();
                    return new List<string> { str };
                }
                return null;
            }
            set
            {
                _objetivosEspecificos = value;
            }
        }
        public string? Ods { get; set; }
        public string? MarcoTeorico { get; set; }
        public string? Metodologia { get; set; }
        public string? Evaluacion { get; set; }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 4: RECURSOS, COSTO Y FINANCIAMIENTO
        // ─────────────────────────────────────────────────────────────────────────
        public List<RecursoDisponibleDto>? RecursosDisponibles { get; set; }
        public List<RecursoNecesarioDto>? RecursosNecesarios { get; set; }
        public decimal CostoTotal { get; set; }

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
        private List<string>? _bibliografia;

        [System.Text.Json.Serialization.JsonPropertyName("Bibliografia")]
        public System.Text.Json.JsonElement? BibliografiaElement { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public List<string>? Bibliografia
        {
            get
            {
                if (_bibliografia != null) return _bibliografia;
                if (BibliografiaElement == null) return null;

                var element = BibliografiaElement.Value;
                if (element.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var item in element.EnumerateArray())
                    {
                        list.Add(item.GetString() ?? "");
                    }
                    return list;
                }
                else if (element.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    var str = element.GetString();
                    if (string.IsNullOrWhiteSpace(str)) return new List<string>();
                    return new List<string> { str };
                }
                return null;
            }
            set
            {
                _bibliografia = value;
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // SECCIÓN 9: FIRMAS
        // ─────────────────────────────────────────────────────────────────────────
        public string? NombreDirectorFirma { get; set; }
        public string? CargoDirectorFirma { get; set; }
        public string? NombreCoordinadorFirma { get; set; }
        public string? CargoCoordinadorFirma { get; set; }
        public FirmasResponsabilidadDto? FirmasResponsabilidad { get; set; }

        // --- Extensiones Core ---
        public string? IdDspaceHandle { get; set; }
        public string? MetadataCacesJson { get; set; }
        public bool PuedeEditar { get; set; } = true;
        public bool PuedeSolicitarCambioEquipo { get; set; } = false;
        public bool PuedeFirmar { get; set; } = false;
        public decimal? PuntajeEvaluacion { get; set; }

        // --- Compliance ---
        public List<MmlRowDto>? MatrizMarcoLogico { get; set; }
        public List<DocumentoAdjuntoDto>? DocumentosAdjuntos { get; set; }
        public List<GastoDto>? Gastos { get; set; }

        [System.Text.Json.Serialization.JsonExtensionData]
        public Dictionary<string, object>? ExtensionData { get; set; }
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
        public bool? Activo { get; set; } = true;
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public string? MotivoCambio { get; set; }
        public string? Carrera { get; set; }
        public string? CarrerasDisponibles { get; set; }
        public decimal? HorasSemanales { get; set; }
        public decimal? HorasDisponibles { get; set; }
        public decimal? HorasAsignadas { get; set; }
        public bool? EsDirector { get; set; }
    }

    public class RecursoDisponibleDto
    {
        public string? Descripcion { get; set; }

        [System.Text.Json.Serialization.JsonConverter(typeof(StringOrNumberConverter))]
        public string? Cantidad { get; set; }
        public string? Fuente { get; set; }
    }

    public class RecursoNecesarioDto
    {
        public string? Descripcion { get; set; }

        [System.Text.Json.Serialization.JsonConverter(typeof(StringOrNumberConverter))]
        public string? Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal CostoTotal { get; set; }
        public string? IdPartida { get; set; }
        public bool? EsGastoCapital { get; set; }
    }

    public class ProductoEsperadoDto
    {
        public string? Tipo { get; set; }

        [System.Text.Json.Serialization.JsonConverter(typeof(StringOrNumberConverter))]
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
        public int? IdObjetivo { get; set; }
        public int Numero { get; set; }
        public string? Actividad { get; set; }
        public string? RecursosNecesarios { get; set; }
        public string? Responsable { get; set; }
        public string? Entregable { get; set; }
        public decimal Ponderacion { get; set; }
        public bool? EsEntregableCaces { get; set; }
        public string? FechaInicioPrevista { get; set; }
        public string? FechaFinPrevista { get; set; }

        public List<bool>? Semanas { get; set; }
    }

    /// <summary>
    /// Representa un evento de actividad dentro de un proyecto para el panel lateral del Workspace.
    /// Diseño desacoplado: el frontend elige cómo renderizar basándose en Tipo e Icono,
    /// sin necesidad de cambios en el backend cuando se añadan nuevos tipos de evento.
    /// </summary>
    public class ProyectoActividadDto
    {
        /// <summary>Categoría del evento: 'acceso', 'seccion', 'workflow', 'comentario'</summary>
        public string Tipo { get; set; } = string.Empty;

        /// <summary>Nombre legible del usuario que generó el evento</summary>
        public string NombreUsuario { get; set; } = string.Empty;

        /// <summary>Rol institucional del usuario en el momento del evento</summary>
        public string RolUsuario { get; set; } = string.Empty;

        /// <summary>Descripción humana del evento</summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>Marca temporal del evento</summary>
        public DateTime Fecha { get; set; }

        /// <summary>Código de ícono sugerido: 'edit', 'check', 'eye', 'workflow', 'comment'</summary>
        public string Icono { get; set; } = "edit";
    }

    public class GastoDto
    {
        public string? Id { get; set; }
        public string? Descripcion { get; set; }
        public string? Partida { get; set; }
        public decimal Monto { get; set; }
        public string? Fecha { get; set; }
        public string? ReferenciaFactura { get; set; }
        public string? Categoria { get; set; }
    }

    public class FirmasResponsabilidadDto
    {
        public string? DirectorNombre { get; set; }
        public string? DirectorCargo { get; set; }
        public string? CoordinadorNombre { get; set; }
        public string? CoordinadorCargo { get; set; }
    }

    public class StringOrNumberConverter : System.Text.Json.Serialization.JsonConverter<string>
    {
        public override string? Read(ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
        {
            if (reader.TokenType == System.Text.Json.JsonTokenType.Number)
            {
                using (var doc = System.Text.Json.JsonDocument.ParseValue(ref reader))
                {
                    return doc.RootElement.GetRawText();
                }
            }
            if (reader.TokenType == System.Text.Json.JsonTokenType.Null)
            {
                return null;
            }
            if (reader.TokenType == System.Text.Json.JsonTokenType.True) return "true";
            if (reader.TokenType == System.Text.Json.JsonTokenType.False) return "false";
            return reader.GetString();
        }

        public override void Write(System.Text.Json.Utf8JsonWriter writer, string value, System.Text.Json.JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }
}
