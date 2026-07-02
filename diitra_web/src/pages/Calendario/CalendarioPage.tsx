import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import esGD from 'date-fns/locale/es';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarioPage.css';

const locales = {
  'es': esGD,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes primer día de la semana
  getDay,
  locales,
});

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
}

interface CalendarEventExtended extends BigCalendarEvent {
  resource: Evento;
}

export const CalendarioPage: React.FC = () => {
  const [eventos, setEventos] = useState<CalendarEventExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categoriasVisibles, setCategoriasVisibles] = useState<Record<string, boolean>>({
    'Normativo': true,
    'Convocatoria': true,
    'Proyecto': true,
    'Monitoreo': true,
    'PeerReview': true,
  });

  const navigate = useNavigate();

  const fetchEventos = async (date: Date) => {
    try {
      setLoading(true);
      // Rango amplio del mes actual
      const desde = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const hasta = new Date(date.getFullYear(), date.getMonth() + 2, 0);

      const desdeStr = desde.toISOString().split('T')[0];
      const hastaStr = hasta.toISOString().split('T')[0];

      const response = await api.get('/calendario/eventos', {
        params: { desde: desdeStr, hasta: hastaStr }
      });

      const parsed: CalendarEventExtended[] = (response.data || []).map((ev: Evento) => {
        const [yI, mI, dI] = ev.fecha_inicio.split('-').map(Number);
        const start = new Date(yI, mI - 1, dI);
        let end = start;

        if (ev.fecha_fin) {
          const [yF, mF, dF] = ev.fecha_fin.split('-').map(Number);
          end = new Date(yF, mF - 1, dF);
        }

        return {
          title: ev.titulo,
          start,
          end,
          allDay: ev.es_todo_el_dia,
          resource: ev,
        };
      });

      setEventos(parsed);
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos(currentDate);
  }, [currentDate]);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleSelectEvent = (event: CalendarEventExtended) => {
    const ev = event.resource;
    if (ev.url_accion) {
      navigate(ev.url_accion);
    } else if (ev.categoria_global === 'Proyecto' && ev.uuid) {
      navigate(`/proyectos/${ev.uuid}`);
    }
  };

  const eventStyleGetter = (event: CalendarEventExtended) => {
    const ev = event.resource;
    const isVisible = categoriasVisibles[ev.categoria_global] !== false;
    
    return {
      style: {
        backgroundColor: ev.color_hex || '#6B7280',
        borderRadius: '6px',
        opacity: isVisible ? 1 : 0.15,
        color: '#ffffff',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 6px',
        fontWeight: '500',
        transition: 'opacity 0.2s',
      }
    };
  };

  const toggleCategoria = (cat: string) => {
    setCategoriasVisibles(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const filteredEventos = eventos.filter(ev => 
    categoriasVisibles[ev.resource.categoria_global] !== false
  );

  return (
    <div className="calendario-page-container">
      <div className="calendario-sidebar">
        <div className="sidebar-section">
          <h3>Filtros de Agenda</h3>
          <div className="filtros-lista">
            <label className="filtro-item" style={{ '--color': '#1E3A8A' } as React.CSSProperties}>
              <input 
                type="checkbox" 
                checked={categoriasVisibles['Normativo']} 
                onChange={() => toggleCategoria('Normativo')} 
              />
              <span className="color-dot"></span>
              <span>CACES / Normativa</span>
            </label>

            <label className="filtro-item" style={{ '--color': '#3B82F6' } as React.CSSProperties}>
              <input 
                type="checkbox" 
                checked={categoriasVisibles['Convocatoria']} 
                onChange={() => toggleCategoria('Convocatoria')} 
              />
              <span className="color-dot"></span>
              <span>Convocatorias</span>
            </label>

            <label className="filtro-item" style={{ '--color': '#10B981' } as React.CSSProperties}>
              <input 
                type="checkbox" 
                checked={categoriasVisibles['Proyecto']} 
                onChange={() => toggleCategoria('Proyecto')} 
              />
              <span className="color-dot"></span>
              <span>Proyectos</span>
            </label>

            <label className="filtro-item" style={{ '--color': '#8B5CF6' } as React.CSSProperties}>
              <input 
                type="checkbox" 
                checked={categoriasVisibles['Monitoreo']} 
                onChange={() => toggleCategoria('Monitoreo')} 
              />
              <span className="color-dot"></span>
              <span>Monitoreo (Informes)</span>
            </label>

            <label className="filtro-item" style={{ '--color': '#EC4899' } as React.CSSProperties}>
              <input 
                type="checkbox" 
                checked={categoriasVisibles['PeerReview']} 
                onChange={() => toggleCategoria('PeerReview')} 
              />
              <span className="color-dot"></span>
              <span>Evaluaciones</span>
            </label>
          </div>
        </div>

        <div className="sidebar-section info-section">
          <h4>💡 Consejo</h4>
          <p>Haz clic en cualquier evento del calendario para abrir el proyecto, informe o convocatoria correspondiente.</p>
        </div>
      </div>

      <div className="calendario-main">
        {loading && <div className="calendario-loading-bar">Actualizando eventos...</div>}
        <Calendar
          localizer={localizer}
          events={filteredEventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 160px)' }}
          culture="es"
          onNavigate={handleNavigate}
          date={currentDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Sig. >",
            previous: "< Ant.",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango de fechas."
          }}
        />
      </div>
    </div>
  );
};
