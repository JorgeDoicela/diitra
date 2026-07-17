USE sigafi_es;
 
SET FOREIGN_KEY_CHECKS = 0;
 
-- 1. Limpieza de tablas de proyectos, productos, presupuestos, etc.
TRUNCATE TABLE inv_proyectos_carreras;
TRUNCATE TABLE inv_proyecto_participantes;
TRUNCATE TABLE inv_productos;
TRUNCATE TABLE inv_presupuesto_items;
TRUNCATE TABLE inv_informes_avance;
TRUNCATE TABLE inv_evidencias;
TRUNCATE TABLE inv_gastos;
TRUNCATE TABLE inv_objetivos_proyecto;
TRUNCATE TABLE inv_proyectos_ods;
TRUNCATE TABLE inv_proyectos_mml;
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
 
-- 1.5. Asegurar usuarios requeridos en tabla central
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
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE CONVERT(u.idSigafi USING utf8mb4) = v.idSigafi);
 
-- 2. Poblar Sublíneas de Investigación
INSERT INTO inv_sublineas (idSublinea, uuid, idLinea, nombre, activo) VALUES
(1, UUID(), 1, 'Inteligencia Artificial y Aprendizaje Automático Aplicado', 1),
(2, UUID(), 1, 'Desarrollo de Software Multiplataforma y Computación en la Nube', 1),
(3, UUID(), 4, 'Sistemas Solares Fotovoltaicos y Eficiencia Energética', 1),
(4, UUID(), 2, 'Gestión de Procesos y Modelos de Negocio Innovadores', 1),
(5, UUID(), 2, 'Gestión del Talento Humano y Productividad Laboral', 1),
(6, UUID(), 3, 'Seguridad Informática y Redes de Próxima Generación', 1),
(7, UUID(), 5, 'Plataformas Educativas y Tecnologías Emergentes en el Aula', 1),
(8, UUID(), 7, 'Marketing Digital y Comercio Electrónico para MIPYMES', 1),
(9, UUID(), 6, 'Patrimonio Alimentario y Técnicas Gastronómicas Ancestrales', 1);
 
-- 3. Poblar Entidades Externas
INSERT INTO inv_entidades_externas (idEntidad, uuid, ruc, razonSocial, tipo, sector, contactoNombre, contactoEmail, activo) VALUES
(1, UUID(), '1790012345001', 'Novacero S.A.', 'Privada', 'Siderúrgico y Manufactura', 'Ing. Carlos Mendoza', 'carlos.mendoza@novacero.com', 1),
(2, UUID(), '1760001550001', 'Corporación Eléctrica del Ecuador CELEC EP', 'Pública', 'Energía y Electricidad', 'Ing. María Elena Silva', 'maria.silva@celec.gob.ec', 1),
(3, UUID(), '1790842245001', 'Conecel S.A. (Claro Ecuador)', 'Privada', 'Telecomunicaciones', 'Ing. Juan Carlos Torres', 'juan.torres@claro.com.ec', 1),
(4, UUID(), '1768152560001', 'Corporación Nacional de Telecomunicaciones CNT EP', 'Pública', 'Telecomunicaciones', 'Ing. David Pazo', 'david.pazo@cnt.gob.ec', 1),
(5, UUID(), '1790007890001', 'Banco Pichincha C.A.', 'Privada', 'Bancario y Financiero', 'Dra. Patricia Ortiz', 'portiz@pichincha.com', 1);
 
-- 4. Poblar Perfiles de Investigadores
INSERT INTO inv_usuarios_metadata (uuid, idUsuario, orcidId, scopusId, googleScholarUrl, researchGateUrl, especialidad, gradoAcademicoMaximo, aceptoTerminosFirma, fechaConsentimientoFirma) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), '0000-0002-1824-331X', '57204481900', 'https://scholar.google.com/citations?user=gnaranjo', 'https://www.researchgate.net/profile/Giovanny_Naranjo', 'Inteligencia Artificial y Desarrollo de Software', 'PhD en Ciencias de la Computación', 1, '2025-01-10 09:00:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), '0000-0003-0914-458X', '57211029400', 'https://scholar.google.com/citations?user=fbano', 'https://www.researchgate.net/profile/Freddy_Bano', 'Energías Renovables y Control de Procesos', 'Magíster en Electrónica e Instrumentación', 1, '2025-01-12 10:30:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), '0000-0001-8845-2147', '57195482600', 'https://scholar.google.com/citations?user=esanchez', 'https://www.researchgate.net/profile/Estefani_Sanchez', 'Sistemas de Información y Gestión Tecnológica', 'Magíster en Gestión de la Tecnología', 1, '2025-01-15 11:00:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), '0000-0002-1245-0987', NULL, NULL, NULL, 'Eficiencia Energética y Redes Inteligentes', 'Magíster en Energías Renovables', 1, '2025-01-15 11:30:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), '0000-0001-9954-1234', NULL, NULL, NULL, 'Gestión de Talento Humano y Clima Laboral', 'Magíster en Administración de Empresas', 1, '2025-02-18 09:00:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1720477031' LIMIT 1), '0000-0002-8822-1234', NULL, NULL, NULL, 'Gastronomía Tradicional y Bromatología', 'Magíster en Gastronomía y Alimentos', 1, '2025-02-20 09:30:00');
 
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
(1, 1), (1, 3),
(2, 4),
(3, 2), (3, 5),
(4, 3), (4, 1),
(5, 6), (5, 5);
 
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
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Director de Proyecto', 1, '2025-01-10'),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 'Co-Investigador', 1, '2025-01-15'),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555377' LIMIT 1), 'Semillerista', 1, '2025-01-20'),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Director de Proyecto', 1, '2025-01-12'),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), 'Co-Investigador', 1, '2025-01-15'),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0102598570' LIMIT 1), 'Semillerista', 1, '2025-01-22'),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Director de Proyecto', 1, '2025-02-15'),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 'Co-Investigador', 1, '2025-02-18'),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1751325000' LIMIT 1), 'Semillerista', 1, '2025-02-20'),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 'Director de Proyecto', 1, '2025-03-01'),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Co-Investigador', 1, '2025-03-05'),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0103057584' LIMIT 1), 'Semillerista', 1, '2025-03-10'),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719322149' LIMIT 1), 'Director de Proyecto', 1, '2025-03-10'),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1720477031' LIMIT 1), 'Co-Investigador', 1, '2025-03-12'),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0105057335' LIMIT 1), 'Semillerista', 1, '2025-03-15');
 
-- 6. Poblar Convocatorias
INSERT INTO inv_convocatorias (idConvocatoria, uuid, codigoConvocatoria, titulo, idPeriodo, fechaApertura, fechaCierre, anio, descripcion, urlBases, requisitosMinimos, idTipoConvocatoria, estado) VALUES
(1, '84f8846c-c918-406b-a25e-336ff326e632', 'CONV-2025-I', 'Convocatoria Proyectos de Investigación y Desarrollo 2025-I', 'ABD2025', '2025-04-15', '2025-06-15', '2025', 'Convocatoria abierta para el financiamiento de proyectos aplicados de I+D en el IST Traversari', 'https://bases.traversari.edu.ec/2025-I', 'Poseer título de tercer nivel y pertenecer a un grupo de investigación', 1, 'Cerrada'),
(2, '9fb183ea-e522-4828-98e3-841853ad76aa', 'CONV-2026-I', 'Convocatoria Proyectos de Innovación Tecnológica 2026-I', 'ABR2026', '2026-04-10', '2026-06-10', '2026', 'Enfoque en desarrollo de software, prototipos de hardware y transferencia tecnológica', 'https://bases.traversari.edu.ec/2026-I', 'Tener grupo de investigación registrado o semillero activo', 2, 'Abierta');
 
-- 7. Poblar Proyectos
INSERT INTO inv_proyectos (idProyecto, uuid, idConvocatoria, codigoInstitucional, titulo, idSublinea, idPrograma, idGrupo, tieneGrupo, idTipo, fechaPresentacion, fechaInicio, fechaFin, tiempoEjecucion, estado, disponibleAdopcion, puntajeEvaluacion, valorEjecucion, idObjetivoPnd, idEntidadAliada, trlInicial, trlActual, trlMeta, hashActaAprobacion, fechaAprobacion, firmadoPor, idDspaceHandle, metadataCacesJson) VALUES
(1, '11111111-1111-1111-1111-111111111111', 1, 'PROY-SOFT-2025-001',
 'Desarrollo de una Plataforma IoT con Inteligencia Artificial para el Monitoreo del Consumo Eléctrico Doméstico en el IST Traversari',
 1, 1, 1, 1, 2, '2025-05-10', '2025-07-01', '2026-01-01', '6 meses', 'En Ejecución', 0, 85.50, 3200.00, 3, 3, 2, 5, 6,
 '3f78ec90141f22e84c1fbc0d16f8ef190a421b8ff120f269ad3f82163b86029d5', '2025-06-20 09:30:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), '123456789/104',
 '{"descripcionProyecto": "Desarrollo de hardware de sensado y una plataforma web con modelos de redes neuronales recursivas para la clasificación automática de cargas y predicción de consumo eléctrico domiciliar.", "antecedentes": "El desperdicio de energía eléctrica en hogares de Quito asciende al 15% debido a la falta de información desagregada sobre el consumo de electrodomésticos en tiempo real...", "justificacion": "Este proyecto permite reducir la facturación eléctrica de las familias y ayuda al instituto a acreditar en los estándares de vinculación tecnológica del CACES...", "marcoTeorico": "Estudios previos muestran que las redes neuronales LSTM alcanzan un 92% de precisión en la desagregación de carga no intrusiva (NILM)...", "metodologia": "Se implementará una metodología ágil XP. Se utilizarán microcontroladores ESP32, sensores SCT-013 y una arquitectura backend basada en ASP.NET Core y Python...", "metodoEvaluacion": "Comparación del consumo histórico mensual facturado versus el consumo optimizado post-instalación de alertas tempranas en una muestra piloto de 10 hogares."}'),
 
(2, '22222222-2222-2222-2222-222222222222', 1, 'PROY-ENE-2025-002',
 'Implementación de un Sistema Solar Fotovoltaico Autónomo para la Iluminación del Campus Traversari Quito',
 3, 2, 2, 1, 2, '2025-05-12', '2025-07-05', '2026-01-05', '6 meses', 'Finalizado', 0, 92.00, 6500.00, 2, 2, 3, 7, 7,
 'f82bbcbff18acb9eef89283f12e840afbc89e81bfafeff093b128afc298ec289', '2025-06-22 10:45:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), '123456789/104',
 '{"descripcionProyecto": "Diseño, cálculo y puesta en marcha de un sistema de paneles solares fotovoltaicos con banco de baterías para alimentar la iluminación perimetral del campus Traversari, reduciendo la huella de carbono institucional.", "antecedentes": "El campus de Quito del IST Traversari experimenta cortes intermitentes de energía y una alta facturación en iluminación externa...", "justificacion": "Garantiza la continuidad operativa de la iluminación externa de seguridad y sirve como laboratorio vivo para los estudiantes de la carrera de Electrónica...", "marcoTeorico": "La radiación solar media en Quito es de 4.8 kWh/m²/día, lo cual hace altamente viable la generación distribuida autónoma...", "metodologia": "Metodología experimental: 1. Dimensionamiento de la carga, 2. Selección de módulos monocristalinos e inversor, 3. Instalación física, 4. Pruebas de descarga profunda de baterías.", "metodoEvaluacion": "Medición diaria del rendimiento del sistema en kWh generados y ahorro porcentual respecto a la red de distribución eléctrica pública."}'),
 
(3, '33333333-3333-3333-3333-333333333333', 1, 'PROY-ADM-2025-003',
 'Estudio del Impacto del Teletrabajo en la Productividad del Claustro Docente en Institutos Tecnológicos de Quito',
 5, 3, 3, 1, 1, '2025-05-15', '2025-07-10', '2026-01-10', '6 meses', 'Aprobado', 0, 78.00, 1200.00, 4, NULL, 1, 3, 4,
 'a12bc90fe838efca839ea12bfaec09e20a9bfedcba91bfadcf928eef920fe1a8', '2025-06-25 11:15:00', (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), NULL,
 '{"descripcionProyecto": "Investigación empírica y análisis correlacional del desempeño laboral docente bajo esquemas mixtos de teletrabajo en institutos de Pichincha.", "antecedentes": "La transición abrupta al teletrabajo generó cambios significativos en el clima organizacional y la productividad de los docentes universitarios y tecnológicos...", "justificacion": "Permite diseñar políticas internas de bienestar y optimización de distributivos horarios conforme a la normativa vigente del CES...", "marcoTeorico": "Se revisarán los modelos de balance vida-trabajo de Greenhaus y las escalas de productividad de Koopmans aplicados al sector educativo...", "metodologia": "Investigación no experimental, de corte transversal, utilizando encuestas estructuradas a 120 docentes de 5 institutos tecnológicos de Quito y análisis con SPSS.", "metodoEvaluacion": "Validación de hipótesis de correlación mediante pruebas de Chi-cuadrado y coeficientes R de Pearson entre variables de clima y metas cumplidas."}'),
 
(4, '44444444-4444-4444-4444-444444444444', 2, 'PROY-SOFT-2026-004',
 'Desarrollo de un Asistente Virtual Conversacional basado en IA para la Gestión Académica de Estudiantes en el IST Traversari',
 2, 1, 1, 1, 2, '2026-04-15', '2026-07-01', '2027-01-01', '6 meses', 'Borrador', 0, NULL, 0.00, 3, NULL, 2, 2, 5,
 NULL, NULL, NULL, NULL,
 '{"descripcionProyecto": "Diseño de un asistente virtual inteligente basado en modelos de lenguaje (LLM) y técnicas de generación aumentada por recuperación (RAG) para automatizar la atención a estudiantes sobre trámites académicos, calendarios y reglamentos institucionales.", "antecedentes": "El departamento de bienestar estudiantil y secretaría del IST Traversari registra saturación en canales de consulta rutinaria...", "justificacion": "Mejora los tiempos de respuesta estudiantil de horas a segundos, liberando tiempo administrativo para casos de atención compleja...", "marcoTeorico": "La arquitectura RAG permite mitigar alucinaciones de modelos de lenguaje mediante inyección de contexto de bases de conocimiento oficiales...", "metodologia": "Desarrollo incremental bajo metodología SCRUM: 1. Curación de reglamentos institucionales, 2. Embeddings y base de datos vectorial, 3. Orquestación con LangChain y API de chat, 4. Frontend web interactivo.", "metodoEvaluacion": "Evaluación de precisión conversacional utilizando el framework Ragas y encuestas de usabilidad y satisfacción de estudiantes."}'),
 
(5, '55555555-5555-5555-5555-555555555555', 2, 'PROY-RED-2026-005',
 'Diseño y Construcción de un Prototipo para la Detección Temprana de Fallas Eléctricas en Laboratorios de Electrónica del IST Traversari',
 6, 1, 1, 1, 2, '2026-04-20', '2026-07-05', '2027-01-05', '6 meses', 'En Revisión', 0, NULL, 500.00, 2, 1, 2, 3, 6,
 NULL, NULL, NULL, NULL,
 '{"descripcionProyecto": "Construcción de hardware detector con microcontrolador y análisis de señales de corriente para la desconexión preventiva de mesas de trabajo en laboratorios ante transitorios y cortocircuitos.", "antecedentes": "Los laboratorios de electrónica sufren constantes daños en sus osciloscopios y fuentes debido a cortocircuitos accidentales cometidos por estudiantes en prácticas...", "justificacion": "Protege los activos tecnológicos del instituto y reduce costos de mantenimiento correctivo de laboratorios...", "marcoTeorico": "Los transitorios de corriente y sobretensiones en microsegundos pueden detectarse mediante comparadores analógicos rápidos y optoacopladores de aislamiento...", "metodologia": "Diseño del PCB en Altium, fabricación del prototipo, integración de relevadores de estado sólido de disparo rápido y pruebas controladas con cargas inductivas.", "metodoEvaluacion": "Tiempo promedio de respuesta en milisegundos desde la detección del corto hasta la apertura del circuito."}'),
 
(6, '66666666-6666-6666-6666-666666666666', 1, 'PROY-MKT-2025-006',
 'Estrategias de Marketing Digital para la Reactivación Comercial de las MIPYMES de la Parroquia Traversari en Quito',
 8, 3, 3, 1, 1, '2025-05-18', '2025-07-15', '2026-01-15', '6 meses', 'Rechazado', 0, 62.50, 0.00, 5, NULL, 1, 1, 3,
 NULL, NULL, NULL, NULL,
 '{"descripcionProyecto": "Formulación e implementación de planes de comercio electrónico y marketing digital para un grupo de 15 microempresas del sector de influencia del instituto en el sur de Quito.", "antecedentes": "La baja adopción digital de las MIPYMES locales limita su crecimiento comercial y competitividad...", "justificacion": "Vincula la academia con las microempresas del sector para dinamizar la economía local post-crisis...", "marcoTeorico": "Los modelos de adopción tecnológica TAM aplicados a microempresarios demuestran que la facilidad de uso percibida es clave...", "metodologia": "Capacitación a microempresarios, diseño de catálogos web de bajo costo y configuración de canales de WhatsApp Business y redes sociales.", "metodoEvaluacion": "Incremento porcentual estimado de ventas y nivel de tráfico en los canales digitales configurados."}'),
 
(7, '77777777-7777-7777-7777-777777777777', 1, 'PROY-GAS-2025-007',
 'Estudio y Preservación de Técnicas Culinarias Ancestrales en el Distrito Metropolitano de Quito',
 9, 3, 5, 1, 2, '2025-05-20', '2025-07-20', '2026-01-20', '6 meses', 'Inconcluso', 1, NULL, 0.00, 2, NULL, 1, 2, 3,
 NULL, NULL, NULL, NULL,
 '{"descripcionProyecto": "Investigación histórica, etnográfica y experimental de la culinaria prehispánica del norte de Pichincha, documentando recetas y procesos químicos de fermentación tradicional.", "antecedentes": "La globalización alimentaria desplaza la cocina tradicional quiteña, perdiendo técnicas de fermentación ancestrales como la chicha de jora o la preparación del machica...", "justificacion": "Permite salvaguardar el patrimonio inmaterial y nutrir la malla académica de la carrera de Gastronomía con conocimientos vernáculos...", "marcoTeorico": "Estudios bromatológicos de la fermentación láctica de granos andinos demuestran propiedades nutricionales y probióticas excepcionales...", "metodologia": "Entrevistas etnográficas en comunas ancestrales de Quito (Pomasqui, Calderón) y pruebas de laboratorio bromatológico para caracterizar las propiedades físico-químicas de las recetas.", "metodoEvaluacion": "Registro detallado en un catálogo técnico gastronómico y publicación de un recetario estandarizado."}');
 
-- Relaciones de Proyectos con Carreras
INSERT INTO inv_proyectos_carreras (idProyecto, idCarrera, modalidad) VALUES
(1, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1), 'Presencial'),
(2, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1), 'Dual'),
(3, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'EMP' LIMIT 1), 'Presencial'),
(4, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1), 'Virtual'),
(5, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'ELT' LIMIT 1), 'Presencial'),
(6, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'MKT' LIMIT 1), 'Presencial'),
(7, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'GAS' LIMIT 1), 'Presencial');
 
-- Participantes del proyecto (Docentes y Alumnos)
INSERT INTO inv_proyecto_participantes (idProyecto, idUsuario, tipoParticipante, esDirector, rol, nivelAcademico, telefono, horasSemanales, activo) VALUES
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 12.0, 1),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Docente', 0, 'Co-Investigador', 'Magíster en TI', '0999999992', 8.0, 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 15.0, 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802989226' LIMIT 1), 'Docente', 0, 'Co-Investigador', 'Magíster en Energías', '0999999994', 10.0, 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Talento Humano', '0999999992', 10.0, 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 'Docente', 0, 'Co-Investigador', 'Magíster en Administración', '0999999995', 8.0, 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 10.0, 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1724649338' LIMIT 1), 'Docente', 0, 'Co-Investigador', 'Magíster en TI', '0999999996', 6.0, 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 12.0, 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Docente', 0, 'Co-Investigador', 'Magíster en Software', '0999999991', 8.0, 1),
(6, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1719134759' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Administración', '0999999995', 8.0, 1),
(1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555377' LIMIT 1), 'Alumno', 0, 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888881', NULL, 1),
(2, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0102598570' LIMIT 1), 'Alumno', 0, 'Semillerista', 'Estudiante de Electrónica', '0988888882', NULL, 1),
(3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1751325000' LIMIT 1), 'Alumno', 0, 'Semillerista', 'Estudiante de Gestión Empresarial', '0988888883', NULL, 1),
(4, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0105057335' LIMIT 1), 'Alumno', 0, 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888884', NULL, 1),
(5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0103057584' LIMIT 1), 'Alumno', 0, 'Semillerista', 'Estudiante de Electrónica', '0988888885', NULL, 1);
 
-- Documentos Adjuntos del Proyecto
INSERT INTO inv_proyectos_documentos_adjuntos (idDocAdj, uuid, idProyecto, nombreArchivo, rutaArchivo) VALUES
(1, UUID(), 1, 'protocolo_iot_proy1_firmado.pdf', 'uploads/proyectos/1/protocolo_iot_proy1_firmado.pdf'),
(2, UUID(), 1, 'carta_aval_giist_proy1.pdf', 'uploads/proyectos/1/carta_aval_giist_proy1.pdf'),
(3, UUID(), 1, 'certificado_no_adeudar_naranjo.pdf', 'uploads/proyectos/1/certificado_no_adeudar_naranjo.pdf'),
(4, UUID(), 2, 'protocolo_fotovoltaico_proy2.pdf', 'uploads/proyectos/2/protocolo_fotovoltaico_proy2.pdf'),
(5, UUID(), 2, 'carta_aval_gersa_proy2.pdf', 'uploads/proyectos/2/carta_aval_gersa_proy2.pdf'),
(6, UUID(), 3, 'protocolo_teletrabajo_proy3.pdf', 'uploads/proyectos/3/protocolo_teletrabajo_proy3.pdf'),
(7, UUID(), 3, 'carta_aval_sige_proy3.pdf', 'uploads/proyectos/3/carta_aval_sige_proy3.pdf');
 
-- 8. Poblar Objetivos de Proyecto
INSERT INTO inv_objetivos_proyecto (idObjetivo, idProyecto, esGeneral, descripcion, orden) VALUES
(1, 1, 1, 'Desarrollar una plataforma IoT y modelos de inteligencia artificial para la monitorización de la demanda eléctrica y desagregación de cargas en entornos residenciales en el Distrito Metropolitano de Quito.', 1),
(2, 1, 0, 'Diseñar y ensamblar hardware de adquisición de datos basado en ESP32 para medir corriente y voltaje en las acometidas eléctricas.', 2),
(3, 1, 0, 'Implementar una red neuronal LSTM para clasificar los electrodomésticos activos según sus firmas eléctricas de consumo.', 3),
(4, 1, 0, 'Desarrollar un dashboard web que presente el consumo detallado e implemente un sistema de notificaciones de desperdicios para los usuarios.', 4),
(5, 2, 1, 'Implementar un sistema de energía solar fotovoltaica autónomo de 3 kW de potencia para la iluminación externa e integral del campus del IST Traversari en Quito.', 1),
(6, 2, 0, 'Efectuar el cálculo de radiación e inclinación óptima de paneles monocristalinos en el área geográfica del campus.', 2),
(7, 2, 0, 'Montar físicamente 8 paneles solares, inversores de carga y un banco de almacenamiento energético de baterías de gel.', 3),
(8, 2, 0, 'Integrar sensores inteligentes para conmutación automática nocturna y monitoreo de la descarga del banco de baterías.', 4),
(9, 3, 1, 'Analizar la correlación del teletrabajo con los niveles de productividad del personal docente de los Institutos Tecnológicos de la ciudad de Quito durante el periodo académico 2024-2025.', 1),
(10, 3, 0, 'Diseñar e instrumentar encuestas validadas para medir variables de productividad, satisfacción laboral y balance familiar.', 2),
(11, 3, 0, 'Evaluar los resultados cuantitativos recolectados en una muestra de 120 docentes mediante el software estadístico SPSS.', 3),
(12, 5, 1, 'Diseñar un circuito de desconexión ultra rápido para laboratorios de electrónica basado en disparo analógico para mitigar cortocircuitos.', 1),
(13, 5, 0, 'Configurar el hardware comparador de sobre-corrientes mediante simulación en Proteus y diseño en Altium.', 2),
(14, 5, 0, 'Montar 5 prototipos físicos instalados en las mesas del Laboratorio de Electrónica para pruebas prácticas controladas.', 3),
(15, 8, 1, 'Implementar una metodología piloto y software de aseguramiento de calidad de evidencias bajo el nuevo modelo CACES para evaluar la pertinencia e impacto social de la investigación formativa en el IST Traversari.', 1),
(16, 8, 0, 'Diseñar una matriz de indicadores y métricas de calidad alineadas a los criterios del CACES de fomento a la investigación.', 2),
(17, 8, 0, 'Ejecutar auditorías y simular evaluaciones para validar el cumplimiento de los estándares del CACES con el personal docente y semilleristas.', 3);
 
-- 9. Poblar ODS asociados a Proyectos
INSERT INTO inv_proyectos_ods (idProyecto, idOds, objetivoEspecificoODS) VALUES
(1, 7, 'Garantizar el acceso a una energía asequible, segura, sostenible y moderna para todos mediante el uso de inteligencia artificial en hogares.'),
(1, 9, 'Fomentar la innovación tecnológica en infraestructura doméstica de medición eléctrica.'),
(2, 7, 'Aumentar sustancialmente la proporción de energía renovable en la iluminación del campus institucional Traversari.'),
(2, 13, 'Combatir el cambio climático reduciendo el consumo eléctrico institucional de fuentes fósiles.'),
(3, 8, 'Promover el crecimiento económico sostenido, inclusivo y sostenible, el empleo pleno y productivo y el trabajo decente para docentes bajo modal de teletrabajo.');
 
-- 10. Poblar Matriz de Marco Lógico (MML)
INSERT INTO inv_proyectos_mml (idMml, idProyecto, nivel, resumenNarrativo, indicadores, mediosVerificacion, supuestos) VALUES
(1, 1, 'Fin', 'Contribuir a la reducción del consumo energético y de las planillas de luz en el sector residencial de Quito.', 'Porcentaje acumulado de ahorro energético en el piloto.', 'Reportes consolidados de facturación eléctrica de la EEQ.', 'Los usuarios residenciales mantienen el interés de participar en el monitoreo diario.'),
(2, 1, 'Propósito', 'Usuarios domésticos del piloto adoptan prácticas eficientes mediante el uso del software IoT con análisis IA.', 'Reducción del 12% del consumo mensual en hogares monitoreados.', 'Estadísticas del dashboard de la plataforma web DIITRA.', 'El hardware de sensado opera ininterrumpidamente transmitiendo datos estables.'),
(3, 1, 'Componente', 'Hardware de medición y plataforma en la nube desarrollados e integrados.', 'Un prototipo funcional instalado y un servidor web procesando.', 'Bitácoras de calibración y pruebas de comunicación MQTT.', 'Disponibilidad de componentes electrónicos en el mercado local.'),
(4, 1, 'Actividad', 'Diseño de algoritmos de clasificación de cargas eléctricas (NILM) e interfaz web.', 'Horas dedicadas de desarrollo de software cumplidas.', 'Repositorio GitHub y reportes de avance de los semilleristas.', 'El equipo de desarrollo tiene acceso a laboratorios y servidores.'),
(5, 8, 'Fin', 'Acreditar con excelencia en los indicadores de investigación y vinculación institucional ante el CACES.', 'Cumplimiento del 100% de criterios de acreditación del área.', 'Informe de dictamen final de evaluación externa del CACES.', 'La institución asigna recursos presupuestarios suficientes.');
 
-- 11. Poblar Cronograma de Actividades
INSERT INTO inv_cronograma (uuid, idProyecto, idObjetivo, numeroActividad, descripcion, recursosNecesarios, responsable, entregable, fechaInicioPrevista, fechaFinPrevista, progreso, ponderacion, esEntregableCaces) VALUES
(UUID(), 1, 1, 1, 'Planificación y estado del arte', 'Revisión bibliográfica sobre algoritmos NILM y adquisición de hardware.', 'Giovanny Naranjo', 'Reporte de revisión bibliográfica', '2025-07-01', '2025-08-01', 100.00, 25.00, 1),
(UUID(), 1, 2, 2, 'Diseño de hardware e instrumentación', 'Ensamblaje del módulo ESP32 con sensores SCT-013.', 'Giovanny Naranjo', 'Prototipo eléctrico ensamblado', '2025-08-02', '2025-10-01', 100.00, 25.00, 1),
(UUID(), 1, 3, 3, 'Desarrollo de modelos de IA', 'Entrenamiento de redes neuronales recursivas en Python.', 'Giovanny Naranjo', 'Algoritmo LSTM entrenado', '2025-10-02', '2025-11-15', 75.00, 25.00, 1),
(UUID(), 1, 4, 4, 'Construcción del Dashboard Web', 'Integración del cliente web en React con la base de datos de telemetría.', 'Giovanny Naranjo', 'Dashboard React operativo', '2025-11-16', '2025-12-31', 20.00, 25.00, 1);
 
-- 12. Poblar Presupuesto del Proyecto
INSERT INTO inv_presupuesto_items (idItem, idProyecto, categoria, idPartida, detalle, cantidad, valorUnitario, esGastoCapital) VALUES
(1, 1, 'Equipos', '53.01.05', 'Microcontroladores ESP32 y sensores de corriente SCT-013', 10.00, 25.00, 1),
(2, 1, 'Materiales de Consumo', '53.08.04', 'Cables, fuentes de poder, protoboards y gabinetes plásticos', 1.00, 150.00, 0),
(3, 1, 'Servicios', '53.02.05', 'Servidor VPS en la nube para persistencia e IA por 6 meses', 1.00, 180.00, 0),
(4, 2, 'Equipos', '53.01.05', 'Paneles Solares Monocristalinos de 400W', 8.00, 250.00, 1),
(5, 2, 'Equipos', '53.01.05', 'Inversor de Carga Híbrido 3kW y baterías de gel 150Ah', 1.00, 1500.00, 1);
 
-- 13. Poblar Registro de Gastos Reales
INSERT INTO inv_gastos (idGasto, uuid, idProyecto, idItem, monto, fechaGasto, numeroFactura, descripcion, idEvidencia) VALUES
(1, UUID(), 1, 1, 250.00, '2025-07-15', 'FAC-001234', 'Adquisición de componentes electrónicos en local autorizado.', NULL),
(2, UUID(), 1, 2, 120.00, '2025-07-20', 'FAC-001235', 'Compra de insumos de cableado y placas de desarrollo.', NULL);
 
-- 14. Poblar Productos de Investigación
INSERT INTO inv_productos (idProducto, idProyecto, idTipoProducto, titulo, cantidad, urlProducto, esPropiedadIntelectual) VALUES
(1, 1, 1, 'Non-Intrusive Load Monitoring (NILM) Using LSTM Networks on Low-Cost Hardware', 1, 'https://scholar.google.com/citations?user=gnaranjo', 0),
(2, 2, 2, 'Banco Solar Traversari 3kW - Generador Autónomo', 1, 'https://evidencias.traversari.edu.ec/proy2/prototipo_solar.zip', 1);
 
-- 15. Poblar Informes de Avance
INSERT INTO inv_informes_avance (idInforme, uuid, idProyecto, numeroInforme, fechaReporte, resumenActividades, esFirmadoDigital, estado) VALUES
(1, UUID(), 1, 1, '2025-10-01', 'Se han completado los hitos de estado del arte y diseño eléctrico del prototipo de sensado.', 0, 'Aprobado');
 
-- 16. Poblar Trazabilidad de Estados
INSERT INTO inv_trazabilidad_proyectos (idTrazabilidad, uuid, idProyecto, idUsuario, estadoAnterior, estadoNuevo, observacion, fechaTransicion) VALUES
(1, UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Borrador', 'En Revisión', 'Envío de propuesta inicial.', '2025-05-10 14:00:00'),
(2, UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'En Revisión', 'Aprobado', 'Aprobado sin correcciones mayores.', '2025-06-20 09:30:00');
 
-- 17. Poblar Revisiones por Pares
INSERT INTO inv_revisiones_pares (idRevision, uuid, idProyecto, idRevisor, fechaAsignacion, fechaLimite, dictamenRevisor, estado, esExterno, puntajeTotal, observacionesGral) VALUES
(1, 'r1111111-2222-3333-4444-555555555555', 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), '2026-05-01 09:00:00', '2026-05-15', 'Aprueba', 'Completada', 0, 88.00, 'Evaluación por par interno.'),
(2, 'r2222222-2222-3333-4444-555555555555', 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1725555376' LIMIT 1), '2026-05-01 09:00:00', '2026-05-15', 'Aprueba', 'Completada', 1, 92.00, 'Evaluador externo calificado.');
 
-- 18. Poblar Detalles de Evaluaciones
INSERT INTO inv_evaluaciones_detalle (idDetalle, idRevision, criterio, puntaje, observaciones) VALUES
(1, 1, 'Calidad Científica - Rigor metodológico', 35.00, 'La metodología experimental es sólida. Se sugiere detallar el proceso de calibración analógica.'),
(2, 1, 'Viabilidad Técnica - Presupuesto y Cronograma', 28.00, 'Rubros coherentes y bien justificados.'),
(3, 2, 'Calidad Científica - Rigor metodológico', 38.00, 'Excelente propuesta técnica.'),
(4, 2, 'Impacto e Innovación - Transferencia de Tecnología', 27.00, 'Alto potencial de vinculación productiva.');
 
-- 19. Poblar Documentos Colaborativos
INSERT INTO inv_cowork_documentos (idDocumento, uuid, entidadTipo, entidadUuid, campoNombre, contentJson, version) VALUES
(1, 'd1111111-1111-1111-1111-111111111111', 'PROYECTO', '11111111-1111-1111-1111-111111111111', 'antecedentes', '{"type":"doc","content":[{"type":"paragraph","attrs":{"id":"sec-1"},"content":[{"type":"text","text":"Sección de antecedentes e introducción..."}]}]}', 1);
 
-- 20. Poblar Comentarios Colaborativos
INSERT INTO inv_collaboration_comments (idComment, instanceUuid, userUuid, userName, content, creadoEn) VALUES
(1, 'i1111111-1111-1111-1111-111111111111', '0302144159', 'Estefani Sanchez', '¿Podemos actualizar las fuentes bibliográficas de 2024?', '2025-05-12 10:00:00');
 
-- 21. Poblar Instancias de Documentos
INSERT INTO inv_documentos_instancias (id, uuid, template_code, template_version, entity_uuid, entity_type, titulo_instancia, estado, created_by) VALUES
(1, 'i1111111-1111-1111-1111-111111111111', 'PROTOCOLO_INVESTIGACION', 1, '11111111-1111-1111-1111-111111111111', 'Proyecto', 'Protocolo de Investigación IoT', 1, 'Giovanny Naranjo'),
(2, 'i2222222-1111-2222-2222-222222222222', 'PROTOCOLO_INVESTIGACION', 1, '22222222-2222-2222-2222-222222222222', 'Proyecto', 'Protocolo Fotovoltaico', 1, 'Freddy Baño'),
(3, 'd4444444-1111-4444-4444-444444444444', 'PROTOCOLO_INVESTIGACION', 1, '33333333-3333-3333-3333-333333333333', 'Proyecto', 'Protocolo Teletrabajo', 1, 'Giovanny Naranjo');
 
-- 22. Poblar Notificaciones
INSERT INTO inv_notificaciones (uuid, idProyecto, destinatario, tipoDestinatario, categoria, prioridad, titulo, mensaje, urlAccion, leido, fechaEnvio) VALUES
(UUID(), 1, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'Usuario', 'SISTEMA', 'NORMAL', 'Firma de Contrato Habilitada', 'El contrato de asignación de fondos del proyecto PROY-SOFT-2025-001 está listo para su firma.', '/investigacion/proyectos', 0, '2025-06-25 10:00:00'),
(UUID(), 5, (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'Usuario', 'EVALUACION', 'ALTA', 'Discordancia en Evaluaciones', 'Se ha convocado un árbitro dirimente para resolver el dictamen del proyecto PROY-RED-2026-005.', '/investigacion/arbitraje', 0, '2026-05-20 12:00:00'),
(UUID(), 3, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Usuario', 'SISTEMA', 'BAJA', 'Proyecto Aprobado por Comité', 'Su propuesta PROY-ADM-2025-003 ha sido aprobada con 78/100 puntos.', '/investigacion/proyectos', 1, '2025-06-26 15:00:00');
 
-- 23. Poblar Consentimientos de LOPDP
INSERT INTO inv_lopdp_consentimientos (uuid, idUsuario, versionPolitica, canal, fechaConsentimiento, ipDireccion, userAgent, firmaHash, estado) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'v1.2', 'Web', '2025-01-10 09:00:00', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'hash_consentimiento_sha256_naranjo', 'Otorgado'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'v1.2', 'Web', '2025-01-12 10:30:00', '192.168.1.55', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'hash_consentimiento_sha256_bano', 'Otorgado'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'v1.2', 'Web', '2025-01-15 11:00:00', '192.168.1.60', 'Mozilla/5.0 (Linux; Android 13)', 'hash_consentimiento_sha256_sanchez', 'Otorgado');
 
-- 24. Poblar Auditoria LOPDP
INSERT INTO inv_lopdp_auditoria_datos (uuid, idUsuarioActor, idUsuarioAfectado, tablaAfectada, columnaAfectada, operacion, motivo, ipDireccion, userAgent, fechaAcceso) VALUES
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1718161126' LIMIT 1), 'inv_usuarios_metadata', 'rutaFirmaP12', 'LECTURA', 'Validación del certificado digital para firma del acta de inicio.', '192.168.1.60', 'Mozilla/5.0', '2025-07-01 09:20:00'),
(UUID(), (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), (SELECT idUsuario FROM usuarios WHERE idSigafi = '1802707511' LIMIT 1), 'inv_usuarios_metadata', 'rutaFirmaP12', 'LECTURA', 'Verificación de firma electrónica en informe final de proyecto.', '192.168.1.60', 'Mozilla/5.0', '2026-01-05 16:10:00');
 
-- 25. Poblar Respaldo de Base de Datos
INSERT INTO inv_backup_logs (uuid, fechaBackup, tipo, destino, nombreArchivo, tamanioBytes, estado, hashVerificacion, errorMensaje, ejecutadoPor) VALUES
(UUID(), '2026-06-01 02:00:00', 'BaseDatos', 'Local', 'sigafi_es_backup_20260601.sql', 15480000, 'Exitoso', 'sha256_hash_backup_20260601_xyz', NULL, NULL),
(UUID(), '2026-06-02 02:00:00', 'BaseDatos', 'Local', 'sigafi_es_backup_20260602.sql', 15495000, 'Exitoso', 'sha256_hash_backup_20260602_abc', NULL, NULL);
 
-- 26. Poblar Transferencias Tecnológicas
INSERT INTO inv_transferencias (idProyecto, entidadReceptora, numeroConvenio, fechaConvenio, descripcion) VALUES
(2, 'Corporación Eléctrica del Ecuador CELEC EP', 'CONV-TRAV-CELEC-2026-01', '2026-01-10', 'Transferencia tecnológica y cesión de uso del Manual de Operación Energética y software de control fotovoltaico para iluminación autónoma.');
 
-- 27. Datos adicionales de prueba para adaptabilidad CACES (Nuevos Estados y Umbrales)
INSERT INTO inv_config_workflow 
    (estadoOrigen, estadoDestino, rolRequerido, requiereObservacion, contabilizaCargaHoraria, permiteInformesAvance, permiteRegistroEgresos, permiteGastosCapital, esEstadoFinal, etiquetaUi, colorHex, activo)
VALUES 
    ('En Ejecución', 'En Acreditación CACES', 'DIITRA_ADMIN', 1, 1, 1, 0, 0, 0, 'Evaluación Acreditación CACES', '#D97706', 1);
 
-- Agregamos el proyecto 8 en el nuevo estado 'En Acreditación CACES'
INSERT INTO inv_proyectos (idProyecto, uuid, idConvocatoria, codigoInstitucional, titulo, idSublinea, idPrograma, idGrupo, tieneGrupo, idTipo, fechaPresentacion, fechaInicio, fechaFin, tiempoEjecucion, estado, disponibleAdopcion, puntajeEvaluacion, valorEjecucion, idObjetivoPnd, idEntidadAliada, trlInicial, trlActual, trlMeta, hashActaAprobacion, fechaAprobacion, firmadoPor, idDspaceHandle, metadataCacesJson) VALUES
(8, '88888888-8888-8888-8888-888888888888', 1, 'PROY-CACES-2026-008',
 'Proyecto Piloto de Adaptabilidad para Acreditación de Calidad Educativa CACES',
 1, 1, 1, 1, 2, '2026-06-10', '2026-07-01', '2027-01-01', '6 meses', 'En Acreditación CACES', 0, 95.00, 1500.00, 3, NULL, 4, 5, 8,
 NULL, NULL, NULL, NULL,
 '{"descripcionProyecto": "Monitoreo experimental y levantamiento de evidencias en tiempo real bajo el nuevo modelo CACES para institutos tecnologicos.", "antecedentes": "La evaluacion del CACES requiere que los proyectos de investigacion presenten evidencias estructuradas...", "justificacion": "Demostrar la capacidad de adaptacion inmediata ante los cambios normativos del CACES en el IST Traversari...", "marcoTeorico": "Modelos de aseguramiento de la calidad en la educacion superior en America Latina...", "metodologia": "Investigacion-accion y desarrollo agil sobre los modulos de auditoria y reportes dinamicos...", "metodoEvaluacion": "Medicion del tiempo de response del sistema ante actualizaciones de umbrales normativos."}');
 
-- Relacionamos el proyecto 8 con la carrera de Software
INSERT INTO inv_proyectos_carreras (idProyecto, idCarrera, modalidad) VALUES
(8, (SELECT idCarrera FROM carreras WHERE aliasCarrera = 'SOF' LIMIT 1), 'Presencial');
 
-- Asignamos un docente al proyecto con 15 horas semanales para probar la contabilizacion de carga horaria
INSERT INTO inv_proyecto_participantes (idProyecto, idUsuario, tipoParticipante, esDirector, rol, nivelAcademico, telefono, horasSemanales, activo) VALUES
(8, (SELECT idUsuario FROM usuarios WHERE idSigafi = '0302144159' LIMIT 1), 'Docente', 1, 'Director de Proyecto', 'Magíster en Software', '0999999992', 15.0, 1);
 
-- Re-activar verificación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;
