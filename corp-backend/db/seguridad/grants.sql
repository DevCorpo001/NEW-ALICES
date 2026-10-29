-- =============================================================================
-- grants.sql
--
-- RunAlways (carril B/C, ver corp-backend/BD-CICD.md §3 y §6.3). Idempotente:
-- asigna permisos a logins que YA existen (creados aparte, con contraseña,
-- nunca en este archivo — sin secretos: seguro de comitear).
--
-- Requiere que los logins alices_app / alices_deploy / legacy_deploy ya estén
-- creados en el servidor (ver bootstrap-logins.sql, que NO se comitea).
-- =============================================================================

-- ---------- alices_app: la API en runtime. Cero DDL. ----------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'alices_app')
    CREATE USER alices_app FOR LOGIN alices_app;
GO

GRANT EXECUTE, SELECT ON SCHEMA::alices TO alices_app;
GRANT SELECT ON SCHEMA::dbo TO alices_app;   -- lectura del legacy
-- EXECUTE en dbo: SP por SP, nunca por esquema entero.
GRANT EXECUTE ON OBJECT::dbo.sp_Login_LogeoUsuarios TO alices_app;
GO

-- ---------- alices_deploy: el CD, carriles A y B. Solo alices, DENY sobre dbo. ----------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'alices_deploy')
    CREATE USER alices_deploy FOR LOGIN alices_deploy;
GO

GRANT ALTER, CREATE PROCEDURE, CREATE VIEW, CREATE FUNCTION, EXECUTE, SELECT
    ON SCHEMA::alices TO alices_deploy;
DENY ALTER, CONTROL ON SCHEMA::dbo TO alices_deploy;
GO

-- ---------- legacy_deploy: el CD, carril C únicamente. ALTER sobre dbo. ----------
-- Nota: SQL Server no tiene un permiso "DROP" separado de ALTER a nivel de
-- esquema — quien tiene ALTER puede hacer DROP TABLE. Por eso la protección
-- contra DROP/TRUNCATE destructivos en dbo es el guardarraíl C del CI
-- (BD-CICD.md §6.10), no un permiso de base de datos.
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'legacy_deploy')
    CREATE USER legacy_deploy FOR LOGIN legacy_deploy;
GO

GRANT ALTER ON SCHEMA::dbo TO legacy_deploy;
GO
