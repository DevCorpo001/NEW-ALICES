# Autenticación — estado actual, cambios aplicados y criterios de diseño

Documento de trabajo sobre la migración del login legacy a Clean Architecture.
Complementa `ARCHITECTURE.md`; si algo diverge, para autenticación manda este archivo.

---

## 1. Qué se cambió

### Correcciones de seguridad y defectos

| Cambio | Antes | Ahora |
|---|---|---|
| DTO del handler | Traía la columna `CLAVE` (contraseña en claro) desde el SP y nunca la usaba | La propiedad se eliminó |
| `/me` | Devolvía `RutaVista = null` fijo, pese a que el claim `ruta_vista` sí existe | Lee el claim; el front ya no pierde la ruta al recargar |
| Cookie de sesión | `Secure = Request.IsHttps` → tras un proxy que termina TLS, la cookie salía **sin** flag `Secure` | `Auth:Cookie:Secure` / `Auth:Cookie:SameSite` por configuración + `UseForwardedHeaders` |
| `/login` | Endpoint anónimo sin ningún freno | Rate limiting: 5 intentos/minuto por IP → 429 |
| `Jwt:Secret` | Leído por separado en `Program.cs` y en `JwtTokenGenerator` | `JwtOptions` + `IOptions<T>` + `ValidateOnStart()` (falla al arranque si falta o es corto) |
| Intentos fallidos | Sin ninguna traza | `ILogger` registra usuario, IP y tienda |
| Secretos | Connection string real y `Jwt:Secret` en `appsettings.json` **comiteado** | Movidos a `appsettings.Development.Local.json` (gitignoreado) |

> ⚠️ Mover el secreto de archivo **no lo rota**. La contraseña de SQL Server sigue viva en el
> historial de git. Rotarla en el servidor es una tarea pendiente aparte.

### Limpieza estructural

Se eliminó el **padrón de usuarios fantasma**: `Usuario`, `Rol`, sus value objects,
`IUsuarioRepository`/`UsuarioRepository`, las configuraciones EF y el seed del admin BCrypt.

El motivo: la migración EF de ALICES había creado tablas `usuarios`/`roles` (PK `Guid`,
snake_case) **dentro de la misma base** donde el legacy tiene `Usuario`/`Rol`/`Vistas`
(PK `tinyint`). El login autenticaba contra las legacy; el seed escribía en las nuevas. El
admin sembrado con BCrypt **nunca pudo loguearse**. Eran dos directorios de identidad
paralelos destinados a divergir.

Migración `EliminarPadronUsuariosFantasma` escrita, **no aplicada a la base de datos**.

### Nuevo en el dominio

- `PoliticaAccesoUsuario` — servicio de dominio con la regla de horario + estado activo.
- `UsuarioErrors.FueraDeHorario`.
- `IDateTimeProvider.HoraLocal` (antes solo `UtcNow`).

### Preparado, no desplegado

- `sql/sp_Alices_ValidarCredenciales.sql` — el SP nuevo de solo lectura.
- La migración EF que borra `usuarios`/`roles`.

**Nada de esto se ejecutó contra la base de datos real.**

---

## 2. ¿La lógica va en base de datos o en C#?

Esta es la pregunta central, y la respuesta no es "siempre C#".

### El criterio real

No se decide por gusto ni por rendimiento. Se decide preguntando:

> **Si esta regla cambia, ¿quién se entera y cómo pruebo que sigue funcionando?**

| | Regla en stored procedure | Regla en el dominio (C#) |
|---|---|---|
| Historial de cambios | Ninguno (salvo que versiones scripts) | Git, con autor y motivo |
| Revisión | Nadie la revisa | Pull request |
| Pruebas | Requiere una base de datos | Test unitario, sin BD ni mocks |
| Despliegue | Separado de la app; pueden desincronizarse | Atómico con la app |
| Quién puede cambiarla | Cualquiera con acceso a SQL | Quien pase el PR |
| Descubribilidad | Hay que saber que existe | Aparece al leer el caso de uso |

### El ejemplo concreto de este proyecto

```sql
(
    r.DESC_ROL = 'ADMINISTRADOR' OR
    R.DESC_ROL = 'COMPRAS' OR
    (CAST(GETDATE() AS time) BETWEEN '08:50:00' AND '23:59:00')
)
```

Una regla de negocio real —*quién puede trabajar de madrugada*— enterrada en un SP. Y con
tres problemas que solo se ven al sacarla a la luz:

1. Compara contra `DESC_ROL`, el **nombre visible** del rol. Renombrar "COMPRAS" a
   "Compras y Almacén" cambia el comportamiento de autenticación en silencio.
2. Tiene un bug de borde: `BETWEEN '08:50:00' AND '23:59:00'` deja fuera 23:59:01–23:59:59.
3. Usa `GETDATE()`, la hora local del servidor SQL — invisible, no configurable, no testeable.

Ninguno de los tres se habría detectado nunca sin sacarla del SQL.

### La regla práctica

**SQL responde "¿qué datos hay?". El dominio responde "¿qué hacemos con ellos?".**

| Va en SQL | Va en el dominio |
|---|---|
| Buscar, filtrar, unir, agregar | Decidir si algo se permite o se rechaza |
| Proyecciones de lectura (Dapper) | Invariantes y validaciones de negocio |
| Operaciones masivas donde mover datos sería absurdo | Cálculos con significado de negocio |
| El límite de integración con un sistema legacy | Cualquier cosa que le explicarías a alguien de negocio |

Nota importante: `ARCHITECTURE.md` ya manda usar **Dapper + SQL crudo para todas las
lecturas**. SQL no está prohibido — lo que no debe vivir en SQL es la *decisión*.

### Cómo queda el SP legacy descompuesto

`sp_Login_LogeoUsuarios` hace cuatro trabajos mezclados. Solo uno es de SQL:

| Trabajo | Destino |
|---|---|
| Buscar el usuario por nombre | **SQL** — es exactamente para lo que sirve |
| Comparar la credencial | Infrastructure (`IPasswordHasher`) — hoy sigue en SQL por el texto plano |
| Estado activo + ventana horaria | **Dominio** — `PoliticaAccesoUsuario` |
| `INSERT INTO INGRESO_SESION` | Application, vía evento de dominio |

---

## 3. Cómo trabajar DDD en este proyecto

### La lección más importante de lo que encontré

El agregado `Usuario` estaba construido *correctamente según el manual*: `sealed class :
Entity`, constructor privado, factory estático, value objects, repositorio específico. Y aun
así **estaba mal**, porque no correspondía a nada real: los usuarios de verdad viven en la
tabla legacy que otro sistema escribe.

> **DDD modela lo que existe, no lo que la plantilla dice que debería existir.**

Copiar las formas del template sin que haya un dominio detrás produce código que compila,
parece profesional y no sirve para nada. Eso es lo que pasó aquí.

### Antes de crear un agregado, tres preguntas

**1. ¿ALICES es dueño de estos datos?**

Si otro sistema los escribe, **no puede haber agregado**. Un agregado garantiza invariantes;
no puedes garantizar nada sobre una tabla que otro proceso modifica a tus espaldas.

→ Durante la convivencia, la identidad **no** es un agregado de ALICES. Es un dato externo
que se lee.

**2. ¿Tiene identidad y ciclo de vida propios?**

Si es una regla o un cálculo sin identidad, es un **servicio de dominio**, no un agregado.
Es el caso de `PoliticaAccesoUsuario`: no se persiste, no tiene `Id`, no cambia de estado.
Solo decide. `ARCHITECTURE.md` ya preveía esta figura (`PrecioService`) y no se estaba usando.

**3. ¿Protege alguna invariante?**

Si la clase solo tiene propiedades y getters, es un DTO disfrazado —un *modelo anémico*—.
`Usuario` tenía `EstaActivo()` y nada más. La regla que de verdad importaba (¿puede entrar
ahora?) estaba en SQL.

### El flujo de decisión

```
¿Somos dueños de los datos?
├── No  → Servicio de dominio + lectura Dapper. Sin agregado, sin repositorio.
└── Sí  → ¿Tiene identidad y ciclo de vida?
          ├── No  → Value object (si es un valor) o servicio de dominio (si es una regla)
          └── Sí  → ¿Protege invariantes reales?
                    ├── No  → Probablemente sea un DTO de lectura, no un agregado
                    └── Sí  → Agregado: factory + métodos que devuelven Result + eventos
```

### Eventos de dominio: existen y no se usan

La infraestructura está completa —`Entity.RaiseDomainEvent`, `IDomainEvent`, publicación en
`SaveChangesAsync`— y **no hay un solo `RaiseDomainEvent` en todo el dominio**.

El primer uso natural es la auditoría de sesión: en vez de que el SP inserte en
`INGRESO_SESION` como efecto oculto, el dominio emite `SesionIniciadaDomainEvent` y un
`INotificationHandler` lo persiste. La diferencia práctica: el efecto secundario se vuelve
visible, testeable y ampliable sin tocar el flujo principal.

### Sobre el orden de construcción

`ARCHITECTURE.md` §9 propone empezar por el dominio. Para un dominio nuevo es correcto. Para
**migrar un sistema legacy es al revés**: primero entiendes qué hace realmente el sistema
actual, y solo entonces modelas. Construir el agregado primero fue exactamente lo que produjo
el padrón fantasma.

---

## 4. Estado y siguientes pasos

**Hecho** — Fase 0 completa; padrón fantasma eliminado; `PoliticaAccesoUsuario` en el dominio.

**Preparado, sin desplegar** — `sp_Alices_ValidarCredenciales.sql`; migración
`EliminarPadronUsuariosFantasma`.

**Pendiente**

- Conectar el handler al SP nuevo (requiere desplegarlo primero).
- Auditoría vía evento de dominio.
- Código de rol estable (`COD_ROL`) en lugar de comparar `DESC_ROL`.
- **Fase 2** — QR del día como caso de uso propio. Hoy `ISNULL(R.KEY_QR, u.CLAVE)` anula la
  contraseña personal de todos los usuarios del rol y la auditoría no distingue el método.
- **Fase 3** — contraseñas. Bloqueada por una decisión de negocio: el tablero de admins
  muestra las contraseñas en claro, lo cual es incompatible con hashear. Opciones y costos
  en el plan de migración.
