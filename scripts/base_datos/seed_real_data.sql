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
TRUNCATE TABLE inv_proyectos;
TRUNCATE TABLE inv_sublineas;
TRUNCATE TABLE inv_convocatorias;
TRUNCATE TABLE inv_grupos_miembros;
TRUNCATE TABLE inv_grupos_carreras;
TRUNCATE TABLE inv_grupos_lineas;
TRUNCATE TABLE inv_grupos_investigacion;
TRUNCATE TABLE inv_entidades_externas;

-- 2. Poblar Sublíneas de Investigación
INSERT INTO inv_sublineas (idSublinea, uuid, idLinea, nombre, activo) VALUES
(1, UUID(), 1, 'Inteligencia Artificial y Aprendizaje Automático Aplicado', 1),
(2, UUID(), 1, 'Desarrollo de Software Multiplataforma y Computación en la Nube', 1),
(3, UUID(), 4, 'Sistemas Solares Fotovoltaicos y Eficiencia Energética', 1),
(4, UUID(), 2, 'Gestión de Procesos y Modelos de Negocio Innovadores', 1),
(5, UUID(), 2, 'Gestión del Talento Humano y Productividad Laboral', 1),
(6, UUID(), 3, 'Seguridad Informática y Redes de Próxima Generación', 1),
(7, UUID(), 5, 'Plataformas Educativas y Tecnologías Emergentes en el Aula', 1);

-- 3. Poblar Entidades Externas
INSERT INTO inv_entidades_externas (idEntidad, uuid, ruc, razonSocial, tipo, sector, contactoNombre, contactoEmail, activo) VALUES
(1, UUID(), '1790012345001', 'Novacero S.A.', 'Privada', 'Siderúrgico y Manufactura', 'Ing. Carlos Mendoza', 'carlos.mendoza@novacero.com', 1),
(2, UUID(), '1760001550001', 'Corporación Eléctrica del Ecuador CELEC EP', 'Pública', 'Energía y Electricidad', 'Ing. María Elena Silva', 'maria.silva@celec.gob.ec', 1),
(3, UUID(), '1790842245001', 'Conecel S.A. (Claro Ecuador)', 'Privada', 'Telecomunicaciones', 'Ing. Juan Carlos Torres', 'juan.torres@claro.com.ec', 1);

-- 4. Poblar Grupos de Investigación
INSERT INTO inv_grupos_investigacion (idGrupo, uuid, nombre, siglas, tipoGrupo, idDominio, idCoordinador, objetivoGeneral, mision, vision, resolucionAprobacion, fechaCreacion, categoriaConsolidacion, estado, activo) VALUES
(1, 'a241b625-56b8-4160-a4ba-1f67865dded0', 'Grupo de Investigación en Ingeniería de Software y TI', 'GIIST', 'Investigación', 1, 16, 
 'Fomentar el desarrollo tecnológico y la innovación en software en la región', 
 'Desarrollar soluciones de software con alto estándar de calidad', 
 'Ser referentes nacionales en desarrollo de software aplicado', 
 'RES-GIIST-2025-01', '2025-01-10', 'Consolidado', 'Aprobado', 1),
(2, UUID(), 'Grupo de Energías Renovables y Sostenibilidad Ambiental', 'GERSA', 'Investigación', 2, 14, 
 'Desarrollar prototipos y soluciones tecnológicas en el ámbito energético', 
 'Investigar y aplicar fuentes de energía limpia en beneficio social', 
 'Liderar la transición energética desde la academia', 
 'RES-GERSA-2025-02', '2025-01-12', 'Consolidado', 'Aprobado', 1),
(3, UUID(), 'Semillero de Investigación en Innovación y Gestión Empresarial', 'SIGE', 'Semillero', 3, 13, 
 'Capacitar a estudiantes en metodologías de investigación en el ámbito de negocios', 
 'Formar semilleristas con visión crítica y emprendedora', 
 'Ser el principal semillero de ideas de negocio tecnológicas del IST', 
 'RES-SIGE-2025-03', '2025-02-15', 'En Formación', 'Aprobado', 1);

-- Relaciones de Grupos con Líneas
INSERT INTO inv_grupos_lineas (idGrupo, idLinea) VALUES
(1, 1), (1, 3), -- GIIST con Software y Redes
(2, 4),         -- GERSA con Energías
(3, 2), (3, 5); -- SIGE con Gestión y Educación

-- Relaciones de Grupos con Carreras
INSERT INTO inv_grupos_carreras (idGrupo, idCarrera) VALUES
(1, 9), (1, 20), -- GIIST con Desarrollo de Software y Redes
(2, 21),         -- GERSA con Electrónica
(3, 3), (3, 13); -- SIGE con Gestión y Talento Humano

-- Miembros de Grupos
INSERT INTO inv_grupos_miembros (idGrupo, idUsuario, rol, activo, fechaInicio) VALUES
(1, 16, 'Coordinador', 1, '2025-01-10'),
(1, 6, 'Investigador', 1, '2025-01-15'),
(1, 31, 'Estudiante', 1, '2025-01-20'),
(2, 14, 'Coordinador', 1, '2025-01-12'),
(2, 15, 'Investigador', 1, '2025-01-15'),
(2, 32, 'Estudiante', 1, '2025-01-22'),
(3, 13, 'Coordinador', 1, '2025-02-15'),
(3, 2, 'Investigador', 1, '2025-02-18'),
(3, 50, 'Estudiante', 1, '2025-02-20');

-- 5. Poblar Convocatorias
INSERT INTO inv_convocatorias (idConvocatoria, uuid, codigoConvocatoria, titulo, idPeriodo, fechaApertura, fechaCierre, anio, descripcion, presupuestoTotal, montoMaximoProyecto, urlBases, requisitosMinimos, idTipoConvocatoria, idAgendaZonal, idRubrica, puntajeMinimoAprobacion, estado) VALUES
(1, '84f8846c-c918-406b-a25e-336ff326e632', 'CONV-2025-I', 'Convocatoria Proyectos de Investigación y Desarrollo 2025-I', 'ABD2025', '2025-04-15', '2025-06-15', 2025, 'Convocatoria abierta para el financiamiento de proyectos aplicados de I+D en el IST Traversari', 25000.00, 10000.00, 'https://bases.traversari.edu.ec/2025-I', 'Poseer título de tercer nivel y pertenecer a un grupo de investigación', 1, 9, 1, 70.00, 'Cerrada'),
(2, '9fb183ea-e522-4828-98e3-841853ad76aa', 'CONV-2026-I', 'Convocatoria Proyectos de Innovación Tecnológica 2026-I', 'ABR2026', '2026-04-10', '2026-06-10', 2026, 'Enfoque en desarrollo de software, prototipos de hardware y transferencia tecnológica', 30000.00, 12000.00, 'https://bases.traversari.edu.ec/2026-I', 'Tener grupo de investigación registrado o semillero activo', 2, 9, 2, 75.00, 'Abierta');

-- 6. Poblar Proyectos
INSERT INTO inv_proyectos (idProyecto, uuid, idConvocatoria, codigoInstitucional, titulo, descripcionProyecto, antecedentes, justificacion, marcoTeorico, metodologia, metodoEvaluacion, idSublinea, idPrograma, idGrupo, tieneGrupo, idTipo, fechaPresentacion, fechaInicio, fechaFin, tiempoEjecucion, estado, puntajeEvaluacion, valorEjecucion, idObjetivoPnd, idEntidadAliada, trlInicial, trlActual, trlMeta) VALUES
(1, '11111111-1111-1111-1111-111111111111', 1, 'PROY-SOFT-2025-001', 
 'Desarrollo de una Plataforma IoT con Inteligencia Artificial para el Monitoreo del Consumo Eléctrico Doméstico en el IST Traversari', 
 'Desarrollo de hardware y software IoT para monitoreo y optimización de energía.', 
 'Antecedentes del consumo eléctrico...', 'Justificación de la optimización...', 'Marco teórico de redes neuronales...', 'Metodología ágil y desarrollo de hardware...', 'Monitoreo de ahorro energético...', 
 1, 1, 1, 1, 2, '2025-05-10', '2025-07-01', '2026-01-01', '6 meses', 'En Ejecución', 85.50, 3200.00, 3, 3, 2, 5, 6),

(2, '22222222-2222-2222-2222-222222222222', 1, 'PROY-ENE-2025-002', 
 'Implementación de un Sistema Solar Fotovoltaico Autónomo para la Iluminación del Campus Traversari Quito', 
 'Diseño e instalación de paneles solares fotovoltaicos autónomos para el campus.', 
 'La matriz energética del campus...', 'Ahorro en la facturación y sostenibilidad...', 'Cálculo de radiación solar en Quito...', 'Instalación de paneles, baterías y sensores...', 'Comparación de consumo eléctrico...', 
 3, 2, 2, 1, 2, '2025-05-12', '2025-07-05', '2026-01-05', '6 meses', 'Finalizado', 92.00, 6500.00, 2, 2, 3, 6, 7),

(3, '33333333-3333-3333-3333-333333333333', 1, 'PROY-ADM-2025-003', 
 'Estudio del Impacto del Teletrabajo en la Productividad del Claustro Docente en Institutos Tecnológicos de Quito', 
 'Investigación cuantitativa del rendimiento laboral docente.', 
 'El auge del teletrabajo pospandemia...', 'Mejora del clima laboral y flexibilidad...', 'Modelos de rendimiento de talento humano...', 'Aplicación de encuestas y análisis SPSS...', 'Evaluación de KPI docentes...', 
 5, 3, 3, 1, 1, '2025-05-15', '2025-07-10', '2026-01-10', '6 meses', 'Aprobado', 78.00, 1200.00, 4, NULL, 1, 3, 4),

(4, '44444444-4444-4444-4444-444444444444', 2, 'PROY-SOFT-2026-004', 
 'Desarrollo de un Asistente Virtual Conversacional basado en IA para la Gestión Académica de Estudiantes en el IST Traversari', 
 'Creación de un chatbot inteligente para dar soporte académico.', 
 'Soporte manual saturado...', 'Agilidad en la respuesta al estudiante...', 'Modelos LLM e integración API...', 'Diseño conversacional e integración de base de datos...', 'Tiempos de respuesta y satisfacción...', 
 2, 1, 1, 1, 2, '2026-04-15', '2026-07-01', '2027-01-01', '6 meses', 'Borrador', NULL, 0.00, 3, NULL, 2, 2, 5),

(5, '55555555-5555-5555-5555-555555555555', 2, 'PROY-RED-2026-005', 
 'Diseño y Construcción de un Prototipo para la Detección Temprana de Fallas Eléctricas en Laboratorios de Electrónica del IST Traversari', 
 'Hardware detector de fallas y cortos en tiempo real.', 
 'Daños en equipos de laboratorio...', 'Seguridad de los estudiantes y preservación de equipos...', 'Transitorios y picos de corriente...', 'Diseño de circuitos detectores con microcontrolador...', 'Pruebas controladas de cortocircuitos...', 
 6, 1, 1, 1, 2, '2026-04-20', '2026-07-05', '2027-01-05', '6 meses', 'En Revisión', NULL, 500.00, 2, 1, 2, 3, 6);

-- Relaciones de Proyectos con Carreras
INSERT INTO inv_proyectos_carreras (idProyecto, idCarrera, modalidad) VALUES
(1, 9, 'Presencial'),
(2, 21, 'Dual'),
(3, 3, 'Presencial'),
(4, 9, 'Virtual'),
(5, 21, 'Presencial');

-- Profesores participantes
INSERT INTO inv_proyectos_profesores (idProyecto, idUsuario, esDirector, rol, nivelAcademico, telefono, horasSemanales, activo) VALUES
(1, 16, 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 12.0, 1),
(1, 13, 0, 'Investigador Principal', 'Magíster en TI', '0999999992', 8.0, 1),
(2, 14, 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 15.0, 1),
(2, 15, 0, 'Investigador Principal', 'Magíster en Energías', '0999999994', 10.0, 1),
(3, 13, 1, 'Director de Proyecto', 'Magíster en Talento Humano', '0999999992', 10.0, 1),
(3, 2, 0, 'Investigador Principal', 'Magíster en Administración', '0999999995', 8.0, 1),
(4, 16, 1, 'Director de Proyecto', 'Magíster en Software', '0999999991', 10.0, 1),
(4, 6, 0, 'Investigador de Apoyo', 'Magíster en TI', '0999999996', 6.0, 1),
(5, 14, 1, 'Director de Proyecto', 'Magíster en Electrónica', '0999999993', 12.0, 1),
(5, 16, 0, 'Investigador Principal', 'Magíster en Software', '0999999991', 8.0, 1);

-- Alumnos participantes
INSERT INTO inv_proyectos_alumnos (idProyecto, idUsuario, rol, nivelAcademico, telefono, activo) VALUES
(1, 31, 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888881', 1),
(2, 32, 'Semillerista', 'Estudiante de Electrónica', '0988888882', 1),
(3, 50, 'Semillerista', 'Estudiante de Gestión Empresarial', '0988888883', 1),
(4, 34, 'Semillerista', 'Estudiante de Desarrollo de Software', '0988888884', 1),
(5, 33, 'Semillerista', 'Estudiante de Electrónica', '0988888885', 1);

-- 7. Poblar Productos Científicos
INSERT INTO inv_productos (idProducto, idProyecto, idTipoProducto, titulo, cantidad, urlProducto, esPropiedadIntelectual, numeroRegistro, fechaRegistroSenadi) VALUES
(1, 1, 1, 'Análisis del Consumo Energético en Institutos de Educación Superior Usando IoT y Redes Neuronales', 1, 'https://scopus.com/traversari-iot-ai', 0, NULL, NULL),
(2, 1, 3, 'IoT Power Monitor Traversari v1.0', 1, 'https://github.com/traversari/iot-power-monitor', 1, 'SENADI-2025-SOFT-001', '2025-11-20'),
(3, 2, 6, 'Manual de Operación y Rendimiento Energético del Sistema Fotovoltaico Traversari', 1, 'https://repositorio.traversari.edu.ec/manual-fotovoltaico', 0, NULL, NULL),
(4, 2, 2, 'Módulo Seguidor Solar Automatizado Traversari', 1, 'https://repositorio.traversari.edu.ec/seguidor-solar', 1, 'SENADI-2025-IND-002', '2025-11-25'),
(5, 3, 5, 'El Docente del Siglo XXI: Gestión del Tiempo y Teletrabajo en el Contexto Ecuatoriano', 1, 'https://repositorio.traversari.edu.ec/docente-teletrabajo', 0, NULL, NULL);

-- 8. Poblar Ítems Presupuestarios
INSERT INTO inv_presupuesto_items (idItem, idProyecto, categoria, idPartida, detalle, cantidad, valorUnitario, esGastoCapital) VALUES
-- Proyecto 1
(1, 1, 'Equipos', 'EQ-001', 'Servidor local de procesamiento y base de datos para IoT', 1.00, 1500.00, 1),
(2, 1, 'Materiales', 'MAT-002', 'Sensores de corriente no invasivos y módulos ESP32', 10.00, 100.00, 0),
(3, 1, 'Servicios', 'SER-003', 'Honorarios de desarrollo de software para plataforma web', 1.00, 2000.00, 0),
-- Proyecto 2
(4, 2, 'Equipos', 'EQ-004', 'Paneles Solares Monocristalinos de 450W', 4.00, 800.00, 1),
(5, 2, 'Equipos', 'EQ-005', 'Inversor de Corriente Senoidal Pura 3kW', 1.00, 2000.00, 1),
(6, 2, 'Equipos', 'EQ-006', 'Baterías de Ciclo Profundo Gel 12V 200Ah', 4.00, 500.00, 1),
-- Proyecto 3
(7, 3, 'Software', 'SW-007', 'Licencia de software estadístico SPSS v29', 1.00, 800.00, 0),
(8, 3, 'Materiales', 'MAT-008', 'Materiales de oficina y fotocopias para encuestas de campo', 1.00, 1000.00, 0),
-- Proyecto 4
(9, 4, 'Servicios', 'SER-009', 'Servidor en la nube AWS (1 año de hosting)', 1.00, 2000.00, 0),
(10, 4, 'Servicios', 'SER-010', 'Licencias de API OpenAI / Anthropic para procesamiento conversacional', 1.00, 3000.00, 0),
-- Proyecto 5
(11, 5, 'Equipos', 'EQ-011', 'Osciloscopio digital portátil de 100MHz', 1.00, 1500.00, 1),
(12, 5, 'Materiales', 'MAT-012', 'Componentes electrónicos integrados, relés y fuentes de poder', 1.00, 2000.00, 0);

-- 9. Poblar Historial de Informes de Avance (Bitácora)
INSERT INTO inv_informes_avance (idInforme, uuid, idProyecto, numeroInforme, fechaReporte, resumenActividades, esFirmadoDigital, hashFirma, fechaFirma, validadoPor, estado) VALUES
(1, UUID(), 1, 1, '2025-08-01', 'Diseño inicial de la arquitectura IoT y compra de sensores.', 1, 'd3f82163b86029d5b78ec90141f22e84c1fbc0d16f8ef190a421b8ff120f269a', '2025-08-05 10:00:00', 16, 'Aprobado'),
(2, UUID(), 1, 2, '2025-09-01', 'Construcción y calibración de prototipos de sensado.', 1, 'e1189ac9cfc8b1836109dfbc18c0df1b89efbc1a78eeffb18928f921f92e8412', '2025-09-06 11:30:00', 16, 'Aprobado'),
(3, UUID(), 2, 1, '2025-08-05', 'Cálculo de la radiación solar y diseño del soporte metálico.', 1, 'f82bbcbff18acb9eef89283f12e840afbc89e81bfafeff093b128afc298ec289', '2025-08-10 14:00:00', 14, 'Aprobado');

-- 10. Re-activar verificación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;
