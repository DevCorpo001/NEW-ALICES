# ALICES — instrucciones para el agente

## Arquitectura obligatoria (backend)

Todo desarrollo en `corp-backend` sigue **Clean Architecture** según el proyecto de referencia `CLEAN ARCHITECTURE/` y el contrato:

**→ [`corp-backend/ARCHITECTURE.md`](corp-backend/ARCHITECTURE.md)**

Antes de implementar features, fixes o refactors en el backend, consultar y respetar ese documento:

- Capas: `Domain` ← `Application` ← `Infrastructure` + `API` (composition root)
- CQRS + MediatR (commands/queries)
- Factory methods + Result + Domain Events en Domain
- Escrituras: EF Core + UnitOfWork
- Lecturas: Dapper + SQL
- Controllers solo con `ISender`, sin repos ni DbContext
- Idioma del dominio: español

No romper la dirección de dependencias ni saltarse patrones “por rapidez”.

## Frontend

Todo desarrollo en `corp-frontend` es **obligatorio** que cargue y siga el skill:

**→ skill `pos-frontend`** (`.claude/skills/pos-frontend/SKILL.md`)

Antes de crear, editar o revisar componentes, servicios, stores o pantallas del frontend, usar la herramienta Skill con `name: pos-frontend`.

Complemento de UX/proyecto (también obligatorio):

**→ [`corp-frontend/FRONTEND.md`](corp-frontend/FRONTEND.md)**

Arquitectura y reglas de escalabilidad:

**→ [`corp-frontend/ARCHITECTURE.md`](corp-frontend/ARCHITECTURE.md)**

Resumen:

- Angular standalone + Tailwind + `@angular/cdk` (solo primitivas de comportamiento; ver skill)
- Estructura `core/` / `shared/{directives,services,ui}` / `features/<feature>/{data-access,ui}` / `layout/`
- HTTP vía `provideHttpClient` + proxy dev a la API
- Sin lógica de dominio del backend en el front
- **Toda vista navegable con Enter**: autofocus en el primer control; Enter salta al siguiente input/botón; en el último activa el botón primario (submit/buscar)
- Directiva reutilizable en `core`/`shared` (no reimplementar foco por pantalla)

## Referencia de código y migración (SOLO LECTURA)

- **`ProyectoVenta/`**: Proyecto legacy (antiguo) desde el cual se está migrando el sistema hacia ALICES.
  - **Uso**: **Estrictamente solo lectura / referencia**.
  - **Propósito**: Consultar lógica de negocio, pantallas, llamadas a Stored Procedures y flujos originales para replicarlos y modernizarlos fielmente en las nuevas funcionalidades.
  - **Regla**: **Nunca modificar archivos en `ProyectoVenta/`**. Todo desarrollo nuevo debe implementarse en `corp-backend` o `corp-frontend`.
- **`CLEAN ARCHITECTURE/`**: Plantilla viva de referencia arquitectónica para el backend (consulta local).

## Acceso a la base de datos corporativa (SOLO LECTURA Y CON LÍMITES)

Bases de datos de pruebas configuradas:
- **Activa actual**: Servidor `209.222.97.55\CORECORP` ➔ Base de datos **`PRUEBAS`**.
  - **⚠️ REGLA CRÍTICA DE SEGURIDAD**: Este servidor aloja instancias de producción. Está **ESTRICTAMENTE PROHIBIDO** consultar, cambiarse o interactuar con cualquier otra base de datos que no sea `PRUEBAS`.
- **Local de desarrollo**: Servidor `192.168.1.212\CORP-PRUEBA` ➔ Base de datos `CORE_CORP_PRUEBA` (cuando haya acceso en red local).

Reglas de consulta para el agente:
- **Solo lectura**: Permitido inspeccionar esquemas, `sp_helptext`, metadatos y definiciones de SPs/funciones/tablas.
- **Consultas de datos acotadas**: Si se ejecuta un `SELECT` sobre tablas con datos, **siempre usar `TOP N`** (ej.: `TOP 10` o `TOP 20`) para prevenir sobrecarga y bloqueos.
- **Prohibido**: Ejecutar `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE` o SPs de mutación directos a mano en la BD.
