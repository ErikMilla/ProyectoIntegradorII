@echo off
setlocal EnableExtensions
REM ===========================================================================
REM  Respaldo diario de bd_tiendadrop (Drop Store) con mysqldump.
REM
REM  - Copia consistente sin detener la tienda: --single-transaction (InnoDB).
REM  - Destino: C:\respaldos\bd_tiendadrop_AAAAMMDD.sql (crea la carpeta si falta).
REM  - La contrasena la pide mysqldump (-p): no se guarda en este archivo.
REM  - Registro: C:\respaldos\respaldo_AAAAMMDD.log
REM
REM  Uso:   scripts\respaldo.bat                  (usuario root)
REM         set DB_USER=otro_usuario ^& scripts\respaldo.bat
REM
REM  Objetivo de continuidad: RPO 24 h (un respaldo diario, por ejemplo con el
REM  Programador de tareas de Windows). Restauracion de prueba:
REM  scripts\restaurar-prueba.bat
REM  Los archivos .sql NO se suben al repositorio.
REM ===========================================================================

set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 9.4\bin"
set "BASE=bd_tiendadrop"
set "DESTINO=C:\respaldos"
if "%DB_USER%"=="" (set "USUARIO=root") else (set "USUARIO=%DB_USER%")

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "FECHA=%%i"
set "ARCHIVO=%DESTINO%\%BASE%_%FECHA%.sql"
set "PARCIAL=%ARCHIVO%.parcial"
set "LOG=%DESTINO%\respaldo_%FECHA%.log"

if not exist "%MYSQL_BIN%\mysqldump.exe" (
  echo [ERROR] No se encontro mysqldump en "%MYSQL_BIN%".
  exit /b 1
)
if not exist "%DESTINO%" mkdir "%DESTINO%"
if not exist "%DESTINO%" (
  echo [ERROR] No se pudo crear la carpeta %DESTINO%.
  exit /b 1
)

call :ahora INICIO
echo ==========================================================
echo  Respaldo de %BASE%
echo  Destino: %ARCHIVO%
echo  Inicio:  %INICIO%
echo ==========================================================

REM Se escribe primero en un archivo .parcial: si mysqldump falla, el respaldo
REM anterior del mismo dia no se pierde.
"%MYSQL_BIN%\mysqldump.exe" -u %USUARIO% -p --single-transaction --routines --triggers --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 --result-file="%PARCIAL%" %BASE%
if errorlevel 1 (
  echo [ERROR] mysqldump fallo. Revisa usuario, contrasena y que MySQL este encendido.
  if exist "%PARCIAL%" del "%PARCIAL%"
  >>"%LOG%" echo %INICIO% ^| ERROR ^| mysqldump fallo
  exit /b 1
)
move /y "%PARCIAL%" "%ARCHIVO%" >nul

call :ahora FIN
for %%A in ("%ARCHIVO%") do set "TAMANO=%%~zA"
echo  Fin:     %FIN%
echo  Archivo: %ARCHIVO%
echo  Tamano:  %TAMANO% bytes
echo  Resultado: OK
echo ==========================================================
>>"%LOG%" echo %INICIO% ^| %FIN% ^| %ARCHIVO% ^| %TAMANO% bytes ^| OK
exit /b 0

:ahora
for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set "%1=%%t"
exit /b 0
