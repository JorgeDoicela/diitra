-- ============================================================
-- DIITRA: Arquitectura de Investigación Blindada (Master)
-- ============================================================

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLAS CORE (NO SE TOCAN, SOLO REFERENCIA)
-- ============================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `idUsuario`      INT(11) NOT NULL AUTO_INCREMENT,
  `usuario`        VARCHAR(50) NOT NULL,
  `nombre`         VARCHAR(200) NOT NULL,
  `contrasenia`    VARCHAR(250) NOT NULL,
  `activo`         TINYINT(4) DEFAULT 1,
  `administrador`  TINYINT(4) DEFAULT 0,
  `tipoUsuario`    ENUM('alumno', 'profesor', 'otros') DEFAULT 'profesor',
  `idSigafi`       VARCHAR(14) DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `uq_usuario_unique` (`usuario`),
  UNIQUE KEY `uq_id_sigafi` (`idSigafi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. LIMPIEZA DE TABLAS INV_ (BORRAR PARA RECREAR LIMPIO)
-- ============================================================

DROP TABLE IF EXISTS `inv_usuarios_metadata`;
DROP TABLE IF EXISTS `inv_tokens_acceso`;
DROP TABLE IF EXISTS `inv_transferencias`;
DROP TABLE IF EXISTS `inv_productos`;
DROP TABLE IF EXISTS `inv_gastos`;
DROP TABLE IF EXISTS `inv_presupuesto_items`;
DROP TABLE IF EXISTS `inv_evidencias`;
DROP TABLE IF EXISTS `inv_informes_avance`;
DROP TABLE IF EXISTS `inv_cronograma`;
DROP TABLE IF EXISTS `inv_revisiones_detalle`;
DROP TABLE IF EXISTS `inv_rubricas`;
DROP TABLE IF EXISTS `inv_revisiones`;
DROP TABLE IF EXISTS `inv_revisores_externos`;
DROP TABLE IF EXISTS `inv_institutos`;
DROP TABLE IF EXISTS `inv_notificaciones`;
DROP TABLE IF EXISTS `inv_proyectos_historial`;
DROP TABLE IF EXISTS `inv_proyectos_alumnos`;
DROP TABLE IF EXISTS `inv_proyectos_profesores`;
DROP TABLE IF EXISTS `inv_proyectos`;
DROP TABLE IF EXISTS `inv_convocatorias`;
DROP TABLE IF EXISTS `inv_lineas_investigacion`;

-- 3. CREACIÓN DE TABLAS INV_ (CON BLINDAJE INTEGRAL)
-- ============================================================

CREATE TABLE `inv_lineas_investigacion` (
  `idLinea`            INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`               CHAR(36) NOT NULL UNIQUE,
  `codigoLinea`        VARCHAR(50) NOT NULL UNIQUE,
  `nombreLinea`        VARCHAR(300) NOT NULL,
  `descripcion`        TEXT,
  `resolucionAprobacion` VARCHAR(100) DEFAULT NULL,
  `fechaRegistro`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version`            INT(11) DEFAULT 1,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_convocatorias` (
  `idConvocatoria`     INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`               CHAR(36) NOT NULL UNIQUE,
  `codigoConvocatoria` VARCHAR(50) NOT NULL UNIQUE,
  `titulo`             VARCHAR(200) NOT NULL,
  `descripcion`        TEXT,
  `idPeriodo`          CHAR(7) NOT NULL,
  `fechaApertura`      DATE NOT NULL,
  `fechaCierre`        DATE NOT NULL,
  `estado`             ENUM('borrador','abierta','en_revision','cerrada') DEFAULT 'borrador',
  `maximoProyectos`    INT(11) DEFAULT NULL,
  `idLineaInvestigacion` INT(11) DEFAULT NULL,
  `presupuestoTotal`   DECIMAL(10,2) DEFAULT 0.00,
  `usuarioCreo`        VARCHAR(20) NOT NULL,
  `fechaRegistro`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version`            INT(11) DEFAULT 1,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idConvocatoria`),
  CONSTRAINT `fk_inv_conv_linea` FOREIGN KEY (`idLineaInvestigacion`) REFERENCES `inv_lineas_investigacion` (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_proyectos` (
  `idProyecto`             INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`                   CHAR(36) NOT NULL UNIQUE,
  `idConvocatoria`         INT(11) NOT NULL,
  `codigoInstitucional`    VARCHAR(30) DEFAULT NULL,
  `titulo`                 VARCHAR(400) NOT NULL,
  `resumen`                TEXT,
  `justificacion`          TEXT,
  `metodologia`            TEXT,
  `idCampoDetalladoUnesco` INT(11) DEFAULT NULL,
  `idEspacio`              INT(11) DEFAULT NULL,
  `idProfesorDirector`     VARCHAR(14) NOT NULL,
  `estado`                 ENUM('borrador','enviado','en_revision','aprobado','en_ejecucion','finalizado','rechazado') DEFAULT 'borrador',
  `fechaInicio`            DATE DEFAULT NULL,
  `fechaFin`               DATE DEFAULT NULL,
  `presupuestoSolicitado`  DECIMAL(10,2) DEFAULT 0.00,
  `presupuestoAprobado`    DECIMAL(10,2) DEFAULT 0.00,
  `puntajeEvaluacion`      DECIMAL(5,2) DEFAULT NULL,
  `esAnonimizado`          TINYINT(4) DEFAULT 0,
  `rutaProtocolo`          VARCHAR(500) DEFAULT NULL,
  `rutaCronograma`         VARCHAR(500) DEFAULT NULL,
  `rutaResolucion`         VARCHAR(500) DEFAULT NULL,
  `fechaRegistro`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version`                INT(11) DEFAULT 1,
  `activo`                 TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyecto`),
  CONSTRAINT `fk_inv_proy_conv` FOREIGN KEY (`idConvocatoria`) REFERENCES `inv_convocatorias` (`idConvocatoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_proyectos_profesores` (
  `idProyectoProfesor`  INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`                CHAR(36) NOT NULL UNIQUE,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesor`          VARCHAR(14) NOT NULL,
  `rol`                 ENUM('director','coinvestigador','colaborador') DEFAULT 'coinvestigador',
  `horasSemanales`      DECIMAL(5,2) DEFAULT 0.00,
  `fechaRegistro`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version`             INT(11) DEFAULT 1,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoProfesor`),
  UNIQUE KEY `uq_proyecto_profesor` (`idProyecto`, `idProfesor`),
  CONSTRAINT `fk_inv_pp_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_proyectos_alumnos` (
  `idProyectoAlumno`  INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36) NOT NULL UNIQUE,
  `idProyecto`        INT(11) NOT NULL,
  `idAlumno`          VARCHAR(14) NOT NULL,
  `rol`               VARCHAR(100) DEFAULT 'Investigador Auxiliar',
  `fechaRegistro`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version`           INT(11) DEFAULT 1,
  `activo`            TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoAlumno`),
  UNIQUE KEY `uq_proyecto_alumno` (`idProyecto`, `idAlumno`),
  CONSTRAINT `fk_inv_pa_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_institutos` (
  `idInstitucion`    INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`             CHAR(36) NOT NULL UNIQUE,
  `nombre`           VARCHAR(200) NOT NULL,
  `siglas`           VARCHAR(20) DEFAULT NULL,
  `ruc`              VARCHAR(20) DEFAULT NULL,
  `tipo`             ENUM('Publica', 'Privada', 'Internacional', 'Organismo') NOT NULL DEFAULT 'Publica',
  `pais`             VARCHAR(100) DEFAULT 'Ecuador',
  `ciudad`           VARCHAR(100) DEFAULT NULL,
  `sitioWeb`         VARCHAR(250) DEFAULT NULL,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version`          INT(11) DEFAULT 1,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idInstitucion`),
  UNIQUE KEY `uq_inv_inst_ruc` (`ruc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_revisores_externos` (
  `idRevisorExterno` INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`             CHAR(36) NOT NULL UNIQUE,
  `nombre`           VARCHAR(150) NOT NULL,
  `apellido`         VARCHAR(150) NOT NULL,
  `email`            VARCHAR(200) NOT NULL,
  `idInstitucion`    INT(11) DEFAULT NULL,
  `tituloAcademico`  VARCHAR(200) DEFAULT NULL,
  `especialidad`     VARCHAR(300) DEFAULT NULL,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version`          INT(11) DEFAULT 1,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRevisorExterno`),
  UNIQUE KEY `uq_inv_ext_email` (`email`),
  CONSTRAINT `fk_inv_ext_inst` FOREIGN KEY (`idInstitucion`) REFERENCES `inv_institutos` (`idInstitucion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_revisiones` (
  `idRevision`          INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`                CHAR(36) NOT NULL UNIQUE,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesorRevisor`   VARCHAR(14) DEFAULT NULL,
  `idRevisorExterno`    INT(11) DEFAULT NULL,
  `esDoubleCiego`       TINYINT(4) DEFAULT 1,
  `estado`              ENUM('pendiente','en_proceso','finalizado','rechazado') DEFAULT 'pendiente',
  `puntajeTotal`        DECIMAL(5,2) DEFAULT NULL,
  `comentarios`         TEXT DEFAULT NULL,
  `fechaAsignacion`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaLimite`         DATE DEFAULT NULL,
  `fechaEntrega`        TIMESTAMP NULL DEFAULT NULL,
  `fechaModificacion`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version`             INT(11) DEFAULT 1,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRevision`),
  CONSTRAINT `fk_inv_rev_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_rev_ext`      FOREIGN KEY (`idRevisorExterno`)  REFERENCES `inv_revisores_externos` (`idRevisorExterno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_rubricas` (
  `idRubrica`    INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`         CHAR(36) NOT NULL UNIQUE,
  `criterio`     VARCHAR(200) NOT NULL,
  `descripcion`  TEXT,
  `puntajeMax`   DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `orden`        INT(11) DEFAULT 0,
  `fechaRegistro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version`      INT(11) DEFAULT 1,
  `activo`       TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRubrica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_revisiones_detalle` (
  `idDetalleRevision` INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36) NOT NULL UNIQUE,
  `idRevision`        INT(11) NOT NULL,
  `idRubrica`         INT(11) NOT NULL,
  `puntaje`           DECIMAL(5,2) DEFAULT 0.00,
  `observacion`       TEXT DEFAULT NULL,
  `version`           INT(11) DEFAULT 1,
  PRIMARY KEY (`idDetalleRevision`),
  UNIQUE KEY `uq_revision_rubrica` (`idRevision`, `idRubrica`),
  CONSTRAINT `fk_inv_rd_rev` FOREIGN KEY (`idRevision`) REFERENCES `inv_revisiones` (`idRevision`),
  CONSTRAINT `fk_inv_rd_rub` FOREIGN KEY (`idRubrica`) REFERENCES `inv_rubricas` (`idRubrica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inv_usuarios_metadata` (
  `idMetadata`      INT(11) NOT NULL AUTO_INCREMENT,
  `uuid`            CHAR(36) NOT NULL UNIQUE,
  `idUsuario`       INT(11) NOT NULL UNIQUE,
  `configuracion`   JSON DEFAULT NULL,
  `fechaRegistro`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaUltimoAcceso` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `version`         INT(11) DEFAULT 1,
  PRIMARY KEY (`idMetadata`),
  CONSTRAINT `fk_inv_meta_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. POBLADO DE DATOS (UUIDs AUTOMÁTICOS)
-- ============================================================

INSERT INTO `inv_usuarios_metadata` (uuid, idUsuario, version)
SELECT UUID(), idUsuario, 1
FROM usuarios
WHERE idUsuario NOT IN (SELECT idUsuario FROM inv_usuarios_metadata);

-- Finalización
SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Instalación Master DIITRA Completada Correctamente' AS Resultado;
