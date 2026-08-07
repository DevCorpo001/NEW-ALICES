# ALICES — Guía de Clean Architecture (contrato de desarrollo)

Documento de referencia obligatoria para todo desarrollo en `corp-backend`.
Basado en el proyecto de referencia `CLEAN ARCHITECTURE/`.
Cualquier feature, fix o refactor **debe** respetar esta estructura y estos patrones.

Target: **.NET 10** (`net10.0`). Alinear paquetes NuGet a majors estables de net10 (EF Core 10.x, Npgsql 10.x, etc.).

---

## 0. Solución y capas

```
Alices.slnx
src/Alices/
  Alices.Domain            ← sin referencias a proyectos (solo MediatR.Contracts)
  Alices.Application       ← referencia a Domain
  Alices.Infrastructure    ← referencia a Application
  Alices.API               ← referencia a Application + Infrastructure (composition root)
```

### Regla de dependencias (estricta)

```
API ──► Application ──► Domain
 │            ▲
 └─► Infrastructure (implementa contratos de Domain/Application)
```

- Domain **no conoce** Application, Infrastructure ni API.
- Application **no conoce** Infrastructure ni API.
- Infrastructure implementa interfaces definidas en Domain/Application.
- API solo orquesta: registra DI, mapea HTTP → MediatR, no contiene lógica de negocio.

### Prohibido

- Inyectar `DbContext` / EF en Application o Domain.
- Usar entidades de dominio como DTO de respuesta HTTP.
- Llamar repositorios desde controllers (usar `ISender`).
- `DateTime.UtcNow` / `DateTime.Now` dentro de Domain (inyectar tiempo como parámetro o vía `IDateTimeProvider` en Application).
- Excepciones para reglas de negocio (usar `Result` / `Result<T>`).
- Queries con EF sobre agregados para lecturas (usar Dapper + SQL).
- Repositorio genérico `IRepository<T>` — solo interfaces específicas por agregado.

---

## 1. Stack

| Componente | Librería | Capa |
|---|---|---|
| Runtime | .NET 10 (`net10.0`) | todos |
| Mensajería (CQRS) | MediatR (+ MediatR.Contracts en Domain) | Application / Domain |
| Validación | FluentValidation (+ DI extensions) | Application |
| ORM (escritura) | EF Core + Npgsql | Infrastructure |
| Naming DB | EFCore.NamingConventions (`UseSnakeCaseNamingConvention`) | Infrastructure |
| Lecturas | Dapper vía `ISqlConnectionFactory` | Application (handlers) / Infrastructure (factory) |
| Logging | Microsoft.Extensions.Logging.Abstractions | Application (behaviors) |
| Auth (cuando aplique) | JwtBearer | API / Infrastructure |

Connection string key: `ConnectionStrings:Database`.

---

## 2. Domain

### Estructura de carpetas

```
Domain/
  Abstractions/           # Entity, Result, Result<T>, Error, IDomainEvent, IUnitOfWork
  Shared/                 # VOs compartidos (Moneda, TipoMoneda, …)
  <Agregado>/             # ej: Users/, Vehiculos/, Alquileres/
    <Raiz>.cs             # sealed class : Entity
    <Raiz>Errors.cs       # static Error fields
    <ValueObjects>.cs     # records (uno por archivo)
    <Enums>.cs
    I<Raiz>Repository.cs
    Events/               # records : IDomainEvent
    <ServicioDeDominio>.cs  # concreto, sin interfaz (ej. PrecioService)
```

Idioma del dominio: **español** (agregados, propiedades, errores, mensajes).

### 2.1 Abstractions (base reutilizable)

- `Entity`: `Guid Id { get; init; }`, ctor `protected Entity(Guid id)`, lista privada de `IDomainEvent`, `GetDomainEvents()`, `ClearDomainEvents()`, `protected RaiseDomainEvent(...)`.
- `IDomainEvent : INotification` (MediatR.Contracts).
- `Error(string Code, string Name)` — `Code` formato `"Agregado.NombreError"`.
- `Result` / `Result<T>`: factories `Success`, `Failure`, `Create`; conversión implícita `TValue → Result<TValue>`.
- `IUnitOfWork { Task<int> SaveChangesAsync(CancellationToken); }`.

### 2.2 Agregados (raíces)

```csharp
public sealed class X : Entity
{
    private X() { } // EF

    private X(Guid id, ...) : base(id) { ... }

    // props: { get; private set; }

    public static X Create(...) // o nombre de negocio: Reservar, Registrar, ...
    {
        var entity = new X(Guid.NewGuid(), ...);
        entity.RaiseDomainEvent(new XCreatedDomainEvent(entity.Id));
        return entity;
    }

    public Result Confirmar(DateTime utcNow)
    {
        if (Status != ...) return Result.Failure(XErrors.InvalidState);
        Status = ...;
        RaiseDomainEvent(...);
        return Result.Success();
    }
}
```

Reglas:
- Constructor **privado** + factory estático.
- Mutación solo por métodos del agregado.
- Tiempo siempre como parámetro (`DateTime utcNow`), nunca `DateTime.UtcNow` en Domain.
- Servicios de dominio se pasan como parámetro al factory/método cuando hace falta.

### 2.3 Value objects

- Simples: `public record Nombre(string Value);`
- Multipropiedad: `public record Direccion(string Pais, ...);`
- Con validación: ctor privado + `static Result<T> Create(...)`.
- Con comportamiento: operadores, `Zero()`, `IsZero()` (ej. `Moneda`).
- Enumeration-like: record con instancias estáticas + `FromCodigo(...)`.

### 2.4 Errores y repositorios

```csharp
public static class AlquilerErrors
{
    public static Error NotFound = new("Alquiler.NotFound", "El alquiler no existe");
    public static Error Overlap = new("Alquiler.Overlap", "Ya existe un alquiler en esas fechas");
}
```

```csharp
public interface IAlquilerRepository
{
    Task<Alquiler?> GetByIdAsync(Guid id, CancellationToken ct = default);
    void Add(Alquiler alquiler);
    Task<bool> IsOverlappingAsync(Vehiculo v, DateRange d, CancellationToken ct = default);
}
```

Sin genéricos. Solo métodos que el dominio necesita.

---

## 3. Application

### Estructura

```
Application/
  Abstractions/
    Behaviors/       # LoggingBehavior, ValidationBehavior
    Clock/           # IDateTimeProvider
    Data/            # ISqlConnectionFactory
    Email/           # IEmailService
    Messaging/       # ICommand, ICommand<T>, IQuery<T>, handlers, IBaseCommand
  Exceptions/        # ValidationException, ValidationError, ConcurrencyException
  <Agregado>/<CasoDeUso>/
    <Caso>Command.cs | <Caso>Query.cs
    <Caso>CommandHandler.cs | <Caso>QueryHandler.cs
    <Caso>CommandValidator.cs          # solo commands
    <Caso>Response.cs                  # solo queries
    <...>DomainEventHandler.cs         # opcional
  DependencyInjection.cs
```

### 3.1 Mensajería (CQRS + MediatR)

```csharp
public interface ICommand : IRequest<Result>, IBaseCommand { }
public interface ICommand<TResponse> : IRequest<Result<TResponse>>, IBaseCommand { }
public interface IQuery<TResponse> : IRequest<Result<TResponse>> { }
public interface IBaseCommand { } // marcador para behaviors
```

Handlers: `ICommandHandler<TCommand[, TResponse]>`, `IQueryHandler<TQuery, TResponse>` envuelven `IRequestHandler` de MediatR.

### 3.2 Command (escritura) — patrón completo

1. **Command**: `public record ReservarXCommand(...) : ICommand<Guid>;`
2. **Validator**: `AbstractValidator<ReservarXCommand>` (auto-discovery).
3. **Handler** `internal sealed`:
   - Buscar dependencias por repositorio → si null, `Result.Failure(...Errors.NotFound)`
   - Crear VOs / validar reglas
   - Factory del agregado
   - `_repository.Add` + `await _unitOfWork.SaveChangesAsync(ct)`
   - `return agregado.Id;` (implícito a `Result<Guid>`)
   - Siempre propagar `CancellationToken`
4. **DomainEventHandler** (opcional): `INotificationHandler<XDomainEvent>` para side-effects (email, etc.).

### 3.3 Query (lectura) — patrón completo

1. **Query**: `public sealed record GetXQuery(Guid Id) : IQuery<XResponse>;`
2. **Response**: DTO plano `{ get; init; }` — **no** entidades ni VOs de dominio.
3. **Handler** `internal sealed` con `ISqlConnectionFactory` + **Dapper SQL crudo**:
   - Columnas snake_case aliaseadas a props del response
   - Tablas plural snake_case
   - Parámetros con objeto anónimo
   - Nunca EF en queries

### 3.4 Behaviors

- `LoggingBehavior<TRequest,TResponse> where TRequest : IBaseCommand`
- `ValidationBehavior<...> where TRequest : IBaseCommand` — si hay errores, lanza `ValidationException` (no Result)
- Orden de registro: Logging primero, Validation después

### 3.5 DependencyInjection (Application)

```csharp
services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
    cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});
services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
services.AddTransient<PrecioService>(); // domain services concretos: MANUAL
```

---

## 4. Infrastructure

### Estructura

```
Infrastructure/
  ApplicationDbContext.cs
  DependencyInjection.cs
  Configurations/          # IEntityTypeConfiguration por entidad
  Repositories/
  Clock/DateTimeProvider.cs
  Email/EmailService.cs
  Data/SqlConnectionFactory.cs
  Data/DateOnlyTypeHandler.cs  # si se usa DateOnly con Dapper
```

### 4.1 ApplicationDbContext

- `sealed class ApplicationDbContext : DbContext, IUnitOfWork`
- `ApplyConfigurationsFromAssembly`
- Override `SaveChangesAsync`:
  1. `base.SaveChangesAsync`
  2. Recolectar `GetDomainEvents()` de `ChangeTracker.Entries<Entity>()`
  3. `ClearDomainEvents()`
  4. `IPublisher.Publish` cada evento
  5. Mapear `DbUpdateConcurrencyException` → `ConcurrencyException`

### 4.2 DependencyInjection (Infrastructure)

```csharp
services.AddTransient<IDateTimeProvider, DateTimeProvider>();
services.AddTransient<IEmailService, EmailService>();

var cs = configuration.GetConnectionString("Database")
    ?? throw new ArgumentNullException(nameof(configuration));

services.AddDbContext<ApplicationDbContext>(o =>
    o.UseNpgsql(cs).UseSnakeCaseNamingConvention());

services.AddScoped<IUserRepository, UserRepository>();
// ... un registro por repositorio

services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
services.AddSingleton<ISqlConnectionFactory>(_ => new SqlConnectionFactory(cs));
```

### 4.3 Configuraciones EF

- `ToTable("nombre_plural_snake_case")` + `HasKey`
- VO simple → `HasConversion(vo => vo.Value, v => new VO(v))`
- VO compuesto → `OwnsOne`
- `Moneda` → `OwnsOne` + conversión de `TipoMoneda`
- Relaciones: `HasOne<Otro>().WithMany().HasForeignKey(...)` sin navegación inversa
- Índices únicos donde aplique

---

## 5. API (composition root)

### Estructura

```
API/
  Controllers/<Agregado>/
  Extensions/              # migrations, seed, exception middleware
  Middleware/
  Program.cs
  appsettings.json
```

### Reglas del controller

```csharp
[ApiController]
[Route("api/alquileres")]
public class AlquileresController : ControllerBase
{
    private readonly ISender _sender;

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var result = await _sender.Send(new GetAlquilerQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Reservar(Request body, CancellationToken ct)
    {
        var result = await _sender.Send(new ReservarAlquilerCommand(...), ct);
        if (result.IsFailure) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Get), new { id = result.Value }, result.Value);
    }
}
```

- Solo `ISender` (MediatR). Nunca repos, DbContext ni servicios de dominio.
- Mapear `Result` → HTTP status.
- CORS para Angular (`http://localhost:4200`) en desarrollo.
- `Program.cs`: `AddApplication()` + `AddInfrastructure(config)` + middleware de excepciones.

---

## 6. Flujo de una petición (referencia mental)

```
HTTP → Controller
  → ISender.Send(Command|Query)
  → Pipeline: LoggingBehavior → ValidationBehavior
  → Handler
       [Command] repos → factory dominio → Add → UnitOfWork.SaveChanges
                    → DbContext publica DomainEvents
                    → INotificationHandler (side-effects)
       [Query]   ISqlConnectionFactory → Dapper SQL → Response DTO
  → Controller mapea Result → IActionResult
```

---

## 7. Checklist por caso de uso nuevo

- [ ] Command/Query record en `Application/<Agregado>/<CasoDeUso>/`
- [ ] Handler `internal sealed` devolviendo `Result` / `Result<T>`
- [ ] Validator (solo commands) — auto-discovery, no registrar a mano
- [ ] Response DTO (solo queries) + SQL snake_case aliaseado
- [ ] Errores nuevos en `<Agregado>Errors` si hacen falta
- [ ] Domain event + `INotificationHandler` si hay efecto secundario
- [ ] Endpoint en API solo con `ISender`
- [ ] No romper dirección de dependencias

## 8. Checklist por agregado nuevo

- [ ] Raíz `sealed class : Entity`, ctor privado + factory estático que emite evento
- [ ] VOs como records; con validación → `Create` → `Result<T>`
- [ ] `<Agregado>Errors` estático
- [ ] `I<Agregado>Repository` mínimo en Domain
- [ ] Implementación del repo en Infrastructure
- [ ] `Configuration` EF (tabla snake_case, OwnsOne/HasConversion, FKs)
- [ ] Registrar repo + domain services en DI
- [ ] Casos de uso Application (command/query según necesidad)

---

## 9. Orden de construcción (proyecto / feature grande)

1. Domain/Abstractions (si aún no existen)
2. Agregado completo (raíz + VOs + errors + repo interface + events)
3. Application/Abstractions (messaging, behaviors, clock, data, email) + DI
4. Command (+ validator) y/o Query (+ response + SQL)
5. Infrastructure: DbContext, configs, repos, factory, DI
6. Migraciones EF (`dotnet ef migrations add ... -p Infrastructure -s API`)
7. Endpoint API + pruebas manuales/Swagger

---

## 10. Convenciones de código

| Tema | Convención |
|---|---|
| Handlers | `internal sealed class` |
| Agregados | `public sealed class` |
| Commands/Queries | `record` |
| Responses | `sealed class` o `record` con `{ get; init; }` |
| Errores | `static` class por agregado |
| Tablas/columnas DB | snake_case plural |
| Idioma dominio | español |
| Idioma código infra/API | inglés técnico OK (nombres de framework), dominio en español |
| Nullability | habilitada; evitar nulls con VOs y Result |

---

## 11. Frontend (corp-frontend) — acoplamiento

- Angular llama solo a la API (`/api/...`).
- Dev: proxy `proxy.conf.json` → backend.
- `provideHttpClient()` en `app.config.ts`.
- Servicios Angular por feature; no lógica de negocio del dominio en el front.
- Contratos HTTP alineados a Response DTOs de Application (no a entidades).

---

## 12. Recordatorio operativo para el agente

Al implementar **cualquier** pedido en este repo:

1. Leer este archivo si hay duda de estructura o patrón.
2. Colocar código en la capa correcta.
3. Respetar Factory + Result + eventos en Domain.
4. Usar MediatR (Command/Query) en Application; nunca saltarse el mediator desde API.
5. Escrituras con EF + UnitOfWork; lecturas con Dapper.
6. No inventar atajos que rompan Clean Architecture “por rapidez”.
7. Si el caso de uso no encaja, proponer extensión del patrón — no un bypass.
