# ==============================================================================
# Script de Despliegue Automático Premium para DIITRA (IIS Local)
# ==============================================================================
# Compila, respalda y despliega el Frontend (React) y/o Backend (.NET) en IIS.
# Debe ejecutarse como Administrador.

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "DIITRA Enterprise Deployment Utility"

# 1. Verificar si se ejecuta como Administrador y Auto-elevar
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host " [!] ERROR: Este script requiere privilegios de Administrador para IIS." -ForegroundColor Red
    Write-Host " Reabriendo en una nueva ventana con permisos elevados..." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Red
    Start-Process pwsh -ArgumentList "-NoExit -NoProfile -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Configuración del Entorno
$ProjectRoot = "c:\Users\DESARROLLADOR\Desktop\Proyectos\diitra"
$WebDir = Join-Path $ProjectRoot "diitra_web"
$ApiDir = Join-Path $ProjectRoot "backend\diitra_api"
$PublishTemp = Join-Path $ProjectRoot "backend\publish"
$BackupDir = Join-Path $ProjectRoot "scripts\despliegue\backups"

$IisWebPath = "C:\inetpub\wwwroot\diitra"
$IisApiPath = "C:\inetpub\wwwroot\apiDiitra"
$AppPoolName = "apiDiitra"

$DeployState = @{ EnableBackup = $false }

# Asegurar directorios esenciales
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $IisWebPath | Out-Null
New-Item -ItemType Directory -Force -Path $IisApiPath | Out-Null

# Importar Módulo de IIS si está disponible
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Banners y Formato
function Write-Header ($text) {
    Write-Host ""
    Write-Host "┌$("-" * ($text.Length + 4))┐" -ForegroundColor Cyan
    Write-Host "│  $text  │" -ForegroundColor Cyan -Bold
    Write-Host "└$("-" * ($text.Length + 4))┘" -ForegroundColor Cyan
}

function Write-Step ($emoji, $text) {
    Write-Host " $emoji $text" -ForegroundColor White
}

function Write-Success ($text) {
    Write-Host "  ✓ $text" -ForegroundColor Green -Bold
}

function Write-Failure ($text) {
    Write-Host "  ❌ ERROR: $text" -ForegroundColor Red -Bold
}

# 2. Verificar dependencias del sistema
function Check-Dependencies {
    Write-Header "Chequeo de Requisitos y Entorno"
    
    $ok = $true

    # Verificar Node.js y NPM
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $nodeVer = (cmd.exe /c "node -v")
        Write-Success "Node.js detectado: $nodeVer"
    } else {
        Write-Failure "Node.js / NPM no instalado o no en el PATH."
        $ok = $false
    }

    # Verificar .NET SDK
    if (Get-Command dotnet -ErrorAction SilentlyContinue) {
        $dotnetVer = (dotnet --version)
        Write-Success ".NET SDK detectado: v$dotnetVer"
    } else {
        Write-Failure ".NET SDK no instalado o no en el PATH."
        $ok = $false
    }

    # Verificar IIS y App Pool
    $appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
    if (Get-Command Get-WebAppPool -ErrorAction SilentlyContinue) {
        if (Get-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue) {
            Write-Success "IIS App Pool '$AppPoolName' encontrado (vía cmdlet)."
        } else {
            Write-Host "  ⚠️ ADVERTENCIA: El App Pool '$AppPoolName' no existe en IIS." -ForegroundColor Yellow
        }
    } elseif (Test-Path $appcmd) {
        Write-Success "IIS detectado (vía appcmd.exe)."
    } else {
        Write-Host "  ⚠️ ADVERTENCIA: Módulos de IIS no cargados y appcmd.exe no encontrado. ¿Está habilitado IIS en Windows?" -ForegroundColor Yellow
    }

    if (-not $ok) {
        Write-Host "`nFaltan requisitos esenciales. Por favor, corrígelos antes de continuar." -ForegroundColor Red
        Read-Host "Presiona Enter para continuar al menú bajo tu propio riesgo..."
    } else {
        Start-Sleep -Seconds 1
    }
}

# 3. Función de Respaldo Seguro (Backup)
function Backup-Folder ($sourcePath, $name) {
    if (Test-Path $sourcePath) {
        $files = Get-ChildItem -Path $sourcePath -File -Recurse
        if ($files.Count -eq 0) { return } # No hay nada que respaldar

        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $archivePath = Join-Path $BackupDir "Backup_${name}_${timestamp}.zip"
        
        Write-Step "📁" "Creando respaldo de seguridad para $name..."
        
        # Comprimir usando utilidades de PowerShell
        Compress-Archive -Path "$sourcePath\*" -DestinationPath $archivePath -Force
        
        # Limpieza de backups antiguos (Mantener solo los últimos 3 de cada tipo)
        $oldBackups = Get-ChildItem -Path $BackupDir -Filter "Backup_${name}_*" | 
                       Sort-Object LastWriteTime -Descending | 
                       Select-Object -Skip 3
        
        foreach ($old in $oldBackups) {
            Remove-Item $old.FullName -Force
        }
        
        Write-Success "Respaldo creado en: $(Split-Path $archivePath -Leaf)"
    }
}

# 4. Despliegue de Frontend (React)
function Deploy-Frontend {
    Write-Header "Desplegando Frontend (React / Vite)"
    $startTime = [DateTime]::Now

    Push-Location $WebDir
    try {
        if ($DeployState.EnableBackup) { Backup-Folder $IisWebPath "Frontend" }

        Write-Step "⚡" "Compilando activos de producción con Vite..."
        cmd.exe /c "npm run build" | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "Error de compilación en React." }
        
        Write-Step "🚚" "Sincronizando archivos con el directorio de IIS..."
        $exitCode = 0
        robocopy "dist" $IisWebPath /MIR /R:3 /W:5 /NP /NDL /NFL /NJH /NJS | Out-Host
        $exitCode = $LASTEXITCODE
        if ($exitCode -ge 8) { throw "Robocopy falló con código $exitCode." }
        
        $elapsed = [Math]::Round(([DateTime]::Now - $startTime).TotalSeconds, 2)
        Write-Success "Frontend desplegado con éxito en $elapsed segundos."
        return $elapsed
    }
    catch {
        Write-Failure $_
        return -1
    }
    finally {
        # Limpiar carpeta dist temporal
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        }
        Pop-Location
    }
}

# 5. Despliegue de Backend (.NET API)
function Deploy-Backend {
    Write-Header "Desplegando Backend (.NET API)"
    $startTime = [DateTime]::Now

    Push-Location $ApiDir
    try {
        if ($DeployState.EnableBackup) { Backup-Folder $IisApiPath "Backend" }

        Write-Step "⚡" "Compilando y publicando API..."
        dotnet publish -c Release -o $PublishTemp --no-self-contained /p:PublishSingleFile=false | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "Error al compilar y publicar la API." }
        
        # Detener App Pool para evitar archivos bloqueados
        $stoppedAppPool = $false
        if (Get-Command Stop-WebAppPool -ErrorAction SilentlyContinue) {
            Write-Step "🔄" "Deteniendo Application Pool '$AppPoolName' (vía cmdlet)..."
            Stop-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue | Out-Null
            $stoppedAppPool = $true
        } else {
            $appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
            if (Test-Path $appcmd) {
                Write-Step "🔄" "Deteniendo Application Pool '$AppPoolName' (vía appcmd.exe)..."
                & $appcmd stop apppool /apppool.name:$AppPoolName 2>&1 | Out-Null
                $stoppedAppPool = $true
            }
        }

        # Esperar a que se liberen los archivos de la API
        $targetDll = Join-Path $IisApiPath "diitra_api.dll"
        $dllUnlocked = $false
        Write-Step "⏳" "Verificando si los archivos de la API están liberados..."
        for ($i = 0; $i -lt 10; $i++) {
            $isLocked = $false
            if (Test-Path $targetDll) {
                try {
                    $file = [System.IO.File]::Open($targetDll, 'Open', 'Write', 'None')
                    $file.Close()
                } catch {
                    $isLocked = $true
                }
            }
            if (-not $isLocked) {
                $dllUnlocked = $true
                break
            }
            Start-Sleep -Seconds 1
        }

        # Si sigue bloqueado tras 10 segundos, forzamos la detención del proceso w3wp.exe para este App Pool
        if (-not $dllUnlocked) {
            Write-Step "⚠️" "Los archivos siguen bloqueados por IIS. Forzando cierre de procesos worker de IIS (w3wp)..."
            $w3wpProcesses = Get-CimInstance Win32_Process -Filter "name='w3wp.exe'" -ErrorAction SilentlyContinue | Where-Object {
                $_.CommandLine -like "*-ap `"$AppPoolName`"*" -or $_.CommandLine -like "*-ap '$AppPoolName'*"
            }
            foreach ($p in $w3wpProcesses) {
                Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2

            # Volver a verificar
            $isLocked = $false
            if (Test-Path $targetDll) {
                try {
                    $file = [System.IO.File]::Open($targetDll, 'Open', 'Write', 'None')
                    $file.Close()
                } catch {
                    $isLocked = $true
                }
            }
            if (-not $isLocked) {
                $dllUnlocked = $true
            }
        }

        # Si de verdad sigue bloqueado, detenemos el servicio W3SVC por completo
        if (-not $dllUnlocked) {
            Write-Host "  ⚠️ Los archivos continúan bloqueados. Deteniendo servicio completo de IIS (W3SVC)..." -ForegroundColor Yellow
            Stop-Service -Name W3SVC -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
        }

        Write-Step "🚚" "Sincronizando binarios con el directorio de IIS..."
        $exitCode = 0
        robocopy $PublishTemp $IisApiPath /MIR /R:3 /W:5 /NP /NDL /NFL /NJH /NJS | Out-Host
        $exitCode = $LASTEXITCODE
        if ($exitCode -ge 8) {
            Write-Host "  ⚠️ Robocopy reportó una advertencia menor o bloqueo (Código: $exitCode)." -ForegroundColor Yellow
        }

        $elapsed = [Math]::Round(([DateTime]::Now - $startTime).TotalSeconds, 2)
        Write-Success "Backend desplegado con éxito en $elapsed segundos."
        return $elapsed
    }
    catch {
        Write-Failure $_
        return -1
    }
    finally {
        # Limpiar carpeta de publicación temporal
        if (Test-Path $PublishTemp) {
            Remove-Item -Recurse -Force $PublishTemp -ErrorAction SilentlyContinue
        }
        # Asegurar de reactivar el App Pool pase lo que pase
        # Primero asegurar que el servicio W3SVC está iniciado (en caso de que lo hayamos detenido)
        if ((Get-Service -Name W3SVC -ErrorAction SilentlyContinue).Status -ne 'Running') {
            Write-Step "🔄" "Iniciando servicio IIS (W3SVC)..."
            Start-Service -Name W3SVC -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }

        $startedAppPool = $false
        if (Get-Command Start-WebAppPool -ErrorAction SilentlyContinue) {
            Write-Step "🔄" "Re-iniciando Application Pool '$AppPoolName' (vía cmdlet)..."
            Start-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue | Out-Null
            $startedAppPool = $true
        } else {
            $appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
            if (Test-Path $appcmd) {
                Write-Step "🔄" "Re-iniciando Application Pool '$AppPoolName' (vía appcmd.exe)..."
                & $appcmd start apppool /apppool.name:$AppPoolName 2>&1 | Out-Null
                $startedAppPool = $true
            }
        }
        Pop-Location
    }
}

# Bucle principal de control
Check-Dependencies

do {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "        DIITRA - CONTROL DE DESPLIEGUE            " -ForegroundColor Cyan -Bold
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " [1] Desplegar Frontend (React/Vite)"
    Write-Host " [2] Desplegar Backend (.NET)"
    Write-Host " [3] Desplegar TODO (Frontend + Backend)"
    Write-Host " [4] Ver Respaldos Recientes"
    
    $status = if ($DeployState.EnableBackup) { "ACTIVADO" } else { "DESACTIVADO" }
    $color = if ($DeployState.EnableBackup) { "Green" } else { "Gray" }
    Write-Host " [B] Respaldos automáticos antes de copiar: " -NoNewline
    Write-Host "[$status]" -ForegroundColor $color
    
    Write-Host " [5] Salir de la Utilidad"
    Write-Host "==================================================" -ForegroundColor Cyan
    
    $choice = Read-Host "Selecciona una opción [1-5 o B]"
    
    switch ($choice) {
        'b' {
            $DeployState.EnableBackup = -not $DeployState.EnableBackup
            break
        }
        '1' {
            $t = Deploy-Frontend
            if ($t -gt 0) { Write-Host "`n✓ Completado en $t segundos." -ForegroundColor Green }
            Read-Host "`nPresiona Enter para volver..."
        }
        '2' {
            $t = Deploy-Backend
            if ($t -gt 0) { Write-Host "`n✓ Completado en $t segundos." -ForegroundColor Green }
            Read-Host "`nPresiona Enter para volver..."
        }
        '3' {
            $t1 = Deploy-Frontend
            $t2 = Deploy-Backend
            if ($t1 -gt 0 -and $t2 -gt 0) {
                $total = $t1 + $t2
                Write-Host "`n✓ Despliegue TOTAL completado con éxito en $total segundos!" -ForegroundColor Green -Bold
            }
            Read-Host "`nPresiona Enter para volver..."
        }
        '4' {
            Write-Header "Respaldos Disponibles"
            $backups = Get-ChildItem -Path $BackupDir -Filter "*.zip"
            if ($backups.Count -eq 0 -or $null -eq $backups) {
                Write-Host "No hay respaldos disponibles en este momento." -ForegroundColor Yellow
                Read-Host "`nPresiona Enter para volver..."
            } else {
                $backups | Select-Object Name, @{Name="Tamaño (MB)";Expression={[Math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | 
                    Out-String | Write-Host -ForegroundColor Yellow
                
                $cleanChoice = Read-Host "¿Deseas eliminar todos estos respaldos? [S/N]"
                if ($cleanChoice -eq 's' -or $cleanChoice -eq 'S' -or $cleanChoice -eq 'y' -or $cleanChoice -eq 'Y') {
                    Write-Host "`nEliminando respaldos..." -ForegroundColor Yellow
                    Remove-Item -Path "$BackupDir\*.zip" -Force -ErrorAction SilentlyContinue
                    Write-Success "¡Todos los respaldos han sido eliminados con éxito!"
                    Read-Host "`nPresiona Enter para volver..."
                }
            }
        }
        '5' {
            Write-Host "`nSaliendo. ¡Que tengas un excelente día de desarrollo! 🚀`n" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "Opción no válida. Intenta de nuevo." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($true)
