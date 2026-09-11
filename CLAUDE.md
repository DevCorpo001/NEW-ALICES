# ALICES

Claude Code lee este archivo automáticamente al iniciar sesión en este repo.
Las reglas de arquitectura y de estilo viven en AGENTS.md, que se importa aquí:

@AGENTS.md

## Cómo se accede a los datos (importante)

El backend trabaja contra la base de datos SQL Server corporativa:
- **BD activa actual**: Servidor `209.222.97.55\CORECORP`, base de datos **`PRUEBAS`**.
  *(Nota de seguridad: Esta instancia aloja otros entornos; está **ESTRICTAMENTE PROHIBIDO** acceder, consultar o cambiar a cualquier otra base de datos que no sea `PRUEBAS`).*
- **BD local de desarrollo**: `192.168.1.212\CORP-PRUEBA`, base de datos `CORE_CORP_PRUEBA` (cuando se encuentre disponible en red local).

Reglas de acceso a datos de la aplicación:
- **Todo el acceso a datos es Dapper + stored procedures.** Ej.: `dbo.sp_Login_LogeoUsuarios`, `dbo.sp_ListarCategoria`. Ver `Alices.Application/*/...QueryHandler.cs`.
- **No hay EF Core, ni `DbContext`, ni migraciones, ni seed.** Se eliminaron el 2026-08-28 porque intentaban crear tablas (`roles`, `usuarios`) que no existen ni deben existir en esta BD, y rompían el arranque.
- **No agregar migraciones ni `CREATE TABLE` desde el código.** El esquema de esta BD lo gestiona el equipo de base de datos. Para una funcionalidad nueva se pide o se crea un SP.
- Los tipos de las tablas legacy son los que son: `ID_USUARIO`/`ID_ROL` son `tinyint`, no `Guid`. No "modernizar" el modelo por cuenta propia.

### Acceso del agente a la base de datos: SOLO LECTURA Y CON LÍMITES (TOP N)

Cuando el agente se conecte a la base de datos de pruebas (`PRUEBAS` o `CORE_CORP_PRUEBA`) (sqlcmd, scripts, cliente SQL, etc.) **solo tiene permiso para consultar**:

- **Permitido:**
  - Consultar estructura y metadatos del esquema (`INFORMATION_SCHEMA.*`, `sys.objects`, `sys.columns`, `sys.procedures`, `sys.tables`, etc.).
  - Visualizar código y definición de Stored Procedures, funciones y vistas (`sp_helptext 'dbo.sp_...'` o `OBJECT_DEFINITION(OBJECT_ID('...'))`).
  - Consultar datos con `SELECT` **SIEMPRE LIMITANDO POR CANTIDAD** mediante `TOP` (ej.: `SELECT TOP 10 * FROM TABLA`, `SELECT TOP 20 ...`) ya que las tablas pueden tener millones de filas.
  - `EXEC` de SPs de solo lectura (`sp_Listar...`, `sp_Obtener...`) con parámetros acotados.
- **Prohibido:**
  - `SELECT` sin `TOP` ni filtros sobre tablas del sistema que puedan traer volúmenes masivos de datos.
  - `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, `GRANT`, y ejecutar SPs de escritura (`sp_Insertar...`, `sp_Actualizar...`, `sp_Eliminar...`).
- Es una BD **compartida** con el equipo: una escritura o una consulta pesada sin límite de filas afecta a todos.
- Si una funcionalidad requiere cambios de esquema o nuevos SPs, **no ejecutarlos directamente**: proponer el script SQL para que el equipo de base de datos lo revise y ejecute.

Esto aplica al agente ejecutando SQL a mano/diagnóstico. **No** limita al código de la aplicación: los handlers de la API sí pueden llamar SPs de escritura cuando la funcionalidad lo requiera.

## Cómo levantar el backend

```
cd corp-backend/src/Alices/Alices.API
dotnet watch run          # queda en http://localhost:5225
```

Comprobación rápida: `GET /api/ping` debe responder 200.

## Frontend

```
cd corp-frontend
npm start                 # http://localhost:4200, con proxy a la API
```

## Convenciones de trabajo

- Responder y escribir comentarios/documentación en **español**.
- **`ProyectoVenta` es de SOLO LECTURA**: Es el proyecto legacy de referencia. Se usa únicamente para consultar lógica, stored procedures y pantallas durante la migración; nunca modificar sus archivos.
- La cadena de conexión está en `corp-backend/src/Alices/Alices.API/appsettings.json`.
  Es una BD **compartida** con el equipo: no ejecutar DDL (crear/borrar tablas) contra ella.
- Antes de dar por terminado un cambio en el backend, compilar:
  `dotnet build corp-backend/src/Alices/Alices.API/Alices.API.csproj`

# When done

When the task is completed, respond with: "Listo precioso!!!"
