# Buscador de Productos — qué se creó y cómo funciona

Este documento explica, en simple, todo lo que se agregó al backend para tener el
buscador de productos (tu `sp_ListarProducto_Auto` del sistema viejo).

## Resumen corto

Se **crearon 6 archivos** (4 backend + 2 frontend) y **se modificaron 2** (frontend).
Ningún archivo backend existente fue modificado.

El endpoint nuevo es:

```
GET /api/productos/autocomplete?busqueda=algo&estado=A
```

Ejemplos de llamada:
- `GET /api/productos/autocomplete?busqueda=coca` → busca "coca" en código o descripción.
- `GET /api/productos/autocomplete?busqueda=coca&estado=A` → igual, solo productos activos.
- `GET /api/productos/autocomplete` → devuelve los primeros 30 productos.

---

## BACKEND (corp-backend) — 4 archivos creados, 0 modificados

```
corp-backend/src/Alices/
├── Alices.Application/
│   └── Productos/
│       └── ListarProductoAuto/
│           ├── ListarProductoAutoQuery.cs         (1. la "petición")
│           ├── ListarProductoAutoQueryHandler.cs  (2. el que llama al SP)
│           └── ProductoAutoResponse.cs            (3. la "respuesta" para Angular)
└── Alices.API/
    └── Controllers/
        └── Productos/
            └── ProductosController.cs             (4. el endpoint HTTP)
```

---

## FRONTEND (corp-frontend) — 2 archivos creados, 2 modificados

```
corp-frontend/src/app/
├── features/almacenes/
│   ├── data-access/                                    ← carpeta NUEVA
│   │   ├── productos-api.service.ts                    (5. servicio HTTP)
│   │   └── productos.models.ts                         (6. modelo de datos)
│   └── ui/productos/
│       ├── productos.component.ts                      (modificado)
│       └── productos.component.html                    (modificado)
```

- `productos-api.service.ts` → llama a `GET /api/productos/autocomplete?busqueda=...&estado=...`.
- `productos.models.ts` → la forma de un resultado: `idProducto`, `codigoProducto`, `descripcion`, `estado`.
- `productos.component.ts` → el botón **Buscar** ya no llena el formulario con el texto escrito:
  ahora consulta al backend, guarda los resultados y abre el dropdown.
- `productos.component.html` → debajo del input de búsqueda aparece un **dropdown de
  autocompletado** con hasta 30 productos (código + descripción + etiqueta INACTIVO).

### Comportamiento del buscador

- **Búsqueda en vivo**: mientras escribes el código o nombre del producto, cada pausa de
  ~300 ms dispara la consulta automáticamente y las coincidencias van apareciendo en el
  dropdown, sin necesidad de tocar el botón.
- El selector **Estado** también re-dispara la búsqueda en vivo:
  `Todos` → sin filtro, `Activo` → `A`, `Inactivo` → `I` (valores que entiende tu SP).
- **Botón "Buscar"**: por ahora **no hace nada** (sin acción). Las coincidencias salen solas al escribir.
- **Flechas ↑/↓** → navegar entre resultados; **Enter** → seleccionar el resaltado.
- **Escape o F2** → cerrar el dropdown (F2 es la tecla reservada del sistema).
- **Clic en un resultado** → rellena el formulario (código, nombre técnico y estado del producto).
  Cuando exista el endpoint de detalle, aquí se llamará.
- **Clic fuera del buscador** → cierra el dropdown.
- Si la consulta falla, el dropdown muestra **"Error al buscar productos"** en rojo (nada falla en silencio).

---

## Qué hace cada uno (comparado con tu sistema viejo)

### 1. `ListarProductoAutoQuery.cs` — "la petición"

Antes, tu controller recibía `(busqueda, estado)` por parámetro.
Ahora esos dos valores viajan dentro de un objeto **Query**:

```csharp
public sealed record ListarProductoAutoQuery(string? Busqueda, string? Estado)
    : IQuery<IReadOnlyList<ProductoAutoResponse>>;
```

Solo es un "sobre" que lleva los datos de entrada hasta el handler.

### 2. `ListarProductoAutoQueryHandler.cs` — "tu DA viejo"

Es el reemplazo de `_daProductoRelacionado.ListarProducto_Auto(busqueda, estado)`.
Hace exactamente lo mismo que hacía tu DA:

1. Abre conexión (pero con la fábrica que ya existe en el proyecto, `ISqlConnectionFactory`).
2. Arma los parámetros `@busqueda` y `@estado` indicando el tipo (`varchar`), así el null
   se manda como NULL a SQL Server sin romper Dapper.
3. Ejecuta `dbo.sp_ListarProducto_Auto` con `CommandType.StoredProcedure`.
4. Mapea cada fila a una respuesta limpia.

> **Corrección importante**: la primera versión usaba `request.Estado ?? DBNull.Value`
> (como tu DA viejo), pero Dapper lanza `NotSupportedException: The member estado of
> type System.DBNull cannot be used as a parameter value` porque `DynamicParameters`
> necesita un tipo CLR real. La solución fue pasar el string `null` con
> `DbType.AnsiString` (varchar) y tamaño explícito:
>
> ```csharp
> parameters.Add("@busqueda", request.Busqueda, DbType.AnsiString, ParameterDirection.Input, 100);
> parameters.Add("@estado", request.Estado, DbType.AnsiString, ParameterDirection.Input, 20);
> ```

Detalle importante — hay **dos** modelos dentro de este archivo:
- `ProductoAutoRow` (privado): tiene los nombres de las columnas tal cual las devuelve el SP
  (`ID_PRODUCTO`, `COD_PRODUCTO`, `DESC_PRODUCTO`, `ESTADO`). Dapper necesita que el
  nombre de la propiedad coincida con la columna de la BD.
- Después se convierte a `ProductoAutoResponse` (público) con nombres bonitos en
  PascalCase (`IdProducto`, `CodigoProducto`, `Descripcion`, `Estado`).

### 3. `ProductoAutoResponse.cs` — "tu modelo ProductoDetalle"

Es lo que recibe el frontend (Angular). Solo los 4 campos que devuelve el SP:

```csharp
public sealed class ProductoAutoResponse
{
    public required int IdProducto { get; init; }
    public string? CodigoProducto { get; init; }
    public string? Descripcion { get; init; }
    public string? Estado { get; init; }
}
```

Nota: en tu sistema viejo, `ProductoDetalle` tenía muchos más campos (Clase, Familia,
etc.), pero este SP **solo devuelve 4 columnas**, así que la respuesta solo trae 4 campos.
Si más adelante necesitas esos objetos anidados, se agregan a este DTO cuando el SP los devuelva.

### 4. `ProductosController.cs` — "el endpoint"

Reemplaza a tu controller viejo. La diferencia clave: **ya no toca el DA directamente**.
Solo le dice a MediatR "ejecuta esto" con `_sender.Send(...)` y convierte el resultado en HTTP:

```csharp
[HttpGet("autocomplete")]
[AllowAnonymous]   // por ahora sin login, como Tiendas
public async Task<IActionResult> ListarAuto(...)
{
    var result = await _sender.Send(new ListarProductoAutoQuery(busqueda, estado), ct);
    return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
}
```

- Éxito → `200 OK` con la lista de productos.
- Error → `400 Bad Request` con el motivo.

---

## Cómo viaja una petición (de principio a fin)

```
Angular (input de buscar producto)
  ↓  GET /api/productos/autocomplete?busqueda=...&estado=...
ProductosController
  ↓  _sender.Send(new ListarProductoAutoQuery(...))
MediatR (busca solo el handler que corresponde)
  ↓
ListarProductoAutoQueryHandler
  ↓  Dapper: EXEC dbo.sp_ListarProducto_Auto @busqueda, @estado
Tu SP de siempre (SQL Server)
  ↓  devuelve ID_PRODUCTO, COD_PRODUCTO, DESC_PRODUCTO, ESTADO
Handler convierte a ProductoAutoResponse (PascalCase)
  ↓  Result.Success(lista)
ProductosController → 200 OK con la lista JSON
  ↓
Angular muestra los resultados en el input
```

---

## Por qué no se tocó nada más (backend)

- **Domain** — no se tocó porque esto es una *lectura* pura (solo mostrar productos).
  El agregado `Producto` solo se necesitaría si hubiera escrituras (crear/editar).
- **Infrastructure / DI** — no se tocó porque `ISqlConnectionFactory` ya estaba
  registrado y MediatR encuentra los handlers solos (auto-discovery).
- **Migraciones EF** — no aplica, no se creó ninguna tabla.

---

## Datos útiles para el frontend

- La URL desde Angular (con el proxy dev) es: `/api/productos/autocomplete`.
- Respuesta: un **array** de objetos:
  ```json
  [
    { "idProducto": 123, "codigoProducto": "COD01", "descripcion": "Producto X", "estado": "A" }
  ]
  ```
- Los nombres llegan en `camelCase` (igual que los DTOs del resto del proyecto).
- El servicio del frontend está en `features/almacenes/data-access/productos-api.service.ts`
  (mismo patrón que `tienda-api.service.ts` de autenticación).

---

## Notas de la compilación

- **Backend**: compilación exitosa (`0 errores`). El primer intento falló solo porque la API
  estaba corriendo en otra terminal (archivos bloqueados), no por el código.
- **Frontend**: `npm run build` exitoso, sin errores.
- Quedó una advertencia de seguridad en backend (`NU1903`, paquete `Microsoft.OpenApi` 2.0.0)
  que ya existía antes de este cambio.
- Ojo: el archivo `Alices.slnx` está **vacío** (no referencia proyectos), por eso
  `dotnet build Alices.slnx` no compila nada. Hay que compilar el proyecto API directamente:
  `dotnet build src\Alices\Alices.API\Alices.API.csproj` (o agregar los proyectos al slnx).
