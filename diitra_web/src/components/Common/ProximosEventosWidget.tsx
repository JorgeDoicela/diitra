import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { resolveEventUrl } from '../../services/calendarioService';
import './ProximosEventosWidget.css';

interface Evento {
    id_evento_calendario?: string;
    idEventoCalendario?: string;
    uuid: string;
    titulo: string;
    descripcion?: string | null;
    categoria_global?: string;
    categoriaGlobal?: string;
    subcategoria?: string;
    fecha_inicio: string | null;
    fechaInicio?: string | null;
    fecha_fin: string | null;
    fechaFin?: string | null;
    es_todo_el_dia?: boolean;
    esTodoElDia?: boolean;
    color_hex: string | null;
    colorHex?: string | null;
    url_accion?: string | null;
    urlAccion?: string | null;
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
        const data: Evento[] = Array.isArray(response.data) ? response.data : [];
        // Filtrar exclusivamente eventos con fecha de inicio definida en el rango
        const eventosValidos = data.filter((ev) => {
          const f = ev.fecha_inicio ?? ev.fechaInicio;
          return typeof f === 'string' && f.trim().length > 0;
        });
        setEventos(eventosValidos);
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

  const getFechaDisplay = (fechaStr: string | null | undefined) => {
    if (!fechaStr) return { day: '--', month: '' };
    const cleanDate = fechaStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length < 3) return { day: '--', month: '' };

    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);

    const dayStr = !isNaN(day) ? String(day).padStart(2, '0') : '--';
    const monthStr = !isNaN(date.getTime())
      ? date.toLocaleDateString('es-EC', { month: 'short' }).replace('.', '').toUpperCase()
      : '';

    return { day: dayStr, month: monthStr };
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
                        {eventos.map((ev) => {
                            const fInicio = ev.fecha_inicio ?? ev.fechaInicio;
                            const { day, month } = getFechaDisplay(fInicio);
                            const idKey = ev.id_evento_calendario ?? ev.idEventoCalendario ?? ev.uuid;
                            const color = ev.color_hex ?? ev.colorHex ?? '#6B7280';
                            const categoria = ev.categoria_global ?? ev.categoriaGlobal ?? 'Evento';

                            return (
                                <div
                                    key={idKey}
                                    className="evento-row-item"
                                    onClick={() => handleEventoClick(ev)}
                                    style={{ '--accent-color': color } as React.CSSProperties}
                                >
                                    <div className="evento-date">
                                        <span className="day">{day}</span>
                                        <span className="month">{month}</span>
                                    </div>
                                    <div className="evento-info">
                                        <h4 className="evento-title">{ev.titulo}</h4>
                                        {ev.descripcion && (
                                            <p className="evento-desc">{ev.descripcion}</p>
                                        )}
                                        <span className="evento-tag">{categoria}</span>
                                    </div>
                                </div>
                            );
                        })}
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
