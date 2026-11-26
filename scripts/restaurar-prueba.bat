@echo off
setlocal EnableExtensions
REM ===========================================================================
REM  Prueba de restauracion de Drop Store.
REM
REM  Restaura el respaldo MAS RECIENTE (C:\respaldos\bd_tiendadrop_AAAAMMDD.sql)
REM  en la base de PRUEBA bd_tiendadrop_prueba, mide cuanto tarda y compara los
REM  conteos de producto, detalle_producto y ventas con la base real.
REM
REM  - Nunca escribe en bd_tiendadrop: solo la lee para comparar conteos.
REM  - bd_tiendadrop_prueba se borra y se vuelve a crear en cada ejecucion.
REM  - Pide la contrasena una sola vez (-p); no se guarda en este archivo.
REM  - Registro: C:\respaldos\restauracion_AAAAMMDD.log
REM
REM  Uso:   scripts\restaurar-prueba.bat           (usuario root)
REM  Objetivo de continuidad: RTO 2 h.
REM ===========================================================================

set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 9.4\bin"
set "ORIGEN=bd_tiendadrop"
set "PRUEBA=bd_tiendadrop_prueba"
set "DESTINO=C:\respaldos"
if "%DB_USER%"=="" (set "USUARIO=root") else (set "USUARIO=%DB_USER%")

REM Proteccion: la base de destino nunca puede ser la real.
if /i "%PRUEBA%"=="%ORIGEN%" (
  echo [ERROR] La base de prueba no puede llamarse igual que la real.
  exit /b 1
)
if not exist "%MYSQL_BIN%\mysql.exe" (
  echo [ERROR] No se encontro mysql en "%MYSQL_BIN%".
  exit /b 1
)

REM El nombre lleva la fecha AAAAMMDD: el primero en orden descendente es el mas reciente.
set "ULTIMO="
for /f "delims=" %%f in ('dir /b /a-d /o-n "%DESTINO%\%ORIGEN%_2*.sql" 2^>nul') do if not defined ULTIMO set "ULTIMO=%%f"
if not defined ULTIMO (
  echo [ERROR] No hay respaldos %ORIGEN%_AAAAMMDD.sql en %DESTINO%. Ejecuta primero scripts\respaldo.bat
  exit /b 1
)
set "SQL_ARCHIVO=%DESTINO%\%ULTIMO%"
for %%A in ("%SQL_ARCHIVO%") do set "TAMANO=%%~zA"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "FECHA=%%i"
set "LOG=%DESTINO%\restauracion_%FECHA%.log"

echo ==========================================================
echo  Prueba de restauracion
echo  Respaldo: %SQL_ARCHIVO% (%TAMANO% bytes)
echo  Destino:  %PRUEBA%
echo ==========================================================

REM Todo va en una sola sesion de mysql (una sola contrasena). No se usa el
REM comando SOURCE del cliente: desde MySQL 9 los comandos locales del cliente
REM vienen desactivados por defecto (--commands=FALSE). En su lugar se arma un
REM archivo temporal = encabezado + respaldo + pie y se envia completo por stdin.
REM Las horas de inicio y de fin las da el servidor; la duracion cubre crear la
REM base y cargar el respaldo.
set "CABECERA=%TEMP%\dropstore_restauracion_cabecera.sql"
set "PIE=%TEMP%\dropstore_restauracion_pie.sql"
set "COMPLETO=%TEMP%\dropstore_restauracion_completo.sql"
>"%CABECERA%"  echo SET @inicio = NOW(3);
>>"%CABECERA%" echo DROP DATABASE IF EXISTS %PRUEBA%;
>>"%CABECERA%" echo CREATE DATABASE %PRUEBA% CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
>>"%CABECERA%" echo USE %PRUEBA%;
>"%PIE%"  echo.
>>"%PIE%" echo SET @fin = NOW(3);
>>"%PIE%" echo SELECT DATE_FORMAT(@inicio, '%%Y-%%m-%%d %%H:%%i:%%s') AS inicio, DATE_FORMAT(@fin, '%%Y-%%m-%%d %%H:%%i:%%s') AS fin, ROUND(TIMESTAMPDIFF(MICROSECOND, @inicio, @fin) / 1000000, 2) AS duracion_segundos;
>>"%PIE%" echo SELECT tabla, original AS %ORIGEN%, restaurada AS %PRUEBA%, IF(original = restaurada, 'SI', 'NO') AS coincide FROM (
>>"%PIE%" echo   SELECT 'producto' AS tabla, (SELECT COUNT(*) FROM %ORIGEN%.producto) AS original, (SELECT COUNT(*) FROM %PRUEBA%.producto) AS restaurada
>>"%PIE%" echo   UNION ALL SELECT 'detalle_producto', (SELECT COUNT(*) FROM %ORIGEN%.detalle_producto), (SELECT COUNT(*) FROM %PRUEBA%.detalle_producto)
>>"%PIE%" echo   UNION ALL SELECT 'ventas', (SELECT COUNT(*) FROM %ORIGEN%.ventas), (SELECT COUNT(*) FROM %PRUEBA%.ventas)
>>"%PIE%" echo ) AS conteos;
copy /b "%CABECERA%" + "%SQL_ARCHIVO%" + "%PIE%" "%COMPLETO%" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo preparar el archivo temporal de restauracion.
  del "%CABECERA%" "%PIE%" >nul 2>&1
  exit /b 1
)

"%MYSQL_BIN%\mysql.exe" -u %USUARIO% -p --default-character-set=utf8mb4 --table < "%COMPLETO%" > "%LOG%"
set "RESULTADO=%ERRORLEVEL%"
del "%CABECERA%" "%PIE%" "%COMPLETO%" >nul 2>&1
if not "%RESULTADO%"=="0" (
  echo [ERROR] La restauracion fallo. Revisa la contrasena y el registro %LOG%.
  exit /b 1
)
type "%LOG%"
echo  Respaldo usado: %SQL_ARCHIVO%
echo  Registro:       %LOG%
echo  Nota: si hubo ventas despues del respaldo, la base real tendra mas filas.
echo ==========================================================
exit /b 0
