-- =============================================================================
--  ADVERTENCIA DE SEGURIDAD - AMBIENTE DE DESARROLLO
--  Este script está diseñado para el despliegue del módulo de INVESTIGACIÓN.
--  SOLO AFECTA A TABLAS CON PREFIJO 'inv_'.
--  NO MODIFICA, ELIMINA NI ALTERA TABLAS INSTITUCIONALES (periodos, carreras,
--  profesores, alumnos, etc.).
--  Uso: Instalación inicial o reinicio del módulo de investigación.
-- =============================================================================

USE sigafi_es;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- =============================================================================
-- LIMPIEZA PREVIA (Solo tablas del módulo Investigación 'inv_')
-- =============================================================================

DROP TABLE IF EXISTS
    -- Grupo K (Seguridad y Notificaciones)
    inv_notificaciones,
    inv_tokens_acceso,
    inv_usuarios_metadata,
    inv_dispositivos_tokens,
    inv_config_indicadores,
    inv_audit_admin,

    -- DIITRA Document Engine (Plantillas y Auditoría)
    inv_document_audit,
    inv_documentos_firmas,
    inv_documentos_instancias,
    inv_document_templates,

    -- DIITRA CoWork (Coordinación Team Pulse & Colaboración)
    inv_collaboration_comments,
    inv_documentos_secciones_metadata,
    inv_cowork_updates,
    inv_cowork_sesiones,
    inv_cowork_documentos,

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
    inv_trazabilidad_proyectos,
    inv_proyectos,
    inv_convocatorias_lineas,
    inv_convocatorias,
    inv_rubrica_criterios,
    inv_rubricas,
    inv_tipos_convocatoria,
    inv_agendas_zonales,
    inv_sublineas,
    inv_lineas_investigacion,
    inv_programas,
    inv_grupos_lineas,
    inv_grupos_carreras,
    inv_grupos_miembros,
    inv_grupos_investigacion,
    inv_dominios_carrera,
    inv_dominios,
    inv_tipos_investigacion,
    inv_revisiones_pares,
    inv_evaluaciones_detalle,
    inv_proyectos_documentos_adjuntos,
    inv_proyectos_mml,
    inv_convocatorias_documentos_req,
    inv_convocatorias_hitos,
    inv_pnd_objetivos,

    -- Catálogos y Configuración adicionales
    inv_cat_tipo_producto,
    inv_cat_tipo_evidencia,
    inv_entidades_externas,
    inv_config_workflow;

-- #############################################################################
-- SECCIÓN 1: CATÁLOGOS BASE
-- #############################################################################

CREATE TABLE inv_lineas_investigacion (
    idLinea              INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)     NOT NULL UNIQUE,
    codigoLinea          VARCHAR(30)  NOT NULL UNIQUE,
    nombreLinea          VARCHAR(255) NOT NULL,
    descripcion          TEXT,
    activo               TINYINT(1)   DEFAULT 1,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_programas (
    idPrograma    INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_dominios (
    idDominio     INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
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
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
    idLinea       INT          NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    activo        TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (idLinea) REFERENCES inv_lineas_investigacion(idLinea) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_tipos_investigacion (
    idTipo        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
    nombre        VARCHAR(100) NOT NULL,
    idTipoPadre   INT          NULL,
    activo        TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (idTipoPadre) REFERENCES inv_tipos_investigacion(idTipo) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo SENESCYT: Básica, Aplicada, Experimental';

-- NÚCLEO PROFESIONAL: CATÁLOGO DE PRODUCTOS (Investigación + Innovación)
CREATE TABLE inv_cat_tipo_producto (
    idTipoProducto   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)     NOT NULL UNIQUE,
    nombre           VARCHAR(100) NOT NULL,
    categoria        ENUM('Académico', 'Tecnológico', 'Innovación', 'Transferencia') NOT NULL,
    requiereRegistro TINYINT(1)   DEFAULT 0 COMMENT 'Si requiere SENADI / SENESCYT',
    activo           TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NÚCLEO PROFESIONAL: CATÁLOGO DE EVIDENCIAS
CREATE TABLE inv_cat_tipo_evidencia (
    idTipoEvidencia  INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)     NOT NULL UNIQUE,
    nombre           VARCHAR(100) NOT NULL,
    descripcion      VARCHAR(255),
    extensiones      VARCHAR(50)  DEFAULT 'pdf,jpg,png,zip',
    activo           TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NÚCLEO PROFESIONAL: ENTIDADES EXTERNAS (Empresas y Aliados)
CREATE TABLE inv_entidades_externas (
    idEntidad        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)     NOT NULL UNIQUE,
    ruc              VARCHAR(13)  UNIQUE,
    razonSocial      VARCHAR(255) NOT NULL,
    tipo             ENUM('Pública', 'Privada', 'ONG', 'Académica') DEFAULT 'Privada',
    sector           VARCHAR(100) COMMENT 'Ej: Software, Manufactura, Agrícola',
    contactoNombre   VARCHAR(150),
    contactoEmail    VARCHAR(150),
    activo           TINYINT(1)   DEFAULT 1,
    fechaRegistro    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_grupos_investigacion (
    idGrupo              INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)     NOT NULL UNIQUE,
    nombre               VARCHAR(255) NOT NULL,
    siglas               VARCHAR(50),
    tipoGrupo            ENUM('Investigación', 'Semillero') NOT NULL DEFAULT 'Investigación',
    idDominio            INT          NULL,
    idCoordinador        INT(11) NULL,
    objetivoGeneral      TEXT,
    mision               TEXT,
    vision               TEXT,
    resolucionAprobacion VARCHAR(100),
    fechaCreacion        DATE,
    estado               VARCHAR(20)  DEFAULT 'Aprobado',
    activo               TINYINT(1)   DEFAULT 1,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idCoordinador) REFERENCES usuarios(idUsuario) ON DELETE SET NULL,
    FOREIGN KEY (idDominio)     REFERENCES inv_dominios(idDominio) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_pnd_objetivos (
    idObjetivoPnd   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            VARCHAR(36)     NOT NULL UNIQUE,
    codigo          VARCHAR(20)  NOT NULL UNIQUE,
    nombre          VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    activo          TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catálogo del Plan Nacional de Desarrollo (SENESCYT)';

INSERT INTO inv_pnd_objetivos (uuid, codigo, nombre, descripcion, activo) VALUES
(UUID(), 'OBJ-1', 'Garantizar la seguridad ciudadana y el orden público', 'Alineado al eje de seguridad nacional', 1),
(UUID(), 'OBJ-2', 'Fomentar el crecimiento económico y el empleo', 'Alineado al eje económico', 1),
(UUID(), 'OBJ-3', 'Impulsar la innovación y la soberanía tecnológica', 'Objetivo principal para proyectos de I+D en ISTs', 1),
(UUID(), 'OBJ-4', 'Fortalecer el sistema nacional de educación superior', 'Alineado al desarrollo del talento humano', 1);

CREATE TABLE inv_grupos_lineas (
    idGrupo INT NOT NULL,
    idLinea INT NOT NULL,
    PRIMARY KEY (idGrupo, idLinea),
    FOREIGN KEY (idGrupo) REFERENCES inv_grupos_investigacion(idGrupo) ON DELETE CASCADE,
    FOREIGN KEY (idLinea) REFERENCES inv_lineas_investigacion(idLinea) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_grupos_carreras (
    idGrupo   INT NOT NULL,
    idCarrera INT(11) NOT NULL,
    PRIMARY KEY (idGrupo, idCarrera),
    FOREIGN KEY (idGrupo)   REFERENCES inv_grupos_investigacion(idGrupo) ON DELETE CASCADE,
    FOREIGN KEY (idCarrera) REFERENCES carreras(idCarrera)              ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Vinculación de grupos con programas académicos';

CREATE TABLE inv_grupos_miembros (
    idGrupoMiembro INT          AUTO_INCREMENT PRIMARY KEY,
    idGrupo        INT          NOT NULL,
    idUsuario      INT(11)      NOT NULL,
    rol            VARCHAR(100) COMMENT 'Investigador, Co-investigador, Estudiante, Técnico',
    activo         TINYINT(1)   DEFAULT 1,
    fechaInicio    DATE,
    fechaFin       DATE,
    FOREIGN KEY (idGrupo)    REFERENCES inv_grupos_investigacion(idGrupo) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario) ON DELETE CASCADE
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

CREATE TABLE inv_rubricas (
    idRubrica    INT          AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(255) NOT NULL,
    descripcion  TEXT,
    version      VARCHAR(20)  DEFAULT '1.0',
    activo       TINYINT(1)   DEFAULT 1,
    fechaRegistro TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NÚCLEO PROFESIONAL: CRITERIOS DE RÚBRICA (Configuración Dinámica)
CREATE TABLE inv_rubrica_criterios (
    idCriterio    INT           AUTO_INCREMENT PRIMARY KEY,
    idRubrica     INT           NOT NULL,
    nombre        VARCHAR(255)  NOT NULL,
    descripcion   TEXT,
    pesoPorcentaje DECIMAL(5,2) NOT NULL COMMENT 'Ej: 20.00 para 20%',
    orden         INT           DEFAULT 0,
    FOREIGN KEY (idRubrica) REFERENCES inv_rubricas(idRubrica) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inv_rubricas (nombre, descripcion) VALUES
('Rúbrica Estándar I+D', 'Evaluación general para proyectos de investigación y desarrollo'),
('Rúbrica de Innovación Tecnológica', 'Enfocada en prototipado y transferencia tecnológica'),
('Rúbrica de Semilleros', 'Evaluación simplificada para proyectos estudiantiles');

CREATE TABLE inv_convocatorias (
    idConvocatoria     INT           AUTO_INCREMENT PRIMARY KEY,
    uuid               VARCHAR(36)      NOT NULL UNIQUE,
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
    idRubrica          INT           NULL,
    puntajeMinimoAprobacion DECIMAL(5,2) DEFAULT 70.00,
    financiamientoExt  TINYINT(1)    DEFAULT 0,
    metaProduccion     VARCHAR(255),
    estado             ENUM('Borrador','Abierta','Cerrada','Anulada') DEFAULT 'Borrador',
    FOREIGN KEY (idPeriodo) REFERENCES periodos(idPeriodo),
    FOREIGN KEY (idTipoConvocatoria) REFERENCES inv_tipos_convocatoria(idTipoConvocatoria),
    FOREIGN KEY (idAgendaZonal) REFERENCES inv_agendas_zonales(idAgendaZonal),
    FOREIGN KEY (idRubrica) REFERENCES inv_rubricas(idRubrica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_convocatorias_hitos (
    idHito           INT           AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)      NOT NULL UNIQUE,
    idConvocatoria   INT           NOT NULL,
    nombreHito       VARCHAR(150)  NOT NULL COMMENT 'Ej: Publicación de Resultados Preliminares',
    fechaHito        DATE          NOT NULL,
    esCritico        TINYINT(1)    DEFAULT 0 COMMENT 'Si es crítico, bloquea acciones del usuario',
    descripcion      VARCHAR(255),
    FOREIGN KEY (idConvocatoria) REFERENCES inv_convocatorias(idConvocatoria) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_convocatorias_documentos_req (
    idDocReq         INT           AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)      NOT NULL UNIQUE,
    idConvocatoria   INT           NOT NULL,
    nombreDocumento  VARCHAR(255)  NOT NULL COMMENT 'Ej: Certificado de no tener deudas',
    descripcion      TEXT,
    esObligatorio    TINYINT(1)    DEFAULT 1,
    formatoAceptado  VARCHAR(50)   DEFAULT 'PDF',
    FOREIGN KEY (idConvocatoria) REFERENCES inv_convocatorias(idConvocatoria) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_convocatorias_lineas (
    idConvocatoria INT NOT NULL,
    idLinea        INT NOT NULL,
    PRIMARY KEY (idConvocatoria, idLinea),
    FOREIGN KEY (idConvocatoria) REFERENCES inv_convocatorias(idConvocatoria) ON DELETE CASCADE,
    FOREIGN KEY (idLinea)        REFERENCES inv_lineas_investigacion(idLinea) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- #############################################################################
-- SECCIÓN 2: PROYECTO Y PARTICIPANTES
-- #############################################################################

CREATE TABLE inv_proyectos (
    idProyecto            INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                  VARCHAR(36)      NOT NULL UNIQUE,
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
    idObjetivoPnd         INT           NULL COMMENT 'Vínculo con el Plan Nacional de Desarrollo',
    activo                TINYINT(1)    DEFAULT 1,
    fechaRegistro         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- NÚCLEO DE INNOVACIÓN Y VINCULACIÓN PRODUCTIVA
    idEntidadAliada      INT           NULL COMMENT 'Empresa o Institución Co-ejecutora',
    trlInicial           TINYINT       DEFAULT 1 COMMENT 'Technology Readiness Level Inicial (1-9)',
    trlActual            TINYINT       DEFAULT 1 COMMENT 'Technology Readiness Level Actual (1-9)',
    trlMeta              TINYINT       NULL COMMENT 'Technology Readiness Level esperado al finalizar',

    FOREIGN KEY (idConvocatoria) REFERENCES inv_convocatorias(idConvocatoria),
    FOREIGN KEY (idSublinea)     REFERENCES inv_sublineas(idSublinea),
    FOREIGN KEY (idPrograma)     REFERENCES inv_programas(idPrograma),
    FOREIGN KEY (idGrupo)        REFERENCES inv_grupos_investigacion(idGrupo),
    FOREIGN KEY (idTipo)         REFERENCES inv_tipos_investigacion(idTipo),
    FOREIGN KEY (idObjetivoPnd)  REFERENCES inv_pnd_objetivos(idObjetivoPnd),
    FOREIGN KEY (idEntidadAliada) REFERENCES inv_entidades_externas(idEntidad),

    -- Extensiones Enterprise CACES / SENESCYT
    hashActaAprobacion   TEXT NULL,
    fechaAprobacion      TIMESTAMP NULL,
    firmadoPor           INT(11) NULL,
    idDspaceHandle       VARCHAR(255)  NULL COMMENT 'Handle del Repositorio Digital DSpace',
    metadataCacesJson    JSON          NULL COMMENT 'Snapshot de indicadores para acreditación',
    FOREIGN KEY (firmadoPor) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Matriz de Marco Lógico (MML) - Requisito SENESCYT
CREATE TABLE inv_proyectos_mml (
    idMml           INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto      INT          NOT NULL,
    nivel           ENUM('Fin','Propósito','Componente','Actividad') NOT NULL,
    resumenNarrativo TEXT        NOT NULL,
    indicadores     TEXT         NULL,
    mediosVerificacion TEXT      NULL,
    supuestos       TEXT         NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Documentos Adjuntos del Proyecto (Checklist de Postulación)
CREATE TABLE inv_proyectos_documentos_adjuntos (
    idDocAdj        INT          AUTO_INCREMENT PRIMARY KEY,
    uuid            VARCHAR(36)     NOT NULL UNIQUE,
    idProyecto      INT          NOT NULL,
    idDocReq        INT          NULL COMMENT 'Referencia al requisito de la convocatoria',
    nombreArchivo   VARCHAR(255) NOT NULL,
    rutaArchivo     VARCHAR(512) NOT NULL,
    fechaSubida     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idDocReq)   REFERENCES inv_convocatorias_documentos_req(idDocReq) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trazabilidad de Estados para Auditoría (CACES)
CREATE TABLE inv_trazabilidad_proyectos (
    idTrazabilidad  INT AUTO_INCREMENT PRIMARY KEY,
    uuid            VARCHAR(36) NOT NULL UNIQUE,
    idProyecto      INT NOT NULL,
    idUsuario       INT(11) NOT NULL,
    estadoAnterior  VARCHAR(50) NOT NULL,
    estadoNuevo     VARCHAR(50) NOT NULL,
    observacion     TEXT,
    fechaTransicion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Seguridad del Núcleo: Cadena de Confianza (Blockchain-like Audit)
    hashAnterior    VARCHAR(100) NULL COMMENT 'Hash de la transición previa',
    hashActual      VARCHAR(100) NULL COMMENT 'Hash SHA-256 de esta transición (Integridad)',
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auditoría Administrativa Forense (CACES/SENESCYT)
CREATE TABLE inv_audit_admin (
    idAudit            INT AUTO_INCREMENT PRIMARY KEY,
    idUsuarioAdmin     INT NOT NULL,
    idUsuarioAfectado  INT NOT NULL,
    accion             VARCHAR(100) NOT NULL,
    modulo             VARCHAR(100),
    detalle            TEXT,
    ipOrigen           VARCHAR(45),
    userAgent          TEXT,
    valoresAnteriores  TEXT, -- Snapshot JSON del estado previo
    valoresNuevos      TEXT, -- Snapshot JSON del estado posterior
    fecha              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuarioAdmin) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idUsuarioAfectado) REFERENCES usuarios(idUsuario)
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
    idUsuario          INT(11)       NOT NULL,
    esDirector         TINYINT(1)    DEFAULT 0,
    rol                VARCHAR(100),
    nivelAcademico     VARCHAR(150),
    telefono           VARCHAR(20),
    horasSemanales     DECIMAL(4,1),
    activo             TINYINT(1)    DEFAULT 1,
    fecha_inicio       DATETIME      NULL,
    fecha_fin          DATETIME      NULL,
    motivo_cambio      VARCHAR(150)  NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_alumnos (
    idProyectoAlumno INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto       INT           NOT NULL,
    idUsuario        INT(11)       NOT NULL,
    rol              VARCHAR(100),
    nivelAcademico   VARCHAR(150),
    telefono         VARCHAR(20),
    activo           TINYINT(1)    DEFAULT 1,
    fecha_inicio     DATETIME      NULL,
    fecha_fin        DATETIME      NULL,
    motivo_cambio    VARCHAR(150)  NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario)       ON DELETE RESTRICT
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
    idPartida     VARCHAR(50)   NULL COMMENT 'Código de partida presupuestaria institucional',
    detalle       TEXT          NOT NULL,
    cantidad      DECIMAL(10,2) NOT NULL DEFAULT 1,
    valorUnitario DECIMAL(12,2) NOT NULL,
    valorTotal    DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * valorUnitario) STORED,
    esGastoCapital TINYINT(1)   DEFAULT 0 COMMENT 'Diferenciación para reportes SENESCYT',
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
    idTipoProducto INT         NOT NULL,
    titulo        VARCHAR(500) NOT NULL,
    cantidad      INT          NOT NULL DEFAULT 1,
    urlProducto   VARCHAR(512),
    -- Campos para Propiedad Intelectual (SENADI)
    esPropiedadIntelectual TINYINT(1) DEFAULT 0,
    numeroRegistro VARCHAR(100),
    fechaRegistroSenadi DATE,
    metadataJson  JSON         NULL COMMENT 'Metadatos específicos según tipo (ISSN, ISBN, PatentID)',
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idTipoProducto) REFERENCES inv_cat_tipo_producto(idTipoProducto)
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
    uuid              VARCHAR(36)      NOT NULL UNIQUE,
    idProyecto        INT           NOT NULL,
    idObjetivo        INT           NOT NULL,
    numeroActividad   INT           NOT NULL,
    descripcion       TEXT          NOT NULL,
    recursosNecesarios TEXT,
    fechaInicioPrevista DATE,
    fechaFinPrevista    DATE,
    progreso            DECIMAL(5,2)  DEFAULT 0.00,
    ponderacion         DECIMAL(5,2)  DEFAULT 0.00 COMMENT 'Peso porcentual en el proyecto',
    esEntregableCaces   TINYINT(1)    DEFAULT 0    COMMENT 'Marca actividad como evidencia de acreditación',
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
    uuid           VARCHAR(36)     NOT NULL UNIQUE,
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
    uuid              VARCHAR(36)      NOT NULL UNIQUE,
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
    uuid           VARCHAR(36)      NOT NULL UNIQUE,
    idInforme      INT           NOT NULL,
    idTipoEvidencia INT          NOT NULL,
    descripcion    VARCHAR(255),
    rutaArchivo    VARCHAR(512)  NOT NULL,
    metadataJson   JSON          NULL COMMENT 'Datos adicionales (Geolocalización, Hash del archivo)',
    fechaRegistro  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idInforme) REFERENCES inv_informes_avance(idInforme) ON DELETE CASCADE,
    FOREIGN KEY (idTipoEvidencia) REFERENCES inv_cat_tipo_evidencia(idTipoEvidencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Libro Diario de Gastos (Monitoreo Presupuestario)
CREATE TABLE inv_gastos (
    idGasto        INT           AUTO_INCREMENT PRIMARY KEY,
    uuid           VARCHAR(36)      NOT NULL UNIQUE,
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
-- SECCIÓN 10: EVALUACIÓN POR PARES (DOBLE CIEGO)
-- #############################################################################

CREATE TABLE inv_revisiones_pares (
    idRevision        INT           AUTO_INCREMENT PRIMARY KEY,
    uuid              VARCHAR(36)      NOT NULL UNIQUE,
    idProyecto        INT           NOT NULL,
    idRevisor         INT(11)       NOT NULL, -- ID del Usuario/Profesor
    fechaAsignacion   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaLimite       DATE          NOT NULL,
    estado            ENUM('Pendiente', 'Completada', 'Rechazada', 'Expirada') DEFAULT 'Pendiente',
    esExterno         TINYINT(1)    DEFAULT 0,
    esDobleCiego      TINYINT(1)    DEFAULT 1 COMMENT 'Si es 1, el núcleo oculta identidades',
    puntajeTotal      DECIMAL(5,2)  NULL,
    observacionesGral TEXT,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idRevisor)  REFERENCES usuarios(idUsuario)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_evaluaciones_detalle (
    idDetalle         INT           AUTO_INCREMENT PRIMARY KEY,
    idRevision        INT           NOT NULL,
    criterio          VARCHAR(255)  NOT NULL,
    puntaje           DECIMAL(5,2)  NOT NULL,
    observaciones     TEXT,
    FOREIGN KEY (idRevision) REFERENCES inv_revisiones_pares(idRevision) ON DELETE CASCADE
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
CREATE TRIGGER trg_revisiones_uuid BEFORE INSERT ON inv_revisiones_pares FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_prod_uuid BEFORE INSERT ON inv_cat_tipo_producto FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_evid_cat_uuid BEFORE INSERT ON inv_cat_tipo_evidencia FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_ent_ext_uuid BEFORE INSERT ON inv_entidades_externas FOR EACH ROW
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
    uuid             VARCHAR(36)     NOT NULL UNIQUE,
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
    uuid            VARCHAR(36)     NOT NULL UNIQUE,
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
    uuid                 VARCHAR(36)     NOT NULL UNIQUE,
    idUsuario            INT(11)      NOT NULL UNIQUE,
    orcidId              VARCHAR(20)  NULL,
    scopusId             VARCHAR(30)  NULL,
    googleScholarUrl     VARCHAR(255) NULL,
    researchGateUrl      VARCHAR(255) NULL,
    especialidad         TEXT         NULL,
    gradoAcademicoMaximo VARCHAR(100) NULL,
    rutaFirmaP12         VARCHAR(255) NULL,
    rutaFirmaImagen      VARCHAR(255) NULL,
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

CREATE TABLE inv_dispositivos_tokens (
    idToken             INT          AUTO_INCREMENT PRIMARY KEY,
    idUsuario           INT(11)      NOT NULL,
    deviceToken         VARCHAR(512) NOT NULL UNIQUE,
    plataforma          VARCHAR(20)  DEFAULT 'Web', -- Web, iOS, Android
    ultimaSincronizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[MÓVIL] Almacén de tokens para Push Notifications (FCM)';


-- NÚCLEO PROFESIONAL: CONFIGURACIÓN DE INDICADORES (CACES/SENESCYT)
CREATE TABLE inv_config_indicadores (
    idConfig         INT           AUTO_INCREMENT PRIMARY KEY,
    idInstitucion    INT           DEFAULT 1,
    codigoIndicador  VARCHAR(20)   NOT NULL COMMENT 'Ej: I+D-1, PUB-3',
    nombreIndicador  VARCHAR(255)  NOT NULL,
    descripcion      TEXT,
    tipoDato         ENUM('Cantidad', 'Monto', 'Booleano', 'Porcentaje') DEFAULT 'Cantidad',
    valorReferencia  DECIMAL(12,2),
    añoNormativa     INT           NOT NULL COMMENT 'Año del modelo de evaluación (ej: 2024)',
    activo           TINYINT(1)    DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CIERRE DE SEGURIDAD PARA EL NÚCLEO V3
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SECCIÓN: CATÁLOGOS INICIALES (SEED DATA)
-- ============================================================

-- Limpieza de catálogos para evitar duplicados en re-ejecución
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

TRUNCATE TABLE inv_convocatorias_lineas;
TRUNCATE TABLE inv_ods;
TRUNCATE TABLE inv_ods_ejes;
TRUNCATE TABLE inv_tipos_investigacion;
TRUNCATE TABLE inv_rubricas;
TRUNCATE TABLE inv_agendas_zonales;
TRUNCATE TABLE inv_tipos_convocatoria;
TRUNCATE TABLE inv_lineas_investigacion;
TRUNCATE TABLE inv_programas;
TRUNCATE TABLE inv_dominios;

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tipos de Convocatoria
INSERT INTO inv_tipos_convocatoria (nombre, descripcion) VALUES
('Investigación Aplicada', 'Desarrollo de prototipos y soluciones técnicas'),
('Innovación', 'Proyectos con alto impacto en el mercado o sociedad'),
('Semilleros', 'Iniciación a la investigación con estudiantes'),
('Vinculación e Investigación', 'Proyectos integrados con la comunidad');

-- 10. Catálogo de Productos (Suck from Core)
INSERT INTO inv_cat_tipo_producto (uuid, nombre, categoria, requiereRegistro) VALUES
(UUID(), 'Artículo Indexado (Scopus/WoS)', 'Académico', 0),
(UUID(), 'Prototipo Industrial', 'Tecnológico', 1),
(UUID(), 'Software Registrado', 'Innovación', 1),
(UUID(), 'Patente de Invención', 'Innovación', 1),
(UUID(), 'Libro / Capítulo de Libro', 'Académico', 0),
(UUID(), 'Informe Técnico de Transferencia', 'Transferencia', 1);

-- 11. Catálogo de Evidencias
INSERT INTO inv_cat_tipo_evidencia (uuid, nombre, descripcion) VALUES
(UUID(), 'Fotografía de Prototipo', 'Evidencia visual de avance tecnológico'),
(UUID(), 'Acta de Entrega-Recepción', 'Documento legal de vinculación externa'),
(UUID(), 'Certificado SENADI', 'Registro de propiedad intelectual'),
(UUID(), 'Lista de Asistencia', 'Evidencia de eventos o validación de campo'),
(UUID(), 'Factura / Comprobante', 'Evidencia de ejecución presupuestaria');

-- 12. Configuración de Indicadores CACES (Modelo 2024-2025)
INSERT INTO inv_config_indicadores (codigoIndicador, nombreIndicador, tipoDato, añoNormativa) VALUES
('I+D-1', 'Proyectos de I+D ejecutados por docentes', 'Cantidad', 2024),
('I+D-2', 'Participación de estudiantes en proyectos', 'Porcentaje', 2024),
('PUB-1', 'Artículos en revistas indexadas', 'Cantidad', 2024),
('INN-1', 'Prototipos y transferencia tecnológica', 'Cantidad', 2024),
('IP-1', 'Registros de Propiedad Intelectual', 'Cantidad', 2024);

-- 2. Agendas Zonales (Planificación Nacional)
INSERT INTO inv_agendas_zonales (nombre, descripcion) VALUES
('Zona 1: Norte', 'Imbabura, Esmeraldas, Carchi, Sucumbíos'),
('Zona 2: Centro Norte', 'Pichincha (excepto Quito), Napo, Orellana'),
('Zona 3: Centro', 'Cotopaxi, Tungurahua, Chimborazo, Pastaza'),
('Zona 4: Pacífico', 'Manabí, Santo Domingo'),
('Zona 5: Litoral', 'Guayas, Santa Elena, Bolívar, Los Ríos'),
('Zona 6: Austro', 'Azuay, Cañar, Morona Santiago'),
('Zona 7: Sur', 'Loja, El Oro, Zamora Chinchipe'),
('Zona 8: Guayaquil', 'Guayaquil, Samborondón, Durán'),
('Zona 9: Distrito Metropolitano de Quito', 'Quito');

-- 3. Líneas de Investigación (Base IST)
INSERT INTO inv_lineas_investigacion (uuid, codigoLinea, nombreLinea, descripcion, activo) VALUES
(UUID(), 'LIN-SOFT', 'Innovación Tecnológica y Desarrollo de Software', 'Desarrollo de aplicaciones, IA y sistemas embebidos.', 1),
(UUID(), 'LIN-ADM', 'Gestión Administrativa y Productividad', 'Optimización de procesos y modelos de negocio.', 1),
(UUID(), 'LIN-RED', 'Redes y Telecomunicaciones', 'Infraestructura, seguridad informática y conectividad.', 1),
(UUID(), 'LIN-ENE', 'Energías Renovables y Eficiencia Energética', 'Sostenibilidad y nuevas matrices energéticas.', 1),
(UUID(), 'LIN-EDU', 'Educación y Tecnologías de la Información', 'E-learning y herramientas digitales.', 1);

-- 4. Rúbricas de Evaluación (Base)
INSERT INTO inv_rubricas (nombre, descripcion, version, activo) VALUES
('Rúbrica Estándar de Proyectos 2026', 'Evaluación basada en pertinencia, metodología y resultados esperados.', '1.0', 1),
('Rúbrica para Proyectos de Vinculación', 'Enfoque en el impacto social y beneficiarios externos.', '1.0', 1);

-- 5. Tipos de Investigación (Estándar Frascati / CACES)
INSERT INTO inv_tipos_investigacion (uuid, nombre, activo) VALUES
(UUID(), 'Investigación Básica', 1),
(UUID(), 'Investigación Aplicada', 1),
(UUID(), 'Desarrollo Tecnológico', 1);

-- 6. ODS (Ejes y Objetivos)
INSERT INTO inv_ods_ejes (nombre) VALUES ('Eje Social'), ('Eje Ambiental'), ('Eje Económico'), ('Eje Institucional');

INSERT INTO inv_ods (idEje, numeroOds, titulo) VALUES
(1, 4, 'Educación de Calidad'),
(2, 7, 'Energía Asequible y No Contaminante'),
(3, 8, 'Trabajo Decente y Crecimiento Económico'),
(3, 9, 'Industria, Innovación e Infraestructura'),
(2, 11, 'Ciudades y Comunidades Sostenibles'),
(2, 13, 'Acción por el Clima');

-- 7. Programas de Investigación (Ejemplos Institucionales)
INSERT INTO inv_programas (uuid, nombre, activo) VALUES
(UUID(), 'Programa de Transformación Digital', 1),
(UUID(), 'Programa de Sostenibilidad Urbana', 1),
(UUID(), 'Programa de Innovación Social', 1);

-- 8. Dominios Académicos
INSERT INTO inv_dominios (uuid, nombre, activo) VALUES
(UUID(), 'Tecnologías de la Información y Comunicación', 1),
(UUID(), 'Energía y Producción Industrial', 1),
(UUID(), 'Gestión Empresarial y Servicios', 1);

-- 9. Objetivos del Plan Nacional de Desarrollo (Ecuador 2024-2025)
INSERT INTO inv_pnd_objetivos (uuid, codigo, nombre, descripcion) VALUES
(UUID(), 'PND-OBJ-1', 'Productividad y Competitividad', 'Incrementar la productividad y competitividad en los sectores agrícola, industrial y de servicios.'),
(UUID(), 'PND-OBJ-2', 'Desarrollo Tecnológico', 'Fomentar la generación de conocimiento, el desarrollo científico y la innovación tecnológica.'),
(UUID(), 'PND-OBJ-3', 'Educación de Calidad', 'Garantizar el acceso, permanencia y calidad de la educación superior tecnológica.'),
(UUID(), 'PND-OBJ-4', 'Gestión Ambiental', 'Promover la gestión integral de los recursos naturales y la adaptación al cambio climático.'),
(UUID(), 'PND-OBJ-5', 'Empleo y Emprendimiento', 'Fomentar la generación de empleo digno y el fortalecimiento del ecosistema emprendedor.');

-- #############################################################################
-- SECCIÓN: DIITRA Document Engine — Plantillas y Auditoría Documental
-- #############################################################################

CREATE TABLE inv_document_templates (
    id                      INT           AUTO_INCREMENT PRIMARY KEY,
    code                    VARCHAR(100)  NOT NULL UNIQUE COMMENT 'Código único (ej: PROTOCOLO_INVESTIGACION)',
    name                    VARCHAR(255)  NOT NULL,
    description             TEXT,
    html_content            LONGTEXT      NOT NULL,
    custom_css              TEXT,
    collaborative_fields_json TEXT          NULL COMMENT 'JSON con los campos que usan CoWork (ej: ["antecedentes", "justificacion"])',
    version                 INT           NOT NULL DEFAULT 1,
    category                INT           NOT NULL COMMENT 'Enum DocumentCategory',
    requires_lopdp          TINYINT(1)    NOT NULL DEFAULT 1,
    supports_blind_mode     TINYINT(1)    NOT NULL DEFAULT 0,
    requires_traceability   TINYINT(1)    NOT NULL DEFAULT 1,
    requires_signature      TINYINT(1)    NOT NULL DEFAULT 0,
    is_active               TINYINT(1)    NOT NULL DEFAULT 1,
    created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by              VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inv_documentos_instancias (
    id                      INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                    VARCHAR(36)   NOT NULL UNIQUE COMMENT 'UUID público de la instancia',
    template_code           VARCHAR(100)  NOT NULL,
    template_version        INT           NOT NULL,
    entity_uuid             VARCHAR(36)   NOT NULL        COMMENT 'UUID de la entidad a la que pertenece (Proyecto, Informe, etc)',
    entity_type             VARCHAR(50)   NOT NULL DEFAULT 'Proyecto' COMMENT 'Tipo de entidad (Proyecto, Informe, etc)',
    titulo_instancia        VARCHAR(255)  NULL            COMMENT 'Título descriptivo para el usuario',
    estado                  INT           NOT NULL DEFAULT 1 COMMENT '1=Borrador, 2=EnRevision, 3=Finalizado, 4=Firmado',
    created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by              VARCHAR(100)  NOT NULL,
    final_pdf_path          VARCHAR(512)  NULL            COMMENT 'Ruta al PDF generado físicamente',
    file_hash               VARCHAR(100)  NULL            COMMENT 'Hash SHA-256 del PDF final',
    traceability_code       VARCHAR(100)  NULL            COMMENT 'Código impreso en el PDF para validación externa',
    data_snapshot_json      LONGTEXT      NULL            COMMENT 'Snapshot forense de los datos inyectados',
    INDEX idx_entity (entity_uuid),
    CONSTRAINT fk_instancia_template FOREIGN KEY (template_code) REFERENCES inv_document_templates(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inv_documentos_firmas (
    idFirma                 INT           AUTO_INCREMENT PRIMARY KEY,
    documento_uuid          VARCHAR(36)   NOT NULL,
    firmante_id             VARCHAR(100)  NOT NULL COMMENT 'ID o Email del firmante (ej. c.c. o correo)',
    firmante_rol            VARCHAR(50)   NOT NULL COMMENT 'Rol del firmante en el documento (ej. Director, Autor)',
    fecha_firma             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    firma_metadata          TEXT          NULL     COMMENT 'Datos extraídos del certificado PAdES .p12 (Issuer, Serial, etc)',
    archivo_pdf_firmado     VARCHAR(512)  NOT NULL COMMENT 'Ruta relativa al documento final firmado por este usuario',
    es_valida               TINYINT(1)    NOT NULL DEFAULT 1,
    INDEX idx_doc_firma (documento_uuid),
    CONSTRAINT fk_firma_documento FOREIGN KEY (documento_uuid) REFERENCES inv_documentos_instancias(uuid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inv_document_audit (
    id                      INT           AUTO_INCREMENT PRIMARY KEY,
    traceability_code       VARCHAR(100)  NOT NULL UNIQUE,
    template_code           VARCHAR(100)  NOT NULL,
    template_version        INT           NOT NULL,
    project_uuid            VARCHAR(36)   NULL,
    entity_uuid             VARCHAR(36)   NULL COMMENT 'UUID de la entidad origen (Proyecto, Informe, etc)',
    generated_by            VARCHAR(255)  NOT NULL,
    generated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    was_blind_mode          TINYINT(1)    NOT NULL DEFAULT 0,
    file_name               VARCHAR(255)  NOT NULL,
    file_hash               VARCHAR(100)  NULL COMMENT 'Hash SHA-256 para verificación de integridad',
    data_snapshot_json      LONGTEXT      NULL COMMENT 'Snapshot forense de los datos inyectados (Resiliencia CACES 2026)',
    INDEX idx_entity (entity_uuid),
    INDEX idx_trace (traceability_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SECCIÓN: DIITRA CoWork — Persistencia de Colaboración en Tiempo Real
-- Módulo: Motor DIITRA CoWork (Yjs + SignalR)
-- Propósito: Almacena el estado binario Yjs de cada documento colaborativo.
--            Garantiza que:
--              1. Los usuarios que se conectan tarde reciben el documento completo.
--              2. El contenido NO se pierde si el servidor se reinicia.
--              3. El historial de quién editó qué queda registrado.
-- Normativa: LOPDP Art. 26 — Registro de acceso a datos sensibles (PI).
-- =============================================================================

CREATE TABLE inv_cowork_documentos (
    idDocumento       INT           AUTO_INCREMENT PRIMARY KEY,
    uuid              VARCHAR(36)   NOT NULL UNIQUE COMMENT 'UUID público del documento',
    entidadTipo       VARCHAR(50)   NOT NULL DEFAULT 'PROYECTO',
    entidadUuid       VARCHAR(36)   NOT NULL        COMMENT 'UUID de la entidad a la que pertenece este documento',
    campoNombre       VARCHAR(100)  NOT NULL        COMMENT 'Campo específico del formulario: antecedentes, metodologia, etc.',
    yjsState          LONGBLOB      NULL            COMMENT 'Snapshot binario del Yjs Doc (Base64). NULL si nunca fue editado.',
    contentHtml       LONGTEXT      NULL            COMMENT 'Snapshot en HTML para el motor de PDFs',
    contentJson       LONGTEXT      NULL            COMMENT 'Snapshot en JSON para el motor de búsqueda/IA',
    version           INT           NOT NULL DEFAULT 0 COMMENT 'Contador de actualizaciones para detectar conflictos',
    creadoEn          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizadoEn     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_entidad_campo (entidadUuid, campoNombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='DIITRA CoWork — Estado persistente de documentos colaborativos Yjs';

-- Registro de sesiones: quién se conectó a qué documento y cuándo.
-- Cumple con LOPDP: trazabilidad de acceso a documentos con propiedad intelectual.
CREATE TABLE inv_cowork_sesiones (
    idSesion          INT           AUTO_INCREMENT PRIMARY KEY,
    documentoUuid     VARCHAR(100)  NOT NULL        COMMENT 'UUID del documento en inv_cowork_documentos',
    usuarioUuid       VARCHAR(36)   NOT NULL        COMMENT 'UUID del usuario (de inv_usuarios_metadata)',
    nombreUsuario     VARCHAR(255)  NOT NULL        COMMENT 'Nombre completo del colaborador (snapshot para auditoría)',
    rolUsuario        VARCHAR(100)  NOT NULL        COMMENT 'Rol en el momento de la sesión (Investigador, Director, etc.)',
    signalrConId      VARCHAR(255)  NULL            COMMENT 'ID de conexión SignalR (para debug)',
    conectadoEn       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desconectadoEn    TIMESTAMP     NULL            COMMENT 'NULL si la sesión sigue activa',
    INDEX idx_documento (documentoUuid),
    INDEX idx_usuario   (usuarioUuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='DIITRA CoWork — Auditoría LOPDP de acceso a documentos colaborativos';

-- Registro de deltas binarios (Estrategia Append-Only para integridad)
CREATE TABLE inv_cowork_updates (
    idUpdate          INT           AUTO_INCREMENT PRIMARY KEY,
    documentoUuid     VARCHAR(100)  NOT NULL,
    updateData        LONGBLOB      NOT NULL COMMENT 'Delta binario generado por Yjs',
    creadoEn          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_upd (documentoUuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='DIITRA CoWork — Historial de cambios para sincronización en tiempo real';
-- =============================================================================
-- SECCIÓN: DIITRA Workflow Engine — Configuración de Estados
-- =============================================================================

CREATE TABLE inv_config_workflow (
    idWorkflow           INT           AUTO_INCREMENT PRIMARY KEY,
    idTipoProyecto       INT           NULL,
    estadoOrigen         VARCHAR(50)   NOT NULL,
    estadoDestino        VARCHAR(50)   NOT NULL,
    rolRequerido         VARCHAR(100)  NULL,
    requiereObservacion  TINYINT(1)    NOT NULL DEFAULT 1,
    activo               TINYINT(1)    NOT NULL DEFAULT 1,
    CONSTRAINT fk_workflow_tipo FOREIGN KEY (idTipoProyecto) REFERENCES inv_tipos_investigacion(idTipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inv_config_workflow (estadoOrigen, estadoDestino, requiereObservacion) VALUES
('Borrador',      'Enviado',      0),
('Enviado',       'En Revisión',  1),
('En Revisión',   'Aprobado',     1),
('En Revisión',   'Rechazado',    1),
('En Revisión',   'En Corrección', 1),
('En Corrección', 'Enviado',      0);

-- ═══════════════════════════════════════════════════════════════════
-- DIITRA CoWork — Coordinación Team Pulse & Colaboración Premium
-- ═══════════════════════════════════════════════════════════════════

-- Metadatos de Secciones (Estado y Progreso)
CREATE TABLE IF NOT EXISTS inv_documentos_secciones_metadata (
    idMetadata          INT           AUTO_INCREMENT PRIMARY KEY,
    instanceUuid        VARCHAR(100)  NOT NULL COMMENT 'UUID de la instancia del documento',
    sectionName         VARCHAR(100)  NOT NULL COMMENT 'Nombre de la sección (ej: resumen, presupuesto)',
    status              VARCHAR(50)   NOT NULL DEFAULT 'Borrador' COMMENT 'Borrador, Revisión, Aprobado',
    lastUserUuid        VARCHAR(36)   NULL,
    lastUserName        VARCHAR(255)  NULL,
    actualizadoEn       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_instance_section (instanceUuid, sectionName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Gestión de estados por sección para coordinación Team Pulse';

-- Comentarios Colaborativos (Hilos de Discusión)
CREATE TABLE IF NOT EXISTS inv_collaboration_comments (
    idComment           INT           AUTO_INCREMENT PRIMARY KEY,
    instanceUuid        VARCHAR(100)  NOT NULL,
    userUuid            VARCHAR(36)   NOT NULL,
    userName            VARCHAR(255)  NOT NULL,
    content             TEXT          NOT NULL,
    parentId            INT           NULL COMMENT 'Para hilos de conversación',
    creadoEn            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_instance (instanceUuid),
    CONSTRAINT fk_comment_parent FOREIGN KEY (parentId) REFERENCES inv_collaboration_comments(idComment) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hilos de discusión real-time dentro de los documentos';

-- =============================================================================
-- SEMILLAS: Documentos Base DIITRA Builder
-- =============================================================================

INSERT INTO inv_document_templates (code, name, description, html_content, category, collaborative_fields_json) VALUES 
('PROTOCOLO_INVESTIGACION', 'Protocolo de Investigación', 'Template oficial para la presentación de proyectos SENESCYT/CACES.', '<h1>Protocolo</h1>', 1, '["antecedentes", "justificacion", "marcoTeorico", "metodologia", "evaluacion"]'),
('INFORME_FINAL_INVESTIGACION', 'Informe Final de Investigación', 'Template consolidado para el cierre de proyectos CACES 2026.', '<h1>Informe Final</h1>', 1, '["resumen_ejecutivo", "introduccion", "desarrollo_tecnico", "analisis_resultados", "conclusiones_recomendaciones"]');
