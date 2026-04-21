-- ============================================================
-- SIGAFI: Centralización de Identidad y Permisos Modulares Core
-- Basado en el esquema institucional para SSO
-- ============================================================

---- Limpieza preventiva de tablas de identidad y seguridad
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `rol_modulo_operacion`;
DROP TABLE IF EXISTS `modulos_operacion`;
DROP TABLE IF EXISTS `operaciones`;
DROP TABLE IF EXISTS `modulos`;
DROP TABLE IF EXISTS `sistema`;
DROP TABLE IF EXISTS `usuario_rol`;
DROP TABLE IF EXISTS `rol`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla de Usuarios
CREATE TABLE `usuarios` (
  `usuario`        VARCHAR(50) NOT NULL,
  `nombre`         VARCHAR(200) NOT NULL,
  `clave`          VARCHAR(100) NOT NULL,
  `activo`         TINYINT(4) DEFAULT 1,
  `administrador`  TINYINT(4) DEFAULT 0,
  `tipo_usuario`   ENUM('profesor', 'alumno', 'externo', 'admin') DEFAULT 'profesor',
  `idSigafi`       VARCHAR(14) DEFAULT NULL,
  PRIMARY KEY (`usuario`),
  UNIQUE KEY `uq_id_sigafi` (`idSigafi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla de Roles Institucionales
CREATE TABLE `rol` (
  `idRol`        INT(11) NOT NULL AUTO_INCREMENT,
  `Nombre`       VARCHAR(255) NOT NULL,
  `codigo_rol`   VARCHAR(50) NOT NULL,
  `esActivo`     TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `uq_inv_roles_codigo` (`codigo_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de Usuario-Rol (Mapping Centralizado)
CREATE TABLE IF NOT EXISTS `usuario_rol` (
  `idUsuarioRol`       INT(11) NOT NULL AUTO_INCREMENT,
  `usuario`            VARCHAR(50) NOT NULL,
  `idRol`              INT(11) NOT NULL,
  `fecha_creacion`     DATE DEFAULT NULL,
  `fecha_modificacion` DATE DEFAULT NULL,
  `esActivo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idUsuarioRol`),
  CONSTRAINT `fk_ur_usuario` FOREIGN KEY (`usuario`) REFERENCES `usuarios` (`usuario`),
  CONSTRAINT `fk_ur_rol` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Estructura de Permisos Modulares
CREATE TABLE IF NOT EXISTS `sistema` (
  `idSistema` INT(11) NOT NULL AUTO_INCREMENT,
  `detalle`   VARCHAR(50) NOT NULL,
  PRIMARY KEY (`idSistema`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `modulos` (
  `idModulos`  INT(11) NOT NULL AUTO_INCREMENT,
  `id_sistema` INT(11) NOT NULL,
  `Nombre`     VARCHAR(255) NOT NULL,
  `esActivo`   TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idModulos`),
  CONSTRAINT `fk_mod_sistema` FOREIGN KEY (`id_sistema`) REFERENCES `sistema` (`idSistema`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `operaciones` (
  `idOperaciones`   INT(11) NOT NULL AUTO_INCREMENT,
  `NombreOperacion` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`idOperaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `modulos_operacion` (
  `idModulosOperaciones` INT(11) NOT NULL AUTO_INCREMENT,
  `idModulos`            INT(11) NOT NULL,
  `idOperaciones`        INT(11) NOT NULL,
  `fecha_creacion`       DATE DEFAULT NULL,
  `fecha_modificacion`    DATE DEFAULT NULL,
  `esActivo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idModulosOperaciones`),
  CONSTRAINT `fk_mo_mod` FOREIGN KEY (`idModulos`) REFERENCES `modulos` (`idModulos`),
  CONSTRAINT `fk_mo_oper` FOREIGN KEY (`idOperaciones`) REFERENCES `operaciones` (`idOperaciones`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `rol_modulo_operacion` (
  `idRolModuloOperacion` INT(11) NOT NULL AUTO_INCREMENT,
  `idModulosOperaciones` INT(11) NOT NULL,
  `idRol`                INT(11) NOT NULL,
  `fecha_asignacion`     DATE DEFAULT NULL,
  `fecha_modificacion`   DATE DEFAULT NULL,
  `fecha_desactivacion`  DATE DEFAULT NULL, -- Nuevo de ERD
  `esActivo`             TINYINT(4) DEFAULT 1,
  `usuario_asigno`       VARCHAR(150) DEFAULT NULL,
  `usuario_desactivo`    VARCHAR(150) DEFAULT NULL, -- Nuevo de ERD
  PRIMARY KEY (`idRolModuloOperacion`),
  CONSTRAINT `fk_rmo_mo` FOREIGN KEY (`idModulosOperaciones`) REFERENCES `modulos_operacion` (`idModulosOperaciones`),
  CONSTRAINT `fk_rmo_rol` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- BOOTSTRAP DE DATOS INICIALES (Configuración de DIITRA)
-- ============================================================

-- Roles Base Institucionales
INSERT INTO `rol` (`Nombre`, `codigo_rol`) VALUES 
('Administrador del Sistema', 'ADMIN_SISTEMA'),
('Docente Investigador', 'DOCENTE_INV'),
('Director de Investigación', 'DIRECTOR_INV'),
('Revisor Externo', 'REVISOR_EXT');

-- DIITRA como Sistema
INSERT IGNORE INTO `sistema` (`idSistema`, `detalle`) VALUES (1, 'DIITRA - Investigación');

-- Operaciones Base (Sincronizadas con Permissions.cs)
INSERT INTO `operaciones` (`idOperaciones`, `NombreOperacion`) VALUES 
(1, 'VER'), 
(2, 'CREAR'), 
(3, 'EDITAR'), 
(4, 'ELIMINAR'), 
(5, 'APROBAR'),
(6, 'POSTULAR'),
(7, 'GESTIONAR'),
(8, 'REPORTES'),
(9, 'ASIGNAR');

-- Módulos de DIITRA
INSERT INTO `modulos` (`idModulos`, `id_sistema`, `Nombre`) VALUES 
(1, 1, 'PROYECTOS'), (2, 1, 'CONVOCATORIAS'), (3, 1, 'USUARIOS'), (4, 1, 'CONFIGURACION');

-- Enlace Modular Defecto: Mapear todas las operaciones a todos los módulos de DIITRA
INSERT INTO `modulos_operacion` (`idModulos`, `idOperaciones`, `fecha_creacion`, `esActivo`)
SELECT m.idModulos, o.idOperaciones, CURDATE(), 1 FROM `modulos` m, `operaciones` o WHERE m.id_sistema = 1;

-- ============================================================
-- MÓDULOS DE INVESTIGACIÓN (Tablas inv_)
-- ============================================================

-- Líneas de investigación aprobadas institucionalmente
CREATE TABLE IF NOT EXISTS `inv_lineas_investigacion` (
  `idLinea`            INT(11) NOT NULL AUTO_INCREMENT,
  `nombreLinea`        VARCHAR(300) NOT NULL,
  `descripcion`        TEXT,
  `resolucionAprobacion` VARCHAR(100) DEFAULT NULL,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Líneas de investigación institucionales (Reglamento Régimen Académico)';

-- Convocatorias abiertas por el Director de Investigación
CREATE TABLE IF NOT EXISTS `inv_convocatorias` (
  `idConvocatoria`     INT(11) NOT NULL AUTO_INCREMENT,
  `titulo`             VARCHAR(200) NOT NULL,
  `descripcion`        TEXT,
  `idPeriodo` CHAR(7) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,              -- Referencia a periodos (SIGAFI)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Convocatorias de investigación por período académico';


-- Proyectos de Investigación (el núcleo del sistema)
CREATE TABLE IF NOT EXISTS `inv_proyectos` (
  `idProyecto`             INT(11) NOT NULL AUTO_INCREMENT,
  `idConvocatoria`         INT(11) NOT NULL,
  `codigoInstitucional`    VARCHAR(30) DEFAULT NULL,   -- Generado al aprobar
  `titulo`                 VARCHAR(400) NOT NULL,
  `resumen`                TEXT,
  `justificacion`          TEXT,
  `metodologia`            TEXT,
  `idCampoDetalladoUnesco` INT(11) DEFAULT NULL,       -- Referencia a campo_detallado_unesco (SIGAFI)
  `idEspacio`              INT(11) DEFAULT NULL,        -- Laboratorio/Taller donde se ejecuta (SIGAFI)
  `idProfesorDirector`     VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,        -- Referencia a profesores (SIGAFI)
  `estado`                 ENUM('borrador','enviado','en_revision','aprobado','en_ejecucion','finalizado','rechazado') DEFAULT 'borrador',
  `fechaInicio`            DATE DEFAULT NULL,
  `fechaFin`               DATE DEFAULT NULL,
  `presupuestoSolicitado`  DECIMAL(10,2) DEFAULT 0.00,
  `presupuestoAprobado`    DECIMAL(10,2) DEFAULT 0.00,
  `puntajeEvaluacion`      DECIMAL(5,2) DEFAULT NULL,  -- Promedio de los revisores
  `esAnonimizado`          TINYINT(4) DEFAULT 0,        -- Para doble ciego
  `rutaProtocolo`          VARCHAR(500) DEFAULT NULL,   -- Archivo PDF del protocolo
  `rutaCronograma`         VARCHAR(500) DEFAULT NULL,   -- Archivo Gantt
  `rutaResolucion`         VARCHAR(500) DEFAULT NULL,   -- Archivo PDF firmado electrónicamente (.p12)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Proyectos de investigación e innovación';


-- Integrantes del equipo de investigación (profesores)
CREATE TABLE IF NOT EXISTS `inv_proyectos_profesores` (
  `idProyectoProfesor`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesor`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,           -- Referencia a profesores (SIGAFI)
  `rol`                 ENUM('director','coinvestigador','colaborador') DEFAULT 'coinvestigador',
  `horasSemanales`      DECIMAL(5,2) DEFAULT 0.00,
  `activo`              TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoProfesor`),
  UNIQUE KEY `uq_proyecto_profesor` (`idProyecto`, `idProfesor`),
  KEY `fk_inv_pp_profesor` (`idProfesor`),
  CONSTRAINT `fk_inv_pp_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_pp_prof` FOREIGN KEY (`idProfesor`) REFERENCES `profesores` (`idProfesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Profesores integrantes de un proyecto';


-- Estudiantes que participan en el proyecto
CREATE TABLE IF NOT EXISTS `inv_proyectos_alumnos` (
  `idProyectoAlumno`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`        INT(11) NOT NULL,
  `idAlumno`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,             -- Referencia a alumnos (SIGAFI)
  `rol`               VARCHAR(100) DEFAULT 'Investigador Auxiliar',
  `activo`            TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idProyectoAlumno`),
  UNIQUE KEY `uq_proyecto_alumno` (`idProyecto`, `idAlumno`),
  CONSTRAINT `fk_inv_pa_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_pa_alum` FOREIGN KEY (`idAlumno`) REFERENCES `alumnos` (`idAlumno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Alumnos participantes de un proyecto';


-- ============================================================
-- MÓDULO 2: EVALUACIÓN POR PARES (PEER REVIEW)
-- ============================================================

-- Catálogo de Institutos y Universidades para Investigación
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo propio de instituciones para revisión externa y convenios';

-- Precarga de datos institucionales (DML)
INSERT IGNORE INTO `inv_institutos` (`idInstitucion`, `nombre`, `siglas`, `ruc`, `tipo`, `pais`, `ciudad`, `sitioWeb`) VALUES
(1, 'Universidad Central del Ecuador', 'UCE', '1760001550001', 'Publica', 'Ecuador', 'Quito', 'https://www.uce.edu.ec'),
(2, 'Escuela Politécnica Nacional', 'EPN', '1760002100001', 'Publica', 'Ecuador', 'Quito', 'https://www.epn.edu.ec'),
(3, 'Universidad de las Fuerzas Armadas', 'ESPE', '1768025210001', 'Publica', 'Ecuador', 'Sangolquí', 'https://www.espe.edu.ec'),
(4, 'Pontificia Universidad Católica del Ecuador', 'PUCE', '1790103748001', 'Privada', 'Ecuador', 'Quito', 'https://www.puce.edu.ec'),
(5, 'Consejo de Educación Superior', 'CES', NULL, 'Organismo', 'Ecuador', 'Quito', 'https://www.ces.gob.ec');

-- Investigadores de otras instituciones para evaluaciones por pares
CREATE TABLE IF NOT EXISTS `inv_revisores_externos` (
  `idRevisorExterno` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre`           VARCHAR(150) NOT NULL,
  `apellido`         VARCHAR(150) NOT NULL,
  `email`            VARCHAR(200) NOT NULL,
  `idInstitucion`    INT(11) DEFAULT NULL,             -- FK a inv_institutos (Propia)
  `tituloAcademico`  VARCHAR(200) DEFAULT NULL,
  `especialidad`     VARCHAR(300) DEFAULT NULL,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRevisorExterno`),
  UNIQUE KEY `uq_inv_ext_email` (`email`),
  CONSTRAINT `fk_inv_ext_inst` FOREIGN KEY (`idInstitucion`) REFERENCES `inv_institutos` (`idInstitucion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Investigadores externos vinculados a inv_institutos';

-- Asignación de revisores a un proyecto
CREATE TABLE IF NOT EXISTS `inv_revisiones` (
  `idRevision`          INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesorRevisor`   VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,      -- Referencia a profesores (Internos)
  `idRevisorExterno`    INT(11) DEFAULT NULL,                                                          -- Referencia a revisores externos
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Revisiones por pares (Híbridas: Internas y Externas)';


-- Criterios de la rúbrica de evaluación
CREATE TABLE IF NOT EXISTS `inv_rubricas` (
  `idRubrica`    INT(11) NOT NULL AUTO_INCREMENT,
  `criterio`     VARCHAR(200) NOT NULL,
  `descripcion`  TEXT,
  `puntajeMax`   DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `orden`        INT(11) DEFAULT 0,
  `activo`       TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idRubrica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Criterios de evaluación para proyectos';


-- Detalle de puntajes por criterio de rúbrica
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Puntajes por criterio de cada revisión';


-- ============================================================
-- MÓDULO 3: CRONOGRAMA Y SEGUIMIENTO
-- ============================================================

-- Tareas del cronograma (Gantt)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cronograma de tareas por proyecto';


-- Informes de Avance (mensuales/trimestrales)
CREATE TABLE IF NOT EXISTS `inv_informes_avance` (
  `idInforme`           INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesor`          VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,           -- Quien sube el informe (SIGAFI)
  `titulo`              VARCHAR(200) NOT NULL,
  `descripcion`         TEXT,
  `porcentajeAvance`    TINYINT(4) DEFAULT 0,
  `periodoReporte`      VARCHAR(50) DEFAULT NULL,       -- Ej: "Trimestre 1 - 2024"
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Informes de avance mensuales o trimestrales';


-- Evidencias adjuntas a un informe (fotos, facturas, bitácoras)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Evidencias adjuntas a informes de avance';


-- ============================================================
-- MÓDULO 4: PRESUPUESTO Y GASTOS
-- ============================================================

-- Ítems del presupuesto aprobado
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Ítems del presupuesto de un proyecto';


-- Gastos reales ejecutados
CREATE TABLE IF NOT EXISTS `inv_gastos` (
  `idGasto`         INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`      INT(11) NOT NULL,
  `idItem`          INT(11) DEFAULT NULL,               -- Ítem del presupuesto al que aplica
  `descripcion`     VARCHAR(500) NOT NULL,
  `monto`           DECIMAL(10,2) DEFAULT 0.00,
  `fechaGasto`      DATE NOT NULL,
  `numeroFactura`   VARCHAR(50) DEFAULT NULL,
  `rutaFactura`     VARCHAR(500) DEFAULT NULL,
  `registradoPor`   VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,               -- Referencia a profesores (SIGAFI)
  `fechaRegistro`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idGasto`),
  KEY `fk_inv_ga_proy` (`idProyecto`),
  CONSTRAINT `fk_inv_ga_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_ga_item` FOREIGN KEY (`idItem`) REFERENCES `inv_presupuesto_items` (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gastos ejecutados del presupuesto del proyecto';


-- ============================================================
-- MÓDULO 5: INNOVACIÓN Y PROPIEDAD INTELECTUAL
-- ============================================================

-- Productos de investigación (artículos, patentes, software, prototipos)
CREATE TABLE IF NOT EXISTS `inv_productos` (
  `idProducto`       INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`       INT(11) NOT NULL,
  `tipo`             ENUM('articulo_indexado','articulo_no_indexado','libro','capitulo_libro','ponencia','patente','software','prototipo','otro') NOT NULL,
  `titulo`           VARCHAR(500) NOT NULL,
  `autores`          TEXT,
  `issn_isbn`        VARCHAR(50) DEFAULT NULL,
  `urlPublicacion`   VARCHAR(500) DEFAULT NULL,
  `nombreRevista`    VARCHAR(300) DEFAULT NULL,
  `indice`           VARCHAR(100) DEFAULT NULL,         -- Ej: Scopus, Web of Science, Latindex
  `fechaPublicacion` DATE DEFAULT NULL,
  `rutaArchivo`      VARCHAR(500) DEFAULT NULL,
  `numeroRegistro`   VARCHAR(100) DEFAULT NULL,         -- Registro SENADI o DOI
  `activo`           TINYINT(4) DEFAULT 1,
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idProducto`),
  CONSTRAINT `fk_inv_prod_proy` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Productos de investigación: artículos, patentes, prototipos';


-- Convenios de Transferencia Tecnológica
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Convenios de transferencia y propiedad intelectual';


-- ============================================================
-- MÓDULO 6: CONFIGURACIÓN Y AUDITORÍA
-- ============================================================

-- Historial de estados de un proyecto (trazabilidad)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de cambios de estado de proyectos';


-- Notificaciones del sistema
CREATE TABLE IF NOT EXISTS `inv_notificaciones` (
  `idNotificacion`  INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`      INT(11) DEFAULT NULL,
  `destinatario`    VARCHAR(14) NOT NULL,               -- idProfesor o idAlumno (SIGAFI)
  `tipoDestinatario` ENUM('profesor','alumno') DEFAULT 'profesor',
  `tipo`            ENUM('alerta_plazo','aprobacion','rechazo','revision','informe','otro') DEFAULT 'otro',
  `titulo`          VARCHAR(200) NOT NULL,
  `mensaje`         TEXT NOT NULL,
  `leida`           TINYINT(4) DEFAULT 0,
  `fechaEnvio`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fechaLectura`    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`idNotificacion`),
  KEY `fk_inv_notif_proy` (`idProyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Notificaciones automáticas del sistema';

-- ============================================================
-- DATOS INICIALES (Catálogo de rúbricas base)
-- ============================================================
INSERT IGNORE INTO `inv_rubricas` (`criterio`, `descripcion`, `puntajeMax`, `orden`) VALUES
('Pertinencia y Coherencia', 'El proyecto responde a las necesidades del contexto y las líneas institucionales de investigación.', 20.00, 1),
('Marco Teórico y Metodología', 'El sustento teórico y los métodos propuestos son apropiados y rigurosos.', 25.00, 2),
('Viabilidad y Factibilidad', 'El cronograma y presupuesto son realistas y alcanzables en el período propuesto.', 20.00, 3),
('Innovación e Impacto', 'El proyecto genera un aporte significativo y transferible al sector productivo o académico.', 25.00, 4),
('Presentación y Forma', 'El documento cumple con las normas APA y el formato institucional requerido.', 10.00, 5);

-- ------------------------------------------------------------
-- MÓDULO 8: AUTENTICACIÓN TEMPORAL (MAGIC LINKS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inv_tokens_acceso` (
  `idToken`          INT(11) NOT NULL AUTO_INCREMENT,
  `token`            VARCHAR(256) NOT NULL,
  `idReferencia`     VARCHAR(20) NOT NULL,             -- idProfesor o Revisor Externo
  `tipoReferencia`   ENUM('profesor', 'externo') NOT NULL,
  `fechaExpiracion`  DATETIME NOT NULL,
  `usado`            TINYINT(4) DEFAULT 0,
  `scopes`           VARCHAR(200) DEFAULT NULL,        -- Ej: "revision:12"
  `fechaRegistro`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `activo`           TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idToken`),
  UNIQUE KEY `uq_inv_tokens_val` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tokens para acceso directo sin contraseña (Magic Links)';
