@echo off
REM Apply schema and auth migrations using environment variables from the current shell.
REM Ensure %DB_HOST%, %DB_PORT%, %DB_USER%, %DB_NAME% (and optionally %DB_PASSWORD%) are set.

if "%DB_HOST%"=="" (
  echo DB_HOST is not set. Please set DB_HOST and rerun.
  exit /b 1
)

if "%DB_NAME%"=="" (
  echo DB_NAME is not set. Please set DB_NAME and rerun.
  exit /b 1
)

setlocal
set PSQL_CMD=psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME%

%PSQL_CMD% -c "select now();" || goto :error
%PSQL_CMD% -f schema.sql || goto :error
%PSQL_CMD% -f auth_migration.sql || goto :error

echo Migrations applied successfully.
exit /b 0

:error
echo Migration failed. Check the error above.
exit /b 1
