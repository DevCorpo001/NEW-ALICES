# Módulo de Seguridad — esquema `seguridad`

Documento de referencia del nuevo modelo de seguridad de ALICES.
Script: [`modulo_seguridad_alices_v3.sql`](modulo_seguridad_alices_v3.sql)

---

## 1. Estado

**Ejecutado en `CORE_CORP_PRUEBA` el 2026-09-01.** Verificado contra la BD:

| Objeto | Cantidad | Detalle |
|---|---|---|
| Tablas | 9 | `MODULO`, `SUBMODULO`, `VISTA`, `ACCION`, `VISTA_ACCION`, `ROL`, `ROL_PERMISO`, `USUARIO`, `USUARIO_PERMISO_EXCEPCION` (+ `AUDITORIA_PERMISO`) |
| Función | 1 | `fn_PermisosEfectivos` |
| Procedimientos | 4 | `ObtenerCredencialesLogin`, `ObtenerPermisosUsuario`, `ObtenerMenuUsuario`, `SubirVersionPermisos` |
| Foreign keys | 15 | 2 de ellas compuestas contra `VISTA_ACCION` |
| Checks | 2 | `CK_UPE_TIPO`, `CK_UPE_NIVEL` |
| Índices filtrados | 4 | `UQ_UPE_*`, confirmados con `has_filter = 1` |
| FK que apuntan a `dbo` | **0** | aislamiento total del esquema antiguo |

Las tablas están **vacías** salvo `ACCION` (8 filas semilla). Hasta que se cargue
el árbol de navegación, el módulo todavía no hace nada visible.

### Nota de despliegue

El script **necesita `SET QUOTED_IDENTIFIER ON`**, que ya trae en la cabecera.
Sin eso, los cuatro índices únicos filtrados no se crean **y el script termina
igualmente con código 0**: parece que fue bien y quedan sin la garantía de que
no haya dos excepciones contradictorias sobre el mismo objeto. SSMS lo pone en
ON por su cuenta; `sqlcmd` no. Por eso va explícito.

El script es **idempotente**: volver a correrlo no da error ni duplica nada.

---

## 2. Por qué se cambió

El modelo que hay en `dbo` tiene **tres sistemas de permisos compitiendo**:

1. **`ROL` con 35 columnas `VISTA_*` de tipo bit** — `VISTA_ALMACEN_PRODUCTOS`,
   `VISTA_SISTEMA_AUDITORIA`, etc. Cada pantalla nueva exige un `ALTER TABLE`.
2. **`Vistas` (89 filas) + `RolVistas` (767)** — árbol autoreferenciado.
3. **`VISTAS_PRINCIPAL_PLANTILLA` / `VISTA_SECUNDARIA_PLANTILLA` →
   `VISTA_PRINCIPAL_ROL` / `VISTA_SECUNDARIA_ROL`** — un tercer árbol, copiado
   por rol.

Consecuencias que se arrastran hoy:

- **58 roles para 84 usuarios.** Cuando la única forma de darle un permiso
  distinto a una persona es crearle un rol, acabas con un rol por persona.
- **Claves en texto plano.** `USUARIO.CLAVE VARCHAR(50)`, comparada tal cual.
- **`ROL.KEY_QR` es una llave maestra, no un segundo factor.** El SP de login
  hace `ISNULL(R.KEY_QR, u.CLAVE) = @clave`: si el rol tiene KEY_QR, esa clave
  entra como **cualquier** usuario de ese rol.
- **`ID_USUARIO` es `tinyint`** — techo de 255 usuarios, van 84.
- Reglas de negocio incrustadas en el SP de login (horario 08:50–22:00 y
  nombres de rol como literales).

---

## 3. El modelo nuevo

### Jerarquía

```
MODULO            Sistema, Almacenes, Ventas...        grupo del menú
  SUBMODULO       /almacenes/productos                 pantalla (tiene RUTA)
    VISTA         tab o sección dentro de la pantalla
      ACCION      VER, CREAR, EDITAR, ELIMINAR...      botón
```

Un permiso concreto es siempre la pareja **(VISTA, ACCION)**.

`VISTA_ACCION` declara qué acciones tienen sentido en cada vista. `ROL_PERMISO`
y `USUARIO_PERMISO_EXCEPCION` apuntan a esa tabla con una **FK compuesta**, así
que es imposible otorgar `EXPORTAR` sobre una vista que no exporta.

### Roles

El rol se configura **a nivel hoja**: filas `(ID_ROL, ID_VISTA, ID_ACCION)`.
Pantalla nueva = `INSERT`, nunca `ALTER TABLE`.

### Excepciones por usuario

Aquí está el cambio de fondo. La excepción se guarda **al nivel en que se
expresó**, no expandida a hojas:

| Columnas informadas | Significado |
|---|---|
| `ID_MODULO = 5` | quítale (o dale) todo el módulo Sistema |
| `ID_SUBMODULO = 12` | quítale la pantalla Clientes |
| `ID_VISTA = 40` | quítale ese tab entero |
| `ID_VISTA = 40` + `ID_ACCION = 3` | quítale el botón Eliminar de ese tab |

`CK_UPE_NIVEL` obliga a que vaya informado **exactamente uno** de los tres
niveles, y `ID_ACCION` solo se admite acompañando a `ID_VISTA`.

**Por qué importa guardarlo al nivel expresado:** si "quítale el módulo Sistema
a Pepe" se guardara expandido en 40 filas hoja, la vista que se cree mañana
dentro de Sistema **Pepe la vería**. Guardando la intención, no.

`TIPO`: `'G'` otorga, `'D'` deniega.
`VIGENTE_HASTA`: `NULL` = permanente; con fecha, el permiso temporal **caduca
solo**. Es justo lo que faltaba en el modelo viejo y de donde salían los roles
de más.

---

## 4. Cómo se resuelve un permiso

Toda la regla vive en **un solo sitio**: `seguridad.fn_PermisosEfectivos(@ID_USUARIO)`.
Ni el front ni la API la reimplementan; la consultan.

1. **Base** = lo que otorga el `ROL` del usuario, a nivel `(VISTA, ACCION)`.
2. Encima gana la excepción **más específica** del usuario:

   ```
   acción (1)  >  vista (2)  >  submódulo (3)  >  módulo (4)
   ```

3. A igual nivel no puede haber empate: los índices únicos filtrados garantizan
   una sola excepción por usuario y objeto.
4. Las excepciones con `VIGENTE_HASTA` pasado **no cuentan**.

La función devuelve el árbol entero con `PERMITIDO` (bit) y `ES_EXCEPCION`
(bit, útil para pintar en la pantalla de Permisos qué viene del rol y qué es
un ajuste personal).

### Comportamiento verificado

Probado con datos reales sobre una BD desechable antes de desplegar:

| Escenario | Resultado |
|---|---|
| Rol CAJERO sin excepciones | ve todo |
| Denegar el **módulo** Sistema | caen sus 3 vistas; Almacenes intacto |
| Denegar el **submódulo** Clientes | cae solo Clientes; Usuarios/Roles sigue |
| Denegar módulo Sistema **pero otorgar el tab Roles** | Roles = 1, resto de Sistema = 0 |
| Denegar solo el **botón** Eliminar | VER/CREAR/EDITAR = 1, ELIMINAR = 0 |
| Excepción **caducada** | se ignora, vuelve lo del rol |

El cuarto caso es el que demuestra la precedencia: lo específico gana sobre lo
general, que es el caso de uso que motivó todo esto.

---

## 5. El flujo nuevo, de principio a fin

### Login

```
1. POST /api/auth/login  { usuario, clave }
2. API → seguridad.ObtenerCredencialesLogin @USUARIO
        devuelve ID_USUARIO, CLAVE_HASH, ID_ROL, ESTADO, VERSION_PERMISOS
3. La API verifica la clave con BCrypt/Argon2.
4. Emite el JWT con:  ID_USUARIO, ID_ROL, VERSION_PERMISOS
```

**La clave NO se valida en SQL.** T-SQL no sabe comprobar un hash BCrypt, y
hacerlo en el SP obligaría a mandar la contraseña en claro al servidor. El SP
entrega el hash; quien compara es la API.

**El JWT NO lleva la lista de permisos.** Solo `VERSION_PERMISOS`. Si llevara
la lista, el token engordaría y quedaría obsoleto durante toda su vigencia (8 h).

### Después del login

```
5. GET /api/seguridad/mis-permisos
        → seguridad.ObtenerPermisosUsuario @ID_USUARIO
        devuelve la lista plana de permisos concedidos + VERSION_PERMISOS
6. GET /api/seguridad/mi-menu
        → seguridad.ObtenerMenuUsuario @ID_USUARIO
        solo módulos/submódulos con al menos un VER concedido
```

Un submódulo sin ninguna vista visible no aparece en el menú; un módulo sin
ningún submódulo visible, tampoco.

### En cada petición

Un middleware compara el `VERSION_PERMISOS` del token contra el de la BD (una
fila por PK, cacheable). Si no coinciden:

```
401  { codigo: 'PERMISOS_DESACTUALIZADOS' }
  → el front vuelve a pedir /mis-permisos, refresca su señal y reintenta
```

Con esto **nunca hay permisos obsoletos más de una petición**, pase lo que pase
con el resto de la infraestructura.

---

## 6. Tiempo real

Dos capas, con funciones distintas.

### Capa 1 — corrección: `VERSION_PERMISOS`

Es la que **garantiza** que nadie hace lo que no debe. Es el mecanismo de la
sección anterior: contador en `seguridad.USUARIO`, viaja en el token, se
compara en cada petición.

`seguridad.SubirVersionPermisos` acepta `@ID_USUARIO` **o** `@ID_ROL`. Si se
tocan los permisos del rol CAJERO, sube la versión de todos sus usuarios de
golpe (con ~84 usuarios el coste es irrelevante).

> **Regla obligatoria:** todo SP que escriba en `ROL_PERMISO` o en
> `USUARIO_PERMISO_EXCEPCION` **debe** llamar a `SubirVersionPermisos` antes de
> terminar. Si se olvida, el cambio de permisos no surte efecto hasta que
> caduque el token.

### Capa 2 — latencia: SignalR

Con solo la capa 1, el usuario sigue viendo el botón hasta su siguiente
petición. Un hub que avise al usuario afectado cuando le cambian los permisos
hace que el front refresque y **el botón desaparezca en el mismo segundo, sin
recargar**.

Es una mejora de experiencia, no de seguridad. Se implementa después de la
capa 1, nunca en su lugar.

### En el front

```ts
// PermisosStore: signal<Set<string>> con claves "SUBMODULO.VISTA.ACCION"
// Directiva:
<button *siPuede="'PRODUCTOS.LISTA.ELIMINAR'">Eliminar</button>
```

Como es una señal, al refrescarla los botones desaparecen solos. Ahí está el
"tiempo real" que se ve.

---

## 7. Convivencia con `dbo`

El esquema `seguridad` es **puramente aditivo**. No lee, no escribe, no altera
y no borra nada de `dbo`. Verificado: **0 foreign keys** apuntan fuera del
esquema. El sistema antiguo no se entera de que existe.

### Nomenclatura de los SPs

**Sin prefijo `sp_`.** SQL Server resuelve cualquier procedimiento que empiece
por `sp_` buscando **primero en `master`**, así que el prefijo cuesta una
búsqueda extra en cada llamada. El esquema ya da el espacio de nombres:

```
dbo.sp_Login_LogeoUsuarios        ← sistema antiguo, sigue vivo
seguridad.ObtenerCredencialesLogin ← sistema nuevo
```

Además se distinguen de un vistazo, que durante la convivencia ayuda.

### Decisión vigente sobre usuarios

**El alta de usuarios se sigue haciendo en el sistema antiguo**, contra
`dbo.USUARIO`. Consecuencia asumida: los usuarios nuevos **no** aparecen en
`seguridad.USUARIO`, y las dos listas divergen durante el desarrollo.

No es un problema ahora, pero significa que antes de salir en vivo hará falta
una **resincronización**, no una migración de una sola pasada.

Ojo con el orden: las claves de `dbo` están hoy en texto plano. La migración es
la **última oportunidad** de hashearlas de forma transparente. Después, o se
hashean entonces, o hay que resetear la clave a 84 personas.

---

## 8. Reglas para quien desarrolle sobre esto

1. **La regla de permisos vive solo en `fn_PermisosEfectivos`.** No se
   reimplementa en la API ni en el front.
2. **Todo SP que toque permisos llama a `SubirVersionPermisos`.**
3. **El JWT lleva `VERSION_PERMISOS`, nunca la lista de permisos.**
4. **La clave se verifica en la API, nunca en SQL.**
5. **SPs nuevos de seguridad van en el esquema `seguridad`, sin prefijo `sp_`**,
   y no consultan tablas de `dbo`.
6. **Pantalla nueva = filas en `MODULO`/`SUBMODULO`/`VISTA`/`VISTA_ACCION`**,
   nunca una columna nueva.
7. **Permiso temporal = `VIGENTE_HASTA` informado.** No se conceden permisos
   "temporales" permanentes; así es como se degeneró el modelo anterior.

---

## 9. Pendiente

| # | Tarea | Bloquea |
|---|---|---|
| 1 | **Semilla de `MODULO` / `SUBMODULO` / `VISTA` / `VISTA_ACCION`**, generada desde `corp-frontend/src/app/layout/shell/nav-items.ts` | todo lo demás: sin árbol no hay ni login ni pantalla de Permisos |
| 2 | `seguridad.SESION`, para que `MAX_SESIONES` se cumpla (hoy vive en `dbo.USUARIO_SESION`) | control de sesiones |
| 3 | Decidir qué pasa con las **claves QR**: tabla propia con hash y vigencia, o retirar la función | pantalla Permisos → Claves QR |
| 4 | SPs de **escritura**: alta/edición de rol, de usuario, y de excepciones (cada uno con `SubirVersionPermisos`) | modales de alta del front |
| 5 | Script de **migración/resincronización** desde `dbo` (84 usuarios, 58 roles, 767 filas de `RolVistas`) + hasheo de claves | salida a producción |
| 6 | Middleware de `VERSION_PERMISOS` en la API + endpoints `/mis-permisos` y `/mi-menu` | tiempo real, capa 1 |
| 7 | `PermisosStore` + directiva `*siPuede` en el front | ocultar botones y tabs |
| 8 | Hub SignalR | tiempo real, capa 2 |

El siguiente paso es el **1**: hasta que exista el árbol, no se puede probar
nada de lo demás.
