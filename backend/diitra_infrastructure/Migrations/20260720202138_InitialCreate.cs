using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace diitra_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "alumnos",
                columns: table => new
                {
                    idAlumno = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipoDocumento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    apellidoPaterno = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    apellidoMaterno = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    primerNombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    segundoNombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_Nacimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    direccion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    telefono = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    celular = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ciudad_Nacimiento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    provincia_Nacimiento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    foto = table.Column<byte[]>(type: "longblob", nullable: true),
                    sexo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nacionalidad = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idNivel = table.Column<int>(type: "int", nullable: true),
                    idPeriodo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idSeccion = table.Column<int>(type: "int", nullable: true),
                    idModalidad = table.Column<int>(type: "int", nullable: true),
                    idInstitucion = table.Column<int>(type: "int", nullable: true),
                    tituloColegio = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_Inscripcion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    parroquia_nacimiento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre_padre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ocupacion_padre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nacionalidad_padre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre_madre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ocupacion_madre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nacionalidad_madre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    barrio_residencia = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    parroquia_residencia = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ciudad_residencia = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipo_sangre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    user_alumno = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    password = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idDiscapacidad = table.Column<int>(type: "int", nullable: true),
                    idEtnia = table.Column<int>(type: "int", nullable: true),
                    idNacionalidad = table.Column<int>(type: "int", nullable: true),
                    porcentaje_discapacidad = table.Column<int>(type: "int", nullable: true),
                    carnet_conadis = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    email_institucional = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    primerIngreso = table.Column<sbyte>(type: "tinyint", nullable: true),
                    archivofoto = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAlumno);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "alumnos_carreras",
                columns: table => new
                {
                    idAlumno = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idCarrera = table.Column<int>(type: "int", nullable: false),
                    convalidacion = table.Column<sbyte>(type: "tinyint", nullable: true),
                    carrera_convalidada = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    institucion_convalidada = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    creditos_convalidados = table.Column<int>(type: "int", nullable: true),
                    pasantias = table.Column<sbyte>(type: "tinyint", nullable: true),
                    nota_pasantia = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    creditos_pasantia = table.Column<int>(type: "int", nullable: true),
                    trabajo_grado = table.Column<sbyte>(type: "tinyint", nullable: true),
                    nota_documento = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    nota_defensa = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    nota_tesis = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    creditos_titulo = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.idAlumno, x.idCarrera })
                        .Annotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "asignaciones_profesores",
                columns: table => new
                {
                    idAsignacion = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProfesor = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdAsignatura = table.Column<int>(type: "int", nullable: false),
                    idPeriodo = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdModalidad = table.Column<int>(type: "int", nullable: false),
                    IdSeccion = table.Column<int>(type: "int", nullable: false),
                    IdNivel = table.Column<int>(type: "int", nullable: false),
                    Paralelo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    FechaGrabar = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CodigoAsignacion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EntregaActa = table.Column<sbyte>(type: "tinyint", nullable: true),
                    IngresaNotas = table.Column<sbyte>(type: "tinyint", nullable: true),
                    UserAsignaciones = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FechaFin = table.Column<DateOnly>(type: "date", nullable: true),
                    FechaInicial = table.Column<DateOnly>(type: "date", nullable: true),
                    UserActa = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EsActivaAsignacion = table.Column<sbyte>(type: "tinyint", nullable: true),
                    numeroHoras = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    ContabilizarHoraDocente = table.Column<sbyte>(type: "tinyint", nullable: true),
                    HorasPracticoExperimental = table.Column<decimal>(type: "decimal(65,30)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAsignacion);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "asignaturas",
                columns: table => new
                {
                    idAsignatura = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    asignatura = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Anulada = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    codigo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAsignatura);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "campo_amplio_unesco",
                columns: table => new
                {
                    idCampoAmplioUnesco = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoAmplio = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Activo = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCampoAmplioUnesco);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "campo_detallado_unesco",
                columns: table => new
                {
                    idCampoDetalladoUnesco = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdCampospecificoUnesco = table.Column<int>(type: "int", nullable: true),
                    nombreDetallado = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoDetallado = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCampoDetalladoUnesco);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "campo_especifico_unesco",
                columns: table => new
                {
                    idCampospecificoUnesco = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdCampoAmplioUnesco = table.Column<int>(type: "int", nullable: true),
                    nombreEspecifico = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoEspecifico = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Activo = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCampospecificoUnesco);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "cargo_instituto",
                columns: table => new
                {
                    idCargoInstituto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idTipoFuncionario = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    disponibilidad_cargo = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cargo_instituto", x => x.idCargoInstituto);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "carreras",
                columns: table => new
                {
                    idCarrera = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Carrera = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaCreacion = table.Column<DateOnly>(type: "date", nullable: true),
                    activa = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    directorCarrera = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    numero_creditos = table.Column<int>(type: "int", nullable: true),
                    ordenCarrera = table.Column<int>(type: "int", nullable: true),
                    numero_alumnos = table.Column<int>(type: "int", nullable: true),
                    revisaArrastres = table.Column<sbyte>(type: "tinyint", nullable: true),
                    codigo_cases = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    aliasCarrera = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BolsaEmpleo = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    esInstituto = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCarrera);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "cursos",
                columns: table => new
                {
                    idNivel = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idCarrera = table.Column<int>(type: "int", nullable: false),
                    Nivel = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    jerarquia = table.Column<int>(type: "int", nullable: true),
                    orden = table.Column<int>(type: "int", nullable: true),
                    esRecuperacion = table.Column<sbyte>(type: "tinyint", nullable: true),
                    aliasCurso = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idNivel);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "dedicacion",
                columns: table => new
                {
                    idDedicacion = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(90)", maxLength: 90, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDedicacion);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "departamentos",
                columns: table => new
                {
                    iddepartamentos = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre_departamento = table.Column<string>(type: "varchar(90)", maxLength: 90, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Abreviacion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.iddepartamentos);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "discapacidades",
                columns: table => new
                {
                    idDiscapacidad = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    discapacidad = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EsDefecto = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDiscapacidad);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "espacios",
                columns: table => new
                {
                    idEspacio = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    codigo = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipo = table.Column<string>(type: "enum('aula','laboratorio','taller','virtual','aula interactiva')", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    capacidad = table.Column<int>(type: "int(11)", nullable: false),
                    IdCarrera = table.Column<int>(type: "int", nullable: true),
                    Edificio = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Piso = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<sbyte>(type: "tinyint", nullable: false),
                    RequiereReserva = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEspacio);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "etnias",
                columns: table => new
                {
                    idEtnia = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    etnia = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EsIndigena = table.Column<sbyte>(type: "tinyint", nullable: true),
                    NoRegistra = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEtnia);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "fechas_horarios",
                columns: table => new
                {
                    idFecha = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    fecha = table.Column<DateOnly>(type: "date", nullable: true),
                    finsemana = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    dia = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idFecha);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "horas_clases",
                columns: table => new
                {
                    idhora = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSeccion = table.Column<int>(type: "int", nullable: true),
                    IdCarrera = table.Column<int>(type: "int", nullable: true),
                    hora_inicio = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    hora_fin = table.Column<string>(type: "varchar(5)", maxLength: 5, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Minutos = table.Column<int>(type: "int", nullable: true),
                    NumeroHora = table.Column<int>(type: "int", nullable: true),
                    Tipo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idhora);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "instituciones_instituto",
                columns: table => new
                {
                    idInstitucionesInstituto = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ruc = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ubicado = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    representante = table.Column<string>(type: "varchar(90)", maxLength: 90, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cedula_representante = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idInstitucionesInstituto);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_agendas_zonales",
                columns: table => new
                {
                    idAgendaZonal = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAgendaZonal);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_calendario_alertas_enviadas",
                columns: table => new
                {
                    idAlerta = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idEventoCalendario = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    fechaEvento = table.Column<DateOnly>(type: "date", nullable: false),
                    fechaEnvio = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_calendario_alertas_enviadas", x => x.idAlerta);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_calendario_eventos_normativos",
                columns: table => new
                {
                    idEvento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipoEvento = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Normativo")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaFin = table.Column<DateOnly>(type: "date", nullable: true),
                    esTodoElDia = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    recurrenciaAnual = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    recurrenciaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    rolesVisibles = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    moduloOrigen = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    urlAccion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    colorHex = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: true, defaultValue: "#6B7280")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    alertaDias = table.Column<int>(type: "int", nullable: true, defaultValue: 7),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    esPrivado = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    prioridad = table.Column<string>(type: "varchar(15)", maxLength: 15, nullable: false, defaultValue: "Media")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Pendiente")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    creadoPor = table.Column<int>(type: "int", nullable: true),
                    fechaRegistro = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaModificacion = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                    notaDetalle = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ordenBandeja = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_calendario_eventos_normativos", x => x.idEvento);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cat_impactos",
                columns: table => new
                {
                    idCatImpacto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCatImpacto);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cat_tipo_evidencia",
                columns: table => new
                {
                    idTipoEvidencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    extensiones = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValueSql: "'pdf,jpg,png,zip'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTipoEvidencia);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cat_tipo_producto",
                columns: table => new
                {
                    idTipoProducto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    categoria = table.Column<string>(type: "enum('Académico','Tecnológico','Innovación','Transferencia')", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    requiereRegistro = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTipoProducto);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_collaboration_comments",
                columns: table => new
                {
                    idComment = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    instanceUuid = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    userUuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    userName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    content = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    parentId = table.Column<int>(type: "int", nullable: true),
                    creadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idComment);
                    table.ForeignKey(
                        name: "FK_inv_collaboration_comments_inv_collaboration_comments_parent~",
                        column: x => x.parentId,
                        principalTable: "inv_collaboration_comments",
                        principalColumn: "idComment");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_config_general",
                columns: table => new
                {
                    Clave = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Valor = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descripcion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_config_general", x => x.Clave);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_config_indicadores",
                columns: table => new
                {
                    idConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idInstitucion = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'1'"),
                    codigoIndicador = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreIndicador = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipoDato = table.Column<string>(type: "enum('Cantidad','Monto','Booleano','Porcentaje')", nullable: true, defaultValueSql: "'Cantidad'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    valorReferencia = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true),
                    añoNormativa = table.Column<int>(type: "int", nullable: false),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    umbralCumplido = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true),
                    umbralEnProceso = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true),
                    formulaCalculo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    unidadMedida = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cowork_documentos",
                columns: table => new
                {
                    idDocumento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    entidadTipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    entidadUuid = table.Column<string>(type: "varchar(36)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    campoNombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    yjsState = table.Column<byte[]>(type: "longblob", nullable: true),
                    contentHtml = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    contentJson = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    version = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    creadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    actualizadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_cowork_documentos", x => x.idDocumento);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cowork_sesiones",
                columns: table => new
                {
                    idSesion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    documentoUuid = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    usuarioUuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreUsuario = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rolUsuario = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    signalrConId = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    seccionNombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    accion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    conectadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    desconectadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_cowork_sesiones", x => x.idSesion);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cowork_updates",
                columns: table => new
                {
                    idUpdate = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    documentoUuid = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    updateData = table.Column<byte[]>(type: "longblob", nullable: false),
                    creadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_cowork_updates", x => x.idUpdate);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_document_audit",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    traceability_code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    template_code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    template_version = table.Column<int>(type: "int", nullable: false),
                    project_uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    entity_uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    generated_by = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    generated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    was_blind_mode = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    file_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_hash = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    data_snapshot_json = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_document_audit", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_document_templates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    html_content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    version = table.Column<int>(type: "int", nullable: false),
                    category = table.Column<int>(type: "int", nullable: false),
                    requires_lopdp = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    supports_blind_mode = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    requires_traceability = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    requires_signature = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    signature_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "DIITRA")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    custom_css = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    collaborative_fields_json = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_document_templates", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_documentos_firmas",
                columns: table => new
                {
                    idFirma = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    documento_uuid = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    firmante_id = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    firmante_rol = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_firma = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    tipo_firma = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    firma_code = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    hmac_hash = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    doc_hash = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ip_address = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    user_agent = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    firma_metadata = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    archivo_pdf_firmado = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    es_valida = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    revocada_en = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    motivo_revocacion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_documentos_firmas", x => x.idFirma);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_documentos_instancias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    template_code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    template_version = table.Column<int>(type: "int", nullable: false),
                    entity_uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    entity_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Proyecto")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo_instancia = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    created_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    final_pdf_path = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_hash = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    traceability_code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    data_snapshot_json = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_file_purged = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    purged_at = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    purged_by = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_documentos_instancias", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_documentos_secciones_metadata",
                columns: table => new
                {
                    idMetadata = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    instanceUuid = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    sectionName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    lastUserUuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    lastUserName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    actualizadoEn = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idMetadata);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_dominios",
                columns: table => new
                {
                    idDominio = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDominio);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_email_templates",
                columns: table => new
                {
                    idEmailTemplate = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    asunto = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cuerpoHtml = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    fechaCreado = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaActualizado = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEmailTemplate);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_entidades_externas",
                columns: table => new
                {
                    idEntidad = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ruc = table.Column<string>(type: "varchar(13)", maxLength: 13, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    razonSocial = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipo = table.Column<string>(type: "enum('Pública','Privada','ONG','Académica')", nullable: true, defaultValueSql: "'Privada'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    sector = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    contactoNombre = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    contactoEmail = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEntidad);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_ical_tokens",
                columns: table => new
                {
                    idToken = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    token = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    fechaGenerado = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaUltimoUso = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_ical_tokens", x => x.idToken);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_lineas_investigacion",
                columns: table => new
                {
                    idLinea = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoLinea = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreLinea = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idLinea);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_ods_ejes",
                columns: table => new
                {
                    idEje = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEje);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_pnd_objetivos",
                columns: table => new
                {
                    idObjetivoPnd = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idObjetivoPnd);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_programas",
                columns: table => new
                {
                    idPrograma = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idPrograma);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_rubricas",
                columns: table => new
                {
                    idRubrica = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    version = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValueSql: "'1.0'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idRubrica);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_tipos_convocatoria",
                columns: table => new
                {
                    idTipoConvocatoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTipoConvocatoria);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_tipos_investigacion",
                columns: table => new
                {
                    idTipo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idTipoPadre = table.Column<int>(type: "int", nullable: true),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTipo);
                    table.ForeignKey(
                        name: "fk_tipo_padre",
                        column: x => x.idTipoPadre,
                        principalTable: "inv_tipos_investigacion",
                        principalColumn: "idTipo",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_user_signature_profiles",
                columns: table => new
                {
                    idPerfil = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    firma_imagen_b64 = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    iniciales = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cargo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    departamento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    es_configurado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    creado_en = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    actualizado_en = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_user_signature_profiles", x => x.idPerfil);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "matriculas",
                columns: table => new
                {
                    idMatricula = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idAlumno = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idNivel = table.Column<int>(type: "int", nullable: false),
                    idSeccion = table.Column<int>(type: "int", nullable: false),
                    idModalidad = table.Column<int>(type: "int", nullable: false),
                    idPeriodo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaMatricula = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    paralelo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    arrastres = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    folio = table.Column<int>(type: "int", nullable: true),
                    beca_matricula = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    beca_colegiatura = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    retirado = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    fechaRetiro = table.Column<DateOnly>(type: "date", nullable: true),
                    observacion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    convalidacion = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    carrera_convalidada = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    numero_permiso = table.Column<int>(type: "int", nullable: true),
                    user_matricula = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    valida = table.Column<sbyte>(type: "tinyint", nullable: true),
                    esOyente = table.Column<sbyte>(type: "tinyint", nullable: true),
                    documentoFactura = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idMatricula);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "niveles_academicos",
                columns: table => new
                {
                    idNivelAcademico = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idNivelAcademico);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "parametros",
                columns: table => new
                {
                    codigo_institucion = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreInstitucion = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CadenaConexion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreRector = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    archivoFirma = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    archivoSello = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmailSolicitudes = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClaveEmailSolicitudes = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Activo = table.Column<sbyte>(type: "tinyint", nullable: true),
                    PermiteActualizacionCompleta = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "periodos",
                columns: table => new
                {
                    idPeriodo = table.Column<string>(type: "char(7)", fixedLength: true, maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    detalle = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_inicial = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_final = table.Column<DateOnly>(type: "date", nullable: true),
                    cerrado = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    fecha_maxima_autocierre = table.Column<DateOnly>(type: "date", nullable: true),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    creditos = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    numero_pagos = table.Column<uint>(type: "int unsigned", nullable: true),
                    fecha_matrucla_extraordinaria = table.Column<DateOnly>(type: "date", nullable: true),
                    foliop = table.Column<int>(type: "int", nullable: true),
                    permiteMatricula = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    ingresoCalificaciones = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    permiteCalificacionesInstituto = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    periodoactivoinstituto = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    visualizaPowerBi = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    esInstituto = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    periodoPlanificacion = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idPeriodo);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "profesores",
                columns: table => new
                {
                    idProfesor = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipodocumento = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    apellidos = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombres = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    primerApellido = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    segundoApellido = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    primerNombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    segundoNombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estadoCivil = table.Column<int>(type: "int", nullable: false),
                    direccion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    callePrincipal = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    calleSecundaria = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    numeroCasa = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    telefono = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    celular = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_nacimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    sexo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    clave = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    practicas = table.Column<sbyte>(type: "tinyint", nullable: true),
                    tipo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nacionalidad = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    abreviatura = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    abreviatura_post = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<sbyte>(type: "tinyint", nullable: true),
                    idEtnia = table.Column<int>(type: "int", nullable: true),
                    idNacionalidad = table.Column<int>(type: "int", nullable: true),
                    idParroquiaNacimiento = table.Column<int>(type: "int", nullable: true),
                    emailInstitucional = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_ingreso = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaIngresoIess = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_retiro = table.Column<DateOnly>(type: "date", nullable: true),
                    idParroquiaResidencia = table.Column<int>(type: "int", nullable: true),
                    tipoSangre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoPostal = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idDiscapacidad = table.Column<int>(type: "int", nullable: true),
                    porcentajeDiscapacidad = table.Column<int>(type: "int", nullable: true),
                    numeroConadis = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    foto = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esReal = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProfesor);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "profesores_actividades",
                columns: table => new
                {
                    idPeriodo = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProfesor = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idSubcategoria = table.Column<int>(type: "int(11)", nullable: false),
                    horas_semana = table.Column<int>(type: "int(11)", nullable: true),
                    Usuario = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Fecha = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.idPeriodo, x.idProfesor, x.idSubcategoria })
                        .Annotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "profesores_dedicacion",
                columns: table => new
                {
                    idProfesoresDedicacion = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProfesor = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idDedicacionCategorias = table.Column<int>(type: "int", nullable: false),
                    idPeriodo = table.Column<string>(type: "char(7)", fixedLength: true, maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProfesoresDedicacion);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_operaciones",
                columns: table => new
                {
                    idOperaciones = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NombreOperacion = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_operaciones", x => x.idOperaciones);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_rol",
                columns: table => new
                {
                    idRol = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigo_rol = table.Column<string>(type: "varchar(25)", maxLength: 25, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_rol", x => x.idRol);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_sistema",
                columns: table => new
                {
                    idSistema = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    codigo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    detalle = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_sistema", x => x.idSistema);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "subcategorias_actividades",
                columns: table => new
                {
                    idSubcategoria = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idCategoria = table.Column<int>(type: "int", nullable: true),
                    subcategoria = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esDocencia = table.Column<sbyte>(type: "tinyint", nullable: true),
                    activa = table.Column<sbyte>(type: "tinyint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idSubcategoria);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tipos_contratos",
                columns: table => new
                {
                    idTiposContratos = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    nombre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tipos_contratos", x => x.idTiposContratos);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "universidades",
                columns: table => new
                {
                    idUniversidad = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Idpaises = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CodigoSiees = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idUniversidad);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    idUsuario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idSigafi = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tablaSigafi = table.Column<string>(type: "enum('alumno','profesor','otros')", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    contrasenia = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<sbyte>(type: "tinyint(4)", nullable: false, defaultValueSql: "'1'"),
                    administrador = table.Column<sbyte>(type: "tinyint(4)", nullable: false, defaultValueSql: "'0'"),
                    emailInstitucional = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    emailValidado = table.Column<sbyte>(type: "tinyint(4)", nullable: false, defaultValueSql: "'0'"),
                    hashEmailToken = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaEmailValidacion = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.idUsuario);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "horas_academicas",
                columns: table => new
                {
                    idHorasAcademicas = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idDedicacion = table.Column<int>(type: "int(11)", nullable: false),
                    HorasMinimas = table.Column<int>(type: "int", nullable: true),
                    HorasMaximas = table.Column<int>(type: "int", nullable: true),
                    HorasMaximaSemana = table.Column<int>(type: "int", nullable: true),
                    EsActivo = table.Column<sbyte>(type: "tinyint", nullable: true),
                    DedicacionIdDedicacion = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idHorasAcademicas);
                    table.ForeignKey(
                        name: "FK_horas_academicas_dedicacion_DedicacionIdDedicacion",
                        column: x => x.DedicacionIdDedicacion,
                        principalTable: "dedicacion",
                        principalColumn: "idDedicacion");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "horario_detalle",
                columns: table => new
                {
                    idHorario = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idAsignacion = table.Column<int>(type: "int(11)", nullable: false),
                    idEspacio = table.Column<int>(type: "int(11)", nullable: false),
                    diaSemana = table.Column<int>(type: "int(11)", nullable: false),
                    horaInicio = table.Column<TimeOnly>(type: "time(6)", nullable: false),
                    horaFin = table.Column<TimeOnly>(type: "time(6)", nullable: true),
                    tipoBloque = table.Column<string>(type: "enum('teorico','practico','taller')", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Activo = table.Column<sbyte>(type: "tinyint", nullable: true),
                    EspacioIdEspacio = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idHorario);
                    table.ForeignKey(
                        name: "FK_horario_detalle_espacios_EspacioIdEspacio",
                        column: x => x.EspacioIdEspacio,
                        principalTable: "espacios",
                        principalColumn: "idEspacio");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_dominios_carrera",
                columns: table => new
                {
                    idDominioCarrera = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idDominio = table.Column<int>(type: "int", nullable: false),
                    idCarrera = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDominioCarrera);
                    table.ForeignKey(
                        name: "fk_idc_carrera",
                        column: x => x.idCarrera,
                        principalTable: "carreras",
                        principalColumn: "idCarrera",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_idc_dominio",
                        column: x => x.idDominio,
                        principalTable: "inv_dominios",
                        principalColumn: "idDominio",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_sublineas",
                columns: table => new
                {
                    idSublinea = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idLinea = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idSublinea);
                    table.ForeignKey(
                        name: "fk_sub_linea",
                        column: x => x.idLinea,
                        principalTable: "inv_lineas_investigacion",
                        principalColumn: "idLinea",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_ods",
                columns: table => new
                {
                    idOds = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idEje = table.Column<int>(type: "int", nullable: false),
                    numeroOds = table.Column<int>(type: "int", nullable: false),
                    titulo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idOds);
                    table.ForeignKey(
                        name: "fk_ods_eje",
                        column: x => x.idEje,
                        principalTable: "inv_ods_ejes",
                        principalColumn: "idEje",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_rubrica_criterios",
                columns: table => new
                {
                    idCriterio = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idRubrica = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    pesoPorcentaje = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    orden = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idCriterio);
                    table.ForeignKey(
                        name: "fk_crit_rubrica",
                        column: x => x.idRubrica,
                        principalTable: "inv_rubricas",
                        principalColumn: "idRubrica",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_config_workflow",
                columns: table => new
                {
                    IdWorkflow = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdTipoProyecto = table.Column<int>(type: "int", nullable: true),
                    EstadoOrigen = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EstadoDestino = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RolRequerido = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequiereObservacion = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Activo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    contabilizaCargaHoraria = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    permiteInformesAvance = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    permiteRegistroEgresos = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    permiteGastosCapital = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    esEstadoFinal = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    etiquetaUi = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    colorHex = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IdWorkflow);
                    table.ForeignKey(
                        name: "FK_inv_config_workflow_inv_tipos_investigacion_IdTipoProyecto",
                        column: x => x.IdTipoProyecto,
                        principalTable: "inv_tipos_investigacion",
                        principalColumn: "idTipo");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "grados_academicos",
                columns: table => new
                {
                    idGradoAcademico = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdNivelAcademico = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NivelesAcademicoIdNivelAcademico = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idGradoAcademico);
                    table.ForeignKey(
                        name: "FK_grados_academicos_niveles_academicos_NivelesAcademicoIdNivel~",
                        column: x => x.NivelesAcademicoIdNivelAcademico,
                        principalTable: "niveles_academicos",
                        principalColumn: "idNivelAcademico");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_convocatorias",
                columns: table => new
                {
                    idConvocatoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigoConvocatoria = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idPeriodo = table.Column<string>(type: "char(7)", fixedLength: true, maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaApertura = table.Column<DateOnly>(type: "date", nullable: false),
                    fechaCierre = table.Column<DateOnly>(type: "date", nullable: false),
                    anio = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    urlBases = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    requisitosMinimos = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idTipoConvocatoria = table.Column<int>(type: "int", nullable: true),
                    estado = table.Column<string>(type: "enum('Borrador','Abierta','Cerrada','Anulada')", nullable: false, defaultValueSql: "'Borrador'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    eliminado = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    fechaEliminacion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    eliminadoPorUsuarioId = table.Column<int>(type: "int", nullable: true),
                    idRubrica = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idConvocatoria);
                    table.ForeignKey(
                        name: "fk_conv_periodo",
                        column: x => x.idPeriodo,
                        principalTable: "periodos",
                        principalColumn: "idPeriodo",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_conv_rubrica",
                        column: x => x.idRubrica,
                        principalTable: "inv_rubricas",
                        principalColumn: "idRubrica",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "profesores_carreras_periodos",
                columns: table => new
                {
                    idProfesoresCarrerasPeriodos = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idPeriodo = table.Column<string>(type: "char(7)", maxLength: 7, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProfesor = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idCarrera = table.Column<int>(type: "int(11)", nullable: true),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true),
                    sonTodas = table.Column<sbyte>(type: "tinyint(4)", nullable: true, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProfesoresCarrerasPeriodos);
                    table.ForeignKey(
                        name: "fk_pcp_carreras",
                        column: x => x.idCarrera,
                        principalTable: "carreras",
                        principalColumn: "idCarrera",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pcp_periodos",
                        column: x => x.idPeriodo,
                        principalTable: "periodos",
                        principalColumn: "idPeriodo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pcp_profesores",
                        column: x => x.idProfesor,
                        principalTable: "profesores",
                        principalColumn: "idProfesor",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_modulos",
                columns: table => new
                {
                    idModulos = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    id_sistema = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_modulos", x => x.idModulos);
                    table.ForeignKey(
                        name: "fk_mod_sistema",
                        column: x => x.id_sistema,
                        principalTable: "rbac_sistema",
                        principalColumn: "idSistema",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "contratos",
                columns: table => new
                {
                    idContratos = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProfesor = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idTiposContratos = table.Column<int>(type: "int", nullable: true),
                    esActivo = table.Column<sbyte>(type: "tinyint", nullable: true),
                    iddepartamentos = table.Column<int>(type: "int(11)", nullable: true),
                    idCargoInstituto = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contratos", x => x.idContratos);
                    table.ForeignKey(
                        name: "FK_contratos_cargo_instituto_idCargoInstituto",
                        column: x => x.idCargoInstituto,
                        principalTable: "cargo_instituto",
                        principalColumn: "idCargoInstituto");
                    table.ForeignKey(
                        name: "FK_contratos_departamentos_iddepartamentos",
                        column: x => x.iddepartamentos,
                        principalTable: "departamentos",
                        principalColumn: "iddepartamentos");
                    table.ForeignKey(
                        name: "FK_contratos_tipos_contratos_idTiposContratos",
                        column: x => x.idTiposContratos,
                        principalTable: "tipos_contratos",
                        principalColumn: "idTiposContratos");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_audit_admin",
                columns: table => new
                {
                    idAudit = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idUsuarioAdmin = table.Column<int>(type: "int", nullable: true),
                    idUsuarioAfectado = table.Column<int>(type: "int", nullable: true),
                    accion = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Modulo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    detalle = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ipOrigen = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserAgent = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValoresAnteriores = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValoresNuevos = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAudit);
                    table.ForeignKey(
                        name: "fk_audit_admin",
                        column: x => x.idUsuarioAdmin,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_audit_afectado",
                        column: x => x.idUsuarioAfectado,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_backup_logs",
                columns: table => new
                {
                    idBackup = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaBackup = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    tipo = table.Column<string>(type: "enum('Completo','BaseDatos','Archivos')", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    destino = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombreArchivo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tamanioBytes = table.Column<long>(type: "bigint", nullable: false),
                    estado = table.Column<string>(type: "enum('Exitoso','Fallido','En_Proceso')", nullable: false, defaultValue: "En_Proceso")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    hashVerificacion = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    errorMensaje = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ejecutadoPor = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idBackup);
                    table.ForeignKey(
                        name: "fk_backup_ejecutor",
                        column: x => x.ejecutadoPor,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_dispositivos_tokens",
                columns: table => new
                {
                    idToken = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    deviceToken = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    plataforma = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, defaultValueSql: "'Web'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ultimaSincronizacion = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idToken);
                    table.ForeignKey(
                        name: "fk_token_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_email_historial",
                columns: table => new
                {
                    idEmailHistorial = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    destinatario = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuarioDestinatario = table.Column<int>(type: "int", nullable: true),
                    asunto = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cuerpo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "enum('Pendiente','Enviado','Fallido')", nullable: false, defaultValueSql: "'Pendiente'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    errorMensaje = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaEnvio = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    adjuntosJson = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    metadataJson = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEmailHistorial);
                    table.ForeignKey(
                        name: "fk_email_hist_usuario",
                        column: x => x.idUsuarioDestinatario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_grupos_investigacion",
                columns: table => new
                {
                    idGrupo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    siglas = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tipoGrupo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Investigación")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idDominio = table.Column<int>(type: "int", nullable: true),
                    idCoordinador = table.Column<int>(type: "int", nullable: true),
                    objetivoGeneral = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    mision = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    vision = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    resolucionAprobacion = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaCreacion = table.Column<DateOnly>(type: "date", nullable: true),
                    categoriaConsolidacion = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValue: "En Formación")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    eliminado = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    fechaEliminacion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    eliminadoPorUsuarioId = table.Column<int>(type: "int", nullable: true),
                    estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, defaultValue: "Aprobado")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    linkWhatsapp = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    telefonoCoordinador = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FotoUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idGrupo);
                    table.ForeignKey(
                        name: "fk_grupo_coordinador",
                        column: x => x.idCoordinador,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_grupo_dominio",
                        column: x => x.idDominio,
                        principalTable: "inv_dominios",
                        principalColumn: "idDominio",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_lopdp_auditoria_datos",
                columns: table => new
                {
                    idAuditoriaDatos = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuarioActor = table.Column<int>(type: "int", nullable: true),
                    idUsuarioAfectado = table.Column<int>(type: "int", nullable: false),
                    tablaAfectada = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    columnaAfectada = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    operacion = table.Column<string>(type: "enum('LECTURA','ESCRITURA','ELIMINACION','DESCARGA')", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    motivo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ipDireccion = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    userAgent = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaAcceso = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idAuditoriaDatos);
                    table.ForeignKey(
                        name: "fk_audit_datos_actor",
                        column: x => x.idUsuarioActor,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_audit_datos_afectado",
                        column: x => x.idUsuarioAfectado,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_lopdp_consentimientos",
                columns: table => new
                {
                    idConsentimiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    versionPolitica = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    canal = table.Column<string>(type: "enum('Web','Movil','Presencial')", nullable: false, defaultValue: "Web")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaConsentimiento = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ipDireccion = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    userAgent = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    firmaHash = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "enum('Otorgado','Revocado')", nullable: false, defaultValue: "Otorgado")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaRevocacion = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idConsentimiento);
                    table.ForeignKey(
                        name: "fk_consentimiento_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_magic_links",
                columns: table => new
                {
                    id_magic_link = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    id_usuario = table.Column<int>(type: "int", nullable: false),
                    token_hash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_creacion = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fecha_expiracion = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    utilizado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    fecha_utilizado = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ip_creacion = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ip_utilizacion = table.Column<string>(type: "varchar(45)", maxLength: 45, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    user_agent = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    codigo_pin_handoff = table.Column<string>(type: "varchar(12)", maxLength: 12, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_expiracion_pin = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    proposito = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, defaultValue: "MAGIC_LINK")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.id_magic_link);
                    table.ForeignKey(
                        name: "fk_magic_link_usuario",
                        column: x => x.id_usuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_usuarios_metadata",
                columns: table => new
                {
                    idMetadata = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    orcidId = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    scopusId = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    googleScholarUrl = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    researchGateUrl = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    especialidad = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    gradoAcademicoMaximo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    aceptoTerminosFirma = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    fechaConsentimientoFirma = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    configuracion = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaUltimoAcceso = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idMetadata);
                    table.ForeignKey(
                        name: "fk_usermeta_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_usuario_rol",
                columns: table => new
                {
                    idUsuarioRol = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    idRol = table.Column<int>(type: "int", nullable: false),
                    fecha_creacion = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_modificacion = table.Column<DateOnly>(type: "date", nullable: true),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_usuario_rol", x => x.idUsuarioRol);
                    table.ForeignKey(
                        name: "fk_ur_rol",
                        column: x => x.idRol,
                        principalTable: "rbac_rol",
                        principalColumn: "idRol",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ur_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "titulos_profesores",
                columns: table => new
                {
                    idTitulosProfesor = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProfesor = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdUniversidad = table.Column<int>(type: "int", nullable: false),
                    IdGradoAcademico = table.Column<int>(type: "int", nullable: false),
                    codigo_senescyt = table.Column<string>(type: "varchar(90)", maxLength: 90, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_obtencion = table.Column<DateOnly>(type: "date", nullable: true),
                    FechaRegistro = table.Column<DateOnly>(type: "date", nullable: true),
                    IdCampoDetalladoUnesco = table.Column<int>(type: "int", nullable: false),
                    ArchivoTitulo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GradosAcademicoIdGradoAcademico = table.Column<int>(type: "int(11)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTitulosProfesor);
                    table.ForeignKey(
                        name: "FK_titulos_profesores_grados_academicos_GradosAcademicoIdGradoA~",
                        column: x => x.GradosAcademicoIdGradoAcademico,
                        principalTable: "grados_academicos",
                        principalColumn: "idGradoAcademico");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_modulos_operaciones",
                columns: table => new
                {
                    idModulosOperaciones = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idModulos = table.Column<int>(type: "int", nullable: false),
                    idOperaciones = table.Column<int>(type: "int", nullable: false),
                    fecha_creacion = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_modificacion = table.Column<DateOnly>(type: "date", nullable: true),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_modulos_operaciones", x => x.idModulosOperaciones);
                    table.ForeignKey(
                        name: "fk_mo_mod",
                        column: x => x.idModulos,
                        principalTable: "rbac_modulos",
                        principalColumn: "idModulos",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_mo_oper",
                        column: x => x.idOperaciones,
                        principalTable: "rbac_operaciones",
                        principalColumn: "idOperaciones",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_grupos_carreras",
                columns: table => new
                {
                    idGrupo = table.Column<int>(type: "int", nullable: false),
                    idCarrera = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_grupos_carreras", x => new { x.idGrupo, x.idCarrera });
                    table.ForeignKey(
                        name: "FK_inv_grupos_carreras_carreras_idCarrera",
                        column: x => x.idCarrera,
                        principalTable: "carreras",
                        principalColumn: "idCarrera",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inv_grupos_carreras_inv_grupos_investigacion_idGrupo",
                        column: x => x.idGrupo,
                        principalTable: "inv_grupos_investigacion",
                        principalColumn: "idGrupo",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_grupos_lineas",
                columns: table => new
                {
                    idGrupo = table.Column<int>(type: "int", nullable: false),
                    idLinea = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_grupos_lineas", x => new { x.idGrupo, x.idLinea });
                    table.ForeignKey(
                        name: "FK_inv_grupos_lineas_inv_grupos_investigacion_idGrupo",
                        column: x => x.idGrupo,
                        principalTable: "inv_grupos_investigacion",
                        principalColumn: "idGrupo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inv_grupos_lineas_inv_lineas_investigacion_idLinea",
                        column: x => x.idLinea,
                        principalTable: "inv_lineas_investigacion",
                        principalColumn: "idLinea",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_grupos_miembros",
                columns: table => new
                {
                    idGrupoMiembro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idGrupo = table.Column<int>(type: "int", nullable: false),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    rol = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fechaInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaFin = table.Column<DateOnly>(type: "date", nullable: true),
                    motivoSalida = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    telefonoContacto = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idGrupoMiembro);
                    table.ForeignKey(
                        name: "fk_miembro_grupo",
                        column: x => x.idGrupo,
                        principalTable: "inv_grupos_investigacion",
                        principalColumn: "idGrupo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_miembro_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos",
                columns: table => new
                {
                    idProyecto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idConvocatoria = table.Column<int>(type: "int", nullable: true),
                    codigoInstitucional = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idSublinea = table.Column<int>(type: "int", nullable: true),
                    idPrograma = table.Column<int>(type: "int", nullable: true),
                    idGrupo = table.Column<int>(type: "int", nullable: true),
                    tieneGrupo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    idTipo = table.Column<int>(type: "int", nullable: true),
                    fechaPresentacion = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaFin = table.Column<DateOnly>(type: "date", nullable: true),
                    tiempoEjecucion = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'Borrador'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    puntajeEvaluacion = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    valorEjecucion = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    presupuesto_estimado = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    idDspaceHandle = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    metadataCacesJson = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    eliminado = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    fechaEliminacion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    eliminadoPorUsuarioId = table.Column<int>(type: "int", nullable: true),
                    disponibleAdopcion = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValue: false),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaModificacion = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    idObjetivoPnd = table.Column<int>(type: "int", nullable: true),
                    idEntidadAliada = table.Column<int>(type: "int", nullable: true),
                    trlInicial = table.Column<sbyte>(type: "tinyint", nullable: true),
                    trlActual = table.Column<sbyte>(type: "tinyint", nullable: true),
                    trlMeta = table.Column<sbyte>(type: "tinyint", nullable: true),
                    autoExtendDeadlines = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    autoExtendDays = table.Column<int>(type: "int", nullable: false, defaultValue: 7)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProyecto);
                    table.ForeignKey(
                        name: "fk_proy_conv",
                        column: x => x.idConvocatoria,
                        principalTable: "inv_convocatorias",
                        principalColumn: "idConvocatoria",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_entidad_aliada",
                        column: x => x.idEntidadAliada,
                        principalTable: "inv_entidades_externas",
                        principalColumn: "idEntidad",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_grupo",
                        column: x => x.idGrupo,
                        principalTable: "inv_grupos_investigacion",
                        principalColumn: "idGrupo",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_pnd_obj",
                        column: x => x.idObjetivoPnd,
                        principalTable: "inv_pnd_objetivos",
                        principalColumn: "idObjetivoPnd",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_programa",
                        column: x => x.idPrograma,
                        principalTable: "inv_programas",
                        principalColumn: "idPrograma",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_sublinea",
                        column: x => x.idSublinea,
                        principalTable: "inv_sublineas",
                        principalColumn: "idSublinea",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proy_tipo",
                        column: x => x.idTipo,
                        principalTable: "inv_tipos_investigacion",
                        principalColumn: "idTipo",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rbac_rol_modulo_operacion",
                columns: table => new
                {
                    idRolModuloOperacion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idModulosOperaciones = table.Column<int>(type: "int", nullable: false),
                    idRol = table.Column<int>(type: "int", nullable: false),
                    fecha_asignacion = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_modificacion = table.Column<DateOnly>(type: "date", nullable: true),
                    fecha_desactivacion = table.Column<DateOnly>(type: "date", nullable: true),
                    esActivo = table.Column<sbyte>(type: "tinyint(4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_rol_modulo_operacion", x => x.idRolModuloOperacion);
                    table.ForeignKey(
                        name: "fk_rmo_mo",
                        column: x => x.idModulosOperaciones,
                        principalTable: "rbac_modulos_operaciones",
                        principalColumn: "idModulosOperaciones",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_rmo_rol",
                        column: x => x.idRol,
                        principalTable: "rbac_rol",
                        principalColumn: "idRol",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_bibliografia_proyecto",
                columns: table => new
                {
                    idBibliografia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    citaAPA = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    doi = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    isbn = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    autores = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    anioPublicacion = table.Column<int>(type: "int", nullable: true),
                    tituloFuente = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    url = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idBibliografia);
                    table.ForeignKey(
                        name: "fk_bib_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_financiamientos",
                columns: table => new
                {
                    idFinanciamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    esIstpet = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    nombreEmpresa = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    otrasFuentes = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    monto = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idFinanciamiento);
                    table.ForeignKey(
                        name: "fk_fin_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_impactos_proyecto",
                columns: table => new
                {
                    idImpactoProyecto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idCatImpacto = table.Column<int>(type: "int", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idImpactoProyecto);
                    table.ForeignKey(
                        name: "fk_imp_categoria",
                        column: x => x.idCatImpacto,
                        principalTable: "inv_cat_impactos",
                        principalColumn: "idCatImpacto",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_imp_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_informes_avance",
                columns: table => new
                {
                    idInforme = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    numeroInforme = table.Column<int>(type: "int", nullable: false),
                    fechaReporte = table.Column<DateOnly>(type: "date", nullable: false),
                    resumenActividades = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esFirmadoDigital = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'"),
                    hashFirma = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaFirma = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    validadoPor = table.Column<int>(type: "int", nullable: true),
                    estado = table.Column<string>(type: "enum('Pendiente','Aprobado','Observado')", nullable: false, defaultValueSql: "'Pendiente'")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idInforme);
                    table.ForeignKey(
                        name: "fk_inf_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_inf_validador",
                        column: x => x.validadoPor,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_notificaciones",
                columns: table => new
                {
                    idNotificacion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idProyecto = table.Column<int>(type: "int", nullable: true),
                    destinatario = table.Column<int>(type: "int", nullable: false),
                    tipoDestinatario = table.Column<string>(type: "enum('Usuario','Profesor','Alumno')", nullable: false, defaultValueSql: "'Usuario'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    categoria = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'SISTEMA'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    prioridad = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValueSql: "'NORMAL'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    titulo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    mensaje = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    urlAccion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    leido = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'"),
                    fechaEnvio = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaLectura = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idNotificacion);
                    table.ForeignKey(
                        name: "fk_notif_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_notif_usuario",
                        column: x => x.destinatario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_objetivos_proyecto",
                columns: table => new
                {
                    idObjetivo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    esGeneral = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'"),
                    descripcion = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    orden = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idObjetivo);
                    table.ForeignKey(
                        name: "fk_obj_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_presupuesto_items",
                columns: table => new
                {
                    idItem = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    categoria = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idPartida = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    detalle = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cantidad = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false, defaultValueSql: "'1'"),
                    valorUnitario = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    valorTotal = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    esGastoCapital = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idItem);
                    table.ForeignKey(
                        name: "fk_pres_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_productos",
                columns: table => new
                {
                    idProducto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idTipoProducto = table.Column<int>(type: "int", nullable: false),
                    titulo = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cantidad = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'"),
                    urlProducto = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esPropiedadIntelectual = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    numeroRegistro = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaRegistroSenadi = table.Column<DateOnly>(type: "date", nullable: true),
                    metadataJson = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProducto);
                    table.ForeignKey(
                        name: "fk_prod_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prod_tipo",
                        column: x => x.idTipoProducto,
                        principalTable: "inv_cat_tipo_producto",
                        principalColumn: "idTipoProducto",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyecto_extensiones",
                columns: table => new
                {
                    IdExtension = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdProyecto = table.Column<int>(type: "int", nullable: false),
                    FechaAnterior = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaNueva = table.Column<DateOnly>(type: "date", nullable: false),
                    Motivo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Resolucion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_proyecto_extensiones", x => x.IdExtension);
                    table.ForeignKey(
                        name: "FK_inv_proyecto_extensiones_inv_proyectos_IdProyecto",
                        column: x => x.IdProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyecto_participantes",
                columns: table => new
                {
                    idParticipante = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idUsuario = table.Column<int>(type: "int", nullable: false),
                    tipoParticipante = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValue: "Docente")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esDirector = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    rol = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nivelAcademico = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    telefono = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    horasSemanales = table.Column<decimal>(type: "decimal(4,1)", precision: 4, scale: 1, nullable: true),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    fecha_inicio = table.Column<DateTime>(type: "datetime", nullable: true),
                    fecha_fin = table.Column<DateTime>(type: "datetime", nullable: true),
                    motivo_cambio = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idParticipante);
                    table.ForeignKey(
                        name: "fk_part_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_part_usuario",
                        column: x => x.idUsuario,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos_carreras",
                columns: table => new
                {
                    idProyectoCarrera = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idCarrera = table.Column<int>(type: "int", nullable: false),
                    modalidad = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProyectoCarrera);
                    table.ForeignKey(
                        name: "fk_pc_carrera",
                        column: x => x.idCarrera,
                        principalTable: "carreras",
                        principalColumn: "idCarrera",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pc_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos_documentos_adjuntos",
                columns: table => new
                {
                    idDocAdj = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    nombreArchivo = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rutaArchivo = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaSubida = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDocAdj);
                    table.ForeignKey(
                        name: "fk_docadj_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos_dominios",
                columns: table => new
                {
                    idProyectoDominio = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idDominio = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProyectoDominio);
                    table.ForeignKey(
                        name: "fk_pd_dominio",
                        column: x => x.idDominio,
                        principalTable: "inv_dominios",
                        principalColumn: "idDominio",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pd_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos_mml",
                columns: table => new
                {
                    idMml = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    nivel = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    resumenNarrativo = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    indicadores = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    mediosVerificacion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    supuestos = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idMml);
                    table.ForeignKey(
                        name: "fk_mml_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_proyectos_ods",
                columns: table => new
                {
                    idProyectoOds = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idOds = table.Column<int>(type: "int", nullable: false),
                    objetivoEspecificoODS = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idProyectoOds);
                    table.ForeignKey(
                        name: "fk_pods_ods",
                        column: x => x.idOds,
                        principalTable: "inv_ods",
                        principalColumn: "idOds",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pods_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_recursos_disponibles",
                columns: table => new
                {
                    idRecurso = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    detalle = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cantidad = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    fuente = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idRecurso);
                    table.ForeignKey(
                        name: "fk_rec_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_revisiones_pares",
                columns: table => new
                {
                    idRevision = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idRevisor = table.Column<int>(type: "int", nullable: true),
                    fechaAsignacion = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaLimite = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    fechaCompletado = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    estado = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'Pendiente'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    dictamenRevisor = table.Column<string>(type: "enum('Pendiente','Aprueba','Rechaza')", nullable: false, defaultValueSql: "'Pendiente'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    esExterno = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'"),
                    esDobleCiego = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    puntajeTotal = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    observacionesGral = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idRevision);
                    table.ForeignKey(
                        name: "fk_rev_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_rev_usuario",
                        column: x => x.idRevisor,
                        principalTable: "usuarios",
                        principalColumn: "idUsuario",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_tokens_acceso",
                columns: table => new
                {
                    idToken = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    token = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProyecto = table.Column<int>(type: "int", nullable: true),
                    idReferencia = table.Column<int>(type: "int", nullable: false),
                    tipoReferencia = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'Externo'")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    scopes = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    maxUsos = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'"),
                    usosActuales = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'0'"),
                    ipOrigen = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    fechaExpiracion = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idToken);
                    table.ForeignKey(
                        name: "fk_token_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_transferencias",
                columns: table => new
                {
                    idTransferencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    entidadReceptora = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    numeroConvenio = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaConvenio = table.Column<DateOnly>(type: "date", nullable: true),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTransferencia);
                    table.ForeignKey(
                        name: "fk_trans_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_trazabilidad_proyectos",
                columns: table => new
                {
                    idTrazabilidad = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idUsuario = table.Column<int>(type: "int", nullable: true),
                    estadoAnterior = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estadoNuevo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    observacion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaTransicion = table.Column<DateTime>(type: "datetime(6)", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    hashAnterior = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    hashActual = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idTrazabilidad);
                    table.ForeignKey(
                        name: "fk_trazabilidad_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_evidencias",
                columns: table => new
                {
                    idEvidencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idInforme = table.Column<int>(type: "int", nullable: false),
                    idTipoEvidencia = table.Column<int>(type: "int", nullable: false),
                    descripcion = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rutaArchivo = table.Column<string>(type: "varchar(512)", maxLength: 512, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    metadataJson = table.Column<string>(type: "json", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaRegistro = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idEvidencia);
                    table.ForeignKey(
                        name: "fk_ev_informe",
                        column: x => x.idInforme,
                        principalTable: "inv_informes_avance",
                        principalColumn: "idInforme",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ev_tipo",
                        column: x => x.idTipoEvidencia,
                        principalTable: "inv_cat_tipo_evidencia",
                        principalColumn: "idTipoEvidencia",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_cronograma",
                columns: table => new
                {
                    idActividad = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idObjetivo = table.Column<int>(type: "int", nullable: false),
                    numeroActividad = table.Column<int>(type: "int", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    recursosNecesarios = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Responsable = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Entregable = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fechaInicioPrevista = table.Column<DateOnly>(type: "date", nullable: true),
                    fechaFinPrevista = table.Column<DateOnly>(type: "date", nullable: true),
                    progreso = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false, defaultValueSql: "'0.00'"),
                    ponderacion = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false, defaultValueSql: "'0.00'"),
                    esEntregableCaces = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'0'"),
                    idActividadPadre = table.Column<int>(type: "int", nullable: true),
                    colorHex = table.Column<string>(type: "varchar(7)", maxLength: 7, nullable: false, defaultValueSql: "'#0070f3'")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idActividad);
                    table.ForeignKey(
                        name: "fk_cron_objetivo",
                        column: x => x.idObjetivo,
                        principalTable: "inv_objetivos_proyecto",
                        principalColumn: "idObjetivo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_cron_padre",
                        column: x => x.idActividadPadre,
                        principalTable: "inv_cronograma",
                        principalColumn: "idActividad",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_cron_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_evaluaciones_detalle",
                columns: table => new
                {
                    idDetalle = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    idRevision = table.Column<int>(type: "int", nullable: false),
                    criterio = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    puntaje = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    observaciones = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idDetalle);
                    table.ForeignKey(
                        name: "fk_eval_revision",
                        column: x => x.idRevision,
                        principalTable: "inv_revisiones_pares",
                        principalColumn: "idRevision",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "inv_gastos",
                columns: table => new
                {
                    idGasto = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    uuid = table.Column<Guid>(type: "char(36)", maxLength: 36, nullable: false, collation: "ascii_general_ci"),
                    idProyecto = table.Column<int>(type: "int", nullable: false),
                    idItem = table.Column<int>(type: "int", nullable: false),
                    monto = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    fechaGasto = table.Column<DateOnly>(type: "date", nullable: false),
                    numeroFactura = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idEvidencia = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.idGasto);
                    table.ForeignKey(
                        name: "fk_gast_evidencia",
                        column: x => x.idEvidencia,
                        principalTable: "inv_evidencias",
                        principalColumn: "idEvidencia",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_gast_item",
                        column: x => x.idItem,
                        principalTable: "inv_presupuesto_items",
                        principalColumn: "idItem",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_gast_proyecto",
                        column: x => x.idProyecto,
                        principalTable: "inv_proyectos",
                        principalColumn: "idProyecto",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_contratos_idCargoInstituto",
                table: "contratos",
                column: "idCargoInstituto");

            migrationBuilder.CreateIndex(
                name: "IX_contratos_iddepartamentos",
                table: "contratos",
                column: "iddepartamentos");

            migrationBuilder.CreateIndex(
                name: "IX_contratos_idTiposContratos",
                table: "contratos",
                column: "idTiposContratos");

            migrationBuilder.CreateIndex(
                name: "IX_grados_academicos_NivelesAcademicoIdNivelAcademico",
                table: "grados_academicos",
                column: "NivelesAcademicoIdNivelAcademico");

            migrationBuilder.CreateIndex(
                name: "IX_horario_detalle_EspacioIdEspacio",
                table: "horario_detalle",
                column: "EspacioIdEspacio");

            migrationBuilder.CreateIndex(
                name: "IX_horas_academicas_DedicacionIdDedicacion",
                table: "horas_academicas",
                column: "DedicacionIdDedicacion");

            migrationBuilder.CreateIndex(
                name: "IX_inv_audit_admin_idUsuarioAdmin",
                table: "inv_audit_admin",
                column: "idUsuarioAdmin");

            migrationBuilder.CreateIndex(
                name: "IX_inv_audit_admin_idUsuarioAfectado",
                table: "inv_audit_admin",
                column: "idUsuarioAfectado");

            migrationBuilder.CreateIndex(
                name: "IX_inv_backup_logs_ejecutadoPor",
                table: "inv_backup_logs",
                column: "ejecutadoPor");

            migrationBuilder.CreateIndex(
                name: "IX_inv_backup_logs_uuid",
                table: "inv_backup_logs",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_bibliografia_proyecto_idProyecto",
                table: "inv_bibliografia_proyecto",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_bibliografia_proyecto_uuid",
                table: "inv_bibliografia_proyecto",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uk_alerta",
                table: "inv_calendario_alertas_enviadas",
                columns: new[] { "idEventoCalendario", "idUsuario", "fechaEvento" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_calendario_eventos_normativos_uuid",
                table: "inv_calendario_eventos_normativos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_cat_tipo_evidencia_uuid",
                table: "inv_cat_tipo_evidencia",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_cat_tipo_producto_uuid",
                table: "inv_cat_tipo_producto",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_collaboration_comments_instanceUuid",
                table: "inv_collaboration_comments",
                column: "instanceUuid");

            migrationBuilder.CreateIndex(
                name: "IX_inv_collaboration_comments_parentId",
                table: "inv_collaboration_comments",
                column: "parentId");

            migrationBuilder.CreateIndex(
                name: "IX_inv_config_workflow_IdTipoProyecto",
                table: "inv_config_workflow",
                column: "IdTipoProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_convocatorias_codigoConvocatoria",
                table: "inv_convocatorias",
                column: "codigoConvocatoria",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_convocatorias_idPeriodo",
                table: "inv_convocatorias",
                column: "idPeriodo");

            migrationBuilder.CreateIndex(
                name: "IX_inv_convocatorias_idRubrica",
                table: "inv_convocatorias",
                column: "idRubrica");

            migrationBuilder.CreateIndex(
                name: "IX_inv_convocatorias_uuid",
                table: "inv_convocatorias",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_cronograma_idActividadPadre",
                table: "inv_cronograma",
                column: "idActividadPadre");

            migrationBuilder.CreateIndex(
                name: "IX_inv_cronograma_idObjetivo",
                table: "inv_cronograma",
                column: "idObjetivo");

            migrationBuilder.CreateIndex(
                name: "IX_inv_cronograma_idProyecto",
                table: "inv_cronograma",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_cronograma_uuid",
                table: "inv_cronograma",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_dispositivos_tokens_deviceToken",
                table: "inv_dispositivos_tokens",
                column: "deviceToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_dispositivos_tokens_idUsuario",
                table: "inv_dispositivos_tokens",
                column: "idUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_document_audit_traceability_code",
                table: "inv_document_audit",
                column: "traceability_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_document_templates_code",
                table: "inv_document_templates",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_documentos_instancias_uuid",
                table: "inv_documentos_instancias",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_documentos_secciones_metadata_instanceUuid_sectionName",
                table: "inv_documentos_secciones_metadata",
                columns: new[] { "instanceUuid", "sectionName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_dominios_uuid",
                table: "inv_dominios",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_dominios_carrera_idCarrera",
                table: "inv_dominios_carrera",
                column: "idCarrera");

            migrationBuilder.CreateIndex(
                name: "IX_inv_dominios_carrera_idDominio",
                table: "inv_dominios_carrera",
                column: "idDominio");

            migrationBuilder.CreateIndex(
                name: "IX_inv_email_historial_idUsuarioDestinatario",
                table: "inv_email_historial",
                column: "idUsuarioDestinatario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_email_historial_uuid",
                table: "inv_email_historial",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_email_templates_codigo",
                table: "inv_email_templates",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_email_templates_uuid",
                table: "inv_email_templates",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_entidades_externas_ruc",
                table: "inv_entidades_externas",
                column: "ruc",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_entidades_externas_uuid",
                table: "inv_entidades_externas",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_evaluaciones_detalle_idRevision",
                table: "inv_evaluaciones_detalle",
                column: "idRevision");

            migrationBuilder.CreateIndex(
                name: "IX_inv_evidencias_idInforme",
                table: "inv_evidencias",
                column: "idInforme");

            migrationBuilder.CreateIndex(
                name: "IX_inv_evidencias_idTipoEvidencia",
                table: "inv_evidencias",
                column: "idTipoEvidencia");

            migrationBuilder.CreateIndex(
                name: "IX_inv_evidencias_uuid",
                table: "inv_evidencias",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_financiamientos_idProyecto",
                table: "inv_financiamientos",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_gastos_idEvidencia",
                table: "inv_gastos",
                column: "idEvidencia");

            migrationBuilder.CreateIndex(
                name: "IX_inv_gastos_idItem",
                table: "inv_gastos",
                column: "idItem");

            migrationBuilder.CreateIndex(
                name: "IX_inv_gastos_idProyecto",
                table: "inv_gastos",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_gastos_uuid",
                table: "inv_gastos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_carreras_idCarrera",
                table: "inv_grupos_carreras",
                column: "idCarrera");

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_investigacion_idCoordinador",
                table: "inv_grupos_investigacion",
                column: "idCoordinador");

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_investigacion_idDominio",
                table: "inv_grupos_investigacion",
                column: "idDominio");

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_investigacion_uuid",
                table: "inv_grupos_investigacion",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_lineas_idLinea",
                table: "inv_grupos_lineas",
                column: "idLinea");

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_miembros_idGrupo",
                table: "inv_grupos_miembros",
                column: "idGrupo");

            migrationBuilder.CreateIndex(
                name: "IX_inv_grupos_miembros_idUsuario",
                table: "inv_grupos_miembros",
                column: "idUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_ical_tokens_idUsuario",
                table: "inv_ical_tokens",
                column: "idUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_ical_tokens_token",
                table: "inv_ical_tokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_ical_tokens_uuid",
                table: "inv_ical_tokens",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_impactos_proyecto_idCatImpacto",
                table: "inv_impactos_proyecto",
                column: "idCatImpacto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_impactos_proyecto_idProyecto",
                table: "inv_impactos_proyecto",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_informes_avance_idProyecto",
                table: "inv_informes_avance",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_informes_avance_uuid",
                table: "inv_informes_avance",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_informes_avance_validadoPor",
                table: "inv_informes_avance",
                column: "validadoPor");

            migrationBuilder.CreateIndex(
                name: "IX_inv_lineas_investigacion_codigoLinea",
                table: "inv_lineas_investigacion",
                column: "codigoLinea",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_lineas_investigacion_uuid",
                table: "inv_lineas_investigacion",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_lopdp_auditoria_datos_idUsuarioActor",
                table: "inv_lopdp_auditoria_datos",
                column: "idUsuarioActor");

            migrationBuilder.CreateIndex(
                name: "IX_inv_lopdp_auditoria_datos_idUsuarioAfectado",
                table: "inv_lopdp_auditoria_datos",
                column: "idUsuarioAfectado");

            migrationBuilder.CreateIndex(
                name: "IX_inv_lopdp_auditoria_datos_uuid",
                table: "inv_lopdp_auditoria_datos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_lopdp_consentimientos_idUsuario",
                table: "inv_lopdp_consentimientos",
                column: "idUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_lopdp_consentimientos_uuid",
                table: "inv_lopdp_consentimientos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_magic_links_codigo_pin_handoff",
                table: "inv_magic_links",
                column: "codigo_pin_handoff");

            migrationBuilder.CreateIndex(
                name: "IX_inv_magic_links_id_usuario",
                table: "inv_magic_links",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_magic_links_token_hash",
                table: "inv_magic_links",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_notificaciones_destinatario",
                table: "inv_notificaciones",
                column: "destinatario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_notificaciones_idProyecto",
                table: "inv_notificaciones",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "uq_notif_uuid",
                table: "inv_notificaciones",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_objetivos_proyecto_idProyecto",
                table: "inv_objetivos_proyecto",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_ods_idEje",
                table: "inv_ods",
                column: "idEje");

            migrationBuilder.CreateIndex(
                name: "IX_inv_pnd_objetivos_codigo",
                table: "inv_pnd_objetivos",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_pnd_objetivos_uuid",
                table: "inv_pnd_objetivos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_presupuesto_items_idProyecto",
                table: "inv_presupuesto_items",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_productos_idProyecto",
                table: "inv_productos",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_productos_idTipoProducto",
                table: "inv_productos",
                column: "idTipoProducto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_programas_uuid",
                table: "inv_programas",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyecto_extensiones_IdProyecto",
                table: "inv_proyecto_extensiones",
                column: "IdProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyecto_participantes_idProyecto",
                table: "inv_proyecto_participantes",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyecto_participantes_idUsuario",
                table: "inv_proyecto_participantes",
                column: "idUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_codigoInstitucional",
                table: "inv_proyectos",
                column: "codigoInstitucional",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idConvocatoria",
                table: "inv_proyectos",
                column: "idConvocatoria");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idEntidadAliada",
                table: "inv_proyectos",
                column: "idEntidadAliada");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idGrupo",
                table: "inv_proyectos",
                column: "idGrupo");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idObjetivoPnd",
                table: "inv_proyectos",
                column: "idObjetivoPnd");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idPrograma",
                table: "inv_proyectos",
                column: "idPrograma");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idSublinea",
                table: "inv_proyectos",
                column: "idSublinea");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_idTipo",
                table: "inv_proyectos",
                column: "idTipo");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_uuid",
                table: "inv_proyectos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_carreras_idCarrera",
                table: "inv_proyectos_carreras",
                column: "idCarrera");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_carreras_idProyecto",
                table: "inv_proyectos_carreras",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_documentos_adjuntos_idProyecto",
                table: "inv_proyectos_documentos_adjuntos",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_documentos_adjuntos_uuid",
                table: "inv_proyectos_documentos_adjuntos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_dominios_idDominio",
                table: "inv_proyectos_dominios",
                column: "idDominio");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_dominios_idProyecto",
                table: "inv_proyectos_dominios",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_mml_idProyecto",
                table: "inv_proyectos_mml",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_ods_idOds",
                table: "inv_proyectos_ods",
                column: "idOds");

            migrationBuilder.CreateIndex(
                name: "IX_inv_proyectos_ods_idProyecto",
                table: "inv_proyectos_ods",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_recursos_disponibles_idProyecto",
                table: "inv_recursos_disponibles",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_revisiones_pares_idProyecto",
                table: "inv_revisiones_pares",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_revisiones_pares_idRevisor",
                table: "inv_revisiones_pares",
                column: "idRevisor");

            migrationBuilder.CreateIndex(
                name: "IX_inv_revisiones_pares_uuid",
                table: "inv_revisiones_pares",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_rubrica_criterios_idRubrica",
                table: "inv_rubrica_criterios",
                column: "idRubrica");

            migrationBuilder.CreateIndex(
                name: "IX_inv_sublineas_idLinea",
                table: "inv_sublineas",
                column: "idLinea");

            migrationBuilder.CreateIndex(
                name: "IX_inv_sublineas_uuid",
                table: "inv_sublineas",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_tipos_investigacion_idTipoPadre",
                table: "inv_tipos_investigacion",
                column: "idTipoPadre");

            migrationBuilder.CreateIndex(
                name: "IX_inv_tipos_investigacion_uuid",
                table: "inv_tipos_investigacion",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_tokens_acceso_idProyecto",
                table: "inv_tokens_acceso",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_tokens_acceso_token",
                table: "inv_tokens_acceso",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_tokens_uuid",
                table: "inv_tokens_acceso",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_transferencias_idProyecto",
                table: "inv_transferencias",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_trazabilidad_proyectos_idProyecto",
                table: "inv_trazabilidad_proyectos",
                column: "idProyecto");

            migrationBuilder.CreateIndex(
                name: "IX_inv_trazabilidad_proyectos_uuid",
                table: "inv_trazabilidad_proyectos",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inv_usuarios_metadata_idUsuario",
                table: "inv_usuarios_metadata",
                column: "idUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_usermeta_uuid",
                table: "inv_usuarios_metadata",
                column: "uuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_profesores_carreras_periodos_idCarrera",
                table: "profesores_carreras_periodos",
                column: "idCarrera");

            migrationBuilder.CreateIndex(
                name: "IX_profesores_carreras_periodos_idPeriodo",
                table: "profesores_carreras_periodos",
                column: "idPeriodo");

            migrationBuilder.CreateIndex(
                name: "IX_profesores_carreras_periodos_idProfesor",
                table: "profesores_carreras_periodos",
                column: "idProfesor");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_modulos_id_sistema",
                table: "rbac_modulos",
                column: "id_sistema");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_modulos_operaciones_idModulos",
                table: "rbac_modulos_operaciones",
                column: "idModulos");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_modulos_operaciones_idOperaciones",
                table: "rbac_modulos_operaciones",
                column: "idOperaciones");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_rol_modulo_operacion_idModulosOperaciones",
                table: "rbac_rol_modulo_operacion",
                column: "idModulosOperaciones");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_rol_modulo_operacion_idRol",
                table: "rbac_rol_modulo_operacion",
                column: "idRol");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_usuario_rol_idRol",
                table: "rbac_usuario_rol",
                column: "idRol");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_usuario_rol_idUsuario",
                table: "rbac_usuario_rol",
                column: "idUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_titulos_profesores_GradosAcademicoIdGradoAcademico",
                table: "titulos_profesores",
                column: "GradosAcademicoIdGradoAcademico");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alumnos");

            migrationBuilder.DropTable(
                name: "alumnos_carreras");

            migrationBuilder.DropTable(
                name: "asignaciones_profesores");

            migrationBuilder.DropTable(
                name: "asignaturas");

            migrationBuilder.DropTable(
                name: "campo_amplio_unesco");

            migrationBuilder.DropTable(
                name: "campo_detallado_unesco");

            migrationBuilder.DropTable(
                name: "campo_especifico_unesco");

            migrationBuilder.DropTable(
                name: "contratos");

            migrationBuilder.DropTable(
                name: "cursos");

            migrationBuilder.DropTable(
                name: "discapacidades");

            migrationBuilder.DropTable(
                name: "etnias");

            migrationBuilder.DropTable(
                name: "fechas_horarios");

            migrationBuilder.DropTable(
                name: "horario_detalle");

            migrationBuilder.DropTable(
                name: "horas_academicas");

            migrationBuilder.DropTable(
                name: "horas_clases");

            migrationBuilder.DropTable(
                name: "instituciones_instituto");

            migrationBuilder.DropTable(
                name: "inv_agendas_zonales");

            migrationBuilder.DropTable(
                name: "inv_audit_admin");

            migrationBuilder.DropTable(
                name: "inv_backup_logs");

            migrationBuilder.DropTable(
                name: "inv_bibliografia_proyecto");

            migrationBuilder.DropTable(
                name: "inv_calendario_alertas_enviadas");

            migrationBuilder.DropTable(
                name: "inv_calendario_eventos_normativos");

            migrationBuilder.DropTable(
                name: "inv_collaboration_comments");

            migrationBuilder.DropTable(
                name: "inv_config_general");

            migrationBuilder.DropTable(
                name: "inv_config_indicadores");

            migrationBuilder.DropTable(
                name: "inv_config_workflow");

            migrationBuilder.DropTable(
                name: "inv_cowork_documentos");

            migrationBuilder.DropTable(
                name: "inv_cowork_sesiones");

            migrationBuilder.DropTable(
                name: "inv_cowork_updates");

            migrationBuilder.DropTable(
                name: "inv_cronograma");

            migrationBuilder.DropTable(
                name: "inv_dispositivos_tokens");

            migrationBuilder.DropTable(
                name: "inv_document_audit");

            migrationBuilder.DropTable(
                name: "inv_document_templates");

            migrationBuilder.DropTable(
                name: "inv_documentos_firmas");

            migrationBuilder.DropTable(
                name: "inv_documentos_instancias");

            migrationBuilder.DropTable(
                name: "inv_documentos_secciones_metadata");

            migrationBuilder.DropTable(
                name: "inv_dominios_carrera");

            migrationBuilder.DropTable(
                name: "inv_email_historial");

            migrationBuilder.DropTable(
                name: "inv_email_templates");

            migrationBuilder.DropTable(
                name: "inv_evaluaciones_detalle");

            migrationBuilder.DropTable(
                name: "inv_financiamientos");

            migrationBuilder.DropTable(
                name: "inv_gastos");

            migrationBuilder.DropTable(
                name: "inv_grupos_carreras");

            migrationBuilder.DropTable(
                name: "inv_grupos_lineas");

            migrationBuilder.DropTable(
                name: "inv_grupos_miembros");

            migrationBuilder.DropTable(
                name: "inv_ical_tokens");

            migrationBuilder.DropTable(
                name: "inv_impactos_proyecto");

            migrationBuilder.DropTable(
                name: "inv_lopdp_auditoria_datos");

            migrationBuilder.DropTable(
                name: "inv_lopdp_consentimientos");

            migrationBuilder.DropTable(
                name: "inv_magic_links");

            migrationBuilder.DropTable(
                name: "inv_notificaciones");

            migrationBuilder.DropTable(
                name: "inv_productos");

            migrationBuilder.DropTable(
                name: "inv_proyecto_extensiones");

            migrationBuilder.DropTable(
                name: "inv_proyecto_participantes");

            migrationBuilder.DropTable(
                name: "inv_proyectos_carreras");

            migrationBuilder.DropTable(
                name: "inv_proyectos_documentos_adjuntos");

            migrationBuilder.DropTable(
                name: "inv_proyectos_dominios");

            migrationBuilder.DropTable(
                name: "inv_proyectos_mml");

            migrationBuilder.DropTable(
                name: "inv_proyectos_ods");

            migrationBuilder.DropTable(
                name: "inv_recursos_disponibles");

            migrationBuilder.DropTable(
                name: "inv_rubrica_criterios");

            migrationBuilder.DropTable(
                name: "inv_tipos_convocatoria");

            migrationBuilder.DropTable(
                name: "inv_tokens_acceso");

            migrationBuilder.DropTable(
                name: "inv_transferencias");

            migrationBuilder.DropTable(
                name: "inv_trazabilidad_proyectos");

            migrationBuilder.DropTable(
                name: "inv_user_signature_profiles");

            migrationBuilder.DropTable(
                name: "inv_usuarios_metadata");

            migrationBuilder.DropTable(
                name: "matriculas");

            migrationBuilder.DropTable(
                name: "parametros");

            migrationBuilder.DropTable(
                name: "profesores_actividades");

            migrationBuilder.DropTable(
                name: "profesores_carreras_periodos");

            migrationBuilder.DropTable(
                name: "profesores_dedicacion");

            migrationBuilder.DropTable(
                name: "rbac_rol_modulo_operacion");

            migrationBuilder.DropTable(
                name: "rbac_usuario_rol");

            migrationBuilder.DropTable(
                name: "subcategorias_actividades");

            migrationBuilder.DropTable(
                name: "titulos_profesores");

            migrationBuilder.DropTable(
                name: "universidades");

            migrationBuilder.DropTable(
                name: "cargo_instituto");

            migrationBuilder.DropTable(
                name: "departamentos");

            migrationBuilder.DropTable(
                name: "tipos_contratos");

            migrationBuilder.DropTable(
                name: "espacios");

            migrationBuilder.DropTable(
                name: "dedicacion");

            migrationBuilder.DropTable(
                name: "inv_objetivos_proyecto");

            migrationBuilder.DropTable(
                name: "inv_revisiones_pares");

            migrationBuilder.DropTable(
                name: "inv_evidencias");

            migrationBuilder.DropTable(
                name: "inv_presupuesto_items");

            migrationBuilder.DropTable(
                name: "inv_cat_impactos");

            migrationBuilder.DropTable(
                name: "inv_cat_tipo_producto");

            migrationBuilder.DropTable(
                name: "inv_ods");

            migrationBuilder.DropTable(
                name: "carreras");

            migrationBuilder.DropTable(
                name: "profesores");

            migrationBuilder.DropTable(
                name: "rbac_modulos_operaciones");

            migrationBuilder.DropTable(
                name: "rbac_rol");

            migrationBuilder.DropTable(
                name: "grados_academicos");

            migrationBuilder.DropTable(
                name: "inv_informes_avance");

            migrationBuilder.DropTable(
                name: "inv_cat_tipo_evidencia");

            migrationBuilder.DropTable(
                name: "inv_ods_ejes");

            migrationBuilder.DropTable(
                name: "rbac_modulos");

            migrationBuilder.DropTable(
                name: "rbac_operaciones");

            migrationBuilder.DropTable(
                name: "niveles_academicos");

            migrationBuilder.DropTable(
                name: "inv_proyectos");

            migrationBuilder.DropTable(
                name: "rbac_sistema");

            migrationBuilder.DropTable(
                name: "inv_convocatorias");

            migrationBuilder.DropTable(
                name: "inv_entidades_externas");

            migrationBuilder.DropTable(
                name: "inv_grupos_investigacion");

            migrationBuilder.DropTable(
                name: "inv_pnd_objetivos");

            migrationBuilder.DropTable(
                name: "inv_programas");

            migrationBuilder.DropTable(
                name: "inv_sublineas");

            migrationBuilder.DropTable(
                name: "inv_tipos_investigacion");

            migrationBuilder.DropTable(
                name: "periodos");

            migrationBuilder.DropTable(
                name: "inv_rubricas");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "inv_dominios");

            migrationBuilder.DropTable(
                name: "inv_lineas_investigacion");
        }
    }
}
