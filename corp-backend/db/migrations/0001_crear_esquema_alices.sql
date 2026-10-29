-- =============================================================================
-- 0001_crear_esquema_alices
--
-- RunOnce (carril B, ver corp-backend/BD-CICD.md §3). Crea el esquema `alices`
-- si no existe. No toca ningún objeto de dbo. Sin secretos: seguro de comitear.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'alices')
    EXEC('CREATE SCHEMA alices AUTHORIZATION dbo');
GO
