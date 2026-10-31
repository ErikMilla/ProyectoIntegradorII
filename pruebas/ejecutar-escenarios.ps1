<#
.SYNOPSIS
  Ejecuta los escenarios de carga de lectura del catálogo con registro de recursos.

.DESCRIPTION
  Para cada cantidad de usuarios virtuales: lanza el muestreo de CPU/RAM/disco,
  corre k6 y guarda todo en pruebas\resultados\<fecha-hora>\ :
    entorno.txt                    equipo, versiones, commit y datos de la prueba
    k6-<N>-usuarios.txt / .json    salida original de k6 y su resumen
    recursos-<N>-usuarios.csv      serie temporal de recursos
    resumen.csv                    una fila por escenario (formato del Anexo 27)

  Requisitos: el backend en marcha (con datos), k6 instalado y PowerShell.
  No mide compras, POS, correo ni sesiones: solo lectura del catálogo.

.EXAMPLE
  .\pruebas\ejecutar-escenarios.ps1 -BaseDatos MySQL

.EXAMPLE
  # Ensayo corto para comprobar que todo funciona antes de la sesión completa
  .\pruebas\ejecutar-escenarios.ps1 -Escenarios 1,10 -Duracion 20s -PausaSegundos 5 -BaseDatos H2
#>
param(
  [int[]]$Escenarios = @(1, 10, 25, 50),
  [string]$Duracion = '2m',
  [int]$PausaSegundos = 60,
  [string]$BaseUrl = 'http://localhost:8081',
  [string]$BaseDatos = 'No indicada',
  [string]$K6 = 'k6'
)

$ErrorActionPreference = 'Stop'
$aqui = $PSScriptRoot
$raiz = Split-Path -Parent $aqui
$destino = Join-Path $aqui ('resultados\' + (Get-Date -Format 'yyyyMMdd-HHmm'))
New-Item -ItemType Directory -Path $destino -Force | Out-Null

function Invoke-Seguro([scriptblock]$bloque, [string]$porDefecto = 'no disponible') {
  # Algunos programas (java, k6) escriben a stderr aunque no fallen; PowerShell 5.1
  # lo trataría como error. Aquí se toleran y se convierten a texto.
  $ErrorActionPreference = 'Continue'
  try {
    $r = & $bloque | ForEach-Object { $_.ToString() } | Select-Object -First 1
    if ($null -eq $r -or "$r" -eq '') { $porDefecto } else { "$r".Trim() }
  }
  catch { $porDefecto }
}

# --- 1. El backend debe estar vivo antes de medir ---------------------------
$salud = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -TimeoutSec 10
if ($salud.status -ne 'UP') { throw "El backend no está UP en $BaseUrl (estado: $($salud.status))." }
$variantes = (Invoke-RestMethod -Uri "$BaseUrl/api/productos" -TimeoutSec 30).Count
if ($variantes -eq 0) { throw 'El catálogo está vacío: carga datos de prueba antes de medir.' }

# --- 2. Registro del entorno (lo pide la guía antes de ejecutar) ------------
$so = Get-CimInstance Win32_OperatingSystem
$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
$uploads = Join-Path $raiz 'proyecto-analisis\ProyectoTiendaDrop\uploads'
$uploadsMb = Invoke-Seguro { [math]::Round(((Get-ChildItem $uploads -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB, 1) }
$entorno = @(
  "Fecha:            $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') (hora local)"
  "Commit:           $(Invoke-Seguro { git -C $raiz rev-parse --short HEAD })"
  "Sistema:          $($so.Caption) $($so.Version)"
  "CPU:              $($cpuInfo.Name.Trim()) ($($cpuInfo.NumberOfLogicalProcessors) hilos)"
  "RAM total:        $([math]::Round($so.TotalVisibleMemorySize / 1MB, 1)) GB"
  "Java:             $(Invoke-Seguro { & java -version 2>&1 })"
  "Node.js:          $(Invoke-Seguro { node -v })"
  "k6:               $(Invoke-Seguro { (& $K6 version) })"
  "Base de datos:    $BaseDatos"
  "URL probada:      $BaseUrl"
  "Variantes en /api/productos: $variantes"
  "Tamaño de uploads (MB): $uploadsMb"
  "Generador de carga y servidor comparten equipo: sí (limitación a declarar en el informe)"
  "Escenarios (usuarios virtuales): $($Escenarios -join ', '); duración de cada uno: $Duracion; pausa: $PausaSegundos s"
)
$entorno | Set-Content -Path (Join-Path $destino 'entorno.txt') -Encoding UTF8
Write-Host ($entorno -join "`n")

# --- 3. Calentamiento (no se registra) --------------------------------------
Write-Host "`n== Calentamiento (30 s) =="
$ErrorActionPreference = 'Continue'
& $K6 run -e "BASE_URL=$BaseUrl" --quiet (Join-Path $aqui 'k6\calentamiento.js') 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'

# --- 4. Escenarios -----------------------------------------------------------
$muestreo = Join-Path $aqui 'muestreo-recursos.ps1'
$filas = @()

function Get-Metrica($json, [string]$nombre, [string]$campo) {
  $m = $json.metrics.$nombre
  if ($null -eq $m) { return $null }
  if ($null -ne $m.$campo) { return $m.$campo }
  if ($null -ne $m.values -and $null -ne $m.values.$campo) { return $m.values.$campo }
  return $null
}

foreach ($n in $Escenarios) {
  Write-Host "`n== Escenario: $n usuarios virtuales, $Duracion =="
  $csv = Join-Path $destino "recursos-$n-usuarios.csv"
  $txt = Join-Path $destino "k6-$n-usuarios.txt"
  $json = Join-Path $destino "k6-$n-usuarios.json"

  $proceso = Start-Process -FilePath 'powershell.exe' -PassThru -WindowStyle Hidden -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$muestreo`"",
    '-Salida', "`"$csv`"", '-Usuarios', $n, '-IntervaloSegundos', 10)
  try {
    # k6 escribe sus mensajes en stderr: con 'Stop' PowerShell 5.1 abortaría el script.
    $ErrorActionPreference = 'Continue'
    & $K6 run -e "VUS=$n" -e "DURATION=$Duracion" -e "BASE_URL=$BaseUrl" --summary-export $json (Join-Path $aqui 'k6\catalogo.js') 2>&1 |
      ForEach-Object { $_.ToString() } | Tee-Object -FilePath $txt
    $codigoK6 = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = 'Stop'
    Stop-Process -Id $proceso.Id -Force -ErrorAction SilentlyContinue
  }

  $resumenK6 = Get-Content $json -Raw | ConvertFrom-Json
  $recursos = @(Import-Csv $csv)
  $cpu = @($recursos | ForEach-Object { [double]$_.CPU_pct })
  $ram = @($recursos | ForEach-Object { [double]$_.RAM_pct })
  $disco = @($recursos | ForEach-Object { [double]$_.Disco_usado_pct })
  $erroresRaw = Get-Metrica $resumenK6 'http_req_failed' 'value'
  $p95 = Get-Metrica $resumenK6 'http_req_duration' 'p(95)'

  $filas += [pscustomobject]@{
    Usuarios       = $n
    Duracion       = $Duracion
    Solicitudes    = Get-Metrica $resumenK6 'http_reqs' 'count'
    p95_ms         = if ($null -ne $p95) { [math]::Round([double]$p95, 1) } else { $null }
    Errores_pct    = if ($null -ne $erroresRaw) { [math]::Round([double]$erroresRaw * 100, 2) } else { $null }
    CPU_max_pct    = if ($cpu.Count) { ($cpu | Measure-Object -Maximum).Maximum } else { $null }
    CPU_prom_pct   = if ($cpu.Count) { [math]::Round(($cpu | Measure-Object -Average).Average, 1) } else { $null }
    RAM_max_pct    = if ($ram.Count) { ($ram | Measure-Object -Maximum).Maximum } else { $null }
    Disco_usado_pct = if ($disco.Count) { ($disco | Measure-Object -Maximum).Maximum } else { $null }
    Muestras       = $recursos.Count
    Umbrales_k6    = if ($codigoK6 -eq 0) { 'CUMPLE' } else { 'NO CUMPLE' }
  }

  if ($n -ne $Escenarios[-1]) {
    Write-Host "Pausa de $PausaSegundos s para que el equipo se recupere..."
    Start-Sleep -Seconds $PausaSegundos
  }
}

# --- 5. Resumen --------------------------------------------------------------
$filas | Export-Csv -Path (Join-Path $destino 'resumen.csv') -NoTypeInformation -Encoding UTF8
Write-Host "`n== Resumen (también en resumen.csv) =="
$filas | Format-Table -AutoSize
Write-Host "Resultados guardados en: $destino"
Write-Host 'Meta del SLA: p95 <= 2000 ms y errores < 1 %. CPU o RAM > 85 % sostenido 5 min, o disco > 80 %: revisar.'
