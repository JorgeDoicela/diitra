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
    -- Grupo K (Seguridad y Notificaciones)
    inv_notificaciones,
    inv_tokens_acceso,
    inv_usuarios_metadata,
    
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
    inv_tipos_convocatoria,
    inv_agendas_zonales,
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

-- #############################################################################
-- CATALOGOS DE CONVOCATORIA (EXCELENCIA 2026)
-- #############################################################################

CREATE TABLE inv_tipos_convocatoria (
    idTipoConvocatoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(100) NOT NULL,
    descripcion        VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inv_tipos_convocatoria (nombre, descripcion) VALUES 
('Investigación Aplicada', 'Desarrollo de prototipos y soluciones técnicas'),
('Innovación', 'Proyectos con alto impacto en el mercado o sociedad'),
('Semilleros', 'Iniciación a la investigación con estudiantes'),
('Vinculación e Investigación', 'Proyectos integrados con la comunidad');

CREATE TABLE inv_agendas_zonales (
    idAgendaZonal INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inv_agendas_zonales (nombre, descripcion) VALUES 
('Zona 9 - Software y TI', 'Agenda prioritaria para el Distrito Metropolitano de Quito'),
('Zona 9 - Eficiencia Energética', 'Proyectos de energías renovables y ahorro'),
('Zona 9 - Inclusión Social', 'Desarrollo social y educación');

CREATE TABLE inv_convocatorias (
    idConvocatoria     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid               CHAR(36)      NOT NULL UNIQUE,
    codigoConvocatoria VARCHAR(30)   NOT NULL UNIQUE,
    titulo             VARCHAR(255)  NOT NULL,
    idPeriodo          CHAR(7) CHARACTER SET latin1 NOT NULL,
    fechaApertura      DATE          NOT NULL,
    fechaCierre        DATE          NOT NULL,
    anio               INT           NOT NULL,
    descripcion        TEXT,
    presupuestoTotal   DECIMAL(12,2),
    montoMaximoProyecto DECIMAL(12,2),
    urlBases           VARCHAR(512),
    requisitosMinimos  TEXT,
    idTipoConvocatoria INT           NULL,
    idAgendaZonal      INT           NULL,
    financiamientoExt  TINYINT(1)    DEFAULT 0,
    metaProduccion     VARCHAR(255),
    estado             ENUM('Borrador','Abierta','Cerrada','Anulada') DEFAULT 'Borrador',
    FOREIGN KEY (idPeriodo) REFERENCES periodos(idPeriodo),
    FOREIGN KEY (idTipoConvocatoria) REFERENCES inv_tipos_convocatoria(idTipoConvocatoria),
    FOREIGN KEY (idAgendaZonal) REFERENCES inv_agendas_zonales(idAgendaZonal)
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

-- =============================================================================
-- GRUPO K: NOTIFICACIONES, SEGURIDAD Y METADATA
-- =============================================================================

CREATE TABLE inv_notificaciones (
    idNotificacion   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             CHAR(36)     NOT NULL UNIQUE,
    idProyecto       INT          NULL,
    destinatario     INT(11)      NOT NULL,
    tipoDestinatario ENUM('Usuario','Profesor','Alumno') DEFAULT 'Usuario',
    categoria        VARCHAR(50)  DEFAULT 'SISTEMA',
    prioridad        VARCHAR(20)  DEFAULT 'NORMAL',
    titulo           VARCHAR(255) NOT NULL,
    mensaje          TEXT,
    urlAccion        VARCHAR(255) NULL,
    leido            TINYINT(1)   DEFAULT 0,
    fechaEnvio       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaLectura     TIMESTAMP    NULL,
    version          INT          DEFAULT 1,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE SET NULL,
    FOREIGN KEY (destinatario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Notificaciones con prioridad y redirección (Deep Linking)';

DELIMITER $$
CREATE TRIGGER trg_notif_uuid
BEFORE INSERT ON inv_notificaciones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_tokens_acceso (
    idToken         INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            CHAR(36)     NOT NULL UNIQUE,
    idProyecto      INT          NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    idReferencia    INT          NOT NULL,
    tipoReferencia  VARCHAR(50)  NOT NULL DEFAULT 'Externo',
    scopes          VARCHAR(255),
    maxUsos         INT          DEFAULT 1,
    usosActuales    INT          DEFAULT 0,
    ipOrigen        VARCHAR(50)  NULL,
    activo          TINYINT(1)   DEFAULT 1,
    fechaRegistro   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaExpiracion TIMESTAMP    NULL,
    version         INT          DEFAULT 1,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Seguridad para Pares Ciegos (Control de IPs y usos)';

DELIMITER $$
CREATE TRIGGER trg_tokens_uuid
BEFORE INSERT ON inv_tokens_acceso FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_usuarios_metadata (
    idMetadata           INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 CHAR(36)     NOT NULL UNIQUE,
    idUsuario            INT(11)      NOT NULL UNIQUE,
    orcidId              VARCHAR(20)  NULL,
    especialidad         TEXT         NULL,
    gradoAcademicoMaximo VARCHAR(100) NULL,
    rutaFirmaP12         VARCHAR(255) NULL,
    firmaHabilitada      TINYINT(1)   DEFAULT 0,
    configuracion        JSON         NULL,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaUltimoAcceso    TIMESTAMP    NULL,
    version              INT          DEFAULT 1,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Perfil CACES, SENESCYT y configuración de Firma Electrónica';

DELIMITER $$
CREATE TRIGGER trg_usermeta_uuid
BEFORE INSERT ON inv_usuarios_metadata FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

-- CIERRE DE SEGURIDAD PARA EL NÚCLEO V3
SET FOREIGN_KEY_CHECKS = 1;
