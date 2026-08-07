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

**→ skill `pos-frontend`** (`.opencode/skills/pos-frontend/SKILL.md`)

Antes de crear, editar o revisar componentes, servicios, stores o pantallas del frontend, usar la herramienta Skill con `name: pos-frontend`.

Complemento de UX/proyecto (también obligatorio):

**→ [`corp-frontend/FRONTEND.md`](corp-frontend/FRONTEND.md)**

Resumen:

- Angular standalone + Tailwind + Spartan/ng (según skill)
- Estructura `core/` / `shared/` / `features/<feature>/{data-access,ui}` / `layout/`
- HTTP vía `provideHttpClient` + proxy dev a la API
- Sin lógica de dominio del backend en el front
- **Toda vista navegable con Enter**: autofocus en el primer control; Enter salta al siguiente input/botón; en el último activa el botón primario (submit/buscar)
- Directiva reutilizable en `core`/`shared` (no reimplementar foco por pantalla)

## Referencia de código

Plantilla viva (código completo de ejemplo): carpeta `CLEAN ARCHITECTURE/` (ignorada por git; solo consulta local).
