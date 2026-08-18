import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { resolveEventUrl } from '../../services/calendarioService';
import './ProximosEventosWidget.css';

interface Evento {
    id_evento_calendario: string;
    uuid: string;
    titulo: string;
    descripcion: string;
    categoria_global: string;
    subcategoria: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    es_todo_el_dia: boolean;
    color_hex: string | null;
    url_accion: string | null;
    tipo_entidad_origen?: string | null;
    uuid_entidad_origen?: string | null;
    id_entidad_origen?: number | null;
}

interface ProximosEventosWidgetProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ProximosEventosWidget: React.FC<ProximosEventosWidgetProps> = ({ className = '', style }) => {
  const { isAdmin } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const hoy = new Date();
        const dentroDe7Dias = new Date();
        dentroDe7Dias.setDate(hoy.getDate() + 7);

        const formatLocal = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const desdeStr = formatLocal(hoy);
        const hastaStr = formatLocal(dentroDe7Dias);

        const response = await api.get('/calendario/eventos', {
          params: { desde: desdeStr, hasta: hastaStr }
        });
        setEventos(response.data || []);
      } catch (error) {
        console.error('Error al obtener próximos eventos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleEventoClick = (ev: Evento) => {
    const targetUrl = resolveEventUrl(ev, isAdmin);
    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank');
      } else {
        navigate(targetUrl);
      }
    } else {
      navigate('/calendario');
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className={`widget-proximos-eventos loading ${className}`} style={style}>
        <div className="spinner"></div>
        <p>Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className={`widget-proximos-eventos ${className}`} style={style}>
            <div className="widget-header">
                <h3>Próximos Eventos</h3>
                <span className="badge-7d">7 días</span>
            </div>

            <div className="widget-body">
                {eventos.length === 0 ? (
                    <div className="no-eventos">
                        <p>No hay eventos programados para los próximos días.</p>
                    </div>
                ) : (
                    <div className="eventos-list">
                        {eventos.map((ev) => (
                            <div
                                key={ev.id_evento_calendario}
                                className="evento-row-item"
                                onClick={() => handleEventoClick(ev)}
                                style={{ '--accent-color': ev.color_hex || '#6B7280' } as React.CSSProperties}
                            >
                                <div className="evento-date">
                                    <span className="day">{ev.fecha_inicio.split('-')[2]}</span>
                                    <span className="month">
                                        {formatearFecha(ev.fecha_inicio).split(' ')[1]}
                                    </span>
                                </div>
                                <div className="evento-info">
                                    <h4 className="evento-title">{ev.titulo}</h4>
                                    {ev.descripcion && (
                                        <p className="evento-desc">{ev.descripcion}</p>
                                    )}
                                    <span className="evento-tag">{ev.categoria_global}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Link to="/calendario" className="widget-footer no-underline">
                <span>Ver calendario completo</span>
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                </svg>
            </Link>
        </div>
    );
};
