<#
.SYNOPSIS
  Registra CPU, memoria y disco cada N segundos en un archivo CSV.

.DESCRIPTION
  Sirve para acompañar una prueba de carga (tabla G8 de la guía de evidencias).
  Usa clases CIM, que funcionan igual en Windows en español o en inglés.
  Las columnas de procesos suman todos los procesos con ese nombre
  (java, mysqld, k6). Si el IDE tiene procesos java abiertos, también se suman.

.EXAMPLE
  .\muestreo-recursos.ps1 -Salida recursos-10.csv -Usuarios 10 -DuracionSegundos 130

.EXAMPLE
  # Sin duración: corre hasta detenerlo con Ctrl+C
  .\muestreo-recursos.ps1 -Salida recursos.csv
#>
param(
  [string]$Salida = '.\recursos.csv',
  [string]$Usuarios = '',
  [int]$IntervaloSegundos = 10,
  [int]$DuracionSegundos = 0,
  [string]$Unidad = 'C:'
)

$inicio = Get-Date

function Get-MbProceso([string]$nombre) {
  $procesos = Get-Process -Name $nombre -ErrorAction SilentlyContinue
  if (-not $procesos) { return 0 }
  return [math]::Round((($procesos | Measure-Object -Property WorkingSet64 -Sum).Sum) / 1MB, 0)
}

while ($true) {
  $cpu = (Get-CimInstance -ClassName Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'").PercentProcessorTime
  $so = Get-CimInstance -ClassName Win32_OperatingSystem
  $ramTotalMb = [math]::Round($so.TotalVisibleMemorySize / 1024, 0)
  $ramUsadaMb = $ramTotalMb - [math]::Round($so.FreePhysicalMemory / 1024, 0)
  $disco = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='$Unidad'"
  $discoLibreGb = [math]::Round($disco.FreeSpace / 1GB, 1)
  $discoUsadoPct = [math]::Round((($disco.Size - $disco.FreeSpace) / $disco.Size) * 100, 1)

  [pscustomobject]@{
    Hora            = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    Usuarios        = $Usuarios
    CPU_pct         = [int]$cpu
    RAM_usada_MB    = $ramUsadaMb
    RAM_total_MB    = $ramTotalMb
    RAM_pct         = [math]::Round(($ramUsadaMb / $ramTotalMb) * 100, 1)
    Java_MB         = Get-MbProceso 'java'
    MySQL_MB        = Get-MbProceso 'mysqld'
    K6_MB           = Get-MbProceso 'k6'
    Disco_libre_GB  = $discoLibreGb
    Disco_usado_pct = $discoUsadoPct
  } | Export-Csv -Path $Salida -Append -NoTypeInformation -Encoding UTF8

  if ($DuracionSegundos -gt 0 -and ((Get-Date) - $inicio).TotalSeconds -ge $DuracionSegundos) { break }
  Start-Sleep -Seconds $IntervaloSegundos
}
