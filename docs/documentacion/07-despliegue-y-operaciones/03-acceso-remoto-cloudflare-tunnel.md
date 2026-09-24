# Acceso Remoto Seguro con Cloudflare Tunnel (DIITRA)

Este documento detalla la arquitectura de exposicion y acceso remoto seguro para el sistema DIITRA mediante Cloudflare Tunnel, permitiendo la conectividad publica cifrada sin requerir la apertura de puertos en el enrutador local ni la instalacion de certificados administrativos en el sistema operativo.

---

## 1. Arquitectura de Red y Enrutamiento

El flujo de trafico para DIITRA opera bajo el esquema de tunel de origen inverso saliente:

```
[ Navegador del Usuario / Cliente Movil ]
                   |
                   |  HTTPS (TLS 1.3 - Dominio: https://diitra.doicela.dev)
                   v
[ Red Perimetral de Cloudflare (WAF, Anti-DDoS, Edge SSL) ]
                   |
                   |  Tunel Cifrado Seguro (Conexion saliente QUIC / HTTP2)
                   v
[ Daemon cloudflared en Host ]
                   |
                   |  HTTP (127.0.0.1:80 - Red local privada)
                   v
[ Microsoft Internet Information Services (IIS) ]
         |
         +--> /diitra      (Aplicacion Web React SPA compilada)
         +--> /apiDiitra   (API Backend ASP.NET Core .NET 8)
         +--> /apiDiitra/hubs (WebSockets / SignalR / Yjs en tiempo real)
```

---

## 2. Especificacion Tecnica del Servicio

* **Dominio Asignado:** `diitra.doicela.dev`
* **URL de Acceso Web:** `https://diitra.doicela.dev/diitra`
* **URL Base de la API:** `https://diitra.doicela.dev/apiDiitra`
* **Endpoint de Diagnostico:** `https://diitra.doicela.dev/apiDiitra/api/ping`
* **Servicio de Destino Local:** `http://localhost:80` (o `http://127.0.0.1:80`)
* **Servidor Web Host:** Microsoft Internet Information Services (IIS)
* **Base de Datos:** MySQL Server local en puerto 3306 (`sigafi_es`)

---

## 3. Seguridad Perimetral y Politica Cero Huella

1. **Terminacion SSL en el Borde:** Todo el cifrado TLS publico es resuelto por los centros de datos de Cloudflare con certificado administrado para la zona `doicela.dev`.
2. **Cero Certificados Locales:** No se almacena ningun archivo `cert.pem` ni credenciales maestras en la maquina local. El tunel opera exclusivamente con el archivo de credenciales de bajo privilegio `b4c8df71-7f6d-43b1-acb3-6ce0ec61e95d.json` en `C:\ProgramData\cloudflared\`.
3. **Cero Apertura de Puertos (NAT / Port Forwarding):** El trafico es 100% saliente. Los cortafuegos perimetrales y enrutadores residenciales o corporativos bloquean cualquier intento de conexion directa al puerto 80 desde el exterior.

---

## 4. Procedimiento de Arranque y Operacion Bajo Demanda

### Paso 1: Asegurar que IIS este en ejecucion
Verificar que el servicio W3SVC de Windows este activo para atender el trafico en el puerto 80:

```powershell
Get-Service W3SVC
# Si estuviera detenido:
Start-Service W3SVC
```

### Paso 2: Ejecutar el Tunel de Cloudflare
Se recomienda ejecutar el tunel en modo interactivo bajo demanda desde la terminal:

```powershell
& "c:\Users\DESARROLLADOR\Desktop\Proyectos\diitra\scripts\despliegue\setup_cloudflare_tunnel.ps1"
```
Seleccionar la opcion `[1] INICIAR SERVIDOR BAJO DEMANDA`.

O ejecutar directamente el comando del agente:
```powershell
cloudflared tunnel --config "C:\ProgramData\cloudflared\config.yml" run
```

### Paso 3: Verificacion de Conectividad
Comprobar el estado del sistema accediendo a:
* Web: `https://diitra.doicela.dev/diitra`
* API Health Check: `https://diitra.doicela.dev/apiDiitra/api/ping` (Debe responder con `{"status":"healthy"}`).

### Paso 4: Detencion del Servicio
Para apagar la exposicion publica, presionar `Ctrl + C` en la consola donde corre `cloudflared`. El trafico externo queda cerrado de forma inmediata sin dejar procesos residentes.
