USE CORE_CORP_PRUEBA
GO

CREATE SCHEMA seguridad;
GO

/* ============================================================
   1. CATÁLOGO DE NAVEGACIÓN — sin dependencias externas,
      va primero por eso.
   ============================================================ */

CREATE TABLE seguridad.MODULO (
    ID_MODULO      INT IDENTITY(1,1) PRIMARY KEY,
    CODIGO         NVARCHAR(50)  NOT NULL UNIQUE,
    NOMBRE         NVARCHAR(100) NOT NULL,
    ICONO          NVARCHAR(50)  NULL,
    ORDEN          INT           NOT NULL DEFAULT 0,
    ACTIVO         BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE seguridad.SUBMODULO (
    ID_SUBMODULO   INT IDENTITY(1,1) PRIMARY KEY,
    ID_MODULO      INT           NOT NULL FOREIGN KEY REFERENCES seguridad.MODULO(ID_MODULO),
    CODIGO         NVARCHAR(50)  NOT NULL,
    NOMBRE         NVARCHAR(100) NOT NULL,
    RUTA           NVARCHAR(150) NULL,
    ORDEN          INT           NOT NULL DEFAULT 0,
    ACTIVO         BIT           NOT NULL DEFAULT 1,
    CONSTRAINT UQ_SUBMODULO_CODIGO UNIQUE (ID_MODULO, CODIGO)
);
GO

CREATE TABLE seguridad.VISTA (
    ID_VISTA       INT IDENTITY(1,1) PRIMARY KEY,
    ID_SUBMODULO   INT           NOT NULL FOREIGN KEY REFERENCES seguridad.SUBMODULO(ID_SUBMODULO),
    CODIGO         NVARCHAR(50)  NOT NULL,
    NOMBRE         NVARCHAR(100) NOT NULL,
    ACTIVO         BIT           NOT NULL DEFAULT 1,
    CONSTRAINT UQ_VISTA_CODIGO UNIQUE (ID_SUBMODULO, CODIGO)
);
GO

CREATE TABLE seguridad.ACCION (
    ID_ACCION      INT IDENTITY(1,1) PRIMARY KEY,
    CODIGO         NVARCHAR(30) NOT NULL UNIQUE,
    NOMBRE         NVARCHAR(60) NOT NULL
);
GO

CREATE TABLE seguridad.VISTA_ACCION (
    ID_VISTA       INT NOT NULL FOREIGN KEY REFERENCES seguridad.VISTA(ID_VISTA),
    ID_ACCION      INT NOT NULL FOREIGN KEY REFERENCES seguridad.ACCION(ID_ACCION),
    PRIMARY KEY (ID_VISTA, ID_ACCION)
);
GO

/* ============================================================
   2. ROLES — antes de USUARIO, porque USUARIO lo referencia.
   ============================================================ */

CREATE TABLE seguridad.ROL (
    ID_ROL         INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE         NVARCHAR(60)  NOT NULL UNIQUE,
    DESCRIPCION    NVARCHAR(200) NULL,
    ACTIVO         BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE seguridad.ROL_PERMISO (
    ID_ROL         INT NOT NULL FOREIGN KEY REFERENCES seguridad.ROL(ID_ROL),
    ID_VISTA       INT NOT NULL FOREIGN KEY REFERENCES seguridad.VISTA(ID_VISTA),
    ID_ACCION      INT NOT NULL FOREIGN KEY REFERENCES seguridad.ACCION(ID_ACCION),
    PRIMARY KEY (ID_ROL, ID_VISTA, ID_ACCION)
);
GO

/* ============================================================
   3. USUARIO — ya con ID_ROL y VERSION_PERMISOS incluidos
      desde el CREATE, sin ALTER duplicado después.
   ============================================================ */

CREATE TABLE seguridad.USUARIO (
    ID_USUARIO          INT IDENTITY(1,1) NOT NULL,
    USUARIO              VARCHAR(25)   NOT NULL,
    CLAVE_HASH           VARCHAR(255)  NOT NULL,
    DESCRIP              NVARCHAR(50)  NULL,
    ID_ROL               INT           NULL,
    ESTADO               BIT           NOT NULL DEFAULT 1,
    MAX_SESIONES         TINYINT       NULL,
    VERSION_PERMISOS     INT           NOT NULL DEFAULT 1,
    ID_USUARIO_ACCION    INT           NULL,
    FECHA_ACCION         DATETIME2     NULL,
    FECHA_CREACION       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_USUARIO PRIMARY KEY CLUSTERED (ID_USUARIO ASC)
        WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
              ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY],
    CONSTRAINT UQ_USUARIO_LOGIN UNIQUE (USUARIO),
    CONSTRAINT FK_USUARIO_ROL FOREIGN KEY (ID_ROL) REFERENCES seguridad.ROL(ID_ROL)
) ON [PRIMARY];
GO

/* ============================================================
   4. EXCEPCIONES PUNTUALES POR USUARIO — al final, porque
      depende de USUARIO, VISTA y ACCION, todas ya creadas.
   ============================================================ */

CREATE TABLE seguridad.USUARIO_PERMISO_EXCEPCION (
    ID_USUARIO       INT      NOT NULL,
    ID_VISTA         INT      NOT NULL,
    ID_ACCION        INT      NOT NULL,
    TIPO             CHAR(1)  NOT NULL CHECK (TIPO IN ('G','D')),
    ASIGNADO_POR     INT      NOT NULL,
    FECHA_ASIGNACION DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_USUARIO_PERMISO_EXCEPCION PRIMARY KEY (ID_USUARIO, ID_VISTA, ID_ACCION),
    CONSTRAINT FK_UPE_USUARIO     FOREIGN KEY (ID_USUARIO)   REFERENCES seguridad.USUARIO(ID_USUARIO),
    CONSTRAINT FK_UPE_ASIGNADOPOR FOREIGN KEY (ASIGNADO_POR) REFERENCES seguridad.USUARIO(ID_USUARIO),
    CONSTRAINT FK_UPE_VISTA       FOREIGN KEY (ID_VISTA)     REFERENCES seguridad.VISTA(ID_VISTA),
    CONSTRAINT FK_UPE_ACCION      FOREIGN KEY (ID_ACCION)    REFERENCES seguridad.ACCION(ID_ACCION)
);
GO
