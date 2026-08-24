import React from 'react';

export const RenderProjectBudgetSection: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 space-y-3 select-none">

            {c.showRecursosDisponibles !== false && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-1.5 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider">
                        4.1 Recursos Disponibles (Equipos, Licencias, Espacios)
                    </div>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-1 text-left">Descripción del Recurso</th>
                                <th className="p-1 text-center w-12">Cant.</th>
                                <th className="p-1 text-left w-28">Fuente</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 text-slate-600">
                                <td className="p-1">[Ejemplo de Recurso Disponible / Infraestructura]</td>
                                <td className="p-1 text-center font-bold">1</td>
                                <td className="p-1">[Institucional / ISTPET]</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {c.showRecursosNecesarios !== false && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-1.5 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider">
                        4.2 Recursos Necesarios (Presupuesto de Gasto)
                    </div>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-1 text-left">Partida / Rubro</th>
                                <th className="p-1 text-center w-12">Cant.</th>
                                <th className="p-1 text-right w-20">P. Unitario</th>
                                <th className="p-1 text-right w-20">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 text-slate-600">
                                <td className="p-1">[Partida Presupuestaria de Gasto]</td>
                                <td className="p-1 text-center font-bold">1</td>
                                <td className="p-1 text-right">$ 0.00</td>
                                <td className="p-1 text-right font-bold">$ 0.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {c.showFinanciamiento !== false && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[8.5px]">
                    <div className="space-y-1">
                        <div><strong className="text-slate-700">Financiamiento Solicitado al ISTPET:</strong> <span className="font-semibold text-indigo-600">[SÍ / NO]</span></div>
                        <div><strong className="text-slate-700">Financiamiento Otras Fuentes:</strong> <span className="text-slate-500">[No especificadas]</span></div>
                    </div>
                    <div className="text-right">
                        <span className="text-[7.5px] uppercase font-bold text-slate-400 block">Costo Total Estimado</span>
                        <span className="text-xs font-black text-indigo-600">$ 0.00</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export const RenderProjectProgressReport: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 space-y-3 select-none">
            {c.showEvidencias !== false && (
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1 text-[8.5px]">
                    <strong className="text-slate-700 block font-bold">Bitácora Científica & Conclusiones Parciales:</strong>
                    <p className="text-slate-500 italic">[Redacción de bitácora y conclusiones acumuladas por investigadores...]</p>
                </div>
            )}

            {c.showHitosCompletados !== false && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-1.5 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider">
                        Hitos & Entregables Completados
                    </div>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-1 text-left">Actividad / Hito</th>
                                <th className="p-1 text-center w-16">% Avance</th>
                                <th className="p-1 text-center w-20">Completado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 text-slate-600">
                                <td className="p-1">[Hito de Investigación]</td>
                                <td className="p-1 text-center font-bold">100 %</td>
                                <td className="p-1 text-center font-bold text-emerald-600">SÍ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export const RenderProjectApprovalNotice: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const ciudad = config?.ciudad_emision || "Quito";
    const parrafoAprobacion = config?.parrafo_aprobacion ?? 'Reciba un cordial saludo y por medio del presente, es un placer informarle que, tras la evaluación correspondiente, su proyecto de investigación titulado "[Título del Proyecto de Investigación]" ha sido aprobado por la Coordinación de la Unidad de Investigación.';
    const parrafoFundamento = config?.parrafo_fundamento ?? 'La aprobación se basa en la relevancia y viabilidad del proyecto, así como en su alineación con los objetivos académicos de nuestra institución, quedando establecidos la siguiente información:';
    const textoCaces = config?.textoCACES ?? "Las actividades complementarias al desarrollo del proyecto son los Informes de Seguimiento mensuales, con sus respectivos anexos que respalden las actividades ejecutadas, además de, el Plan de Aprendizaje y Evaluación del Plan de Aprendizaje por cada estudiante que forme parte del grupo de investigación y culminando con la Difusión de Resultados obtenidos del proyecto ejecutado.";
    const parrafoInvitacion = config?.parrafo_invitacion ?? 'Le animamos a proceder con la ejecución del proyecto, manteniendo los estándares de calidad y ética que nos caracterizan.';
    const fraseCierre = config?.frase_cierre || 'Con sentimientos de distinguida consideración.';
    const fraseDespedida = config?.frase_despedida || 'Atentamente,';
    const coordinador = config?.coordinador_nombre || "Ing. Estefani Sánchez Mgtr.";
    const cargo = config?.coordinador_cargo || "Coordinadora de la Unidad de Investigación e Innovación";
    const institucion = config?.firmante_institucion || "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI";
    const mostrarCompromisos = config?.mostrarCompromisosCACES !== false;
    const mostrarFechas = config?.mostrarTablaFechas !== false;
    const mostrarLogoHeader = config?.mostrarLogoHeader === true;

    const handleUpdate = (key: string, val: any) => {
        if (blockId && onUpdateConfig) {
            onUpdateConfig(blockId, key, val);
        }
    };

    return (
        <div className="my-2 space-y-3 select-none">
            {mostrarLogoHeader && (
                <div className="text-left text-[8px] text-slate-400 font-mono italic">
                    [Encabezado con Logo ISTPET Activado]
                </div>
            )}

            <div className="text-[8.5px] text-slate-600 space-y-2 leading-relaxed">
                <div>
                    <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 1 (Saludo y Notificación):</label>
                    <textarea
                        rows={2}
                        className="w-full p-1.5 text-[8.5px] text-slate-700 italic bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={parrafoAprobacion}
                        onChange={(e) => handleUpdate('parrafo_aprobacion', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 2 (Fundamento):</label>
                    <textarea
                        rows={2}
                        className="w-full p-1.5 text-[8.5px] text-slate-600 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={parrafoFundamento}
                        onChange={(e) => handleUpdate('parrafo_fundamento', e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-[8.5px]">
                <table className="w-full border-collapse">
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 w-1/3 text-slate-700">NOMBRE DEL PROYECTO:</td>
                            <td className="p-1.5 text-slate-600 font-semibold">[Nombre Oficial del Proyecto]</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 text-slate-700">LÍNEA DE INVESTIGACIÓN:</td>
                            <td className="p-1.5 text-slate-600">[Línea de Investigación Vinculada]</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 text-slate-700">MESES DE EJECUCIÓN:</td>
                            <td className="p-1.5 text-slate-600">12 meses</td>
                        </tr>
                        {mostrarFechas && (
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <td colSpan={2} className="p-1 text-center font-bold text-slate-700">
                                    [Fechas de Presentación, Inicio y Finalización]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {mostrarCompromisos && (
                <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-[8.5px] text-slate-600 space-y-1">
                    <strong className="block text-slate-700 font-bold">Indicaciones y Compromisos Normativos CACES:</strong>
                    <textarea
                        rows={3}
                        className="w-full p-1.5 text-[8.5px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={textoCaces}
                        onChange={(e) => handleUpdate('textoCACES', e.target.value)}
                    />
                </div>
            )}

            <div>
                <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 4 (Invitación):</label>
                <textarea
                    rows={2}
                    className="w-full p-1.5 text-[8.5px] text-slate-600 italic bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                    value={parrafoInvitacion}
                    onChange={(e) => handleUpdate('parrafo_invitacion', e.target.value)}
                />
            </div>

            <div className="pt-2 border-t border-slate-100 text-[8px] text-slate-500 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] text-slate-500 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={fraseCierre}
                        onChange={(e) => handleUpdate('frase_cierre', e.target.value)}
                        placeholder="Frase de cierre..."
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={fraseDespedida}
                        onChange={(e) => handleUpdate('frase_despedida', e.target.value)}
                        placeholder="Atentamente,"
                    />
                </div>

                <div className="space-y-1 pt-1">
                    <input
                        type="text"
                        className="w-full p-1 text-[8.5px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={coordinador}
                        onChange={(e) => handleUpdate('coordinador_nombre', e.target.value)}
                        placeholder="Nombre del Coordinador/a"
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] text-slate-600 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={cargo}
                        onChange={(e) => handleUpdate('coordinador_cargo', e.target.value)}
                        placeholder="Cargo"
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[7.5px] font-bold text-slate-700 uppercase bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={institucion}
                        onChange={(e) => handleUpdate('firmante_institucion', e.target.value)}
                        placeholder="Institución"
                    />
                </div>
            </div>
        </div>
    );
};
