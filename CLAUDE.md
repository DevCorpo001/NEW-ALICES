# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with two independent projects plus a reference template:

- `corp-backend/` — .NET 10 API (Clean Architecture), solution file `Alices.slnx`
- `corp-frontend/` — Angular 22 standalone SPA
- `CLEAN ARCHITECTURE/` — a **living reference template** with a complete example implementation of the same Clean Architecture pattern used in `corp-backend`. It is gitignored (local-only). Consult it when unsure how a pattern should look in practice — do not treat it as part of the shipped product.

There is no root build tool tying the two projects together; work inside `corp-backend/` or `corp-frontend/` per task.

## ⚠️ Committed secrets

`corp-backend/src/Alices/Alices.API/appsettings.json` is tracked in git and currently contains a **live** SQL Server connection string (host, user, password) and a JWT signing secret. Only `appsettings.*.Local.json` is gitignored — `appsettings.json` and `appsettings.Development.json` are not. Do not add further real secrets to tracked appsettings files; if asked to rotate/clean this up, flag it explicitly rather than silently committing new secrets alongside it.

## Backend (`corp-backend`) — commands

Run from `corp-backend/`:

```bash
dotnet build Alices.slnx
dotnet run --project src/Alices/Alices.API
dotnet ef migrations add <Name> -p src/Alices/Alices.Infrastructure -s src/Alices/Alices.API
dotnet ef database update -p src/Alices/Alices.Infrastructure -s src/Alices/Alices.API
```

No test project exists yet in `corp-backend`. SDK pinned via `global.json` to .NET `10.0.302`.

On `Development`, `Program.cs` auto-applies EF migrations and runs an idempotent seed (`Extensions/DatabaseExtensions.cs`, `Extensions/SeedDataExtensions.cs`) at startup — no manual step needed for local dev after `dotnet run`.

## Frontend (`corp-frontend`) — commands

Run from `corp-frontend/`:

```bash
npm start          # ng serve, http://localhost:4200
npm run build       # ng build
npm test            # ng test (Vitest)
npm run watch        # ng build --watch --configuration development
```

Dev server proxies `/api/*` to the backend via `proxy.conf.json`.

## Backend architecture (`corp-backend`)

Strict Clean Architecture — full contract lives in `corp-backend/ARCHITECTURE.md`; read it before non-trivial backend work. Key points an agent must not violate:

- **Layers and dependency direction**: `Alices.Domain` ← `Alices.Application` ← `Alices.Infrastructure`, with `Alices.API` as composition root referencing Application + Infrastructure. Domain knows nothing about the other layers; Application knows nothing about Infrastructure/API.
- **CQRS via MediatR**: commands mutate through `ICommand`/`ICommand<T>` + handlers; queries read through `IQuery<T>` + handlers. Controllers depend **only** on `ISender` — never inject a repository, `DbContext`, or domain service into a controller.
- **Writes vs. reads are different code paths**: writes go through EF Core aggregates + `IUnitOfWork.SaveChangesAsync`; reads go through Dapper + raw SQL via `ISqlConnectionFactory` (never EF for queries). Response DTOs for queries are plain classes/records — never domain entities or value objects.
- **Domain layer conventions**: aggregates are `sealed class : Entity` with a private constructor and a static factory method that raises a domain event; mutation only through aggregate methods returning `Result`/`Result<T>` (no exceptions for business rules); no generic `IRepository<T>`, only per-aggregate interfaces; no `DateTime.UtcNow`/`.Now` inside Domain — time is always passed in.
- **Domain language is Spanish** (aggregate names, properties, error codes/messages, e.g. `AlquilerErrors.NotFound`). Infrastructure/API technical naming can stay in English.
- **DB naming**: snake_case, plural table names (`EFCore.NamingConventions` + Dapper column aliases), connection string key `ConnectionStrings:Database`.
- **Auth**: JWT is issued by Infrastructure/API and delivered via an HttpOnly cookie (`access_token`); it is never exposed to JS. Auth contracts (`IPasswordHasher`, `IJwtTokenGenerator`) live in `Application/Abstractions/Authentication/`, implementations in `Infrastructure/Authentication/`. Public auth endpoints must be explicitly `[AllowAnonymous]`.
- **Request flow**: `HTTP → Controller → ISender.Send → LoggingBehavior → ValidationBehavior → Handler → (EF+UnitOfWork | Dapper) → Result → Controller maps Result to IActionResult`.

When adding a new use case or aggregate, follow the checklists in `corp-backend/ARCHITECTURE.md` §7–9 rather than improvising a shortcut.

## Frontend architecture (`corp-frontend`)

Two documents plus a skill are **mandatory** reading before frontend work — see `corp-frontend/ARCHITECTURE.md` and `corp-frontend/FRONTEND.md`. Before creating/editing any component, service, store, or screen, load the `pos-frontend` skill (`.opencode/skills/pos-frontend/SKILL.md`) via the Skill tool.

- **Stack**: Angular standalone components (no NgModules without explicit justification), Signals for local/transversal state, Reactive Forms, Tailwind CSS (+ Spartan/ng for complex interactive components — don't hand-roll dropdowns/modals/comboboxes/datepickers it already provides), strict TypeScript (no `any` to paper over incomplete contracts).
- **Layering**: `features/<feature>/ui` → `features/<feature>/data-access` → `core`/`shared` → `HttpClient` → API.
  - `ui/` is presentation only: receives data via `@Input()`, emits events, no direct HTTP.
  - `data-access/` holds DTOs, HTTP services, and feature stores.
  - `core/` is transversal singletons (auth, interceptors, guards) and must not depend on features.
  - `shared/` is reusable, business-logic-free components/pipes/directives.
  - `layout/` is shell/sidebar/topbar only, no feature-specific HTTP calls.
  - **Features never import each other** — shared code goes in `shared`/`core`.
- **HTTP**: relative `/api/...` paths, `provideHttpClient()`, dev proxy to backend. DTOs in `data-access` mirror the API's Response DTOs, never backend domain entities.
- **Auth session**: cookie-based (`access_token`, HttpOnly). Angular never reads/stores the JWT itself (no `localStorage`/`sessionStorage`/template-accessible variable). Session flow: `POST /api/autenticacion/login`, `GET /api/autenticacion/me` to restore on reload, `POST /api/autenticacion/logout`. `/login` is public; other routes use `authGuard`.
- **Routing**: each feature exposes `feature-<feature>.routes.ts`; `app.routes.ts` only composes public routes, layout, and features; lazy-load where it's justified.
- **Mandatory keyboard UX** (`corp-frontend/FRONTEND.md`): every capture/filter view must be usable without a mouse. First interactive control autofocuses on load; Enter in a field moves to the next focusable control in the container; Enter on the last control triggers the primary button (submit/search/save); Enter in a `textarea` inserts a newline instead. Implement this via the shared reusable directive in `core`/`shared` (e.g. `appEnterNavigate` + `appEnterPrimary`) — do not reimplement per-screen focus handling.
- **Naming**: files `kebab-case`, classes `PascalCase`; HTTP/data-access services end in `.service.ts`, stores in `.store.ts`. Split a component once it passes ~200 lines of template/logic.
- **Forbidden**: storing the JWT anywhere JS-accessible; calling `HttpClient` from presentation (`ui/`) components; importing one feature from another; rebuilding a component Spartan/ng already provides; global CSS or colors outside the defined Tailwind tokens; using frontend permission checks as the sole authorization defense (backend must enforce it too).

## Cross-cutting

`AGENTS.md` at the repo root is the top-level pointer into both architecture contracts above — if instructions here and in the deeper `ARCHITECTURE.md`/`FRONTEND.md` files ever diverge, the deeper, more specific document wins for its own layer.


# When done

When the task is completed, respond with: "Listo precioso!!!"
