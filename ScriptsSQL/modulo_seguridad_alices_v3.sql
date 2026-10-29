/* ============================================================================
   MÓDULO DE SEGURIDAD — esquema [seguridad]  (v3)

   Convive con el esquema dbo actual: NO toca, NO borra y NO renombra nada de
   dbo. El sistema antiguo sigue funcionando contra dbo hasta que termine la
   migración.

   Jerarquía de autorización:

       MODULO          Almacenes, Sistema, Ventas...     (grupo del menú)
         SUBMODULO     /almacenes/productos              (pantalla, tiene RUTA)
           VISTA       tab o sección dentro de la pantalla
             ACCION    VER, CREAR, EDITAR, ELIMINAR...   (botón)

   Un permiso concreto es siempre la pareja (VISTA, ACCION).
   El ROL se configura a nivel hoja. El USUARIO se corrige por excepción, y la
   excepción se guarda al nivel en que se expresó (módulo / submódulo / vista /
   acción), no expandida, para que siga aplicando a lo que se cree después.

   Ejecutar con el equipo de BD. Es idempotente: se puede volver a correr.
   ============================================================================ */

/* Sin USE: la BD se elige en la conexión. En producción no se llama igual. */

/* OBLIGATORIO. Los índices únicos filtrados de la sección 4 NO se crean si
   QUOTED_IDENTIFIER está en OFF, que es como llega sqlcmd por defecto: el
   script termina con código 0 y cuatro índices sin crear. SSMS ya lo pone en
   ON, sqlcmd no. */

USE CORE_CORP_PRUEBA
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'seguridad')
    EXEC('CREATE SCHEMA seguridad');
GO

/* ============================================================================
   1. CATÁLOGO DE NAVEGACIÓN
   ============================================================================ */

IF OBJECT_ID('seguridad.MODULO') IS NULL
CREATE TABLE seguridad.MODULO (
    ID_MODULO      INT IDENTITY(1,1) NOT NULL,
    CODIGO         NVARCHAR(50)  NOT NULL,
    NOMBRE         NVARCHAR(100) NOT NULL,
    ICONO          NVARCHAR(50)  NULL,
    ORDEN          INT           NOT NULL CONSTRAINT DF_MODULO_ORDEN  DEFAULT 0,
    ACTIVO         BIT           NOT NULL CONSTRAINT DF_MODULO_ACTIVO DEFAULT 1,
    CONSTRAINT PK_MODULO PRIMARY KEY (ID_MODULO),
    CONSTRAINT UQ_MODULO_CODIGO UNIQUE (CODIGO)
);
GO

IF OBJECT_ID('seguridad.SUBMODULO') IS NULL
CREATE TABLE seguridad.SUBMODULO (
    ID_SUBMODULO   INT IDENTITY(1,1) NOT NULL,
    ID_MODULO      INT           NOT NULL,
    CODIGO         NVARCHAR(50)  NOT NULL,
    NOMBRE         NVARCHAR(100) NOT NULL,
    RUTA           NVARCHAR(150) NULL,   -- ruta Angular: /almacenes/productos
    ORDEN          INT           NOT NULL CONSTRAINT DF_SUBMODULO_ORDEN  DEFAULT 0,
    ACTIVO         BIT           NOT NULL CONSTRAINT DF_SUBMODULO_ACTIVO DEFAULT 1,
    CONSTRAINT PK_SUBMODULO PRIMARY KEY (ID_SUBMODULO),
    CONSTRAINT UQ_SUBMODULO_CODIGO UNIQUE (ID_MODULO, CODIGO),
    CONSTRAINT FK_SUBMODULO_MODULO FOREIGN KEY (ID_MODULO)
        REFERENCES seguridad.MODULO (ID_MODULO)
);
GO

IF OBJECT_ID('seguridad.VISTA') IS NULL
CREATE TABLE seguridad.VISTA (
    ID_VISTA       INT IDENTITY(1,1) NOT NULL,
    ID_SUBMODULO   INT           NOT NULL,
    CODIGO         NVARCHAR(50)  NOT NULL,
    NOMBRE         NVARCHAR(100) NOT NULL,
    ORDEN          INT           NOT NULL CONSTRAINT DF_VISTA_ORDEN  DEFAULT 0,
    ACTIVO         BIT           NOT NULL CONSTRAINT DF_VISTA_ACTIVO DEFAULT 1,
    CONSTRAINT PK_VISTA PRIMARY KEY (ID_VISTA),
    CONSTRAINT UQ_VISTA_CODIGO UNIQUE (ID_SUBMODULO, CODIGO),
    CONSTRAINT FK_VISTA_SUBMODULO FOREIGN KEY (ID_SUBMODULO)
        REFERENCES seguridad.SUBMODULO (ID_SUBMODULO)
);
GO

IF OBJECT_ID('seguridad.ACCION') IS NULL
CREATE TABLE seguridad.ACCION (
    ID_ACCION      INT IDENTITY(1,1) NOT NULL,
    CODIGO         NVARCHAR(30) NOT NULL,
    NOMBRE         NVARCHAR(60) NOT NULL,
    CONSTRAINT PK_ACCION PRIMARY KEY (ID_ACCION),
    CONSTRAINT UQ_ACCION_CODIGO UNIQUE (CODIGO)
);
GO


IF OBJECT_ID('seguridad.VISTA_ACCION') IS NULL
CREATE TABLE seguridad.VISTA_ACCION (
    ID_VISTA       INT NOT NULL,
    ID_ACCION      INT NOT NULL,
    CONSTRAINT PK_VISTA_ACCION PRIMARY KEY (ID_VISTA, ID_ACCION),
    CONSTRAINT FK_VISTAACCION_VISTA  FOREIGN KEY (ID_VISTA)
        REFERENCES seguridad.VISTA (ID_VISTA),
    CONSTRAINT FK_VISTAACCION_ACCION FOREIGN KEY (ID_ACCION)
        REFERENCES seguridad.ACCION (ID_ACCION)
);
GO

/* ============================================================================
   2. ROLES
   ============================================================================ */

IF OBJECT_ID('seguridad.ROL') IS NULL
CREATE TABLE seguridad.ROL (
    ID_ROL         INT IDENTITY(1,1) NOT NULL,
    NOMBRE         NVARCHAR(60)  NOT NULL,
    DESCRIPCION    NVARCHAR(200) NULL,
    ACTIVO         BIT           NOT NULL CONSTRAINT DF_ROL_ACTIVO DEFAULT 1,
    CONSTRAINT PK_ROL PRIMARY KEY (ID_ROL),
    CONSTRAINT UQ_ROL_NOMBRE UNIQUE (NOMBRE)
);
GO


IF OBJECT_ID('seguridad.ROL_PERMISO') IS NULL
CREATE TABLE seguridad.ROL_PERMISO (
    ID_ROL         INT NOT NULL,
    ID_VISTA       INT NOT NULL,
    ID_ACCION      INT NOT NULL,
    CONSTRAINT PK_ROL_PERMISO PRIMARY KEY (ID_ROL, ID_VISTA, ID_ACCION),
    CONSTRAINT FK_ROLPERMISO_ROL FOREIGN KEY (ID_ROL)
        REFERENCES seguridad.ROL (ID_ROL),
    CONSTRAINT FK_ROLPERMISO_VISTAACCION FOREIGN KEY (ID_VISTA, ID_ACCION)
        REFERENCES seguridad.VISTA_ACCION (ID_VISTA, ID_ACCION)
);
GO

/* Consulta inversa: "quién puede entrar a esta vista". La PK no sirve para eso. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_ROLPERMISO_VISTA_ACCION'
                 AND object_id = OBJECT_ID('seguridad.ROL_PERMISO'))
CREATE NONCLUSTERED INDEX IX_ROLPERMISO_VISTA_ACCION
    ON seguridad.ROL_PERMISO (ID_VISTA, ID_ACCION) INCLUDE (ID_ROL);
GO

/* ============================================================================
   3. USUARIO

   VERSION_PERMISOS es el contador que invalida el token. Sube cuando cambian
   los permisos de este usuario, los de su rol, o su rol. Ver sección 6.
   ============================================================================ */

IF OBJECT_ID('seguridad.USUARIO') IS NULL
CREATE TABLE seguridad.USUARIO (
    ID_USUARIO        INT IDENTITY(1,1) NOT NULL,
    USUARIO           VARCHAR(25)   NOT NULL,
    CLAVE_HASH        VARCHAR(255)  NOT NULL,   -- BCrypt
    DESCRIP           NVARCHAR(50)  NULL,
    ID_ROL            INT           NULL,
    ESTADO            BIT           NOT NULL CONSTRAINT DF_USUARIO_ESTADO  DEFAULT 1,
    MAX_SESIONES      TINYINT       NULL,
    VERSION_PERMISOS  INT           NOT NULL CONSTRAINT DF_USUARIO_VERSION DEFAULT 1,
    ID_USUARIO_ACCION INT           NULL,
    FECHA_ACCION      DATETIME2     NULL,
    FECHA_CREACION    DATETIME2     NOT NULL CONSTRAINT DF_USUARIO_FCREA   DEFAULT SYSDATETIME(),
    CONSTRAINT PK_USUARIO PRIMARY KEY CLUSTERED (ID_USUARIO),
    CONSTRAINT UQ_USUARIO_LOGIN UNIQUE (USUARIO),
    CONSTRAINT FK_USUARIO_ROL FOREIGN KEY (ID_ROL)
        REFERENCES seguridad.ROL (ID_ROL),
    CONSTRAINT FK_USUARIO_ACCION FOREIGN KEY (ID_USUARIO_ACCION)
        REFERENCES seguridad.USUARIO (ID_USUARIO)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_USUARIO_ROL' AND object_id = OBJECT_ID('seguridad.USUARIO'))
CREATE NONCLUSTERED INDEX IX_USUARIO_ROL ON seguridad.USUARIO (ID_ROL);
GO

/* ============================================================================
   4. EXCEPCIONES POR USUARIO
   ============================================================================ */

IF OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION') IS NULL
CREATE TABLE seguridad.USUARIO_PERMISO_EXCEPCION (
    ID_EXCEPCION     INT IDENTITY(1,1) NOT NULL,
    ID_USUARIO       INT       NOT NULL,
    ID_MODULO        INT       NULL,
    ID_SUBMODULO     INT       NULL,
    ID_VISTA         INT       NULL,
    ID_ACCION        INT       NULL,
    TIPO             CHAR(1)   NOT NULL,
    MOTIVO           NVARCHAR(200) NULL,
    ASIGNADO_POR     INT       NOT NULL,
    FECHA_ASIGNACION DATETIME2 NOT NULL CONSTRAINT DF_UPE_FECHA DEFAULT SYSDATETIME(),
    VIGENTE_HASTA    DATETIME2 NULL,
    CONSTRAINT PK_UPE PRIMARY KEY (ID_EXCEPCION),
    CONSTRAINT CK_UPE_TIPO CHECK (TIPO IN ('G','D')),
    CONSTRAINT CK_UPE_NIVEL CHECK (
        (CASE WHEN ID_MODULO    IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN ID_SUBMODULO IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN ID_VISTA     IS NOT NULL THEN 1 ELSE 0 END) = 1
        AND (ID_ACCION IS NULL OR ID_VISTA IS NOT NULL)
    ),
    CONSTRAINT FK_UPE_USUARIO     FOREIGN KEY (ID_USUARIO)   REFERENCES seguridad.USUARIO (ID_USUARIO),
    CONSTRAINT FK_UPE_ASIGNADOPOR FOREIGN KEY (ASIGNADO_POR) REFERENCES seguridad.USUARIO (ID_USUARIO),
    CONSTRAINT FK_UPE_MODULO      FOREIGN KEY (ID_MODULO)    REFERENCES seguridad.MODULO (ID_MODULO),
    CONSTRAINT FK_UPE_SUBMODULO   FOREIGN KEY (ID_SUBMODULO) REFERENCES seguridad.SUBMODULO (ID_SUBMODULO),
    CONSTRAINT FK_UPE_VISTAACCION FOREIGN KEY (ID_VISTA, ID_ACCION)
        REFERENCES seguridad.VISTA_ACCION (ID_VISTA, ID_ACCION)
);
GO


IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_UPE_VISTA')
ALTER TABLE seguridad.USUARIO_PERMISO_EXCEPCION
    ADD CONSTRAINT FK_UPE_VISTA FOREIGN KEY (ID_VISTA) REFERENCES seguridad.VISTA (ID_VISTA);
GO


IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_UPE_MODULO' AND object_id = OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION'))
CREATE UNIQUE NONCLUSTERED INDEX UQ_UPE_MODULO
    ON seguridad.USUARIO_PERMISO_EXCEPCION (ID_USUARIO, ID_MODULO)
    WHERE ID_MODULO IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_UPE_SUBMODULO' AND object_id = OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION'))
CREATE UNIQUE NONCLUSTERED INDEX UQ_UPE_SUBMODULO
    ON seguridad.USUARIO_PERMISO_EXCEPCION (ID_USUARIO, ID_SUBMODULO)
    WHERE ID_SUBMODULO IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_UPE_VISTA' AND object_id = OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION'))
CREATE UNIQUE NONCLUSTERED INDEX UQ_UPE_VISTA
    ON seguridad.USUARIO_PERMISO_EXCEPCION (ID_USUARIO, ID_VISTA)
    WHERE ID_VISTA IS NOT NULL AND ID_ACCION IS NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_UPE_VISTA_ACCION' AND object_id = OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION'))
CREATE UNIQUE NONCLUSTERED INDEX UQ_UPE_VISTA_ACCION
    ON seguridad.USUARIO_PERMISO_EXCEPCION (ID_USUARIO, ID_VISTA, ID_ACCION)
    WHERE ID_ACCION IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UPE_USUARIO' AND object_id = OBJECT_ID('seguridad.USUARIO_PERMISO_EXCEPCION'))
CREATE NONCLUSTERED INDEX IX_UPE_USUARIO
    ON seguridad.USUARIO_PERMISO_EXCEPCION (ID_USUARIO)
    INCLUDE (ID_MODULO, ID_SUBMODULO, ID_VISTA, ID_ACCION, TIPO, VIGENTE_HASTA);
GO

/* ============================================================================
   5. AUDITORÍA DE CAMBIOS DE PERMISOS
   ============================================================================ */

IF OBJECT_ID('seguridad.AUDITORIA_PERMISO') IS NULL
CREATE TABLE seguridad.AUDITORIA_PERMISO (
    ID_AUDITORIA   BIGINT IDENTITY(1,1) NOT NULL,
    FECHA          DATETIME2     NOT NULL CONSTRAINT DF_AUDPERM_FECHA DEFAULT SYSDATETIME(),
    ID_USUARIO_EJECUTA INT       NOT NULL,
    ENTIDAD        VARCHAR(20)   NOT NULL,  -- 'ROL' | 'USUARIO'
    ID_ENTIDAD     INT           NOT NULL,
    OPERACION      VARCHAR(20)   NOT NULL,  -- 'OTORGA' | 'DENIEGA' | 'QUITA'
    DETALLE        NVARCHAR(400) NULL,
    CONSTRAINT PK_AUDITORIA_PERMISO PRIMARY KEY (ID_AUDITORIA),
    CONSTRAINT FK_AUDPERM_USUARIO FOREIGN KEY (ID_USUARIO_EJECUTA)
        REFERENCES seguridad.USUARIO (ID_USUARIO)
);
GO

/* ============================================================================
   6. CATÁLOGO DE ACCIONES
   ============================================================================ */

MERGE seguridad.ACCION AS destino
USING (VALUES
    ('VER',      N'Ver'),
    ('CREAR',    N'Crear'),
    ('EDITAR',   N'Editar'),
    ('ELIMINAR', N'Eliminar'),
    ('ANULAR',   N'Anular'),
    ('EXPORTAR', N'Exportar'),
    ('IMPRIMIR', N'Imprimir'),
    ('APROBAR',  N'Aprobar')
) AS origen (CODIGO, NOMBRE)
    ON destino.CODIGO = origen.CODIGO
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CODIGO, NOMBRE) VALUES (origen.CODIGO, origen.NOMBRE);
GO

/* ============================================================================
   7. RESOLUCIÓN DE PERMISOS EFECTIVOS
   ============================================================================ */

IF OBJECT_ID('seguridad.fn_PermisosEfectivos') IS NOT NULL
    DROP FUNCTION seguridad.fn_PermisosEfectivos;
GO

CREATE FUNCTION seguridad.fn_PermisosEfectivos (@ID_USUARIO INT)
RETURNS TABLE
AS
RETURN
WITH arbol AS (
    SELECT  m.ID_MODULO, m.CODIGO AS MODULO, m.ICONO, m.ORDEN AS ORDEN_MODULO,
            s.ID_SUBMODULO, s.CODIGO AS SUBMODULO, s.RUTA, s.ORDEN AS ORDEN_SUBMODULO,
            v.ID_VISTA, v.CODIGO AS VISTA, v.ORDEN AS ORDEN_VISTA,
            a.ID_ACCION, a.CODIGO AS ACCION
    FROM        seguridad.MODULO       m
    INNER JOIN  seguridad.SUBMODULO    s  ON s.ID_MODULO     = m.ID_MODULO    AND s.ACTIVO = 1
    INNER JOIN  seguridad.VISTA        v  ON v.ID_SUBMODULO  = s.ID_SUBMODULO AND v.ACTIVO = 1
    INNER JOIN  seguridad.VISTA_ACCION va ON va.ID_VISTA     = v.ID_VISTA
    INNER JOIN  seguridad.ACCION       a  ON a.ID_ACCION     = va.ID_ACCION
    WHERE m.ACTIVO = 1
),
base AS (
    SELECT  t.*,
            CAST(CASE WHEN rp.ID_ROL IS NULL THEN 0 ELSE 1 END AS BIT) AS OTORGADO_ROL
    FROM arbol t
    CROSS JOIN seguridad.USUARIO u
    LEFT  JOIN seguridad.ROL_PERMISO rp
           ON  rp.ID_ROL    = u.ID_ROL
           AND rp.ID_VISTA  = t.ID_VISTA
           AND rp.ID_ACCION = t.ID_ACCION
    WHERE u.ID_USUARIO = @ID_USUARIO AND u.ESTADO = 1
),
excepciones AS (
    SELECT  b.ID_VISTA, b.ID_ACCION, e.TIPO,
            ROW_NUMBER() OVER (
                PARTITION BY b.ID_VISTA, b.ID_ACCION
                ORDER BY CASE
                    WHEN e.ID_ACCION    IS NOT NULL THEN 1
                    WHEN e.ID_VISTA     IS NOT NULL THEN 2
                    WHEN e.ID_SUBMODULO IS NOT NULL THEN 3
                    ELSE 4
                END
            ) AS PRIORIDAD
    FROM base b
    INNER JOIN seguridad.USUARIO_PERMISO_EXCEPCION e
           ON  e.ID_USUARIO = @ID_USUARIO
           AND (   (e.ID_ACCION    IS NOT NULL AND e.ID_VISTA = b.ID_VISTA AND e.ID_ACCION = b.ID_ACCION)
                OR (e.ID_ACCION    IS     NULL AND e.ID_VISTA = b.ID_VISTA)
                OR (e.ID_SUBMODULO = b.ID_SUBMODULO)
                OR (e.ID_MODULO    = b.ID_MODULO))
           AND (e.VIGENTE_HASTA IS NULL OR e.VIGENTE_HASTA >= SYSDATETIME())
)
SELECT  b.ID_MODULO, b.MODULO, b.ICONO, b.ORDEN_MODULO,
        b.ID_SUBMODULO, b.SUBMODULO, b.RUTA, b.ORDEN_SUBMODULO,
        b.ID_VISTA, b.VISTA, b.ORDEN_VISTA,
        b.ID_ACCION, b.ACCION,
        CAST(CASE
                WHEN x.TIPO = 'D' THEN 0
                WHEN x.TIPO = 'G' THEN 1
                ELSE b.OTORGADO_ROL
             END AS BIT) AS PERMITIDO,
        CAST(CASE WHEN x.TIPO IS NULL THEN 0 ELSE 1 END AS BIT) AS ES_EXCEPCION
FROM base b
LEFT JOIN excepciones x
       ON x.ID_VISTA = b.ID_VISTA AND x.ID_ACCION = b.ID_ACCION AND x.PRIORIDAD = 1;
GO

/* ============================================================================
   8. PROCEDIMIENTOS
*/

/* ---------------------------------------------------------------------------
   La verificación de la clave NO ocurre aquí. El SP devuelve el hash y la API
   lo comprueba con BCrypt/Argon2: T-SQL no sabe validar esos hashes, y comparar
   en SQL obligaría a mandar la clave en claro al servidor.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('seguridad.ObtenerCredencialesLogin') IS NOT NULL
    DROP PROCEDURE seguridad.ObtenerCredencialesLogin;
GO

CREATE PROCEDURE seguridad.ObtenerCredencialesLogin
    @USUARIO VARCHAR(25)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT  u.ID_USUARIO,
            u.USUARIO,
            u.CLAVE_HASH,
            u.DESCRIP            AS NOMBRE_COMPLETO,
            u.ID_ROL,
            r.NOMBRE             AS ROL,
            u.ESTADO,
            u.MAX_SESIONES,
            u.VERSION_PERMISOS
    FROM        seguridad.USUARIO u
    LEFT JOIN   seguridad.ROL     r ON r.ID_ROL = u.ID_ROL
    WHERE u.USUARIO = LTRIM(RTRIM(@USUARIO));
END
GO

/* ---------------------------------------------------------------------------
   Lo que consume el front: la lista plana de permisos concedidos.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('seguridad.ObtenerPermisosUsuario') IS NOT NULL
    DROP PROCEDURE seguridad.ObtenerPermisosUsuario;
GO

CREATE PROCEDURE seguridad.ObtenerPermisosUsuario
    @ID_USUARIO INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT  p.MODULO, p.SUBMODULO, p.VISTA, p.ACCION, p.RUTA
    FROM seguridad.fn_PermisosEfectivos(@ID_USUARIO) p
    WHERE p.PERMITIDO = 1
    ORDER BY p.ORDEN_MODULO, p.ORDEN_SUBMODULO, p.ORDEN_VISTA, p.ACCION;

    SELECT VERSION_PERMISOS
    FROM seguridad.USUARIO
    WHERE ID_USUARIO = @ID_USUARIO;
END
GO

/* ---------------------------------------------------------------------------
   Menú: solo módulos y submódulos donde el usuario tenga al menos un VER.
   Un submódulo sin ninguna vista visible no aparece; un módulo sin ningún
   submódulo visible tampoco.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('seguridad.ObtenerMenuUsuario') IS NOT NULL
    DROP PROCEDURE seguridad.ObtenerMenuUsuario;
GO

CREATE PROCEDURE seguridad.ObtenerMenuUsuario
    @ID_USUARIO INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
            p.ID_MODULO, p.MODULO, p.ICONO, p.ORDEN_MODULO,
            p.ID_SUBMODULO, p.SUBMODULO, p.RUTA, p.ORDEN_SUBMODULO
    FROM seguridad.fn_PermisosEfectivos(@ID_USUARIO) p
    WHERE p.PERMITIDO = 1 AND p.ACCION = 'VER'
    ORDER BY p.ORDEN_MODULO, p.ORDEN_SUBMODULO;
END
GO

/* ---------------------------------------------------------------------------
   Invalidación de tokens. TODO SP que toque ROL_PERMISO o
   USUARIO_PERMISO_EXCEPCION tiene que llamar a este antes de terminar.
   Con ~84 usuarios el UPDATE por rol es irrelevante en coste.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('seguridad.SubirVersionPermisos') IS NOT NULL
    DROP PROCEDURE seguridad.SubirVersionPermisos;
GO

CREATE PROCEDURE seguridad.SubirVersionPermisos
    @ID_USUARIO INT = NULL,
    @ID_ROL     INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @ID_USUARIO IS NULL AND @ID_ROL IS NULL
    BEGIN
        THROW 50001, 'Indique @ID_USUARIO o @ID_ROL.', 1;
    END

    UPDATE seguridad.USUARIO
       SET VERSION_PERMISOS = VERSION_PERMISOS + 1
     WHERE (@ID_USUARIO IS NOT NULL AND ID_USUARIO = @ID_USUARIO)
        OR (@ID_ROL     IS NOT NULL AND ID_ROL     = @ID_ROL);
END
GO
SELECT * FROM seguridad.ACCION
GO
SELECT * FROM seguridad.AUDITORIA_PEMISO
GO
SELECT * FROM seguridad.MODULO
GO
SELECT * FROM seguridad.ROL
GO
SELECT * FROM seguridad.ROL_PERMISO
GO
SELECT * FROM seguridad.SUBMODULO
GO
SELECT * FROM seguridad.USUARIO
GO
SELECT * FROM seguridad.USUARIO_PEMISO_EXECPION
GO
SELECT * FROM seguridad.VISTA
GO
SELECT * FROM seguridad.VISTA_ACCION
GO