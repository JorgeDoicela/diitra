-- =============================================================================
--  DIITRA — Departamento de Investigación e Innovación Traversari
--  MySQL 5.7 compatible
--  ISTPET — Quito, Ecuador
--  Normativa: SENESCYT / CES / CACES
-- =============================================================================

USE sigafi_es;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =============================================================================
-- LIMPIEZA PREVIA
-- =============================================================================
DROP TRIGGER IF EXISTS trg_lineas_uuid;
DROP TRIGGER IF EXISTS trg_programas_uuid;
DROP TRIGGER IF EXISTS trg_dominios_uuid;
DROP TRIGGER IF EXISTS trg_sublineas_uuid;
DROP TRIGGER IF EXISTS trg_evalparams_uuid;
DROP TRIGGER IF EXISTS trg_odsejes_uuid;
DROP TRIGGER IF EXISTS trg_ods_uuid;
DROP TRIGGER IF EXISTS trg_odsmetas_uuid;
DROP TRIGGER IF EXISTS trg_convocatorias_uuid;
DROP TRIGGER IF EXISTS trg_proyectos_uuid;
DROP TRIGGER IF EXISTS trg_proyprof_uuid;
DROP TRIGGER IF EXISTS trg_proyalum_uuid;
DROP TRIGGER IF EXISTS trg_historial_uuid;
DROP TRIGGER IF EXISTS trg_notif_uuid;
DROP TRIGGER IF EXISTS trg_revisexternas_uuid;
DROP TRIGGER IF EXISTS trg_institutos_uuid;
DROP TRIGGER IF EXISTS trg_rubricas_uuid;
DROP TRIGGER IF EXISTS trg_revisiones_uuid;
DROP TRIGGER IF EXISTS trg_revdetalle_uuid;
DROP TRIGGER IF EXISTS trg_cronograma_uuid;
DROP TRIGGER IF EXISTS trg_informesav_uuid;
DROP TRIGGER IF EXISTS trg_evidencias_uuid;
DROP TRIGGER IF EXISTS trg_presitems_uuid;
DROP TRIGGER IF EXISTS trg_gastos_uuid;
DROP TRIGGER IF EXISTS trg_productos_uuid;
DROP TRIGGER IF EXISTS trg_transferencias_uuid;
DROP TRIGGER IF EXISTS trg_tokens_uuid;
DROP TRIGGER IF EXISTS trg_usermeta_uuid;
DROP TRIGGER IF EXISTS trg_aprobaciones_uuid;
DROP TRIGGER IF EXISTS trg_segact_uuid;
DROP TRIGGER IF EXISTS trg_planes_uuid;
DROP TRIGGER IF EXISTS trg_planpreq_uuid;
DROP TRIGGER IF EXISTS trg_planact_uuid;
DROP TRIGGER IF EXISTS trg_evalplan_uuid;
DROP TRIGGER IF EXISTS trg_evalreq_uuid;
DROP TRIGGER IF EXISTS trg_evalactplan_uuid;
DROP TRIGGER IF EXISTS trg_revbib_uuid;
DROP TRIGGER IF EXISTS trg_preginv_uuid;
DROP TRIGGER IF EXISTS trg_critrev_uuid;
DROP TRIGGER IF EXISTS trg_estrev_uuid;
DROP TRIGGER IF EXISTS trg_biblrev_uuid;
DROP TRIGGER IF EXISTS trg_inffin_uuid;
DROP TRIGGER IF EXISTS trg_infanex_uuid;
DROP TRIGGER IF EXISTS trg_proyods_uuid;
DROP TRIGGER IF EXISTS trg_impactos_uuid;
DROP TRIGGER IF EXISTS trg_ia_analisis_uuid;

DROP TABLE IF EXISTS
    inv_ia_analisis,
    inv_impactos_logrados,
    inv_proyectos_ods,
    inv_ods_metas,
    inv_ods,
    inv_ods_ejes,
    inv_informe_anexos,
    inv_informes_finales,
    inv_bibliografia_revision,
    inv_estudios_revision,
    inv_criterios_revision,
    inv_preguntas_investigacion,
    inv_revisiones_bibliograficas,
    inv_evaluacion_actividades_plan,
    inv_evaluacion_requisitos,
    inv_evaluaciones_plan,
    inv_evaluacion_parametros,
    inv_plan_actividades,
    inv_plan_prerrequisitos,
    inv_planes_aprendizaje,
    inv_seguimiento_actividades,
    inv_informes_avance,
    inv_gastos,
    inv_presupuesto_items,
    inv_evidencias,
    inv_cronograma,
    inv_aprobaciones_oficiales,
    inv_revisiones_detalle,
    inv_revisiones,
    inv_revisores_externos,
    inv_institutos,
    inv_rubricas,
    inv_proyectos_historial,
    inv_proyectos_alumnos,
    inv_proyectos_profesores,
    inv_productos,
    inv_transferencias,
    inv_notificaciones,
    inv_proyectos,
    inv_convocatorias,
    inv_lineas_programas,
    inv_sublineas,
    inv_lineas_investigacion,
    inv_programas,
    inv_dominios,
    inv_tokens_acceso,
    inv_usuarios_metadata;

-- =============================================================================
-- GRUPO A: CATÁLOGOS INDEPENDIENTES
-- =============================================================================

-- A.1  Líneas de investigación institucionales
CREATE TABLE inv_lineas_investigacion (
    idLinea              INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)      NOT NULL,
    codigoLinea          VARCHAR(30)   NOT NULL UNIQUE,
    nombreLinea          VARCHAR(255)  NOT NULL,
    descripcion          TEXT,
    resolucionAprobacion VARCHAR(100),
    activo               TINYINT(1)    DEFAULT 1,
    fechaRegistro        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version              INT           DEFAULT 1,
    UNIQUE KEY uq_lineas_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Líneas de investigación institucionales aprobadas';

DELIMITER $$
CREATE TRIGGER trg_lineas_uuid
BEFORE INSERT ON inv_lineas_investigacion FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.2  Programas institucionales de investigación
CREATE TABLE inv_programas (
    idPrograma    INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    nombre        VARCHAR(255)  NOT NULL,
    descripcion   TEXT,
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_programas_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Programas institucionales de investigación';

DELIMITER $$
CREATE TRIGGER trg_programas_uuid
BEFORE INSERT ON inv_programas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.3  Dominios de investigación
CREATE TABLE inv_dominios (
    idDominio     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    nombre        VARCHAR(255)  NOT NULL,
    descripcion   TEXT,
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_dominios_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Dominios macro de investigación';

DELIMITER $$
CREATE TRIGGER trg_dominios_uuid
BEFORE INSERT ON inv_dominios FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.4  Sublíneas de investigación
CREATE TABLE inv_sublineas (
    idSublinea    INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    idLinea       INT           NOT NULL,
    nombre        VARCHAR(255)  NOT NULL,
    descripcion   TEXT,
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_sublineas_uuid (uuid),
    FOREIGN KEY (idLinea) REFERENCES inv_lineas_investigacion(idLinea) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sublíneas (nivel más específico de la línea)';

DELIMITER $$
CREATE TRIGGER trg_sublineas_uuid
BEFORE INSERT ON inv_sublineas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.5  Pivot líneas ↔ programas ↔ dominios
CREATE TABLE inv_lineas_programas (
    idLineaPrograma INT  AUTO_INCREMENT PRIMARY KEY,
    idLinea         INT  NOT NULL,
    idPrograma      INT  NOT NULL,
    idDominio       INT,
    UNIQUE KEY uq_linea_programa (idLinea, idPrograma),
    FOREIGN KEY (idLinea)    REFERENCES inv_lineas_investigacion(idLinea) ON DELETE RESTRICT,
    FOREIGN KEY (idPrograma) REFERENCES inv_programas(idPrograma)         ON DELETE RESTRICT,
    FOREIGN KEY (idDominio)  REFERENCES inv_dominios(idDominio)           ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Relación líneas ↔ programas ↔ dominios';

-- A.6  Institutos / entidades externas
CREATE TABLE inv_institutos (
    idInstitucion INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    nombre        VARCHAR(255)  NOT NULL,
    siglas        VARCHAR(20),
    ruc           VARCHAR(13),
    tipo          VARCHAR(50),
    pais          VARCHAR(80)   DEFAULT 'Ecuador',
    ciudad        VARCHAR(80),
    sitioWeb      VARCHAR(255),
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_institutos_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Institutos y entidades para revisores externos';

DELIMITER $$
CREATE TRIGGER trg_institutos_uuid
BEFORE INSERT ON inv_institutos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.7  Escala de evaluación 1-4
CREATE TABLE inv_evaluacion_parametros (
    idParametro INT         PRIMARY KEY,
    uuid        CHAR(36)    NOT NULL,
    nivel       VARCHAR(80) NOT NULL,
    puntos      INT         NOT NULL,
    descripcion TEXT,
    version     INT         DEFAULT 1,
    UNIQUE KEY uq_evalparams_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Escala 1-4 para evaluación de planes de aprendizaje';

DELIMITER $$
CREATE TRIGGER trg_evalparams_uuid
BEFORE INSERT ON inv_evaluacion_parametros FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.8  Rúbricas de evaluación de proyectos
CREATE TABLE inv_rubricas (
    idRubrica     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    criterio      VARCHAR(255)  NOT NULL,
    descripcion   TEXT,
    puntajeMax    INT           NOT NULL DEFAULT 10,
    orden         INT           DEFAULT 0,
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_rubricas_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Criterios de rúbrica para evaluación de proyectos';

DELIMITER $$
CREATE TRIGGER trg_rubricas_uuid
BEFORE INSERT ON inv_rubricas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.9  ODS — Ejes estratégicos (5 Ps)
CREATE TABLE inv_ods_ejes (
    idEje       INT          AUTO_INCREMENT PRIMARY KEY,
    uuid        CHAR(36)     NOT NULL,
    nombre      VARCHAR(50)  NOT NULL,
    descripcion TEXT         NOT NULL,
    colorHex    VARCHAR(7),
    version     INT          DEFAULT 1,
    UNIQUE KEY uq_odsejes_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Ejes estratégicos Agenda 2030 (5 Ps)';

DELIMITER $$
CREATE TRIGGER trg_odsejes_uuid
BEFORE INSERT ON inv_ods_ejes FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.10  ODS — 17 objetivos
CREATE TABLE inv_ods (
    idOds       INT          AUTO_INCREMENT PRIMARY KEY,
    uuid        CHAR(36)     NOT NULL,
    idEje       INT          NOT NULL,
    numeroOds   INT          NOT NULL UNIQUE,
    titulo      VARCHAR(255) NOT NULL,
    descripcion TEXT,
    colorHex    VARCHAR(7),
    version     INT          DEFAULT 1,
    UNIQUE KEY uq_ods_uuid (uuid),
    FOREIGN KEY (idEje) REFERENCES inv_ods_ejes(idEje) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo maestro de los 17 ODS';

DELIMITER $$
CREATE TRIGGER trg_ods_uuid
BEFORE INSERT ON inv_ods FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- A.11  ODS — 169 metas
CREATE TABLE inv_ods_metas (
    idMeta      INT         AUTO_INCREMENT PRIMARY KEY,
    uuid        CHAR(36)    NOT NULL,
    idOds       INT         NOT NULL,
    codigoMeta  VARCHAR(10) NOT NULL,
    descripcion TEXT        NOT NULL,
    version     INT         DEFAULT 1,
    UNIQUE KEY uq_odsmetas_uuid (uuid),
    FOREIGN KEY (idOds) REFERENCES inv_ods(idOds) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='169 metas específicas de los 17 ODS';

DELIMITER $$
CREATE TRIGGER trg_odsmetas_uuid
BEFORE INSERT ON inv_ods_metas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO B: NÚCLEO — CONVOCATORIAS Y PROYECTOS
-- =============================================================================

-- B.1  Convocatorias
-- v4.2: FK explícita usuarioCreo → usuarios(idUsuario) [INT(11)]
CREATE TABLE inv_convocatorias (
    idConvocatoria       INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)      NOT NULL,
    codigoConvocatoria   VARCHAR(30)   NOT NULL UNIQUE,
    titulo               VARCHAR(255)  NOT NULL,
    descripcion          TEXT,
    idPeriodo CHAR(7) CHARACTER SET latin1 NOT NULL,
    fechaApertura        DATE          NOT NULL,
    fechaCierre          DATE          NOT NULL,
    estado               ENUM('Borrador','Abierta','Cerrada','Anulada') DEFAULT 'Borrador',
    maximoProyectos      INT,
    idLineaInvestigacion INT,
    presupuestoTotal     DECIMAL(12,2) DEFAULT 0.00,
    activo               TINYINT(1)    DEFAULT 1,
    usuarioCreo          INT(11)       NULL,        -- FK → usuarios.idUsuario
    fechaRegistro        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version              INT           DEFAULT 1,
    UNIQUE KEY uq_convocatorias_uuid (uuid),
    FOREIGN KEY (idLineaInvestigacion) REFERENCES inv_lineas_investigacion(idLinea) ON DELETE RESTRICT,
    FOREIGN KEY (idPeriodo)            REFERENCES periodos(idPeriodo)               ON DELETE RESTRICT,
    FOREIGN KEY (usuarioCreo)          REFERENCES usuarios(idUsuario)               ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Convocatorias de proyectos de investigación';

DELIMITER $$
CREATE TRIGGER trg_convocatorias_uuid
BEFORE INSERT ON inv_convocatorias FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.2  Proyectos — tabla principal
-- v4.2: + idCarrera INT(11), + idUsuarioModifico INT(11),
--        CHARACTER SET latin1 en idProfesorDirector para evitar collation mismatch
CREATE TABLE inv_proyectos (
    idProyecto              INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                    CHAR(36)      NOT NULL,
    idConvocatoria          INT,
    codigoInstitucional     VARCHAR(50)   UNIQUE,
    titulo                  VARCHAR(500)  NOT NULL,
    resumen                 TEXT,
    justificacion           TEXT,
    antecedentes            TEXT,
    marcoTeorico            TEXT,
    metodologia             TEXT,
    metodoEvaluacion        TEXT,
    -- Clasificación
    idCampoDetalladoUnesco  INT(11)       NULL,
    idSublinea              INT           NULL,
    idPrograma              INT           NULL,
    idCarrera               INT(11)       NULL,      -- v4.2: FK → carreras(idCarrera)
    tipoInvestigacion       ENUM('Básica','Aplicada','Desarrollo Experimental') DEFAULT 'Aplicada',
    modalidad               VARCHAR(100),
    -- Espacio y equipo
    idEspacio               INT(11)       NULL,
    idProfesorDirector      VARCHAR(14) CHARACTER SET latin1 NULL,  -- v4.2: latin1 para FK
    -- Estado y fechas
    estado                  ENUM(
                                'Borrador',
                                'Enviado',
                                'En Revisión',
                                'Aprobado',
                                'En Ejecución',
                                'Finalizado',
                                'Rechazado',
                                'Anulado'
                            ) DEFAULT 'Borrador',
    fechaInicio             DATE,
    fechaFin                DATE,
    -- Presupuesto
    presupuestoSolicitado   DECIMAL(12,2) DEFAULT 0.00,
    presupuestoAprobado     DECIMAL(12,2) DEFAULT 0.00,
    -- Evaluación
    puntajeEvaluacion       DECIMAL(5,2),
    esAnonimizado           TINYINT(1)    DEFAULT 0,
    -- Documentos
    rutaProtocolo           VARCHAR(512),
    rutaCronograma          VARCHAR(512),
    rutaResolucion          VARCHAR(512),
    -- Auditoría
    idUsuarioModifico       INT(11)       NULL,      -- v4.2: trazabilidad SaaS
    activo                  TINYINT(1)    DEFAULT 1,
    fechaRegistro           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                 INT           DEFAULT 1,
    UNIQUE KEY uq_proyectos_uuid (uuid),
    FOREIGN KEY (idConvocatoria)         REFERENCES inv_convocatorias(idConvocatoria)                     ON DELETE RESTRICT,
    FOREIGN KEY (idSublinea)             REFERENCES inv_sublineas(idSublinea)                             ON DELETE RESTRICT,
    FOREIGN KEY (idPrograma)             REFERENCES inv_programas(idPrograma)                             ON DELETE RESTRICT,
    FOREIGN KEY (idCampoDetalladoUnesco) REFERENCES campo_detallado_unesco(idCampoDetalladoUnesco)        ON DELETE RESTRICT,
    FOREIGN KEY (idCarrera)              REFERENCES carreras(idCarrera)                                   ON DELETE RESTRICT,
    FOREIGN KEY (idEspacio)              REFERENCES espacios(idEspacio)                                   ON DELETE RESTRICT,
    FOREIGN KEY (idProfesorDirector)     REFERENCES profesores(idProfesor)                                ON DELETE RESTRICT,
    FOREIGN KEY (idUsuarioModifico)      REFERENCES usuarios(idUsuario)                                   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Proyectos de investigación — tabla principal';

DELIMITER $$
CREATE TRIGGER trg_proyectos_uuid
BEFORE INSERT ON inv_proyectos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.3  Equipo docente del proyecto
-- v4.2: CHARACTER SET latin1 en idProfesor
CREATE TABLE inv_proyectos_profesores (
    idProyectoProfesor INT           AUTO_INCREMENT PRIMARY KEY,
    uuid               CHAR(36)      NOT NULL,
    idProyecto         INT           NOT NULL,
    idProfesor         VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    rol                VARCHAR(100),
    horasSemanales     DECIMAL(4,1),
    activo             TINYINT(1)    DEFAULT 1,
    fechaRegistro      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version            INT           DEFAULT 1,
    UNIQUE KEY uq_proyprof_uuid (uuid),
    UNIQUE KEY uq_proyecto_profesor (idProyecto, idProfesor),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idProfesor) REFERENCES profesores(idProfesor)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Profesores asignados al proyecto';

DELIMITER $$
CREATE TRIGGER trg_proyprof_uuid
BEFORE INSERT ON inv_proyectos_profesores FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.4  Equipo estudiantil del proyecto
-- v4.2: CHARACTER SET latin1 en idAlumno
CREATE TABLE inv_proyectos_alumnos (
    idProyectoAlumno INT           AUTO_INCREMENT PRIMARY KEY,
    uuid             CHAR(36)      NOT NULL,
    idProyecto       INT           NOT NULL,
    idAlumno         VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    rol              VARCHAR(100),
    activo           TINYINT(1)    DEFAULT 1,
    fechaRegistro    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version          INT           DEFAULT 1,
    UNIQUE KEY uq_proyalum_uuid (uuid),
    UNIQUE KEY uq_proyecto_alumno (idProyecto, idAlumno),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idAlumno)   REFERENCES alumnos(idAlumno)         ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Alumnos asignados al proyecto';

DELIMITER $$
CREATE TRIGGER trg_proyalum_uuid
BEFORE INSERT ON inv_proyectos_alumnos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.5  Historial de cambios de estado del proyecto
CREATE TABLE inv_proyectos_historial (
    idHistorial    INT         AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)    NOT NULL,
    idProyecto     INT         NOT NULL,
    estadoAnterior VARCHAR(50),
    estadoNuevo    VARCHAR(50) NOT NULL,
    comentario     TEXT,
    usuarioCambio  INT(11)     NULL,
    fechaCambio    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_historial_uuid (uuid),
    FOREIGN KEY (idProyecto)    REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (usuarioCambio) REFERENCES usuarios(idUsuario)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de cambios de estado del proyecto';

DELIMITER $$
CREATE TRIGGER trg_historial_uuid
BEFORE INSERT ON inv_proyectos_historial FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.6  Notificaciones del sistema
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Notificaciones automáticas del sistema';

DELIMITER $$
CREATE TRIGGER trg_notif_uuid
BEFORE INSERT ON inv_notificaciones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.7  Productos de investigación
CREATE TABLE inv_productos (
    idProducto       INT  AUTO_INCREMENT PRIMARY KEY,
    uuid             CHAR(36)     NOT NULL,
    idProyecto       INT          NOT NULL,
    tipo             ENUM(
                         'Artículo Indexado',
                         'Artículo No Indexado',
                         'Libro',
                         'Capítulo de Libro',
                         'Ponencia',
                         'Prototipo',
                         'Software',
                         'Patente',
                         'Otro'
                     ) NOT NULL,
    titulo           TEXT         NOT NULL,
    autores          TEXT,
    issn_isbn        VARCHAR(30),
    urlPublicacion   VARCHAR(512),
    nombreRevista    VARCHAR(255),
    indice           VARCHAR(100),
    fechaPublicacion DATE,
    rutaArchivo      VARCHAR(512),
    numeroRegistro   VARCHAR(100),
    enviadoRepositorio   TINYINT(1)   DEFAULT 0,
    handleRepositorio    VARCHAR(255),
    fechaExpiracionRegistro DATE,
    activo           TINYINT(1)   DEFAULT 1,
    fechaRegistro    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version          INT          DEFAULT 1,
    UNIQUE KEY uq_productos_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Productos de investigación e innovación';

DELIMITER $$
CREATE TRIGGER trg_productos_uuid
BEFORE INSERT ON inv_productos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.8  Transferencias tecnológicas
CREATE TABLE inv_transferencias (
    idTransferencia     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                CHAR(36)      NOT NULL,
    idProyecto          INT           NOT NULL,
    empresaBeneficiaria VARCHAR(255)  NOT NULL,
    tipoTransferencia   VARCHAR(100),
    descripcion         TEXT,
    valorConvenio       DECIMAL(12,2),
    fechaConvenio       DATE,
    rutaConvenio        VARCHAR(512),
    activo              TINYINT(1)    DEFAULT 1,
    fechaRegistro       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version             INT           DEFAULT 1,
    UNIQUE KEY uq_transf_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transferencias tecnológicas y convenios con empresas';

DELIMITER $$
CREATE TRIGGER trg_transferencias_uuid
BEFORE INSERT ON inv_transferencias FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.9  Tokens de acceso
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tokens temporales para acceso externo seguro';

DELIMITER $$
CREATE TRIGGER trg_tokens_uuid
BEFORE INSERT ON inv_tokens_acceso FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- B.10  Metadata de usuarios DIITRA
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Metadata y preferencias de usuarios en DIITRA';

DELIMITER $$
CREATE TRIGGER trg_usermeta_uuid
BEFORE INSERT ON inv_usuarios_metadata FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO C: EVALUACIÓN POR PARES (PEER REVIEW)
-- =============================================================================

-- C.1  Revisores externos
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Revisores externos para evaluación de proyectos';

DELIMITER $$
CREATE TRIGGER trg_revisexternas_uuid
BEFORE INSERT ON inv_revisores_externos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- C.2  Revisiones asignadas
-- v4.2: CHARACTER SET latin1 en idProfesorRevisor
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
    FOREIGN KEY (idProyecto)        REFERENCES inv_proyectos(idProyecto)                   ON DELETE RESTRICT,
    FOREIGN KEY (idRevisorExterno)  REFERENCES inv_revisores_externos(idRevisorExterno)    ON DELETE RESTRICT,
    FOREIGN KEY (idProfesorRevisor) REFERENCES profesores(idProfesor)                      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Revisiones por pares asignadas a proyectos';

DELIMITER $$
CREATE TRIGGER trg_revisiones_uuid
BEFORE INSERT ON inv_revisiones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- C.3  Detalle de revisión por rúbrica
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Puntaje por criterio de rúbrica en la revisión';

DELIMITER $$
CREATE TRIGGER trg_revdetalle_uuid
BEFORE INSERT ON inv_revisiones_detalle FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- C.4  Oficio de aprobación oficial
-- v4.2: CHARACTER SET latin1 en idDestinatario e idFirmante
CREATE TABLE inv_aprobaciones_oficiales (
    idAprobacion      INT          AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)     NOT NULL,
    idProyecto        INT          NOT NULL,
    numeroOficio      VARCHAR(50)  NOT NULL UNIQUE,
    lugarEmision      VARCHAR(100) DEFAULT 'Quito D.M.',
    fechaEmision      DATE         NOT NULL,
    considerandoTexto TEXT,
    idDestinatario    VARCHAR(14) CHARACTER SET latin1 NULL,
    idFirmante        VARCHAR(14) CHARACTER SET latin1 NULL,
    rutaOficioFirmado VARCHAR(512),
    firmaHash            VARCHAR(255),
    fechaFirmaElectronica DATETIME,
    activo            TINYINT(1)   DEFAULT 1,
    fechaRegistro     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version           INT          DEFAULT 1,
    UNIQUE KEY uq_aprobaciones_uuid (uuid),
    FOREIGN KEY (idProyecto)     REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT,
    FOREIGN KEY (idDestinatario) REFERENCES profesores(idProfesor)    ON DELETE RESTRICT,
    FOREIGN KEY (idFirmante)     REFERENCES profesores(idProfesor)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Oficios de aprobación oficial del proyecto';

DELIMITER $$
CREATE TRIGGER trg_aprobaciones_uuid
BEFORE INSERT ON inv_aprobaciones_oficiales FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO D: EJECUCIÓN Y SEGUIMIENTO
-- =============================================================================

-- D.1  Cronograma del proyecto
CREATE TABLE inv_cronograma (
    idTarea          INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             CHAR(36)     NOT NULL,
    idProyecto       INT          NOT NULL,
    nombreTarea      VARCHAR(255) NOT NULL,
    descripcion      TEXT,
    fechaInicio      DATE,
    fechaFin         DATE,
    porcentajeAvance DECIMAL(5,2) DEFAULT 0.00,
    esHito           TINYINT(1)   DEFAULT 0,
    orden            INT          DEFAULT 0,
    activo           TINYINT(1)   DEFAULT 1,
    fechaRegistro    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version          INT          DEFAULT 1,
    UNIQUE KEY uq_cronograma_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Cronograma de tareas del proyecto (Gantt)';

DELIMITER $$
CREATE TRIGGER trg_cronograma_uuid
BEFORE INSERT ON inv_cronograma FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- D.2  Informes de avance
-- v4.2: CHARACTER SET latin1 en idProfesor e idFirmaCoordinador
--        + idUsuarioModifico INT(11) para trazabilidad
CREATE TABLE inv_informes_avance (
    idInforme                INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                     CHAR(36)     NOT NULL,
    idProyecto               INT          NOT NULL,
    idProfesor               VARCHAR(14) CHARACTER SET latin1 NOT NULL,
    numeroInforme            VARCHAR(50),
    titulo                   VARCHAR(255) NOT NULL,
    descripcion              TEXT,
    porcentajeAvance         DECIMAL(5,2) DEFAULT 0.00,
    periodoReporte           VARCHAR(100),
    rutaArchivo              VARCHAR(512),
    estado                   ENUM('Borrador','Enviado','Revisado','Aprobado','Rechazado') DEFAULT 'Borrador',
    estadoEjecucion          ENUM('INICIADO','EN AVANCE','SUSPENDIDO','POR FINALIZAR','FINALIZADO') DEFAULT 'INICIADO',
    faseEjecucionExplicacion TEXT,
    observacionDirector      TEXT,
    observacionesCoordinador TEXT,
    idFirmaCoordinador       VARCHAR(14) CHARACTER SET latin1 NULL,
    rutaFichaFirmada         VARCHAR(512),
    firmaHash                VARCHAR(255),
    fechaFirmaElectronica    DATETIME,
    fechaEntrega             DATE,
    idUsuarioModifico        INT(11)      NULL,     -- v4.2: trazabilidad SaaS
    activo                   TINYINT(1)   DEFAULT 1,
    fechaRegistro            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version                  INT          DEFAULT 1,
    UNIQUE KEY uq_informesav_uuid (uuid),
    FOREIGN KEY (idProyecto)          REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT,
    FOREIGN KEY (idProfesor)          REFERENCES profesores(idProfesor)    ON DELETE RESTRICT,
    FOREIGN KEY (idFirmaCoordinador)  REFERENCES profesores(idProfesor)    ON DELETE RESTRICT,
    FOREIGN KEY (idUsuarioModifico)   REFERENCES usuarios(idUsuario)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Informes de avance periódicos del proyecto';

DELIMITER $$
CREATE TRIGGER trg_informesav_uuid
BEFORE INSERT ON inv_informes_avance FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- D.3  Actividades de seguimiento por informe
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Detalle de actividades por informe de avance';

DELIMITER $$
CREATE TRIGGER trg_segact_uuid
BEFORE INSERT ON inv_seguimiento_actividades FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- D.4  Evidencias adjuntas a informes
CREATE TABLE inv_evidencias (
    idEvidencia   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)     NOT NULL,
    idInforme     INT          NOT NULL,
    nombreArchivo VARCHAR(255) NOT NULL,
    rutaArchivo   VARCHAR(512) NOT NULL,
    tipoEvidencia VARCHAR(80),
    mimeType      VARCHAR(100),
    tamanioBytes  BIGINT,
    descripcion   TEXT,
    fechaSubida   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    version       INT          DEFAULT 1,
    UNIQUE KEY uq_evidencias_uuid (uuid),
    FOREIGN KEY (idInforme) REFERENCES inv_informes_avance(idInforme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Archivos de evidencia adjuntos a informes de avance';

DELIMITER $$
CREATE TRIGGER trg_evidencias_uuid
BEFORE INSERT ON inv_evidencias FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- D.5  Ítems del presupuesto aprobado
CREATE TABLE inv_presupuesto_items (
    idItem        INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    idProyecto    INT           NOT NULL,
    categoria     VARCHAR(100)  NOT NULL,
    descripcion   TEXT,
    cantidad      DECIMAL(10,2) DEFAULT 1,
    valorUnitario DECIMAL(12,2) NOT NULL,
    valorTotal    DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * valorUnitario) STORED,
    activo        TINYINT(1)    DEFAULT 1,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_presitems_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Ítems del presupuesto aprobado por proyecto';

DELIMITER $$
CREATE TRIGGER trg_presitems_uuid
BEFORE INSERT ON inv_presupuesto_items FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- D.6  Gastos ejecutados
-- v4.2: FK explícita registradoPor → usuarios(idUsuario) [INT(11)]
CREATE TABLE inv_gastos (
    idGasto       INT           AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)      NOT NULL,
    idProyecto    INT           NOT NULL,
    idItem        INT,
    descripcion   TEXT,
    monto         DECIMAL(12,2) NOT NULL,
    fechaGasto    DATE,
    numeroFactura VARCHAR(50),
    rutaFactura   VARCHAR(512),
    registradoPor INT(11)       NULL,
    fechaRegistro TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version       INT           DEFAULT 1,
    UNIQUE KEY uq_gastos_uuid (uuid),
    FOREIGN KEY (idProyecto)   REFERENCES inv_proyectos(idProyecto)      ON DELETE RESTRICT,
    FOREIGN KEY (idItem)       REFERENCES inv_presupuesto_items(idItem)   ON DELETE RESTRICT,
    FOREIGN KEY (registradoPor) REFERENCES usuarios(idUsuario)            ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gastos ejecutados contra el presupuesto aprobado';

DELIMITER $$
CREATE TRIGGER trg_gastos_uuid
BEFORE INSERT ON inv_gastos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO E: PLANES Y EVALUACIÓN DE APRENDIZAJE (ESTUDIANTES)
-- =============================================================================

-- v4.2: CHARACTER SET latin1 en idAlumno, idDirectorProyecto, idCoordinador
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
    FOREIGN KEY (idProyecto)         REFERENCES inv_proyectos(idProyecto)  ON DELETE RESTRICT,
    FOREIGN KEY (idAlumno)           REFERENCES alumnos(idAlumno)          ON DELETE RESTRICT,
    FOREIGN KEY (idDirectorProyecto) REFERENCES profesores(idProfesor)     ON DELETE RESTRICT,
    FOREIGN KEY (idCoordinador)      REFERENCES profesores(idProfesor)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Plan de aprendizaje del estudiante vinculado al proyecto';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prerrequisitos cognitivos y procedimentales del plan';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Actividades y carga horaria del plan de aprendizaje';

DELIMITER $$
CREATE TRIGGER trg_planact_uuid
BEFORE INSERT ON inv_plan_actividades FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- v4.2: CHARACTER SET latin1 en idAlumno e idRevisadoPor
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Evaluación del plan de aprendizaje del estudiante';

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
    FOREIGN KEY (idEvaluacion) REFERENCES inv_evaluaciones_plan(idEvaluacion)       ON DELETE CASCADE,
    FOREIGN KEY (idParametro)  REFERENCES inv_evaluacion_parametros(idParametro)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Evaluación de prerrequisitos del plan';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Evaluación de actividades ejecutadas del plan';

DELIMITER $$
CREATE TRIGGER trg_evalactplan_uuid
BEFORE INSERT ON inv_evaluacion_actividades_plan FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO F: REVISIÓN BIBLIOGRÁFICA
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Revisión bibliográfica sistemática del proyecto';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Preguntas de investigación de la revisión bibliográfica';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Criterios de inclusión y exclusión de la revisión';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Estudios analizados (matriz de extracción)';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Referencias APA de la revisión bibliográfica';

DELIMITER $$
CREATE TRIGGER trg_biblrev_uuid
BEFORE INSERT ON inv_bibliografia_revision FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO G: INFORME FINAL
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Informe final del proyecto de investigación';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anexos y evidencias del informe final';

DELIMITER $$
CREATE TRIGGER trg_infanex_uuid
BEFORE INSERT ON inv_informe_anexos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO H: ODS E IMPACTOS
-- =============================================================================

CREATE TABLE inv_proyectos_ods (
    idProyectoOds INT       AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36)  NOT NULL,
    idProyecto    INT       NOT NULL,
    idMeta        INT       NOT NULL,
    justificacion TEXT      NOT NULL,
    impacto       ENUM('Directo','Indirecto') DEFAULT 'Directo',
    fechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version       INT       DEFAULT 1,
    UNIQUE KEY uq_proyods_uuid (uuid),
    UNIQUE KEY uq_proyecto_meta (idProyecto, idMeta),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT,
    FOREIGN KEY (idMeta)     REFERENCES inv_ods_metas(idMeta)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Vinculación del proyecto con metas ODS';

DELIMITER $$
CREATE TRIGGER trg_proyods_uuid
BEFORE INSERT ON inv_proyectos_ods FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_impactos_logrados (
    idImpacto         INT       AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36)  NOT NULL,
    idProyecto        INT       NOT NULL,
    categoria         ENUM('Social','Científico','Económico','Político','Ambiental','Educativo') NOT NULL,
    descripcion       TEXT,
    activo            TINYINT(1) DEFAULT 1,
    fechaRegistro     TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion TIMESTAMP  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version           INT        DEFAULT 1,
    UNIQUE KEY uq_impactos_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Impactos cualitativos logrados por el proyecto';

DELIMITER $$
CREATE TRIGGER trg_impactos_uuid
BEFORE INSERT ON inv_impactos_logrados FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- H.3  Análisis del Asistente de IA
CREATE TABLE inv_ia_analisis (
    idAnalisis      INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36)     NOT NULL,
    idReferencia    INT          NOT NULL,
    tipoReferencia  ENUM('Proyecto', 'Informe', 'Producto') NOT NULL,
    resultadoJson   JSON,
    scoreCoherencia DECIMAL(5,2),
    sugerencias     TEXT,
    fechaAnalisis   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ia_analisis_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Análisis automáticos generados por el Asistente de IA';

DELIMITER $$
CREATE TRIGGER trg_ia_analisis_uuid
BEFORE INSERT ON inv_ia_analisis FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- =============================================================================
-- GRUPO I: DATOS SEMILLA
-- =============================================================================

INSERT INTO inv_evaluacion_parametros (idParametro, uuid, nivel, puntos, descripcion) VALUES
(1, UUID(), 'No Adecuado',   1, 'No cumple con los criterios mínimos establecidos'),
(2, UUID(), 'Poco Adecuado', 2, 'Cumple parcialmente con los criterios establecidos'),
(3, UUID(), 'Adecuado',      3, 'Cumple con los criterios establecidos satisfactoriamente'),
(4, UUID(), 'Muy Adecuado',  4, 'Supera los criterios establecidos con excelencia');

INSERT INTO inv_ods_ejes (uuid, nombre, descripcion, colorHex) VALUES
(UUID(), 'Personas',    'Erradicar la pobreza y el hambre, garantizar una vida digna e igualitaria para todos',           '#E5243B'),
(UUID(), 'Planeta',     'Proteger el planeta de la degradación y gestionar los recursos naturales de forma sostenible',   '#3F7E44'),
(UUID(), 'Prosperidad', 'Garantizar vidas prósperas y plenas para todos los seres humanos en armonía con la naturaleza',  '#FCC30B'),
(UUID(), 'Paz',         'Propiciar sociedades pacíficas, justas e inclusivas libres del temor y la violencia',            '#00689D'),
(UUID(), 'Alianzas',    'Implementar la Agenda 2030 mediante alianzas mundiales sólidas que movilicen todos los recursos','#19486A');

INSERT INTO inv_ods (uuid, idEje, numeroOds, titulo, colorHex) VALUES
(UUID(),1,1, 'Fin de la pobreza','#E5243B'),
(UUID(),1,2, 'Hambre cero','#DDA63A'),
(UUID(),1,3, 'Salud y bienestar','#4C9F38'),
(UUID(),1,4, 'Educación de calidad','#C5192D'),
(UUID(),1,5, 'Igualdad de género','#FF3A21'),
(UUID(),2,6, 'Agua limpia y saneamiento','#26BDE2'),
(UUID(),3,7, 'Energía asequible y no contaminante','#FCC30B'),
(UUID(),3,8, 'Trabajo decente y crecimiento económico','#A21942'),
(UUID(),3,9, 'Industria, innovación e infraestructura','#FD6925'),
(UUID(),3,10,'Reducción de las desigualdades','#DD1367'),
(UUID(),2,11,'Ciudades y comunidades sostenibles','#FD9D24'),
(UUID(),2,12,'Producción y consumo responsables','#BF8B2E'),
(UUID(),2,13,'Acción por el clima','#3F7E44'),
(UUID(),2,14,'Vida submarina','#0A97D9'),
(UUID(),2,15,'Vida de ecosistemas terrestres','#56C02B'),
(UUID(),4,16,'Paz, justicia e instituciones sólidas','#00689D'),
(UUID(),5,17,'Alianzas para lograr los objetivos','#19486A');

-- Metas ODS Seleccionadas (Ejemplos relevantes para IST)
INSERT INTO inv_ods_metas (uuid, idOds, codigoMeta, descripcion) VALUES
(UUID(), 4, '4.3', 'Asegurar el acceso igualitario de todos los hombres y las mujeres a una formación técnica, profesional y superior de calidad'),
(UUID(), 4, '4.4', 'Aumentar considerablemente el número de jóvenes y adultos que tienen las competencias necesarias para acceder al empleo y el emprendimiento'),
(UUID(), 8, '8.2', 'Lograr niveles más elevados de productividad económica mediante la diversificación, la modernización tecnológica y la innovación'),
(UUID(), 9, '9.5', 'Aumentar la investigación científica y mejorar la capacidad tecnológica de los sectores industriales'),
(UUID(), 9, '9.b', 'Apoyar el desarrollo de tecnologías, la investigación y la innovación nacionales en los países en desarrollo');

-- Datos Semilla UNESCO (Campos Detallados comunes en IST)
-- Nota: Estos insertan en las tablas que el sistema asume como existentes
INSERT IGNORE INTO campo_detallado_unesco (idCampoDetalladoUnesco, nombreDetallado, codigoDetallado, activo) VALUES
(1, 'Desarrollo de software y aplicaciones', '0613', 1),
(2, 'Electricidad y energía', '0713', 1),
(3, 'Mecánica y profesiones afines', '0715', 1),
(4, 'Electrónica y automatización', '0714', 1),
(5, 'Diseño y administración de redes y bases de datos', '0612', 1);

-- =============================================================================
-- GRUPO J: ÍNDICES DE RENDIMIENTO
-- =============================================================================

CREATE INDEX idx_proyectos_estado         ON inv_proyectos(estado);
CREATE INDEX idx_proyectos_convocatoria   ON inv_proyectos(idConvocatoria);
CREATE INDEX idx_proyectos_director       ON inv_proyectos(idProfesorDirector);
CREATE INDEX idx_proyectos_carrera        ON inv_proyectos(idCarrera);
CREATE INDEX idx_proyprof_proyecto        ON inv_proyectos_profesores(idProyecto);
CREATE INDEX idx_proyalum_proyecto        ON inv_proyectos_alumnos(idProyecto);
CREATE INDEX idx_historial_proyecto       ON inv_proyectos_historial(idProyecto);
CREATE INDEX idx_revisiones_proyecto      ON inv_revisiones(idProyecto);
CREATE INDEX idx_cronograma_proyecto      ON inv_cronograma(idProyecto);
CREATE INDEX idx_informesav_proyecto      ON inv_informes_avance(idProyecto);
CREATE INDEX idx_informesav_estado        ON inv_informes_avance(estado);
CREATE INDEX idx_segact_informe           ON inv_seguimiento_actividades(idInforme);
CREATE INDEX idx_segact_tipo              ON inv_seguimiento_actividades(tipoActividad);
CREATE INDEX idx_presitems_proyecto       ON inv_presupuesto_items(idProyecto);
CREATE INDEX idx_gastos_proyecto          ON inv_gastos(idProyecto);
CREATE INDEX idx_productos_proyecto       ON inv_productos(idProyecto);
CREATE INDEX idx_productos_tipo           ON inv_productos(tipo);
CREATE INDEX idx_planes_proyecto          ON inv_planes_aprendizaje(idProyecto);
CREATE INDEX idx_planes_alumno            ON inv_planes_aprendizaje(idAlumno);
CREATE INDEX idx_evalplan_proyecto        ON inv_evaluaciones_plan(idProyecto);
CREATE INDEX idx_revbib_proyecto          ON inv_revisiones_bibliograficas(idProyecto);
CREATE INDEX idx_inffin_proyecto          ON inv_informes_finales(idProyecto);
CREATE INDEX idx_inffin_estado            ON inv_informes_finales(estadoInforme);
CREATE INDEX idx_proyods_proyecto         ON inv_proyectos_ods(idProyecto);
CREATE INDEX idx_aprob_proyecto           ON inv_aprobaciones_oficiales(idProyecto);
CREATE INDEX idx_sublineas_linea          ON inv_sublineas(idLinea);
CREATE INDEX idx_notif_destinatario       ON inv_notificaciones(destinatario);

-- =============================================================================
-- GRUPO K: VISTAS PARA REPORTES CACES
-- =============================================================================

-- v4.2: incluye carrera en el resumen de proyectos
CREATE OR REPLACE VIEW v_proyectos_resumen AS
SELECT
    p.idProyecto,
    p.codigoInstitucional,
    p.titulo,
    p.estado,
    p.tipoInvestigacion,
    p.modalidad,
    pr.nombre          AS programa,
    s.nombre           AS sublinea,
    l.nombreLinea      AS linea,
    cu.nombreDetallado AS campoUNESCO,
    car.Carrera        AS nombreCarrera,
    per.detalle        AS periodo
FROM inv_proyectos p
LEFT JOIN inv_programas            pr  ON p.idPrograma             = pr.idPrograma
LEFT JOIN inv_sublineas            s   ON p.idSublinea             = s.idSublinea
LEFT JOIN inv_lineas_investigacion l   ON s.idLinea                = l.idLinea
LEFT JOIN campo_detallado_unesco   cu  ON p.idCampoDetalladoUnesco = cu.idCampoDetalladoUnesco
LEFT JOIN carreras                 car ON p.idCarrera              = car.idCarrera
LEFT JOIN inv_convocatorias        c   ON p.idConvocatoria         = c.idConvocatoria
LEFT JOIN periodos                 per ON c.idPeriodo              = per.idPeriodo;

CREATE OR REPLACE VIEW v_indicadores_produccion AS
SELECT
    prod.idProyecto,
    p.titulo AS tituloProyecto,
    p.estado,
    prod.tipo,
    COUNT(*) AS cantidad
FROM inv_productos prod
JOIN inv_proyectos p ON prod.idProyecto = p.idProyecto
WHERE prod.activo = 1
GROUP BY prod.idProyecto, p.titulo, p.estado, prod.tipo;

CREATE OR REPLACE VIEW v_avance_seguimiento AS
SELECT
    ia.idInforme,
    ia.idProyecto,
    p.titulo                                                            AS tituloProyecto,
    ia.numeroInforme,
    ia.periodoReporte,
    ia.estadoEjecucion,
    ia.porcentajeAvance,
    COUNT(sa.idActividad)                                               AS totalActividades,
    SUM(CASE WHEN sa.tipoActividad = 'Ejecutada'   THEN 1 ELSE 0 END) AS ejecutadas,
    SUM(CASE WHEN sa.tipoActividad = 'No Prevista' THEN 1 ELSE 0 END) AS noPrevistas,
    SUM(CASE WHEN sa.tipoActividad = 'Obstaculo'   THEN 1 ELSE 0 END) AS obstaculos
FROM inv_informes_avance ia
JOIN inv_proyectos p ON ia.idProyecto = p.idProyecto
LEFT JOIN inv_seguimiento_actividades sa ON sa.idInforme = ia.idInforme AND sa.activo = 1
GROUP BY ia.idInforme, ia.idProyecto, p.titulo,
         ia.numeroInforme, ia.periodoReporte, ia.estadoEjecucion, ia.porcentajeAvance;

CREATE OR REPLACE VIEW v_presupuesto_ejecutado AS
SELECT
    p.idProyecto,
    p.titulo,
    p.presupuestoAprobado                              AS presupuestado,
    COALESCE(SUM(g.monto), 0)                         AS ejecutado,
    p.presupuestoAprobado - COALESCE(SUM(g.monto), 0) AS disponible
FROM inv_proyectos p
LEFT JOIN inv_gastos g ON g.idProyecto = p.idProyecto
GROUP BY p.idProyecto, p.titulo, p.presupuestoAprobado;

CREATE OR REPLACE VIEW v_equipo_proyecto AS
SELECT
    pp.idProyecto,
    pr.idProfesor                                  AS idPersona,
    CONCAT(pr.primerNombre,' ',pr.primerApellido)  AS nombreCompleto,
    pr.emailInstitucional                          AS email,
    pp.rol,
    pp.horasSemanales,
    'Profesor'                                     AS tipoMiembro
FROM inv_proyectos_profesores pp
JOIN profesores pr ON pp.idProfesor = pr.idProfesor
WHERE pp.activo = 1
UNION ALL
SELECT
    pa.idProyecto,
    al.idAlumno                                        AS idPersona,
    CONCAT(al.primerNombre,' ',al.apellidoPaterno)     AS nombreCompleto,
    al.email_institucional                             AS email,
    pa.rol,
    NULL                                               AS horasSemanales,
    'Alumno'                                           AS tipoMiembro
FROM inv_proyectos_alumnos pa
JOIN alumnos al ON pa.idAlumno = al.idAlumno
WHERE pa.activo = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================

