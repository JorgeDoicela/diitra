using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.data.models;

public partial class DiitraContext
{
    partial void OnModelCreatingSigafi(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profesore>(entity =>
        {
            entity.HasKey(e => e.IdProfesor).HasName("PRIMARY");
            entity.ToTable("profesores");

            entity.Property(e => e.IdProfesor).HasColumnName("idProfesor");
            entity.Property(e => e.Tipodocumento).HasColumnName("tipodocumento");
            entity.Property(e => e.Apellidos).HasColumnName("apellidos");
            entity.Property(e => e.Nombres).HasColumnName("nombres");
            entity.Property(e => e.PrimerApellido).HasColumnName("primerApellido");
            entity.Property(e => e.SegundoApellido).HasColumnName("segundoApellido");
            entity.Property(e => e.PrimerNombre).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasColumnName("segundoNombre");
            entity.Property(e => e.EstadoCivil).HasColumnName("estadoCivil");
            entity.Property(e => e.Direccion).HasColumnName("direccion");
            entity.Property(e => e.CallePrincipal).HasColumnName("callePrincipal");
            entity.Property(e => e.CalleSecundaria).HasColumnName("calleSecundaria");
            entity.Property(e => e.NumeroCasa).HasColumnName("numeroCasa");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Celular).HasColumnName("celular");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento");
            entity.Property(e => e.Sexo).HasColumnName("sexo");
            entity.Property(e => e.Clave).HasColumnName("clave");
            entity.Property(e => e.Practicas).HasColumnName("practicas");
            entity.Property(e => e.Tipo).HasColumnName("tipo");
            entity.Property(e => e.Nacionalidad).HasColumnName("nacionalidad");
            entity.Property(e => e.Titulo).HasColumnName("titulo");
            entity.Property(e => e.Abreviatura).HasColumnName("abreviatura");
            entity.Property(e => e.AbreviaturaPost).HasColumnName("abreviatura_post");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.IdEtnia).HasColumnName("idEtnia");
            entity.Property(e => e.IdNacionalidad).HasColumnName("idNacionalidad");
            entity.Property(e => e.IdParroquiaNacimiento).HasColumnName("idParroquiaNacimiento");
            entity.Property(e => e.EmailInstitucional).HasColumnName("emailInstitucional");
            entity.Property(e => e.FechaIngreso).HasColumnName("fecha_ingreso");
            entity.Property(e => e.FechaIngresoIess).HasColumnName("fechaIngresoIess");
            entity.Property(e => e.FechaRetiro).HasColumnName("fecha_retiro");
            entity.Property(e => e.IdParroquiaResidencia).HasColumnName("idParroquiaResidencia");
            entity.Property(e => e.TipoSangre).HasColumnName("tipoSangre");
            entity.Property(e => e.CodigoPostal).HasColumnName("codigoPostal");
            entity.Property(e => e.IdDiscapacidad).HasColumnName("idDiscapacidad");
            entity.Property(e => e.PorcentajeDiscapacidad).HasColumnName("porcentajeDiscapacidad");
            entity.Property(e => e.NumeroConadis).HasColumnName("numeroConadis");
            entity.Property(e => e.Foto).HasColumnName("foto");
            entity.Property(e => e.EsReal).HasColumnName("esReal");

            // Ignorar los que definitivamente no usaremos o sospechosos de relaciones rotas
            entity.Ignore(e => e.IdDiscapacidadNavigation);
            entity.Ignore(e => e.IdEtniaNavigation);
            entity.Ignore(e => e.ProfesoresDedicacions);
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<Alumno>(entity =>
        {
            entity.HasKey(e => e.IdAlumno).HasName("PRIMARY");
            entity.ToTable("alumnos");
            
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.TipoDocumento).HasColumnName("tipoDocumento");
            entity.Property(e => e.ApellidoPaterno).HasColumnName("apellidoPaterno");
            entity.Property(e => e.ApellidoMaterno).HasColumnName("apellidoMaterno");
            entity.Property(e => e.PrimerNombre).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasColumnName("segundoNombre");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_Nacimiento");
            entity.Property(e => e.Direccion).HasColumnName("direccion");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Celular).HasColumnName("celular");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.CiudadNacimiento).HasColumnName("ciudad_Nacimiento");
            entity.Property(e => e.ProvinciaNacimiento).HasColumnName("provincia_Nacimiento");
            entity.Property(e => e.Foto).HasColumnName("foto");
            entity.Property(e => e.Sexo).HasColumnName("sexo");
            entity.Property(e => e.Nacionalidad).HasColumnName("nacionalidad");
            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdPeriodo).HasColumnName("idPeriodo");
            entity.Property(e => e.IdSeccion).HasColumnName("idSeccion");
            entity.Property(e => e.IdModalidad).HasColumnName("idModalidad");
            entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion");
            entity.Property(e => e.TituloColegio).HasColumnName("tituloColegio");
            entity.Property(e => e.FechaInscripcion).HasColumnName("fecha_Inscripcion");
            entity.Property(e => e.ParroquiaNacimiento).HasColumnName("parroquia_nacimiento");
            entity.Property(e => e.NombrePadre).HasColumnName("nombre_padre");
            entity.Property(e => e.OcupacionPadre).HasColumnName("ocupacion_padre");
            entity.Property(e => e.NacionalidadPadre).HasColumnName("nacionalidad_padre");
            entity.Property(e => e.NombreMadre).HasColumnName("nombre_madre");
            entity.Property(e => e.OcupacionMadre).HasColumnName("ocupacion_madre");
            entity.Property(e => e.NacionalidadMadre).HasColumnName("nacionalidad_madre");
            entity.Property(e => e.BarrioResidencia).HasColumnName("barrio_residencia");
            entity.Property(e => e.ParroquiaResidencia).HasColumnName("parroquia_residencia");
            entity.Property(e => e.CiudadResidencia).HasColumnName("ciudad_residencia");
            entity.Property(e => e.TipoSangre).HasColumnName("tipo_sangre");
            entity.Property(e => e.UserAlumno).HasColumnName("user_alumno");
            entity.Property(e => e.Password).HasColumnName("password");
            entity.Property(e => e.IdDiscapacidad).HasColumnName("idDiscapacidad");
            entity.Property(e => e.IdEtnia).HasColumnName("idEtnia");
            entity.Property(e => e.IdNacionalidad).HasColumnName("idNacionalidad");
            entity.Property(e => e.PorcentajeDiscapacidad).HasColumnName("porcentaje_discapacidad");
            entity.Property(e => e.CarnetConadis).HasColumnName("carnet_conadis");
            entity.Property(e => e.EmailInstitucional).HasColumnName("email_institucional");
            entity.Property(e => e.PrimerIngreso).HasColumnName("primerIngreso");
            entity.Property(e => e.Archivofoto).HasColumnName("archivofoto");

            entity.Ignore(e => e.Matriculas);
        });

        modelBuilder.Entity<Periodo>(entity =>
        {
            entity.HasKey(e => e.IdPeriodo).HasName("PRIMARY");
            entity.ToTable("periodos");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.Detalle).HasMaxLength(100).HasColumnName("detalle");
            entity.Property(e => e.FechaInicial).HasColumnName("fecha_inicial");
            entity.Property(e => e.FechaFinal).HasColumnName("fecha_final");
            entity.Property(e => e.Cerrado).HasColumnName("cerrado");
            entity.Property(e => e.FechaMaximaAutocierre).HasColumnName("fecha_maxima_autocierre");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.Creditos).HasColumnName("creditos");
            entity.Property(e => e.NumeroPagos).HasColumnName("numero_pagos");
            entity.Property(e => e.FechaMatruclaExtraordinaria).HasColumnName("fecha_matrucla_extraordinaria");
            entity.Property(e => e.Foliop).HasColumnName("foliop");
            entity.Property(e => e.PermiteMatricula).HasColumnType("tinyint(4)").HasColumnName("permiteMatricula");
            entity.Property(e => e.IngresoCalificaciones).HasColumnType("tinyint(4)").HasColumnName("ingresoCalificaciones");
            entity.Property(e => e.PermiteCalificacionesInstituto).HasColumnType("tinyint(4)").HasColumnName("permiteCalificacionesInstituto");
            entity.Property(e => e.Periodoactivoinstituto).HasColumnType("tinyint(4)").HasColumnName("periodoactivoinstituto");
            entity.Property(e => e.VisualizaPowerBi).HasColumnType("tinyint(4)").HasColumnName("visualizaPowerBi");
            entity.Property(e => e.EsInstituto).HasColumnType("tinyint(4)").HasColumnName("esInstituto");
            entity.Property(e => e.PeriodoPlanificacion).HasColumnType("tinyint(4)").HasColumnName("periodoPlanificacion");

            entity.Ignore(e => e.Matriculas);
            entity.Ignore(e => e.ProfesoresDedicacions);
        });

        modelBuilder.Entity<Carrera>(entity =>
        {
            entity.HasKey(e => e.IdCarrera).HasName("PRIMARY");
            entity.ToTable("carreras");
            
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Carrera1).HasColumnName("Carrera");
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.DirectorCarrera).HasColumnName("directorCarrera");
            entity.Property(e => e.NumeroCreditos).HasColumnName("numero_creditos");
            entity.Property(e => e.OrdenCarrera).HasColumnName("ordenCarrera");
            entity.Property(e => e.NumeroAlumnos).HasColumnName("numero_alumnos");
            entity.Property(e => e.RevisaArrastres).HasColumnName("revisaArrastres");
            entity.Property(e => e.CodigoCases).HasColumnName("codigo_cases");
            entity.Property(e => e.AliasCarrera).HasColumnName("aliasCarrera");
            entity.Property(e => e.BolsaEmpleo).HasColumnName("BolsaEmpleo");
            entity.Property(e => e.EsInstituto).HasColumnName("esInstituto");

            entity.Ignore(e => e.Espacios);
        });

        modelBuilder.Entity<Departamento>(entity =>
        {
            entity.HasKey(e => e.Iddepartamentos).HasName("PRIMARY");
            entity.ToTable("departamentos");
            entity.Property(e => e.Iddepartamentos).HasColumnType("int(11)").HasColumnName("iddepartamentos");
            entity.Property(e => e.NombreDepartamento).HasMaxLength(90).HasColumnName("nombre_departamento");
        });

        modelBuilder.Entity<Espacio>(entity =>
        {
            entity.HasKey(e => e.IdEspacio).HasName("PRIMARY");
            entity.ToTable("espacios");
            entity.Property(e => e.IdEspacio).HasColumnType("int(11)").HasColumnName("idEspacio");
            entity.Property(e => e.Codigo).HasMaxLength(15).HasColumnName("codigo");
            entity.Property(e => e.Nombre).HasMaxLength(100).HasColumnName("nombre");
            entity.Property(e => e.Tipo).HasColumnType("enum('aula','laboratorio','taller','virtual','aula interactiva')").HasColumnName("tipo");
            entity.Property(e => e.Capacidad).HasColumnType("int(11)").HasColumnName("capacidad");
            entity.Ignore(e => e.IdCarreraNavigation);
        });

        modelBuilder.Entity<AsignacionesProfesore>(entity =>
        {
            entity.HasKey(e => e.IdAsignacion).HasName("PRIMARY");
            entity.ToTable("asignaciones_profesores");
            entity.Property(e => e.IdAsignacion).HasColumnType("int(11)").HasColumnName("idAsignacion");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.NumeroHoras).HasPrecision(10, 2).HasColumnName("numeroHoras");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Ignore(e => e.HorarioDetalles);
        });

        modelBuilder.Entity<HorarioDetalle>(entity =>
        {
            entity.HasKey(e => e.IdHorario).HasName("PRIMARY");
            entity.ToTable("horario_detalle");
            entity.Property(e => e.IdHorario).HasColumnType("int(11)").HasColumnName("idHorario");
            entity.Property(e => e.IdAsignacion).HasColumnType("int(11)").HasColumnName("idAsignacion");
            entity.Property(e => e.IdEspacio).HasColumnType("int(11)").HasColumnName("idEspacio");
            entity.Property(e => e.DiaSemana).HasColumnType("int(11)").HasColumnName("diaSemana");
            entity.Property(e => e.HoraInicio).HasColumnName("horaInicio");
            entity.Property(e => e.HoraFin).HasColumnName("horaFin");
            entity.Property(e => e.TipoBloque).HasColumnType("enum('teorico','practico','taller')").HasColumnName("tipoBloque");
            entity.Ignore(e => e.IdAsignacionNavigation);
            entity.Ignore(e => e.IdEspacioNavigation);
        });

        modelBuilder.Entity<FechasHorario>(entity =>
        {
            entity.HasKey(e => e.IdFecha).HasName("PRIMARY");
            entity.ToTable("fechas_horarios");
            entity.Property(e => e.IdFecha).HasColumnType("int(11)").HasColumnName("idFecha");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.Finsemana).HasColumnType("tinyint(4)").HasColumnName("finsemana");
            entity.Property(e => e.Dia).HasMaxLength(20).HasColumnName("dia");
        });

        modelBuilder.Entity<HorasClase>(entity =>
        {
            entity.HasKey(e => e.Idhora).HasName("PRIMARY");
            entity.ToTable("horas_clases");
            entity.Property(e => e.Idhora).HasColumnType("int(11)").HasColumnName("idhora");
            entity.Property(e => e.HoraInicio).HasMaxLength(5).HasColumnName("hora_inicio");
            entity.Property(e => e.HoraFin).HasMaxLength(5).HasColumnName("hora_fin");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
        });

        modelBuilder.Entity<Matricula>(entity =>
        {
            entity.HasKey(e => e.IdMatricula).HasName("PRIMARY");
            entity.ToTable("matriculas");

            entity.Property(e => e.IdMatricula).HasColumnName("idMatricula");
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdSeccion).HasColumnName("idSeccion");
            entity.Property(e => e.IdModalidad).HasColumnName("idModalidad");
            entity.Property(e => e.IdPeriodo).HasColumnName("idPeriodo");
            
            entity.Property(e => e.FechaMatricula).HasColumnName("fechaMatricula");
            entity.Property(e => e.Paralelo).HasColumnName("paralelo");
            entity.Property(e => e.Arrastres).HasColumnName("arrastres");
            entity.Property(e => e.Folio).HasColumnName("folio");
            
            entity.Property(e => e.BecaMatricula).HasColumnName("beca_matricula");
            entity.Property(e => e.BecaColegiatura).HasColumnName("beca_colegiatura");
            
            entity.Property(e => e.Retirado).HasColumnName("retirado");
            entity.Property(e => e.FechaRetiro).HasColumnName("fechaRetiro");
            entity.Property(e => e.Observacion).HasColumnName("observacion");
            entity.Property(e => e.Convalidacion).HasColumnName("convalidacion");
            entity.Property(e => e.CarreraConvalidada).HasColumnName("carrera_convalidada");
            entity.Property(e => e.NumeroPermiso).HasColumnName("numero_permiso");
            entity.Property(e => e.UserMatricula).HasColumnName("user_matricula");
            entity.Property(e => e.Valida).HasColumnName("valida");
            entity.Property(e => e.EsOyente).HasColumnName("esOyente");
            entity.Property(e => e.DocumentoFactura).HasColumnName("documentoFactura");

            entity.Ignore(e => e.IdAlumnoNavigation);
            entity.Ignore(e => e.IdPeriodoNavigation);
        });

        modelBuilder.Entity<Asignatura>(entity =>
        {
            entity.HasKey(e => e.IdAsignatura).HasName("PRIMARY");
            entity.ToTable("asignaturas");
            entity.Property(e => e.IdAsignatura).HasColumnType("int(11)").HasColumnName("idAsignatura");
            entity.Property(e => e.Asignatura1).HasMaxLength(200).HasColumnName("asignatura");
            entity.Property(e => e.Codigo).HasMaxLength(30).HasColumnName("codigo");
        });

        modelBuilder.Entity<Curso>(entity =>
        {
            entity.HasKey(e => e.IdNivel).HasName("PRIMARY");
            entity.ToTable("cursos");

            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Nivel).HasMaxLength(20).HasColumnName("Nivel");
            entity.Property(e => e.Jerarquia).HasColumnName("jerarquia");
            entity.Property(e => e.Orden).HasColumnName("orden");
            entity.Property(e => e.EsRecuperacion).HasColumnName("esRecuperacion");
            entity.Property(e => e.AliasCurso).HasMaxLength(5).HasColumnName("aliasCurso");
        });

        modelBuilder.Entity<TitulosProfesore>(entity =>
        {
            entity.HasKey(e => e.IdTitulosProfesor).HasName("PRIMARY");
            entity.ToTable("titulos_profesores");
            entity.Property(e => e.IdTitulosProfesor).HasColumnType("int(11)").HasColumnName("idTitulosProfesor");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.CodigoSenescyt).HasMaxLength(90).HasColumnName("codigo_senescyt");
            entity.Property(e => e.FechaObtencion).HasColumnName("fecha_obtencion");
            entity.Ignore(e => e.IdCampoDetalladoUnescoNavigation);
            entity.Ignore(e => e.IdGradoAcademicoNavigation);
            entity.Ignore(e => e.IdUniversidadNavigation);
            entity.Ignore(e => e.IdProfesorNavigation);
        });

        modelBuilder.Entity<GradosAcademico>(entity =>
        {
            entity.HasKey(e => e.IdGradoAcademico).HasName("PRIMARY");
            entity.ToTable("grados_academicos");
            entity.Property(e => e.IdGradoAcademico).HasColumnType("int(11)").HasColumnName("idGradoAcademico");
            entity.Property(e => e.Nombre).HasMaxLength(45).HasColumnName("nombre");
            entity.Ignore(e => e.IdNivelAcademicoNavigation);
        });

        modelBuilder.Entity<NivelesAcademico>(entity =>
        {
            entity.HasKey(e => e.IdNivelAcademico).HasName("PRIMARY");
            entity.ToTable("niveles_academicos");
            entity.Property(e => e.IdNivelAcademico).HasColumnType("int(11)").HasColumnName("idNivelAcademico");
            entity.Property(e => e.Nombre).HasMaxLength(60).HasColumnName("nombre");
        });

        modelBuilder.Entity<Universidade>(entity =>
        {
            entity.HasKey(e => e.IdUniversidad).HasName("PRIMARY");
            entity.ToTable("universidades");
            entity.Property(e => e.IdUniversidad).HasColumnType("int(11)").HasColumnName("idUniversidad");
            entity.Property(e => e.Nombre).HasMaxLength(150).HasColumnName("nombre");
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<ProfesoresActividade>(entity =>
        {
            entity.HasKey(e => new { e.IdPeriodo, e.IdProfesor, e.IdSubcategoria })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });
            entity.ToTable("profesores_actividades");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdSubcategoria).HasColumnType("int(11)").HasColumnName("idSubcategoria");
            entity.Property(e => e.HorasSemana).HasColumnType("int(11)").HasColumnName("horas_semana");
            entity.Ignore(e => e.IdSubcategoriaNavigation);
        });

        modelBuilder.Entity<SubcategoriasActividade>(entity =>
        {
            entity.HasKey(e => e.IdSubcategoria).HasName("PRIMARY");
            entity.ToTable("subcategorias_actividades");
            entity.Property(e => e.IdSubcategoria).HasColumnType("int(11)").HasColumnName("idSubcategoria");
            entity.Property(e => e.Subcategoria).HasMaxLength(100).HasColumnName("subcategoria");
            entity.Property(e => e.IdCategoria).HasColumnName("idCategoria");
            entity.Property(e => e.EsDocencia).HasColumnName("esDocencia");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Ignore(e => e.ProfesoresActividades);
        });

        modelBuilder.Entity<ProfesoresDedicacion>(entity =>
        {
            entity.HasKey(e => e.IdProfesoresDedicacion).HasName("PRIMARY");
            entity.ToTable("profesores_dedicacion");
            entity.Property(e => e.IdProfesoresDedicacion).HasColumnType("int(11)").HasColumnName("idProfesoresDedicacion");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.IdDedicacionCategorias).HasColumnName("idDedicacionCategorias");
            entity.Ignore(e => e.IdPeriodoNavigation);
            entity.Ignore(e => e.IdProfesorNavigation);
        });

        modelBuilder.Entity<Dedicacion>(entity =>
        {
            entity.HasKey(e => e.IdDedicacion).HasName("PRIMARY");
            entity.ToTable("dedicacion");
            entity.Property(e => e.IdDedicacion).HasColumnType("int(11)").HasColumnName("idDedicacion");
            entity.Property(e => e.Nombre).HasMaxLength(90).HasColumnName("nombre");
        });

        modelBuilder.Entity<CampoDetalladoUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampoDetalladoUnesco).HasName("PRIMARY");
            entity.ToTable("campo_detallado_unesco");
            entity.Property(e => e.IdCampoDetalladoUnesco).HasColumnType("int(11)").HasColumnName("idCampoDetalladoUnesco");
            entity.Property(e => e.NombreDetallado).HasMaxLength(100).HasColumnName("nombreDetallado");
            entity.Property(e => e.CodigoDetallado).HasMaxLength(10).HasColumnName("codigoDetallado");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Ignore(e => e.IdCampospecificoUnescoNavigation);
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<CampoEspecificoUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampospecificoUnesco).HasName("PRIMARY");
            entity.ToTable("campo_especifico_unesco");
            entity.Property(e => e.IdCampospecificoUnesco).HasColumnType("int(11)").HasColumnName("idCampospecificoUnesco");
            entity.Property(e => e.NombreEspecifico).HasMaxLength(100).HasColumnName("nombreEspecifico");
            entity.Property(e => e.CodigoEspecifico).HasMaxLength(10).HasColumnName("codigoEspecifico");
            entity.Ignore(e => e.IdCampoAmplioUnescoNavigation);
            entity.Ignore(e => e.CampoDetalladoUnescos);
        });

        modelBuilder.Entity<CampoAmplioUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampoAmplioUnesco).HasName("PRIMARY");
            entity.ToTable("campo_amplio_unesco");
            entity.Property(e => e.IdCampoAmplioUnesco).HasColumnType("int(11)").HasColumnName("idCampoAmplioUnesco");
            entity.Property(e => e.Nombre).HasMaxLength(100).HasColumnName("nombre");
            entity.Property(e => e.CodigoAmplio).HasMaxLength(10).HasColumnName("codigoAmplio");
            entity.Ignore(e => e.CampoEspecificoUnescos);
        });

        modelBuilder.Entity<Etnia>(entity =>
        {
            entity.HasKey(e => e.IdEtnia).HasName("PRIMARY");
            entity.ToTable("etnias");
            entity.Property(e => e.IdEtnia).HasColumnType("int(11)").HasColumnName("idEtnia");
            entity.Property(e => e.Etnia1).HasMaxLength(80).HasColumnName("etnia");
            entity.Ignore(e => e.Profesores);
        });

        modelBuilder.Entity<Discapacidade>(entity =>
        {
            entity.HasKey(e => e.IdDiscapacidad).HasName("PRIMARY");
            entity.ToTable("discapacidades");
            entity.Property(e => e.IdDiscapacidad).HasColumnType("int(11)").HasColumnName("idDiscapacidad");
            entity.Property(e => e.Discapacidad).HasMaxLength(150).HasColumnName("discapacidad");
            entity.Ignore(e => e.Profesores);
        });

        modelBuilder.Entity<InstitucionesInstituto>(entity =>
        {
            entity.HasKey(e => e.IdInstitucionesInstituto).HasName("PRIMARY");
            entity.ToTable("instituciones_instituto");
            entity.Property(e => e.IdInstitucionesInstituto).HasColumnType("int(11)").HasColumnName("idInstitucionesInstituto");
            entity.Property(e => e.Nombre).HasMaxLength(255).HasColumnName("nombre");
            entity.Property(e => e.Ruc).HasMaxLength(15).HasColumnName("ruc");
            entity.Property(e => e.Representante).HasMaxLength(90).HasColumnName("representante");
            entity.Property(e => e.CedulaRepresentante).HasMaxLength(14).HasColumnName("cedula_representante");
            entity.Property(e => e.Ubicado).HasMaxLength(255).HasColumnName("ubicado");
        });

        modelBuilder.Entity<HorasAcademica>(entity =>
        {
            entity.HasKey(e => e.IdHorasAcademicas).HasName("PRIMARY");
            entity.ToTable("horas_academicas");
            entity.Property(e => e.IdHorasAcademicas).HasColumnType("int(11)").HasColumnName("idHorasAcademicas");
            entity.Property(e => e.IdDedicacion).HasColumnType("int(11)").HasColumnName("idDedicacion");
            entity.Ignore(e => e.IdDedicacionNavigation);
        });

        modelBuilder.Entity<ProfesoresCarrerasPeriodo>(entity =>
        {
            entity.HasKey(e => e.IdProfesoresCarrerasPeriodos).HasName("PRIMARY");
            entity.ToTable("profesores_carreras_periodos");
            entity.Property(e => e.IdProfesoresCarrerasPeriodos).HasColumnType("int(11)").HasColumnName("idProfesoresCarrerasPeriodos");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdCarrera).HasColumnType("int(11)").HasColumnName("idCarrera");

            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.SonTodas).HasColumnType("tinyint(4)").HasColumnName("sonTodas").HasDefaultValueSql("'0'");

            entity.HasOne(d => d.IdCarreraNavigation).WithMany(p => p.ProfesoresCarrerasPeriodos)
                .HasForeignKey(d => d.IdCarrera)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_pcp_carreras");

            entity.HasOne(d => d.IdPeriodoNavigation).WithMany(p => p.ProfesoresCarrerasPeriodos)
                .HasForeignKey(d => d.IdPeriodo)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_pcp_periodos");

            entity.HasOne(d => d.IdProfesorNavigation).WithMany(p => p.ProfesoresCarrerasPeriodos)
                .HasForeignKey(d => d.IdProfesor)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_pcp_profesores");
        });

        modelBuilder.Entity<AlumnosCarrera>(entity =>
        {
            entity.HasKey(e => new { e.IdAlumno, e.IdCarrera })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
            entity.ToTable("alumnos_carreras");
            
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Convalidacion).HasColumnName("convalidacion");
            entity.Property(e => e.CarreraConvalidada).HasColumnName("carrera_convalidada");
            entity.Property(e => e.InstitucionConvalidada).HasColumnName("institucion_convalidada");
            entity.Property(e => e.CreditosConvalidados).HasColumnName("creditos_convalidados");
            entity.Property(e => e.Pasantias).HasColumnName("pasantias");
            entity.Property(e => e.NotaPasantia).HasColumnName("nota_pasantia");
            entity.Property(e => e.CreditosPasantia).HasColumnName("creditos_pasantia");
            entity.Property(e => e.TrabajoGrado).HasColumnName("trabajo_grado");
            entity.Property(e => e.NotaDocumento).HasColumnName("nota_documento");
            entity.Property(e => e.NotaDefensa).HasColumnName("nota_defensa");
            entity.Property(e => e.NotaTesis).HasColumnName("nota_tesis");
            entity.Property(e => e.CreditosTitulo).HasColumnName("creditos_titulo");
        });

        modelBuilder.Entity<Parametro>(entity =>
        {
            entity.HasNoKey();
            entity.ToTable("parametros");
            entity.Property(e => e.NombreInstitucion).HasMaxLength(150).HasColumnName("nombreInstitucion");
            entity.Property(e => e.NombreRector).HasMaxLength(200).HasColumnName("nombreRector");
            entity.Property(e => e.ArchivoFirma).HasMaxLength(150).HasColumnName("archivoFirma");
            entity.Property(e => e.ArchivoSello).HasMaxLength(150).HasColumnName("archivoSello");
            entity.Property(e => e.CodigoInstitucion).HasMaxLength(10).HasColumnName("codigo_institucion");
        });
    }
}
