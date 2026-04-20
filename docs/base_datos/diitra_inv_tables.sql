-- ============================================================
-- DIITRA: Tablas nuevas del Sistema de Investigación e Innovación
-- Base de datos: sigafi_es
-- Prefijo: inv_ (para distinguir de las tablas legacy de SIGAFI)
-- ============================================================

-- ============================================================
-- MÓDULO 1: CONVOCATORIAS Y PROYECTOS
-- ============================================================

-- L�neas de investigaci�n aprobadas institucionalmente
CREATE TABLE IF NOT EXISTS `inv_lineas_investigacion` (
  `idLinea`            INT(11) NOT NULL AUTO_INCREMENT,
  `nombreLinea`        VARCHAR(300) NOT NULL,
  `descripcion`        TEXT,
  `resolucionAprobacion` VARCHAR(100) DEFAULT NULL,
  `activo`             TINYINT(4) DEFAULT 1,
  PRIMARY KEY (`idLinea`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='L�neas de investigaci�n institucionales (Reglamento R�gimen Acad�mico)';
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

-- Asignación de revisores a un proyecto
CREATE TABLE IF NOT EXISTS `inv_revisiones` (
  `idRevision`          INT(11) NOT NULL AUTO_INCREMENT,
  `idProyecto`          INT(11) NOT NULL,
  `idProfesorRevisor`   VARCHAR(14) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,           -- Referencia a profesores (SIGAFI)
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
  CONSTRAINT `fk_inv_rev_proyecto` FOREIGN KEY (`idProyecto`) REFERENCES `inv_proyectos` (`idProyecto`),
  CONSTRAINT `fk_inv_rev_profesor` FOREIGN KEY (`idProfesorRevisor`) REFERENCES `profesores` (`idProfesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Revisiones por pares de proyectos';


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









