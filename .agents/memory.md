# Memoria del Proyecto — DIITRA

Este archivo almacena el contexto operativo, decisiones arquitectónicas consolidadas y lecciones aprendidas exclusivas del proyecto DIITRA.

---

## 1. Decisiones Arquitectónicas Consolidadas

* **Frontend:**
  - Instancia Axios centralizada en `api/` (prohibido `fetch` nativo).
  - Serialización estricta en `snake_case` desde el backend: mapear en React esperando `snake_case` con fallback dual defensivo (`has_template_update || hasTemplateUpdate`).
  - Colaboración en tiempo real: integración obligatoria de Yjs mediante `<CoWorkField>`.
  - Estilos: Sistema Geist Design con Tailwind CSS v4 nativo en `base.css`. Prohibido introducir estilos ad-hoc si existe la clase semántica (`.bento-card`, `.btn-vercel-*`, etc.). Mapeo estricto de `--font-mono: "Geist Mono", monospace` y eliminación de importaciones redundantes de tokens (`theme.css`).
* **Backend y Persistencia:**
  - ASP.NET Core Web API (.NET 8) con Pomelo MySQL (`sigafi_es`, puerto 3306).
  - Separación de esquemas: tablas del dominio DIITRA llevan prefijo `inv_` (escritura).
  - Frontera SIGAFI: tablas de catálogos institucionales externos son estrictamente de **solo lectura**.

---

## 2. Restricciones y Reglas Específicas

* Umbral máximo de 700 líneas por componente en React antes de modularizar.
* Preservación innegociable de la editabilidad en plantillas V1, trayecto del documento y portapapeles con `SectionBlockGuard`.
* Cero emojis y cero lenguaje publicitario o inflado en código y documentación.

---

## 3. Infraestructura y Operación del Servidor Local (24/7)

* **Gestión de Energía (Always-On):**
  - Planes de energía configurados en corriente alterna (AC) y batería (DC) con tiempo de suspensión (`STANDBYIDLE`), hibernación (`HIBERNATEIDLE`) y apagado de discos (`DISKIDLE`) en 0 (deshabilitados).
  - Acción de cierre de tapa (`LIDACTION`) establecida en 0 (ignorar).
* **Docker Desktop y Contenedores:**
  - Autoarranque habilitado en `settings-store.json` (`AutoStart: true`, `OpenUIOnStartupDisabled: true`).
  - Ahorro de recursos deshabilitado (`UseResourceSaver: false`) para evitar suspensión de la máquina virtual WSL2 tras inactividad.
  - Registro de Windows `HKCU:\...\StartupApproved\Run` habilitado para `Docker Desktop`.
  - Política de reinicio en contenedores establecida en `unless-stopped`.
* **Túnel Cloudflare (`setup_cloudflare_tunnel.ps1`):**
  - Soporte dual: no bloquea ni fuerza elevación UAC en operaciones estándar.
  - Modo Usuario: Auto-arranque mediante launcher silencioso VBScript en `$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Start-Cloudflare-Tunnel.vbs`. Parámetros CLI `-Background`, `-Stop`, `-Check`, `-EnableAutoStart`, `-DisableAutoStart`.
  - Modo Servicio: Opción 4 (`Install-PermanentService`) para ejecución como servicio del sistema operativo 24/7 (`LocalSystem`) que inicia previo al inicio de sesión.
  - Ingress multi-proyecto: `diitra.doicela.dev` (puerto 80 IIS), `ateneo.doicela.dev` (puerto 5173 Docker), `staging-dosier.doicela.dev` (puerto 8080 Docker).
