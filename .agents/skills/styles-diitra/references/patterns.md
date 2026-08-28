# patterns.md — Patrones Oficiales del Dashboard de DIITRA (Vercel Geist)

---

## 1. Patrón: Lista de Resumen Compacta (DIITRA Summary Rows)

En lugar de tarjetas de KPI rectangulares gigantes arriba (anti-patrón de IA), DIITRA organiza métricas en **listas de resumen de alta densidad**:

```tsx
/* PATRÓN CORRECTO DIITRA */
<div className="border border-[#eaeaea] rounded-lg p-3.5 bg-white">
  <h4 className="text-[13px] font-semibold text-[#111111] mb-3">Resumen Institucional</h4>
  <div className="space-y-2.5">
    {items.map((item, idx) => (
      <div key={idx} className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border border-[#eaeaea] flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[#333333] font-medium">{item.label}</span>
        </div>
        <span className="text-[#111111] font-mono font-semibold">{item.value}</span>
      </div>
    ))}
  </div>
</div>
```

---

## 2. Patrón: Modal de Onboarding y Bienvenida (Welcome Onboarding)

* **Columna Izquierda (Módulos del Rol):** Lista vertical con borde de 1px, división interna y línea de selección izquierda de 2px (`border-l-2 border-l-black`).
* **Columna Derecha (Capacidades del Módulo + Resumen):** Lista de capacidades principales con sus tags normativos y bloque de resumen compacto.
* **Footer:** Checkbox a la izquierda y botones Vercel a la derecha (`Ver Guía` + `Ingresar al Panel`).

---

## 3. ANTI-PATRONES PROHIBIDOS

### ❌ AP1 — KPIs Gigantes Arriba (IA Genérica)
* Prohibido poner 3 o 4 cajas gigantes con números sobredimensionados arriba de las vistas. Usa listas compactas de resumen.

### ❌ AP2 — Jerga de Infraestructura / DevOps en UI Académica
* Prohibido mostrar `Rama: main`, `Commit -o-`, `Environment: Production` o `GET /api/... 200 OK`.

### ❌ AP3 — Textos y Títulos Truncados con Elipsis (`...`)
* Prohibido diseñar tarjetas donde el texto se corte con `text-ellipsis`.

### ❌ AP4 — Mezclar Pestañas con Carrusel Auto-Play
* Prohibido agregar temporizadores automáticos en listas de pestañas.

### ❌ AP5 — Emojis o Iconos Decorativos Superfluos
* Prohibido usar cualquier emoji en la interfaz.
