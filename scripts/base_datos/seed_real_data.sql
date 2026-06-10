USE sigafi_es;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpieza de tablas de proyectos, productos, presupuestos, etc.
TRUNCATE TABLE inv_proyectos_carreras;
TRUNCATE TABLE inv_proyectos_profesores;
TRUNCATE TABLE inv_proyectos_alumnos;
TRUNCATE TABLE inv_productos;
TRUNCATE TABLE inv_presupuesto_items;
TRUNCATE TABLE inv_informes_avance;
TRUNCATE TABLE inv_evidencias;
TRUNCATE TABLE inv_gastos;
TRUNCATE TABLE inv_objetivos_proyecto;
TRUNCATE TABLE inv_proyectos_ods;
TRUNCATE TABLE inv_proyectos_mml;
TRUNCATE TABLE inv_cronograma_semanas;
TRUNCATE TABLE inv_cronograma;
TRUNCATE TABLE inv_trazabilidad_proyectos;
TRUNCATE TABLE inv_proyecto_extensiones;
TRUNCATE TABLE inv_revisiones_pares;
TRUNCATE TABLE inv_evaluaciones_detalle;
TRUNCATE TABLE inv_documentos_firmas;
TRUNCATE TABLE inv_documentos_instancias;
TRUNCATE TABLE inv_document_audit;
TRUNCATE TABLE inv_cowork_updates;
TRUNCATE TABLE inv_cowork_sesiones;
TRUNCATE TABLE inv_cowork_documentos;
TRUNCATE TABLE inv_collaboration_comments;
TRUNCATE TABLE inv_documentos_secciones_metadata;
TRUNCATE TABLE inv_notificaciones;
TRUNCATE TABLE inv_tokens_acceso;
TRUNCATE TABLE inv_dispositivos_tokens;
TRUNCATE TABLE inv_magic_links;
TRUNCATE TABLE inv_lopdp_consentimientos;
TRUNCATE TABLE inv_lopdp_derechos_arco;
TRUNCATE TABLE inv_lopdp_auditoria_datos;
TRUNCATE TABLE inv_backup_logs;
TRUNCATE TABLE inv_transferencias;
TRUNCATE TABLE inv_proyectos;
TRUNCATE TABLE inv_sublineas;
TRUNCATE TABLE inv_convocatorias;
TRUNCATE TABLE inv_grupos_miembros;
TRUNCATE TABLE inv_grupos_carreras;
TRUNCATE TABLE inv_grupos_lineas;
TRUNCATE TABLE inv_grupos_investigacion;
TRUNCATE TABLE inv_entidades_externas;
TRUNCATE TABLE inv_usuarios_metadata;

-- 1.5. Asegurar usuarios requeridos en tabla central (sincroniza desde SIGAFI o crea placeholders de demo)
--      Los estudiantes y algunos docentes no tienen registro en `usuarios` hasta su primer login.
--      Sin este paso, las subconsultas (SELECT idUsuario FROM usuarios WHERE idSigafi = '...') devuelven NULL.

-- Docentes: sincronizar desde tabla profesores si existen
INSERT INTO usuarios (idSigafi, tablaSigafi, nombre, contrasenia, activo, emailInstitucional)
SELECT
    p.idProfesor,
    'profesor',
    TRIM(CONCAT(
        IFNULL(p.primerNombre, ''), ' ',
        IFNULL(p.segundoNombre, ''), ' ',
        IFNULL(p.primerApellido, ''), ' ',
        IFNULL(p.segundoApellido, '')
    )),
    IFNULL(p.clave, '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    1,
    COALESCE(p.emailInstitucional, p.email)
FROM profesores p
WHERE p.idProfesor IN (
    '1718161126', '1802707511', '0302144159', '1802989226', '1719134759',
    '1724649338', '1719322149', '1720477031'
)
AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.idSigafi = p.idProfesor);

-- Estudiantes: sincronizar desde tabla alumnos si existen
INSERT INTO usuarios (idSigafi, tablaSigafi, nombre, contrasenia, activo, emailInstitucional)
SELECT
    a.idAlumno,
    'alumno',
    TRIM(CONCAT(
        IFNULL(a.primerNombre, ''), ' ',
        IFNULL(a.segundoNombre, ''), ' ',
        IFNULL(a.apellidoPaterno, ''), ' ',
        IFNULL(a.apellidoMaterno, '')
    )),
    IFNULL(a.password, '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    1,
    COALESCE(a.email_institucional, a.email)
FROM alumnos a
WHERE a.idAlumno IN (
    '1725555377', '0102598570', '1751325000', '0103057584', '0105057335'
)
AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.idSigafi = a.idAlumno);

-- Placeholders de demo para cédulas ficticias que no existen en profesores/alumnos
INSERT INTO usuarios (idSigafi, tablaSigafi, nombre, contrasenia, activo, emailInstitucional)
SELECT v.idSigafi, v.tablaSigafi, v.nombre, '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, v.email
FROM (
    SELECT '1719322149' AS idSigafi, 'profesor' AS tablaSigafi, 'María Fernanda Cevallos' AS nombre, 'mcevallos@traversari.edu.ec' AS email UNION ALL
    SELECT '1720477031', 'profesor', 'Carlos Andrés Mendieta', 'cmendieta@traversari.edu.ec' UNION ALL
    SELECT '1725555377', 'alumno',   'Diego Alejandro Romero',  'dromero@est.traversari.edu.ec' UNION ALL
    SELECT '0102598570', 'alumno',   'Valentina Paz Herrera',   'vherrera@est.traversari.edu.ec' UNION ALL
    SELECT '1751325000', 'alumno',   'Sebastián Morales Vega',  'smorales@est.traversari.edu.ec' UNION ALL
    SELECT '0103057584', 'alumno',   'Camila Torres Salinas',   'ctorres@est.traversari.edu.ec' UNION ALL
    SELECT '0105057335', 'alumno',   'Mateo Javier Intriago',   'mintriago@est.traversari.edu.ec' UNION ALL
    SELECT '1725555376', 'otros',    'Revisor Externo A',       'revisor.externo.a@demo.ec' UNION ALL
    SELECT '1725555355', 'otros',    'Revisor Externo B',       'revisor.externo.b@demo.ec'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.idSigafi = v.idSigafi);

-- 2. Poblar Sublíneas de Investigación
INSERT INTO inv_sublineas (idSublinea, uuid, idLinea, nombre, activo) VALUES
(1, UUID(), 1, 'Inteligencia Artificial y Aprendizaje Automático Aplicado', 1),
(2, UUID(), 1, 'Desarrollo de Software Multiplataforma y Computación en la Nube', 1),
(3, UUID(), 4, 'Sistemas Solares Fotovoltaicos y Eficiencia Energética', 1),
(4, UUID(), 2, 'Gestión de Procesos y Modelos de Negocio Innovadores', 1),
(5, UUID(), 2, 'Gestión del Talento Humano y Productividad Laboral', 1),
(6, UUID(), 3, 'Seguridad Informática y Redes de Próxima Generación', 1),
(7, UUID(), 5, 'Plataformas Educativas y Tecnologías Emergentes en el Aula', 1),
(8, UUID(), 2, 'Marketing Digital y Comercio Electrónico para MIPYMES', 1),
(9, UUID(), 2, 'Patrimonio Alimentario y Técnicas Gastronómicas Ancestrales', 1);

-- 3. Poblar Entidades Externas (Aliados Corporativos en Quito y Ecuador)
INSERT INTO inv_entidades_externas (idEntidad, uuid, ruc, razonSocial, tipo, sector, contactoNombre, contactoEmail, activo) VALUES
(1, UUID(), '1790012345001', 'Novacero S.A.', 'Privada', 'Siderúrgico y Manufactura', 'Ing. Carlos Mendoza', 'carlos.mendoza@novacero.com', 1),
(2, UUID(), '1760001550001', 'Corporación Eléctrica del Ecuador CELEC EP', 'Pública', 'Energía y Electricidad', 'Ing. María Elena Silva', 'maria.silva@celec.gob.ec', 1),
(3, UUID(), '1790842245001', 'Conecel S.A. (Claro Ecuador)', 'Privada', 'Telecomunicaciones', 'Ing. Juan Carlos Torres', 'juan.torres@claro.com.ec', 1),
(4, UUID(), '1768152560001', 'Corporación Nacional de Telecomunicaciones CNT EP', 'Pública', 'Telecomunicaciones', 'Ing. David Pazo', 'david.pazo@cnt.gob.ec', 1),
(5, UUID(), '1790007890001', 'Banco Pichincha C.A.', 'Privada', 'Bancario y Financiero', 'Dra. Patricia Ortiz', 'portiz@pichincha.com', 1);

-- 4. Poblar Perfiles de Investigadores (Metadata y Firma Electrónica)
INSERT INTO inv_usuarios_metadata (uuid, idUsuario, orcidId, scopusId, googleScholarUrl, researchGateUrl, especialidad, gradoAcademicoMaximo, rutaFirmaP12, rutaFirmaImagen, firmaHabilitada, aceptoTerminosFirma, fechaConsentimientoFirma, p12PasswordEncrypted) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), '0000-0002-1824-331X', '57204481900', 'https://scholar.google.com/citations?user=gnaranjo', 'https://www.researchgate.net/profile/Giovanny_Naranjo', 'Inteligencia Artificial y Desarrollo de Software', 'PhD en Ciencias de la Computación', 'uploads/firmas/1718161126.p12', 'uploads/firmas/firmas_img/1718161126.png', 1, 1, '2025-01-10 09:00:00', 'encrypted_p12_password_naranjo'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), '0000-0003-0914-458X', '57211029400', 'https://scholar.google.com/citations?user=fbano', 'https://www.researchgate.net/profile/Freddy_Bano', 'Energías Renovables y Control de Procesos', 'Magíster en Electrónica e Instrumentación', 'uploads/firmas/1802707511.p12', 'uploads/firmas/firmas_img/1802707511.png', 1, 1, '2025-01-12 10:30:00', 'encrypted_p12_password_bano'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), '0000-0001-8845-2147', '57195482600', 'https://scholar.google.com/citations?user=esanchez', 'https://www.researchgate.net/profile/Estefani_Sanchez', 'Sistemas de Información y Gestión Tecnológica', 'Magíster en Gestión de la Tecnología', 'uploads/firmas/0302144159.p12', 'uploads/firmas/firmas_img/0302144159.png', 1, 1, '2025-01-15 11:00:00', 'encrypted_p12_password_sanchez'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), '0000-0002-1245-0987', NULL, NULL, NULL, 'Eficiencia Energética y Redes Inteligentes', 'Magíster en Energías Renovables', 'uploads/firmas/1802989226.p12', 'uploads/firmas/firmas_img/1802989226.png', 1, 1, '2025-01-15 11:30:00', 'encrypted_p12_password_luz_bano'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), '0000-0001-9954-1234', NULL, NULL, NULL, 'Gestión de Talento Humano y Clima Laboral', 'Magíster en Administración de Empresas', 'uploads/firmas/1719134759.p12', 'uploads/firmas/firmas_img/1719134759.png', 1, 1, '2025-02-18 09:00:00', 'encrypted_p12_password_tipantuna');

-- 5. Poblar Grupos de Investigación
INSERT INTO inv_grupos_investigacion (idGrupo, uuid, nombre, siglas, tipoGrupo, idDominio, idCoordinador, objetivoGeneral, mision, vision, resolucionAprobacion, fechaCreacion, categoriaConsolidacion, estado, activo) VALUES
(1, 'a241b625-56b8-4160-a4ba-1f67865dded0', 'Grupo de Investigación en Ingeniería de Software y TI', 'GIIST', 'Investigación', 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 
 'Fomentar el desarrollo tecnológico y la innovación en software en la región', 
 'Desarrollar soluciones de software con alto estándar de calidad', 
 'Ser referentes nacionales en desarrollo de software aplicado', 
 'RES-GIIST-2025-01', '2025-01-10', 'Consolidado', 'Aprobado', 1),
(2, 'b11b1111-2222-3333-4444-555555555555', 'Grupo de Energías Renovables y Sostenibilidad Ambiental', 'GERSA', 'Investigación', 2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 
 'Desarrollar prototipos y soluciones tecnológicas en el ámbito energético', 
 'Investigar y aplicar fuentes de energía limpia en beneficio social', 
 'Liderar la transición energética desde la academia', 
 'RES-GERSA-2025-02', '2025-01-12', 'Consolidado', 'Aprobado', 1),
(3, 'c11c1111-2222-3333-4444-555555555555', 'Semillero de Investigación en Innovación y Gestión Empresarial', 'SIGE', 'Semillero', 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 
 'Capacitar a estudiantes en metodologías de investigación en el ámbito de negocios', 
 'Formar semilleristas con visión crítica y emprendedora', 
 'Ser el principal semillero de ideas de negocio tecnológicas del IST', 
 'RES-SIGE-2025-03', '2025-02-15', 'En Formación', 'Aprobado', 1),
(4, 'd11d1111-2222-3333-4444-555555555555', 'Grupo de Investigación en Redes y Ciberseguridad Aplicada', 'GIRCA', 'Investigación', 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1),
 'Investigar e implementar soluciones de ciberseguridad para infraestructuras críticas',
 'Contribuir a la seguridad digital y la protección de datos en el entorno corporativo y académico',
 'Consolidarse como un referente nacional en auditoría de ciberseguridad',
 'RES-GIRCA-2025-04', '2025-03-01', 'En Formación', 'Aprobado', 1),
(5, 'e11e1111-2222-3333-4444-555555555555', 'Grupo de Innovación en Gastronomía y Patrimonio Alimentario', 'GIGPA', 'Investigación', 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719322149' LIMIT 1),
 'Investigar y registrar el patrimonio gastronómico tradicional de Pichincha y Ecuador',
 'Rescatar técnicas ancestrales de cocina aplicando metodologías científicas de conservación',
 'Ser la despensa de conocimiento y desarrollo de innovación culinaria del país',
 'RES-GIGPA-2025-05', '2025-03-10', 'En Formación', 'Aprobado', 1);

-- Relaciones de Grupos con Líneas
INSERT INTO inv_grupos_lineas (idGrupo, idLinea) VALUES
(1, 1), (1, 3), -- GIIST con Software y Redes
(2, 4),         -- GERSA con Energías
(3, 2), (3, 5), -- SIGE con Gestión y Educación
(4, 3), (4, 1), -- GIRCA con Redes y Software
(5, 2), (5, 5); -- GIGPA con Gestión y Educación

-- Relaciones de Grupos con Carreras
INSERT INTO inv_grupos_carreras (idGrupo, idCarrera) VALUES
(1, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1)),
(1, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'RDT' LIMIT 1)),
(2, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1)),
(3, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'EMP' LIMIT 1)),
(3, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ATH' LIMIT 1)),
(4, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'RDT' LIMIT 1)),
(5, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'GAS' LIMIT 1));

-- Miembros de Grupos
INSERT INTO inv_grupos_miembros (idGrupo, idUsuario, rol, activo, fechaInicio) VALUES
-- GIIST
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Director de Proyecto', 1, '2025-01-10'),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 'Co-Investigador', 1, '2025-01-15'),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555377' LIMIT 1), 'Semillerista', 1, '2025-01-20'),
-- GERSA
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Director de Proyecto', 1, '2025-01-12'),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), 'Co-Investigador', 1, '2025-01-15'),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0102598570' LIMIT 1), 'Semillerista', 1, '2025-01-22'),
-- SIGE
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Director de Proyecto', 1, '2025-02-15'),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 'Co-Investigador', 1, '2025-02-18'),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1751325000' LIMIT 1), 'Semillerista', 1, '2025-02-20'),
-- GIRCA
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 'Director de Proyecto', 1, '2025-03-01'),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Co-Investigador', 1, '2025-03-05'),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0103057584' LIMIT 1), 'Semillerista', 1, '2025-03-10'),
-- GIGPA
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719322149' LIMIT 1), 'Director de Proyecto', 1, '2025-03-10'),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1720477031' LIMIT 1), 'Co-Investigador', 1, '2025-03-12'),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0105057335' LIMIT 1), 'Semillerista', 1, '2025-03-15');

-- 6. Poblar Convocatorias
INSERT INTO inv_convocatorias (idConvocatoria, uuid, codigoConvocatoria, titulo, idPeriodo, fechaApertura, fechaCierre, anio, descripcion, presupuestoTotal, montoMaximoProyecto, urlBases, requisitosMinimos, idTipoConvocatoria, idAgendaZonal, idRubrica, puntajeMinimoAprobacion, estado) VALUES
(1, '84f8846c-c918-406b-a25e-336ff326e632', 'CONV-2025-I', 'Convocatoria Proyectos de Investigación y Desarrollo 2025-I', 'ABD2025', '2025-04-15', '2025-06-15', 2025, 'Convocatoria abierta para el financiamiento de proyectos aplicados de I+D en el IST Traversari', 25000.00, 10000.00, 'https://bases.traversari.edu.ec/2025-I', 'Poseer título de tercer nivel y pertenecer a un grupo de investigación', 1, 9, 1, 70.00, 'Cerrada'),
(2, '9fb183ea-e522-4828-98e3-841853ad76aa', 'CONV-2026-I', 'Convocatoria Proyectos de Innovación Tecnológica 2026-I', 'ABR2026', '2026-04-10', '2026-06-10', 2026, 'Enfoque en desarrollo de software, prototipos de hardware y transferencia tecnológica', 30000.00, 12000.00, 'https://bases.traversari.edu.ec/2026-I', 'Tener grupo de investigación registrado o semillero activo', 2, 9, 2, 75.00, 'Abierta');

-- 7. Poblar Proyectos (Se cubren todos los estados del ciclo de vida útil del sistema)
INSERT INTO inv_proyectos (idProyecto, uuid, idConvocatoria, codigoInstitucional, titulo, descripcionProyecto, antecedentes, justificacion, marcoTeorico, metodologia, metodoEvaluacion, idSublinea, idPrograma, idGrupo, tieneGrupo, idTipo, fechaPresentacion, fechaInicio, fechaFin, tiempoEjecucion, estado, disponibleAdopcion, puntajeEvaluacion, valorEjecucion, idObjetivoPnd, idEntidadAliada, trlInicial, trlActual, trlMeta, hashActaAprobacion, fechaAprobacion, firmadoPor, idDspaceHandle, metadataCacesJson) VALUES
(1, '11111111-1111-1111-1111-111111111111', 1, 'PROY-SOFT-2025-001', 
 'Desarrollo de una Plataforma IoT con Inteligencia Artificial para el Monitoreo del Consumo Eléctrico Doméstico en el IST Traversari', 
 'Desarrollo de hardware de sensado y una plataforma web con modelos de redes neuronales recursivas para la clasificación automática de cargas y predicción de consumo eléctrico domiciliar.', 
 'El desperdicio de energía eléctrica en hogares de Quito asciende al 15% debido a la falta de información desagregada sobre el consumo de electrodomésticos en tiempo real...', 
 'Este proyecto permite reducir la facturación eléctrica de las familias y ayuda al instituto a acreditar en los estándares de vinculación tecnológica del CACES...', 
 'Estudios previos muestran que las redes neuronales LSTM alcanzan un 92% de precisión en la desagregación de carga no intrusiva (NILM)...', 
 'Se implementará una metodología ágil XP. Se utilizarán microcontroladores ESP32, sensores SCT-013 y una arquitectura backend basada en ASP.NET Core y Python...', 
 'Comparación del consumo histórico mensual facturado versus el consumo optimizado post-instalación de alertas tempranas en una muestra piloto de 10 hogares.', 
 1, 1, 1, 1, 2, '2025-05-10', '2025-07-01', '2026-01-01', '6 meses', 'En Ejecución', 0, 85.50, 3200.00, 3, 3, 2, 5, 6,
 'hash_acta_firmada_aprobacion_proy1_firmado_ec_2025', '2025-06-20 09:30:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), NULL, NULL),

(2, '22222222-2222-2222-2222-222222222222', 1, 'PROY-ENE-2025-002', 
 'Implementación de un Sistema Solar Fotovoltaico Autónomo para la Iluminación del Campus Traversari Quito', 
 'Diseño, cálculo y puesta en marcha de un sistema de paneles solares fotovoltaicos con banco de baterías para alimentar la iluminación perimetral del campus Traversari, reduciendo la huella de carbono institucional.', 
 'El campus de Quito del IST Traversari experimenta cortes intermitentes de energía y una alta facturación en iluminación externa...', 
 'Garantiza la continuidad operativa de la iluminación externa de seguridad y sirve como laboratorio vivo para los estudiantes de la carrera de Electrónica...', 
 'La radiación solar media en Quito es de 4.8 kWh/m²/día, lo cual hace altamente viable la generación distribuida autónoma...', 
 'Metodología experimental: 1. Dimensionamiento de la carga, 2. Selección de módulos monocristalinos e inversor, 3. Instalación física, 4. Pruebas de descarga profunda de baterías.', 
 'Medición diaria del rendimiento del sistema en kWh generados y ahorro porcentual respecto a la red de distribución eléctrica pública.', 
 3, 2, 2, 1, 2, '2025-05-12', '2025-07-05', '2026-01-05', '6 meses', 'Finalizado', 0, 92.00, 6500.00, 2, 2, 3, 7, 7,
 'hash_acta_firmada_aprobacion_proy2_firmado_ec_2025', '2025-06-22 10:45:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'handle/123456789/104', NULL),

(3, '33333333-3333-3333-3333-333333333333', 1, 'PROY-ADM-2025-003', 
 'Estudio del Impacto del Teletrabajo en la Productividad del Claustro Docente en Institutos Tecnológicos de Quito', 
 'Investigación empírica y análisis correlacional del desempeño laboral docente bajo esquemas mixtos de teletrabajo en institutos de Pichincha.', 
 'La transición abrupta al teletrabajo generó cambios significativos en el clima organizacional y la productividad de los docentes universitarios y tecnológicos...', 
 'Permite diseñar políticas internas de bienestar y optimización de distributivos horarios conforme a la normativa vigente del CES...', 
 'Se revisarán los modelos de balance vida-trabajo de Greenhaus y las escalas de productividad de Koopmans aplicados al sector educativo...', 
 'Investigación no experimental, de corte transversal, utilizando encuestas estructuradas a 120 docentes de 5 institutos tecnológicos de Quito y análisis con SPSS.', 
 'Validación de hipótesis de correlación mediante pruebas de Chi-cuadrado y coeficientes R de Pearson entre variables de clima y metas cumplidas.', 
 5, 3, 3, 1, 1, '2025-05-15', '2025-07-10', '2026-01-10', '6 meses', 'Aprobado', 0, 78.00, 1200.00, 4, NULL, 1, 3, 4,
 'hash_acta_firmada_aprobacion_proy3_firmado_ec_2025', '2025-06-25 11:15:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), NULL, NULL),

(4, '44444444-4444-4444-4444-444444444444', 2, 'PROY-SOFT-2026-004', 
 'Desarrollo de un Asistente Virtual Conversacional basado en IA para la Gestión Académica de Estudiantes en el IST Traversari', 
 'Diseño de un asistente virtual inteligente basado en modelos de lenguaje (LLM) y técnicas de generación aumentada por recuperación (RAG) para automatizar la atención a estudiantes sobre trámites académicos, calendarios y reglamentos institucionales.', 
 'El departamento de bienestar estudiantil y secretaría del IST Traversari registra saturación en canales de consulta rutinaria...', 
 'Mejora los tiempos de respuesta estudiantil de horas a segundos, liberando tiempo administrativo para casos de atención compleja...', 
 'La arquitectura RAG permite mitigar alucinaciones de modelos de lenguaje mediante inyección de contexto de bases de conocimiento oficiales...', 
 'Desarrollo incremental bajo metodología SCRUM: 1. Curación de reglamentos institucionales, 2. Embeddings y base de datos vectorial, 3. Orquestación con LangChain y API de chat, 4. Frontend web interactivo.', 
 'Evaluación de precisión conversacional utilizando el framework Ragas y encuestas de usabilidad y satisfacción de estudiantes.', 
 2, 1, 1, 1, 2, '2026-04-15', '2026-07-01', '2027-01-01', '6 meses', 'Borrador', 0, NULL, 0.00, 3, NULL, 2, 2, 5,
 NULL, NULL, NULL, NULL, NULL),

(5, '55555555-5555-5555-5555-555555555555', 2, 'PROY-RED-2026-005', 
 'Diseño y Construcción de un Prototipo para la Detección Temprana de Fallas Eléctricas en Laboratorios de Electrónica del IST Traversari', 
 'Construcción de hardware detector con microcontrolador y análisis de señales de corriente para la desconexión preventiva de mesas de trabajo en laboratorios ante transitorios y cortocircuitos.', 
 'Los laboratorios de electrónica sufren constantes daños en sus osciloscopios y fuentes debido a cortocircuitos accidentales cometidos por estudiantes en prácticas...', 
 'Protege los activos tecnológicos del instituto y reduce costos de mantenimiento correctivo de laboratorios...', 
 'Los transitorios de corriente y sobretensiones en microsegundos pueden detectarse mediante comparadores analógicos rápidos y optoacopladores de aislamiento...', 
 'Diseño del PCB en Altium, fabricación del prototipo, integración de relevadores de estado sólido de disparo rápido y pruebas controladas con cargas inductivas.', 
 'Tiempo promedio de respuesta en milisegundos desde la detección del corto hasta la apertura del circuito.', 
 6, 1, 1, 1, 2, '2026-04-20', '2026-07-05', '2027-01-05', '6 meses', 'En Revisión', 0, NULL, 500.00, 2, 1, 2, 3, 6,
 NULL, NULL, NULL, NULL, NULL),

(6, '66666666-6666-6666-6666-666666666666', 1, 'PROY-MKT-2025-006',
 'Estrategias de Marketing Digital para la Reactivación Comercial de las MIPYMES de la Parroquia Traversari en Quito',
 'Formulación e implementación de planes de comercio electrónico y marketing digital para un grupo de 15 microempresas del sector de influencia del instituto en el sur de Quito.',
 'La baja adopción digital de las MIPYMES locales limita su crecimiento comercial y competitividad...',
 'Vincula la academia con las microempresas del sector para dinamizar la economía local post-crisis...',
 'Los modelos de adopción tecnológica TAM aplicados a microempresarios demuestran que la facilidad de uso percibida es clave...',
 'Capacitación a microempresarios, diseño de catálogos web de bajo costo y configuración de canales de WhatsApp Business y redes sociales.',
 'Incremento porcentual estimado de ventas y nivel de tráfico en los canales digitales configurados.',
 8, 3, 3, 1, 1, '2025-05-18', '2025-07-15', '2026-01-15', '6 meses', 'Rechazado', 0, 62.50, 0.00, 5, NULL, 1, 1, 3,
 NULL, NULL, NULL, NULL, NULL),

(7, '77777777-7777-7777-7777-777777777777', 1, 'PROY-GAS-2025-007',
 'Estudio y Preservación de Técnicas Culinarias Ancestrales en el Distrito Metropolitano de Quito',
 'Investigación histórica, etnográfica y experimental de la culinaria prehispánica del norte de Pichincha, documentando recetas y procesos químicos de fermentación tradicional.',
 'La globalización alimentaria desplaza la cocina tradicional quiteña, perdiendo técnicas de fermentación ancestrales como la chicha de jora o la preparación del machica...',
 'Permite salvaguardar el patrimonio inmaterial y nutrir la malla académica de la carrera de Gastronomía con conocimientos vernáculos...',
 'Estudios bromatológicos de la fermentación láctica de granos andinos demuestran propiedades nutricionales y probióticas excepcionales...',
 'Entrevistas etnográficas en comunas ancestrales de Quito (Pomasqui, Calderón) y pruebas de laboratorio bromatológico para caracterizar las propiedades físico-químicas de las recetas.',
 'Registro detallado en un catálogo técnico gastronómico y publicación de un recetario estandarizado.',
 9, 3, 5, 1, 2, '2025-05-20', '2025-07-20', '2026-01-20', '6 meses', 'Inconcluso', 1, NULL, 0.00, 2, NULL, 1, 2, 3,
 NULL, NULL, NULL, NULL, NULL);

-- Relaciones de Proyectos con Carreras
INSERT INTO inv_proyectos_carreras (idProyecto, idCarrera, modalidad) VALUES
(1, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1), 'Presencial'),
(2, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1), 'Dual'),
(3, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'EMP' LIMIT 1), 'Presencial'),
(4, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1), 'Virtual'),
(5, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1), 'Presencial'),
(6, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'MKT' LIMIT 1), 'Presencial'),
(7, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'GAS' LIMIT 1), 'Presencial');

-- Profesores participantes
INSERT INTO inv_proyectos_profesores (idProyecto, idUsuario, esDirector, rol, nivelAcademico, telefono, horasSemanales, activo) VALUES
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 12.0, 1),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 0, 'Co-Investigador', 'Magíster en TI', '0999999992', 8.0, 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 15.0, 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), 0, 'Co-Investigador', 'Magíster en Energías', '0999999994', 10.0, 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Talento Humano', '0999999992', 10.0, 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 0, 'Co-Investigador', 'Magíster en Administración', '0999999995', 8.0, 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 10.0, 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 0, 'Co-Investigador', 'Magíster en TI', '0999999996', 6.0, 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 12.0, 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 0, 'Co-Investigador', 'Magíster en Software', '0999999991', 8.0, 1),
(6, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 1, 'Director de Proyecto', 'Magíster en Administración', '0999999995', 8.0, 1);

-- Alumnos participantes (Cumple el indicador CACES de semilleros y fomento a la investigación formativa)
INSERT INTO inv_proyectos_alumnos (idProyecto, idUsuario, rol, nivelAcademico, telefono, activo) VALUES
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555377' LIMIT 1), 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888881', 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0102598570' LIMIT 1), 'Semillerista', 'Estudiante de Electrónica', '0988888882', 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1751325000' LIMIT 1), 'Semillerista', 'Estudiante de Gestión Empresarial', '0988888883', 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0105057335' LIMIT 1), 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888884', 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0103057584' LIMIT 1), 'Semillerista', 'Estudiante de Electrónica', '0988888885', 1);

-- 8. Poblar Objetivos de Proyecto
INSERT INTO inv_objetivos_proyecto (idObjetivo, idProyecto, esGeneral, descripcion, orden) VALUES
-- Proy 1
(1, 1, 1, 'Desarrollar una plataforma IoT y modelos de inteligencia artificial para la monitorización de la demanda eléctrica y desagregación de cargas en entornos residenciales en el Distrito Metropolitano de Quito.', 1),
(2, 1, 0, 'Diseñar y ensamblar hardware de adquisición de datos basado en ESP32 para medir corriente y voltaje en las acometidas eléctricas.', 2),
(3, 1, 0, 'Implementar una red neuronal LSTM para clasificar los electrodomésticos activos según sus firmas eléctricas de consumo.', 3),
(4, 1, 0, 'Desarrollar un dashboard web que presente el consumo detallado e implemente un sistema de notificaciones de desperdicios para los usuarios.', 4),
-- Proy 2
(5, 2, 1, 'Implementar un sistema de energía solar fotovoltaica autónomo de 3 kW de potencia para la iluminación externa e integral del campus del IST Traversari en Quito.', 1),
(6, 2, 0, 'Efectuar el cálculo de radiación e inclinación óptima de paneles monocristalinos en el área geográfica del campus.', 2),
(7, 2, 0, 'Montar físicamente 8 paneles solares, inversores de carga y un banco de almacenamiento energético de baterías de gel.', 3),
(8, 2, 0, 'Integrar sensores inteligentes para conmutación automática nocturna y monitoreo de la descarga del banco de baterías.', 4),
-- Proy 3
(9, 3, 1, 'Analizar la correlación del teletrabajo con los niveles de productividad del personal docente de los Institutos Tecnológicos de la ciudad de Quito durante el periodo académico 2024-2025.', 1),
(10, 3, 0, 'Diseñar e instrumentar encuestas validadas para medir variables de productividad, satisfacción laboral y balance familiar.', 2),
(11, 3, 0, 'Evaluar los resultados cuantitativos recolectados en una muestra de 120 docentes mediante el software estadístico SPSS.', 3),
-- Proy 5
(12, 5, 1, 'Diseñar un circuito de desconexión ultra rápido para laboratorios de electrónica basado en disparo analógico para mitigar cortocircuitos.', 1),
(13, 5, 0, 'Configurar el hardware comparador de sobre-corrientes mediante simulación en Proteus y diseño en Altium.', 2),
(14, 5, 0, 'Montar 5 prototipos físicos instalados en las mesas del Laboratorio de Electrónica para pruebas prácticas controladas.', 3);

-- 9. Poblar ODS asociados a Proyectos
INSERT INTO inv_proyectos_ods (idProyecto, idOds, objetivoEspecificoODS) VALUES
(1, 9, 'Fomentar la innovación tecnológica industrial local mediante hardware y software libre.'),
(1, 7, 'Contribuir a la eficiencia energética en hogares mediante control automatizado de cargas.'),
(2, 7, 'Garantizar fuentes de energía no contaminante para el abastecimiento del alumbrado perimetral.'),
(2, 13, 'Reducir las emisiones de CO2 generadas por el consumo de red tradicional del campus.'),
(3, 8, 'Promover condiciones de trabajo decentes y un adecuado clima laboral en la educación técnica.'),
(6, 8, 'Impulsar el crecimiento económico local y ventas de microempresarios mediante canales digitales.'),
(7, 2, 'Rescatar la soberanía alimentaria y técnicas de cultivo ancestrales a través de la culinaria quiteña.');

-- 10. Poblar Productos Científicos y Tecnológicos (Soporte CACES Acreditación)
INSERT INTO inv_productos (idProducto, idProyecto, idTipoProducto, titulo, cantidad, urlProducto, esPropiedadIntelectual, numeroRegistro, fechaRegistroSenadi) VALUES
(1, 1, 1, 'Análisis del Consumo Energético en Institutos de Educación Superior Usando IoT y Redes Neuronales', 1, 'https://scopus.com/traversari-iot-ai', 0, NULL, NULL),
(2, 1, 3, 'IoT Power Monitor Traversari v1.0', 1, 'https://github.com/traversari/iot-power-monitor', 1, 'SENADI-2025-SOFT-001', '2025-11-20'),
(3, 2, 6, 'Manual de Operación y Rendimiento Energético del Sistema Fotovoltaico Traversari', 1, 'https://repositorio.traversari.edu.ec/manual-fotovoltaico', 0, NULL, NULL),
(4, 2, 2, 'Módulo Seguidor Solar Automatizado Traversari', 1, 'https://repositorio.traversari.edu.ec/seguidor-solar', 1, 'SENADI-2025-IND-002', '2025-11-25'),
(5, 3, 5, 'El Docente del Siglo XXI: Gestión del Tiempo y Teletrabajo en el Contexto Ecuatoriano', 1, 'https://repositorio.traversari.edu.ec/docente-teletrabajo', 0, NULL, NULL);

-- 11. Poblar Partidas Presupuestarias
INSERT INTO inv_presupuesto_items (idItem, idProyecto, categoria, idPartida, detalle, cantidad, valorUnitario, esGastoCapital) VALUES
-- Proyecto 1
(1, 1, 'Equipos', 'EQ-001', 'Servidor de base de datos local para procesamiento de modelos de IA', 1.00, 1500.00, 1),
(2, 1, 'Materiales', 'MAT-002', 'Sensores de corriente no invasivos, microcontroladores ESP32 y protoboards', 10.00, 100.00, 0),
(3, 1, 'Servicios', 'SER-003', 'Honorarios de consultoría para calibración de redes neuronales LSTM', 1.00, 2000.00, 0),
-- Proyecto 2
(4, 2, 'Equipos', 'EQ-004', 'Paneles Solares Monocristalinos de 450W de alta eficiencia', 4.00, 375.00, 1),
(5, 2, 'Equipos', 'EQ-005', 'Inversor / Cargador de Onda Senoidal Pura 3kW 24V', 1.00, 2000.00, 1),
(6, 2, 'Equipos', 'EQ-006', 'Baterías de Ciclo Profundo de Gel 12V 200Ah', 4.00, 500.00, 1),
(7, 2, 'Materiales', 'MAT-003', 'Estructuras de aluminio y cables de cobre templado de calibre solar', 1.00, 1000.00, 0),
-- Proyecto 3
(8, 3, 'Software', 'SW-007', 'Licencia anual de software de análisis de datos SPSS v29', 1.00, 800.00, 0),
(9, 3, 'Materiales', 'MAT-008', 'Materiales de papelería, fotocopias y refrigerios para encuestas de campo', 1.00, 1000.00, 0),
-- Proyecto 4
(10, 4, 'Servicios', 'SER-009', 'Servicios de Hosting Cloud AWS (Elastic Beanstalk y PostgreSQL Vectorial)', 1.00, 2000.00, 0),
(11, 4, 'Servicios', 'SER-010', 'Créditos de acceso a API de modelos LLM (OpenAI / Anthropic)', 1.00, 3000.00, 0),
-- Proyecto 5
(12, 5, 'Equipos', 'EQ-011', 'Osciloscopio digital portátil de 100MHz con canales aislados', 1.00, 1500.00, 1),
(13, 5, 'Materiales', 'MAT-012', 'Disipadores, relés de estado sólido, transistores de disparo rápido y componentes', 1.00, 2000.00, 0);

-- 12. Poblar Historial de Informes de Avance (Monitoreo e Inmutabilidad)
INSERT INTO inv_informes_avance (idInforme, uuid, idProyecto, numeroInforme, fechaReporte, resumenActividades, esFirmadoDigital, hashFirma, fechaFirma, validadoPor, estado) VALUES
-- Informes de Proyecto 1 (En Ejecución)
(1, 'ff111111-2222-3333-4444-555555555555', 1, 1, '2025-08-01', 'Fase de diseño de la placa de adquisición finalizada. Adquisición de componentes e instalación del servidor local.', 1, 'd3f82163b86029d5b78ec90141f22e84c1fbc0d16f8ef190a421b8ff120f269a', '2025-08-05 10:00:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Aprobado'),
(2, 'ff222222-2222-3333-4444-555555555555', 1, 2, '2025-10-15', '[OBSERVACIÓN DEL DIRECTOR DE INVESTIGACIÓN]: Por favor detalle el modelo de clasificación LSTM y agregue fotos del hardware.\n\n---\n\nConstrucción y calibración de los sensores en los 10 hogares pilotos. Pruebas de envío de telemetría WiFi estables.', 0, NULL, NULL, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Observado'),
(6, 'ff666666-2222-3333-4444-555555555555', 1, 3, '2025-12-10', 'Integración backend/frontend de la plataforma y desarrollo de algoritmos de optimización de cargas.', 0, NULL, NULL, NULL, 'Pendiente'),

-- Informes de Proyecto 2 (Finalizado)
(3, 'ff333333-2222-3333-4444-555555555555', 2, 1, '2025-08-05', 'Cálculos de inclinación solar completados. Estructuración y soldadura de marcos de soporte mecánico en techos.', 1, 'f82bbcbff18acb9eef89283f12e840afbc89e81bfafeff093b128afc298ec289', '2025-08-10 14:00:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Aprobado'),
(4, 'ff444444-2222-3333-4444-555555555555', 2, 2, '2025-11-05', 'Instalación de paneles fotovoltaicos, inversor de carga e integración de baterías con conmutador automático de red.', 1, 'f018a38c92cd8efd238ea1203bca01e839eefbcd18acbde128afbdcd921f84ef', '2025-11-10 09:20:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Aprobado'),
(5, 'ff555555-2222-3333-4444-555555555555', 2, 3, '2026-01-02', 'Informe final de pruebas: Generación diaria de 11.2 kWh acumulados. Iluminación perimetral operando 100% de manera autónoma.', 1, 'a12bc90fe838efca839ea12bfaec09e20a9bfedcba91bfadcf928eef920fe1a8', '2026-01-05 16:15:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Aprobado');

-- 13. Poblar Evidencias
INSERT INTO inv_evidencias (idEvidencia, uuid, idInforme, idTipoEvidencia, descripcion, rutaArchivo, metadataJson, fechaRegistro) VALUES
(1, UUID(), 1, 1, 'Fotografías del montaje del primer prototipo sensor en placa de cobre', 'uploads/evidencias/prototipo_sensor_domestico.jpg', '{"size": 1824510, "extension": "jpg"}', '2025-08-01 09:15:00'),
(2, UUID(), 1, 5, 'Factura de importación del servidor local de procesamiento de modelos', 'uploads/evidencias/factura_servidor_compu.pdf', '{"size": 894520, "extension": "pdf"}', '2025-08-01 09:20:00'),
(3, UUID(), 3, 1, 'Plano CAD de la distribución de paneles solares en el techo del campus', 'uploads/evidencias/diseno_fotovoltaico_campus.pdf', '{"size": 2548000, "extension": "pdf"}', '2025-08-05 10:15:00'),
(4, UUID(), 4, 1, 'Fotografía panorámica de los paneles instalados en el techo del bloque B', 'uploads/evidencias/paneles_instalados_bloque_b.jpg', '{"size": 3410200, "extension": "jpg"}', '2025-11-05 15:40:00'),
(5, UUID(), 5, 2, 'Acta de Entrega-Recepción de obra suscrita con el Rector del Instituto', 'uploads/evidencias/acta_entrega_reinstalacion.pdf', '{"size": 1150000, "extension": "pdf"}', '2026-01-02 12:00:00'),
(6, UUID(), 2, 1, 'Esquema de conexiones eléctricas del circuito de monitoreo', 'uploads/evidencias/esquema_sensor_iot.png', '{"size": 850000, "extension": "png"}', '2025-10-15 11:00:00'),
(7, UUID(), 6, 2, 'Reporte de precisión del modelo LSTM de clasificación de electrodomésticos', 'uploads/evidencias/reporte_ia_lstm.pdf', '{"size": 1120000, "extension": "pdf"}', '2025-12-10 14:00:00');

-- 14. Poblar Libro Diario de Gastos (Monitoreo Presupuestario)
-- Gastos de Proyecto 1 (Plataforma IoT)
INSERT INTO inv_gastos (idGasto, uuid, idProyecto, idItem, monto, fechaGasto, numeroFactura, descripcion, idEvidencia) VALUES
(1, 'e1111111-1111-1111-1111-111111111111', 1, 1, 1500.00, '2025-07-15', 'FAC-001-0209', 'Compra del servidor local de base de datos a Computrón S.A.', 2),
(2, 'e1111111-2222-1111-1111-111111111111', 1, 2, 1000.00, '2025-08-10', 'FAC-002-1250', 'Adquisición de kits de desarrollo ESP32 y sensores de corriente SCT', 1),
(7, 'e1111111-3333-1111-1111-111111111111', 1, 2, 300.00, '2025-09-05', 'FAC-003-9090', 'Componentes adicionales de sensado SCT-013 y resistencias shunt', NULL),
(8, 'e1111111-4444-1111-1111-111111111111', 1, 3, 500.00, '2025-10-01', 'FAC-004-8080', 'Suscripción de base de datos en la nube y entrenamiento de GPU (Pendiente de Aprobación)', NULL);

-- Gastos de Proyecto 2 (Sistema Fotovoltaico)
INSERT INTO inv_gastos (idGasto, uuid, idProyecto, idItem, monto, fechaGasto, numeroFactura, descripcion, idEvidencia) VALUES
(3, 'e2222222-1111-2222-2222-222222222222', 2, 4, 1500.00, '2025-07-20', 'FAC-005-9981', 'Adquisición de 4 paneles monocristalinos a SolarLux Ecuador', 3),
(4, 'e2222222-2222-2222-2222-222222222222', 2, 5, 2000.00, '2025-07-25', 'FAC-005-9982', 'Compra del inversor cargador híbrido 3kW a SolarLux Ecuador', NULL),
(5, 'e2222222-3333-2222-2222-222222222222', 2, 6, 2000.00, '2025-08-05', 'FAC-008-0114', 'Baterías de ciclo profundo GEL a Megabaterías Quito', 4),
(6, 'e2222222-4444-2222-2222-222222222222', 2, 7, 1000.00, '2025-08-12', 'FAC-001-4458', 'Estructuras de aluminio y cableado a Ferretería Kywi', 5);

-- 15. Poblar Cronograma Gantt
INSERT INTO inv_cronograma (idActividad, uuid, idProyecto, idObjetivo, numeroActividad, descripcion, recursosNecesarios, fechaInicioPrevista, fechaFinPrevista, progreso, ponderacion, esEntregableCaces, idActividadPadre, colorHex) VALUES
-- Proy 1 (En Ejecución)
(1, UUID(), 1, 2, 1, 'Diseño de PCB de la placa sensora y pruebas de aislamiento eléctrico', 'Software Altium y materiales de prototipado rápido', '2025-07-01', '2025-08-15', 100.00, 20.00, 1, NULL, '#2ecc71'),
(2, UUID(), 1, 3, 2, 'Recolección de firmas eléctricas y entrenamiento inicial de red LSTM', 'Servidor de base de datos local y GPU', '2025-08-16', '2025-10-31', 80.00, 40.00, 1, NULL, '#3498db'),
(3, UUID(), 1, 4, 3, 'Integración backend/frontend de la plataforma y notificaciones push', 'IDE de programación y licencia web', '2025-11-01', '2025-12-31', 25.00, 40.00, 1, NULL, '#e67e22'),

-- Proy 2 (Finalizado - Todo al 100%)
(4, UUID(), 2, 6, 1, 'Dimensionamiento técnico, cálculo de sombreado y planos del campus', 'Ingenieros asesores y computadoras CAD', '2025-07-05', '2025-08-15', 100.00, 25.00, 1, NULL, '#2ecc71'),
(5, UUID(), 2, 7, 2, 'Montaje estructural de paneles y cableado de baterías en cuarto eléctrico', 'Paneles solares, baterías, inversores, andamios', '2025-08-16', '2025-10-31', 100.00, 50.00, 1, NULL, '#2ecc71'),
(6, UUID(), 2, 8, 3, 'Programación del microcontrolador de conmutación inteligente y sensores', 'Instrumentos de medición y tarjetas lógicas', '2025-11-01', '2025-12-31', 100.00, 25.00, 1, NULL, '#2ecc71'),

-- Proy 3 (Aprobado - Todo al 0%)
(7, UUID(), 3, 10, 1, 'Formulación teórica del instrumento de encuesta y validación por juicio de expertos', 'Material bibliográfico e investigadores externos', '2025-07-10', '2025-09-10', 0.00, 40.00, 0, NULL, '#9b59b6'),
(8, UUID(), 3, 11, 2, 'Aplicación digital del censo docente en institutos de Quito y depuración de base', 'Acceso a plataformas digitales de encuestas', '2025-09-11', '2025-12-10', 0.00, 60.00, 1, NULL, '#9b59b6');

-- Semanas de Cronograma
INSERT INTO inv_cronograma_semanas (idSemana, idActividad, mes, semana, completada) VALUES
(1, 1, 'Julio', 1, 1),
(2, 1, 'Julio', 2, 1),
(3, 1, 'Julio', 3, 1),
(4, 1, 'Julio', 4, 1),
(5, 1, 'Agosto', 1, 1),
(6, 1, 'Agosto', 2, 1),
(7, 2, 'Agosto', 3, 1),
(8, 2, 'Agosto', 4, 1),
(9, 2, 'Septiembre', 1, 1),
(10, 2, 'Septiembre', 2, 1);

-- 16. Matriz de Marco Lógico (MML - Requisito SENESCYT)
INSERT INTO inv_proyectos_mml (idMml, idProyecto, nivel, resumenNarrativo, indicadores, mediosVerificacion, supuestos) VALUES
-- Proy 1
(1, 1, 'Fin', 'Contribuir a la matriz energética sostenible de Quito y a la concientización del consumo eficiente.', 'Consumo promedio mensual por hogar reducido en 10% en hogares piloto.', 'Lecturas del medidor inteligente contrastado con planillas EEQ.', 'Apoyo y colaboración de los jefes de hogar en la recolección de datos.'),
(2, 1, 'Propósito', 'Optimizar el consumo eléctrico doméstico mediante desagregación de cargas impulsado por IA.', 'Detección automática de al menos 4 tipos de electrodomésticos.', 'Registros de actividad y logs de la red neuronal LSTM en base de datos.', 'Las firmas de consumo eléctrico son diferenciables e identificables.'),
(3, 1, 'Componente', '1. Placa sensora IoT instalada en acometida residencial.\n2. Servidor web de clasificación por IA.', 'Kits instalados y funcionando de forma continua sin fallas en 10 viviendas.', 'Reporte fotográfico de instalación física y enlace Git del código fuente.', 'Se cuenta con suministro normal de componentes electrónicos importados.'),
(4, 1, 'Actividad', 'Ensamblar circuitos, recolectar base de datos de firmas, entrenar red neuronal LSTM y codificar dashboard.', 'Gasto presupuestario ejecutado al 100% conforme a cronograma.', 'Facturas de egresos y libro diario del departamento financiero.', 'Disponibilidad de horas de investigación de los docentes implicados.');

-- 17. Evaluaciones de Pares y Detalle de Calificación (Doble Ciego & Arbitraje Plenario)
INSERT INTO inv_revisiones_pares (idRevision, uuid, idProyecto, idRevisor, fechaAsignacion, fechaLimite, fechaCompletado, dictamenRevisor, estado, esExterno, esDobleCiego, puntajeTotal, observacionesGral) VALUES
-- Proy 1
(1, UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), '2025-05-15', '2025-06-15', '2025-06-10 10:00:00', 'Aprueba', 'Completada', 0, 1, 86.00, 'Propuesta muy pertinente. Cuenta con una metodología de ingeniería y metas viables en el plazo planteado.'),
(2, UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555376' LIMIT 1), '2025-05-15', '2025-06-15', '2025-06-12 15:30:00', 'Aprueba', 'Completada', 1, 1, 85.00, 'Excelente diseño de experimentación. Es de mucho beneficio el vínculo del estudiante semillerista.'),

-- Proy 2
(3, UUID(), 2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), '2025-05-15', '2025-06-15', '2025-06-11 11:20:00', 'Aprueba', 'Completada', 0, 1, 90.00, 'Muy bien estructurado el marco lógico. Es un proyecto de alto valor para el desarrollo sostenible.'),
(4, UUID(), 2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555355' LIMIT 1), '2025-05-15', '2025-06-15', '2025-06-14 17:40:00', 'Aprueba', 'Completada', 1, 1, 94.00, 'Diseño técnico impecable. Los cálculos justifican la inversión del presupuesto de capital.'),

-- Proy 3
(5, UUID(), 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), '2025-05-18', '2025-06-18', '2025-06-15 08:30:00', 'Aprueba', 'Completada', 0, 1, 76.00, 'Propuesta coherente con la realidad post-pandemia. Sugiero depurar bien las encuestas.'),
(6, UUID(), 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555376' LIMIT 1), '2025-05-18', '2025-06-18', '2025-06-16 14:10:00', 'Aprueba', 'Completada', 1, 1, 80.00, 'Estudio relevante para la gestión de talento humano en institutos públicos.'),

-- Proy 5 (Divergencia que dispara el flujo de Arbitraje del Comité Científico)
(7, UUID(), 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), '2026-04-22', '2026-05-22', '2026-05-15 09:30:00', 'Aprueba', 'Completada', 0, 1, 85.00, 'Prototipo de hardware que solucionará problemas críticos en laboratorios. Viable y recomendado.'),
(8, UUID(), 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555376' LIMIT 1), '2026-04-22', '2026-05-22', '2026-05-18 16:45:00', 'Rechaza', 'Completada', 1, 1, 52.00, 'El proyecto no define adecuadamente las normas de seguridad internacionales aplicables (IEEE/IEC). El presupuesto es escaso para fabricar un PCB comercial y realizar pruebas de sobretensión seguras.'),
(9, UUID(), 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555355' LIMIT 1), '2026-05-20', '2026-06-10', NULL, 'Pendiente', 'Pendiente', 1, 1, NULL, 'Revisor dirimente convocado para resolver la discordancia de evaluación.'),

-- Proy 6 (Rechazado)
(10, UUID(), 6, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), '2025-05-20', '2025-06-20', '2025-06-10 14:00:00', 'Rechaza', 'Completada', 0, 1, 65.00, 'La metodología no detalla cómo se garantizará la sustentabilidad de la adopción digital en microempresarios informales.'),
(11, UUID(), 6, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555355' LIMIT 1), '2025-05-20', '2025-06-20', '2025-06-12 11:00:00', 'Rechaza', 'Completada', 1, 1, 60.00, 'No presenta una innovación metodológica clara. Se asimila más a un taller de capacitación técnica básico que a un proyecto de I+D+i.');

-- Detalles de Rúbrica
INSERT INTO inv_evaluaciones_detalle (idRevision, criterio, puntaje, observaciones) VALUES
-- Revision 7 (Proy 5, total 85.00)
(7, 'Impacto Social y Tecnológico', 22.00, 'Gran justificación del aporte práctico en laboratorios.'),
(7, 'Metodología y Rigor Científico', 21.00, 'La secuencia de diseño y pruebas en simulación es correcta.'),
(7, 'Viabilidad y Presupuesto', 21.00, 'Los costos de componentes electrónicos están bien estimados.'),
(7, 'Pertinencia Científica y Social', 21.00, 'El proyecto tiene gran transferencia tecnológica en el instituto.'),

-- Revision 8 (Proy 5, total 52.00)
(8, 'Impacto Social y Tecnológico', 12.00, 'Aporte académico limitado, es un circuito tradicional.'),
(8, 'Metodología y Rigor Científico', 14.00, 'Metodología poco rigurosa. Faltan detalles de seguridad eléctrica.'),
(8, 'Viabilidad y Presupuesto', 10.00, 'Presupuesto insuficiente para garantizar pruebas bajo normas internacionales.'),
(8, 'Pertinencia Científica y Social', 16.00, 'Sólo beneficia de forma interna a laboratorios, alcance limitado.'),

-- Revision 1 (Proy 1, total 86.00)
(1, 'Impacto Social y Tecnológico', 22.00, 'Excelente justificación de los algoritmos de IA.'),
(1, 'Metodología y Rigor Científico', 22.00, 'Metodología clara en fases.'),
(1, 'Viabilidad y Presupuesto', 21.00, 'Precios correctos de mercado.'),
(1, 'Pertinencia Científica y Social', 21.00, 'Impacto residencial directo.'),

-- Revision 2 (Proy 1, total 85.00)
(2, 'Impacto Social y Tecnológico', 21.00, 'Aporte tecnológico notable.'),
(2, 'Metodología y Rigor Científico', 21.00, 'Metodología ágil bien planteada.'),
(2, 'Viabilidad y Presupuesto', 22.00, 'Costo de los sensores ESP32 idóneo.'),
(2, 'Pertinencia Científica y Social', 21.00, 'Gran vinculación formativa.');

-- 18. Poblar Instancias y Firmas de Documentos (DIITRA Document Engine con Firma Criptográfica .p12)
INSERT INTO inv_documentos_instancias (id, uuid, template_code, template_version, entity_uuid, entity_type, titulo_instancia, estado, created_by, final_pdf_path, file_hash, traceability_code, data_snapshot_json) VALUES
(1, 'd1111111-1111-1111-1111-111111111111', 'PROTOCOLO_INVESTIGACION', 1, '11111111-1111-1111-1111-111111111111', 'Proyecto', 'Protocolo Oficial - Monitoreo IoT', 4, 'sistema', 'uploads/documentos/protocolo_iot_proy1.pdf', 'hash_p1_pdf_firmado_123456', 'TRAV-2025-PROY1-PROT', '{"titulo": "Plataforma IoT con IA", "autor": "Giovanny Naranjo"}'),
(2, 'd1111111-2222-1111-1111-111111111111', 'DICTAMEN_ARBITRAJE', 1, '11111111-1111-1111-1111-111111111111', 'Proyecto', 'Acta de Aprobación de Proyecto - IoT', 4, 'sistema', 'uploads/documentos/acta_aprobacion_proy1.pdf', 'hash_p1_acta_aprobacion_firmado_789', 'TRAV-2025-PROY1-ACTA', '{"dictamen": "Aprobado", "puntaje": 85.50}'),
(3, 'd2222222-1111-2222-2222-222222222222', 'PROTOCOLO_INVESTIGACION', 1, '22222222-2222-2222-2222-222222222222', 'Proyecto', 'Protocolo Oficial - Fotovoltaico', 4, 'sistema', 'uploads/documentos/protocolo_fotovoltaico_proy2.pdf', 'hash_p2_pdf_firmado_abc', 'TRAV-2025-PROY2-PROT', '{"titulo": "Iluminación Solar Fotovoltaica", "autor": "Freddy Baño"}'),
(4, 'd2222222-2222-2222-2222-222222222222', 'INFORME_FINAL_INVESTIGACION', 1, '22222222-2222-2222-2222-222222222222', 'Proyecto', 'Informe Final - Fotovoltaico', 4, '1802707511', 'uploads/documentos/informe_final_fotovoltaico_proy2.pdf', 'hash_p2_informefinal_pdf_firmado_xyz', 'TRAV-2026-PROY2-FINAL', '{"resultado": "Exitoso", "tasa_ahorro": "100% perimetral"}'),
-- Instancias para los informes de avance de Proyecto 1 (CACES Compliance)
(6, 'd1111111-3333-1111-1111-111111111111', 'INFORME_AVANCE', 1, 'ff111111-2222-3333-4444-555555555555', 'Informe', 'Informe de Avance #1 — Monitoreo IoT', 4, 'sistema', 'uploads/documentos/informe_avance_1_proy1.pdf', 'hash_inf1_pdf_firmado', 'TRAV-2025-PROY1-INF1', '{"resumen": "Fase de diseño finalizada"}'),
(7, 'd1111111-4444-1111-1111-111111111111', 'INFORME_AVANCE', 1, 'ff222222-2222-3333-4444-555555555555', 'Informe', 'Informe de Avance #2 — Monitoreo IoT', 1, '1718161126', NULL, NULL, 'TRAV-2025-PROY1-INF2', '{"resumen": "Calibración de sensores"}'),
(8, 'd1111111-5555-1111-1111-111111111111', 'INFORME_AVANCE', 1, 'ff666666-2222-3333-4444-555555555555', 'Informe', 'Informe de Avance #3 — Monitoreo IoT', 1, '1718161126', NULL, NULL, 'TRAV-2025-PROY1-INF3', '{"resumen": "Integración backend/frontend"}'),
-- Instancia del Protocolo para el Proyecto 4 (Borrador) para soportar CoWork comentarios y sección Team Pulse
(5, 'd4444444-1111-4444-4444-444444444444', 'PROTOCOLO_INVESTIGACION', 1, '44444444-4444-4444-4444-444444444444', 'Proyecto', 'Protocolo Oficial - Asistente Virtual IA', 1, 'sistema', NULL, NULL, 'TRAV-2026-PROY4-PROT', '{"titulo": "Asistente Virtual Conversacional basado en IA"}');

-- Firmas Electrónicas (Cumple regulaciones del validador de FirmaEC)
INSERT INTO inv_documentos_firmas (documento_uuid, firmante_id, firmante_rol, fecha_firma, firma_metadata, archivo_pdf_firmado, es_valida) VALUES
('d1111111-1111-1111-1111-111111111111', '1718161126', 'Director de Proyecto', '2025-06-18 10:15:00', '{"CN":"GIOVANNY NARANJO","SERIALNUMBER":"1718161126","O":"TRAVERSARI","ISSUER":"UANATACA CA"}', 'uploads/documentos/protocolo_iot_proy1_firmado_dir.pdf', 1),
('d1111111-2222-1111-1111-111111111111', '0302144159', 'Director de Investigación', '2025-06-20 09:30:00', '{"CN":"ESTEFANI SANCHEZ","SERIALNUMBER":"0302144159","O":"TRAVERSARI","ISSUER":"SECURITY DATA CA"}', 'uploads/documentos/acta_aprobacion_proy1_firmada.pdf', 1),
('d2222222-1111-2222-2222-222222222222', '1802707511', 'Director de Proyecto', '2025-06-20 14:00:00', '{"CN":"FREDDY BAÑO","SERIALNUMBER":"1802707511","O":"TRAVERSARI","ISSUER":"BANCO CENTRAL CA"}', 'uploads/documentos/protocolo_fotovoltaico_proy2_firmado_dir.pdf', 1),
('d2222222-2222-2222-2222-222222222222', '1802707511', 'Director de Proyecto', '2026-01-04 10:15:00', '{"CN":"FREDDY BAÑO","SERIALNUMBER":"1802707511","O":"TRAVERSARI","ISSUER":"BANCO CENTRAL CA"}', 'uploads/documentos/informe_final_proy2_firmado_dir.pdf', 1),
('d2222222-2222-2222-2222-222222222222', '0302144159', 'Director de Investigación', '2026-01-05 16:15:00', '{"CN":"ESTEFANI SANCHEZ","SERIALNUMBER":"0302144159","O":"TRAVERSARI","ISSUER":"SECURITY DATA CA"}', 'uploads/documentos/informe_final_proy2_firmado_completo.pdf', 1);

-- Auditoría CACES de compilación documental
INSERT INTO inv_document_audit (traceability_code, template_code, template_version, project_uuid, entity_uuid, generated_by, generated_at, was_blind_mode, file_name, file_hash, data_snapshot_json) VALUES
('TRAV-2025-PROY1-PROT', 'PROTOCOLO_INVESTIGACION', 1, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'sistema', '2025-06-18 10:15:00', 0, 'protocolo_iot_proy1.pdf', 'hash_p1_pdf_firmado_123456', '{"titulo": "Monitoreo IoT"}'),
('TRAV-2025-PROY1-ACTA', 'DICTAMEN_ARBITRAJE', 1, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'sistema', '2025-06-20 09:30:00', 1, 'acta_aprobacion_proy1.pdf', 'hash_p1_acta_aprobacion_firmado_789', '{"dictamen": "Aprobado"}');

-- 19. Trazabilidad Forense de Proyectos (Blockchain-like Chain)
INSERT INTO inv_trazabilidad_proyectos (uuid, idProyecto, idUsuario, estadoAnterior, estadoNuevo, observacion, fechaTransicion, hashAnterior, hashActual) VALUES
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Borrador', 'Enviado', 'Se completa postulación con presupuesto y cronograma.', '2025-05-10 10:00:00', '0000000000000000000000000000000000000000000000000000000000000000', 'd7a8fbb307d7809469ca9abcb08a41031f01c8a143a2e92c2b3f120f269a84ef'),
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Enviado', 'En Revisión', 'Asignación de pares evaluadores internos y externos.', '2025-05-15 11:20:00', 'd7a8fbb307d7809469ca9abcb08a41031f01c8a143a2e92c2b3f120f269a84ef', 'e1189ac9cfc8b1836109dfbc18c0df1b89efbc1a78eeffb18928f921f92e8412'),
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'En Revisión', 'Aprobado', 'Calificación de 85.5/100 promedio. Acta de aprobación emitida.', '2025-06-20 09:30:00', 'e1189ac9cfc8b1836109dfbc18c0df1b89efbc1a78eeffb18928f921f92e8412', 'f82bbcbff18acb9eef89283f12e840afbc89e81bfafeff093b128afc298ec289'),
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Aprobado', 'En Ejecución', 'Contrato de fondos firmado, desembolso inicial coordinado.', '2025-07-01 09:00:00', 'f82bbcbff18acb9eef89283f12e840afbc89e81bfafeff093b128afc298ec289', 'a12bc90fe838efca839ea12bfaec09e20a9bfedcba91bfadcf928eef920fe1a8');

-- 20. Poblar Documentos Colaborativos CoWork (Yjs + SignalR persistencia)
INSERT INTO inv_cowork_documentos (uuid, entidadTipo, entidadUuid, campoNombre, yjsState, contentHtml, contentJson, version) VALUES
(UUID(), 'PROYECTO', '44444444-4444-4444-4444-444444444444', 'antecedentes', NULL, '<p>El departamento de bienestar estudiantil del IST Traversari ha identificado un incremento del 40% en consultas rutinarias sobre matrículas y reglamentos.</p>', '{"text": "El departamento de bienestar estudiantil..."}', 1),
(UUID(), 'PROYECTO', '44444444-4444-4444-4444-444444444444', 'justificacion', NULL, '<p>La automatización de respuestas reduce de manera sustancial la fatiga del personal y ofrece respuestas inmediatas e ininterrumpidas a los alumnos.</p>', '{"text": "La automatización de respuestas..."}', 1),
(UUID(), 'PROYECTO', '44444444-4444-4444-4444-444444444444', 'metodologia', NULL, '<p>Se aplicará un pipeline RAG con modelos GPT-4o mini y base vectorial Qdrant, encapsulado en un chatbot interactivo integrado en la plataforma web.</p>', '{"text": "Se aplicará un pipeline RAG..."}', 1);

-- 20.1 Comentarios Colaborativos (Hilo de Discusión en CoWork) para la instancia del Proyecto 4
INSERT INTO inv_collaboration_comments (idComment, instanceUuid, userUuid, userName, content, parentId, creadoEn) VALUES
(1, 'd4444444-1111-4444-4444-444444444444', '1718161126', 'Giovanny Naranjo', 'Estefani, por favor revisa la metodología RAG planteada, ¿crees que la base de datos vectorial Qdrant sea suficiente para las consultas de los estudiantes?', NULL, '2026-04-16 10:00:00'),
(2, 'd4444444-1111-4444-4444-444444444444', '0302144159', 'Estefani Sanchez', 'Sí, Giovanny. He revisado las pruebas de latencia y Qdrant responde en menos de 50ms para 10k embeddings. Es ideal. Agregué una justificación sobre esto.', 1, '2026-04-16 10:30:00'),
(3, 'd4444444-1111-4444-4444-444444444444', '1724649338', 'Freddy Baño', 'Excelente equipo. Recuerden detallar los modelos fundacionales que usaremos en la sección de antecedentes.', NULL, '2026-04-17 09:15:00');

-- 20.2 Estados de Secciones (Team Pulse) para la instancia del Proyecto 4
INSERT INTO inv_documentos_secciones_metadata (idMetadata, instanceUuid, sectionName, status, lastUserUuid, lastUserName, actualizadoEn) VALUES
(1, 'd4444444-1111-4444-4444-444444444444', 'antecedentes', 'Aprobado', '1718161126', 'Giovanny Naranjo', '2026-04-17 09:00:00'),
(2, 'd4444444-1111-4444-4444-444444444444', 'justificacion', 'Revisión', '0302144159', 'Estefani Sanchez', '2026-04-17 09:15:00'),
(3, 'd4444444-1111-4444-4444-444444444444', 'metodologia', 'Borrador', '1718161126', 'Giovanny Naranjo', '2026-04-17 09:20:00');

-- 21. Poblar Notificaciones de Usuario
INSERT INTO inv_notificaciones (uuid, idProyecto, destinatario, tipoDestinatario, categoria, prioridad, titulo, mensaje, urlAccion, leido, fechaEnvio) VALUES
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Usuario', 'SISTEMA', 'NORMAL', 'Firma de Contrato Habilitada', 'El contrato de asignación de fondos del proyecto PROY-SOFT-2025-001 está listo para su firma.', '/investigacion/proyectos', 0, '2025-06-25 10:00:00'),
(UUID(), 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Usuario', 'EVALUACION', 'ALTA', 'Discordancia en Evaluaciones', 'Se ha convocado un árbitro dirimente para resolver el dictamen del proyecto PROY-RED-2026-005.', '/investigacion/arbitraje', 0, '2026-05-20 12:00:00'),
(UUID(), 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Usuario', 'SISTEMA', 'BAJA', 'Proyecto Aprobado por Comité', 'Su propuesta PROY-ADM-2025-003 ha sido aprobada con 78/100 puntos.', '/investigacion/proyectos', 1, '2025-06-26 15:00:00');

-- 22. Poblar Consentimientos de LOPDP (Auditoría legal obligatoria en Ecuador)
INSERT INTO inv_lopdp_consentimientos (uuid, idUsuario, versionPolitica, canal, fechaConsentimiento, ipDireccion, userAgent, firmaHash, estado) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'v1.2', 'Web', '2025-01-10 09:00:00', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'hash_consentimiento_sha256_naranjo', 'Otorgado'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'v1.2', 'Web', '2025-01-12 10:30:00', '192.168.1.55', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'hash_consentimiento_sha256_bano', 'Otorgado'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'v1.2', 'Web', '2025-01-15 11:00:00', '192.168.1.60', 'Mozilla/5.0 (Linux; Android 13)', 'hash_consentimiento_sha256_sanchez', 'Otorgado');

-- 23. LOPDP Trazabilidad forense de visualización de datos sensibles
INSERT INTO inv_lopdp_auditoria_datos (uuid, idUsuarioActor, idUsuarioAfectado, tablaAfectada, columnaAfectada, operacion, motivo, ipDireccion, userAgent, fechaAcceso) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'inv_usuarios_metadata', 'rutaFirmaP12', 'LECTURA', 'Validación del certificado digital para firma del acta de inicio.', '192.168.1.60', 'Mozilla/5.0', '2025-07-01 09:20:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'inv_usuarios_metadata', 'rutaFirmaP12', 'LECTURA', 'Verificación de firma electrónica en informe final de proyecto.', '192.168.1.60', 'Mozilla/5.0', '2026-01-05 16:10:00');

-- 24. Bitácora de Copias de Respaldo de Base de Datos (Seguridad Enterprise)
INSERT INTO inv_backup_logs (uuid, fechaBackup, tipo, destino, nombreArchivo, tamanioBytes, estado, hashVerificacion, errorMensaje, ejecutadoPor) VALUES
(UUID(), '2026-06-01 02:00:00', 'BaseDatos', 'Local', 'sigafi_es_backup_20260601.sql', 15480000, 'Exitoso', 'sha256_hash_backup_20260601_xyz', NULL, NULL),
(UUID(), '2026-06-02 02:00:00', 'BaseDatos', 'Local', 'sigafi_es_backup_20260602.sql', 15495000, 'Exitoso', 'sha256_hash_backup_20260602_abc', NULL, NULL);

-- 25. Poblar Transferencias Tecnológicas (Vinculación e Innovación)
INSERT INTO inv_transferencias (idProyecto, entidadReceptora, numeroConvenio, fechaConvenio, descripcion) VALUES
(2, 'Corporación Eléctrica del Ecuador CELEC EP', 'CONV-TRAV-CELEC-2026-01', '2026-01-10', 'Transferencia tecnológica y cesión de uso del Manual de Operación Energética y software de control fotovoltaico para iluminación autónoma.');

-- Re-activar verificación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;
