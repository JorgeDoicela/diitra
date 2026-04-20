CREATE TABLE `adjuntos_imagenes` (
  `idAdjuntos_Imagenes` int(11) NOT NULL AUTO_INCREMENT,
  `NombreArchivos` varchar(90) DEFAULT NULL,
  `Extension` varchar(90) DEFAULT NULL,
  `MimeTypes` varchar(90) DEFAULT NULL,
  `TamanioBytes` int(11) DEFAULT NULL,
  `Ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idAdjuntos_Imagenes`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
CREATE TABLE `administrador` (
  `idAdministrador` varchar(16) NOT NULL,
  `NombresCompletos` varchar(120) DEFAULT NULL,
  `ApellidosCompletos` varchar(120) DEFAULT NULL,
  `password` varchar(90) DEFAULT NULL,
  `esAdministrador` tinyint(4) DEFAULT NULL,
  `fecha_Asignacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `primerIngreso` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAdministrador`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `agenda_academica` (
  `idperiodo` varchar(7) DEFAULT NULL,
  `fecha_desde` date DEFAULT NULL,
  `fecha_hasta` date DEFAULT NULL,
  `evento` varchar(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos` (
  `idAlumno` varchar(14) NOT NULL DEFAULT '',
  `tipoDocumento` char(1) DEFAULT NULL,
  `apellidoPaterno` varchar(30) DEFAULT NULL,
  `apellidoMaterno` varchar(30) DEFAULT NULL,
  `primerNombre` varchar(30) DEFAULT NULL,
  `segundoNombre` varchar(30) DEFAULT NULL,
  `fecha_Nacimiento` date DEFAULT NULL,
  `direccion` varchar(60) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `email` varchar(40) DEFAULT NULL,
  `ciudad_Nacimiento` varchar(30) DEFAULT NULL,
  `provincia_Nacimiento` varchar(40) DEFAULT NULL,
  `foto` longblob,
  `sexo` char(1) DEFAULT NULL,
  `nacionalidad` varchar(50) DEFAULT NULL,
  `idNivel` int(11) DEFAULT '1',
  `idPeriodo` char(7) DEFAULT NULL,
  `idSeccion` int(11) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `idInstitucion` int(11) DEFAULT NULL,
  `tituloColegio` varchar(200) DEFAULT NULL,
  `fecha_Inscripcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `parroquia_nacimiento` varchar(100) DEFAULT NULL,
  `nombre_padre` varchar(150) DEFAULT NULL,
  `ocupacion_padre` varchar(150) DEFAULT NULL,
  `nacionalidad_padre` varchar(30) DEFAULT NULL,
  `nombre_madre` varchar(150) DEFAULT NULL,
  `ocupacion_madre` varchar(150) DEFAULT NULL,
  `nacionalidad_madre` varchar(150) DEFAULT NULL,
  `barrio_residencia` varchar(150) DEFAULT NULL,
  `parroquia_residencia` varchar(150) DEFAULT NULL,
  `ciudad_residencia` varchar(100) DEFAULT NULL,
  `tipo_sangre` varchar(6) DEFAULT NULL,
  `user_alumno` varchar(20) DEFAULT NULL,
  `password` varchar(20) DEFAULT NULL,
  `idDiscapacidad` int(11) DEFAULT NULL,
  `idEtnia` int(11) DEFAULT NULL,
  `idNacionalidad` int(11) DEFAULT NULL,
  `porcentaje_discapacidad` int(11) DEFAULT NULL,
  `carnet_conadis` varchar(20) DEFAULT NULL,
  `email_institucional` varchar(100) DEFAULT NULL,
  `primerIngreso` tinyint(4) DEFAULT '1',
  `archivofoto` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idAlumno`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_acta_conduccion` (
  `idalumno` varchar(14) NOT NULL,
  `numero_acta` int(11) DEFAULT NULL,
  `fecha_grado` date DEFAULT NULL,
  `idperiodo` varchar(7) NOT NULL,
  PRIMARY KEY (`idalumno`,`idperiodo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_carreras` (
  `idAlumno` varchar(14) NOT NULL,
  `idCarrera` int(11) NOT NULL,
  `convalidacion` tinyint(4) DEFAULT '0',
  `carrera_convalidada` varchar(100) DEFAULT NULL,
  `institucion_convalidada` varchar(100) DEFAULT NULL,
  `creditos_convalidados` int(11) DEFAULT '0',
  `pasantias` tinyint(4) DEFAULT '0',
  `nota_pasantia` decimal(5,2) DEFAULT '0.00',
  `creditos_pasantia` int(11) DEFAULT '0',
  `trabajo_grado` tinyint(4) DEFAULT '0',
  `nota_documento` decimal(5,2) DEFAULT '0.00',
  `nota_defensa` decimal(5,2) DEFAULT '0.00',
  `nota_tesis` decimal(5,2) DEFAULT '0.00',
  `creditos_titulo` int(11) DEFAULT NULL,
  PRIMARY KEY (`idAlumno`,`idCarrera`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_habilidades` (
  `idalumnos_habilidades` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) DEFAULT NULL,
  `idhabilidades` int(11) NOT NULL,
  `nivel` enum('basico','intermedio','avanzado') DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idalumnos_habilidades`),
  KEY `idhabilidades` (`idhabilidades`),
  CONSTRAINT `alumnos_habilidades_ibfk_1` FOREIGN KEY (`idhabilidades`) REFERENCES `habilidades` (`idhabilidades`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_inscripciones` (
  `idInscripcion` int(11) NOT NULL AUTO_INCREMENT,
  `idalumno` varchar(14) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `idNivel` int(11) DEFAULT NULL,
  `idSeccion` int(11) DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(20) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `idMedio` int(11) DEFAULT NULL,
  PRIMARY KEY (`idInscripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=5612 DEFAULT CHARSET=utf8;
CREATE TABLE `alumnos_inscripciones_ingles` (
  `idAlumno` varchar(14) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_inscripcion` varchar(20) DEFAULT NULL,
  `puntaje` decimal(18,2) DEFAULT NULL,
  `idAsignatura` int(11) DEFAULT NULL,
  `idMalla` int(11) DEFAULT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idAlumno`,`idPeriodo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_referencias` (
  `idalumnos_referencias` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) NOT NULL,
  `nombres_referencia` varchar(255) DEFAULT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `referencia_empresa` varchar(150) DEFAULT NULL,
  `relacion` varchar(100) DEFAULT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  PRIMARY KEY (`idalumnos_referencias`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_restricciones` (
  `idalumno` varchar(14) NOT NULL,
  `idrestriccion` varchar(5) NOT NULL,
  PRIMARY KEY (`idalumno`,`idrestriccion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_sucesos` (
  `idSuceso` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) DEFAULT NULL,
  `idMatricula` int(11) DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `observacion` varchar(200) NOT NULL,
  `usuario` varchar(100) DEFAULT 'current_user',
  PRIMARY KEY (`idSuceso`)
) ENGINE=InnoDB AUTO_INCREMENT=5230 DEFAULT CHARSET=latin1;
CREATE TABLE `alumnos_titulos` (
  `idAlumno` varchar(14) NOT NULL,
  `idTitulo` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_acta` date DEFAULT NULL,
  `numero_acta` varchar(20) DEFAULT NULL,
  `primer_vocal` varchar(100) DEFAULT NULL,
  `segundo_vocal` varchar(100) DEFAULT NULL,
  `tercer_vocal` varchar(100) DEFAULT NULL,
  `secretaria` varchar(100) DEFAULT NULL,
  `rector` varchar(100) DEFAULT NULL,
  `vicerrector` varchar(100) DEFAULT NULL,
  `total_creditos` int(11) DEFAULT '0',
  `total_asignaturas` int(11) DEFAULT '0',
  `total_horas` int(11) DEFAULT '0',
  `puntaje_total` decimal(5,2) DEFAULT '0.00',
  `nota_final` decimal(5,2) DEFAULT '0.00',
  `titulo_tesis` varchar(400) DEFAULT NULL,
  `codigo_sistema` int(11) DEFAULT NULL,
  `promedio_estudios` decimal(5,2) DEFAULT '0.00',
  `nota_trabajo` decimal(5,2) DEFAULT '0.00',
  `nota_defensa` decimal(5,2) DEFAULT '0.00',
  `nota_complexivo` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`idAlumno`,`idTitulo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `asignacion_instructores_vehiculos` (
  `idAsignacion` int(11) NOT NULL AUTO_INCREMENT,
  `idVehiculo` int(11) NOT NULL,
  `idProfesor` varchar(14) NOT NULL,
  `fecha_asignacion` date DEFAULT NULL,
  `fecha_salidad` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `usuario_asigna` varchar(20) DEFAULT NULL,
  `usuario_desactiva` varchar(20) DEFAULT NULL,
  `observacion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`idAsignacion`)
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=latin1;
CREATE TABLE `asignaciones_profesores` (
  `idProfesor` varchar(14) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `idModalidad` int(11) NOT NULL,
  `idSeccion` int(11) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `paralelo` char(1) NOT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `fecha_grabar` datetime DEFAULT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  `codigo_asignacion` varchar(10) DEFAULT NULL,
  `entrega_acta` tinyint(4) DEFAULT '0',
  `ingresa_notas` tinyint(4) DEFAULT '0',
  `user_asignaciones` varchar(25) DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `fecha_inicial` date DEFAULT NULL,
  `user_acta` varchar(25) DEFAULT NULL,
  `idAsignacion` int(11) NOT NULL AUTO_INCREMENT,
  `esActivaAsignacion` tinyint(4) DEFAULT '1',
  `numeroHoras` decimal(10,2) DEFAULT NULL,
  `contabilizarHoraDocente` tinyint(4) DEFAULT '1',
  `horasPracticoExperimental` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`idProfesor`,`idAsignatura`,`idPeriodo`,`idModalidad`,`idSeccion`,`idNivel`,`paralelo`),
  UNIQUE KEY `idAsignacion` (`idAsignacion`)
) ENGINE=InnoDB AUTO_INCREMENT=24173 DEFAULT CHARSET=latin1;
CREATE TABLE `asignaciones_profesores_grado` (
  `idProfesor` varchar(14) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `idModalidad` int(11) NOT NULL,
  `idSeccion` int(11) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `paralelo` char(1) NOT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProfesor`,`idAsignatura`,`idPeriodo`,`idModalidad`,`idSeccion`,`idNivel`,`paralelo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `asignaciones_propedeutico` (
  `idCarrera` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `activa` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCarrera`,`idAsignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `asignaturas` (
  `idAsignatura` int(11) NOT NULL AUTO_INCREMENT,
  `asignatura` varchar(200) DEFAULT NULL,
  `anulada` tinyint(1) DEFAULT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`idAsignatura`)
) ENGINE=InnoDB AUTO_INCREMENT=609 DEFAULT CHARSET=latin1;
CREATE TABLE `asignaturas_complementos_formacion` (
  `idAsignatura` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) DEFAULT NULL,
  `asignatura` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAsignatura`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
CREATE TABLE `asignaturas_propedeutico` (
  `idAsignatura` int(11) NOT NULL AUTO_INCREMENT,
  `asignatura` varchar(50) DEFAULT NULL,
  `activa` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAsignatura`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
CREATE TABLE `auditoria_pagos` (
  `idpago` int(11) DEFAULT NULL,
  `idmatricula` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `numero_deposito` varchar(20) DEFAULT NULL,
  `cuenta` varchar(50) DEFAULT NULL,
  `valor` float DEFAULT NULL,
  `num_registro` int(11) DEFAULT NULL,
  `usuario` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `calificaciones` (
  `idMatricula` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idNivel` int(11) DEFAULT NULL,
  `paralelo` varchar(10) DEFAULT NULL,
  `idSeccion` int(11) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `ef1` decimal(4,2) DEFAULT '0.00',
  `ep1` decimal(4,2) DEFAULT '0.00',
  `nota1` decimal(4,2) DEFAULT '0.00',
  `faltasi1` int(11) DEFAULT '0',
  `faltasj1` int(11) DEFAULT '0',
  `ef2` decimal(4,2) DEFAULT '0.00',
  `ep2` decimal(4,2) DEFAULT '0.00',
  `nota2` decimal(4,2) DEFAULT '0.00',
  `faltasi2` int(11) DEFAULT '0',
  `faltasj2` int(11) DEFAULT '0',
  `nota3` decimal(4,2) DEFAULT '0.00',
  `faltasi3` int(11) DEFAULT '0',
  `faltasj3` int(11) DEFAULT '0',
  `nota4` decimal(4,2) DEFAULT '0.00',
  `faltasi4` int(11) DEFAULT '0',
  `faltasj4` int(11) DEFAULT '0',
  `nota5` decimal(4,2) DEFAULT '0.00',
  `horas_asistidas` int(11) DEFAULT '0',
  `remedial_parcial` decimal(4,2) DEFAULT '0.00',
  `promedio_parcial` decimal(4,2) DEFAULT '0.00',
  `examen` decimal(4,2) DEFAULT '0.00',
  `remedial_final` decimal(4,2) DEFAULT '0.00',
  `promedio_final` decimal(4,2) DEFAULT '0.00',
  `nota_final` decimal(4,2) DEFAULT '0.00',
  `aprobado` tinyint(1) DEFAULT '0',
  `remedial` tinyint(1) DEFAULT '0',
  `observacion` varchar(100) DEFAULT NULL,
  `tipo` varchar(4) DEFAULT NULL,
  `pierde_faltas` tinyint(4) DEFAULT '0',
  `codigoSolicitud` varchar(20) DEFAULT NULL,
  `fechaMaximaRemedial` date DEFAULT NULL,
  PRIMARY KEY (`idAsignatura`,`idMatricula`),
  KEY `R_30` (`idMatricula`),
  CONSTRAINT `calificaciones_ibfk_1` FOREIGN KEY (`idAsignatura`) REFERENCES `asignaturas` (`idAsignatura`),
  CONSTRAINT `calificaciones_ibfk_2` FOREIGN KEY (`idMatricula`) REFERENCES `matriculas` (`idMatricula`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `calificaciones_complementos_formacion` (
  `idAlumno` varchar(14) NOT NULL,
  `idComplemento` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `notaFinal` decimal(5,2) DEFAULT '0.00',
  `aprobado` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idAlumno`,`idComplemento`,`idAsignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `calificaciones_conduccion` (
  `idmatricula` int(11) DEFAULT NULL,
  `nota_final` int(11) DEFAULT NULL,
  `aprobado` tinyint(1) DEFAULT '0',
  `observacion` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `calificaciones_grado` (
  `idMatricula` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `nota` decimal(4,2) DEFAULT '0.00',
  `aprobado` tinyint(1) DEFAULT '0',
  `fecha_evaluacion` date DEFAULT NULL,
  PRIMARY KEY (`idMatricula`,`idAsignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `calificaciones_propedeutico` (
  `idAlumno` varchar(14) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `nota1` decimal(10,0) DEFAULT NULL,
  `aprobado` tinyint(4) DEFAULT '0',
  `observacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idAlumno`,`idAsignatura`,`idPeriodo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `cambiosmalla` (
  `idCambioMalla` int(11) NOT NULL AUTO_INCREMENT,
  `idMalla` int(11) NOT NULL,
  `Fecha` date DEFAULT NULL,
  `Cambio` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCambioMalla`),
  KEY `R_16` (`idMalla`),
  CONSTRAINT `cambiosmalla_ibfk_1` FOREIGN KEY (`idMalla`) REFERENCES `mallas` (`idMalla`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `campo_amplio_unesco` (
  `idCampoAmplioUnesco` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `codigoAmplio` varchar(10) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCampoAmplioUnesco`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
CREATE TABLE `campo_detallado_unesco` (
  `idCampoDetalladoUnesco` int(11) NOT NULL AUTO_INCREMENT,
  `idCampospecificoUnesco` int(11) DEFAULT NULL,
  `nombreDetallado` varchar(100) DEFAULT NULL,
  `codigoDetallado` varchar(10) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCampoDetalladoUnesco`),
  KEY `idCampospecificoUnesco` (`idCampospecificoUnesco`),
  CONSTRAINT `campo_detallado_unesco_ibfk_1` FOREIGN KEY (`idCampospecificoUnesco`) REFERENCES `campo_especifico_unesco` (`idCampospecificoUnesco`)
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=latin1;
CREATE TABLE `campo_especifico_unesco` (
  `idCampospecificoUnesco` int(11) NOT NULL AUTO_INCREMENT,
  `idCampoAmplioUnesco` int(11) DEFAULT NULL,
  `nombreEspecifico` varchar(100) DEFAULT NULL,
  `codigoEspecifico` varchar(10) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCampospecificoUnesco`),
  KEY `idCampoAmplioUnesco` (`idCampoAmplioUnesco`),
  CONSTRAINT `campo_especifico_unesco_ibfk_1` FOREIGN KEY (`idCampoAmplioUnesco`) REFERENCES `campo_amplio_unesco` (`idCampoAmplioUnesco`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
CREATE TABLE `cargo_instituto` (
  `idCargoInstituto` int(11) NOT NULL AUTO_INCREMENT,
  `idTipoFuncionario` int(11) NOT NULL,
  `nombre` varchar(90) DEFAULT NULL,
  `disponibilidad_cargo` int(11) DEFAULT NULL,
  PRIMARY KEY (`idCargoInstituto`),
  KEY `fk_cargo_instituto_tipo_funcionario1_idx` (`idTipoFuncionario`),
  CONSTRAINT `fk_cargo_instituto_tipo_funcionario1` FOREIGN KEY (`idTipoFuncionario`) REFERENCES `tipo_funcionario` (`idTipoFuncionario`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `cargos_ofertas` (
  `idcargos_ofertas` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_cargo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idcargos_ofertas`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `carreras` (
  `idCarrera` int(11) NOT NULL AUTO_INCREMENT,
  `Carrera` varchar(100) DEFAULT NULL,
  `fechaCreacion` date DEFAULT NULL,
  `activa` tinyint(1) DEFAULT NULL,
  `directorCarrera` varchar(100) DEFAULT NULL,
  `numero_creditos` int(11) DEFAULT NULL,
  `ordenCarrera` int(11) DEFAULT '0',
  `numero_alumnos` int(11) DEFAULT NULL,
  `revisaArrastres` tinyint(4) DEFAULT '1',
  `codigo_cases` varchar(20) DEFAULT NULL,
  `aliasCarrera` varchar(5) DEFAULT NULL,
  `BolsaEmpleo` tinyint(1) DEFAULT NULL,
  `esInstituto` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idCarrera`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=latin1;
CREATE TABLE `carreras_adjuntos` (
  `idCarrerasAdjuntos` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) NOT NULL,
  `idAdjuntos_Imagenes` int(11) NOT NULL,
  PRIMARY KEY (`idCarrerasAdjuntos`),
  KEY `idCarrera` (`idCarrera`),
  KEY `idAdjuntos_Imagenes` (`idAdjuntos_Imagenes`),
  CONSTRAINT `carreras_adjuntos_ibfk_1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`),
  CONSTRAINT `carreras_adjuntos_ibfk_2` FOREIGN KEY (`idAdjuntos_Imagenes`) REFERENCES `adjuntos_imagenes` (`idAdjuntos_Imagenes`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `categoria_contratos` (
  `idCategoriaContratos` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`idCategoriaContratos`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `categoria_vehiculos` (
  `idCategoria` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
CREATE TABLE `categorias_actividades` (
  `idCategoria` int(7) NOT NULL AUTO_INCREMENT,
  `categoria` varchar(100) NOT NULL,
  `esDocencia` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  `porcentaje` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `categorias_examenes_conduccion` (
  `IdCategoria` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` varchar(100) DEFAULT NULL,
  `tieneNota` tinyint(4) DEFAULT '0',
  `activa` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`IdCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `categoriassolicitudes` (
  `idCategoriaSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCategoriaSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `certificados_experiencia_laboral` (
  `idcertificados_experiencia_laboral` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) NOT NULL,
  `fecha_emision` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `generado_automaticamente` tinyint(4) NOT NULL DEFAULT '0',
  `ruta` varchar(500) DEFAULT NULL,
  `esActivo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idcertificados_experiencia_laboral`),
  KEY `fk_certificados_experiencia_laboral_profesores1_idx` (`idProfesor`),
  CONSTRAINT `fk_certificados_experiencia_laboral_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `ciudades` (
  `idciudades` int(11) NOT NULL AUTO_INCREMENT,
  `idprovincias` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idciudades`),
  KEY `fk_cuidades_provincias1_idx` (`idprovincias`),
  CONSTRAINT `fk_cuidades_provincias1` FOREIGN KEY (`idprovincias`) REFERENCES `provincias` (`idprovincias`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=772 DEFAULT CHARSET=latin1;
CREATE TABLE `clausulas` (
  `idClausulas` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_clausula` varchar(150) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idClausulas`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
CREATE TABLE `cliente_factura` (
  `documentoFactura` varchar(14) NOT NULL,
  `tipoDocumento` varchar(1) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `telefono` varchar(10) DEFAULT NULL,
  `email` varchar(60) DEFAULT NULL,
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`documentoFactura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `complementos_formacion` (
  `idComplemento` int(11) NOT NULL,
  `complemento` varchar(60) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idComplemento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `cond_alumnos_horarios` (
  `idAsignacionHorario` int(11) NOT NULL AUTO_INCREMENT,
  `idAsignacion` int(11) NOT NULL,
  `idFecha` int(11) NOT NULL,
  `idHora` int(11) NOT NULL,
  `asiste` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  `observacion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idAsignacionHorario`)
) ENGINE=InnoDB AUTO_INCREMENT=163838 DEFAULT CHARSET=latin1;
CREATE TABLE `cond_alumnos_practicas` (
  `idPractica` int(11) NOT NULL AUTO_INCREMENT,
  `idalumno` varchar(14) NOT NULL,
  `idvehiculo` int(11) NOT NULL,
  `idProfesor` varchar(14) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `dia` varchar(15) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora_salida` time DEFAULT NULL,
  `hora_llegada` time DEFAULT NULL,
  `tiempo` time DEFAULT NULL,
  `ensalida` tinyint(1) DEFAULT '0',
  `verificada` tinyint(1) DEFAULT '0',
  `user_asigna` varchar(20) DEFAULT NULL,
  `user_llegada` varchar(20) DEFAULT NULL,
  `cancelado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`idPractica`)
) ENGINE=InnoDB AUTO_INCREMENT=73165 DEFAULT CHARSET=latin1;
CREATE TABLE `cond_alumnos_vehiculos` (
  `idAsignacion` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) NOT NULL,
  `idVehiculo` int(11) NOT NULL,
  `idPeriodo` varchar(7) NOT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fechaAsignacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaInicio` date DEFAULT NULL,
  `fechaFin` date DEFAULT NULL,
  `activa` tinyint(4) DEFAULT '1',
  `observacion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`idAsignacion`)
) ENGINE=InnoDB AUTO_INCREMENT=19375 DEFAULT CHARSET=latin1;
CREATE TABLE `cond_practicas_horarios_alumnos` (
  `idPractica` int(11) NOT NULL,
  `idAsignacionHorario` int(11) NOT NULL,
  PRIMARY KEY (`idPractica`,`idAsignacionHorario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `configsharepoint` (
  `idSharePoint` int(11) NOT NULL AUTO_INCREMENT,
  `ClientID` varchar(225) NOT NULL,
  `TenanID` varchar(255) NOT NULL,
  `ClientSecret` varchar(255) NOT NULL,
  `AppID` varchar(255) NOT NULL,
  `RedirectURL` varchar(255) NOT NULL,
  `TenantName` varchar(100) NOT NULL,
  `SiteName` varchar(100) NOT NULL,
  `SiteID` varchar(255) NOT NULL,
  `ListID` varchar(255) NOT NULL,
  `DriveID` varchar(255) NOT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `FechaCreado` date DEFAULT NULL,
  `FechaActualizado` date DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idSharePoint`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `contratos` (
  `idContratos` int(11) NOT NULL AUTO_INCREMENT,
  `idInstitucionesInstituto` int(11) NOT NULL,
  `idProfesor` varchar(14) NOT NULL,
  `idDedicacionCategorias` int(11) NOT NULL,
  `idTiposContratos` int(11) DEFAULT NULL,
  `idRelacionIes` int(11) DEFAULT NULL,
  `iddepartamentos` int(11) DEFAULT NULL,
  `idCargoInstituto` int(11) DEFAULT NULL,
  `numeroContrato` varchar(90) DEFAULT NULL,
  `esAdendum` tinyint(4) DEFAULT NULL,
  `contratoVinculado` varchar(255) DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_final` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `archivoContrato` varchar(900) DEFAULT NULL,
  `archivoLegalizado` varchar(900) DEFAULT NULL,
  `archivoFiniquito` varchar(900) DEFAULT NULL,
  `archivoLegalizadoSalida` varchar(900) DEFAULT NULL,
  `ingreso_concurso` tinyint(4) DEFAULT NULL,
  `usuario_creo` varchar(50) CHARACTER SET utf8 NOT NULL,
  `usuarios_modifico` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `fecha_modifico` date DEFAULT NULL,
  PRIMARY KEY (`idContratos`),
  KEY `fk_contratos_tipos_contratos1_idx` (`idTiposContratos`),
  KEY `fk_contratos_relacion_ies1_idx` (`idRelacionIes`),
  KEY `fk_contratos_profesores1_idx` (`idProfesor`),
  KEY `fk_contratos_instituciones_instituto1_idx` (`idInstitucionesInstituto`),
  KEY `fk_contratos_usuarios1_idx` (`usuario_creo`),
  KEY `fk_contratos_usuarios2_idx` (`usuarios_modifico`),
  KEY `fk_contratos_dedicacion_categorias1_idx` (`idDedicacionCategorias`),
  KEY `fk_contratos_cargo_instituto1_idx` (`idCargoInstituto`),
  KEY `fk_contratos_departamentos1_idx` (`iddepartamentos`),
  CONSTRAINT `fk_contratos_dedicacion_categorias1` FOREIGN KEY (`idDedicacionCategorias`) REFERENCES `dedicacion_categorias` (`idDedicacionCategorias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_contratos_instituciones_instituto1` FOREIGN KEY (`idInstitucionesInstituto`) REFERENCES `instituciones_instituto` (`idInstitucionesInstituto`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_contratos_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=latin1;
CREATE TABLE `contratos_asignaturas` (
  `idContratosAsignaturas` int(11) NOT NULL AUTO_INCREMENT,
  `idContratos` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idPeriodo` char(7) NOT NULL,
  `horas` int(11) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idContratosAsignaturas`),
  KEY `fk_contratos_asignaturas_contratos1_idx` (`idContratos`),
  KEY `fk_contratos_asignaturas_asignaturas1_idx` (`idAsignatura`),
  KEY `fk_contratos_asignaturas_periodos1_idx` (`idPeriodo`),
  CONSTRAINT `fk_contratos_asignaturas_asignaturas1` FOREIGN KEY (`idAsignatura`) REFERENCES `asignaturas` (`idAsignatura`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_contratos_asignaturas_contratos1` FOREIGN KEY (`idContratos`) REFERENCES `contratos` (`idContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_contratos_asignaturas_periodos1` FOREIGN KEY (`idPeriodo`) REFERENCES `periodos` (`idPeriodo`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `credito_alumno` (
  `idMatricula` int(11) NOT NULL,
  `idEspecie` int(11) NOT NULL,
  `credito_inicial` decimal(8,2) DEFAULT NULL,
  `saldo` decimal(8,2) DEFAULT NULL,
  `beca` decimal(8,2) DEFAULT NULL,
  `saldo_beca` decimal(8,2) DEFAULT NULL,
  `numero_cuotas` int(11) DEFAULT NULL,
  `valor_cuotas` decimal(8,2) DEFAULT NULL,
  `idCredito` int(11) NOT NULL AUTO_INCREMENT,
  `migradoContabilidad` tinyint(4) DEFAULT '0',
  `fechaMigracion` datetime DEFAULT NULL,
  `idDeudaApi` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`idMatricula`,`idEspecie`),
  KEY `idCredito` (`idCredito`)
) ENGINE=InnoDB AUTO_INCREMENT=118314 DEFAULT CHARSET=latin1;
CREATE TABLE `cuentas` (
  `idCuenta` int(11) NOT NULL AUTO_INCREMENT,
  `cuenta` varchar(100) NOT NULL,
  `numero_cuenta` varchar(20) NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `esingreso` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `tipo_pago` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`idCuenta`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
CREATE TABLE `cursos` (
  `idNivel` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) NOT NULL,
  `Nivel` varchar(20) DEFAULT NULL,
  `jerarquia` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `esRecuperacion` tinyint(4) DEFAULT '0',
  `aliasCurso` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`idNivel`),
  KEY `R_5` (`idCarrera`),
  CONSTRAINT `cursos_ibfk_1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=latin1;
CREATE TABLE `cursos_profesores` (
  `idCursoProfesor` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) NOT NULL,
  `nombre_curso` varchar(255) DEFAULT NULL,
  `Institucion` varchar(200) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_finalizacion` date DEFAULT NULL,
  `numero_horas` int(11) DEFAULT NULL,
  `esValido` tinyint(4) DEFAULT NULL,
  `archivoCurso` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idCursoProfesor`),
  KEY `fk_cursos_profesores_profesores1_idx` (`idProfesor`),
  CONSTRAINT `fk_cursos_profesores_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `dedicacion` (
  `idDedicacion` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`idDedicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `dedicacion_categorias` (
  `idDedicacionCategorias` int(11) NOT NULL AUTO_INCREMENT,
  `idDedicacion` int(11) NOT NULL,
  `idEscalafon` int(11) NOT NULL,
  `horasMinimas` int(11) DEFAULT NULL,
  `horasMaximas` int(11) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idDedicacionCategorias`),
  KEY `fk_dedicacion_categorias_dedicacion1_idx` (`idDedicacion`),
  KEY `fk_dedicacion_categorias_escalafon1_idx` (`idEscalafon`),
  CONSTRAINT `fk_dedicacion_categorias_dedicacion1` FOREIGN KEY (`idDedicacion`) REFERENCES `dedicacion` (`idDedicacion`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_dedicacion_categorias_escalafon1` FOREIGN KEY (`idEscalafon`) REFERENCES `escalafon` (`idEscalafon`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;
CREATE TABLE `departamentos` (
  `iddepartamentos` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(90) DEFAULT NULL,
  `abreviacion` varchar(45) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`iddepartamentos`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
CREATE TABLE `departamentossolicitudes` (
  `idDepartamentoSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `departamento` varchar(60) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idDepartamentoSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `detalle_pagos` (
  `idPago` int(11) NOT NULL,
  `idEspecie` int(11) NOT NULL,
  `valor` decimal(8,2) DEFAULT NULL,
  `descuento` decimal(8,2) DEFAULT NULL,
  `idCredito` int(11) DEFAULT NULL,
  `migradoContabilidad` tinyint(4) DEFAULT '0',
  `fechaMigracion` datetime DEFAULT NULL,
  PRIMARY KEY (`idPago`,`idEspecie`),
  KEY `R_36` (`idEspecie`),
  CONSTRAINT `detalle_pagos_ibfk_1` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`),
  CONSTRAINT `detalle_pagos_ibfk_2` FOREIGN KEY (`idEspecie`) REFERENCES `especies` (`idEspecie`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `detalle_sistema_evaluacion` (
  `idperiodo` varchar(7) NOT NULL,
  `idcarrera` int(11) NOT NULL,
  `idsistemaevaluacion` int(11) NOT NULL,
  PRIMARY KEY (`idperiodo`,`idcarrera`,`idsistemaevaluacion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `detallemallas` (
  `idDetalleMalla` int(11) NOT NULL AUTO_INCREMENT,
  `idMalla` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `idtipo_asignatura` int(11) NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `opcional` tinyint(1) DEFAULT NULL,
  `creditos` int(11) DEFAULT NULL,
  `horas` int(11) DEFAULT NULL,
  `anulada` tinyint(1) DEFAULT NULL,
  `horasDocente` int(11) DEFAULT '0',
  `horasPracticoExperimental` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`idDetalleMalla`),
  KEY `R_12` (`idMalla`),
  KEY `R_13` (`idAsignatura`),
  KEY `R_17` (`idNivel`),
  KEY `fk_detallemallas_tipos_asignatura1_idx` (`idtipo_asignatura`),
  CONSTRAINT `detallemallas_ibfk_1` FOREIGN KEY (`idMalla`) REFERENCES `mallas` (`idMalla`),
  CONSTRAINT `detallemallas_ibfk_2` FOREIGN KEY (`idAsignatura`) REFERENCES `asignaturas` (`idAsignatura`),
  CONSTRAINT `detallemallas_ibfk_3` FOREIGN KEY (`idNivel`) REFERENCES `cursos` (`idNivel`),
  CONSTRAINT `fk_detallemallas_tipos_asignatura1` FOREIGN KEY (`idtipo_asignatura`) REFERENCES `tipos_asignatura` (`idtipo_asignatura`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1175 DEFAULT CHARSET=latin1;
CREATE TABLE `detalles_documentos_pagos` (
  `iddocumentopago` int(10) unsigned NOT NULL,
  `idpago` int(11) NOT NULL,
  `valor` decimal(8,2) NOT NULL,
  PRIMARY KEY (`iddocumentopago`,`idpago`),
  KEY `FK_detalles_documentos_pagos_2` (`idpago`),
  CONSTRAINT `FK_detalles_documentos_pagos_1` FOREIGN KEY (`iddocumentopago`) REFERENCES `documentos_pagos` (`iddocumentopago`),
  CONSTRAINT `FK_detalles_documentos_pagos_2` FOREIGN KEY (`idpago`) REFERENCES `pagos` (`idPago`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `detalles_ofertas` (
  `iddetalles_ofertas` int(11) NOT NULL AUTO_INCREMENT,
  `idofertas_laborales` int(11) NOT NULL,
  `idjornadas_ofertas` int(11) NOT NULL,
  `idmodalidades_ofertas` int(11) NOT NULL,
  PRIMARY KEY (`iddetalles_ofertas`),
  KEY `idjornadas_ofertas` (`idjornadas_ofertas`),
  KEY `idmodalidades_ofertas` (`idmodalidades_ofertas`),
  KEY `idofertas_laborales` (`idofertas_laborales`),
  CONSTRAINT `detalles_ofertas_ibfk_1` FOREIGN KEY (`idjornadas_ofertas`) REFERENCES `jornadas_ofertas` (`idjornadas_ofertas`),
  CONSTRAINT `detalles_ofertas_ibfk_2` FOREIGN KEY (`idmodalidades_ofertas`) REFERENCES `modalidades_ofertas` (`idmodalidades_ofertas`),
  CONSTRAINT `detalles_ofertas_ibfk_3` FOREIGN KEY (`idofertas_laborales`) REFERENCES `ofertas_laborales` (`idofertas_laborales`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
CREATE TABLE `discapacidades` (
  `idDiscapacidad` int(11) NOT NULL AUTO_INCREMENT,
  `discapacidad` varchar(30) DEFAULT NULL,
  `esDefecto` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idDiscapacidad`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
CREATE TABLE `documentos_adjuntos` (
  `iddocumentos_adjuntos` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) NOT NULL,
  `idtipos_documentos` int(11) NOT NULL,
  `nombre_archivo` varchar(255) DEFAULT NULL,
  `ruta_archivo` varchar(255) DEFAULT NULL,
  `fecha_Subida` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`iddocumentos_adjuntos`),
  KEY `idtipos_documentos` (`idtipos_documentos`),
  CONSTRAINT `documentos_adjuntos_ibfk_1` FOREIGN KEY (`idtipos_documentos`) REFERENCES `tipos_documentos` (`idtipos_documentos`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
CREATE TABLE `ed_alumnostest` (
  `idIngresoTest` int(11) NOT NULL AUTO_INCREMENT,
  `idMatricula` int(11) DEFAULT NULL,
  `idTest` int(11) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `culminado` tinyint(4) DEFAULT '0',
  `fecha_modificacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`idIngresoTest`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ed_encuestas` (
  `idEncuesta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idEncuesta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ed_fechasevaluacion` (
  `idPeriodo` varchar(7) NOT NULL,
  `idModalidad` int(11) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_final` date DEFAULT NULL,
  PRIMARY KEY (`idPeriodo`,`idModalidad`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ed_preguntas` (
  `IdPregunta` int(11) NOT NULL AUTO_INCREMENT,
  `idEncuesta` int(11) DEFAULT NULL,
  `pregunta` varchar(250) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `activa` tinyint(4) DEFAULT '1',
  `esAbierta` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`IdPregunta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ed_respuestastest` (
  `idIngresoTest` int(11) NOT NULL,
  `idPregunta` int(11) NOT NULL,
  `siempre` tinyint(4) DEFAULT '0',
  `casiSiempre` tinyint(4) DEFAULT '0',
  `aVeces` tinyint(4) DEFAULT '0',
  `casiNunca` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idIngresoTest`,`idPregunta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ed_respuestastestab` (
  `idIngresoTest` int(11) NOT NULL,
  `idPregunta` int(11) NOT NULL,
  `respuesta` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idIngresoTest`,`idPregunta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `empresas` (
  `idempresa` varchar(15) NOT NULL,
  `tipoDocumento` char(1) DEFAULT NULL,
  `idsectores_empresas` int(11) NOT NULL,
  `nombre_empresa` varchar(255) DEFAULT NULL,
  `pais_empresa` varchar(100) DEFAULT NULL,
  `ciudad_empresa` varchar(100) DEFAULT NULL,
  `direccion_empresa` varchar(100) DEFAULT NULL,
  `telefono_empresa` varchar(20) DEFAULT NULL,
  `email_empresa` varchar(90) DEFAULT NULL,
  `user_empresa` varchar(90) DEFAULT NULL,
  `password` varchar(90) DEFAULT NULL,
  `fecha_Inscripcion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  `estado_verificacion` enum('pendiente','verificado','rechazado') DEFAULT 'pendiente',
  `fecha_verificacion` date DEFAULT NULL,
  `comentario_verificacion` text,
  `EsActivo` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idempresa`),
  KEY `idsectores_empresas` (`idsectores_empresas`),
  CONSTRAINT `empresas_ibfk_1` FOREIGN KEY (`idsectores_empresas`) REFERENCES `sectores_empresas` (`idsectores_empresas`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `empresas_contactos` (
  `idempresas_contactos` int(11) NOT NULL AUTO_INCREMENT,
  `idempresa` varchar(15) NOT NULL,
  `idtipo_contacto` int(11) NOT NULL,
  `valor` varchar(255) DEFAULT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  PRIMARY KEY (`idempresas_contactos`),
  KEY `idtipo_contacto` (`idtipo_contacto`),
  KEY `idempresa` (`idempresa`),
  CONSTRAINT `empresas_contactos_ibfk_1` FOREIGN KEY (`idtipo_contacto`) REFERENCES `tipo_contacto` (`idtipo_contacto`),
  CONSTRAINT `empresas_contactos_ibfk_2` FOREIGN KEY (`idempresa`) REFERENCES `empresas` (`idempresa`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `escalafon` (
  `idEscalafon` int(11) NOT NULL AUTO_INCREMENT,
  `idCategoriaContratos` int(11) NOT NULL,
  `Nombre` varchar(90) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idEscalafon`),
  KEY `fk_escalafon_categoria_contratos1_idx` (`idCategoriaContratos`),
  CONSTRAINT `fk_escalafon_categoria_contratos1` FOREIGN KEY (`idCategoriaContratos`) REFERENCES `categoria_contratos` (`idCategoriaContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
CREATE TABLE `espacios` (
  `idEspacio` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` enum('aula','laboratorio','taller','virtual','aula interactiva') NOT NULL,
  `capacidad` int(11) NOT NULL,
  `idCarrera` int(11) DEFAULT NULL,
  `edificio` varchar(50) DEFAULT NULL,
  `piso` int(11) NOT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  `requiereReserva` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idEspacio`),
  KEY `fk_espacios_carreras1_idx` (`idCarrera`),
  CONSTRAINT `fk_espacios_carreras1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
CREATE TABLE `especies` (
  `idEspecie` int(11) NOT NULL AUTO_INCREMENT,
  `especie` varchar(100) NOT NULL,
  `valor` decimal(8,2) NOT NULL,
  `numero_cuotas` int(11) NOT NULL,
  `prioridad` int(11) DEFAULT NULL,
  `permite_intercalar` tinyint(4) DEFAULT NULL,
  `codigo_referencia` varchar(10) DEFAULT NULL,
  `idperiodo` varchar(7) DEFAULT NULL,
  `extraordinaria` decimal(8,2) DEFAULT NULL,
  `idNivel` int(11) DEFAULT '0',
  PRIMARY KEY (`idEspecie`)
) ENGINE=InnoDB AUTO_INCREMENT=912 DEFAULT CHARSET=latin1;
CREATE TABLE `especies_extras` (
  `idmatricula` int(11) NOT NULL,
  `idespecie` int(11) NOT NULL,
  `fecha_registro` date NOT NULL,
  `valor` decimal(8,2) NOT NULL,
  `fecha_limite_pago` date NOT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  `obligatoria` tinyint(1) NOT NULL,
  `pagado` decimal(8,2) NOT NULL,
  `extra` tinyint(1) NOT NULL,
  `tipo` varchar(45) NOT NULL,
  PRIMARY KEY (`idmatricula`,`idespecie`,`fecha_registro`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `estadocivil` (
  `idestadoCivil` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) DEFAULT NULL,
  `requiereConyuge` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idestadoCivil`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `estadossolicitados` (
  `idEstadoSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `estado` varchar(30) DEFAULT NULL,
  `orden` int(11) DEFAULT '0',
  `esTerminal` tinyint(4) DEFAULT '0',
  `esPendiente` tinyint(4) DEFAULT '0',
  `esFinalizado` tinyint(4) DEFAULT '0',
  `esEnRevision` tinyint(4) DEFAULT '0',
  `esAnulada` tinyint(4) DEFAULT '0',
  `esReasignada` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idEstadoSolicitud`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `etnias` (
  `idEtnia` int(11) NOT NULL AUTO_INCREMENT,
  `etnia` varchar(30) DEFAULT NULL,
  `esIndigena` tinyint(4) DEFAULT NULL,
  `noRegistra` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idEtnia`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
CREATE TABLE `experiencias_laborales` (
  `idexperiencias_laborales` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) DEFAULT NULL,
  `empresa_nombre` varchar(255) DEFAULT NULL,
  `puesto_nombre` varchar(255) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `descripcion` text,
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idexperiencias_laborales`),
  KEY `idAlumno` (`idAlumno`),
  CONSTRAINT `experiencias_laborales_ibfk_1` FOREIGN KEY (`idAlumno`) REFERENCES `alumnos` (`idAlumno`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `extras_contratos` (
  `idExtraContratos` int(11) NOT NULL AUTO_INCREMENT,
  `idContratos` int(11) NOT NULL,
  `fecha_registro` date DEFAULT NULL,
  `fecha_inicioextra` date DEFAULT NULL,
  `valor_extra` decimal(10,2) DEFAULT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `fecha_finalizacion` date DEFAULT NULL,
  `esactivo` tinyint(4) DEFAULT NULL,
  `usuarioRegistra` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idExtraContratos`),
  KEY `fk_extras_contratos_contratos1_idx` (`idContratos`),
  CONSTRAINT `fk_extras_contratos_contratos1` FOREIGN KEY (`idContratos`) REFERENCES `contratos` (`idContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `fechas_grados` (
  `idperiodo` varchar(7) NOT NULL,
  `idnivel` int(11) NOT NULL,
  `idseccion` int(11) NOT NULL,
  `paralelo` char(1) NOT NULL,
  `fecha_grado` date DEFAULT NULL,
  PRIMARY KEY (`idperiodo`,`idnivel`,`idseccion`,`paralelo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `fechas_horarios` (
  `idFecha` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date DEFAULT NULL,
  `finsemana` tinyint(4) DEFAULT '0',
  `dia` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`idFecha`)
) ENGINE=InnoDB AUTO_INCREMENT=3714 DEFAULT CHARSET=latin1;
CREATE TABLE `fechas_pagos` (
  `idFecha` int(11) NOT NULL AUTO_INCREMENT,
  `idEspecie` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  PRIMARY KEY (`idFecha`)
) ENGINE=InnoDB AUTO_INCREMENT=904 DEFAULT CHARSET=latin1;
CREATE TABLE `financiamiento_beca` (
  `idFinanciamiento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`idFinanciamiento`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `formaciones_academicas` (
  `idformaciones_academicas` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) NOT NULL,
  `Institucion_nombre` varchar(255) DEFAULT NULL,
  `titulo` varchar(90) DEFAULT NULL,
  `abreviatura` char(5) DEFAULT NULL,
  `numero_registro` varchar(45) DEFAULT NULL,
  `area_estudio` varchar(90) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idformaciones_academicas`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `grados_academicos` (
  `idGradoAcademico` int(11) NOT NULL AUTO_INCREMENT,
  `idNivelAcademico` int(11) NOT NULL,
  `nombre` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idGradoAcademico`),
  KEY `fk_grados_academicos_niveles_academicos1_idx` (`idNivelAcademico`),
  CONSTRAINT `fk_grados_academicos_niveles_academicos1` FOREIGN KEY (`idNivelAcademico`) REFERENCES `niveles_academicos` (`idNivelAcademico`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
CREATE TABLE `habilidades` (
  `idhabilidades` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`idhabilidades`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
CREATE TABLE `habilidades_requeridas` (
  `idhabilidades_requeridas` int(11) NOT NULL AUTO_INCREMENT,
  `idofertas_laborales` int(11) NOT NULL,
  `idhabilidades` int(11) NOT NULL,
  `nivel` enum('basico','intermedio','avanzado') DEFAULT NULL,
  `es_obligatoria` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idhabilidades_requeridas`),
  KEY `idhabilidades` (`idhabilidades`),
  KEY `idofertas_laborales` (`idofertas_laborales`),
  CONSTRAINT `habilidades_requeridas_ibfk_1` FOREIGN KEY (`idhabilidades`) REFERENCES `habilidades` (`idhabilidades`),
  CONSTRAINT `habilidades_requeridas_ibfk_2` FOREIGN KEY (`idofertas_laborales`) REFERENCES `ofertas_laborales` (`idofertas_laborales`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
CREATE TABLE `horario_detalle` (
  `idHorario` int(11) NOT NULL AUTO_INCREMENT,
  `idAsignacion` int(11) NOT NULL,
  `idEspacio` int(11) NOT NULL,
  `diaSemana` int(11) NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time DEFAULT NULL,
  `tipoBloque` enum('teorico','practico','taller') DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idHorario`),
  UNIQUE KEY `uq_docente_horario` (`idAsignacion`,`diaSemana`,`horaInicio`),
  UNIQUE KEY `uq_espacio_horario` (`idEspacio`,`diaSemana`,`horaInicio`),
  KEY `fk_asignacion_horario_idx` (`idAsignacion`),
  KEY `fk_horario_detalle_espacios1_idx` (`idEspacio`),
  CONSTRAINT `fk_asignacion_horario` FOREIGN KEY (`idAsignacion`) REFERENCES `asignaciones_profesores` (`idAsignacion`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_horario_detalle_espacios1` FOREIGN KEY (`idEspacio`) REFERENCES `espacios` (`idEspacio`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
CREATE TABLE `horario_profesores` (
  `idHorario` int(11) NOT NULL AUTO_INCREMENT,
  `idAsignacion` int(11) DEFAULT NULL,
  `idHora` int(11) DEFAULT NULL,
  `idFecha` int(11) DEFAULT NULL,
  `asiste` tinyint(4) DEFAULT '1',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idHorario`)
) ENGINE=InnoDB AUTO_INCREMENT=846979 DEFAULT CHARSET=latin1;
CREATE TABLE `horas_academicas` (
  `idHorasAcademicas` int(11) NOT NULL AUTO_INCREMENT,
  `idDedicacion` int(11) NOT NULL,
  `HorasMinimas` int(11) DEFAULT NULL,
  `HorasMaximas` int(11) DEFAULT NULL,
  `HorasMaximaSemana` int(11) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idHorasAcademicas`),
  KEY `fk_horas_academicas_dedicacion1_idx` (`idDedicacion`),
  CONSTRAINT `fk_horas_academicas_dedicacion1` FOREIGN KEY (`idDedicacion`) REFERENCES `dedicacion` (`idDedicacion`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `horas_clases` (
  `idhora` int(11) NOT NULL AUTO_INCREMENT,
  `idSeccion` int(11) DEFAULT NULL,
  `idCarrera` int(11) DEFAULT NULL,
  `hora_inicio` varchar(5) DEFAULT NULL,
  `hora_fin` varchar(5) DEFAULT NULL,
  `minutos` int(11) DEFAULT NULL,
  `numero_hora` int(11) DEFAULT NULL,
  `tipo` char(1) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idhora`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=latin1;
CREATE TABLE `instituciones` (
  `idInstitucion` int(11) NOT NULL AUTO_INCREMENT,
  `Institucion` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idInstitucion`)
) ENGINE=InnoDB AUTO_INCREMENT=3737 DEFAULT CHARSET=latin1;
CREATE TABLE `instituciones_instituto` (
  `idInstitucionesInstituto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) DEFAULT NULL,
  `ruc` varchar(15) DEFAULT NULL,
  `ubicado` varchar(255) DEFAULT NULL,
  `representante` varchar(90) DEFAULT NULL,
  `cedula_representante` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`idInstitucionesInstituto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `jornadas_ofertas` (
  `idjornadas_ofertas` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_jornada` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idjornadas_ofertas`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `logsmigraciones` (
  `idLog` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(1000) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  PRIMARY KEY (`idLog`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `mallas` (
  `idMalla` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) NOT NULL,
  `vigencia` int(7) DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `creditos_minimo` int(11) DEFAULT NULL,
  `creditos_maximo` int(11) DEFAULT NULL,
  `creditos_reprobatorio` int(11) DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`idMalla`),
  KEY `R_15` (`idCarrera`),
  CONSTRAINT `mallas_ibfk_1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;
CREATE TABLE `mallas_periodos` (
  `idPeriodo` varchar(7) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `idMalla` int(11) NOT NULL,
  PRIMARY KEY (`idPeriodo`,`idNivel`,`idMalla`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `matriculas` (
  `idMatricula` int(11) NOT NULL AUTO_INCREMENT,
  `idAlumno` varchar(14) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `idSeccion` int(11) NOT NULL,
  `idModalidad` int(11) NOT NULL,
  `idPeriodo` char(7) NOT NULL,
  `fechaMatricula` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paralelo` varchar(10) DEFAULT NULL,
  `arrastres` tinyint(1) DEFAULT NULL,
  `folio` int(11) DEFAULT NULL,
  `beca_matricula` decimal(5,2) DEFAULT NULL,
  `beca_colegiatura` decimal(5,2) DEFAULT NULL,
  `retirado` tinyint(1) DEFAULT NULL,
  `fechaRetiro` date DEFAULT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  `convalidacion` tinyint(1) DEFAULT NULL,
  `carrera_convalidada` varchar(200) DEFAULT NULL,
  `numero_permiso` int(11) DEFAULT NULL,
  `user_matricula` varchar(20) DEFAULT NULL,
  `valida` tinyint(4) DEFAULT '1',
  `esOyente` tinyint(4) DEFAULT '0',
  `documentoFactura` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`idMatricula`),
  KEY `R_3` (`idAlumno`),
  KEY `R_4` (`idSeccion`),
  KEY `R_6` (`idNivel`),
  KEY `R_7` (`idModalidad`),
  KEY `R_8` (`idPeriodo`),
  CONSTRAINT `matriculas_ibfk_1` FOREIGN KEY (`idAlumno`) REFERENCES `alumnos` (`idAlumno`),
  CONSTRAINT `matriculas_ibfk_2` FOREIGN KEY (`idSeccion`) REFERENCES `secciones` (`idSeccion`),
  CONSTRAINT `matriculas_ibfk_3` FOREIGN KEY (`idNivel`) REFERENCES `cursos` (`idNivel`),
  CONSTRAINT `matriculas_ibfk_4` FOREIGN KEY (`idModalidad`) REFERENCES `modalidades` (`idModalidad`),
  CONSTRAINT `matriculas_ibfk_5` FOREIGN KEY (`idPeriodo`) REFERENCES `periodos` (`idPeriodo`)
) ENGINE=InnoDB AUTO_INCREMENT=58184 DEFAULT CHARSET=latin1;
CREATE TABLE `matriculas_asistencias` (
  `idMatricula` int(11) NOT NULL,
  `idFecha` int(11) NOT NULL,
  `noAsiste` tinyint(1) DEFAULT '0',
  `atraso` tinyint(1) DEFAULT '0',
  `observacion` varchar(100) DEFAULT NULL,
  `usuario` varchar(20) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `usuario_actualiza` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idMatricula`,`idFecha`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `matriculas_examen_conduccion` (
  `idMatricula` int(11) NOT NULL,
  `idCategoria` int(11) NOT NULL,
  `nota` int(11) DEFAULT '0',
  `observacion` varchar(100) DEFAULT NULL,
  `usuario` varchar(20) DEFAULT NULL,
  `fechaExamen` date DEFAULT NULL,
  `fechaIngreso` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `instructor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idMatricula`,`idCategoria`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `medios_contacto` (
  `idMedio` int(11) NOT NULL AUTO_INCREMENT,
  `medio` varchar(100) DEFAULT NULL,
  `activo` bit(1) DEFAULT b'1',
  PRIMARY KEY (`idMedio`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
CREATE TABLE `modalidades` (
  `idModalidad` int(11) NOT NULL AUTO_INCREMENT,
  `modalidad` varchar(100) DEFAULT NULL,
  `sufijo` char(1) DEFAULT NULL,
  PRIMARY KEY (`idModalidad`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `modalidades_carreras` (
  `idModalidadCarrera` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) NOT NULL,
  `idModalidad` int(11) NOT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idModalidadCarrera`),
  KEY `fk_ModalidadCarrera_carreras1_idx` (`idCarrera`),
  KEY `fk_ModalidadCarrera_modalidades1_idx` (`idModalidad`),
  CONSTRAINT `fk_ModalidadCarrera_carreras1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_ModalidadCarrera_modalidades1` FOREIGN KEY (`idModalidad`) REFERENCES `modalidades` (`idModalidad`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
CREATE TABLE `modalidades_ofertas` (
  `idmodalidades_ofertas` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_modalidad` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idmodalidades_ofertas`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `modulos` (
  `idModulos` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idModulos`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;
CREATE TABLE `modulos_operaciones` (
  `idModulosOperaciones` int(11) NOT NULL AUTO_INCREMENT,
  `idModulos` int(11) NOT NULL,
  `idOperaciones` int(11) NOT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idModulosOperaciones`),
  KEY `fk_modulos_operaciones_modulos1_idx` (`idModulos`),
  KEY `fk_modulos_operaciones_operaciones1_idx` (`idOperaciones`),
  CONSTRAINT `fk_modulos_operaciones_modulos1` FOREIGN KEY (`idModulos`) REFERENCES `modulos` (`idModulos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_modulos_operaciones_operaciones1` FOREIGN KEY (`idOperaciones`) REFERENCES `operaciones` (`idOperaciones`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=latin1;
CREATE TABLE `motivo_salida` (
  `idMotivoSalida` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_motivo` varchar(45) DEFAULT NULL,
  `necesita_infrome` tinyint(4) DEFAULT NULL,
  `esactivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idMotivoSalida`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `nacionalidades` (
  `idNacionalidad` int(11) NOT NULL AUTO_INCREMENT,
  `nacionalidad` varchar(30) DEFAULT NULL,
  `esNinguna` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idNacionalidad`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
CREATE TABLE `niveles_academicos` (
  `idNivelAcademico` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`idNivelAcademico`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `ofertas_carreras` (
  `idofertas_carreras` int(11) NOT NULL AUTO_INCREMENT,
  `idofertas_laborales` int(11) NOT NULL,
  `idCarrera` int(11) NOT NULL,
  PRIMARY KEY (`idofertas_carreras`),
  KEY `idofertas_laborales` (`idofertas_laborales`),
  KEY `idCarrera` (`idCarrera`),
  CONSTRAINT `ofertas_carreras_ibfk_1` FOREIGN KEY (`idofertas_laborales`) REFERENCES `ofertas_laborales` (`idofertas_laborales`),
  CONSTRAINT `ofertas_carreras_ibfk_2` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `ofertas_laborales` (
  `idofertas_laborales` int(11) NOT NULL AUTO_INCREMENT,
  `idempresa` varchar(15) NOT NULL,
  `iddepartamentos` int(11) NOT NULL,
  `idcargos_ofertas` int(11) NOT NULL,
  `Provincia` varchar(100) DEFAULT NULL,
  `Ciudad` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `idtipos_ofertas` int(11) NOT NULL,
  `experiencia_requerida` varchar(50) DEFAULT NULL,
  `vacantes` int(11) DEFAULT NULL,
  `estado` enum('activa','pausada','cerrada') DEFAULT 'activa',
  `fecha_publicacion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `salario` decimal(10,2) DEFAULT NULL,
  `enlace_original` text,
  `esActivo` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idofertas_laborales`),
  KEY `iddepartamentos` (`iddepartamentos`),
  KEY `idtipos_ofertas` (`idtipos_ofertas`),
  KEY `idempresa` (`idempresa`),
  KEY `idcargos_ofertas` (`idcargos_ofertas`),
  CONSTRAINT `ofertas_laborales_ibfk_1` FOREIGN KEY (`iddepartamentos`) REFERENCES `departamentos` (`iddepartamentos`),
  CONSTRAINT `ofertas_laborales_ibfk_2` FOREIGN KEY (`idtipos_ofertas`) REFERENCES `tipos_ofertas` (`idtipos_ofertas`),
  CONSTRAINT `ofertas_laborales_ibfk_3` FOREIGN KEY (`idempresa`) REFERENCES `empresas` (`idempresa`),
  CONSTRAINT `ofertas_laborales_ibfk_4` FOREIGN KEY (`idcargos_ofertas`) REFERENCES `cargos_ofertas` (`idcargos_ofertas`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
CREATE TABLE `ofertas_requisitos` (
  `idofertas_requisitos` int(11) NOT NULL AUTO_INCREMENT,
  `idofertas_laborales` int(11) NOT NULL,
  `descripcion` text,
  `es_obligatoria` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idofertas_requisitos`),
  KEY `idofertas_laborales` (`idofertas_laborales`),
  CONSTRAINT `ofertas_requisitos_ibfk_1` FOREIGN KEY (`idofertas_laborales`) REFERENCES `ofertas_laborales` (`idofertas_laborales`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=latin1;
CREATE TABLE `operaciones` (
  `idOperaciones` int(11) NOT NULL AUTO_INCREMENT,
  `NombreOperacion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idOperaciones`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `pagos` (
  `idPago` int(11) NOT NULL AUTO_INCREMENT,
  `idMatricula` int(11) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `idCuenta` int(11) DEFAULT NULL,
  `factura` varchar(15) DEFAULT NULL,
  `numero_deposito` varchar(20) DEFAULT NULL,
  `fecha_deposito` date DEFAULT NULL,
  `valor` decimal(8,2) DEFAULT NULL,
  `descuento` decimal(8,2) DEFAULT NULL,
  `observacion` varchar(100) DEFAULT NULL,
  `tipo_documento` varchar(50) DEFAULT NULL,
  `anulado` tinyint(4) DEFAULT '0',
  `fecha_anulacion` date DEFAULT NULL,
  `numero_registro` int(11) DEFAULT NULL,
  `numero_excepcion` tinyint(4) DEFAULT '0',
  `user_pago` varchar(20) DEFAULT NULL,
  `genera_manual` tinyint(4) DEFAULT '0',
  `documentoFactura` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`idPago`)
) ENGINE=InnoDB AUTO_INCREMENT=215393 DEFAULT CHARSET=latin1;
CREATE TABLE `paises` (
  `idpaises` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `nacionalidad` varchar(100) DEFAULT NULL,
  `esEcuador` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idpaises`)
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=latin1;
CREATE TABLE `parametros` (
  `codigo_institucion` varchar(10) DEFAULT NULL,
  `nombreInstitucion` varchar(150) DEFAULT NULL,
  `cadenaConexion` varchar(200) DEFAULT NULL,
  `nombreRector` varchar(200) DEFAULT NULL,
  `archivoFirma` varchar(150) DEFAULT NULL,
  `archivoSello` varchar(150) DEFAULT NULL,
  `emailSolicitudes` varchar(150) DEFAULT NULL,
  `claveEmailSolicitudes` varchar(50) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `permiteActualizacionCompleta` tinyint(4) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `parametrostipossolicitudes` (
  `idParametroTipoSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idTipoSolicitud` int(11) DEFAULT NULL,
  `periodo` tinyint(4) DEFAULT '0',
  `esPeriodoApertura` tinyint(4) DEFAULT '0',
  `esConduccion` tinyint(4) DEFAULT '0',
  `carrera` tinyint(4) DEFAULT '0',
  `nivel` tinyint(4) DEFAULT '0',
  `asignatura` tinyint(4) DEFAULT '0',
  `detalle` tinyint(4) DEFAULT '0',
  `esDetalleAutogenerado` tinyint(4) DEFAULT '0',
  `detalleAutogenerado` varchar(1500) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '0',
  `esCalificaciones` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idParametroTipoSolicitud`),
  KEY `idTipoSolicitud` (`idTipoSolicitud`),
  CONSTRAINT `parametrostipossolicitudes_ibfk_1` FOREIGN KEY (`idTipoSolicitud`) REFERENCES `tipossolicitudes` (`idTipoSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `parciales` (
  `idParcial` int(11) NOT NULL,
  `Parcial` varchar(40) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_final` date DEFAULT NULL,
  `esPrimero` tinyint(4) DEFAULT '0',
  `esSegundo` tinyint(4) DEFAULT '0',
  `esExamenFinal` tinyint(4) DEFAULT '0',
  `esRemedial` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idParcial`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `parciales_modalidades` (
  `idParcial` int(11) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `parciales_modalidades_fechas` (
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idParcial` int(11) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `fechaInicio` date DEFAULT NULL,
  `fechaFin` date DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `parroquias` (
  `idParroquias` int(11) NOT NULL AUTO_INCREMENT,
  `idciudades` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idParroquias`),
  KEY `fk_parroquias_ciudades1_idx` (`idciudades`),
  CONSTRAINT `fk_parroquias_ciudades1` FOREIGN KEY (`idciudades`) REFERENCES `ciudades` (`idciudades`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2392 DEFAULT CHARSET=latin1;
CREATE TABLE `periodos` (
  `idPeriodo` char(7) NOT NULL DEFAULT '',
  `detalle` varchar(100) DEFAULT NULL,
  `fecha_inicial` date DEFAULT NULL,
  `fecha_final` date DEFAULT NULL,
  `cerrado` tinyint(1) DEFAULT NULL,
  `fecha_maxima_autocierre` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `creditos` tinyint(1) DEFAULT NULL,
  `numero_pagos` int(10) unsigned DEFAULT NULL,
  `fecha_matrucla_extraordinaria` date DEFAULT NULL,
  `foliop` int(11) DEFAULT NULL,
  `permiteMatricula` tinyint(4) DEFAULT '0',
  `ingresoCalificaciones` tinyint(4) DEFAULT '0',
  `permiteCalificacionesInstituto` tinyint(4) DEFAULT '0',
  `periodoactivoinstituto` tinyint(4) DEFAULT '0',
  `visualizaPowerBi` tinyint(4) DEFAULT '0',
  `esInstituto` tinyint(4) DEFAULT '0',
  `periodoPlanificacion` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idPeriodo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `periodos_inscripciones` (
  `idPeriodoInscripcion` int(11) NOT NULL AUTO_INCREMENT,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idModalidad` int(11) DEFAULT NULL,
  `idNivel` int(11) DEFAULT NULL,
  `idSeccion` int(11) DEFAULT NULL,
  `fechaInicio` date DEFAULT NULL,
  `fechaFinal` date DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) DEFAULT '1',
  `conduccion` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idPeriodoInscripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8;
CREATE TABLE `periodos_matriculas_niveles` (
  `idPeriodo` varchar(7) NOT NULL,
  `idNivel` int(11) NOT NULL,
  `idSeccion` int(11) NOT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idPeriodo`,`idNivel`,`idSeccion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `plantilla_clausulas` (
  `idPlantillasClausulas` int(11) NOT NULL AUTO_INCREMENT,
  `idPlantillaContrato` int(11) NOT NULL,
  `idClausulas` int(11) NOT NULL,
  `texto` mediumtext,
  `orden` int(11) DEFAULT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idPlantillasClausulas`),
  KEY `fk_plantilla_clausulas_plantilla_contrato1_idx` (`idPlantillaContrato`),
  KEY `fk_plantilla_clausulas_clausulas1_idx` (`idClausulas`),
  CONSTRAINT `fk_plantilla_clausulas_clausulas1` FOREIGN KEY (`idClausulas`) REFERENCES `clausulas` (`idClausulas`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_plantilla_clausulas_plantilla_contrato1` FOREIGN KEY (`idPlantillaContrato`) REFERENCES `plantilla_contrato` (`idPlantillaContrato`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=latin1;
CREATE TABLE `plantilla_contrato` (
  `idPlantillaContrato` int(11) NOT NULL AUTO_INCREMENT,
  `idDedicacion` int(11) NOT NULL,
  `idTiposContratos` int(11) NOT NULL,
  `idInstitucionesInstituto` int(11) NOT NULL,
  `idSello` int(11) NOT NULL,
  `idFondo` int(11) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `cuerpo` mediumtext,
  `version` int(11) DEFAULT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `esDocente` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idPlantillaContrato`),
  KEY `fk_plantilla_contrato_tipos_contratos1_idx` (`idTiposContratos`),
  KEY `fk_plantilla_contrato_dedicacion1_idx` (`idDedicacion`),
  KEY `fk_plantilla_contrato_instituciones_instituto1_idx` (`idInstitucionesInstituto`),
  KEY `fk_plantilla_contrato_adjuntos_imagenes1_idx` (`idSello`),
  KEY `fk_plantilla_contrato_adjuntos_imagenes2_idx` (`idFondo`),
  CONSTRAINT `fk_plantilla_contrato_adjuntos_imagenes1` FOREIGN KEY (`idSello`) REFERENCES `adjuntos_imagenes` (`idAdjuntos_Imagenes`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_plantilla_contrato_adjuntos_imagenes2` FOREIGN KEY (`idFondo`) REFERENCES `adjuntos_imagenes` (`idAdjuntos_Imagenes`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_plantilla_contrato_dedicacion1` FOREIGN KEY (`idDedicacion`) REFERENCES `dedicacion` (`idDedicacion`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_plantilla_contrato_instituciones_instituto1` FOREIGN KEY (`idInstitucionesInstituto`) REFERENCES `instituciones_instituto` (`idInstitucionesInstituto`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_plantilla_contrato_tipos_contratos1` FOREIGN KEY (`idTiposContratos`) REFERENCES `tipos_contratos` (`idTiposContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `plantillas` (
  `idPlantilla` int(11) NOT NULL AUTO_INCREMENT,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `nombre` varchar(200) DEFAULT NULL,
  `archivo` varchar(100) DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idPlantilla`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
CREATE TABLE `plantillasparametros` (
  `idParametro` int(11) NOT NULL AUTO_INCREMENT,
  `idPlantilla` int(11) DEFAULT NULL,
  `parametro` varchar(100) DEFAULT NULL,
  `x` decimal(10,2) DEFAULT NULL,
  `y` decimal(10,2) DEFAULT NULL,
  `fontSize` decimal(10,2) DEFAULT NULL,
  `textAlign` varchar(50) DEFAULT NULL,
  `width` varchar(50) DEFAULT NULL,
  `fontFamily` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`idParametro`),
  KEY `idPlantilla` (`idPlantilla`),
  CONSTRAINT `plantillasparametros_ibfk_1` FOREIGN KEY (`idPlantilla`) REFERENCES `plantillas` (`idPlantilla`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
CREATE TABLE `postulaciones` (
  `idPostulaciones` int(11) NOT NULL AUTO_INCREMENT,
  `idofertas_laborales` int(11) NOT NULL,
  `idAlumno` varchar(14) NOT NULL,
  `iddocumentos_adjuntos` int(11) NOT NULL,
  `fecha_postulacion` timestamp NULL DEFAULT NULL,
  `estado` enum('Pendiente','Revisado','Entrevista','Rechazado','Aceptado') DEFAULT 'Pendiente',
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idPostulaciones`),
  KEY `idofertas_laborales` (`idofertas_laborales`),
  KEY `iddocumentos_adjuntos` (`iddocumentos_adjuntos`),
  CONSTRAINT `postulaciones_ibfk_1` FOREIGN KEY (`idofertas_laborales`) REFERENCES `ofertas_laborales` (`idofertas_laborales`),
  CONSTRAINT `postulaciones_ibfk_2` FOREIGN KEY (`iddocumentos_adjuntos`) REFERENCES `documentos_adjuntos` (`iddocumentos_adjuntos`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `prerequisitos` (
  `idDetalleMalla` int(11) NOT NULL,
  `idAsignatura` int(11) NOT NULL,
  `activa` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idDetalleMalla`,`idAsignatura`),
  KEY `R_34` (`idAsignatura`),
  CONSTRAINT `prerequisitos_ibfk_1` FOREIGN KEY (`idDetalleMalla`) REFERENCES `detallemallas` (`idDetalleMalla`),
  CONSTRAINT `prerequisitos_ibfk_2` FOREIGN KEY (`idAsignatura`) REFERENCES `asignaturas` (`idAsignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `procesos_usuario` (
  `proceso` varchar(30) DEFAULT NULL,
  `usuario` varchar(20) DEFAULT NULL,
  `consultar` tinyint(4) DEFAULT '0',
  `insertar` tinyint(4) DEFAULT '0',
  `modificar` tinyint(4) DEFAULT '0',
  `eliminar` tinyint(4) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `profesores` (
  `idProfesor` varchar(14) NOT NULL,
  `tipodocumento` char(1) DEFAULT NULL,
  `apellidos` varchar(60) DEFAULT NULL,
  `nombres` varchar(60) DEFAULT NULL,
  `primerApellido` varchar(60) DEFAULT NULL,
  `segundoApellido` varchar(60) DEFAULT NULL,
  `primerNombre` varchar(60) DEFAULT NULL,
  `segundoNombre` varchar(60) DEFAULT NULL,
  `estadoCivil` int(11) NOT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `callePrincipal` varchar(125) DEFAULT NULL,
  `calleSecundaria` varchar(125) DEFAULT NULL,
  `numeroCasa` varchar(45) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` char(1) DEFAULT NULL,
  `clave` varchar(20) DEFAULT '321',
  `practicas` tinyint(4) DEFAULT '0',
  `tipo` char(1) DEFAULT 'P',
  `nacionalidad` varchar(40) DEFAULT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `abreviatura` varchar(5) DEFAULT NULL,
  `abreviatura_post` varchar(5) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  `idEtnia` int(11) NOT NULL,
  `idNacionalidad` int(11) NOT NULL,
  `idParroquiaNacimiento` int(11) NOT NULL,
  `emailInstitucional` varchar(255) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `fechaIngresoIess` date DEFAULT NULL,
  `fecha_retiro` date DEFAULT NULL,
  `idParroquiaResidencia` int(11) NOT NULL,
  `tipoSangre` varchar(5) NOT NULL,
  `codigoPostal` varchar(20) DEFAULT NULL,
  `idDiscapacidad` int(11) NOT NULL,
  `porcentajeDiscapacidad` int(11) DEFAULT NULL,
  `numeroConadis` varchar(45) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `esReal` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProfesor`),
  KEY `fk_profesores_etnias1_idx` (`idEtnia`),
  KEY `fk_profesores_parroquias1_idx` (`idParroquiaNacimiento`),
  KEY `fk_profesores_parroquias2_idx` (`idParroquiaResidencia`),
  KEY `fk_profesores_tipoSangre1_idx` (`tipoSangre`),
  KEY `fk_profesores_estadoCivil1_idx` (`estadoCivil`),
  KEY `fk_profesores_nacionalidades1_idx` (`idNacionalidad`),
  KEY `fk_profesores_discapacidades1_idx` (`idDiscapacidad`),
  CONSTRAINT `fk_profesores_discapacidades1` FOREIGN KEY (`idDiscapacidad`) REFERENCES `discapacidades` (`idDiscapacidad`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_estadoCivil1` FOREIGN KEY (`estadoCivil`) REFERENCES `estadocivil` (`idestadoCivil`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_etnias1` FOREIGN KEY (`idEtnia`) REFERENCES `etnias` (`idEtnia`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_nacionalidades1` FOREIGN KEY (`idNacionalidad`) REFERENCES `nacionalidades` (`idNacionalidad`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_parroquias1` FOREIGN KEY (`idParroquiaNacimiento`) REFERENCES `parroquias` (`idParroquias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_parroquias2` FOREIGN KEY (`idParroquiaResidencia`) REFERENCES `parroquias` (`idParroquias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_tipoSangre1` FOREIGN KEY (`tipoSangre`) REFERENCES `tiposangre` (`codigoTipoSangre`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `profesores_actas_parciales` (
  `idAsignacion` int(11) NOT NULL,
  `idParcial` int(11) NOT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `fecha_grabar` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_modificacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `codigo_impresion` varchar(10) DEFAULT NULL,
  `entrega_acta` tinyint(4) DEFAULT '0',
  `ingresa_notas` tinyint(4) DEFAULT '0',
  `usuario_graba` varchar(20) DEFAULT NULL,
  `activoAtraso` tinyint(4) DEFAULT '0',
  `fechaInicio` date DEFAULT NULL,
  `fechaFin` date DEFAULT NULL,
  PRIMARY KEY (`idAsignacion`,`idParcial`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `profesores_actividades` (
  `idPeriodo` varchar(7) NOT NULL,
  `idProfesor` varchar(14) NOT NULL,
  `idSubcategoria` int(11) NOT NULL,
  `horas_semana` int(11) DEFAULT '0',
  `usuario` varchar(20) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPeriodo`,`idProfesor`,`idSubcategoria`),
  KEY `fk_profesores_actividades_subcategorias_actividades1_idx` (`idSubcategoria`),
  CONSTRAINT `fk_profesores_actividades_subcategorias_actividades1` FOREIGN KEY (`idSubcategoria`) REFERENCES `subcategorias_actividades` (`idSubcategoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `profesores_carreras_periodos` (
  `idProfesoresCarrerasPeriodos` int(11) NOT NULL AUTO_INCREMENT,
  `idPeriodo` char(7) NOT NULL,
  `idProfesor` varchar(14) NOT NULL,
  `idCarrera` int(11) DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `sonTodas` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idProfesoresCarrerasPeriodos`),
  KEY `fk_profesores_carreras_periodos_periodos1_idx` (`idPeriodo`),
  KEY `fk_profesores_carreras_periodos_profesores1_idx` (`idProfesor`),
  KEY `fk_profesores_carreras_periodos_carreras1_idx` (`idCarrera`),
  CONSTRAINT `fk_profesores_carreras_periodos_carreras1` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_carreras_periodos_periodos1` FOREIGN KEY (`idPeriodo`) REFERENCES `periodos` (`idPeriodo`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_carreras_periodos_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `profesores_dedicacion` (
  `idProfesoresDedicacion` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) NOT NULL,
  `idDedicacionCategorias` int(11) NOT NULL,
  `idPeriodo` char(7) NOT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idProfesoresDedicacion`),
  KEY `fk_profesores_dedicacion_profesores1_idx` (`idProfesor`),
  KEY `fk_profesores_dedicacion_periodos1_idx` (`idPeriodo`),
  KEY `fk_profesores_dedicacion_dedicacion_categorias1_idx` (`idDedicacionCategorias`),
  CONSTRAINT `fk_profesores_dedicacion_dedicacion_categorias1` FOREIGN KEY (`idDedicacionCategorias`) REFERENCES `dedicacion_categorias` (`idDedicacionCategorias`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_dedicacion_periodos1` FOREIGN KEY (`idPeriodo`) REFERENCES `periodos` (`idPeriodo`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_dedicacion_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `profesores_motivo_salida` (
  `idProfesor` varchar(14) NOT NULL,
  `idMotivoSalida` int(11) NOT NULL,
  `idContratos` int(11) NOT NULL,
  `Observacion` varchar(400) DEFAULT NULL,
  `ruta_archivo` varchar(150) DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `fecha_salida` date DEFAULT NULL,
  PRIMARY KEY (`idProfesor`,`idMotivoSalida`),
  KEY `fk_profesores_has_motivo_salida_motivo_salida1_idx` (`idMotivoSalida`),
  KEY `fk_profesores_has_motivo_salida_profesores1_idx` (`idProfesor`),
  KEY `fk_profesores_has_motivo_salida_contratos1_idx` (`idContratos`),
  CONSTRAINT `fk_profesores_has_motivo_salida_contratos1` FOREIGN KEY (`idContratos`) REFERENCES `contratos` (`idContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_has_motivo_salida_motivo_salida1` FOREIGN KEY (`idMotivoSalida`) REFERENCES `motivo_salida` (`idMotivoSalida`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_profesores_has_motivo_salida_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `provincias` (
  `idprovincias` int(11) NOT NULL AUTO_INCREMENT,
  `idpaises` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idprovincias`),
  KEY `fk_provincias_paises1_idx` (`idpaises`),
  CONSTRAINT `fk_provincias_paises1` FOREIGN KEY (`idpaises`) REFERENCES `paises` (`idpaises`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=438 DEFAULT CHARSET=latin1;
CREATE TABLE `relacion_ies` (
  `idRelacionIes` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`idRelacionIes`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `respuestassolicitudes` (
  `idRespuestaSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idSolicitud` int(11) DEFAULT NULL,
  `idEstadoSolicitud` int(11) DEFAULT NULL,
  `idUsuarioSolicitud` int(11) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `detalleRespuesta` varchar(8000) DEFAULT NULL,
  `adjuntaArchivo` tinyint(4) DEFAULT '0',
  `mailRespuesta` varchar(100) DEFAULT NULL,
  `envioMail` tinyint(4) DEFAULT '0',
  `fechaRespuesta` datetime DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `archivoAjunto` varchar(150) DEFAULT NULL,
  `revisarLogs` tinyint(4) DEFAULT '0',
  `adjuntarSoloArchivoAdjunto` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idRespuestaSolicitud`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `restricciones` (
  `idrestriccion` varchar(5) NOT NULL,
  `restriccion` varchar(100) DEFAULT NULL,
  `activo` bit(1) DEFAULT NULL,
  PRIMARY KEY (`idrestriccion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `rol` (
  `idRol` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `codigo_rol` varchar(10) NOT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `codigo_rol_UNIQUE` (`codigo_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
CREATE TABLE `rol_modulo_operacion` (
  `idRolModuloOperacion` int(11) NOT NULL AUTO_INCREMENT,
  `idModulosOperaciones` int(11) NOT NULL,
  `idRol` int(11) NOT NULL,
  `fecha_asignacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `fecha_desactivacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  `usuario_asigno` varchar(150) NOT NULL,
  `usuario_desactivo` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`idRolModuloOperacion`),
  KEY `fk_rol_modulo_operacion_modulos_operaciones1_idx` (`idModulosOperaciones`),
  KEY `fk_rol_modulo_operacion_rol1_idx` (`idRol`),
  CONSTRAINT `fk_rol_modulo_operacion_modulos_operaciones1` FOREIGN KEY (`idModulosOperaciones`) REFERENCES `modulos_operaciones` (`idModulosOperaciones`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_rol_modulo_operacion_rol1` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=latin1;
CREATE TABLE `secciones` (
  `idSeccion` int(11) NOT NULL AUTO_INCREMENT,
  `seccion` varchar(30) DEFAULT NULL,
  `sufijo` char(1) DEFAULT NULL,
  PRIMARY KEY (`idSeccion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `sectores_empresas` (
  `idsectores_empresas` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_sector` varchar(90) DEFAULT NULL,
  `codigo_sector` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idsectores_empresas`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `seddautoevaluacion` (
  `idTest` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPeriodo` char(7) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTest`),
  KEY `idInstrumento` (`idInstrumento`),
  CONSTRAINT `seddautoevaluacion_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`)
) ENGINE=InnoDB AUTO_INCREMENT=657 DEFAULT CHARSET=utf8;
CREATE TABLE `seddautoriadesperiodos` (
  `idAsignacion` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) DEFAULT NULL,
  `designacion` varchar(200) DEFAULT NULL,
  `idInstrumento` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAsignacion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
CREATE TABLE `seddautoridadescarrerasperiodos` (
  `idAsignacion` int(11) NOT NULL AUTO_INCREMENT,
  `idCarrera` int(11) DEFAULT NULL,
  `idPeriodo` varchar(14) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `idInstrumento` int(11) DEFAULT '0',
  `designacion` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAsignacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `seddcoevaluacion` (
  `idTest` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idAsignacion` int(11) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT NULL,
  `fechaTest` datetime DEFAULT NULL,
  PRIMARY KEY (`idTest`),
  KEY `idInstrumento` (`idInstrumento`),
  CONSTRAINT `seddcoevaluacion_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`)
) ENGINE=InnoDB AUTO_INCREMENT=1246 DEFAULT CHARSET=utf8;
CREATE TABLE `seddcoevaluacionautoridad` (
  `idTest` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `idEvaluador` varchar(14) DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT NULL,
  `fechaTest` datetime DEFAULT NULL,
  PRIMARY KEY (`idTest`),
  KEY `idInstrumento` (`idInstrumento`),
  CONSTRAINT `seddcoevaluacionautoridad_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`)
) ENGINE=InnoDB AUTO_INCREMENT=1264 DEFAULT CHARSET=utf8;
CREATE TABLE `sedddetalleautoevaluacion` (
  `idDetalle` int(11) NOT NULL AUTO_INCREMENT,
  `idTest` int(11) DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  `respuesta` int(11) DEFAULT '0',
  PRIMARY KEY (`idDetalle`),
  KEY `idPregunta` (`idPregunta`),
  KEY `idTest` (`idTest`),
  CONSTRAINT `sedddetalleautoevaluacion_ibfk_1` FOREIGN KEY (`idPregunta`) REFERENCES `seddpreguntas` (`idPregunta`),
  CONSTRAINT `sedddetalleautoevaluacion_ibfk_2` FOREIGN KEY (`idTest`) REFERENCES `seddautoevaluacion` (`idTest`)
) ENGINE=InnoDB AUTO_INCREMENT=6130 DEFAULT CHARSET=utf8;
CREATE TABLE `sedddetallecoevaluacion` (
  `idDetalle` int(11) NOT NULL AUTO_INCREMENT,
  `idTest` int(11) DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  `respuesta` int(11) DEFAULT '0',
  PRIMARY KEY (`idDetalle`),
  KEY `idPregunta` (`idPregunta`),
  KEY `idTest` (`idTest`),
  CONSTRAINT `sedddetallecoevaluacion_ibfk_1` FOREIGN KEY (`idPregunta`) REFERENCES `seddpreguntas` (`idPregunta`),
  CONSTRAINT `sedddetallecoevaluacion_ibfk_2` FOREIGN KEY (`idTest`) REFERENCES `seddcoevaluacion` (`idTest`)
) ENGINE=InnoDB AUTO_INCREMENT=15679 DEFAULT CHARSET=utf8;
CREATE TABLE `sedddetallecoevaluacionautoridad` (
  `idDetalle` int(11) NOT NULL AUTO_INCREMENT,
  `idTest` int(11) DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  `respuesta` int(11) DEFAULT '0',
  PRIMARY KEY (`idDetalle`),
  KEY `idPregunta` (`idPregunta`),
  KEY `idTest` (`idTest`),
  CONSTRAINT `sedddetallecoevaluacionautoridad_ibfk_1` FOREIGN KEY (`idPregunta`) REFERENCES `seddpreguntas` (`idPregunta`),
  CONSTRAINT `sedddetallecoevaluacionautoridad_ibfk_2` FOREIGN KEY (`idTest`) REFERENCES `seddcoevaluacionautoridad` (`idTest`)
) ENGINE=InnoDB AUTO_INCREMENT=9812 DEFAULT CHARSET=utf8;
CREATE TABLE `sedddetalleheteroevaluacion` (
  `idDetalle` int(11) NOT NULL AUTO_INCREMENT,
  `idTest` int(11) DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  `respuesta` int(11) DEFAULT '0',
  PRIMARY KEY (`idDetalle`),
  KEY `idPregunta` (`idPregunta`),
  KEY `idTest` (`idTest`),
  CONSTRAINT `sedddetalleheteroevaluacion_ibfk_1` FOREIGN KEY (`idPregunta`) REFERENCES `seddpreguntas` (`idPregunta`),
  CONSTRAINT `sedddetalleheteroevaluacion_ibfk_2` FOREIGN KEY (`idTest`) REFERENCES `seddheteroevaluacion` (`idTest`)
) ENGINE=InnoDB AUTO_INCREMENT=202966 DEFAULT CHARSET=utf8;
CREATE TABLE `seddheteroevaluacion` (
  `idTest` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idAsignacion` int(11) DEFAULT NULL,
  `idMatricula` int(11) DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT NULL,
  PRIMARY KEY (`idTest`),
  KEY `idInstrumento` (`idInstrumento`),
  CONSTRAINT `seddheteroevaluacion_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`)
) ENGINE=InnoDB AUTO_INCREMENT=9394 DEFAULT CHARSET=utf8;
CREATE TABLE `seddinsitu` (
  `idEvaluacion` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `calificacion` decimal(5,2) DEFAULT '0.00',
  `idEvaluador` varchar(14) DEFAULT NULL,
  `fechaActualizacion` datetime DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  PRIMARY KEY (`idEvaluacion`),
  KEY `idInstrumento` (`idInstrumento`),
  CONSTRAINT `seddinsitu_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`)
) ENGINE=InnoDB AUTO_INCREMENT=187 DEFAULT CHARSET=utf8;
CREATE TABLE `seddinstrumentos` (
  `idInstrumento` int(11) NOT NULL AUTO_INCREMENT,
  `idCategoria` int(11) DEFAULT NULL,
  `Instrumento` varchar(100) DEFAULT NULL,
  `codigo` varchar(3) DEFAULT NULL,
  `porcentaje` int(11) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idInstrumento`),
  KEY `idCategoria` (`idCategoria`),
  CONSTRAINT `seddinstrumentos_ibfk_1` FOREIGN KEY (`idCategoria`) REFERENCES `categorias_actividades` (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
CREATE TABLE `seddinstrumentospreguntas` (
  `idInstrumentoPregunta` int(11) NOT NULL AUTO_INCREMENT,
  `idInstrumento` int(11) DEFAULT NULL,
  `idPregunta` int(11) DEFAULT NULL,
  `fechaRegistro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idInstrumentoPregunta`),
  KEY `idInstrumento` (`idInstrumento`),
  KEY `idPregunta` (`idPregunta`),
  CONSTRAINT `seddinstrumentospreguntas_ibfk_1` FOREIGN KEY (`idInstrumento`) REFERENCES `seddinstrumentos` (`idInstrumento`),
  CONSTRAINT `seddinstrumentospreguntas_ibfk_2` FOREIGN KEY (`idPregunta`) REFERENCES `seddpreguntas` (`idPregunta`)
) ENGINE=InnoDB AUTO_INCREMENT=422 DEFAULT CHARSET=utf8;
CREATE TABLE `seddpreguntas` (
  `idPregunta` int(11) NOT NULL AUTO_INCREMENT,
  `pregunta` varchar(300) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idPregunta`)
) ENGINE=InnoDB AUTO_INCREMENT=422 DEFAULT CHARSET=utf8;
CREATE TABLE `seedevaluadoresinsitu` (
  `idAsignacionEvaluador` int(11) NOT NULL AUTO_INCREMENT,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `idEvaluador` varchar(14) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idAsignacionEvaluador`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
CREATE TABLE `sistema_titulacion` (
  `codigo_sistema` int(11) NOT NULL AUTO_INCREMENT,
  `detalle` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`codigo_sistema`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
CREATE TABLE `solicitudes` (
  `idSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idTipoSolicitud` int(11) DEFAULT NULL,
  `cedula` varchar(14) DEFAULT NULL,
  `solicitante` varchar(150) DEFAULT NULL,
  `carrera` varchar(100) DEFAULT NULL,
  `nivel` varchar(60) DEFAULT NULL,
  `asunto` varchar(1000) DEFAULT NULL,
  `impreso` tinyint(4) DEFAULT '0',
  `fechaVenta` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaImpresion` datetime DEFAULT NULL,
  `codigoSolicitud` varchar(10) DEFAULT NULL,
  `reimprimir` tinyint(4) DEFAULT '0',
  `anulada` tinyint(4) DEFAULT '0',
  `esAlumno` tinyint(4) DEFAULT '0',
  `esDocente` tinyint(4) DEFAULT '0',
  `esExterno` tinyint(4) DEFAULT '0',
  `emailSolicitante` varchar(100) DEFAULT NULL,
  `esperandoImpresion` tinyint(4) DEFAULT '0',
  `revisarLogs` tinyint(4) DEFAULT '0',
  `idPeriodo` varchar(7) DEFAULT NULL,
  `usuarioVenta` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idSolicitud`),
  KEY `idTipoSolicitud` (`idTipoSolicitud`),
  CONSTRAINT `solicitudes_ibfk_1` FOREIGN KEY (`idTipoSolicitud`) REFERENCES `tipossolicitudes` (`idTipoSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `solicitudescalificaciones` (
  `idSolicitudCalificacion` int(11) NOT NULL AUTO_INCREMENT,
  `fechaRegistro` datetime DEFAULT NULL,
  `fechaHabilitado` datetime DEFAULT NULL,
  `idSolicitud` int(11) DEFAULT NULL,
  `idParcial` int(11) DEFAULT NULL,
  `idMatricula` int(11) DEFAULT NULL,
  `idAsignatura` int(11) DEFAULT NULL,
  `idNivel` int(11) DEFAULT NULL,
  `idPeriodo` char(7) DEFAULT NULL,
  `paralelo` varchar(10) DEFAULT NULL,
  `fechaCalificacion` datetime DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `calificacion` decimal(4,2) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idSolicitudCalificacion`),
  KEY `idSolicitud` (`idSolicitud`),
  KEY `idParcial` (`idParcial`),
  KEY `idMatricula` (`idMatricula`),
  KEY `idNivel` (`idNivel`),
  KEY `idAsignatura` (`idAsignatura`),
  CONSTRAINT `solicitudescalificaciones_ibfk_1` FOREIGN KEY (`idSolicitud`) REFERENCES `solicitudes` (`idSolicitud`),
  CONSTRAINT `solicitudescalificaciones_ibfk_2` FOREIGN KEY (`idParcial`) REFERENCES `parciales` (`idParcial`),
  CONSTRAINT `solicitudescalificaciones_ibfk_3` FOREIGN KEY (`idMatricula`) REFERENCES `matriculas` (`idMatricula`),
  CONSTRAINT `solicitudescalificaciones_ibfk_4` FOREIGN KEY (`idNivel`) REFERENCES `cursos` (`idNivel`),
  CONSTRAINT `solicitudescalificaciones_ibfk_5` FOREIGN KEY (`idAsignatura`) REFERENCES `asignaturas` (`idAsignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `solicitudeslogs` (
  `idLogSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idSolicitud` int(11) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `detalle` varchar(2000) DEFAULT NULL,
  `idRespuestaSolicitud` int(11) DEFAULT NULL,
  PRIMARY KEY (`idLogSolicitud`),
  KEY `idSolicitud` (`idSolicitud`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `subcategoria_vehiculos` (
  `idSubcategoria` int(11) NOT NULL AUTO_INCREMENT,
  `subcategoria` varchar(50) DEFAULT NULL,
  `activa` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idSubcategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
CREATE TABLE `subcategorias_actividades` (
  `idSubcategoria` int(7) NOT NULL AUTO_INCREMENT,
  `idCategoria` int(14) DEFAULT NULL,
  `subcategoria` varchar(200) DEFAULT NULL,
  `esDocencia` tinyint(4) DEFAULT '0',
  `activa` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idSubcategoria`),
  KEY `fk_subcategorias_actividades_categorias_actividades1_idx` (`idCategoria`),
  CONSTRAINT `fk_subcategorias_actividades_categorias_actividades1` FOREIGN KEY (`idCategoria`) REFERENCES `categorias_actividades` (`idCategoria`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
CREATE TABLE `sueldos_contratos` (
  `idSueldosContratos` int(11) NOT NULL AUTO_INCREMENT,
  `idContratos` int(11) NOT NULL,
  `fecha_registro` date DEFAULT NULL,
  `fecha_cambiosueldo` date DEFAULT NULL,
  `sueldo` decimal(10,2) DEFAULT '0.00',
  `esactivo` tinyint(4) DEFAULT NULL,
  `usarioRegistra` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idSueldosContratos`),
  KEY `fk_sueldos_contratos_contratos1_idx` (`idContratos`),
  CONSTRAINT `fk_sueldos_contratos_contratos1` FOREIGN KEY (`idContratos`) REFERENCES `contratos` (`idContratos`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `tipo_contacto` (
  `idtipo_contacto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_contacto` varchar(90) DEFAULT NULL,
  `longitud_contacto` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`idtipo_contacto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `tipo_funcionario` (
  `idTipoFuncionario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) DEFAULT NULL,
  `esDocente` bit(1) DEFAULT NULL,
  PRIMARY KEY (`idTipoFuncionario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `tipos_asignatura` (
  `idtipo_asignatura` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_asignatura` varchar(45) DEFAULT NULL,
  `abreviatura` char(5) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  `no_definida` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idtipo_asignatura`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `tipos_becas` (
  `idTipoBeca` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idTipoBeca`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `tipos_contratos` (
  `idTiposContratos` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(90) DEFAULT NULL,
  `codigo` varchar(10) DEFAULT NULL,
  `duracionSemanas` int(11) DEFAULT NULL,
  `esAfiliado` bit(1) DEFAULT NULL,
  PRIMARY KEY (`idTiposContratos`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `tipos_documentos` (
  `idtipos_documentos` int(11) NOT NULL AUTO_INCREMENT,
  `documento` varchar(90) DEFAULT NULL,
  `subijo_documento` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`idtipos_documentos`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
CREATE TABLE `tipos_ofertas` (
  `idtipos_ofertas` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`idtipos_ofertas`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `tiposangre` (
  `codigoTipoSangre` varchar(5) NOT NULL,
  `grupo` varchar(5) DEFAULT NULL,
  `sitemaRH` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`codigoTipoSangre`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `tiposdocumentosi` (
  `tipoDocumento` varchar(1) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`tipoDocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `tipossolicitudes` (
  `idTipoSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idCategoriaSolicitud` int(11) DEFAULT NULL,
  `idDepartamentoSolicitud` int(11) DEFAULT NULL,
  `tipoSolicitud` varchar(200) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `escuelaConduccion` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`idTipoSolicitud`),
  KEY `idCategoriaSolicitud` (`idCategoriaSolicitud`),
  KEY `idDepartamentoSolicitud` (`idDepartamentoSolicitud`),
  CONSTRAINT `tipossolicitudes_ibfk_1` FOREIGN KEY (`idCategoriaSolicitud`) REFERENCES `categoriassolicitudes` (`idCategoriaSolicitud`),
  CONSTRAINT `tipossolicitudes_ibfk_2` FOREIGN KEY (`idDepartamentoSolicitud`) REFERENCES `departamentossolicitudes` (`idDepartamentoSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `titulos` (
  `idTitulo` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) DEFAULT NULL,
  `titulo_femenino` varchar(100) DEFAULT NULL,
  `nivel_inicial` int(11) DEFAULT '1',
  `nivel_final` int(11) DEFAULT '6',
  `idCarrera` int(11) DEFAULT NULL,
  `tiene_practicas` tinyint(4) DEFAULT '1',
  `creditos_practicas` int(11) DEFAULT '0',
  `tiene_titulacion` tinyint(4) DEFAULT '1',
  `creditos_titulacion` int(11) DEFAULT '0',
  PRIMARY KEY (`idTitulo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
CREATE TABLE `titulos_en_curso` (
  `idTitulosProfesorCurso` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) NOT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `idUniversidad` int(11) NOT NULL,
  `idGradoAcademico` int(11) NOT NULL,
  `idCampoDetalladoUnesco` int(11) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `tieneBeca` tinyint(4) DEFAULT NULL,
  `porcentajeBeca` int(11) DEFAULT NULL,
  `idTipoBeca` int(11) DEFAULT NULL,
  `montoBeca` decimal(10,2) DEFAULT NULL,
  `idFinanciamiento` int(11) DEFAULT NULL,
  `nombreOtro` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`idTitulosProfesorCurso`),
  KEY `fk_titulos_en_curso_universidades1_idx` (`idUniversidad`),
  KEY `fk_titulos_en_curso_grados_academicos1_idx` (`idGradoAcademico`),
  KEY `fk_titulos_en_curso_tipos_becas1_idx` (`idTipoBeca`),
  KEY `fk_titulos_en_curso_financiamiento_beca1_idx` (`idFinanciamiento`),
  KEY `fk_titulos_en_curso_campo_detallado_unesco1_idx` (`idCampoDetalladoUnesco`),
  KEY `fk_titulos_en_curso_profesores1_idx` (`idProfesor`),
  CONSTRAINT `fk_titulos_en_curso_campo_detallado_unesco1` FOREIGN KEY (`idCampoDetalladoUnesco`) REFERENCES `campo_detallado_unesco` (`idCampoDetalladoUnesco`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_en_curso_financiamiento_beca1` FOREIGN KEY (`idFinanciamiento`) REFERENCES `financiamiento_beca` (`idFinanciamiento`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_en_curso_grados_academicos1` FOREIGN KEY (`idGradoAcademico`) REFERENCES `grados_academicos` (`idGradoAcademico`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_en_curso_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_en_curso_tipos_becas1` FOREIGN KEY (`idTipoBeca`) REFERENCES `tipos_becas` (`idTipoBeca`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_en_curso_universidades1` FOREIGN KEY (`idUniversidad`) REFERENCES `universidades` (`idUniversidad`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `titulos_profesores` (
  `idTitulosProfesor` int(11) NOT NULL AUTO_INCREMENT,
  `idProfesor` varchar(14) NOT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `idUniversidad` int(11) NOT NULL,
  `idGradoAcademico` int(11) NOT NULL,
  `codigo_senescyt` varchar(90) DEFAULT NULL,
  `fecha_obtencion` date DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `idCampoDetalladoUnesco` int(11) NOT NULL,
  `archivoTitulo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idTitulosProfesor`),
  KEY `fk_titulos_universidades1_idx` (`idUniversidad`),
  KEY `fk_titulos_grados_academicos1_idx` (`idGradoAcademico`),
  KEY `fk_titulos_profesores_campo_detallado_unesco1_idx` (`idCampoDetalladoUnesco`),
  KEY `fk_titulos_profesores_profesores1_idx` (`idProfesor`),
  CONSTRAINT `fk_titulos_grados_academicos1` FOREIGN KEY (`idGradoAcademico`) REFERENCES `grados_academicos` (`idGradoAcademico`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_profesores_campo_detallado_unesco1` FOREIGN KEY (`idCampoDetalladoUnesco`) REFERENCES `campo_detallado_unesco` (`idCampoDetalladoUnesco`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_profesores_profesores1` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_titulos_universidades1` FOREIGN KEY (`idUniversidad`) REFERENCES `universidades` (`idUniversidad`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=latin1;
CREATE TABLE `universidades` (
  `idUniversidad` int(11) NOT NULL AUTO_INCREMENT,
  `idpaises` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `codigo_siees` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idUniversidad`),
  KEY `fk_universidades_paises1_idx` (`idpaises`),
  CONSTRAINT `fk_universidades_paises1` FOREIGN KEY (`idpaises`) REFERENCES `paises` (`idpaises`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=380 DEFAULT CHARSET=latin1;
CREATE TABLE `usuario_rol` (
  `idUsuarioRol` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `idRol` int(11) NOT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_modificacion` date DEFAULT NULL,
  `esActivo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idUsuarioRol`),
  KEY `fk_usuario_rol_rol1_idx` (`idRol`),
  KEY `fk_usuario_rol_usuarios1_idx` (`usuario`),
  CONSTRAINT `fk_usuario_rol_rol1` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
CREATE TABLE `usuarios` (
  `usuario` varchar(50) NOT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `clave` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `administrador` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
CREATE TABLE `usuarios_web` (
  `usuario` varchar(20) NOT NULL,
  `password` varchar(20) DEFAULT NULL,
  `salida` tinyint(4) DEFAULT '0',
  `ingreso` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '0',
  `asistencia` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `usuariosdepartamentossolicitudes` (
  `idUsuarioDepartamentoSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `idTipoSolicitud` int(11) DEFAULT NULL,
  `idUsuarioSolicitud` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaBaja` datetime DEFAULT NULL,
  PRIMARY KEY (`idUsuarioDepartamentoSolicitud`),
  KEY `idUsuarioSolicitud` (`idUsuarioSolicitud`),
  KEY `idTipoSolicitud` (`idTipoSolicitud`),
  CONSTRAINT `usuariosdepartamentossolicitudes_ibfk_1` FOREIGN KEY (`idUsuarioSolicitud`) REFERENCES `usuariossolicitudes` (`idUsuarioSolicitud`),
  CONSTRAINT `usuariosdepartamentossolicitudes_ibfk_2` FOREIGN KEY (`idTipoSolicitud`) REFERENCES `tipossolicitudes` (`idTipoSolicitud`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `usuariossolicitudes` (
  `idUsuarioSolicitud` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(60) DEFAULT NULL,
  `clave` varchar(20) DEFAULT NULL,
  `resetear` tinyint(4) DEFAULT '0',
  `email` varchar(60) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `Administrador` tinyint(4) DEFAULT '0',
  `nombre` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idUsuarioSolicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
 1 AS `idmatricula`,
 1 AS `idalumno`,
 1 AS `Nivel`,
 1 AS `seccion`,
 1 AS `modalidad`,
 1 AS `idperiodo`,
 1 AS `paralelo`,
 1 AS `Estudiante`,
 1 AS `idcarrera`,
 1 AS `carrera`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
 1 AS `idAlumno`,
 1 AS `Datos`,
 1 AS `clave`,
 1 AS `Tipo`*/;
SET character_set_client = @saved_cs_client;
CREATE TABLE `vehiculos` (
  `idVehiculo` int(11) NOT NULL AUTO_INCREMENT,
  `idSubcategoria` int(11) DEFAULT NULL,
  `numero_vehiculo` varchar(3) DEFAULT NULL,
  `placa` varchar(10) DEFAULT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `anio` int(11) DEFAULT NULL,
  `idCategoria` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `observacion` varchar(200) DEFAULT NULL,
  `chasis` varchar(50) DEFAULT NULL,
  `motor` varchar(50) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idVehiculo`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionarea` (
  `idArea` int(11) NOT NULL AUTO_INCREMENT,
  `area` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idArea`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacioncategoriasobjetivosoportunidades` (
  `idCategoriaObjetivoOportunidad` int(11) NOT NULL AUTO_INCREMENT,
  `categoriaObjetivoOportunidad` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idCategoriaObjetivoOportunidad`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacioncategoriasresultadosaprendizajes` (
  `idCategoriaResultadoAprendizaje` int(11) NOT NULL AUTO_INCREMENT,
  `categoriaResultadoAprendizaje` varchar(50) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idCategoriaResultadoAprendizaje`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionestadosproyectos` (
  `idEstadoProyecto` int(11) NOT NULL AUTO_INCREMENT,
  `estado` varchar(100) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idEstadoProyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionhabilidadesblandas` (
  `idHablidadBlanda` int(11) NOT NULL AUTO_INCREMENT,
  `habilidadBlanda` varchar(100) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idHablidadBlanda`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionimpactosproyectos` (
  `idImpactoproyecto` int(11) NOT NULL AUTO_INCREMENT,
  `impactoProyecto` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idImpactoproyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionlineasaccion` (
  `idlineaAsccion` int(11) NOT NULL AUTO_INCREMENT,
  `linea` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`idlineaAsccion`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionobjetivosoportunidades` (
  `idObjetivoOportunidad` int(11) NOT NULL AUTO_INCREMENT,
  `idCategoriaObjetivoOportunidad` int(11) DEFAULT NULL,
  `objetivoOportunidad` varchar(500) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idObjetivoOportunidad`),
  KEY `idCategoriaObjetivoOportunidad` (`idCategoriaObjetivoOportunidad`),
  CONSTRAINT `vinculacionobjetivosoportunidades_ibfk_1` FOREIGN KEY (`idCategoriaObjetivoOportunidad`) REFERENCES `vinculacioncategoriasobjetivosoportunidades` (`idCategoriaObjetivoOportunidad`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionobjetivospedis` (
  `idObjetivoPedi` int(11) NOT NULL AUTO_INCREMENT,
  `pedi` varchar(9) DEFAULT NULL,
  `objetivoPedi` varchar(500) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idObjetivoPedi`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionpoblaciondirecta` (
  `idPoblacionDirecta` int(11) NOT NULL AUTO_INCREMENT,
  `directa` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idPoblacionDirecta`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionpoblacionexterna` (
  `idPoblacionExterna` int(11) NOT NULL AUTO_INCREMENT,
  `externa` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idPoblacionExterna`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionpoblacionindirecta` (
  `idPoblacionIndirecta` int(11) NOT NULL AUTO_INCREMENT,
  `indirecta` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idPoblacionIndirecta`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionprogramas` (
  `idPrograma` int(11) NOT NULL AUTO_INCREMENT,
  `programa` varchar(200) DEFAULT NULL,
  `descripcion` text,
  `fechaInicio` date DEFAULT NULL,
  `fechaFin` date DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idPrograma`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectos` (
  `idProyectoVinculacion` int(11) NOT NULL AUTO_INCREMENT,
  `idProgramaVinculacion` int(11) DEFAULT NULL,
  `proyecto` varchar(500) DEFAULT NULL,
  `idCampoDetalladoUnesco` int(11) DEFAULT NULL,
  `idlineaAsccion` int(11) DEFAULT NULL,
  `esAsistenciaComunitaria` tinyint(4) DEFAULT '0',
  `esEducacionContinua` tinyint(4) DEFAULT '0',
  `tiempoEstimado` varchar(50) DEFAULT NULL,
  `resumenEjecutivo` text,
  `antecedentes` text,
  `alcanceTerritorial` varchar(100) DEFAULT NULL,
  `metodologia` text,
  `impacto` text,
  `innovacion` text,
  `habilidadesDescripcion` text,
  `idProfesor` varchar(14) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  `idPoblacionDirecta` int(11) DEFAULT NULL,
  `idPoblacionIndirecta` int(11) DEFAULT NULL,
  `idPoblacionExterna` int(11) DEFAULT NULL,
  `biografia` text,
  PRIMARY KEY (`idProyectoVinculacion`),
  KEY `idCampoDetalladoUnesco` (`idCampoDetalladoUnesco`),
  KEY `idlineaAsccion` (`idlineaAsccion`),
  CONSTRAINT `vinculacionproyectos_ibfk_1` FOREIGN KEY (`idCampoDetalladoUnesco`) REFERENCES `campo_detallado_unesco` (`idCampoDetalladoUnesco`),
  CONSTRAINT `vinculacionproyectos_ibfk_2` FOREIGN KEY (`idlineaAsccion`) REFERENCES `vinculacionlineasaccion` (`idlineaAsccion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosalumnos` (
  `idProyectoAlumno` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idMatricula` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoAlumno`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idMatricula` (`idMatricula`),
  CONSTRAINT `vinculacionproyectosalumnos_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosalumnos_ibfk_2` FOREIGN KEY (`idMatricula`) REFERENCES `matriculas` (`idMatricula`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectoscarreras` (
  `idProyectoCarrera` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idCarrera` int(11) DEFAULT NULL,
  `esPrincipal` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoCarrera`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idCarrera` (`idCarrera`),
  CONSTRAINT `vinculacionproyectoscarreras_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectoscarreras_ibfk_2` FOREIGN KEY (`idCarrera`) REFERENCES `carreras` (`idCarrera`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectoscarrerasdetalle` (
  `idProyectoCarrera` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idTipoPoblacion` int(11) DEFAULT NULL,
  `poblacion` varchar(100) DEFAULT NULL,
  `descripcion` varchar(400) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  PRIMARY KEY (`idProyectoCarrera`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idTipoPoblacion` (`idTipoPoblacion`),
  CONSTRAINT `vinculacionproyectoscarrerasdetalle_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectoscarrerasdetalle_ibfk_2` FOREIGN KEY (`idTipoPoblacion`) REFERENCES `vinculaciontipospoblaciones` (`idTipoPoblacion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectoscronograma` (
  `idProyectosCronograma` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `fechaInicioPlanificada` timestamp NULL DEFAULT NULL,
  `fechaFinPlanificada` timestamp NULL DEFAULT NULL,
  `fechaInicioCumplida` timestamp NULL DEFAULT NULL,
  `fechaFinCumplida` timestamp NULL DEFAULT NULL,
  `actividad` varchar(5000) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosCronograma`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectoscronograma_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosentidades` (
  `idProyectoEntidad` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `entidad` varchar(200) DEFAULT NULL,
  `tipoEntidad` varchar(200) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoEntidad`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosentidades_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectoshabilidadesblandas` (
  `idProyectoHabilidad` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idHablidadBlanda` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoHabilidad`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idHablidadBlanda` (`idHablidadBlanda`),
  CONSTRAINT `vinculacionproyectoshabilidadesblandas_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectoshabilidadesblandas_ibfk_2` FOREIGN KEY (`idHablidadBlanda`) REFERENCES `vinculacionhabilidadesblandas` (`idHablidadBlanda`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosimpactos` (
  `idProyectoImpacto` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idImpactoproyecto` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoImpacto`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idImpactoproyecto` (`idImpactoproyecto`),
  CONSTRAINT `vinculacionproyectosimpactos_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosimpactos_ibfk_2` FOREIGN KEY (`idImpactoproyecto`) REFERENCES `vinculacionimpactosproyectos` (`idImpactoproyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosmateriales` (
  `idProyectosMateriales` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `material` varchar(5000) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `valor` decimal(5,2) DEFAULT NULL,
  `total` decimal(5,2) DEFAULT NULL,
  `instituto` int(11) NOT NULL DEFAULT '0',
  `autogestion` int(11) NOT NULL DEFAULT '0',
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosMateriales`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosmateriales_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosobjetivos` (
  `idProyectoObjetivo` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `objetivo` text,
  `esGeneral` tinyint(4) DEFAULT '0',
  `resultado` text,
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoObjetivo`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosobjetivos_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosobjetivosoportunidades` (
  `idProyectObjetivoOportunidad` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idObjetivoOportunidad` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectObjetivoOportunidad`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idObjetivoOportunidad` (`idObjetivoOportunidad`),
  CONSTRAINT `vinculacionproyectosobjetivosoportunidades_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosobjetivosoportunidades_ibfk_2` FOREIGN KEY (`idObjetivoOportunidad`) REFERENCES `vinculacionobjetivosoportunidades` (`idObjetivoOportunidad`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosobjetivospedis` (
  `idProyectoObjetivoPedi` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idObjetivoPedi` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoObjetivoPedi`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idObjetivoPedi` (`idObjetivoPedi`),
  CONSTRAINT `vinculacionproyectosobjetivospedis_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosobjetivospedis_ibfk_2` FOREIGN KEY (`idObjetivoPedi`) REFERENCES `vinculacionobjetivospedis` (`idObjetivoPedi`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosperiodos` (
  `idProyectoPeriodo` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idPeriodo` varchar(7) DEFAULT NULL,
  `esPrincipal` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoPeriodo`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosperiodos_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosplanesaprendizaje` (
  `idProyectosPlanesAprendizaje` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idProyectosResultadosAprendizaje` int(11) DEFAULT NULL,
  `actividad` varchar(5000) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosPlanesAprendizaje`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idProyectosResultadosAprendizaje` (`idProyectosResultadosAprendizaje`),
  CONSTRAINT `vinculacionproyectosplanesaprendizaje_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosplanesaprendizaje_ibfk_2` FOREIGN KEY (`idProyectosResultadosAprendizaje`) REFERENCES `vinculacionproyectosresultadosaprendizaje` (`idProyectosResultadosAprendizaje`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosplantrabajo` (
  `idProyectosPlanTrabajo` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idProyectoObjetivo` int(11) DEFAULT NULL,
  `idProyectoImpacto` int(11) DEFAULT NULL,
  `indicador` text,
  `resultadoEsperado` text,
  `actividades` text,
  `medioVerificacion` text,
  `resultados` text,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosPlanTrabajo`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idProyectoObjetivo` (`idProyectoObjetivo`),
  KEY `idProyectoImpacto` (`idProyectoImpacto`),
  CONSTRAINT `vinculacionproyectosplantrabajo_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosplantrabajo_ibfk_2` FOREIGN KEY (`idProyectoObjetivo`) REFERENCES `vinculacionproyectosobjetivos` (`idProyectoObjetivo`),
  CONSTRAINT `vinculacionproyectosplantrabajo_ibfk_3` FOREIGN KEY (`idProyectoImpacto`) REFERENCES `vinculacionproyectosimpactos` (`idProyectoImpacto`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectospoblaciones` (
  `idProyectosPoblaciones` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `nombre` varchar(500) DEFAULT NULL,
  `direccion` varchar(250) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosPoblaciones`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectospoblaciones_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectospresupuestos` (
  `idProyectoPresupuesto` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `empresa` varchar(100) DEFAULT NULL,
  `cantidad` decimal(10,2) DEFAULT '0.00',
  `orden` int(11) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoPresupuesto`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectospresupuestos_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosprofesores` (
  `idProyectoProfesor` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `esDirector` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoProfesor`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosprofesores_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosresponsables` (
  `idProyectoResponsable` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idProfesor` varchar(14) DEFAULT NULL,
  `esColaborador` tinyint(4) DEFAULT '0',
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idProyectoResponsable`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosresponsables_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionproyectosresultadosaprendizaje` (
  `idProyectosResultadosAprendizaje` int(11) NOT NULL AUTO_INCREMENT,
  `idProyectoVinculacion` int(11) DEFAULT NULL,
  `idCategoriaResultadoAprendizaje` int(11) DEFAULT NULL,
  `resultado` varchar(5000) DEFAULT NULL,
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idProyectosResultadosAprendizaje`),
  KEY `idProyectoVinculacion` (`idProyectoVinculacion`),
  KEY `idCategoriaResultadoAprendizaje` (`idCategoriaResultadoAprendizaje`),
  CONSTRAINT `vinculacionproyectosresultadosaprendizaje_ibfk_1` FOREIGN KEY (`idProyectoVinculacion`) REFERENCES `vinculacionproyectos` (`idProyectoVinculacion`),
  CONSTRAINT `vinculacionproyectosresultadosaprendizaje_ibfk_2` FOREIGN KEY (`idCategoriaResultadoAprendizaje`) REFERENCES `vinculacioncategoriasresultadosaprendizajes` (`idCategoriaResultadoAprendizaje`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionsubarea` (
  `idSubArea` int(11) NOT NULL AUTO_INCREMENT,
  `idArea` int(11) DEFAULT NULL,
  `subArea` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idSubArea`),
  KEY `idArea` (`idArea`),
  CONSTRAINT `vinculacionsubarea_ibfk_1` FOREIGN KEY (`idArea`) REFERENCES `vinculacionarea` (`idArea`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculacionsubareaespecifica` (
  `idSubAreaEspecifica` int(11) NOT NULL AUTO_INCREMENT,
  `idSubArea` int(11) DEFAULT NULL,
  `subAreaEspecifica` varchar(250) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idSubAreaEspecifica`),
  KEY `idSubArea` (`idSubArea`),
  CONSTRAINT `vinculacionsubareaespecifica_ibfk_1` FOREIGN KEY (`idSubArea`) REFERENCES `vinculacionsubarea` (`idSubArea`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `vinculaciontiposobjetivos` (
  `idTipoObjetivo` int(11) NOT NULL AUTO_INCREMENT,
  `tipoObjetivo` varchar(50) DEFAULT NULL,
  `esGeneral` tinyint(4) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idTipoObjetivo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
CREATE TABLE `vinculaciontipospoblaciones` (
  `idTipoPoblacion` int(11) NOT NULL AUTO_INCREMENT,
  `tipoPoblacion` varchar(100) DEFAULT NULL,
  `activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`idTipoPoblacion`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
