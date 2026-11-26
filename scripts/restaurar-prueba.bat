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
set "SQL_SOURCE=%SQL_ARCHIVO:\=/%"
for %%A in ("%SQL_ARCHIVO%") do set "TAMANO=%%~zA"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "FECHA=%%i"
set "LOG=%DESTINO%\restauracion_%FECHA%.log"

echo ==========================================================
echo  Prueba de restauracion
echo  Respaldo: %SQL_ARCHIVO% (%TAMANO% bytes)
echo  Destino:  %PRUEBA%
echo ==========================================================

REM Todo va en una sola sesion de mysql (una sola contrasena), leyendo un guion
REM SQL generado aqui (sin secretos). SOURCE va en su propia linea porque el
REM cliente mysql toma como nombre de archivo el resto de la linea.
REM Las horas de inicio y de fin las da el servidor; la duracion cubre crear la
REM base y cargar el respaldo.
set "GUION=%TEMP%\dropstore_restauracion_prueba.sql"
>"%GUION%"  echo SET @inicio = NOW(3);
>>"%GUION%" echo DROP DATABASE IF EXISTS %PRUEBA%;
>>"%GUION%" echo CREATE DATABASE %PRUEBA% CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
>>"%GUION%" echo USE %PRUEBA%;
>>"%GUION%" echo SOURCE %SQL_SOURCE%
>>"%GUION%" echo SET @fin = NOW(3);
>>"%GUION%" echo SELECT DATE_FORMAT(@inicio, '%%Y-%%m-%%d %%H:%%i:%%s') AS inicio, DATE_FORMAT(@fin, '%%Y-%%m-%%d %%H:%%i:%%s') AS fin, ROUND(TIMESTAMPDIFF(MICROSECOND, @inicio, @fin) / 1000000, 2) AS duracion_segundos;
>>"%GUION%" echo SELECT tabla, original AS %ORIGEN%, restaurada AS %PRUEBA%, IF(original = restaurada, 'SI', 'NO') AS coincide FROM (
>>"%GUION%" echo   SELECT 'producto' AS tabla, (SELECT COUNT(*) FROM %ORIGEN%.producto) AS original, (SELECT COUNT(*) FROM %PRUEBA%.producto) AS restaurada
>>"%GUION%" echo   UNION ALL SELECT 'detalle_producto', (SELECT COUNT(*) FROM %ORIGEN%.detalle_producto), (SELECT COUNT(*) FROM %PRUEBA%.detalle_producto)
>>"%GUION%" echo   UNION ALL SELECT 'ventas', (SELECT COUNT(*) FROM %ORIGEN%.ventas), (SELECT COUNT(*) FROM %PRUEBA%.ventas)
>>"%GUION%" echo ) AS conteos;

"%MYSQL_BIN%\mysql.exe" -u %USUARIO% -p --default-character-set=utf8mb4 --table < "%GUION%" > "%LOG%"
set "RESULTADO=%ERRORLEVEL%"
del "%GUION%" >nul 2>&1
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
