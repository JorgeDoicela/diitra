import { useForm } from 'react-hook-form';

interface ProjectFormData {
  titulo: string;
  resumen: string;
  lineaInvestigacion: string;
  presupuesto: number;
}

const ProjectForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data: ProjectFormData) => {
    setIsSubmitting(true);
    alert('Postulación enviada correctamente (Simulado)');
  };

  return (
    <div className="glass p-8 rounded-2xl border border-glass-border max-w-2xl mx-auto mt-10">
      <h3 className="text-2xl font-bold text-white mb-6">Postulación Digital</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-gray-400 mb-2">Título del Proyecto</label>
          <input
            {...register('titulo', { required: 'El título es obligatorio' })}
            className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
            placeholder="Ej. Análisis de impacto tecnológico..."
          />
          {errors.titulo && <span className="text-red-400 text-sm mt-1">{errors.titulo.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Línea de Investigación</label>
            <select
              {...register('lineaInvestigacion', { required: 'Selecciona una línea' })}
              className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
            >
              <option value="">Seleccionar...</option>
              <option value="TIC">Tecnologías de Información</option>
              <option value="INN">Innovación Social</option>
              <option value="MAE">Medio Ambiente</option>
            </select>
            {errors.lineaInvestigacion && <span className="text-red-400 text-sm mt-1">{errors.lineaInvestigacion.message}</span>}
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Presupuesto ($)</label>
            <input
              type="number"
              {...register('presupuesto', { required: 'Monto obligatorio', min: 0, max: 5000 })}
              className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
              placeholder="0.00"
            />
            {errors.presupuesto && <span className="text-red-400 text-sm mt-1">{errors.presupuesto.message}</span>}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Resumen Ejecutivo</label>
          <textarea
            {...register('resumen', { required: 'El resumen es obligatorio' })}
            rows={4}
            className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
            placeholder="Breve descripción del alcance..."
          />
          {errors.resumen && <span className="text-red-400 text-sm mt-1">{errors.resumen.message}</span>}
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transform hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
        >
          Enviar Protocolo
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;
