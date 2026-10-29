# Base de datos: versionado y CI/CD conviviendo con el legacy

> **Contexto.** La BD de producción tiene ~100 tablas y ~200 stored procedures con un
> sistema legacy encima. ALICES (`corp-backend`) se conecta a **esa misma base** y ya
> consume SPs legacy por Dapper (`dbo.sp_Login_LogeoUsuarios` en
> `IniciarSesionCommandHandler`). Este documento define cómo versionar y desplegar
> cambios de BD sin romper el legacy.

## Regla de oro

**Los objetos que el legacy ya usa no se modifican.** Se consultan con `SELECT`, se
ejecutan con `EXEC`. Lo que ALICES cree nuevo vive en un esquema propio: `alices`.

El legacy **sí** puede seguir evolucionando — es tuyo, y también en C#. Pero sus cambios
van por un carril distinto, con frenos distintos (§3).

---

## 1. Glosario: tres palabras que hay que tener claras

### Esquema

En SQL Server todo objeto se llama `esquema.objeto`. Los tuyos hoy son:

```
dbo.Usuario     dbo.Rol     dbo.Vistas     dbo.sp_Login_LogeoUsuarios
```

**`dbo` no es "la base": es un esquema**, una carpeta lógica dentro de la base. Es la
carpeta por defecto que SQL Server crea sola, por eso todo terminó ahí — no porque sea
especial.

`alices` sería **otra carpeta, dentro de la misma base**: mismo servidor, misma conexión,
mismos datos. Crearla es una línea y **no mueve ni cambia nada de lo que ya existe**.
Sirve para dos cosas concretas:

1. **Permisos por carpeta.** Se puede decir "el usuario del deploy escribe en `alices` y
   tiene `DENY` sobre `dbo`". Eso convierte "no rompas el legacy" de una promesa en una
   imposibilidad física.
2. **Saber de un vistazo qué es de quién.** `alices.X` = lo escribió el backend nuevo.
   `dbo.X` = existía antes.

### Aditivo

**Solo agregar cosas nuevas, nunca modificar ni borrar lo que ya existe.**

| Aditivo ✅ | No aditivo ❌ |
|---|---|
| Crear `alices.mi_sp_nuevo` | Editar `dbo.sp_Login_LogeoUsuarios` |
| Crear una tabla nueva | Borrar o renombrar una columna |
| Agregar una columna **nullable** a una tabla existente | Cambiar `varchar(50)` → `varchar(20)` |
| Crear un índice nuevo | Borrar un índice que el legacy usa |

La prueba: **si apagás ALICES por completo, ¿el legacy sigue funcionando igual que ayer?**
Si la respuesta es sí, el cambio fue aditivo.

### Idempotente

Que se puede ejecutar **muchas veces seguidas con el mismo resultado**. `CREATE OR ALTER
PROCEDURE` es idempotente: corrarlo diez veces deja el SP exactamente igual.
`CREATE TABLE` no lo es: la segunda vez falla.

---

## 2. Qué cambió respecto al borrador anterior

El borrador proponía copiar los SPs legacy a `alices.` con nombres nuevos y "depurados".
**Eso se elimina.** Las razones:

- Reescribir 200 SPs es meses de trabajo con entregable de negocio **cero**.
- Crea **dos copias de la misma lógica**: cada vez que el legacy toque `dbo.sp_X`,
  alguien tiene que acordarse de replicarlo. Ese desfase se paga en bugs dentro de 6 meses.
- Renombrar no aporta nada técnico: si siempre calificás el esquema
  (`dbo.sp_Login_LogeoUsuarios`), el nombre feo no molesta a nadie.

**Regla nueva y única sobre nombres: no se renombra nada.** Los SPs legacy se quedan
donde están, con el nombre que tienen, y ALICES los llama tal cual. Un objeto nuevo
conserva el nombre que le pongas; lo único obligatorio es que **viva en el esquema
`alices`** y que **toda referencia esté calificada con su esquema**.

> Nota técnica: el prefijo `sp_` solo es un problema cuando se invoca **sin calificar**
> (SQL Server busca primero en `master`). Llamándolo `alices.sp_Alices_ValidarCredenciales`
> esa búsqueda no ocurre. Por eso no hace falta renombrar el SP que ya escribiste.

Lo que **sí** se mantiene del borrador, porque son los puntos que dan seguridad real:

| Idea | Por qué se mantiene |
|---|---|
| Solo objetos **aditivos**, en el esquema `alices` | Patrón *strangler fig*. El legacy no se entera. |
| `CREATE OR ALTER` (nunca `DROP`+`CREATE`) | `DROP` **pierde los GRANTs** del objeto. |
| **DbUp** + `.sql` en Git | Corre solo los scripts que le diste. Nada más. |
| **EF Core** solo para tablas nuevas de ALICES | Nunca mapear tablas legacy. |
| **Docker** como banco de pruebas desechable | No versiona nada; sirve para probar. |
| **Baseline del esquema legacy en Git** | Sin esto el CI **no valida nada** (ver §6.4). |
| Aprobación manual + login acotado para producción | Una BD no se revierte con un redeploy. |

---

## 3. Los tres carriles (el legacy también se versiona)

Una aclaración importante, porque el borrador anterior la tenía mal: decía "coordinalo con
el equipo del legacy". **No hay otro equipo. El legacy es tuyo y también es C#.** Así que
no vas a seguir actualizándolo a mano: sus cambios entran al mismo Git y al mismo pipeline.

Lo que cambia no es *quién* lo hace, es *cuánto freno lleva cada cambio*:

| Carril | Qué es | Riesgo si sale mal | Freno |
|---|---|---|---|
| **A. SQL en C#** (Dapper, `Application/`) | Las consultas de los casos de uso nuevos | Solo falla ALICES | Ninguno extra: va en el PR de la app |
| **B. Objetos nuevos en `alices`** | SPs, vistas, funciones y tablas que ALICES crea | Solo falla ALICES | CI + deploy con aprobación |
| **C. Cambios a `dbo`** (el legacy) | Columna nueva, índice, SP legacy modificado | **Se cae la operación en producción** | CI + aprobación + backup + ventana + plan de rollback escrito |

Son tres carpetas distintas en Git, un solo pipeline. El carril C existe, no está
prohibido — está **frenado**.

### Reglas del carril C (cambios a `dbo`)

1. **Aditivo siempre que se pueda.** Columna nueva → `NULL` o con `DEFAULT`, nunca
   `NOT NULL` sin default (eso bloquea la tabla entera y rompe los `INSERT` del legacy que
   no la conocen).
2. **Cambio de un SP legacy → obligatorio `CREATE OR ALTER`**, jamás `DROP` + `CREATE`
   (el `DROP` borra los GRANTs y el legacy deja de poder ejecutarlo).
3. **Nunca `DROP COLUMN`, `DROP TABLE` ni cambio de tipo que achique**, sin un plan en
   dos despliegues: primero dejás de usar la columna en todo el código, esperás, después
   la borrás.
4. **El script de rollback se escribe antes del deploy**, en el mismo PR. Si no sabés
   escribir el rollback, el cambio no está listo.
5. Va en `db/legacy/`, con prefijo numérico, `RunOnce`.

### Tabla de decisión

```
¿Leer datos legacy para un caso de uso nuevo?
   └─ ¿Solo lo consume el backend nuevo?
         ├─ SÍ  → Carril A: SQL crudo con Dapper en el handler   ← el 80% de los casos
         └─ NO  → Carril B: SP nuevo en db/programmables/, vía DbUp

¿Tabla nueva, propia de ALICES?     → Carril B: EF Core migration, esquema alices

¿Modificar un SP legacy de dbo?
   ├─ ¿Lo necesita el legacy?       → Carril C: CREATE OR ALTER en db/legacy/
   └─ ¿Solo lo necesita ALICES?     → Carril B: SP nuevo en alices. No toques el legacy
                                       para algo que el legacy no pidió.

¿Columna o índice nuevo en una tabla de dbo?
   └─ Carril C: db/legacy/, aditivo, con rollback escrito
```

La pregunta que decide entre B y C es siempre la misma: **¿este cambio lo necesita el
sistema legacy, o solo lo necesita ALICES?** Si solo lo necesita ALICES, no hay razón para
arriesgar producción: creás algo nuevo en `alices` y listo.

---

## 4. El default NO es "crear un SP"

`ARCHITECTURE.md` ya dice que las lecturas van por **Dapper con SQL crudo** en la capa
Application. Ese SQL se versiona con la app (mismo commit, mismo PR), se despliega con la
app (cero pipeline de BD) y no necesita permisos de DDL en producción.

Creá un SP nuevo en `alices` **solo** si se cumple alguna de estas tres:

1. Lógica de conjuntos pesada que se beneficia de plan cacheado / tablas temporales.
2. Tiene que consumirla también el legacy, reportes o Excel.
3. Estás envolviendo lógica legacy densa que no querés duplicar en C#.

Si ninguna aplica → **SQL crudo en el handler**. Te ahorrás el 80% de este pipeline.

---

## 5. Punto de partida: qué ya tenés (verificado hoy)

| Cosa | Estado |
|---|---|
| Git instalado y configurado | ✅ `Eduardo / ejaucha@alicescorporation.com` |
| Repositorio | ✅ Ya existe, rama `master`, remoto `github.com/DevCorpo001/NEW-ALICES` |
| Secretos en el historial | ✅ Limpio. `appsettings.json` tiene `ConnectionStrings:Database` y `Jwt:Secret` **vacíos**, y nunca se comitearon con valor |
| `.gitignore` | ✅ Cubre `bin/`, `obj/`, `appsettings.*.Local.json` |
| .NET SDK | ✅ Instalado (pinneado a 10.0.302 por `global.json`) |
| Docker Desktop | ✅ Instalado |
| `sqlcmd` | ✅ Instalado |
| `sqlpackage` / `mssql-scripter` | ❌ **Falta instalar** (paso 4.4) |
| Carpeta `db/` y proyecto DbUp | ❌ **No existen todavía** |
| `corp-backend/sql/sp_Alices_ValidarCredenciales.sql` | ⚠️ Escrito pero **nunca desplegado**. Declara `[dbo].[...]` → hay que cambiarlo a `alices` |
| Esquema `alices` + logins (`db/migrations/0001_...sql`, `db/seguridad/grants.sql`) | ✅ Escritos, pendientes de correr (§6.3) |
| **Entorno de staging** | ✅ **Existe:** `CORE_CORP_PRUEBA` en el servidor `CORP-PRUEBA`. Es donde probás hoy. |
| **Entorno de producción** | ✅ **Existe, en un servidor distinto:** `CORE_CORP`. |
| **Promoción de pruebas → producción** | ⚠️ **Manual y sin registro.** Hoy se copia y pega el SQL a mano en SSMS de un servidor al otro. Sin garantía de que lo que corrió en pruebas sea *exactamente* lo que corre en producción, y sin quedar ningún rastro de quién promovió qué ni cuándo. **Este es el problema de fondo que el CD (§6.11) resuelve.** |

**Tus secretos locales van en `appsettings.Development.Local.json`** (ya gitignoreado).
Nunca pongas un connection string real en `appsettings.json` ni en
`appsettings.Development.json`: esos dos sí se comitean.

> **Corrección respecto a la versión anterior de este documento:** había asumido que
> `CORE_CORP_PRUEBA` era la única base y que no existía un entorno de pruebas separado.
> Es al revés: sí existe (`CORE_CORP_PRUEBA`), y también existe una producción real y
> distinta (`CORE_CORP`, otro servidor). Lo que falta no es el entorno — es automatizar
> el paso entre los dos, reemplazando el copiar-pegar manual por el mismo script
> versionado corriendo primero en uno y después en el otro, con aprobación de por medio.

---

## 6. Qué hacer, paso a paso

### 6.1 — Blindar el auto-migrate ⚠️ LO MÁS URGENTE

`Program.cs:104` aplica migraciones de EF automáticamente en `Development`, y hay una
migración pendiente que ejecuta un **`DropTable`**
(`20260823120000_EliminarPadronUsuariosFantasma`). Si el connection string de Development
de cualquier desarrollador apunta a la base compartida, un simple `dotnet run` corre ese
DROP contra ella. **Esto no es hipotético: es el estado actual del código.**

Editá `Program.cs`:

```csharp
// Antes:  if (app.Environment.IsDevelopment()) { await app.ApplyMigrationsAsync(); ... }
if (app.Environment.IsDevelopment())
{
    if (builder.Configuration.GetValue<bool>("Database:AutoMigrate"))
        await app.ApplyMigrationsAsync();

    app.MapOpenApi();
}
```

Y poné `"Database": { "AutoMigrate": true }` **solo** en tu
`appsettings.Development.Local.json`, y **solo** cuando el connection string apunte al
contenedor local. Nunca en un archivo comiteado.

### 6.2 — Averiguar la versión del SQL Server legacy

`CREATE OR ALTER` existe desde SQL Server **2016 SP1**. Si el legacy es anterior, toda la
estrategia de idempotencia cambia (habría que usar
`IF OBJECT_ID(...) IS NULL EXEC('CREATE PROCEDURE ...')` seguido de `ALTER`).

```sql
SELECT @@VERSION, SERVERPROPERTY('ProductMajorVersion'), SERVERPROPERTY('Edition');
```

`ProductMajorVersion = 17` → SQL Server 2025
(13 = 2016, 14 = 2017, 15 = 2019, 16 = 2022, 17 = 2025).

✅ **Resuelto: `CREATE OR ALTER` está disponible.** Toda la estrategia de idempotencia de
este documento aplica tal cual. Ojo con una consecuencia en §6.8: la imagen de Docker
debe ser **2025**, no 2022, o vas a probar contra un motor más viejo que producción.

### 6.3 — Crear el esquema `alices` y los tres logins

Esto lo corre un DBA **una sola vez**, contra la base real. Separar privilegios desde el
día uno es lo que hace *estructuralmente imposible* que un script mal escrito toque el
legacy — mucho más fuerte que una convención escrita.

| Login | Permisos | Lo usa |
|---|---|---|
| `alices_app` | `SELECT` en `dbo`; `EXECUTE` SP por SP en `dbo`; `EXECUTE`/`SELECT` en `alices`. **Cero DDL.** | La API en runtime |
| `alices_deploy` | `ALTER`/`CREATE`/`EXECUTE` **solo** en el esquema `alices`. Cero derechos en `dbo`. | El pipeline de CD, carriles A y B |
| `legacy_deploy` | `ALTER` sobre `dbo`, pero **sin** `DROP TABLE`. Se usa solo en el job del carril C | El pipeline de CD, carril C |
| `alices_dev` | Solo lectura. **Hoy no hay una copia sobre la que apuntarlo** — ver nota abajo | Desarrollo/diagnóstico |

**Para qué sirve separar logins, siendo vos `sysadmin`:** no es una barrera para vos —
como `sysadmin` podés hacer cualquier cosa igual. Es una barrera para el **pipeline no
atendido** (el runner de GitHub Actions). Ese proceso corre sin que nadie esté mirando la
pantalla en el instante exacto del deploy: si tiene permisos de `dbo` por default, un typo
en un workflow o un secret mal puesto se convierte en un incidente de producción sin que
nadie lo vea venir. `alices_deploy` (carriles A/B, sin acceso a `dbo`) corre en todos los
deploys normales; `legacy_deploy` (carril C, con `ALTER` en `dbo`) solo se usa en el job
separado, con aprobación, cuando de verdad hay que tocar el legacy — no reemplaza esa
necesidad, la acota a un solo camino auditable.

Los scripts ya están escritos, sin secretos, listos para correr:
`db/migrations/0001_crear_esquema_alices.sql` (crea el esquema) y `db/seguridad/grants.sql`
(da los permisos, asumiendo que los logins ya existen). Los logins con contraseña se crean
aparte, en un script que **no** se comitea:

```powershell
# 1) Logins con contraseña (usa tus propias claves, guardalas en tu gestor de contraseñas)
sqlcmd -S "192.168.1.212\CORP-PRUEBA,1457" -U <tu_usuario_sysadmin> -P "<tu_password>" -C `
  -v AppPass="..." DeployPass="..." LegacyDeployPass="..." `
  -i bootstrap-logins.sql -d CORE_CORP_PRUEBA

# 2) Esquema alices (aditivo, no toca nada existente)
sqlcmd -S "192.168.1.212\CORP-PRUEBA,1457" -U <tu_usuario_sysadmin> -P "<tu_password>" -C `
  -d CORE_CORP_PRUEBA -i corp-backend\db\migrations\0001_crear_esquema_alices.sql

# 3) Permisos
sqlcmd -S "192.168.1.212\CORP-PRUEBA,1457" -U <tu_usuario_sysadmin> -P "<tu_password>" -C `
  -d CORE_CORP_PRUEBA -i corp-backend\db\seguridad\grants.sql
```

Los tres pasos son **aditivos y de solo lectura sobre lo existente**: crean cosas nuevas
(logins, un esquema vacío, permisos), no modifican ni un objeto de `dbo`.

**Corrélos dos veces, una por entorno:** primero contra `CORE_CORP_PRUEBA` (server
`CORP-PRUEBA`) para armar y probar todo el circuito sin riesgo. Recién cuando ese circuito
funcione de punta a punta, repetí los mismos tres comandos cambiando `-S` y `-d` al
servidor y base de `CORE_CORP` (producción) — con tu usuario `sysadmin` ahí, y
preferentemente ya con el paso 3 del CD (§6.11) armado, para que ese segundo `alices_deploy`
quede usado por el pipeline y no por vos a mano desde el día uno.

### 6.4 — Bajar el baseline del esquema legacy a Git

**Este es el paso que hace que el CI sirva para algo.** SQL Server tiene *resolución
diferida de nombres*: un `CREATE PROCEDURE` que referencia una tabla inexistente **se crea
sin error**. Si el CI levanta un SQL Server vacío y corre tus scripts, van a "pasar" aunque
todas las referencias a las ~100 tablas legacy estén rotas — verde en el pipeline, explosión
en el primer `EXEC` en producción.

La solución: versionar la **estructura** del legacy (sin datos) y restaurarla en el
contenedor **antes** de correr tus scripts.

Extraelo de `CORE_CORP_PRUEBA` — tu entorno de pruebas, no de `CORE_CORP` (producción).
Igual que antes: es una lectura de metadatos (`--schema-only`), no toca ni una fila de
datos.

```powershell
pip install mssql-scripter          # el que falta instalar

mssql-scripter --connection-string "Server=192.168.1.212\CORP-PRUEBA,1457;Database=CORE_CORP_PRUEBA;User Id=<tu_usuario>;Password=<tu_password>;TrustServerCertificate=True" `
  --schema-only --file-per-object --script-drop-create `
  -f db/baseline/legacy/
```

Comiteá `db/baseline/legacy/`. **Es documentación de solo lectura**: nunca se aplica a
producción, solo se restaura en contenedores de CI/desarrollo. Refrescalo con un job
semanal — de `CORE_CORP_PRUEBA`, que es donde vos trabajás día a día — para enterarte
cuando el legacy cambie bajo tus pies. Si `CORE_CORP` (producción) puede tener estructura
que `CORE_CORP_PRUEBA` todavía no tiene (un cambio que alguien aplicó directo en
producción y nunca bajó a pruebas), ese desvío es exactamente lo que el CD de §6.11
elimina: a partir de que el pipeline exista, todo cambio a `dbo` nace en Git, se prueba en
`CORE_CORP_PRUEBA` primero, y solo después se promueve a `CORE_CORP` — nunca al revés.

#### 6.4.1 — Lo que el CD reemplaza: copiar y pegar SQL a mano en SSMS

Ya tenés los dos entornos (`CORE_CORP_PRUEBA` y `CORE_CORP`, en servidores distintos). Lo
que falta no es infraestructura nueva, es **dejar de mover cambios a mano** entre ambos.
Copiar y pegar en SSMS tiene tres problemas que el pipeline versionado resuelve:

1. **No hay garantía de que sea el mismo script.** Entre que lo probaste en pruebas y lo
   volviste a tipear/pegar en producción, pudiste editarlo sin querer, olvidarte una
   línea, o correrlo en el orden equivocado.
2. **No queda registro.** Si algo se rompe en producción, no hay forma de ver qué se
   corrió, cuándo, ni quién lo hizo — solo el estado final de la base.
3. **No hay compuerta.** Cualquiera con acceso a SSMS y a producción puede correr
   cualquier cosa, sin revisión de nadie más en el medio.

Con DbUp + este pipeline, el mismo archivo `.sql` de `db/legacy/NNNN_descripcion/up.sql`
es lo único que se ejecuta en los dos entornos: primero en `CORE_CORP_PRUEBA` (para
probarlo), después —con aprobación, en un job separado— en `CORE_CORP`. Es Git el que
dice qué se corrió y cuándo; es el `environment` de GitHub el que exige que alguien más
apruebe antes de tocar producción. Dejás de copiar y pegar: el script que ya probaste es,
literalmente, el mismo que se aplica.

### 6.5 — Crear la estructura de carpetas

```
corp-backend/
├── db/
│   ├── baseline/legacy/                  # esquema legacy, solo lectura, NO se despliega
│   ├── migrations/                       # CARRIL B: run-once, con journal, el orden importa
│   │   └── 0001_crear_esquema_alices.sql
│   ├── programmables/                    # CARRIL B: idempotentes, RunAlways, el orden NO importa
│   │   ├── stored-procedures/
│   │   ├── views/
│   │   └── functions/
│   ├── legacy/                           # CARRIL C: cambios a dbo. Run-once + rollback obligatorio
│   │   ├── 0001_agregar_columna_x/
│   │   │   ├── up.sql
│   │   │   └── rollback.sql
│   │   └── 0002_alter_sp_login/
│   │       ├── up.sql
│   │       └── rollback.sql
│   ├── seguridad/grants.sql              # GRANTs, idempotente, RunAlways
│   └── tests/validar-objetos.sql
└── src/Alices/Alices.Database/           # proyecto consola DbUp
```

Cuatro carpetas, cuatro semánticas, y no se mezclan:

- **`migrations/`** — se ejecuta **una vez** y DbUp lo registra en su journal. Para lo no
  idempotente: crear el esquema, crear una tabla, un backfill. Prefijo numérico secuencial.
  Un archivo ya aplicado **jamás se edita**: se corrige con uno nuevo.
- **`programmables/`** — se ejecuta **siempre** (`RunAlways`). Un archivo = un objeto,
  con `CREATE OR ALTER`, así reejecutar es inofensivo y el diff de Git muestra la
  evolución real del SP.
- **`legacy/`** — el carril C (§3). Run-once, **una carpeta por cambio**, con su `up.sql`
  y su `rollback.sql` al lado. El rollback no es opcional: es el precio de entrada a `dbo`.
  Los objetos de `dbo` que este carril modifique se documentan en el `up.sql`: qué SP del
  legacy cambia, qué pantalla lo usa, y por qué el cambio es aditivo.
- **`seguridad/`** — GRANTs, idempotente, corre al final cuando los objetos ya existen.

### 6.6 — Crear el proyecto DbUp

```bash
cd corp-backend
dotnet new console -o src/Alices/Alices.Database -n Alices.Database
cd src/Alices/Alices.Database
dotnet add package dbup-sqlserver
dotnet sln ../../../Alices.slnx add .
```

`Program.cs`:

```csharp
using DbUp;
using DbUp.Support;

var connectionString = args.FirstOrDefault(a => a.StartsWith("--conn="))?[7..]
    ?? Environment.GetEnvironmentVariable("ALICES_DB_CONNECTION")
    ?? throw new InvalidOperationException("Falta el connection string.");

var dryRun  = args.Contains("--dry-run");
var scripts = Path.Combine(AppContext.BaseDirectory, "scripts");

var upgrader = DeployChanges.To
    .SqlDatabase(connectionString)
    // El journal vive en alices: no ensuciamos el dbo del legacy.
    .JournalToSqlTable("alices", "schema_versions")

    // Carril C primero: si el legacy necesita una columna nueva, tiene que existir
    // antes de que un objeto de alices la referencie. Solo los up.sql.
    .WithScriptsFromFileSystem(Path.Combine(scripts, "legacy"),
        f => f.EndsWith("up.sql", StringComparison.OrdinalIgnoreCase),
        new SqlScriptOptions { ScriptType = ScriptType.RunOnce,  RunGroupOrder = 0 })

    .WithScriptsFromFileSystem(Path.Combine(scripts, "migrations"),
        new SqlScriptOptions { ScriptType = ScriptType.RunOnce,  RunGroupOrder = 1 })
    .WithScriptsFromFileSystem(Path.Combine(scripts, "programmables"),
        new SqlScriptOptions { ScriptType = ScriptType.RunAlways, RunGroupOrder = 2 })
    .WithScriptsFromFileSystem(Path.Combine(scripts, "seguridad"),
        new SqlScriptOptions { ScriptType = ScriptType.RunAlways, RunGroupOrder = 3 })

    .WithTransactionPerScript()
    .LogToConsole()
    .Build();

if (dryRun)
{
    foreach (var s in upgrader.GetScriptsToExecute())
        Console.WriteLine($"[pendiente] {s.Name}");
    return 0;
}

var result = upgrader.PerformUpgrade();
if (!result.Successful)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine(result.Error);
    return 1;
}

Console.WriteLine("Despliegue de BD correcto.");
return 0;
```

En el `.csproj`, copiar los scripts al output:

```xml
<ItemGroup>
  <None Include="..\..\..\db\legacy\**\*.sql"        CopyToOutputDirectory="PreserveNewest" LinkBase="scripts\legacy" />
  <None Include="..\..\..\db\migrations\**\*.sql"    CopyToOutputDirectory="PreserveNewest" LinkBase="scripts\migrations" />
  <None Include="..\..\..\db\programmables\**\*.sql" CopyToOutputDirectory="PreserveNewest" LinkBase="scripts\programmables" />
  <None Include="..\..\..\db\seguridad\**\*.sql"     CopyToOutputDirectory="PreserveNewest" LinkBase="scripts\seguridad" />
</ItemGroup>
```

> **Por qué DbUp y no un `.dacpac`/SSDT:** un dacpac hace *diff de estado* y quiere
> converger la BD **entera** hacia el modelo del proyecto. Con 100 tablas legacy que no
> controlás, eso es exactamente lo que **no** querés: un `/p:` mal puesto genera un `DROP`
> sobre `dbo`. DbUp corre los scripts que le diste, y nada más.

### 6.7 — Mover el SP que ya escribiste

`corp-backend/sql/sp_Alices_ValidarCredenciales.sql` nunca se desplegó (lo dice su propia
cabecera), pero declara `CREATE PROCEDURE [dbo].[...]` y no califica las tablas.
Moverlo a `db/programmables/stored-procedures/` **conservando su nombre**, y cambiar solo
dos cosas: el esquema y la calificación de las tablas.

```sql
-- =============================================================================
-- alices.sp_Alices_ValidarCredenciales
--
-- Complementa (para ALICES): dbo.sp_Login_LogeoUsuarios — que NO se modifica.
-- Consumido por: Alices.Application/Autenticacion/IniciarSesion
-- ADITIVO: no toca ningún objeto de dbo. El legacy no se ve afectado.
--
-- Diferencias con el SP legacy (intencionales):
--   - No filtra por estado ni ventana horaria → lo decide PoliticaAccesoUsuario en C#.
--   - No inserta en INGRESO_SESION → lo dispara un evento de dominio.
--   - No devuelve la columna CLAVE.
-- =============================================================================
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE alices.sp_Alices_ValidarCredenciales
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
        u.[DESCRIP]      AS NOMBRECOMPLETO,
        u.[ID_ROL]       AS IDROL,
        r.[DESC_ROL]     AS ROL,
        u.[ESTADO],
        v.[rutavista],
        u.[MAX_SESIONES]
    FROM dbo.[Usuario] u                          -- ← calificado con dbo
    LEFT JOIN dbo.[Rol]    r ON u.ID_ROL = r.ID_ROL
    LEFT JOIN dbo.[Vistas] v ON r.ID_VISTA_INICIO = v.Id
    WHERE u.USUARIO = TRIM(@usuario)
      AND u.CLAVE   = TRIM(@clave);
END
GO
```

Después borrá la carpeta `corp-backend/sql/`.

**Reglas del cuerpo de cualquier objeto nuevo, no negociables:**

- `CREATE OR ALTER`, nunca `DROP` + `CREATE` (el `DROP` pierde los GRANTs).
- Calificar siempre el esquema: `dbo.Usuario`, no `Usuario`. Sin esto, qué objeto se
  resuelve depende del `default_schema` del usuario que ejecute.
- `SET NOCOUNT ON` al inicio.
- Cabecera documentando: qué complementa, quién lo consume, en qué difiere del legacy.
- Ningún `INSERT`/`UPDATE`/`DELETE` sobre tablas de `dbo` sin aprobación explícita del
  dueño del legacy, documentada en la cabecera.

> Aparte, fuera del alcance de este documento pero hay que decirlo: ese SP compara
> `u.CLAVE = @clave`, o sea **contraseñas en texto plano en la BD legacy**. Este pipeline
> no arregla eso; necesita su propio plan de migración a hash (ya existe `PasswordHasher`
> en `Infrastructure/Authentication/`).

### 6.8 — SQL Server local con Docker

`corp-backend/docker-compose.db.yml`:

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2025-latest   # igualar el motor de producción (§6.2)
    container_name: alices-sql-dev
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "Alices_Dev_2026!"
      MSSQL_PID: Developer
    ports:
      - "14330:1433"          # puerto no estándar: imposible confundirlo con producción
    volumes:
      - alices-sql-data:/var/opt/mssql
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$$MSSQL_SA_PASSWORD\" -C -Q 'SELECT 1' || exit 1"]
      interval: 10s
      retries: 12
      start_period: 30s

volumes:
  alices-sql-data:
```

> Elegí una versión de imagen **igual o menor** a la del motor legacy (§6.2). Si producción
> es 2016 y probás en 2022, vas a escribir T-SQL que allá no compila.

`db/scripts/bootstrap-local.ps1` — deja tu entorno listo con un solo comando:

```powershell
$ErrorActionPreference = "Stop"
$conn = "Server=localhost,14330;Database=AlicesDev;User Id=sa;Password=Alices_Dev_2026!;TrustServerCertificate=True;Encrypt=True"

docker compose -f docker-compose.db.yml up -d --wait

# 1) Crear la BD
sqlcmd -S localhost,14330 -U sa -P "Alices_Dev_2026!" -C -Q `
  "IF DB_ID('AlicesDev') IS NULL CREATE DATABASE AlicesDev;"

# 2) Restaurar el baseline del legacy (solo estructura)
Get-ChildItem db/baseline/legacy -Filter *.sql -Recurse | Sort-Object FullName | ForEach-Object {
    sqlcmd -S localhost,14330 -U sa -P "Alices_Dev_2026!" -C -d AlicesDev -i $_.FullName -b
    if ($LASTEXITCODE -ne 0) { throw "Falló el baseline: $($_.Name)" }
}

# 3) Aplicar nuestros scripts
dotnet run --project src/Alices/Alices.Database -- --conn="$conn"

# 4) Validar que los objetos nuevos compilan de verdad
sqlcmd -S localhost,14330 -U sa -P "Alices_Dev_2026!" -C -d AlicesDev -i db/tests/validar-objetos.sql -b
```

### 6.9 — La validación que sí sirve

`db/tests/validar-objetos.sql`. Esto cierra el agujero de la resolución diferida de
nombres: `sp_refreshsqlmodule` **sí falla** si el cuerpo del módulo referencia tablas o
columnas que no existen.

```sql
SET NOCOUNT ON;

DECLARE @nombre sysname, @errores int = 0;

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT QUOTENAME(s.name) + '.' + QUOTENAME(o.name)
    FROM sys.objects o
    JOIN sys.schemas s ON o.schema_id = s.schema_id
    WHERE s.name = 'alices'
      AND o.type IN ('P', 'V', 'FN', 'IF', 'TF')
      AND o.is_ms_shipped = 0;

OPEN cur;
FETCH NEXT FROM cur INTO @nombre;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        EXEC sys.sp_refreshsqlmodule @name = @nombre;
        PRINT 'OK      ' + @nombre;
    END TRY
    BEGIN CATCH
        SET @errores += 1;
        PRINT 'ERROR   ' + @nombre + ' -> ' + ERROR_MESSAGE();
    END CATCH

    FETCH NEXT FROM cur INTO @nombre;
END

CLOSE cur; DEALLOCATE cur;

-- Guardarraíl: ningún objeto nuestro debe haber aterrizado en dbo.
IF EXISTS (SELECT 1 FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id
           WHERE s.name = 'dbo' AND o.name LIKE '%Alices%' AND o.is_ms_shipped = 0)
BEGIN
    PRINT 'ERROR   Hay objetos de ALICES creados en dbo.';
    SET @errores += 1;
END

IF @errores > 0
    THROW 50001, 'Validación de objetos fallida.', 1;

PRINT 'Validación correcta.';
```

### 6.10 — Pipeline de CI

`.github/workflows/db-ci.yml`:

```yaml
name: BD - Integración continua

on:
  pull_request:
    paths: ['corp-backend/db/**', 'corp-backend/src/Alices/Alices.Database/**']
  push:
    branches: [main, master]
    paths: ['corp-backend/db/**', 'corp-backend/src/Alices/Alices.Database/**']

jobs:
  validar:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: corp-backend

    services:
      sqlserver:
        image: mcr.microsoft.com/mssql/server:2025-latest   # mismo motor que producción
        env:
          ACCEPT_EULA: "Y"
          MSSQL_SA_PASSWORD: ${{ secrets.CI_SA_PASSWORD }}
          MSSQL_PID: Developer
        ports: ['1433:1433']
        options: >-
          --health-cmd="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$MSSQL_SA_PASSWORD\" -C -Q 'SELECT 1'"
          --health-interval=10s --health-retries=12 --health-start-period=30s

    steps:
      - uses: actions/checkout@v4

      - name: Guardarraíl B — los carriles A y B no tocan dbo
        run: |
          if grep -rniE '(CREATE|ALTER|DROP)[[:space:]]+(OR[[:space:]]+ALTER[[:space:]]+)?(PROCEDURE|VIEW|FUNCTION|TABLE|TRIGGER)[[:space:]]+(\[?dbo\]?\.)' db/programmables/ db/migrations/; then
            echo "::error::Un script del carril B intenta crear/alterar objetos en dbo. Va en db/legacy/."
            exit 1
          fi
          if grep -rniE '^\s*(DROP\s+(TABLE|PROCEDURE|VIEW)|TRUNCATE\s+TABLE)' db/programmables/ db/seguridad/; then
            echo "::error::DROP/TRUNCATE en scripts idempotentes. Prohibido."
            exit 1
          fi

      - name: Guardarraíl C — todo cambio a dbo trae rollback y no es destructivo
        run: |
          for d in db/legacy/*/; do
            [ -f "$d/up.sql" ]       || { echo "::error::$d no tiene up.sql";       exit 1; }
            [ -f "$d/rollback.sql" ] || { echo "::error::$d no tiene rollback.sql"; exit 1; }
          done
          if grep -rniE '(DROP\s+(TABLE|COLUMN)|TRUNCATE\s+TABLE|DROP\s+PROCEDURE)' db/legacy/ 2>/dev/null; then
            echo "::error::Cambio destructivo sobre dbo. Requiere plan en dos despliegues y aprobación explícita."
            exit 1
          fi

      - uses: actions/setup-dotnet@v4
        with:
          global-json-file: corp-backend/global.json

      - name: Crear BD de prueba
        run: sqlcmd -S localhost,1433 -U sa -P "${{ secrets.CI_SA_PASSWORD }}" -C -b -Q "CREATE DATABASE AlicesCi;"

      - name: Restaurar el baseline del esquema legacy
        run: |
          for f in $(find db/baseline/legacy -name '*.sql' | sort); do
            sqlcmd -S localhost,1433 -U sa -P "${{ secrets.CI_SA_PASSWORD }}" -C -d AlicesCi -i "$f" -b
          done

      - name: Aplicar scripts (DbUp)
        run: |
          dotnet run --project src/Alices/Alices.Database -- \
            --conn="Server=localhost,1433;Database=AlicesCi;User Id=sa;Password=${{ secrets.CI_SA_PASSWORD }};TrustServerCertificate=True;Encrypt=True"

      - name: Validar que los objetos compilan (sp_refreshsqlmodule)
        run: sqlcmd -S localhost,1433 -U sa -P "${{ secrets.CI_SA_PASSWORD }}" -C -d AlicesCi -i db/tests/validar-objetos.sql -b

      - name: Idempotencia — el segundo pase debe ser limpio
        run: |
          dotnet run --project src/Alices/Alices.Database -- \
            --conn="Server=localhost,1433;Database=AlicesCi;User Id=sa;Password=${{ secrets.CI_SA_PASSWORD }};TrustServerCertificate=True;Encrypt=True"

      - name: Compilar el backend
        run: dotnet build Alices.slnx --configuration Release
```

Los cuatro pasos que dan valor real: el **guardarraíl de `dbo`** (falla antes de tocar
nada), el **baseline** (sin él no hay validación posible), **`sp_refreshsqlmodule`**
(atrapa referencias rotas) y el **segundo pase** (prueba que los scripts son de verdad
idempotentes).

### 6.11 — Pipeline de CD

Una BD no se revierte con un redeploy como el código. Producción va con compuerta manual.

Acá es donde el pipeline reemplaza el copiar-pegar manual en SSMS: `entorno: staging`
apunta a `CORE_CORP_PRUEBA` (server `CORP-PRUEBA`), `entorno: produccion` apunta a
`CORE_CORP` (el otro servidor). Cada uno tiene su propio `secrets.DB_CONNECTION`,
configurado en el Environment correspondiente de GitHub (`Settings → Environments`) — así
el secret de producción no es ni siquiera visible para quien solo tiene permiso de
desplegar a staging.

`.github/workflows/db-cd.yml`:

```yaml
name: BD - Despliegue

on:
  workflow_dispatch:
    inputs:
      entorno:
        type: choice
        options: [staging, produccion]
        required: true

jobs:
  desplegar:
    runs-on: ubuntu-latest
    environment: ${{ inputs.entorno }}   # ← required reviewers se configura acá
    defaults:
      run:
        working-directory: corp-backend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          global-json-file: corp-backend/global.json

      - name: Verificar backup reciente (< 24 h)
        run: |
          sqlcmd -S "${{ secrets.DB_SERVER }}" -U alices_deploy -P "${{ secrets.DB_DEPLOY_PASSWORD }}" -C -b -Q "
            IF NOT EXISTS (
                SELECT 1 FROM msdb.dbo.backupset
                WHERE database_name = DB_NAME() AND type = 'D'
                  AND backup_finish_date > DATEADD(hour, -24, GETDATE()))
            THROW 50002, 'Sin backup completo en las últimas 24 h. Abortado.', 1;"

      - name: Detectar drift (SPs editados a mano en el servidor)
        run: sqlcmd -S "${{ secrets.DB_SERVER }}" -U alices_deploy -P "${{ secrets.DB_DEPLOY_PASSWORD }}" -C -b -i db/tests/detectar-drift.sql

      - name: Listar lo que se va a aplicar (dry-run)
        run: dotnet run --project src/Alices/Alices.Database -- --conn="${{ secrets.DB_CONNECTION }}" --dry-run

      - name: Aplicar
        run: dotnet run --project src/Alices/Alices.Database -- --conn="${{ secrets.DB_CONNECTION }}"

      - name: Validar post-despliegue
        run: sqlcmd -S "${{ secrets.DB_SERVER }}" -U alices_deploy -P "${{ secrets.DB_DEPLOY_PASSWORD }}" -C -b -i db/tests/validar-objetos.sql
```

> **Carril C en el CD.** El job de arriba corre con `alices_deploy`, que tiene `DENY`
> sobre `dbo`: si un script de `db/legacy/` se colara ahí, **falla por permisos**, que es
> exactamente lo que queremos. Los cambios al legacy van en un job separado
> (`desplegar-legacy`) con el login `legacy_deploy`, su propio `environment` de GitHub con
> reviewers distintos, y un paso extra que imprime el `rollback.sql` en el log del deploy
> — para que esté a un copiar-pegar de distancia si hay que usarlo a las 3 de la mañana.

**Detección de drift** (`db/tests/detectar-drift.sql`): guardá un hash del texto de cada
objeto en `alices.objeto_huella` al desplegar, y al inicio del siguiente deploy compará
contra `OBJECT_DEFINITION` real. Si difiere, alguien editó producción a mano con SSMS: el
deploy para y avisa, en vez de pisar el cambio en silencio.

```sql
SELECT s.name + '.' + o.name AS objeto
FROM sys.objects o
JOIN sys.schemas s ON o.schema_id = s.schema_id
LEFT JOIN alices.objeto_huella h ON h.objeto = s.name + '.' + o.name
WHERE s.name = 'alices' AND o.type IN ('P','V','FN','IF','TF')
  AND (h.huella IS NULL
       OR h.huella <> CONVERT(char(64),
            HASHBYTES('SHA2_256', OBJECT_DEFINITION(o.object_id)), 2));
-- Filas devueltas = drift. Revisar manualmente antes de continuar.
```

**EF Core en producción: nunca `database update`.** Se genera el script, se revisa, y se
aplica por el mismo canal:

```bash
dotnet ef migrations script --idempotent \
  -p src/Alices/Alices.Infrastructure -s src/Alices/Alices.API \
  -o db/migrations/0002_ef_<descripcion>.sql
```

Y acotá EF al esquema `alices`, incluido su propio historial, para no dejar
`__EFMigrationsHistory` tirado en la base del legacy:

```csharp
// Infrastructure/DependencyInjection.cs
options.UseSqlServer(connectionString, sql =>
    sql.MigrationsHistoryTable("__ef_migrations_history", "alices"));

// ApplicationDbContext.OnModelCreating
modelBuilder.HasDefaultSchema("alices");
```

---

## 7. Reglas duras

**Nunca:**

1. Tocar `dbo` desde los carriles A o B. Si el cambio es realmente para el legacy, va en
   `db/legacy/` (carril C), con su rollback y su aprobación.
2. Cambiar algo de `dbo` porque lo necesita **solo ALICES**. Para eso se crea algo nuevo
   en `alices`.
3. Renombrar o duplicar un SP legacy "para que quede más lindo".
4. `DROP` + `CREATE` de un SP (perdés los GRANTs). Siempre `CREATE OR ALTER`.
5. Editar un script ya aplicado de `migrations/` o `legacy/` — corregí con uno nuevo.
6. `DROP COLUMN` / `DROP TABLE` / achicar un tipo en `dbo` en un solo despliegue.
7. `dotnet ef database update` contra producción.
8. Apuntar el connection string de `Development` a la base compartida o de producción.
9. Comitear un connection string o un `Jwt:Secret` real (van en
   `appsettings.Development.Local.json` o en variables de entorno).

**Siempre:**

1. Calificar el esquema en toda referencia (`dbo.Usuario`, nunca `Usuario`).
2. Documentar en la cabecera del objeto: qué complementa, quién lo consume, en qué difiere.
3. Para el carril C: `rollback.sql` escrito **antes** del deploy, en el mismo PR.
4. Pasar por el CI (guardarraíles + baseline + `sp_refreshsqlmodule` + doble pase) antes de merge.
5. Aprobación manual para producción.

---

## 8. Checklists

### Objeto nuevo en `alices` (carril B)

- [ ] ¿Hace falta un SP, o alcanza SQL crudo con Dapper en el handler? (§4)
- [ ] Vive en el esquema `alices`, nunca en `dbo`
- [ ] `CREATE OR ALTER`, en `db/programmables/`, un archivo = un objeto
- [ ] Cabecera con: qué complementa / quién lo consume / diferencias con el legacy
- [ ] Todas las referencias calificadas con su esquema
- [ ] Cero escrituras sobre tablas de `dbo`
- [ ] `GRANT EXECUTE` a `alices_app` en `db/seguridad/grants.sql`
- [ ] CI verde: guardarraíles + baseline + validación + segundo pase
- [ ] El handler de Application apunta al objeto nuevo; el legacy sigue con el suyo

### Cambio a `dbo` (carril C)

- [ ] ¿Lo necesita el legacy, o solo ALICES? Si es solo ALICES → carril B
- [ ] Es **aditivo**: apagando ALICES, el legacy sigue funcionando igual que ayer
- [ ] Columna nueva → `NULL` o con `DEFAULT`. Nunca `NOT NULL` pelado
- [ ] SP legacy → `CREATE OR ALTER`, nunca `DROP` + `CREATE`
- [ ] Carpeta propia en `db/legacy/NNNN_descripcion/` con `up.sql` **y** `rollback.sql`
- [ ] El `up.sql` documenta: qué objeto de `dbo` cambia, qué pantalla del legacy lo usa
- [ ] Aplicado y verificado en `CORE_CORP_PRUEBA` vía el pipeline (no copiado a mano)
- [ ] Backup de `CORE_CORP` verificado < 24 h + ventana acordada + aprobación en el
      Environment `produccion` de GitHub

---

## 9. Orden de trabajo sugerido

**Semana 1 — piso firme, sin tocar producción:**

1. Blindar el auto-migrate de `Program.cs` (§6.1) ← **lo más urgente de todo**
2. ~~Verificar la versión del motor~~ ✅ hecho: SQL Server 2025 (§6.2)
3. Crear el esquema `alices` y los logins en `CORE_CORP_PRUEBA` (§6.3)
4. `pip install mssql-scripter` y extraer el baseline **de `CORE_CORP_PRUEBA`** (§6.4)
5. Crear `db/` y el proyecto `Alices.Database` (§6.5, §6.6)

**Semana 2 — el circuito completo con un solo SP (carril B), probado en `CORE_CORP_PRUEBA`:**

6. Mover `sql/sp_Alices_ValidarCredenciales.sql` a `alices` y borrar `sql/` (§6.7)
7. Docker local + bootstrap: verificar que el circuito cierra en tu máquina (§6.8)
8. `validar-objetos.sql` + workflow de CI (§6.9, §6.10)
9. CD con `environment: staging` apuntando a `CORE_CORP_PRUEBA` → primer despliegue
   automatizado, reemplazando el copiar-pegar en SSMS (§6.11)

**Semana 3 — repetir contra `CORE_CORP` (producción) y habilitar el carril C:**

10. Correr §6.3 y §6.11 (`environment: produccion`) también contra `CORE_CORP`, con su
    propio `alices_deploy` y sus propios secrets de GitHub
11. Crear `legacy_deploy` y el job `desplegar-legacy` con su propio environment (§3, §6.11)
12. Estrenar el carril C con el cambio más chico e inofensivo que tengas pendiente en
    `dbo` — un índice, una columna nullable. Probalo primero en `CORE_CORP_PRUEBA` vía el
    pipeline (no a mano); recién con eso verde, promové a `CORE_CORP` con aprobación. El
    objetivo no es el cambio en sí: es confirmar que dejaste de copiar y pegar SQL entre
    servidores.

**De ahí en adelante:** un objeto nuevo por caso de uso, nunca por lote, siempre
`CORE_CORP_PRUEBA` primero y `CORE_CORP` después vía el mismo script versionado. Y cada
vez que vayas a tocar `dbo`, la pregunta de siempre: *¿lo necesita el legacy, o solo
ALICES?*
