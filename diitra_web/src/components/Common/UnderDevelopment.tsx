import { Construction } from 'lucide-react';

interface UnderDevelopmentProps {
  title?: string;
  description?: string;
}

const UnderDevelopment = ({
  title = 'Módulo en Desarrollo',
  description = 'Esta funcionalidad estará disponible en la próxima actualización.',
}: UnderDevelopmentProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
      <div className="w-16 h-16 bg-surface border border-border-thin rounded-2xl flex items-center justify-center text-text-dim">
        <Construction size={32} />
      </div>
      <h2 className="text-xl font-bold text-text-main uppercase tracking-tighter">{title}</h2>
      <p className="text-sm text-text-dim max-w-xs">{description}</p>
    </div>
  );
};

export default UnderDevelopment;
