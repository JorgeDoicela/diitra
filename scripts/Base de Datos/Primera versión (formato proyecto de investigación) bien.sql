-- =============================================================================
--  DIITRA — Departamento de Investigación e Innovación Traversari
--  MySQL 5.7 compatible
--  ISTPET — Quito, Ecuador
--  Normativa: SENESCYT / CES / CACES / SENADI
-- =============================================================================

USE sigafi_es;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =============================================================================
-- LIMPIEZA PREVIA (Solo tablas del módulo Investigación 'inv_')
-- =============================================================================

DROP TABLE IF EXISTS
    -- Núcleo V3 (Secciones 1-9)
    inv_transferencias,
    inv_gastos,
    inv_evidencias,
    inv_informes_avance,
    inv_bibliografia_proyecto,
    inv_cronograma_semanas,
    inv_cronograma,
    inv_impactos_proyecto,
    inv_cat_impactos,
    inv_proyectos_ods,
    inv_ods_metas,
    inv_ods,
    inv_ods_ejes,
    inv_financiamientos,
    inv_presupuesto_items,
    inv_recursos_disponibles,
    inv_objetivos_proyecto,
    inv_productos,
    inv_proyectos_alumnos,
    inv_proyectos_profesores,
    inv_proyectos_carreras,
    inv_proyectos_dominios,
    inv_proyectos,
    inv_convocatorias,
    inv_sublineas,
    inv_lineas_investigacion,
    inv_programas,
    inv_grupos_investigacion,
    inv_dominios_carrera,
    inv_dominios,
    inv_tipos_investigacion;

-- #############################################################################
-- SECCIÓN 1: CATÁLOGOS BASE
-- #############################################################################

CREATE TABLE inv_lineas_investigacion (
    idLinea              INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)     NOT NULL UNIQUE,
    codigoLinea          VARCHAR(30)  NOT NULL UNIQUE,
    nombreLinea          VARCHAR(255) NOT NULL,
    descripcion          TEXT,
    activo               TINYINT(1)   DEFAULT 1,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_programas (
    idPrograma    INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_dominios (
    idDominio     INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_dominios_carrera (
    idDominioCarrera INT      AUTO_INCREMENT PRIMARY KEY,
    idDominio        INT      NOT NULL,
    idCarrera        INT(11)  NOT NULL,
    FOREIGN KEY (idDominio) REFERENCES inv_dominios(idDominio) ON DELETE RESTRICT,
    FOREIGN KEY (idCarrera) REFERENCES carreras(idCarrera)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_sublineas (
    idSublinea    INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL UNIQUE,
    idLinea       INT          NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (idLinea) REFERENCES inv_lineas_investigacion(idLinea) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_tipos_investigacion (
    idTipo        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(100) NOT NULL,
    idTipoPadre   INT          NULL,
    activo        TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (idTipoPadre) REFERENCES inv_tipos_investigacion(idTipo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_grupos_investigacion (
    idGrupo       INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_convocatorias (
    idConvocatoria     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid               CHAR(36)      NOT NULL UNIQUE,
    codigoConvocatoria VARCHAR(30)   NOT NULL UNIQUE,
    titulo             VARCHAR(255)  NOT NULL,
    idPeriodo          CHAR(7) CHARACTER SET latin1 NOT NULL,
    fechaApertura      DATE          NOT NULL,
    fechaCierre        DATE          NOT NULL,
    estado             ENUM('Borrador','Abierta','Cerrada','Anulada') DEFAULT 'Borrador',
    FOREIGN KEY (idPeriodo) REFERENCES periodos(idPeriodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 2: PROYECTO Y PARTICIPANTES
-- #############################################################################

CREATE TABLE inv_proyectos (
    idProyecto            INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                  CHAR(36)      NOT NULL UNIQUE,
    idConvocatoria        INT,
    codigoInstitucional   VARCHAR(50)   UNIQUE,
    titulo                VARCHAR(500)  NOT NULL,
    descripcionProyecto   TEXT,
    antecedentes          TEXT,
    justificacion         TEXT,
    marcoTeorico          TEXT,
    metodologia           TEXT,
    metodoEvaluacion      TEXT,
    idSublinea            INT           NULL,
    idPrograma            INT           NULL,
    idGrupo               INT           NULL,
    tieneGrupo            TINYINT(1)    DEFAULT 0,
    idTipo                INT           NULL,
    fechaPresentacion     DATE          NULL,
    fechaInicio           DATE,
    fechaFin              DATE,
    tiempoEjecucion       VARCHAR(100),
    estado                ENUM('Borrador','Enviado','En Revisión','Aprobado','En Ejecución','Finalizado','Rechazado','Anulado') DEFAULT 'Borrador',
    puntajeEvaluacion     DECIMAL(5,2)  NULL,
    valorEjecucion        DECIMAL(12,2) DEFAULT 0.00,
    activo                TINYINT(1)    DEFAULT 1,
    fechaRegistro         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idConvocatoria) REFERENCES inv_convocatorias(idConvocatoria),
    FOREIGN KEY (idSublinea)     REFERENCES inv_sublineas(idSublinea),
    FOREIGN KEY (idPrograma)     REFERENCES inv_programas(idPrograma),
    FOREIGN KEY (idGrupo)        REFERENCES inv_grupos_investigacion(idGrupo),
    FOREIGN KEY (idTipo)         REFERENCES inv_tipos_investigacion(idTipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_carreras (
    idProyectoCarrera INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto        INT          NOT NULL,
    idCarrera         INT(11)      NOT NULL,
    modalidad         VARCHAR(100),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idCarrera)  REFERENCES carreras(idCarrera)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_dominios (
    idProyectoDominio INT AUTO_INCREMENT PRIMARY KEY,
    idProyecto        INT NOT NULL,
    idDominio         INT NOT NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idDominio)  REFERENCES inv_dominios(idDominio)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_profesores (
    idProyectoProfesor INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto         INT           NOT NULL,
    idProfesor         VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    esDirector         TINYINT(1)    DEFAULT 0,
    rol                VARCHAR(100),
    nivelAcademico     VARCHAR(150),
    telefono           VARCHAR(20),
    horasSemanales     DECIMAL(4,1),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idProfesor) REFERENCES profesores(idProfesor)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_alumnos (
    idProyectoAlumno INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto       INT           NOT NULL,
    idAlumno         VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    rol              VARCHAR(100),
    nivelAcademico   VARCHAR(150),
    telefono         VARCHAR(20),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idAlumno)   REFERENCES alumnos(idAlumno)         ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 3: OBJETIVOS Y ODS
-- #############################################################################

CREATE TABLE inv_objetivos_proyecto (
    idObjetivo    INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto    INT          NOT NULL,
    esGeneral     TINYINT(1)   NOT NULL DEFAULT 0,
    descripcion   TEXT         NOT NULL,
    orden         INT          DEFAULT 0,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_ods_ejes (
    idEje   INT         AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_ods (
    idOds     INT          AUTO_INCREMENT PRIMARY KEY,
    idEje     INT          NOT NULL,
    numeroOds INT          NOT NULL UNIQUE,
    titulo    VARCHAR(255) NOT NULL,
    FOREIGN KEY (idEje) REFERENCES inv_ods_ejes(idEje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_ods (
    idProyectoOds         INT  AUTO_INCREMENT PRIMARY KEY,
    idProyecto            INT  NOT NULL,
    idOds                 INT  NOT NULL,
    objetivoEspecificoODS TEXT NOT NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idOds)      REFERENCES inv_ods(idOds)            ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 4: RECURSOS Y FINANCIAMIENTO
-- #############################################################################

CREATE TABLE inv_recursos_disponibles (
    idRecurso     INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto    INT           NOT NULL,
    detalle       TEXT          NOT NULL,
    cantidad      DECIMAL(10,2) NOT NULL DEFAULT 1,
    fuente        VARCHAR(255),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_presupuesto_items (
    idItem        INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto    INT           NOT NULL,
    categoria     VARCHAR(100)  NOT NULL,
    detalle       TEXT          NOT NULL,
    cantidad      DECIMAL(10,2) NOT NULL DEFAULT 1,
    valorUnitario DECIMAL(12,2) NOT NULL,
    valorTotal    DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * valorUnitario) STORED,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_financiamientos (
    idFinanciamiento INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto       INT           NOT NULL,
    esIstpet         TINYINT(1)    DEFAULT 0,
    nombreEmpresa    VARCHAR(255),
    otrasFuentes     TINYINT(1)    DEFAULT 0,
    monto            DECIMAL(12,2) NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 5 Y 6: PRODUCTOS E IMPACTOS
-- #############################################################################

CREATE TABLE inv_productos (
    idProducto    INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto    INT          NOT NULL,
    tipo          VARCHAR(255) NOT NULL,
    cantidad      INT          NOT NULL DEFAULT 1,
    -- Campos para Propiedad Intelectual (SENADI)
    esPatente     TINYINT(1)   DEFAULT 0,
    numeroRegistro VARCHAR(100),
    fechaExpiracion DATE,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_cat_impactos (
    idCatImpacto  INT          AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_impactos_proyecto (
    idImpactoProyecto INT  AUTO_INCREMENT PRIMARY KEY,
    idProyecto        INT  NOT NULL,
    idCatImpacto      INT  NOT NULL,
    descripcion       TEXT NOT NULL,
    FOREIGN KEY (idProyecto)   REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idCatImpacto) REFERENCES inv_cat_impactos(idCatImpacto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 7: CRONOGRAMA MODERNO
-- #############################################################################

CREATE TABLE inv_cronograma (
    idActividad       INT           AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)      NOT NULL UNIQUE,
    idProyecto        INT           NOT NULL,
    idObjetivo        INT           NOT NULL,
    numeroActividad   INT           NOT NULL,
    descripcion       TEXT          NOT NULL,
    recursosNecesarios TEXT,
    fechaInicioPrevista DATE,
    fechaFinPrevista    DATE,
    progreso            DECIMAL(5,2)  DEFAULT 0.00,
    idActividadPadre    INT           NULL,
    colorHex            VARCHAR(7)    DEFAULT '#3498db',
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idObjetivo) REFERENCES inv_objetivos_proyecto(idObjetivo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_cronograma_semanas (
    idSemana    INT          AUTO_INCREMENT PRIMARY KEY,
    idActividad INT          NOT NULL,
    mes         VARCHAR(20)  NOT NULL,
    semana      TINYINT(1)   NOT NULL,
    completada  TINYINT(1)   DEFAULT 0,
    FOREIGN KEY (idActividad) REFERENCES inv_cronograma(idActividad) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 8: BIBLIOGRAFÍA ESTRUCTURADA
-- #############################################################################

CREATE TABLE inv_bibliografia_proyecto (
    idBibliografia INT          AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)     NOT NULL UNIQUE,
    idProyecto     INT          NOT NULL,
    citaAPA        TEXT         NOT NULL,
    doi            VARCHAR(100),
    isbn           VARCHAR(20),
    autores        TEXT,
    anioPublicacion INT,
    tituloFuente   TEXT,
    url            VARCHAR(512),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 9: MONITOREO Y EJECUCIÓN (SISTEMA MODERNO)
-- #############################################################################

-- Informes de Avance (Mensuales/Trimestrales)
CREATE TABLE inv_informes_avance (
    idInforme         INT           AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)      NOT NULL UNIQUE,
    idProyecto        INT           NOT NULL,
    numeroInforme     INT           NOT NULL,
    fechaReporte      DATE          NOT NULL,
    resumenActividades TEXT         NOT NULL,
    -- Campos para Firma Electrónica (FirmaEC/Ecuador)
    esFirmadoDigital  TINYINT(1)    DEFAULT 0,
    hashFirma         TEXT,         -- Almacena el hash del documento firmado
    fechaFirma        TIMESTAMP     NULL,
    validadoPor       INT(11)       NULL, -- ID del Director de Investigación
    estado            ENUM('Pendiente','Aprobado','Observado') DEFAULT 'Pendiente',
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (validadoPor) REFERENCES usuarios(idUsuario)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evidencias del Informe (Fotos, Listas, Facturas)
CREATE TABLE inv_evidencias (
    idEvidencia    INT           AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)      NOT NULL UNIQUE,
    idInforme      INT           NOT NULL,
    tipo           ENUM('Imagen','Documento','Factura','Asistencia','Otros') DEFAULT 'Imagen',
    descripcion    VARCHAR(255),
    rutaArchivo    VARCHAR(512)  NOT NULL,
    fechaRegistro  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idInforme) REFERENCES inv_informes_avance(idInforme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Libro Diario de Gastos (Monitoreo Presupuestario)
CREATE TABLE inv_gastos (
    idGasto        INT           AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)      NOT NULL UNIQUE,
    idProyecto     INT           NOT NULL,
    idItem         INT           NOT NULL, -- Referencia al ítem del presupuesto (§4)
    monto          DECIMAL(12,2) NOT NULL,
    fechaGasto     DATE          NOT NULL,
    numeroFactura  VARCHAR(100),
    descripcion    TEXT,
    idEvidencia    INT           NULL, -- Vinculación con la foto de la factura
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idItem)     REFERENCES inv_presupuesto_items(idItem) ON DELETE RESTRICT,
    FOREIGN KEY (idEvidencia) REFERENCES inv_evidencias(idEvidencia)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transferencia Tecnológica y Convenios
CREATE TABLE inv_transferencias (
    idTransferencia INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto      INT          NOT NULL,
    entidadReceptora VARCHAR(255) NOT NULL,
    numeroConvenio  VARCHAR(100),
    fechaConvenio   DATE,
    descripcion     TEXT,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- TRIGGERS PARA UUID
-- #############################################################################

DELIMITER $$
CREATE TRIGGER trg_proyectos_uuid BEFORE INSERT ON inv_proyectos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_convocatorias_uuid BEFORE INSERT ON inv_convocatorias FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_lineas_uuid BEFORE INSERT ON inv_lineas_investigacion FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_cronograma_uuid BEFORE INSERT ON inv_cronograma FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_biblio_uuid BEFORE INSERT ON inv_bibliografia_proyecto FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_infinforme_uuid BEFORE INSERT ON inv_informes_avance FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_evidencia_uuid BEFORE INSERT ON inv_evidencias FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_gasto_uuid BEFORE INSERT ON inv_gastos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- #############################################################################
-- #############################################################################
-- MILESTONE: DATOS SEMILLA Y CONFIGURACIÓN BÁSICA (Núcleo V3)
-- #############################################################################
-- #############################################################################

-- Tipos de investigación (exactos del §1 del formulario)
INSERT INTO inv_tipos_investigacion (uuid, nombre, idTipoPadre, activo) VALUES
(UUID(), 'Básica',                  NULL, 1),
(UUID(), 'Aplicada',                NULL, 1),
(UUID(), 'Desarrollo Experimental', NULL, 1);

-- Ejes ODS (5 Ps de la Agenda 2030)
INSERT INTO inv_ods_ejes (nombre) VALUES
('Personas'), ('Planeta'), ('Prosperidad'), ('Paz'), ('Alianzas');

-- 17 ODS
INSERT INTO inv_ods (idEje, numeroOds, titulo) VALUES
(1,1,  'Fin de la pobreza'), (1,2,  'Hambre cero'), (1,3,  'Salud y bienestar'),
(1,4,  'Educación de calidad'), (1,5,  'Igualdad de género'), (2,6,  'Agua limpia y saneamiento'),
(3,7,  'Energía asequible y no contaminante'), (3,8,  'Trabajo decente y crecimiento económico'),
(3,9,  'Industria, innovación e infraestructura'), (3,10, 'Reducción de las desigualdades'),
(2,11, 'Ciudades y comunidades sostenibles'), (2,12, 'Producción y consumo responsables'),
(2,13, 'Acción por el clima'), (2,14, 'Vida submarina'), (2,15, 'Vida de ecosistemas terrestres'),
(4,16, 'Paz, justicia e instituciones sólidas'), (5,17, 'Alianzas para lograr los objetivos');

-- Categorías de impacto
INSERT INTO inv_cat_impactos (nombre) VALUES
('Social'), ('Científico'), ('Económico'), ('Político'), ('Ambiental'), ('Otro');

-- Índices básicos del núcleo V3
CREATE INDEX idx_proyectos_estado           ON inv_proyectos(estado);
CREATE INDEX idx_proyectos_convocatoria     ON inv_proyectos(idConvocatoria);
CREATE INDEX idx_objetivos_proyecto         ON inv_objetivos_proyecto(idProyecto);
CREATE INDEX idx_cronograma_proyecto        ON inv_cronograma(idProyecto);
CREATE INDEX idx_gastos_proyecto            ON inv_gastos(idProyecto);
CREATE INDEX idx_informesav_proyecto        ON inv_informes_avance(idProyecto);

-- CIERRE DE SEGURIDAD PARA EL NÚCLEO V3
SET FOREIGN_KEY_CHECKS = 1;

-- #############################################################################
-- #############################################################################
-- AQUÍ TERMINA LO COMPROBADO (V3). LO SIGUIENTE ES GESTIÓN ADICIONAL PENDIENTE.
-- #############################################################################
-- #############################################################################

-- #############################################################################
-- #############################################################################
-- SECCIÓN 10: MÓDULOS DE GESTIÓN ADICIONALES (De V2)
-- #############################################################################
-- #############################################################################

-- =============================================================================
-- GRUPO F: PEER-REVIEW (evaluación por pares — doble ciego)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- F.1  Institutos / entidades externas (para revisores)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_institutos (
    idInstitucion INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    siglas        VARCHAR(20),
    ruc           VARCHAR(13),
    tipo          VARCHAR(50),
    pais          VARCHAR(80)  DEFAULT 'Ecuador',
    ciudad        VARCHAR(80),
    sitioWeb      VARCHAR(255),
    activo        TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version       INT          DEFAULT 1,
    UNIQUE KEY uq_institutos_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Institutos y entidades para revisores externos';

DELIMITER $$
CREATE TRIGGER trg_institutos_uuid
BEFORE INSERT ON inv_institutos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- F.2  Rúbricas de evaluación
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_rubricas (
    idRubrica     INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL,
    criterio      VARCHAR(255) NOT NULL,
    descripcion   TEXT,
    puntajeMax    INT          NOT NULL DEFAULT 10,
    orden         INT          DEFAULT 0,
    activo        TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version       INT          DEFAULT 1,
    UNIQUE KEY uq_rubricas_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Criterios de rúbrica para evaluación de proyectos';

DELIMITER $$
CREATE TRIGGER trg_rubricas_uuid
BEFORE INSERT ON inv_rubricas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- F.3  Revisores externos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_revisores_externos (
    idRevisorExterno  INT          AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)     NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    email             VARCHAR(150) NOT NULL UNIQUE,
    idInstitucion     INT,
    tituloAcademico   VARCHAR(100),
    especialidad      VARCHAR(255),
    activo            TINYINT(1)   DEFAULT 1,
    fechaRegistro     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version           INT          DEFAULT 1,
    UNIQUE KEY uq_revisext_uuid (uuid),
    FOREIGN KEY (idInstitucion) REFERENCES inv_institutos(idInstitucion) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Revisores externos para evaluación de proyectos';

DELIMITER $$
CREATE TRIGGER trg_revisexternas_uuid
BEFORE INSERT ON inv_revisores_externos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- F.4  Revisiones asignadas
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_revisiones (
    idRevision        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)     NOT NULL,
    idProyecto        INT          NOT NULL,
    idProfesorRevisor VARCHAR(14) CHARACTER SET latin1 NULL,
    idRevisorExterno  INT,
    esDoubleCiego     TINYINT(1)   DEFAULT 1,
    estado            ENUM('Asignada','En Proceso','Completada','Vencida') DEFAULT 'Asignada',
    puntajeTotal      DECIMAL(5,2),
    comentarios       TEXT,
    fechaAsignacion   DATE,
    fechaLimite       DATE,
    fechaEntrega      DATE,
    activo            TINYINT(1)   DEFAULT 1,
    fechaModificacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version           INT          DEFAULT 1,
    UNIQUE KEY uq_revisiones_uuid (uuid),
    FOREIGN KEY (idProyecto)        REFERENCES inv_proyectos(idProyecto)                ON DELETE RESTRICT,
    FOREIGN KEY (idRevisorExterno)  REFERENCES inv_revisores_externos(idRevisorExterno) ON DELETE RESTRICT,
    FOREIGN KEY (idProfesorRevisor) REFERENCES profesores(idProfesor)                   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Revisiones por pares asignadas a proyectos';

DELIMITER $$
CREATE TRIGGER trg_revisiones_uuid
BEFORE INSERT ON inv_revisiones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- F.5  Detalle de revisión por rúbrica
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_revisiones_detalle (
    idDetalleRevision INT          AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)     NOT NULL,
    idRevision        INT          NOT NULL,
    idRubrica         INT          NOT NULL,
    puntaje           DECIMAL(5,2) NOT NULL,
    observacion       TEXT,
    version           INT          DEFAULT 1,
    UNIQUE KEY uq_revdetalle_uuid (uuid),
    FOREIGN KEY (idRevision) REFERENCES inv_revisiones(idRevision) ON DELETE CASCADE,
    FOREIGN KEY (idRubrica)  REFERENCES inv_rubricas(idRubrica)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Puntaje por criterio de rúbrica en la revisión';

DELIMITER $$
CREATE TRIGGER trg_revdetalle_uuid
BEFORE INSERT ON inv_revisiones_detalle FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- G.2  Actividades de seguimiento por informe
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inv_seguimiento_actividades (
    idActividad          INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)     NOT NULL,
    idInforme            INT          NOT NULL,
    tipoActividad        ENUM('Ejecutada','No Prevista','Obstaculo') NOT NULL DEFAULT 'Ejecutada',
    numeroActividad      INT,
    objetivoRelacionado  TEXT,
    descripcionActividad TEXT         NOT NULL,
    resultadosObtenidos  TEXT,
    porcentajeAvance     DECIMAL(5,2) DEFAULT 0.00,
    participantes        TEXT,
    fechaInicio          DATE,
    fechaFin             DATE,
    actividadCorrectiva  TEXT,
    observaciones        TEXT,
    activo               TINYINT(1)   DEFAULT 1,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version              INT          DEFAULT 1,
    UNIQUE KEY uq_segact_uuid (uuid),
    FOREIGN KEY (idInforme) REFERENCES inv_informes_avance(idInforme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Detalle de actividades por informe de avance';

DELIMITER $$
CREATE TRIGGER trg_segact_uuid
BEFORE INSERT ON inv_seguimiento_actividades FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO H: PLANES DE APRENDIZAJE (ESTUDIANTES)
-- =============================================================================

CREATE TABLE inv_evaluacion_parametros (
    idParametro INT         PRIMARY KEY,
    uuid        CHAR(36)    NOT NULL,
    nivel       VARCHAR(80) NOT NULL,
    puntos      INT         NOT NULL,
    descripcion TEXT,
    version     INT         DEFAULT 1,
    UNIQUE KEY uq_evalparams_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Escala 1-4 para evaluación de planes de aprendizaje';

DELIMITER $$
CREATE TRIGGER trg_evalparams_uuid
BEFORE INSERT ON inv_evaluacion_parametros FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_planes_aprendizaje (
    idPlan                  INT        AUTO_INCREMENT PRIMARY KEY,
    uuid                    CHAR(36)   NOT NULL,
    idProyecto              INT        NOT NULL,
    idAlumno                VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    periodoAcademico        VARCHAR(100),
    fechaAprobacion         DATE,
    fechaTerminacion        DATE,
    objetivoGeneralProyecto TEXT,
    idDirectorProyecto      VARCHAR(14) CHARACTER SET latin1 NULL,
    idCoordinador           VARCHAR(14) CHARACTER SET latin1 NULL,
    activo                  TINYINT(1) DEFAULT 1,
    fechaRegistro           TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion       TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                 INT        DEFAULT 1,
    UNIQUE KEY uq_planes_uuid (uuid),
    UNIQUE KEY uq_plan_proyecto_alumno (idProyecto, idAlumno),
    FOREIGN KEY (idProyecto)         REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT,
    FOREIGN KEY (idAlumno)           REFERENCES alumnos(idAlumno)         ON DELETE RESTRICT,
    FOREIGN KEY (idDirectorProyecto) REFERENCES profesores(idProfesor)    ON DELETE RESTRICT,
    FOREIGN KEY (idCoordinador)      REFERENCES profesores(idProfesor)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Plan de aprendizaje del estudiante vinculado al proyecto';

DELIMITER $$
CREATE TRIGGER trg_planes_uuid
BEFORE INSERT ON inv_planes_aprendizaje FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_plan_prerrequisitos (
    idPrerrequisito INT      AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36) NOT NULL,
    idPlan          INT      NOT NULL,
    tipoRequisito   ENUM('Cognitivo','Procedimental') NOT NULL,
    descripcion     TEXT     NOT NULL,
    version         INT      DEFAULT 1,
    UNIQUE KEY uq_planpreq_uuid (uuid),
    FOREIGN KEY (idPlan) REFERENCES inv_planes_aprendizaje(idPlan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Prerrequisitos cognitivos y procedimentales del plan';

DELIMITER $$
CREATE TRIGGER trg_planpreq_uuid
BEFORE INSERT ON inv_plan_prerrequisitos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_plan_actividades (
    idPlanActividad              INT       AUTO_INCREMENT PRIMARY KEY,
    uuid                         CHAR(36)  NOT NULL,
    idPlan                       INT       NOT NULL,
    idAsignatura                 INT(11)   NULL,
    lineaInvestigacion           VARCHAR(255),
    resultadoAprendizajeAsociado TEXT,
    descripcionActividad         TEXT,
    fechaInicio                  DATE,
    fechaFin                     DATE,
    horasTrabajo                 INT,
    observaciones                TEXT,
    fechaRegistro                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version                      INT       DEFAULT 1,
    UNIQUE KEY uq_planact_uuid (uuid),
    FOREIGN KEY (idPlan)       REFERENCES inv_planes_aprendizaje(idPlan) ON DELETE CASCADE,
    FOREIGN KEY (idAsignatura) REFERENCES asignaturas(idAsignatura)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Actividades y carga horaria del plan de aprendizaje';

DELIMITER $$
CREATE TRIGGER trg_planact_uuid
BEFORE INSERT ON inv_plan_actividades FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_evaluaciones_plan (
    idEvaluacion         INT        AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)   NOT NULL,
    idProyecto           INT        NOT NULL,
    idAlumno             VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    fechaEvaluacion      DATE       NULL,
    totalCognitivos      INT        DEFAULT 0,
    totalProcedimentales INT        DEFAULT 0,
    totalActividades     INT        DEFAULT 0,
    idRevisadoPor        VARCHAR(14) CHARACTER SET latin1 NULL,
    fechaRegistro        TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    version              INT        DEFAULT 1,
    UNIQUE KEY uq_evalplan_uuid (uuid),
    UNIQUE KEY uq_eval_proyecto_alumno (idProyecto, idAlumno),
    FOREIGN KEY (idProyecto)    REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT,
    FOREIGN KEY (idAlumno)      REFERENCES alumnos(idAlumno)         ON DELETE RESTRICT,
    FOREIGN KEY (idRevisadoPor) REFERENCES profesores(idProfesor)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Evaluación del plan de aprendizaje del estudiante';

DELIMITER $$
CREATE TRIGGER trg_evalplan_uuid
BEFORE INSERT ON inv_evaluaciones_plan FOR EACH ROW
BEGIN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF;
    IF NEW.fechaEvaluacion IS NULL THEN SET NEW.fechaEvaluacion = CURDATE(); END IF;
END$$
DELIMITER ;

CREATE TABLE inv_evaluacion_requisitos (
    idEvaluacionReq INT      AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36) NOT NULL,
    idEvaluacion    INT      NOT NULL,
    tipoRequisito   ENUM('Cognitivo','Procedimental') NOT NULL,
    descripcion     TEXT     NOT NULL,
    idParametro     INT      NOT NULL,
    version         INT      DEFAULT 1,
    UNIQUE KEY uq_evalreq_uuid (uuid),
    FOREIGN KEY (idEvaluacion) REFERENCES inv_evaluaciones_plan(idEvaluacion)    ON DELETE CASCADE,
    FOREIGN KEY (idParametro)  REFERENCES inv_evaluacion_parametros(idParametro) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Evaluación de prerrequisitos del plan';

DELIMITER $$
CREATE TRIGGER trg_evalreq_uuid
BEFORE INSERT ON inv_evaluacion_requisitos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_evaluacion_actividades_plan (
    idEvaluacionAct    INT      AUTO_INCREMENT PRIMARY KEY,
    uuid               CHAR(36) NOT NULL,
    idEvaluacion       INT      NOT NULL,
    idAsignatura       INT(11)  NULL,
    actividadEjecutada TEXT,
    fechaInicio        DATE,
    fechaFin           DATE,
    idParametro        INT      NOT NULL,
    observaciones      TEXT,
    version            INT      DEFAULT 1,
    UNIQUE KEY uq_evalactplan_uuid (uuid),
    FOREIGN KEY (idEvaluacion) REFERENCES inv_evaluaciones_plan(idEvaluacion)    ON DELETE CASCADE,
    FOREIGN KEY (idParametro)  REFERENCES inv_evaluacion_parametros(idParametro) ON DELETE RESTRICT,
    FOREIGN KEY (idAsignatura) REFERENCES asignaturas(idAsignatura)              ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Evaluación de actividades ejecutadas del plan';

DELIMITER $$
CREATE TRIGGER trg_evalactplan_uuid
BEFORE INSERT ON inv_evaluacion_actividades_plan FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- Seed escala 1-4 para planes de aprendizaje
INSERT INTO inv_evaluacion_parametros (idParametro, uuid, nivel, puntos, descripcion) VALUES
(1, UUID(), 'No Adecuado',   1, 'No cumple con los criterios mínimos establecidos'),
(2, UUID(), 'Poco Adecuado', 2, 'Cumple parcialmente con los criterios establecidos'),
(3, UUID(), 'Adecuado',      3, 'Cumple con los criterios establecidos satisfactoriamente'),
(4, UUID(), 'Muy Adecuado',  4, 'Supera los criterios establecidos con excelencia');

-- =============================================================================
-- GRUPO I: REVISIÓN BIBLIOGRÁFICA SISTEMÁTICA
-- =============================================================================

CREATE TABLE inv_revisiones_bibliograficas (
    idRevisionBib          INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                   CHAR(36)     NOT NULL,
    idProyecto             INT          NOT NULL,
    titulo                 VARCHAR(500) NOT NULL,
    introduccion           TEXT,
    metodologiaDescripcion TEXT,
    conclusiones           TEXT,
    activo                 TINYINT(1)   DEFAULT 1,
    fechaRegistro          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                INT          DEFAULT 1,
    UNIQUE KEY uq_revbib_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Revisión bibliográfica sistemática del proyecto';

DELIMITER $$
CREATE TRIGGER trg_revbib_uuid
BEFORE INSERT ON inv_revisiones_bibliograficas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_preguntas_investigacion (
    idPregunta     INT      AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36) NOT NULL,
    idRevisionBib  INT      NOT NULL,
    numeroPregunta INT      NOT NULL,
    interrogante   TEXT     NOT NULL,
    version        INT      DEFAULT 1,
    UNIQUE KEY uq_preginv_uuid (uuid),
    FOREIGN KEY (idRevisionBib) REFERENCES inv_revisiones_bibliograficas(idRevisionBib) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Preguntas de investigación de la revisión bibliográfica';

DELIMITER $$
CREATE TRIGGER trg_preginv_uuid
BEFORE INSERT ON inv_preguntas_investigacion FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_criterios_revision (
    idCriterio    INT      AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36) NOT NULL,
    idRevisionBib INT      NOT NULL,
    tipo          ENUM('Inclusión','Exclusión') NOT NULL,
    descripcion   TEXT     NOT NULL,
    version       INT      DEFAULT 1,
    UNIQUE KEY uq_critrev_uuid (uuid),
    FOREIGN KEY (idRevisionBib) REFERENCES inv_revisiones_bibliograficas(idRevisionBib) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Criterios de inclusión y exclusión de la revisión';

DELIMITER $$
CREATE TRIGGER trg_critrev_uuid
BEFORE INSERT ON inv_criterios_revision FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_estudios_revision (
    idEstudio              INT      AUTO_INCREMENT PRIMARY KEY,
    uuid                   CHAR(36) NOT NULL,
    idRevisionBib          INT      NOT NULL,
    numeroEstudio          INT,
    autores                TEXT,
    anio                   INT,
    tituloEstudio          TEXT,
    tipoEstudio            VARCHAR(255),
    nivelEducativo         VARCHAR(255),
    objetivoEstudio        TEXT,
    funcionalidadesChatbot TEXT,
    tecnologiaUsada        TEXT,
    resultadosPrincipales  TEXT,
    limitaciones           TEXT,
    version                INT      DEFAULT 1,
    UNIQUE KEY uq_estrev_uuid (uuid),
    FOREIGN KEY (idRevisionBib) REFERENCES inv_revisiones_bibliograficas(idRevisionBib) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Estudios analizados (matriz de extracción)';

DELIMITER $$
CREATE TRIGGER trg_estrev_uuid
BEFORE INSERT ON inv_estudios_revision FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_bibliografia_revision (
    idBibliografia INT      AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36) NOT NULL,
    idRevisionBib  INT      NOT NULL,
    citaApa        TEXT     NOT NULL,
    enlaceRecurso  VARCHAR(512),
    version        INT      DEFAULT 1,
    UNIQUE KEY uq_biblrev_uuid (uuid),
    FOREIGN KEY (idRevisionBib) REFERENCES inv_revisiones_bibliograficas(idRevisionBib) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Referencias APA de la revisión bibliográfica sistemática';

DELIMITER $$
CREATE TRIGGER trg_biblrev_uuid
BEFORE INSERT ON inv_bibliografia_revision FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO J: INFORME FINAL
-- =============================================================================

CREATE TABLE inv_informes_finales (
    idInformeFinal          INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                    CHAR(36)     NOT NULL,
    idProyecto              INT          NOT NULL,
    resumenEjecutivo        TEXT,
    introduccion            TEXT,
    metodologiaEnfoque      TEXT,
    metodologiaDiseno       TEXT,
    metodologiaPoblacion    TEXT,
    metodologiaInstrumentos TEXT,
    resultadosHallazgos     TEXT,
    discusionResultados     TEXT,
    conclusiones            TEXT,
    recomendaciones         TEXT,
    bibliografiaApa         TEXT,
    fechaEntrega            DATETIME,
    estadoInforme           ENUM('Borrador','En Revisión','Aprobado','Rechazado') DEFAULT 'Borrador',
    rutaInformeFirmado      VARCHAR(512),
    activo                  TINYINT(1)   DEFAULT 1,
    fechaRegistro           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                 INT          DEFAULT 1,
    UNIQUE KEY uq_inffin_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Informe final del proyecto de investigación';

DELIMITER $$
CREATE TRIGGER trg_inffin_uuid
BEFORE INSERT ON inv_informes_finales FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_informe_anexos (
    idAnexo        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)     NOT NULL,
    idInformeFinal INT          NOT NULL,
    tipoAnexo      VARCHAR(100),
    descripcion    TEXT,
    rutaArchivo    VARCHAR(512),
    fechaSubida    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version        INT          DEFAULT 1,
    UNIQUE KEY uq_infanex_uuid (uuid),
    FOREIGN KEY (idInformeFinal) REFERENCES inv_informes_finales(idInformeFinal) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Anexos y evidencias del informe final';

DELIMITER $$
CREATE TRIGGER trg_infanex_uuid
BEFORE INSERT ON inv_informe_anexos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO K: NOTIFICACIONES, SEGURIDAD Y METADATA
-- =============================================================================

CREATE TABLE inv_notificaciones (
    idNotificacion   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             CHAR(36)     NOT NULL,
    idProyecto       INT,
    destinatario     INT          NOT NULL,
    tipoDestinatario ENUM('Usuario','Profesor','Alumno') DEFAULT 'Usuario',
    tipo             VARCHAR(80),
    titulo           VARCHAR(255) NOT NULL,
    mensaje          TEXT,
    leido            TINYINT(1)   DEFAULT 0,
    fechaEnvio       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaLectura     TIMESTAMP    NULL,
    version          INT          DEFAULT 1,
    UNIQUE KEY uq_notif_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Notificaciones automáticas del sistema';

DELIMITER $$
CREATE TRIGGER trg_notif_uuid
BEFORE INSERT ON inv_notificaciones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_tokens_acceso (
    idToken         INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36)     NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    idReferencia    INT          NOT NULL,
    tipoReferencia  VARCHAR(50)  NOT NULL,
    scopes          VARCHAR(255),
    usado           TINYINT(1)   DEFAULT 0,
    activo          TINYINT(1)   DEFAULT 1,
    fechaRegistro   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaExpiracion TIMESTAMP    NULL,
    version         INT          DEFAULT 1,
    UNIQUE KEY uq_tokens_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Tokens temporales para acceso externo seguro';

DELIMITER $$
CREATE TRIGGER trg_tokens_uuid
BEFORE INSERT ON inv_tokens_acceso FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_usuarios_metadata (
    idMetadata        INT       AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)  NOT NULL,
    idUsuario         INT(11)   NOT NULL UNIQUE,
    configuracion     JSON,
    fechaRegistro     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaUltimoAcceso TIMESTAMP NULL,
    version           INT       DEFAULT 1,
    UNIQUE KEY uq_usermeta_uuid (uuid),
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Metadata y preferencias de usuarios en DIITRA';

DELIMITER $$
CREATE TRIGGER trg_usermeta_uuid
BEFORE INSERT ON inv_usuarios_metadata FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO L: INTELIGENCIA ARTIFICIAL
-- =============================================================================

CREATE TABLE inv_ia_analisis (
    idAnalisis      INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36)     NOT NULL,
    idReferencia    INT          NOT NULL,
    tipoReferencia  ENUM('Proyecto','Informe','Producto') NOT NULL,
    resultadoJson   JSON,
    scoreCoherencia DECIMAL(5,2),
    sugerencias     TEXT,
    fechaAnalisis   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ia_analisis_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='[SISTEMA] Análisis automáticos generados por el Asistente de IA';

DELIMITER $$
CREATE TRIGGER trg_ia_analisis_uuid
BEFORE INSERT ON inv_ia_analisis FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- CIERRE FINAL (Solo si se ejecuta el script completo)
SET FOREIGN_KEY_CHECKS = 1;
