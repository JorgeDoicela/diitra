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
    inv_backup_logs,
    inv_lopdp_consentimientos,
    inv_lopdp_derechos_arco,
    inv_lopdp_auditoria_datos,
    inv_notificaciones,
    inv_tokens_acceso,
    inv_usuarios_metadata,
    inv_dispositivos_tokens,
    inv_config_indicadores,
    inv_config_general,
    inv_audit_admin,
    inv_email_templates,
    inv_email_historial,
    inv_magic_links,

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
    inv_proyecto_extensiones,
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
    FOREIGN KEY (idCarrera) REFERENCES carreras(idCarrera)     ON DELETE CASCADE
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
    categoriaConsolidacion VARCHAR(50) DEFAULT 'En Formación' COMMENT 'En Formación, Consolidado',
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

-- Los objetivos del Plan Nacional de Desarrollo se insertan en la sección de datos semilla al final.

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
    rol            VARCHAR(100) COMMENT 'Director de Proyecto, Co-Investigador, Semillerista',
    activo         TINYINT(1)   DEFAULT 1,
    fechaInicio    DATE,
    fechaFin       DATE,
    motivoSalida   VARCHAR(255) NULL,
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

-- Los tipos de convocatoria se insertan en la sección de datos semilla al final.

CREATE TABLE inv_agendas_zonales (
    idAgendaZonal INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Las agendas zonales se insertan en la sección de datos semilla al final.

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

-- Las rúbricas se insertan en la sección de datos semilla al final.

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
    -- ⚙️ ADAPTABILIDAD CACES: VARCHAR en lugar de ENUM.
    -- Agregar nuevos estados solo requiere insertar en inv_config_workflow,
    -- NO requiere alterar esta tabla ni redesplegar el backend.
    estado                VARCHAR(50)   NOT NULL DEFAULT 'Borrador' COMMENT 'Estado del ciclo de vida. Valores válidos definidos en inv_config_workflow.',
    disponibleAdopcion    TINYINT(1)    DEFAULT 0 COMMENT 'Indica si el proyecto inconcluso esta disponible para adopcion por otros profesores',
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
    autoExtendDeadlines  TINYINT(1)    DEFAULT 0,
    autoExtendDays       INT           DEFAULT 7,


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
    FOREIGN KEY (firmadoPor) REFERENCES usuarios(idUsuario) ON DELETE SET NULL
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
    idUsuario       INT(11) NULL,
    estadoAnterior  VARCHAR(50) NOT NULL,
    estadoNuevo     VARCHAR(50) NOT NULL,
    observacion     TEXT,
    fechaTransicion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Seguridad del Núcleo: Cadena de Confianza (Blockchain-like Audit)
    hashAnterior    VARCHAR(100) NULL COMMENT 'Hash de la transición previa',
    hashActual      VARCHAR(100) NULL COMMENT 'Hash SHA-256 de esta transición (Integridad)',
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auditoría Administrativa Forense (CACES/SENESCYT)
CREATE TABLE inv_audit_admin (
    idAudit            INT AUTO_INCREMENT PRIMARY KEY,
    idUsuarioAdmin     INT NULL,
    idUsuarioAfectado  INT NULL,
    accion             VARCHAR(100) NOT NULL,
    modulo             VARCHAR(100),
    detalle            TEXT,
    ipOrigen           VARCHAR(45),
    userAgent          TEXT,
    valoresAnteriores  TEXT, -- Snapshot JSON del estado previo
    valoresNuevos      TEXT, -- Snapshot JSON del estado posterior
    fecha              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuarioAdmin) REFERENCES usuarios(idUsuario) ON DELETE SET NULL,
    FOREIGN KEY (idUsuarioAfectado) REFERENCES usuarios(idUsuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_carreras (
    idProyectoCarrera INT          AUTO_INCREMENT PRIMARY KEY,
    idProyecto        INT          NOT NULL,
    idCarrera         INT(11)      NOT NULL,
    modalidad         VARCHAR(100),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idCarrera)  REFERENCES carreras(idCarrera)       ON DELETE CASCADE
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
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyectos_alumnos (
    idProyectoAlumno INT           AUTO_INCREMENT PRIMARY KEY,
    idProyecto       INT           NOT NULL,
    idUsuario        INT(11)       NOT NULL,
    rol              VARCHAR(100),
    nivelAcademico   VARCHAR(150),
    telefono         VARCHAR(20),
    horasSemanales   DECIMAL(4,1),
    activo           TINYINT(1)    DEFAULT 1,
    fecha_inicio     DATETIME      NULL,
    fecha_fin        DATETIME      NULL,
    motivo_cambio    VARCHAR(150)  NULL,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_proyecto_extensiones (
    idExtension      INT           AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)   NOT NULL UNIQUE,
    idProyecto       INT           NOT NULL,
    fechaAnterior    DATE          NOT NULL,
    fechaNueva       DATE          NOT NULL,
    motivo           TEXT          NULL,
    resolucion       TEXT          NULL,
    fechaRegistro    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE
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
    idRevisor         INT(11)       NULL COMMENT 'Referencia al evaluador (interno o externo) en la tabla usuarios',
    fechaAsignacion   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fechaLimite       DATE          NOT NULL,
    fechaCompletado   TIMESTAMP     NULL COMMENT 'Fecha en que el árbitro completó su evaluación. Usado para el KPI de tiempo promedio.',
    dictamenRevisor   ENUM('Pendiente', 'Aprueba', 'Rechaza') DEFAULT 'Pendiente' COMMENT 'Dictamen individual del árbitro, calculado al completar evaluación (>=70=Aprueba).',
    estado            ENUM('Pendiente', 'Completada', 'Rechazada', 'Expirada') DEFAULT 'Pendiente',
    esExterno         TINYINT(1)    DEFAULT 0,
    esDobleCiego      TINYINT(1)    DEFAULT 1 COMMENT 'Si es 1, el núcleo oculta identidades',
    puntajeTotal      DECIMAL(5,2)  NULL,
    observacionesGral TEXT,
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE CASCADE,
    FOREIGN KEY (idRevisor)  REFERENCES usuarios(idUsuario)      ON DELETE SET NULL
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

-- Triggers adicionales para asegurar la generación de UUIDs en todo el esquema
CREATE TRIGGER trg_programas_uuid BEFORE INSERT ON inv_programas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_dominios_uuid BEFORE INSERT ON inv_dominios FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_sublineas_uuid BEFORE INSERT ON inv_sublineas FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_tipos_inv_uuid BEFORE INSERT ON inv_tipos_investigacion FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_grupos_uuid BEFORE INSERT ON inv_grupos_investigacion FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_conv_hitos_uuid BEFORE INSERT ON inv_convocatorias_hitos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_conv_docreq_uuid BEFORE INSERT ON inv_convocatorias_documentos_req FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_pnd_obj_uuid BEFORE INSERT ON inv_pnd_objetivos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_proy_docadj_uuid BEFORE INSERT ON inv_proyectos_documentos_adjuntos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_trazabilidad_uuid BEFORE INSERT ON inv_trazabilidad_proyectos FOR EACH ROW
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
-- Índices básicos del núcleo V3 (Se omiten los índices sobre claves foráneas que InnoDB crea automáticamente)
CREATE INDEX idx_proyectos_estado           ON inv_proyectos(estado);
CREATE INDEX idx_rev_pares_completado       ON inv_revisiones_pares(fechaCompletado);

-- =============================================================================
-- GRUPO K: NOTIFICACIONES, SEGURIDAD Y METADATA
-- =============================================================================

CREATE TABLE inv_notificaciones (
    idNotificacion   INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)     NOT NULL,
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
    UNIQUE KEY uq_notif_uuid (uuid),
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
    uuid            VARCHAR(36)     NOT NULL,
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
    UNIQUE KEY uq_tokens_uuid (uuid),
    FOREIGN KEY (idProyecto) REFERENCES inv_proyectos(idProyecto) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Seguridad para Pares Ciegos (Control de IPs y usos)';

DELIMITER $$
CREATE TRIGGER trg_tokens_uuid
BEFORE INSERT ON inv_tokens_acceso FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
DELIMITER ;

CREATE TABLE inv_usuarios_metadata (
    idMetadata           INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)     NOT NULL,
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
    aceptoTerminosFirma  TINYINT(1)   DEFAULT 0 COMMENT 'Consentimiento explícito para el almacenamiento de la firma (.p12 o imagen)',
    fechaConsentimientoFirma TIMESTAMP NULL,
    p12PasswordEncrypted VARCHAR(512) NULL COMMENT 'Contraseña cifrada para firma en lote si aplica',
    configuracion        JSON         NULL,
    fechaRegistro        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaUltimoAcceso    TIMESTAMP    NULL,
    version              INT          DEFAULT 1,
    UNIQUE KEY uq_usermeta_uuid (uuid),
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Perfil CACES, SENESCYT y configuración de Firma Electrónica';

CREATE TABLE inv_lopdp_consentimientos (
    idConsentimiento     INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)  NOT NULL UNIQUE,
    idUsuario            INT(11)      NOT NULL,
    versionPolitica      VARCHAR(20)  NOT NULL COMMENT 'Versión del documento de política de privacidad aceptado',
    canal                ENUM('Web', 'Movil', 'Presencial') DEFAULT 'Web',
    fechaConsentimiento  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ipDireccion          VARCHAR(45)  NULL,
    userAgent            VARCHAR(255) NULL,
    firmaHash            TEXT         NULL COMMENT 'Hash SHA-256 de los términos aceptados + identificación del usuario',
    estado               ENUM('Otorgado', 'Revocado') DEFAULT 'Otorgado',
    fechaRevocacion      TIMESTAMP    NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[LOPDP] Registro histórico e irrevocable del consentimiento del titular';

CREATE TABLE inv_lopdp_derechos_arco (
    idSolicitudArco      INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)  NOT NULL UNIQUE,
    idUsuario            INT(11)      NOT NULL,
    tipoSolicitud        ENUM('Acceso', 'Rectificacion', 'Eliminacion', 'Oposicion', 'Portabilidad', 'Limitacion') NOT NULL,
    detalleSolicitud     TEXT         NOT NULL COMMENT 'Descripción detallada de la solicitud de datos',
    fechaSolicitud       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fechaLimiteResolucion DATE         NOT NULL COMMENT 'Fecha máxima de resolución legal (15 días)',
    estado               ENUM('Recibido', 'En_Analisis', 'Aprobado', 'Rechazado') DEFAULT 'Recibido',
    resolucionDetalle    TEXT         NULL COMMENT 'Justificación técnica/legal de la respuesta',
    fechaResolucion      TIMESTAMP    NULL,
    documentoResolucionPath VARCHAR(512) NULL COMMENT 'Ruta física de la respuesta formal firmada electrónicamente',
    evidenciaPath           VARCHAR(512) NULL COMMENT 'Ruta física del archivo de evidencia adjunto',
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[LOPDP] Seguimiento de solicitudes de derechos ARCO del titular';

CREATE TABLE inv_lopdp_auditoria_datos (
    idAuditoriaDatos     INT          AUTO_INCREMENT PRIMARY KEY,
    uuid                 VARCHAR(36)  NOT NULL UNIQUE,
    idUsuarioActor       INT(11)      NULL COMMENT 'Usuario que accede al dato (ej. Administrador o Director)',
    idUsuarioAfectado    INT(11)      NOT NULL COMMENT 'El titular de los datos personales expuestos',
    tablaAfectada        VARCHAR(100) NOT NULL,
    columnaAfectada      VARCHAR(100) NULL COMMENT 'Columna sensible (ej: rutaFirmaP12, orcidId, telefono)',
    operacion            ENUM('LECTURA', 'ESCRITURA', 'ELIMINACION', 'DESCARGA') NOT NULL,
    motivo               VARCHAR(255) NULL COMMENT 'Propósito legal o administrativo (ej: Validacion de Carga Horaria CACES)',
    ipDireccion          VARCHAR(45)  NULL,
    userAgent            VARCHAR(255) NULL,
    fechaAcceso          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuarioActor) REFERENCES usuarios(idUsuario) ON DELETE SET NULL,
    FOREIGN KEY (idUsuarioAfectado) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[LOPDP] Registro inalterable de acceso a datos sensibles (Auditoría CACES)';

CREATE TABLE inv_backup_logs (
    idBackup            INT           AUTO_INCREMENT PRIMARY KEY,
    uuid                VARCHAR(36)   NOT NULL UNIQUE,
    fechaBackup         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    tipo                ENUM('Completo', 'BaseDatos', 'Archivos') NOT NULL,
    destino             VARCHAR(255)  NOT NULL COMMENT 'Ej: Local, Google Drive, AWS S3, OneDrive',
    nombreArchivo       VARCHAR(255)  NOT NULL COMMENT 'Nombre del archivo zip/sql de respaldo',
    tamanioBytes        BIGINT        NOT NULL,
    estado              ENUM('Exitoso', 'Fallido', 'En_Proceso') DEFAULT 'En_Proceso',
    hashVerificacion    VARCHAR(64)   NULL COMMENT 'Hash SHA-256 para validación de integridad',
    errorMensaje        TEXT          NULL,
    ejecutadoPor        INT(11)       NULL COMMENT 'Usuario que inició el respaldo (NULL para automático/cron)',
    FOREIGN KEY (ejecutadoPor) REFERENCES usuarios(idUsuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SEGURIDAD] Registro y trazabilidad de copias de seguridad (LOPDP Art. 47 & EGSI)';

DELIMITER $$
CREATE TRIGGER trg_usermeta_uuid
BEFORE INSERT ON inv_usuarios_metadata FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_proy_ext_uuid BEFORE INSERT ON inv_proyecto_extensiones FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_lopdp_consentimientos_uuid BEFORE INSERT ON inv_lopdp_consentimientos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_lopdp_arco_uuid BEFORE INSERT ON inv_lopdp_derechos_arco FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_lopdp_auditoria_uuid BEFORE INSERT ON inv_lopdp_auditoria_datos FOR EACH ROW
BEGIN IF NEW.uuid IS NULL OR NEW.uuid = '' THEN SET NEW.uuid = UUID(); END IF; END$$
CREATE TRIGGER trg_backup_logs_uuid BEFORE INSERT ON inv_backup_logs FOR EACH ROW
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

CREATE TABLE inv_magic_links (
    id_magic_link         INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario            INT(11)      NOT NULL,
    token_hash            VARCHAR(64)  NOT NULL,
    fecha_creacion        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion      DATETIME     NOT NULL,
    utilizado             TINYINT(1)   NOT NULL DEFAULT 0,
    fecha_utilizado       DATETIME     NULL,
    ip_creacion           VARCHAR(45)  NULL,
    ip_utilizacion        VARCHAR(45)  NULL,
    user_agent            VARCHAR(255) NULL,
    codigo_pin_handoff    VARCHAR(12)  NULL,
    fecha_expiracion_pin  DATETIME     NULL,
    proposito             VARCHAR(30)  NOT NULL DEFAULT 'MAGIC_LINK' COMMENT 'MAGIC_LINK | PASSWORD_RECOVERY',
    UNIQUE KEY uk_token_hash (token_hash),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Token pool: magic links de autenticación y recuperación de contraseña';


-- CONFIGURACIÓN GENERAL (Llave-Valor)
CREATE TABLE inv_config_general (
    Clave       VARCHAR(100) NOT NULL PRIMARY KEY,
    Valor       LONGTEXT NOT NULL,
    Descripcion VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='[SISTEMA] Configuración general llave-valor';


-- NÚCLEO PROFESIONAL: CONFIGURACIÓN DE INDICADORES (CACES/SENESCYT)
-- ⚙️ ADAPTABILIDAD CACES: Los umbrales de cada indicador son ahora campos propios.
-- El ReportsController debe leer umbralCumplido/umbralEnProceso desde aquí,
-- evitando valores quemados en C# que fallan cuando el CACES actualiza sus metas.
CREATE TABLE inv_config_indicadores (
    idConfig            INT           AUTO_INCREMENT PRIMARY KEY,
    idInstitucion       INT           DEFAULT 1,
    codigoIndicador     VARCHAR(20)   NOT NULL COMMENT 'Ej: E1.PLAN, E2.PROD, PUB-1',
    nombreIndicador     VARCHAR(255)  NOT NULL,
    descripcion         TEXT,
    tipoDato            ENUM('Cantidad', 'Monto', 'Booleano', 'Porcentaje') DEFAULT 'Cantidad',
    valorReferencia     DECIMAL(12,2) COMMENT 'Meta cuantitativa (ej: 0.5 publicaciones/investigador)',
    -- ⚙️ UMBRALES DINÁMICOS: Permiten cambiar las metas del CACES sin tocar código C#
    umbralCumplido      DECIMAL(12,2) NULL COMMENT 'Porcentaje mínimo para estado CUMPLIDO (ej: 80.00)',
    umbralEnProceso     DECIMAL(12,2) NULL COMMENT 'Porcentaje mínimo para estado EN PROCESO (ej: 50.00)',
    -- ⚙️ FÓRMULA: Identificador de la función de cálculo en el motor de reportes
    formulaCalculo      VARCHAR(50)   NULL COMMENT 'Clave de la fórmula de cálculo: PND_ALIGNMENT, PROD_RATE, INNOVATION_PCT, STUDENT_LINK, BUDGET_EXEC',
    unidadMedida        VARCHAR(50)   NULL COMMENT 'Ej: publicaciones/investigador, % proyectos, $',
    añoNormativa        INT           NOT NULL COMMENT 'Año del modelo de evaluación (ej: 2024)',
    activo              TINYINT(1)    DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CIERRE DE SEGURIDAD PARA EL NÚCLEO V3
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SECCIÓN: CATÁLOGOS INICIALES (SEED DATA)
-- ============================================================

-- Limpieza de catálogos para evitar duplicados en re-ejecución (excluyendo ODS y tipos de investigación para conservar sus semillas completas)
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

TRUNCATE TABLE inv_convocatorias_lineas;
TRUNCATE TABLE inv_convocatorias_hitos;
TRUNCATE TABLE inv_convocatorias_documentos_req;
TRUNCATE TABLE inv_rubrica_criterios;
TRUNCATE TABLE inv_rubricas;
TRUNCATE TABLE inv_agendas_zonales;
TRUNCATE TABLE inv_tipos_convocatoria;
TRUNCATE TABLE inv_lineas_investigacion;
TRUNCATE TABLE inv_programas;
TRUNCATE TABLE inv_dominios;
TRUNCATE TABLE inv_cat_tipo_producto;
TRUNCATE TABLE inv_cat_tipo_evidencia;
TRUNCATE TABLE inv_config_indicadores;
TRUNCATE TABLE inv_config_general;
TRUNCATE TABLE inv_pnd_objetivos;

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

-- Configuración General Semilla
INSERT INTO inv_config_general (Clave, Valor, Descripcion) VALUES
('PeerReview.AutoExtendDeadlines',    'false',              'Indica si se deben extender los plazos de manera automática'),
('PeerReview.AutoExtendDays',         '7',                  'Días de prórroga automática al expirar plazo'),
('Backup.AutoSchedule',               '0 2 * * *',          'Frecuencia en formato CRON para el respaldo automático (Ej: todos los días a las 2:00 AM)'),
('Backup.RetentionDays',              '30',                 'Cantidad de días que se conservarán las copias de seguridad locales'),
('Backup.CloudBackupEnabled',         'false',              'Indica si se deben subir los respaldos a la nube configurada'),
('Backup.DestinationPath',            'C:\\diitra_backups\\', 'Ruta local donde se almacenarán temporal o permanentemente los respaldos'),
-- ⚙️ ADAPTABILIDAD SIGAFI: Cambia el id de subcategoría sin recompilar el backend.
-- Si SIGAFI actualiza su estructura, solo actualizar este valor aquí.
-- WorkflowEngineService y CatalogsController deben leer esta clave en lugar del fallback = 7.
('Sigafi.InvestigacionSubcategoriaId', '7',                 'ID de la subcategoría de INVESTIGACIÓN en la tabla subcategorias_actividades de SIGAFI. Actualizar si SIGAFI reorganiza su catálogo.'),
('Sigafi.InvestigacionSubcategoriaNombre', 'INVESTIGACION', 'Nombre de búsqueda alternativo de la subcategoría de investigación en SIGAFI (usado si el ID cambia)'),
('Caces.TrlMinimoInnovacion',          '5',                 'TRL mínimo para que un proyecto cuente como innovación en los indicadores CACES (E3.INNO). Cambiar si el CACES actualiza el umbral.'),
('Caces.AñoModelo',                    '2024',              'Año del modelo de evaluación CACES vigente. Afecta qué indicadores en inv_config_indicadores se usan en el reporte.');

-- 12. Configuración de Indicadores CACES (Modelo 2024-2025)
-- ⚙️ ADAPTABILIDAD: umbralCumplido y umbralEnProceso son ahora campos de BD.
-- El ReportsController debe leer estos valores en lugar de los hardcodeados en C#.
-- Para actualizar metas del CACES: solo hacer UPDATE aquí y reiniciar caché.
INSERT INTO inv_config_indicadores
    (codigoIndicador, nombreIndicador,                            tipoDato,      valorReferencia, umbralCumplido, umbralEnProceso, formulaCalculo,    unidadMedida,                    añoNormativa)
VALUES
-- Indicadores del Reporte de Analíticas (corresponden a los del ReportsController)
('E1.PLAN',  'Alineación con el Plan Nacional de Desarrollo',    'Porcentaje',   80.00,           80.00,          50.00,           'PND_ALIGNMENT',  '% proyectos alineados',         2024),
('E2.PROD',  'Producción Científica del Claustro',               'Porcentaje',   0.50,            100.00,         50.00,           'PROD_RATE',      'publicaciones/investigador',    2024),
('E3.INNO',  'Innovación y Transferencia Tecnológica',           'Porcentaje',   15.00,           15.00,          7.50,            'INNOVATION_PCT', '% proyectos con TRL>=5',        2024),
('E4.STUD',  'Vinculación Formativa (Semilleros)',               'Porcentaje',   30.00,           30.00,          15.00,           'STUDENT_LINK',   '% proyectos con estudiantes',   2024),
('E5.BUDG',  'Ejecución Presupuestaria',                         'Porcentaje',   75.00,           75.00,          40.00,           'BUDGET_EXEC',    '% presupuesto ejecutado',       2024),
-- Indicadores operativos de catálogo
('I+D-1',   'Proyectos de I+D ejecutados por docentes',          'Cantidad',      NULL,            NULL,           NULL,            NULL,             'proyectos',                     2024),
('I+D-2',   'Participación de estudiantes en proyectos',         'Porcentaje',    NULL,            NULL,           NULL,            NULL,             '% proyectos',                   2024),
('PUB-1',   'Artículos en revistas indexadas',                   'Cantidad',      NULL,            NULL,           NULL,            NULL,             'artículos',                     2024),
('INN-1',   'Prototipos y transferencia tecnológica',            'Cantidad',      NULL,            NULL,           NULL,            NULL,             'prototipos',                    2024),
('IP-1',    'Registros de Propiedad Intelectual',                'Cantidad',      NULL,            NULL,           NULL,            NULL,             'registros SENADI',              2024);

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
INSERT INTO inv_lineas_investigacion (idLinea, uuid, codigoLinea, nombreLinea, descripcion, activo) VALUES
(1, UUID(), 'LIN-SOFT', 'Innovación Tecnológica y Desarrollo de Software', 'Desarrollo de aplicaciones, IA y sistemas embebidos.', 1),
(2, UUID(), 'LIN-ADM', 'Gestión Administrativa, Comercial y Productividad', 'Optimización de procesos administrativos, financieros y de talento humano.', 1),
(3, UUID(), 'LIN-RED', 'Redes, Ciberseguridad y Telecomunicaciones', 'Infraestructura, seguridad de la información y conectividad.', 1),
(4, UUID(), 'LIN-ENE', 'Electrónica, Energías Renovables y Eficiencia Energética', 'Sostenibilidad, matrices energéticas alternativas y automatización de procesos.', 1),
(5, UUID(), 'LIN-EDU', 'Tecnologías de la Información y Comunicación Aplicadas a la Educación', 'Plataformas de e-learning, recursos didácticos interactivos y tecnologías emergentes.', 1),
(6, UUID(), 'LIN-GAS', 'Gastronomía, Patrimonio Alimentario e Innovación Culinaria', 'Investigación bromatológica, técnicas culinarias ancestrales y rescate de la soberanía alimentaria.', 1),
(7, UUID(), 'LIN-MKT', 'Marketing Digital, Comercio Electrónico y Desarrollo Empresarial para MIPYMES', 'Estrategias de posicionamiento digital y reactivación comercial de emprendimientos.', 1);

-- 4. Rúbricas de Evaluación (Base)
INSERT INTO inv_rubricas (idRubrica, nombre, descripcion, version, activo) VALUES
(1, 'Rúbrica Estándar de Proyectos 2026', 'Evaluación basada en pertinencia, metodología y resultados esperados.', '1.0', 1),
(2, 'Rúbrica para Proyectos de Vinculación', 'Enfoque en el impacto social y beneficiarios externos.', '1.0', 1);

-- 4.1 Criterios de Rúbricas
INSERT INTO inv_rubrica_criterios (idRubrica, nombre, descripcion, pesoPorcentaje, orden) VALUES
(1, 'Pertinencia Científica y Social', 'Vinculación con las líneas del IST Traversari y necesidades de desarrollo local en Quito.', 25.00, 1),
(1, 'Metodología y Rigor Científico', 'Claridad metodológica, hipótesis, y coherencia en el diseño de experimentación.', 25.00, 2),
(1, 'Viabilidad y Presupuesto', 'Coherencia de costos y recursos financieros y cronograma Gantt factible.', 25.00, 3),
(1, 'Impacto Social y Tecnológico', 'Potencial de transferencia tecnológica, fomento de semilleros y aportes a indicadores CACES.', 25.00, 4),
(2, 'Impacto Comunitario y Social', 'Beneficio directo a la población vulnerable del Distrito Metropolitano de Quito.', 30.00, 1),
(2, 'Metodología de Intervención', 'Diseño de la participación estudiantil y talleres de vinculación con la comunidad.', 25.00, 2),
(2, 'Sustentabilidad y Alianzas', 'Permanencia de la transferencia tecnológica y convenios firmados con aliados externos.', 25.00, 3),
(2, 'Presupuesto y Eficiencia de Recursos', 'Distribución idónea del presupuesto operativo para impacto social.', 20.00, 4);

-- 5. Tipos de Investigación (Se conservan los definidos al inicio del script para alineación con el Frontend: Básica, Aplicada, Desarrollo Experimental)
-- 6. ODS (Se conservan los 17 ODS de la ONU y sus 5 ejes definidos al inicio del script)

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    uuid              VARCHAR(100)  NOT NULL UNIQUE COMMENT 'UUID público del documento (puede incluir sufijo de sección: {uuid}_{CAMPO})',
    entidadTipo       VARCHAR(50)   NOT NULL DEFAULT 'PROYECTO',
    entidadUuid       VARCHAR(100)  NOT NULL        COMMENT 'UUID de la entidad a la que pertenece este documento',
    campoNombre       VARCHAR(100)  NOT NULL        COMMENT 'Campo específico del formulario: antecedentes, metodologia, etc.',
    yjsState          LONGBLOB      NULL            COMMENT 'Snapshot binario del Yjs Doc (Base64). NULL si nunca fue editado.',
    contentHtml       LONGTEXT      NULL            COMMENT 'Snapshot en HTML para el motor de PDFs',
    contentJson       LONGTEXT      NULL            COMMENT 'Snapshot en JSON para el motor de búsqueda/IA',
    version           INT           NOT NULL DEFAULT 0 COMMENT 'Contador de actualizaciones para detectar conflictos',
    creadoEn          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizadoEn     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_entidad_campo (entidadUuid, campoNombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DIITRA CoWork — Estado persistente de documentos colaborativos Yjs';

-- Registro de sesiones: quién se conectó a qué documento y cuándo.
-- Cumple con LOPDP: trazabilidad de acceso a documentos con propiedad intelectual.
CREATE TABLE inv_cowork_sesiones (
    idSesion          INT           AUTO_INCREMENT PRIMARY KEY,
    documentoUuid     VARCHAR(100)  NOT NULL        COMMENT 'UUID del documento en inv_cowork_documentos',
    usuarioUuid       VARCHAR(36)   NOT NULL        COMMENT 'UUID del usuario (de inv_usuarios_metadata)',
    nombreUsuario     VARCHAR(255)  NOT NULL        COMMENT 'Nombre completo del colaborador (snapshot para auditoría)',
    rolUsuario        VARCHAR(100)  NOT NULL        COMMENT 'Rol en el momento de la sesión (Investigador, Director, etc.)',
    signalrConId      VARCHAR(255)  NULL            COMMENT 'ID de conexión SignalR (para debug)',
    seccionNombre     VARCHAR(100)  NULL            COMMENT 'Nombre de la sección visitada (NULL para sesión base)',
    accion            VARCHAR(255)  NULL            COMMENT 'Acción realizada (NULL para sesión base)',
    conectadoEn       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desconectadoEn    TIMESTAMP     NULL            COMMENT 'NULL si la sesión sigue activa',
    INDEX idx_documento (documentoUuid),
    INDEX idx_usuario   (usuarioUuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DIITRA CoWork — Auditoría LOPDP de acceso a documentos colaborativos';

-- Registro de deltas binarios (Estrategia Append-Only para integridad)
CREATE TABLE inv_cowork_updates (
    idUpdate          INT           AUTO_INCREMENT PRIMARY KEY,
    documentoUuid     VARCHAR(100)  NOT NULL,
    updateData        LONGBLOB      NOT NULL COMMENT 'Delta binario generado por Yjs',
    creadoEn          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_upd (documentoUuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DIITRA CoWork — Historial de cambios para sincronización en tiempo real';
-- =============================================================================
-- SECCIÓN: DIITRA Workflow Engine — Configuración de Estados
-- =============================================================================

-- =============================================================================
-- ⚙️ MOTOR DE FLUJOS ADAPTABLE AL CACES
-- Esta tabla es la ÚNICA fuente de verdad para el comportamiento de cada estado.
-- Para agregar un nuevo estado normativo (ej: 'Pre-aprobado'), solo insertar aquí.
-- Para cambiar qué estados cuentan para carga horaria o informes, solo hacer
-- UPDATE aquí — sin redesplegar el backend.
-- =============================================================================
CREATE TABLE inv_config_workflow (
    idWorkflow              INT           AUTO_INCREMENT PRIMARY KEY,
    idTipoProyecto          INT           NULL         COMMENT 'NULL = aplica a todos los tipos de proyecto',
    estadoOrigen            VARCHAR(50)   NOT NULL     COMMENT 'Estado desde el que se puede ejecutar la transición',
    estadoDestino           VARCHAR(50)   NOT NULL     COMMENT 'Estado al que se pasa tras la transición',
    rolRequerido            VARCHAR(100)  NULL         COMMENT 'Rol que puede ejecutar esta transición (NULL = cualquier rol con acceso al proyecto)',
    requiereObservacion     TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '1 si el usuario debe escribir una justificación',
    activo                  TINYINT(1)    NOT NULL DEFAULT 1,

    -- ⚙️ ATRIBUTOS DE NEGOCIO DEL ESTADO DESTINO
    -- Estas columnas centralizan la lógica que antes estaba quemada en 7+ archivos C#.
    -- El WorkflowEngineService debe consultarlas en lugar de usar arrays hardcodeados.
    contabilizaCargaHoraria TINYINT(1)    NOT NULL DEFAULT 0
        COMMENT '1 si los proyectos en estadoDestino consumen horas del distributivo docente SIGAFI',
    permiteInformesAvance   TINYINT(1)    NOT NULL DEFAULT 0
        COMMENT '1 si se pueden crear Informes de Avance cuando el proyecto está en estadoDestino',
    permiteRegistroEgresos  TINYINT(1)    NOT NULL DEFAULT 0
        COMMENT '1 si se pueden registrar gastos/egresos cuando el proyecto está en estadoDestino',
    permiteGastosCapital    TINYINT(1)    NOT NULL DEFAULT 0
        COMMENT '1 si se permiten gastos de capital (bienes) en estadoDestino',
    esEstadoFinal           TINYINT(1)    NOT NULL DEFAULT 0
        COMMENT '1 si estadoDestino es un estado terminal (sin más transiciones salvo excepción)',

    -- ⚙️ APARIENCIA EN LA INTERFAZ
    -- Evita que el frontend tenga colores de estado quemados en TypeScript.
    etiquetaUi              VARCHAR(80)   NULL         COMMENT 'Etiqueta legible para el usuario final en la UI',
    colorHex                VARCHAR(7)    NULL         COMMENT 'Color hexadecimal para badges y filtros de la UI (ej: #3B82F6)',

    UNIQUE KEY uk_origen_destino_tipo (estadoOrigen, estadoDestino, idTipoProyecto),
    CONSTRAINT fk_workflow_tipo FOREIGN KEY (idTipoProyecto) REFERENCES inv_tipos_investigacion(idTipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    COMMENT 'Motor de Flujos CACES — Única fuente de verdad para estados y sus atributos de negocio';

-- =============================================================================
-- SEED: Ciclo de vida completo del proyecto CACES
-- contabilizaCargaHoraria: 1 para estados activos (bloquea horas en SIGAFI)
-- permiteInformesAvance:   1 solo en 'En Ejecución'
-- permiteRegistroEgresos:  1 solo en 'En Ejecución'
-- esEstadoFinal:           1 para Finalizado, Rechazado, Anulado, Inconcluso
-- =============================================================================
--                                                                          contabiliza  permiteInf  permiteEgr  permCap  esFinal   etiqueta              color
INSERT INTO inv_config_workflow
    (estadoOrigen,    estadoDestino,    rolRequerido,   requiereObservacion, contabilizaCargaHoraria, permiteInformesAvance, permiteRegistroEgresos, permiteGastosCapital, esEstadoFinal, etiquetaUi,      colorHex, activo)
VALUES
-- Flujo principal de postulación
('Borrador',         'Enviado',         NULL,             0,                   0,                       0,                     0,                      0,                    0,             'Enviado',        '#3B82F6', 1),
('Enviado',          'En Revisión',     'DIITRA_ADMIN',   0,                   1,                       0,                     0,                      0,                    0,             'En Revisión',    '#F59E0B', 1),
('En Revisión',      'Aprobado',        'DIITRA_ADMIN',   1,                   1,                       0,                     0,                      0,                    0,             'Aprobado',       '#10B981', 1),
('En Revisión',      'Rechazado',       'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Rechazado',      '#EF4444', 1),
('En Revisión',      'En Corrección',   'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    0,             'En Corrección',  '#F97316', 1),
('En Corrección',    'Enviado',         NULL,             0,                   0,                       0,                     0,                      0,                    0,             'Enviado',        '#3B82F6', 1),
-- Paso a ejecución (transición post-arbitraje)
('Aprobado',         'En Ejecución',    'DIITRA_ADMIN',   0,                   1,                       1,                     1,                      1,                    0,             'En Ejecución',   '#8B5CF6', 1),
-- Cierre del proyecto
('En Ejecución',     'Finalizado',      'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Finalizado',     '#059669', 1),
('En Ejecución',     'Inconcluso',      'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Inconcluso',     '#6B7280', 1),
-- Anulación desde cualquier estado pre-ejecución
('Borrador',         'Anulado',         'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Anulado',        '#94A3B8', 1),
('Enviado',          'Anulado',         'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Anulado',        '#94A3B8', 1),
('En Revisión',      'Anulado',         'DIITRA_ADMIN',   1,                   0,                       0,                     0,                      0,                    1,             'Anulado',        '#94A3B8', 1);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Gestión de estados por sección para coordinación Team Pulse';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Hilos de discusión real-time dentro de los documentos';

-- =============================================================================
-- SEMILLAS: Documentos Base DIITRA Builder
-- =============================================================================

-- =============================================================================

INSERT INTO inv_document_templates
    (code, name, description, html_content, category, collaborative_fields_json, requires_signature, supports_blind_mode, requires_traceability, requires_lopdp)
VALUES
    (
        'PROTOCOLO_INVESTIGACION',
        'Protocolo de Investigación',
        'Template oficial para la presentación de proyectos SENESCYT/CACES.',
        '<div class="protocolo-container" style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">Instituto Superior Tecnológico Traversari</h1>
                <p style="font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold; color: #555;">Departamento de Investigación e Innovación — DIITRA</p>
            </div>
            <h2 style="text-align: center; font-size: 16px; margin-bottom: 25px; font-weight: bold;">PROTOCOLO DE PROYECTO DE INVESTIGACIÓN</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%;">Título del Proyecto:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[proyecto_titulo]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Código Institucional:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[codigo_institucional]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Línea de Investigación:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[linea_investigacion]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Director de Proyecto:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[director_nombre]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Presupuesto Asignado:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">$[[presupuesto_total]]</td>
                </tr>
            </table>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">1. Antecedentes</h3>
                <p style="text-align: justify;">[[antecedentes]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">2. Justificación</h3>
                <p style="text-align: justify;">[[justificacion]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">3. Marco Teórico</h3>
                <p style="text-align: justify;">[[marcoTeorico]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">4. Metodología</h3>
                <p style="text-align: justify;">[[metodologia]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">5. Evaluación y Resultados Esperados</h3>
                <p style="text-align: justify;">[[evaluacion]]</p>
            </div>
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_proyecto]]</div>
                            <p style="margin: 0; font-weight: bold;">Director de Proyecto</p>
                            <p style="margin: 0; font-size: 12px; color: #555;">Docente Investigador</p>
                        </td>
                        <td style="width: 50%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_investigacion]]</div>
                            <p style="margin: 0; font-weight: bold;">Director de Investigación</p>
                            <p style="margin: 0; font-size: 12px; color: #555;">DIITRA — IST Traversari</p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>',
        1, -- category
        '["antecedentes", "justificacion", "marcoTeorico", "metodologia", "evaluacion"]',
        1, -- requires_signature
        0, -- supports_blind_mode
        1, -- requires_traceability
        1  -- requires_lopdp
    ),
    (
        'INFORME_FINAL_INVESTIGACION',
        'Informe Final de Investigación',
        'Template consolidado para el cierre de proyectos CACES 2026.',
        '<div class="informe-final-container" style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">Instituto Superior Tecnológico Traversari</h1>
                <p style="font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold; color: #555;">Departamento de Investigación e Innovación — DIITRA</p>
            </div>
            <h2 style="text-align: center; font-size: 16px; margin-bottom: 25px; font-weight: bold; text-transform: uppercase;">Informe Final de Cierre de Proyecto</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%;">Título del Proyecto:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[proyecto_titulo]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Código Institucional:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[codigo_institucional]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Línea/Sublínea:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[linea_investigacion]] / [[sublinea_nombre]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Director de Proyecto:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[director_nombre]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Repositorio DSpace Handle:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[dspace_handle]]</td>
                </tr>
            </table>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Resumen Ejecutivo</h3>
                <p style="text-align: justify;">[[resumen_ejecutivo]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Introducción</h3>
                <p style="text-align: justify;">[[introduccion]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Desarrollo Técnico y Metodología Aplicada</h3>
                <p style="text-align: justify;">[[desarrollo_tecnico]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Análisis de Resultados y Productos Científicos</h3>
                <p style="text-align: justify;">[[analisis_resultados]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Conclusiones y Recomendaciones</h3>
                <p style="text-align: justify;">[[conclusiones_recomendaciones]]</p>
            </div>
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 33%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_proyecto]]</div>
                            <p style="margin: 0; font-weight: bold;">Director de Proyecto</p>
                            <p style="margin: 0; font-size: 11px; color: #555;">Docente Investigador</p>
                        </td>
                        <td style="width: 33%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_investigacion]]</div>
                            <p style="margin: 0; font-weight: bold;">Director de Investigación</p>
                            <p style="margin: 0; font-size: 11px; color: #555;">DIITRA — IST Traversari</p>
                        </td>
                        <td style="width: 33%; text-align: center;">
                            <div style="height: 60px;">[[firma_rector]]</div>
                            <p style="margin: 0; font-weight: bold;">Rector / Vicerrector</p>
                            <p style="margin: 0; font-size: 11px; color: #555;">IST Traversari</p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>',
        1, -- category
        '["resumen_ejecutivo", "introduccion", "desarrollo_tecnico", "analisis_resultados", "conclusiones_recomendaciones"]',
        1, -- requires_signature
        0, -- supports_blind_mode
        1, -- requires_traceability
        1  -- requires_lopdp
    ),
    (
        'INFORME_AVANCE',
        'Informe de Avance de Investigación',
        'Template mensual/trimestral para reportar el avance físico e hitos del proyecto.',
        '<div class="informe-avance-container" style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">Instituto Superior Tecnológico Traversari</h1>
                <p style="font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold; color: #555;">Departamento de Investigación e Innovación — DIITRA</p>
            </div>
            <h2 style="text-align: center; font-size: 16px; margin-bottom: 25px; font-weight: bold;">INFORME DE AVANCE DE PROYECTO</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 30%;">Proyecto:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[proyecto_titulo]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Código Institucional:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[codigo_institucional]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Informe N°:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[numero_informe]]</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Fecha de Emisión:</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">[[fecha_reporte]]</td>
                </tr>
            </table>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Resumen de Actividades Ejecutadas</h3>
                <p style="text-align: justify;">[[resumenActividades]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Presupuesto Ejecutado en el Periodo</h3>
                <p style="text-align: justify;">[[gastos_periodo]]</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold;">Evidencias Adjuntas</h3>
                <p style="text-align: justify;">[[evidencias_checklist]]</p>
            </div>
            <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_proyecto]]</div>
                            <p style="margin: 0; font-weight: bold;">Director de Proyecto</p>
                            <p style="margin: 0; font-size: 12px; color: #555;">Docente Investigador</p>
                        </td>
                        <td style="width: 50%; text-align: center;">
                            <div style="height: 60px;">[[firma_director_investigacion]]</div>
                            <p style="margin: 0; font-weight: bold;">Aprobado por Dirección de Investigación</p>
                            <p style="margin: 0; font-size: 12px; color: #555;">DIITRA — IST Traversari</p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>',
        1, -- category
        '["resumenActividades"]',
        1, -- requires_signature
        0, -- supports_blind_mode
        1, -- requires_traceability
        1  -- requires_lopdp
    ),
    (
        'DICTAMEN_ARBITRAJE',
        'Acta de Dictamen de Arbitraje',
        'Documento oficial CACES del resultado de la evaluación por pares doble ciego. Requiere firma digital del Director de Investigación.',
        '<div class="dictamen-header" style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">Instituto Superior Tecnológico Traversari</h1>
                <p style="font-size: 14px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold; color: #555;">Departamento de Investigación e Innovación — DIITRA</p>
                <p class="codigo-trazabilidad" style="font-size: 11px; color: #777; margin-top: 5px;">Código: [[traceability_code]]</p>
            </div>
            <h2 style="text-align: center; font-size: 16px; margin-bottom: 25px; font-weight: bold;">ACTA DE DICTAMEN DE ARBITRAJE</h2>
            <section class="datos-proyecto" style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold; margin-bottom: 10px;">1. Datos del Proyecto</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; width: 30%;">Código Institucional:</td><td style="border: 1px solid #ddd; padding: 6px;">[[codigo_institucional]]</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Título:</td><td style="border: 1px solid #ddd; padding: 6px;">[[proyecto_titulo]]</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Convocatoria:</td><td style="border: 1px solid #ddd; padding: 6px;">[[convocatoria_titulo]]</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Línea de Investigación:</td><td style="border: 1px solid #ddd; padding: 6px;">[[linea_investigacion]]</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Fecha de Postulación:</td><td style="border: 1px solid #ddd; padding: 6px;">[[fecha_postulacion]]</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Fecha de Cierre del Arbitraje:</td><td style="border: 1px solid #ddd; padding: 6px;">[[fecha_cierre]]</td></tr>
                </table>
            </section>
            <section class="panel-arbitros" style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold; margin-bottom: 10px;">2. Panel de Árbitros Evaluadores</h3>
                <p style="font-size: 12px; font-style: italic; color: #666; margin-bottom: 10px;">La identidad de los árbitros se mantiene bajo estricta reserva de conformidad con el proceso de doble ciego (Reglamento de Régimen Académico, Art. 75).</p>
                [[tabla_arbitros]]
            </section>
            <section class="resolucion" style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: bold; margin-bottom: 10px;">3. Resolución Final</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; width: 40%;">Puntaje Promedio Ponderado:</td><td style="border: 1px solid #ddd; padding: 6px;">[[puntaje_promedio]]/100</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Puntaje Mínimo de Aprobación:</td><td style="border: 1px solid #ddd; padding: 6px;">[[puntaje_minimo]]/100</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">Dictamen:</td><td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: [[dictamen_color]];">[[dictamen_resultado]]</td></tr>
                </table>
                <div class="observaciones" style="background: #fafafa; border: 1px solid #ddd; padding: 12px; border-radius: 4px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">Observaciones Generales del Panel:</h4>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; text-align: justify;">[[observaciones_generales]]</p>
                </div>
            </section>
            <section class="firma-digital" style="margin-top: 35px; border-top: 1px solid #ddd; padding-top: 20px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: top;">
                            <div class="firma-imagen" style="height: 60px; margin-bottom: 5px;">[[firma_imagen]]</div>
                            <p style="margin: 0; font-weight: bold; font-size: 13px;">Director/a de Investigación e Innovación</p>
                            <p style="margin: 0; font-size: 12px; color: #555;">[[director_nombre]]</p>
                            <p style="margin: 0; font-size: 11px; color: #777;">DIITRA — IST Traversari</p>
                            <p style="margin: 0; font-size: 11px; color: #777;">Fecha de Firma: [[fecha_firma]]</p>
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: top;">
                            <div class="qr-container" style="display: inline-block; padding: 5px; border: 1px solid #ddd; margin-bottom: 5px;">
                                [[qr_code]]
                            </div>
                            <p style="margin: 0; font-weight: bold; font-size: 11px;">Verificación de Integridad</p>
                            <p class="qr-url" style="margin: 0; font-size: 9px; color: #0066cc;">[[verification_url]]</p>
                        </td>
                    </tr>
                </table>
            </section>
        </div>',
        2,    -- category: 2 = Arbitraje
        NULL, -- collaborative_fields_json: NULL (no CoWork)
        1,    -- requires_signature = TRUE
        1,    -- supports_blind_mode = TRUE
        1,    -- requires_traceability = TRUE
        0     -- requires_lopdp = FALSE (no datos personales sensibles en el acta)
    );

-- =============================================================================
-- SECCIÓN: MOTOR DE CORREOS PERSONALIZADO (DIITRA)
-- =============================================================================

CREATE TABLE inv_email_templates (
    idEmailTemplate INT           AUTO_INCREMENT PRIMARY KEY,
    uuid            VARCHAR(36)   NOT NULL UNIQUE,
    codigo          VARCHAR(100)  NOT NULL UNIQUE COMMENT 'Código único del template',
    nombre          VARCHAR(255)  NOT NULL,
    descripcion     TEXT          NULL,
    asunto          VARCHAR(255)  NOT NULL,
    cuerpoHtml      LONGTEXT      NOT NULL,
    activo          TINYINT(1)    NOT NULL DEFAULT 1,
    fechaCreado     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaActualizado TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_email_historial (
    idEmailHistorial INT          AUTO_INCREMENT PRIMARY KEY,
    uuid             VARCHAR(36)  NOT NULL UNIQUE,
    destinatario     VARCHAR(255) NOT NULL COMMENT 'Correo electrónico destino',
    idUsuarioDestinatario INT(11) NULL COMMENT 'Vínculo al usuario en la tabla usuarios si aplica',
    asunto           VARCHAR(255) NOT NULL,
    cuerpo           LONGTEXT     NOT NULL,
    estado           ENUM('Pendiente', 'Enviado', 'Fallido') NOT NULL DEFAULT 'Pendiente',
    errorMensaje     TEXT         NULL,
    fechaEnvio       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adjuntosJson     JSON         NULL COMMENT 'JSON array con metadatos de archivos adjuntos',
    metadataJson     JSON         NULL COMMENT 'JSON con metadatos del sistema (proyecto_uuid, etc)',
    FOREIGN KEY (idUsuarioDestinatario) REFERENCES usuarios(idUsuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- SEMILLAS: MOTOR DE CORREOS PERSONALIZADO (DIITRA)
-- =============================================================================

-- Plantilla 1: Proyecto Inconcluso Disponible para Adopción
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'PROYECTO_INCONCLUSO_DISPONIBLE',
    'Proyecto Inconcluso Disponible para Adopción',
    'Notificación a docentes sobre proyectos que quedaron inconclusos y están disponibles para adopción.',
    'DIITRA: Oportunidad de Adopción de Proyecto - [[proyecto_titulo]]',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a Docente Investigador/a,</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            El Administrador del sistema DIITRA ha marcado un proyecto de investigación institucional como <strong>Inconcluso y Disponible para Adopción</strong>. Esta es una excelente oportunidad para asumir la dirección y continuar con su desarrollo bajo el marco normativo de la SENESCYT y el CACES.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111111; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Proyecto</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600; width: 120px;">Código:</td><td style="padding: 8px 0;">[[proyecto_codigo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Título:</td><td style="padding: 8px 0;">[[proyecto_titulo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Línea:</td><td style="padding: 8px 0;">[[linea_investigacion]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Descripción:</td><td style="padding: 8px 0; line-height: 1.5;">[[proyecto_descripcion]]</td></tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="[[sistema_url]]/investigacion/adopcion" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Ver Proyecto y Postular Adopción</a>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Si tiene alguna duda sobre la carga horaria requerida o los entregables comprometidos ante el CACES, por favor póngase en contacto con el Director de Investigación.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

-- Plantilla 2: Nueva Convocatoria Abierta
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'NUEVA_CONVOCATORIA',
    'Apertura de Nueva Convocatoria de Proyectos',
    'Notificación a docentes sobre el lanzamiento de una nueva convocatoria oficial para postulación de proyectos.',
    'DIITRA: Apertura de Convocatoria Oficial - [[convocatoria_titulo]]',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a Docente Investigador/a,</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Nos complace informar que el Departamento de Investigación e Innovación ha abierto oficialmente la convocatoria <strong>[[convocatoria_titulo]]</strong> para el periodo académico vigente. Le invitamos a postular sus propuestas de investigación aplicada e innovación tecnológica.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111111; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Información de la Convocatoria</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600; width: 150px;">Código:</td><td style="padding: 8px 0;">[[convocatoria_codigo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Título:</td><td style="padding: 8px 0;">[[convocatoria_titulo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Fecha de Apertura:</td><td style="padding: 8px 0;">[[convocatoria_apertura]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Fecha de Cierre:</td><td style="padding: 8px 0; color: #d9534f; font-weight: 700;">[[convocatoria_cierre]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600;">Monto Máx. Proyecto:</td><td style="padding: 8px 0;">[[convocatoria_monto_maximo]]</td></tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="[[sistema_url]]/investigacion/convocatorias" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Postular Propuesta</a>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Las propuestas y toda la documentación requerida (protocolo, cronograma Gantt y presupuesto estructurado) deben ser cargadas antes de la fecha de cierre.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

-- Plantilla 3: Proyecto Postulado con Éxito
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'PROYECTO_POSTULADO',
    'Confirmación de Postulación de Proyecto',
    'Acuse de recibo enviado al docente director cuando finaliza la postulación digital de su protocolo.',
    'DIITRA: Postulación de Proyecto Recibida - [[proyecto_titulo]]',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a [[proyecto_director]],</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Confirmamos que su propuesta titulada <strong>[[proyecto_titulo]]</strong> ha sido postulada exitosamente en el sistema DIITRA. El proyecto ha sido registrado con el estado <strong>[[proyecto_estado]]</strong> y entra formalmente al flujo de evaluación por pares.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111111; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Resumen del Registro</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600; width: 120px;">Código Temporal:</td><td style="padding: 8px 0;">[[proyecto_codigo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Título:</td><td style="padding: 8px 0;">[[proyecto_titulo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Línea:</td><td style="padding: 8px 0;">[[linea_investigacion]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600;">Director:</td><td style="padding: 8px 0;">[[proyecto_director]]</td></tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="[[proyecto_workspace_url]]" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Ver Workspace del Proyecto</a>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Adjunto a este correo encontrará la Ficha del Protocolo de Investigación generada de forma automatizada por el sistema para sus archivos. Se le notificará tan pronto como el panel de revisores emita los dictámenes correspondientes.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

-- Plantilla 4: Asignación de Arbitraje (Revisor Par Ciego)
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'ASIGNACION_REVISOR',
    'Asignación de Evaluación por Pares',
    'Invitación al revisor (interno o externo) para evaluar una propuesta de investigación de manera anónima (doble ciego).',
    'DIITRA: Solicitud de Evaluación por Pares Doble Ciego',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a Revisor/a [[revisor_nombre]],</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            De conformidad con el Reglamento de Régimen Académico y los procesos de aseguramiento de calidad institucional, el Departamento de Investigación le ha designado como **Evaluador/a Par** del proyecto de investigación adjunto.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111111; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Arbitraje</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600; width: 140px;">Título del Proyecto:</td><td style="padding: 8px 0;">[[proyecto_titulo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Fecha de Asignación:</td><td style="padding: 8px 0;">[[fecha_postulacion]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Fecha Límite:</td><td style="padding: 8px 0; color: #d9534f; font-weight: 700;">[[peer_review_fecha_limite]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600;">Modalidad:</td><td style="padding: 8px 0;">[[peer_review_anonimo]]</td></tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="[[sistema_url]]/evaluacion/revisar/[[revisor_email]]" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Llenar Rúbrica de Evaluación</a>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Para garantizar la objetividad del arbitraje, se solicita mantener la reserva y anonimato respecto a los autores. El protocolo anonimizado está adjunto en este mensaje.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

-- Plantilla 5: Dictamen de Evaluación Final Disponible
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'DICTAMEN_DISPONIBLE',
    'Dictamen Final de Evaluación de Proyecto',
    'Notificación formal enviada al docente director cuando se consolida la evaluación por pares y el director emite la aprobación.',
    'DIITRA: Dictamen de Evaluación Oficial - [[proyecto_titulo]]',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a [[proyecto_director]],</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            El proceso de evaluación por pares ciegos para su proyecto **[[proyecto_titulo]]** ha concluido oficialmente. Nos complace comunicarle el dictamen final emitido por la comisión académica.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111111; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Dictamen de Arbitraje</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600; width: 140px;">Título del Proyecto:</td><td style="padding: 8px 0;">[[proyecto_titulo]]</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Calificación Final:</td><td style="padding: 8px 0; font-weight: 700;">[[peer_review_puntaje]]/100</td></tr>
                <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 8px 0; font-weight: 600;">Resultado:</td><td style="padding: 8px 0; text-transform: uppercase; font-weight: 700; color: #5cb85c;">[[peer_review_dictamen]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Observaciones:</td><td style="padding: 8px 0; line-height: 1.5;">[[peer_review_observaciones]]</td></tr>
            </table>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Adjunto a este correo encontrará el **Acta de Dictamen de Arbitraje CACES**, debidamente **firmada de forma electrónica** por la Dirección de Investigación de Traversari. Este documento sirve como constancia oficial para fines de acreditación institucional.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

-- Plantilla 6: Alerta de Vencimiento de Hito de Cronograma (Autómata Scheduler)
INSERT INTO inv_email_templates (uuid, codigo, nombre, descripcion, asunto, cuerpoHtml, activo) VALUES
(
    UUID(),
    'ALERTA_HITO_VENCIMIENTO',
    'Alerta de Vencimiento de Hito de Cronograma',
    'Recordatorio automatizado enviado al docente director cuando se acerca la fecha límite de entrega de evidencias en su cronograma Gantt.',
    'DIITRA Alerta: Vencimiento de Hito Próximo - [[nombre_hito]]',
    '<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
            <h1 style="color: #d9534f; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -0.05em;">DIITRA ALERTA</h1>
            <p style="color: #666666; font-size: 11px; font-weight: 500; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Departamento de Investigación e Innovación Traversari</p>
        </div>

        <h2 style="color: #111111; font-size: 16px; font-weight: 600; line-height: 1.4; margin-top: 0;">Estimado/a Docente Director/a,</h2>

        <p style="color: #444444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Le recordamos que de acuerdo al cronograma Gantt aprobado para su proyecto, se aproxima el vencimiento de una actividad crítica que requiere la entrega de evidencias documentales (CACES Compliance).
        </p>

        <div style="background-color: #fdf7f7; border: 1px solid #eed3d2; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #a94442; font-size: 13px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Hito Próximo a Vencer</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #333333;">
                <tr style="border-bottom: 1px solid #eed3d2;"><td style="padding: 8px 0; font-weight: 600; width: 140px; color: #a94442;">Hito/Tarea:</td><td style="padding: 8px 0; font-weight: 600;">[[nombre_hito]]</td></tr>
                <tr style="border-bottom: 1px solid #eed3d2;"><td style="padding: 8px 0; font-weight: 600; color: #a94442;">Proyecto:</td><td style="padding: 8px 0;">[[proyecto_titulo]]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #a94442;">Fecha Límite:</td><td style="padding: 8px 0; color: #d9534f; font-weight: 700;">[[fecha_limite]]</td></tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="[[sistema_url]]/investigacion/proyectos/workspace" style="display: inline-block; background-color: #d9534f; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Subir Evidencias / Informe</a>
        </div>

        <p style="color: #666666; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
            Evite retrasos que comprometan el cumplimiento del proyecto. Si requiere reprogramar este hito por causas justificadas, por favor solicite una extensión al Director de Investigación en el portal CoWork.
        </p>

        <div style="border-top: 1px solid #eaeaea; padding-top: 16px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">DIITRA — [[institucion_nombre]]</p>
            <p style="margin: 0 0 12px 0;">Quito, Ecuador</p>
            <p style="margin: 0; font-size: 10px; color: #aaaaaa;">Este es un correo automático generado por el sistema. Por favor no responda directamente.</p>
        </div>
    </div>',
    1
);

