-- ============================================================
-- SIGAFI: Centralización de Identidad y Permisos Modulares Core
-- Basado en el esquema institucional para SSO
-- ============================================================

-- 1. Tabla de Usuarios
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

-- 2. Tabla de Roles Institucionales
CREATE TABLE IF NOT EXISTS `roles` (
  `idRol`        INT(11) NOT NULL AUTO_INCREMENT,
  `Nombre`       VARCHAR(255) NOT NULL,
  `codigo_rol`   VARCHAR(50) NOT NULL,
  `esActivo`     TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `uq_inv_roles_codigo` (`codigo_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Usuario-Rol
CREATE TABLE IF NOT EXISTS `usuarios_roles` (
  `idUsuarioRol`       INT(11) NOT NULL AUTO_INCREMENT,
  `idUsuario`          INT(11) NOT NULL,
  `idRol`              INT(11) NOT NULL,
  `fecha_creacion`     DATE DEFAULT NULL,
  `fecha_modificacion` DATE DEFAULT NULL,
  `esActivo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idUsuarioRol`),
  CONSTRAINT `fk_ur_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`),
  CONSTRAINT `fk_ur_rol` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Estructura de Permisos Modulares
CREATE TABLE IF NOT EXISTS `sistemas` (
  `idSistema` INT(11) NOT NULL AUTO_INCREMENT,
  `detalle`   VARCHAR(50) NOT NULL,
  PRIMARY KEY (`idSistema`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `modulos` (
  `idModulos`  INT(11) NOT NULL AUTO_INCREMENT,
  `id_sistema` INT(11) NOT NULL,
  `Nombre`     VARCHAR(255) NOT NULL,
  `esActivo`   TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idModulos`),
  CONSTRAINT `fk_mod_sistema` FOREIGN KEY (`id_sistema`) REFERENCES `sistemas` (`idSistema`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `operaciones` (
  `idOperaciones`   INT(11) NOT NULL AUTO_INCREMENT,
  `NombreOperacion` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`idOperaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `modulos_operaciones` (
  `idModulosOperaciones` INT(11) NOT NULL AUTO_INCREMENT,
  `idModulos`            INT(11) NOT NULL,
  `idOperaciones`        INT(11) NOT NULL,
  `fecha_creacion`       DATE DEFAULT NULL,
  `fecha_modificacion`    DATE DEFAULT NULL,
  `esActivo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idModulosOperaciones`),
  CONSTRAINT `fk_mo_mod` FOREIGN KEY (`idModulos`) REFERENCES `modulos` (`idModulos`),
  CONSTRAINT `fk_mo_oper` FOREIGN KEY (`idOperaciones`) REFERENCES `operaciones` (`idOperaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles_modulos_operaciones` (
  `idRolModuloOperacion` INT(11) NOT NULL AUTO_INCREMENT,
  `idModulosOperaciones` INT(11) NOT NULL,
  `idRol`                INT(11) NOT NULL,
  `fecha_asignacion`     DATE DEFAULT NULL,
  `fecha_modificacion`   DATE DEFAULT NULL,
  `fecha_desactivacion`  DATE DEFAULT NULL,
  `esActivo`             TINYINT(4) DEFAULT 1,
  `usuario_asigno`       VARCHAR(150) DEFAULT NULL,
  `usuario_desactivo`    VARCHAR(150) DEFAULT NULL,
  PRIMARY KEY (`idRolModuloOperacion`),
  CONSTRAINT `fk_rmo_mo` FOREIGN KEY (`idModulosOperaciones`) REFERENCES `modulos_operaciones` (`idModulosOperaciones`),
  CONSTRAINT `fk_rmo_rol` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BOOTSTRAP DE DATOS INICIALES (Configuración de DIITRA)
-- ============================================================

INSERT IGNORE INTO `roles` (`Nombre`, `codigo_rol`, `esActivo`) VALUES
('Administrador del Sistema', 'ADMIN_SIST',   1),
('Docente Investigador',      'DOCENTE_IN',   1),
('Director de Investigación', 'DIRECTOR_INV', 1),
('Revisor Externo',           'REVISOR_EXT',  1);

INSERT IGNORE INTO `sistemas` (`detalle`) VALUES ('DIITRA - Investigación');

INSERT IGNORE INTO `operaciones` (`NombreOperacion`) VALUES
('VER'), ('CREAR'), ('EDITAR'), ('ELIMINAR'), ('APROBAR'),
('POSTULAR'), ('GESTIONAR'), ('REPORTES'), ('ASIGNAR');

INSERT IGNORE INTO `modulos` (`id_sistema`, `Nombre`, `esActivo`)
SELECT idSistema, 'PROYECTOS', 1 FROM `sistemas` WHERE `detalle` = 'DIITRA - Investigación'
UNION ALL
SELECT idSistema, 'CONVOCATORIAS', 1 FROM `sistemas` WHERE `detalle` = 'DIITRA - Investigación'
UNION ALL
SELECT idSistema, 'USUARIOS', 1 FROM `sistemas` WHERE `detalle` = 'DIITRA - Investigación'
UNION ALL
SELECT idSistema, 'CONFIGURACION', 1 FROM `sistemas` WHERE `detalle` = 'DIITRA - Investigación';

INSERT IGNORE INTO `modulos_operaciones` (`idModulos`, `idOperaciones`, `fecha_creacion`, `esActivo`)
SELECT m.idModulos, o.idOperaciones, CURDATE(), 1 
FROM `modulos` m
JOIN `sistemas` s ON m.id_sistema = s.idSistema
CROSS JOIN `operaciones` o
WHERE s.detalle = 'DIITRA - Investigación';

INSERT IGNORE INTO `roles_modulos_operaciones` (`idModulosOperaciones`, `idRol`, `fecha_asignacion`, `esActivo`)
SELECT mo.idModulosOperaciones, r.idRol, CURDATE(), 1
FROM `modulos_operaciones` mo
JOIN `modulos` m ON mo.idModulos = m.idModulos
JOIN `sistemas` s ON m.id_sistema = s.idSistema
CROSS JOIN `roles` r
WHERE s.detalle = 'DIITRA - Investigación'
  AND r.codigo_rol = 'ADMIN_SIST';

INSERT IGNORE INTO `usuarios_roles` (`idUsuario`, `idRol`, `fecha_creacion`, `esActivo`)
SELECT u.idUsuario, r.idRol, CURDATE(), 1
FROM `usuarios` u
CROSS JOIN `roles` r
WHERE u.usuario = '0302144159'
  AND r.codigo_rol = 'ADMIN_SIST';

UPDATE `usuarios` SET `administrador` = 1 WHERE `usuario` = '0302144159';

-- ============================================================
-- MÓDULOS DE INVESTIGACIÓN (Tablas inv_)
-- ============================================================

CREATE TABLE IF NOT EXISTS `inv_lineas_investigacion` (
  `idLinea`            INT(11) NOT NULL AUTO_INCREMENT,
  `nombreLinea`        VARCHAR(300) NOT NULL,
  `descripcion`        TEXT,
  `resolucionAprobacion` VARCHAR(100) DEFAULT NULL,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_convocatorias` (
  `idConvocatoria`     INT(11) NOT NULL AUTO_INCREMENT,
  `titulo`             VARCHAR(200) NOT NULL,
  `descripcion`        TEXT,
  `idPeriodo` CHAR(7) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `fechaApertura`      DATE NOT NULL,
  `fechaCierre`        DATE NOT NULL,
  `estado`             ENUM('borrador','abierta','en_revision','cerrada') DEFAULT 'borrador',
  `maximoProyectos`    INT(11) DEFAULT NULL,
  `idLineaInvestigacion` INT(11) DEFAULT NULL,
  `presupuestoTotal`   DECIMAL(10,2) DEFAULT 0.00,
  `usuarioCreo`        VARCHAR(20) NOT NULL,
  `fechaRegistro`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idConvocatoria`),
  KEY `fk_inv_convocatorias_periodos` (`idPeriodo`),
  CONSTRAINT `fk_inv_conv_periodos` FOREIGN KEY (`idPeriodo`) REFERENCES `periodos` (`idPeriodo`),
  CONSTRAINT `fk_inv_conv_linea` FOREIGN KEY (`idLineaInvestigacion`) REFERENCES `inv_lineas_investigacion` (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_proyectos` (
  `idProyecto`             INT(11) NOT NULL AUTO_INCREMENT,
  `idConvocatoria`         INT(11) NOT NULL,
  `codigoInstitucional`    VARCHAR(30) DEFAULT NULL,
  `titulo`                 VARCHAR(400) NOT NULL,
  `resumen`                TEXT,
  `justificacion`          TEXT,
  `metodologia`            TEXT,
  `idCampoDetalladoUnesco` INT(11) DEFAULT NULL,
  `idEspacio`              INT(11) DEFAULT NULL,
  `idProfesorDirector`     VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
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
  `activo`                 TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyecto`),
  KEY `fk_inv_proyectos_convocatoria` (`idConvocatoria`),
  KEY `fk_inv_proyectos_director` (`idProfesorDirector`),
  KEY `fk_inv_proyectos_unesco` (`idCampoDetalladoUnesco`),
  KEY `fk_inv_proyectos_espacio` (`idEspacio`),
  CONSTRAINT `fk_inv_proy_conv` FOREIGN KEY (`idConvocatoria`) REFERENCES `inv_convocatorias` (`idConvocatoria`),
  CONSTRAINT `fk_inv_proy_director` FOREIGN KEY (`idProfesorDirector`) REFERENCES `profesores` (`idProfesor`),
  CONSTRAINT `fk_inv_proy_unesco` FOREIGN KEY (`idCampoDetalladoUnesco`) REFERENCES `campo_detallado_unesco` (`idCampoDetalladoUnesco`),
  CONSTRAINT `fk_inv_proy_espacio` FOREIGN KEY (`idEspacio`) REFERENCES `espacios` (`idEspacio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_proyectos_profesores` (
  `idProyectoProfesor`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesor`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `rol`                 ENUM('director','coinvestigador','colaborador') DEFAULT 'coinvestigador',
  `horasSemanales`      DECIMAL(5,2) DEFAULT 0.00,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoProfesor`),
  UNIQUE KEY `uq_proyecto_profesor` (`idProyecto`, `idProfesor`),
  KEY `fk_inv_pp_profesor` (`idProfesor`),
  CONSTRAINT `fk_inv_pp_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_pp_prof` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_proyectos_alumnos` (
  `idProyectoAlumno`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`        INT(11) NOT NULL,
  `idAlumno`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `rol`               VARCHAR(100) DEFAULT 'Investigador Auxiliar',
  `activo`            TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoAlumno`),
  UNIQUE KEY `uq_proyecto_alumno` (`idProyecto`, `idAlumno`),
  CONSTRAINT `fk_inv_pa_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_pa_alum` FOREIGN KEY (`idAlumno`) REFERENCES `alumnos` (`idAlumno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_institutos` (
  `idInstitucion`    INT(11) NOT NULL AUTO_INCREMENT,
  `nombre`           VARCHAR(200) NOT NULL,
  `siglas`           VARCHAR(20) DEFAULT NULL,
  `ruc`              VARCHAR(20) DEFAULT NULL,
  `tipo`             ENUM('Publica', 'Privada', 'Internacional', 'Organismo') NOT NULL DEFAULT 'Publica',
  `pais`             VARCHAR(100) DEFAULT 'Ecuador',
  `ciudad`           VARCHAR(100) DEFAULT NULL,
  `sitioWeb`         VARCHAR(250) DEFAULT NULL,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idInstitucion`),
  UNIQUE KEY `uq_inv_inst_ruc` (`ruc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `inv_institutos` (`idInstitucion`, `nombre`, `siglas`, `ruc`, `tipo`, `pais`, `ciudad`, `sitioWeb`) VALUES
(1, 'Universidad Central del Ecuador', 'UCE', '1760001550001', 'Publica', 'Ecuador', 'Quito', 'https://www.uce.edu.ec'),
(2, 'Escuela Politécnica Nacional', 'EPN', '1760002100001', 'Publica', 'Ecuador', 'Quito', 'https://www.epn.edu.ec'),
(3, 'Universidad de las Fuerzas Armadas', 'ESPE', '1768025210001', 'Publica', 'Ecuador', 'Sangolquí', 'https://www.espe.edu.ec'),
(4, 'Pontificia Universidad Católica del Ecuador', 'PUCE', '1790103748001', 'Privada', 'Ecuador', 'Quito', 'https://www.puce.edu.ec'),
(5, 'Consejo de Educación Superior', 'CES', NULL, 'Organismo', 'Ecuador', 'Quito', 'https://www.ces.gob.ec');

CREATE TABLE IF NOT EXISTS `inv_revisores_externos` (
  `idRevisorExterno` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre`           VARCHAR(150) NOT NULL,
  `apellido`         VARCHAR(150) NOT NULL,
  `email`            VARCHAR(200) NOT NULL,
  `idInstitucion`    INT(11) DEFAULT NULL,
  `tituloAcademico`  VARCHAR(200) DEFAULT NULL,
  `especialidad`     VARCHAR(300) DEFAULT NULL,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRevisorExterno`),
  UNIQUE KEY `uq_inv_ext_email` (`email`),
  CONSTRAINT `fk_inv_ext_inst` FOREIGN KEY (`idInstitucion`) REFERENCES `inv_institutos` (`idInstitucion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_revisiones` (
  `idRevision`          INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesorRevisor`   VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `idRevisorExterno`    INT(11) DEFAULT NULL,
  `esDoubleCiego`       TINYINT(4) DEFAULT 1,
  `estado`              ENUM('pendiente','en_proceso','finalizado','rechazado') DEFAULT 'pendiente',
  `puntajeTotal`        DECIMAL(5,2) DEFAULT NULL,
  `comentarios`         TEXT DEFAULT NULL,
  `fechaAsignacion`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaLimite`         DATE DEFAULT NULL,
  `fechaEntrega`        TIMESTAMP NULL DEFAULT NULL,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRevision`),
  KEY `fk_inv_rev_proy` (`idProyecto`),
  KEY `fk_inv_rev_revisor` (`idProfesorRevisor`),
  KEY `fk_inv_rev_revisor_ext` (`idRevisorExterno`),
  CONSTRAINT `fk_inv_rev_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_rev_profesor` FOREIGN KEY (`idProfesorRevisor`) REFERENCES `profesores` (`idProfesor`),
  CONSTRAINT `fk_inv_rev_ext`      FOREIGN KEY (`idRevisorExterno`)  REFERENCES `inv_revisores_externos` (`idRevisorExterno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_rubricas` (
  `idRubrica`    INT(11) NOT NULL AUTO_INCREMENT,
  `criterio`     VARCHAR(200) NOT NULL,
  `descripcion`  TEXT,
  `puntajeMax`   DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `orden`        INT(11) DEFAULT 0,
  `activo`       TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRubrica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_revisiones_detalle` (
  `idDetalleRevision` INT(11) NOT NULL AUTO_INCREMENT,
  `idRevision`        INT(11) NOT NULL,
  `idRubrica`         INT(11) NOT NULL,
  `puntaje`           DECIMAL(5,2) DEFAULT 0.00,
  `observacion`       TEXT DEFAULT NULL,
  PRIMARY KEY (`idDetalleRevision`),
  UNIQUE KEY `uq_revision_rubrica` (`idRevision`, `idRubrica`),
  CONSTRAINT `fk_inv_rd_rev` FOREIGN KEY (`idRevision`) REFERENCES `inv_revisiones` (`idRevision`),
  CONSTRAINT `fk_inv_rd_rub` FOREIGN KEY (`idRubrica`) REFERENCES `inv_rubricas` (`idRubrica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_cronograma` (
  `idTarea`           INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`        INT(11) NOT NULL,
  `nombreTarea`       VARCHAR(300) NOT NULL,
  `descripcion`       TEXT,
  `fechaInicio`       DATE NOT NULL,
  `fechaFin`          DATE NOT NULL,
  `porcentajeAvance`  TINYINT(4) DEFAULT 0,
  `esHito`            TINYINT(4) DEFAULT 0,
  `orden`             INT(11) DEFAULT 0,
  `activo`            TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idTarea`),
  KEY `fk_inv_cron_proy` (`idProyecto`),
  CONSTRAINT `fk_inv_cron_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_informes_avance` (
  `idInforme`           INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesor`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `titulo`              VARCHAR(200) NOT NULL,
  `descripcion`         TEXT,
  `porcentajeAvance`    TINYINT(4) DEFAULT 0,
  `periodoReporte`      VARCHAR(50) DEFAULT NULL,
  `rutaArchivo`         VARCHAR(500) DEFAULT NULL,
  `estado`              ENUM('borrador','enviado','revisado','aprobado') DEFAULT 'borrador',
  `observacionDirector` TEXT DEFAULT NULL,
  `fechaRegistro`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaEntrega`        DATE DEFAULT NULL,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idInforme`),
  KEY `fk_inv_ia_proy` (`idProyecto`),
  CONSTRAINT `fk_inv_ia_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_ia_profesor` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_evidencias` (
  `idEvidencia`   INT(11) NOT NULL AUTO_INCREMENT,
  `idInforme`     INT(11) NOT NULL,
  `tipoEvidencia` ENUM('foto','factura','bitacora','otro') DEFAULT 'otro',
  `nombreArchivo` VARCHAR(300) NOT NULL,
  `rutaArchivo`   VARCHAR(500) NOT NULL,
  `mimeType`      VARCHAR(100) DEFAULT NULL,
  `tamanioBytes`  INT(11) DEFAULT NULL,
  `descripcion`   VARCHAR(500) DEFAULT NULL,
  `fechaSubida`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEvidencia`),
  KEY `fk_inv_ev_informe` (`idInforme`),
  CONSTRAINT `fk_inv_ev_inf` FOREIGN KEY (`idInforme`) REFERENCES `inv_informes_avance` (`idInforme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_presupuesto_items` (
  `idItem`       INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`   INT(11) NOT NULL,
  `categoria`    ENUM('materiales','equipos','servicios','viajes','publicacion','otro') DEFAULT 'otro',
  `descripcion`  VARCHAR(500) NOT NULL,
  `cantidad`     DECIMAL(10,2) DEFAULT 1.00,
  `valorUnitario` DECIMAL(10,2) DEFAULT 0.00,
  `valorTotal`   DECIMAL(10,2) DEFAULT 0.00,
  `activo`       TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idItem`),
  CONSTRAINT `fk_inv_pi_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_gastos` (
  `idGasto`         INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`      INT(11) NOT NULL,
  `idItem`          INT(11) DEFAULT NULL,
  `descripcion`     VARCHAR(500) NOT NULL,
  `monto`           DECIMAL(10,2) DEFAULT 0.00,
  `fechaGasto`      DATE NOT NULL,
  `numeroFactura`   VARCHAR(50) DEFAULT NULL,
  `rutaFactura`     VARCHAR(500) DEFAULT NULL,
  `registradoPor`   VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `fechaRegistro`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idGasto`),
  KEY `fk_inv_ga_proy` (`idProyecto`),
  CONSTRAINT `fk_inv_ga_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_ga_item` FOREIGN KEY (`idItem`) REFERENCES `inv_presupuesto_items` (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_productos` (
  `idProducto`       INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`       INT(11) NOT NULL,
  `tipo`             ENUM('articulo_indexado','articulo_no_indexado','libro','capitulo_libro','ponencia','patente','software','prototipo','otro') NOT NULL,
  `titulo`           VARCHAR(500) NOT NULL,
  `autores`          TEXT,
  `issn_isbn`        VARCHAR(50) DEFAULT NULL,
  `urlPublicacion`   VARCHAR(500) DEFAULT NULL,
  `nombreRevista`    VARCHAR(300) DEFAULT NULL,
  `indice`           VARCHAR(100) DEFAULT NULL,
  `fechaPublicacion` DATE DEFAULT NULL,
  `rutaArchivo`      VARCHAR(500) DEFAULT NULL,
  `numeroRegistro`   VARCHAR(100) DEFAULT NULL,
  `activo`           TINYINT(4) DEFAULT 1,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idProducto`),
  CONSTRAINT `fk_inv_prod_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_transferencias` (
  `idTransferencia`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`       INT(11) NOT NULL,
  `empresaBeneficiaria` VARCHAR(300) NOT NULL,
  `tipoTransferencia` ENUM('licencia','cesion','consultoria','otro') DEFAULT 'otro',
  `descripcion`      TEXT,
  `valorConvenio`    DECIMAL(10,2) DEFAULT 0.00,
  `fechaConvenio`    DATE DEFAULT NULL,
  `rutaConvenio`     VARCHAR(500) DEFAULT NULL,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idTransferencia`),
  CONSTRAINT `fk_inv_trans_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_proyectos_historial` (
  `idHistorial`   INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`    INT(11) NOT NULL,
  `estadoAnterior` VARCHAR(50) DEFAULT NULL,
  `estadoNuevo`   VARCHAR(50) NOT NULL,
  `comentario`    TEXT,
  `usuarioCambio` VARCHAR(20) NOT NULL,
  `fechaCambio`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idHistorial`),
  CONSTRAINT `fk_inv_hist_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inv_notificaciones` (
  `idNotificacion`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`      INT(11) DEFAULT NULL,
  `destinatario`    VARCHAR(14) NOT NULL,
  `tipoDestinatario` ENUM('profesor','alumno') DEFAULT 'profesor',
  `tipo`            ENUM('alerta_plazo','aprobacion','rechazo','revision','informe','otro') DEFAULT 'otro',
  `titulo`          VARCHAR(200) NOT NULL,
  `mensaje`         TEXT NOT NULL,
  `leida`           TINYINT(4) DEFAULT 0,
  `fechaEnvio`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaLectura`    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idNotificacion`),
  KEY `fk_inv_notif_proy` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `inv_rubricas` (`criterio`, `descripcion`, `puntajeMax`, `orden`) VALUES
('Pertinencia y Coherencia', 'El proyecto responde a las necesidades del contexto y las líneas institucionales de investigación.', 20.00, 1),
('Marco Teórico y Metodología', 'El sustento teórico y los métodos propuestos son apropiados y rigurosos.', 25.00, 2),
('Viabilidad y Factibilidad', 'El cronograma y presupuesto son realistas y alcanzables en el período propuesto.', 20.00, 3),
('Innovación e Impacto', 'El proyecto genera un aporte significativo y transferible al sector productivo o académico.', 25.00, 4),
('Presentación y Forma', 'El documento cumple con las normas APA y el formato institucional requerido.', 10.00, 5);

CREATE TABLE IF NOT EXISTS `inv_tokens_acceso` (
  `idToken`          INT(11) NOT NULL AUTO_INCREMENT,
  `token`            VARCHAR(256) NOT NULL,
  `idReferencia`     VARCHAR(20) NOT NULL,
  `tipoReferencia`   ENUM('profesor', 'externo') NOT NULL,
  `fechaExpiracion`  DATETIME NOT NULL,
  `usado`            TINYINT(4) DEFAULT 0,
  `scopes`           VARCHAR(200) DEFAULT NULL,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idToken`),
  UNIQUE KEY `uq_inv_tokens_val` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
