#Requires -Version 5.1
# ==============================================================================
# Script de Configuracion y Automatizacion de Cloudflare Tunnel (Windows)
# ==============================================================================
# Automatiza la creacion, enrutamiento DNS e instalacion como servicio Windows.
# ==============================================================================

param (
    [Parameter(Mandatory = $false, HelpMessage = "Subdominio o dominio a exponer via Cloudflare")]
    [string]$Hostname = "diitra.doicela.dev",

    [Parameter(Mandatory = $false, HelpMessage = "Destino local HTTP a donde apunta el tunel")]
    [string]$LocalService = "http://localhost:80",

    [Parameter(Mandatory = $false, HelpMessage = "Nombre identificador del tunel en Cloudflare")]
    [string]$TunnelName = "diitra-tunnel"
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "DIITRA - Cloudflare Tunnel Manager"

# 1. Verificar elevacion de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host " [!] ERROR: Este script requiere privilegios de Administrador." -ForegroundColor Red
    Write-Host " Reabriendo en una nueva ventana elevada..." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Hostname `"$Hostname`" -LocalService `"$LocalService`" -TunnelName `"$TunnelName`"" -Verb RunAs
    exit
}

$CloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$ServiceConfigDir = "C:\ProgramData\cloudflared"

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

# 2. Verificar e Instalar cloudflared
function Ensure-Cloudflared {
    Write-Header "Verificando binario cloudflared"
    if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
        $ver = (cmd.exe /c "cloudflared --version")
        Write-Success "cloudflared instalado: $ver"
        return $true
    }

    Write-Warn "cloudflared no esta instalado en el sistema."
    $inst = Read-Host "Deseas instalarlo automaticamente mediante winget? [S/N]"
    if ($inst -match '^(s|y)$') {
        Write-Host "Instalando Cloudflare.cloudflared via winget..." -ForegroundColor Cyan
        cmd.exe /c "winget install --id Cloudflare.cloudflared -e --silent --accept-source-agreements --accept-package-agreements"
        
        # Refrescar variable PATH
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path = "$machinePath;$userPath"
        
        if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
            Write-Success "cloudflared instalado correctamente."
            return $true
        } else {
            Write-Failure "No se detecto cloudflared en el PATH tras la instalacion. Cierra y reabre la consola de PowerShell como Administrador."
            return $false
        }
    }
    return $false
}

# 3. Autenticacion con Cloudflare
function Login-Cloudflare {
    $apexParts = $Hostname -split '\.'
    $apexDomain = if ($apexParts.Count -ge 2) { ($apexParts[-2..-1] -join '.') } else { $Hostname }

    Write-Header "Autenticacion con Cloudflare"
    Write-Host "Se abrira tu navegador para autorizar la zona '$apexDomain'." -ForegroundColor Yellow
    Write-Host "Inicia sesion en Cloudflare y selecciona el dominio '$apexDomain'.`n" -ForegroundColor Cyan
    
    cmd.exe /c "cloudflared tunnel login"
    
    $certPath = Join-Path $CloudflaredDir "cert.pem"
    if (Test-Path $certPath) {
        Write-Success "Certificado de autenticacion generado con exito en: $certPath"
    } else {
        Write-Failure "No se encontro cert.pem. Verifica que autorizaste el dominio en el navegador."
    }
}

# 4. Crear Tunel y Enrutar DNS
function Setup-Tunnel {
    Write-Header "Creacion y Configuracion del Tunel"
    
    $certPath = Join-Path $CloudflaredDir "cert.pem"
    if (-not (Test-Path $certPath)) {
        Write-Failure "Primero debes autenticarte con la opcion [1] (cloudflared tunnel login)."
        return
    }

    Write-Host "Verificando si el tunel '$TunnelName' ya existe..." -ForegroundColor Cyan
    $existing = (cmd.exe /c "cloudflared tunnel list") | Out-String
    
    $tunnelId = ""
    $pattern = "$TunnelName\s+([a-f0-9\-]+)"
    if ($existing -match $pattern) {
        $tunnelId = $matches[1]
        Write-Success "Tunel existente detectado: $TunnelName (ID: $tunnelId)"
    } else {
        Write-Host "Creando tunel '$TunnelName'..." -ForegroundColor Cyan
        $createOut = (cmd.exe /c "cloudflared tunnel create $TunnelName") | Out-String
        if ($createOut -match "with id ([a-f0-9\-]+)") {
            $tunnelId = $matches[1]
            Write-Success "Tunel creado con exito. ID: $tunnelId"
        } else {
            Write-Failure "Fallo al crear el tunel: $createOut"
            return
        }
    }

    # Enrutar DNS en Cloudflare
    Write-Host "Configurando registro DNS '$Hostname' en Cloudflare..." -ForegroundColor Cyan
    cmd.exe /c "cloudflared tunnel route dns -f $TunnelName $Hostname"
    Write-Success "Ruta DNS configurada: $Hostname -> $TunnelName"

    # Preparar carpeta del servicio en C:\ProgramData\cloudflared
    if (-not (Test-Path $ServiceConfigDir)) {
        New-Item -ItemType Directory -Force -Path $ServiceConfigDir | Out-Null
    }
    
    # Copiar credenciales a ProgramData para el servicio de Windows
    $userCred = Join-Path $CloudflaredDir "$tunnelId.json"
    $serviceCred = Join-Path $ServiceConfigDir "$tunnelId.json"
    if (Test-Path $userCred) {
        Copy-Item -Path $userCred -Destination $serviceCred -Force
        Write-Success "Credenciales copiadas a: $serviceCred"
    }

    # Generar config.yml profesional
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

    $configPath = Join-Path $ServiceConfigDir "config.yml"
    [System.IO.File]::WriteAllText($configPath, $configYaml, [System.Text.Encoding]::UTF8)
    Write-Success "Archivo de configuracion generado en: $configPath"
}

# 5. Instalar como Servicio de Windows (24/7)
function Install-WindowsService {
    Write-Header "Instalando Cloudflare Tunnel como Servicio de Windows"
    $origEAP = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    try {
        $configPath = Join-Path $ServiceConfigDir "config.yml"
        if (-not (Test-Path $configPath)) {
            Write-Failure "El archivo $configPath no existe. Ejecuta primero la opcion [2]."
            return
        }

        Write-Host "Deteniendo cualquier proceso o servicio cloudflared previo..." -ForegroundColor Yellow
        cmd.exe /c "taskkill /F /T /IM cloudflared.exe >nul 2>&1"
        cmd.exe /c "sc.exe stop Cloudflared >nul 2>&1"
        cmd.exe /c "cloudflared service uninstall >nul 2>&1"
        Start-Sleep -Seconds 2

        Write-Host "Registrando servicio cloudflared en Windows..." -ForegroundColor Cyan
        cmd.exe /c "cloudflared service install >nul 2>&1"
        Start-Sleep -Seconds 2

        # Asegurar que el servicio ejecute el comando completo con la configuracion del tunel
        $exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
        if (-not $exe) { $exe = "C:\Program Files (x86)\cloudflared\cloudflared.exe" }
        $binPath = "`"$exe`" --config `"$configPath`" tunnel run"
        Write-Host "Configurando parametros del tunel en el servicio..." -ForegroundColor Cyan
        cmd.exe /c "sc.exe config Cloudflared binPath= `"$binPath`" >nul 2>&1"
        Start-Sleep -Seconds 1

        Start-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        $svcCheck = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($svcCheck -and $svcCheck.Status -eq 'Running') {
            Write-Success "Servicio 'cloudflared' corriendo 24/7 en Windows."
            Write-Host "`nTu servidor ya esta disponible en: https://$Hostname/diitra" -ForegroundColor Green
        } else {
            Write-Warn "El servicio esta instalado pero en estado: $($svcCheck.Status)."
        }
    }
    finally {
        $ErrorActionPreference = $origEAP
    }
}

# 6. Configurar redireccion de raiz / a /diitra en IIS
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

# 7. Limpieza de seguridad local (Eliminar cert.pem)
function Clean-SecurityCert {
    Write-Header "Limpieza de Seguridad Local (cert.pem)"
    $cert = Join-Path $CloudflaredDir "cert.pem"
    if (Test-Path $cert) {
        Remove-Item -Path $cert -Force -ErrorAction SilentlyContinue
        Write-Success "Certificado administrativo 'cert.pem' eliminado del equipo."
    } else {
        Write-Success "No hay ningun cert.pem presente en este equipo (Ya esta limpio)."
    }
}

# 8. Menu interactivo
do {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "     DIITRA - GESTION DE CLOUDFLARE TUNNEL        " -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " Dominio destino: https://$Hostname" -ForegroundColor White
    Write-Host " Destino Local:   $LocalService" -ForegroundColor White
    Write-Host " Nombre Tunel:    $TunnelName" -ForegroundColor White
    Write-Host "==================================================" -ForegroundColor Cyan
    
    $svcStatus = (Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue).Status
    $statusColor = if ($svcStatus -eq 'Running') { "Green" } else { "Gray" }
    $dispStatus = if ($svcStatus) { $svcStatus } else { "NO INSTALADO" }
    Write-Host " Estado del servicio Windows: " -NoNewline
    Write-Host "[$dispStatus]" -ForegroundColor $statusColor
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host " [1] Autenticar con Cloudflare (Login navegador)"
    Write-Host " [2] Crear Tunel y Enrutar DNS ($Hostname)"
    Write-Host " [3] Instalar e Iniciar como Servicio de Windows (24/7)"
    Write-Host " [4] Configurar Redireccion Raiz en IIS (/ -> /diitra)"
    Write-Host " [5] Probar Tunel en Vivo (Consola)"
    Write-Host " [6] Ver Estado / Reiniciar Servicio"
    Write-Host " [C] Cambiar Dominio o Servicio Destino"
    Write-Host " [L] Limpieza de Seguridad (Borrar cert.pem)"
    Write-Host " [7] Salir"
    Write-Host "==================================================" -ForegroundColor Cyan

    $opt = Read-Host "Selecciona una opcion [1-7, C o L]"

    switch ($opt) {
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
            break
        }
        'l' {
            Clean-SecurityCert
            Read-Host "`nPresiona Enter para continuar..."
        }
        '1' {
            if (Ensure-Cloudflared) { Login-Cloudflare }
            Read-Host "`nPresiona Enter para continuar..."
        }
        '2' {
            if (Ensure-Cloudflared) { Setup-Tunnel }
            Read-Host "`nPresiona Enter para continuar..."
        }
        '3' {
            Install-WindowsService
            Read-Host "`nPresiona Enter para continuar..."
        }
        '4' {
            Setup-RootRedirect
            Read-Host "`nPresiona Enter para continuar..."
        }
        '5' {
            Write-Host "`nIniciando tunel en modo consola (Ctrl + C para salir)..." -ForegroundColor Yellow
            $configPath = Join-Path $ServiceConfigDir "config.yml"
            cmd.exe /c "cloudflared --config `"$configPath`" run"
        }
        '6' {
            $s = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
            if ($s) {
                Write-Host "`nServicio: $($s.Name) - Estado: $($s.Status)" -ForegroundColor Cyan
                $restart = Read-Host "Deseas reiniciar el servicio? [S/N]"
                if ($restart -match '^(s|y)$') {
                    Restart-Service cloudflared -Force
                    Write-Success "Servicio reiniciado."
                }
            } else {
                Write-Warn "El servicio 'cloudflared' no esta instalado."
            }
            Read-Host "`nPresiona Enter para continuar..."
        }
        '7' {
            Write-Host "`nSaliendo del administrador del tunel.`n" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "Opcion invalida." -ForegroundColor Red
        }
    }
} while ($true)
