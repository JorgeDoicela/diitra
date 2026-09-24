#Requires -Version 5.1
# ==============================================================================
# DIITRA - Cloudflare Tunnel Professional Control Suite
# ==============================================================================
# Gestiona el ciclo de vida de exposicion segura de DIITRA a traves de Cloudflare.
# Soporta modo Bajo Demanda (On-Demand) y modo Servicio Windows 24/7.
# ==============================================================================

param (
    [Parameter(Mandatory = $false, HelpMessage = "Subdominio o dominio a exponer via Cloudflare")]
    [string]$Hostname = "diitra.doicela.dev",

    [Parameter(Mandatory = $false, HelpMessage = "Destino local HTTP a donde apunta el tunel")]
    [string]$LocalService = "http://localhost:80",

    [Parameter(Mandatory = $false, HelpMessage = "Nombre identificador del tunel")]
    [string]$TunnelName = "diitra-tunnel"
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "DIITRA - Cloudflare Tunnel Control Suite"

# 1. Elevacion automatica de privilegios
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host " [!] Este script requiere privilegios de Administrador de Windows." -ForegroundColor Red
    Write-Host " Elevando permisos en una nueva ventana..." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Hostname `"$Hostname`" -LocalService `"$LocalService`" -TunnelName `"$TunnelName`"" -Verb RunAs
    exit
}

# Rutas de configuracion y perfiles
$CloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$ServiceConfigDir = "C:\ProgramData\cloudflared"
$SystemProfileDir = "C:\Windows\System32\config\systemprofile\.cloudflared"

function Write-Header ($text) {
    Write-Host ""
    Write-Host ("=" * ($text.Length + 6)) -ForegroundColor Cyan
    Write-Host "   $text" -ForegroundColor Cyan -Bold
    Write-Host ("=" * ($text.Length + 6)) -ForegroundColor Cyan
}

function Write-Success ($text) {
    Write-Host "  [OK] $text" -ForegroundColor Green
}

function Write-Warn ($text) {
    Write-Host "  [AVISO] $text" -ForegroundColor Yellow
}

function Write-Failure ($text) {
    Write-Host "  [ERROR] $text" -ForegroundColor Red
}

# 2. Comprobar e instalar cloudflared
function Ensure-Cloudflared {
    if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
        return $true
    }

    Write-Warn "El ejecutable 'cloudflared' no esta instalado."
    $inst = Read-Host "Deseas instalarlo automaticamente mediante winget? [S/N]"
    if ($inst -match '^(s|y)$') {
        Write-Host "Instalando Cloudflare.cloudflared via winget..." -ForegroundColor Cyan
        cmd.exe /c "winget install --id Cloudflare.cloudflared -e --silent --accept-source-agreements --accept-package-agreements"
        
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path = "$machinePath;$userPath"
        
        if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
            Write-Success "cloudflared instalado correctamente."
            return $true
        } else {
            Write-Failure "No se detecto cloudflared en el PATH tras la instalacion. Cierra y reabre la consola como Administrador."
            return $false
        }
    }
    return $false
}

# 3. Comprobar si la configuracion del tunel ya existe
function Ensure-TunnelConfig {
    $configPath = Join-Path $ServiceConfigDir "config.yml"
    if (Test-Path $configPath) {
        return $true
    }

    Write-Warn "No existe una configuracion previa del tunel en $ServiceConfigDir."
    Write-Host "Vamos a inicializar el tunel '$TunnelName' para el dominio '$Hostname'..." -ForegroundColor Cyan
    
    # 3.1 Autenticacion
    $certPath = Join-Path $CloudflaredDir "cert.pem"
    if (-not (Test-Path $certPath)) {
        $apexParts = $Hostname -split '\.'
        $apexDomain = if ($apexParts.Count -ge 2) { ($apexParts[-2..-1] -join '.') } else { $Hostname }

        Write-Host "`nSe abrira tu navegador para autorizar la zona '$apexDomain'." -ForegroundColor Yellow
        Write-Host "Inicia sesion en Cloudflare y selecciona '$apexDomain'.`n" -ForegroundColor Cyan
        cmd.exe /c "cloudflared tunnel login"

        if (-not (Test-Path $certPath)) {
            Write-Failure "No se completo la autorizacion en el navegador (falta cert.pem)."
            return $false
        }
    }

    # 3.2 Creacion de Tunel
    Write-Host "Verificando existencia del tunel en Cloudflare..." -ForegroundColor Cyan
    $existing = (cmd.exe /c "cloudflared tunnel list") | Out-String
    $tunnelId = ""
    $pattern = "$TunnelName\s+([a-f0-9\-]+)"
    if ($existing -match $pattern) {
        $tunnelId = $matches[1]
        Write-Success "Tunel existente detectado: $TunnelName (ID: $tunnelId)"
    } else {
        $createOut = (cmd.exe /c "cloudflared tunnel create $TunnelName") | Out-String
        if ($createOut -match "with id ([a-f0-9\-]+)") {
            $tunnelId = $matches[1]
            Write-Success "Tunel creado con exito. ID: $tunnelId"
        } else {
            Write-Failure "Error al crear tunel: $createOut"
            return $false
        }
    }

    # 3.3 Ruta DNS
    Write-Host "Configurando registro DNS '$Hostname' en Cloudflare..." -ForegroundColor Cyan
    cmd.exe /c "cloudflared tunnel route dns -f $TunnelName $Hostname"
    Write-Success "Ruta DNS configurada: $Hostname -> $TunnelName"

    # 3.4 Guardar configuracion en ProgramData
    if (-not (Test-Path $ServiceConfigDir)) {
        New-Item -ItemType Directory -Force -Path $ServiceConfigDir | Out-Null
    }

    $userCred = Join-Path $CloudflaredDir "$tunnelId.json"
    $serviceCred = Join-Path $ServiceConfigDir "$tunnelId.json"
    if (Test-Path $userCred) {
        Copy-Item -Path $userCred -Destination $serviceCred -Force
    }

    $configYaml = @"
tunnel: $tunnelId
credentials-file: $serviceCred

ingress:
  - hostname: $Hostname
    service: $LocalService
    originRequest:
      noTLSVerify: true
      http2Origin: true
  - service: http_status:404
"@
    [System.IO.File]::WriteAllText($configPath, $configYaml, [System.Text.Encoding]::UTF8)
    Write-Success "Configuracion generada en: $configPath"
    return $true
}

# 4. Modo Bajo Demanda (On-Demand / Consola)
function Start-OnDemandTunnel {
    Write-Header "Iniciando Servidor DIITRA Bajo Demanda"

    if (-not (Ensure-Cloudflared)) { return }
    if (-not (Ensure-TunnelConfig)) { return }

    # Verificar que IIS este respondiendo
    $iisRunning = (Get-Service W3SVC -ErrorAction SilentlyContinue).Status -eq 'Running'
    if (-not $iisRunning) {
        Write-Warn "El servicio IIS (W3SVC) esta detenido. Iniciando IIS..."
        Start-Service W3SVC -ErrorAction SilentlyContinue
    }

    $configPath = Join-Path $ServiceConfigDir "config.yml"

    Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Green
    Write-Host "│  SERVIDOR ONLINE (MODO BAJO DEMANDA)                        │" -ForegroundColor Green -Bold
    Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Green
    Write-Host "│  URL Publica: https://$Hostname/diitra" -ForegroundColor White
    Write-Host "│  API Ping:    https://$Hostname/apiDiitra/api/ping" -ForegroundColor White
    Write-Host "│  Destino:     $LocalService (IIS Local)" -ForegroundColor White
    Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Green
    Write-Host "│  Para apagar el servidor, presiona [Ctrl + C] en cualquier  │" -ForegroundColor Yellow
    Write-Host "│  momento. Al salir, tu maquina vuelve a ser 100% privada.   │" -ForegroundColor Yellow
    Write-Host "└─────────────────────────────────────────────────────────────┘`n" -ForegroundColor Green

    # Ejecutar el tunel en primer plano
    cmd.exe /c "cloudflared tunnel --config `"$configPath`" run"
}

# 5. Diagnostico Integral de Salud (Health Check)
function Run-HealthCheck {
    Write-Header "Diagnostico de Salud del Sistema (Health Check)"
    
    # 5.1 Verificar IIS
    Write-Host "1. Estado del Servicio IIS (W3SVC):" -NoNewline
    $w3svc = Get-Service W3SVC -ErrorAction SilentlyContinue
    if ($w3svc -and $w3svc.Status -eq 'Running') {
        Write-Host " [RUNNING / ACTIVO]" -ForegroundColor Green
    } else {
        Write-Host " [DETENIDO]" -ForegroundColor Red
    }

    # 5.2 Verificar respuesta local de IIS
    Write-Host "2. Respuesta Local de IIS (http://localhost:80/diitra):" -NoNewline
    try {
        $localPing = Invoke-WebRequest -Uri "http://localhost:80/diitra/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($localPing.StatusCode -eq 200) {
            Write-Host " [OK 200 - IIS respondiendo]" -ForegroundColor Green
        } else {
            Write-Host " [Codigo $($localPing.StatusCode)]" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [FALLO: No responde localmente en puerto 80]" -ForegroundColor Red
    }

    # 5.3 Verificar API Backend en IIS
    Write-Host "3. Respuesta Local de la API (.NET):" -NoNewline
    try {
        $apiPing = Invoke-RestMethod -Uri "http://localhost:80/apiDiitra/api/ping" -TimeoutSec 3 -ErrorAction Stop
        if ($apiPing.status -eq 'healthy') {
            Write-Host " [OK - API Healthy]" -ForegroundColor Green
        } else {
            Write-Host " [Respuesta inesperada]" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [FALLO: API no responde en /apiDiitra/api/ping]" -ForegroundColor Red
    }

    # 5.4 Resolucion DNS de Cloudflare
    Write-Host "4. Resolucion DNS Publica ($Hostname):" -NoNewline
    try {
        $dns = Resolve-DnsName -Name $Hostname -Type CNAME -ErrorAction Stop
        Write-Host " [OK -> $($dns.NameHost)]" -ForegroundColor Green
    } catch {
        Write-Host " [AVISO: No se pudo resolver CNAME via DNS local]" -ForegroundColor Yellow
    }

    # 5.5 Estado del Servicio de Windows
    Write-Host "5. Estado del Servicio de Windows (24/7):" -NoNewline
    $svc = Get-Service Cloudflared -ErrorAction SilentlyContinue
    if ($svc) {
        $color = if ($svc.Status -eq 'Running') { "Green" } else { "Yellow" }
        Write-Host " [$($svc.Status)]" -ForegroundColor $color
    } else {
        Write-Host " [No instalado / Modo Bajo Demanda]" -ForegroundColor Gray
    }

    # 5.6 Ping a la URL Publica HTTPS
    Write-Host "6. Conectividad Publica HTTPS (https://$Hostname):" -NoNewline
    try {
        $pubPing = Invoke-WebRequest -Uri "https://$Hostname/apiDiitra/api/ping" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        if ($pubPing.StatusCode -eq 200) {
            Write-Host " [EN LINEA - 200 OK]" -ForegroundColor Green -Bold
        } else {
            Write-Host " [Codigo $($pubPing.StatusCode)]" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [OFFLINE / En espera de iniciar tunel]" -ForegroundColor Gray
    }
}

# 6. Gestion del Servicio Permanente 24/7 (Instalar)
function Install-PermanentService {
    Write-Header "Instalando Tunel como Servicio de Windows (24/7 Persistente)"
    $origEAP = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    try {
        if (-not (Ensure-TunnelConfig)) { return }

        $sourceConfig = Join-Path $ServiceConfigDir "config.yml"

        # Sincronizar al perfil del sistema (donde corre LocalSystem en reinicios)
        if (-not (Test-Path $SystemProfileDir)) {
            New-Item -ItemType Directory -Force -Path $SystemProfileDir | Out-Null
        }
        Get-ChildItem -Path $ServiceConfigDir -File | ForEach-Object {
            Copy-Item -Path $_.FullName -Destination $SystemProfileDir -Force
        }

        Write-Host "Limpiando servicios previos..." -ForegroundColor Yellow
        cmd.exe /c "taskkill /F /T /IM cloudflared.exe >nul 2>&1"
        cmd.exe /c "sc.exe stop Cloudflared >nul 2>&1"
        cmd.exe /c "cloudflared service uninstall >nul 2>&1"
        Start-Sleep -Seconds 2

        Write-Host "Instalando servicio oficial..." -ForegroundColor Cyan
        cmd.exe /c "cloudflared service install >nul 2>&1"
        Start-Sleep -Seconds 2

        # Inyectar binPath persistente en el Registro de Windows
        $exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
        if (-not $exe) { $exe = "C:\Program Files (x86)\cloudflared\cloudflared.exe" }
        $targetConfig = Join-Path $SystemProfileDir "config.yml"
        $binPathValue = "`"$exe`" tunnel --config `"$targetConfig`" run"
        
        Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Services\Cloudflared" -Name "ImagePath" -Value $binPathValue -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1

        Start-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3

        $svcCheck = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($svcCheck -and $svcCheck.Status -eq 'Running') {
            Write-Success "Servicio 'cloudflared' instalado y corriendo 24/7."
            Write-Host "`nTu servidor ya esta disponible en: https://$Hostname/diitra" -ForegroundColor Green
        } else {
            Write-Warn "El servicio se instalo pero esta en estado: $($svcCheck.Status)."
        }
    }
    finally {
        $ErrorActionPreference = $origEAP
    }
}

# 7. Desinstalar Servicio Permanente
function Uninstall-PermanentService {
    Write-Header "Desinstalando Servicio Permanente de Windows"
    $origEAP = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    try {
        $svc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        if (-not $svc) {
            Write-Success "El servicio 'cloudflared' no esta instalado en este equipo."
            return
        }

        Write-Host "Deteniendo proceso y servicio de fondo..." -ForegroundColor Yellow
        cmd.exe /c "taskkill /F /T /IM cloudflared.exe >nul 2>&1"
        cmd.exe /c "sc.exe stop Cloudflared >nul 2>&1"
        cmd.exe /c "cloudflared service uninstall >nul 2>&1"
        Start-Sleep -Seconds 2

        $svcCheck = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        if (-not $svcCheck) {
            Write-Success "Servicio de Windows desinstalado por completo."
            Write-Host "Ahora el tunel solo se encendera cuando ejecutes la opcion [1] (Bajo Demanda)." -ForegroundColor Cyan
        } else {
            Write-Warn "El servicio quedo en estado: $($svcCheck.Status)."
        }
    }
    finally {
        $ErrorActionPreference = $origEAP
    }
}

# 8. Redireccion Raiz en IIS
function Setup-RootRedirect {
    Write-Header "Configurando Redireccion Raiz (/) -> (/diitra) en IIS"
    $rootPath = "C:\inetpub\wwwroot"
    if (Test-Path $rootPath) {
        $htmlRedirect = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/diitra/">
    <title>DIITRA - Redirigiendo...</title>
    <script>window.location.replace("/diitra/");</script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #000; color: #fff;">
    <p>Redirigiendo a DIITRA...</p>
</body>
</html>
"@
        $targetFile = Join-Path $rootPath "index.html"
        [System.IO.File]::WriteAllText($targetFile, $htmlRedirect, [System.Text.Encoding]::UTF8)
        Write-Success "Pagina de aterrizaje configurada en: $targetFile"
    } else {
        Write-Warn "No se encontro el directorio $rootPath."
    }
}

# 9. Limpieza de Seguridad
function Clean-SecurityCert {
    Write-Header "Limpieza de Seguridad Local (cert.pem)"
    $cert = Join-Path $CloudflaredDir "cert.pem"
    if (Test-Path $cert) {
        Remove-Item -Path $cert -Force -ErrorAction SilentlyContinue
        Write-Success "Certificado administrativo 'cert.pem' eliminado del equipo."
    } else {
        Write-Success "No hay ningun cert.pem en este equipo (Ya esta limpio y seguro)."
    }
}

# 10. Bucle Principal de Control
do {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "        DIITRA - CLOUDFLARE TUNNEL MANAGER        " -ForegroundColor Cyan -Bold
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " Dominio: https://$Hostname" -ForegroundColor White
    Write-Host " Destino: $LocalService (IIS Local)" -ForegroundColor White

    $svc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
        $modeText = "SERVICIO 24/7 ACTIVO"
        $modeColor = "Green"
    } elseif ($svc) {
        $modeText = "SERVICIO INSTALADO ($($svc.Status))"
        $modeColor = "Yellow"
    } else {
        $modeText = "MODO BAJO DEMANDA (DETENIDO)"
        $modeColor = "Gray"
    }
    Write-Host " Estado:  " -NoNewline
    Write-Host "[$modeText]" -ForegroundColor $modeColor
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [1] INICIAR SERVIDOR BAJO DEMANDA (Recomendado)" -ForegroundColor Green -Bold
    Write-Host " [2] Diagnostico de Salud (Health Check Completo)"
    Write-Host " [3] Configurar Redireccion Raiz en IIS (/ -> /diitra)"
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [4] Instalar como Servicio Permanente 24/7 (Fijo)"
    Write-Host " [5] Desinstalar Servicio Permanente de Windows"
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [C] Cambiar Dominio o Servicio Destino"
    Write-Host " [L] Limpieza de Seguridad (Borrar cert.pem)"
    Write-Host " [Q] Salir"
    Write-Host "==================================================" -ForegroundColor Cyan

    $opt = Read-Host "Selecciona una opcion [1-5, C, L o Q]"

    switch ($opt.ToLower()) {
        '1' {
            Start-OnDemandTunnel
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        '2' {
            Run-HealthCheck
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        '3' {
            Setup-RootRedirect
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        '4' {
            Install-PermanentService
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        '5' {
            Uninstall-PermanentService
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        'c' {
            $newHost = Read-Host "Ingresa el nuevo dominio o subdominio (ej: app.tudominio.com)"
            if (-not [string]::IsNullOrWhiteSpace($newHost)) {
                $Hostname = $newHost.Trim()
                Write-Success "Dominio actualizado a: $Hostname"
            }
            $newService = Read-Host "Ingresa el servicio local destino (Enter para mantener $LocalService)"
            if (-not [string]::IsNullOrWhiteSpace($newService)) {
                $LocalService = $newService.Trim()
                Write-Success "Servicio local actualizado a: $LocalService"
            }
        }
        'l' {
            Clean-SecurityCert
            Read-Host "`nPresiona Enter para volver al menu..."
        }
        'q' {
            Write-Host "`nSaliendo del administrador del tunel. ¡Buen dia!`n" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "Opcion no valida." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($true)
