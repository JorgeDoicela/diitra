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

## 2. Patrón: Modal de Bienvenida Oficial (Vercel Geist Bento 1-Capa)

El modal de bienvenida oficial de DIITRA utiliza una arquitectura limpia de **1 sola capa espaciosa sin anidamientos pesados ni cajas dentro de cajas**:

* **Contenedor:** `max-w-[680px] bg-white border border-zinc-200/80 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.15)]`.
* **Header:**
  * Breadcrumb: `DIITRA / [Rol]` (insignia en Geist Mono `text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-50 border border-zinc-200`).
  * Título: `text-[26px] font-bold text-zinc-950 tracking-[-0.03em] leading-tight`.
  * Subtítulo cálido con la misión institucional del sistema (`text-[13.5px] text-zinc-600 leading-relaxed max-w-xl`).
* **Cuerpo (Bento Grid 2x2):**
  * 4 tarjetas amplias de 1 solo nivel: `border border-zinc-200/80 bg-white rounded-xl p-4.5`.
  * Micro-interacciones de elevación al hacer hover (`hover:border-zinc-400/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:-translate-y-[1px]`).
  * Título en Geist Sans 600 (`text-[13.5px]`), etiqueta temática en Geist Mono (`text-[10px]`) y texto explicativo del beneficio para el rol.
* **Footer:**
  * Checkbox estilizado de 4px con persistencia en `localStorage`.
  * Botón primario negro sólido Vercel: `h-10 px-6 rounded-lg bg-zinc-950 text-white font-medium text-[13px] hover:bg-black active:scale-[0.98]`.

---

## 3. ANTI-PATRONES PROHIBIDOS

### ❌ AP1 — KPIs Gigantes Arriba (IA Genérica)
* Prohibido poner 3 o 4 cajas gigantes con números sobredimensionados arriba de las vistas. Usa listas compactas de resumen o tarjetas Bento de 1 capa.

### ❌ AP2 — Anidamiento de Cajas dentro de Cajas (Cosas Aplastadas)
* Prohibido meter dashboards en miniatura, dibujos o sub-contenedores dentro de un modal.

### ❌ AP3 — Jerga de Infraestructura / DevOps en UI Académica
* Prohibido mostrar `Rama: main`, `Commit -o-`, `Environment: Production` o `GET /api/... 200 OK`.

### ❌ AP4 — Textos y Títulos Truncados con Elipsis (`...`)
* Prohibido diseñar tarjetas donde el texto se corte con `text-ellipsis`.

### ❌ AP5 — Emojis o Iconos Decorativos Superfluos
* Prohibido usar cualquier emoji o iconos no esenciales.
