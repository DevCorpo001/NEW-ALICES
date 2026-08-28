-- =============================================================================
-- sp_Alices_ValidarCredenciales
--
-- Fase 1b del plan de migración del login (ver corp-backend/ARCHITECTURE.md y la
-- conversación de diseño). Este script NO ha sido ejecutado contra la base de
-- datos — revisar y desplegar manualmente cuando se decida avanzar a Fase 1.
--
-- Objetivo: reemplazar, para el flujo de ALICES, la parte de
-- dbo.sp_Login_LogeoUsuarios que "busca al usuario", dejando fuera del SQL las
-- reglas que se mueven al dominio (estado activo, ventana horaria, auditoría).
--
-- Es ADITIVO: no modifica ni reemplaza dbo.sp_Login_LogeoUsuarios. El sistema
-- legacy sigue usando ese SP sin cambios.
--
-- Diferencias respecto al SP legacy:
--   - Compara solo u.CLAVE (sin ISNULL(R.KEY_QR, u.CLAVE) — el QR del día es un
--     método de autenticación separado, Fase 2 del plan).
--   - NO filtra por estado activo ni por ventana horaria: esas reglas las evalúa
--     Alices.Domain.Usuarios.PoliticaAccesoUsuario en C#, donde son testeables.
--   - NO inserta en INGRESO_SESION: la auditoría se dispara desde un evento de
--     dominio en Application una vez que la política de acceso aprueba el login.
--   - NO devuelve la columna CLAVE en el resultado (el SP legacy sí la devuelve,
--     sin necesidad, exponiendo la contraseña en claro en el result set).
--   - Devuelve ESTADO sin filtrar, para que el dominio decida.
--
-- Pendiente de decidir con el negocio antes de desplegar:
--   - Columna estable para el código de rol (hoy se usa DESC_ROL, texto visible;
--     ver comentario "COD_ROL" en el plan). Este script usa DESC_ROL como
--     interino, igual que hace el SP legacy hoy.
-- =============================================================================
CREATE PROCEDURE [dbo].[sp_Alices_ValidarCredenciales]
(
    @usuario varchar(25),
    @clave   varchar(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        u.[ID_USUARIO],
        u.[USUARIO],
        u.[DESCRIP]   AS NOMBRECOMPLETO,
        u.[ID_ROL]    AS IDROL,
        r.[DESC_ROL]  AS ROL,
        u.[ESTADO],
        v.[rutavista],
        u.[MAX_SESIONES]
    FROM [Usuario] u
    LEFT JOIN [Rol] r ON u.ID_ROL = r.ID_ROL
    LEFT JOIN [Vistas] v ON r.ID_VISTA_INICIO = v.Id
    WHERE u.USUARIO = TRIM(@usuario)
      AND u.CLAVE = TRIM(@clave);
END
