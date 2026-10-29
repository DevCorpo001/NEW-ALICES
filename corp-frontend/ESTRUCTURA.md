# ALICES Frontend — estructura del proyecto

Inventario de qué hace cada carpeta y cada archivo de `corp-frontend`.
Documento **descriptivo**: refleja el estado del código, no impone reglas.

| Documento | Papel |
|---|---|
| `ARCHITECTURE.md` | **Normativo.** Contrato de capas, dependencias y prohibiciones |
| `FRONTEND.md` | **Normativo.** UX del POS: foco, navegación con Enter |
| Skill `pos-frontend` | **Normativo.** Sistema visual, inventario de `shared/ui`, tamaño de archivo |
| `ESTRUCTURA.md` (este) | **Descriptivo.** Qué hay hoy y para qué sirve |

Última revisión: **2026-08-30**, rama `dev-frank`.
Al añadir o mover un archivo, actualizar la tabla que corresponda.

---

## Mapa general

```text
corp-frontend/
├── public/                  # estáticos servidos tal cual
├── src/
│   ├── environments/        # configuración por entorno
│   ├── app/
│   │   ├── core/            # transversal y singleton: sesión, HTTP, routing
│   │   ├── shared/          # reutilizable sin conocimiento de negocio
│   │   ├── layout/          # shell, sidebar, topbar
│   │   └── features/        # una carpeta por módulo de negocio
│   │       └── <feature>/
│   │           ├── data-access/   # modelos, servicios HTTP, stores, mapeos
│   │           └── ui/            # componentes de pantalla
│   ├── main.ts
│   └── styles.css
└── (configuración: angular.json, tsconfig, proxy…)
```

Regla de dependencias: `ui/` → `data-access/` → `core/` + `shared/` → API.
Nunca al revés, y **los features no se importan entre sí**: lo compartido sube a
`shared/` o `core/`.

---

## Raíz: configuración

| Archivo | Qué hace |
|---|---|
| `angular.json` | Builder `@angular/build`, configuraciones `production` y `development`, y el proxy del `serve` |
| `package.json` | Dependencias y scripts (`start`, `build`, `test`, `watch`) |
| `proxy.conf.json` | En desarrollo redirige `/api` a `http://localhost:5225` (la API .NET) |
| `tsconfig.json` | TypeScript estricto: `strict` y `strictTemplates` activos |
| `tsconfig.app.json` / `tsconfig.spec.json` | Variantes para aplicación y tests |
| `.postcssrc.json` | Engancha Tailwind 4 vía `@tailwindcss/postcss` |
| `.prettierrc` / `.editorconfig` | Formato de código |

## `public/` — estáticos

| Ruta | Qué hace |
|---|---|
| `favicon.ico` | Icono del navegador |
| `images/logo_sin_slogan.png` | Logo de ALICES usado en login y topbar |
| `images/4810d4bd-…jpg` | Imagen suelta, **sin referencias en `src/`** |
| `videos/videobg.mp4` | Vídeo de fondo del login |

## `src/` — entrada

| Archivo | Qué hace |
|---|---|
| `index.html` | Documento base; carga la fuente Inter y monta `<app-root>` |
| `main.ts` | Arranque: `bootstrapApplication(App, appConfig)` |
| `styles.css` | Tailwind, tokens de marca en `@theme` (color primario `#ED1B24`, radios, fuente Inter), CSS del CDK Overlay y tema de SweetAlert2 |
| `environments/environment.ts` | `apiBaseUrl: '/api'` y bandera `production` |

---

## `app/` — raíz de la aplicación

| Archivo | Qué hace |
|---|---|
| `app.ts` | Componente raíz; solo hospeda el `router-outlet` |
| `app.config.ts` | Proveedores globales: router, `provideHttpClient` con el interceptor de 401, y un `provideAppInitializer` que restaura la sesión **antes** de pintar |
| `app.routes.ts` | Construye el árbol de rutas **a partir de `navItems`**: cada submódulo del menú genera su ruta; si no hay vista registrada, cae en `coming-soon`. Todo cuelga del `ShellComponent` protegido por `authGuard` |

## `app/core/` — transversal

No depende de ningún feature. Servicios singleton (`providedIn: 'root'`).

### `core/auth/`

| Archivo | Qué hace |
|---|---|
| `auth.service.ts` | Sesión con Signals: `login`, `logout`, `restoreSession` y los derivados `user` / `isAuthenticated`. La restauración usa `HttpBackend` directo para **saltarse los interceptores** y no disparar la redirección a login al comprobar la sesión |
| `auth.models.ts` | Contratos de sesión: `LoginRequest`, `LoginResponse`, `SessionUser`, `TiendaOption` |
| `auth.guard.ts` | Bloquea rutas sin sesión y redirige a `/login` |

### `core/http/`

| Archivo | Qué hace |
|---|---|
| `unauthorized.interceptor.ts` | Ante un `401` limpia la sesión y manda a `/login`, salvo si ya se está ahí. Vuelve a lanzar el error para que la pantalla también pueda reaccionar |

### `core/routing/`

| Archivo | Qué hace |
|---|---|
| `submodule-views.ts` | Tipo `SubmoduleViews`: mapa `'modulo/submodulo'` → carga diferida del componente. Lo que no está declarado cae en `coming-soon` |
| `submodule-entry.guard.ts` | Pide confirmación antes de entrar a un submódulo, salvo en la carga inicial |

### `core/services/`

| Archivo | Qué hace |
|---|---|
| `api.service.ts` | `GET /api/ping`, para comprobar que la API responde |
| `mensajes-footer.service.ts` | Mensajes del ticker y colores del pie. Vive en `core/` porque lo escribe el feature Sistema y lo lee el `layout`. TODO(backend): persiste en `localStorage` |
| `theme.service.ts` | Modo claro/oscuro con Signal, persistido en `localStorage` bajo `alices-theme` |

## `app/shared/` — reutilizable, sin negocio

### `shared/directives/`

| Archivo | Qué hace |
|---|---|
| `enter-navigate.directive.ts` | Enter salta al siguiente control de la vista; implementa la regla de navegación por teclado sin reescribirla por pantalla |
| `enter-primary.directive.ts` | En el último control, Enter dispara el botón primario (guardar/buscar) |

### `shared/services/`

| Archivo | Qué hace |
|---|---|
| `confirm.service.ts` | Diálogos de confirmación, éxito, error y advertencia. `sweetalert2` se importa de forma diferida para no cargarlo en el bundle inicial |
| `scroll-block.service.ts` | Congela el scroll del documento mientras haya capas abiertas. Envuelve `ScrollStrategyOptions.block()` del CDK con un **contador de capas**, para que cerrar un modal anidado no libere el scroll del que sigue abierto |

### `shared/ui/` — componentes compartidos

Antes de crear un componente nuevo, revisar esta tabla: si algo va a usarse en
dos features, va aquí parametrizado, no duplicado.

| Carpeta | Selector | Qué hace |
|---|---|---|
| `autocomplete/` | `app-autocomplete` | Buscador con panel de sugerencias: debounce, navegación con flechas, `F2`/`Escape`, estados cargando/error/vacío y ARIA de combobox. Es un `ControlValueAccessor`, así que se usa con `[formControl]`. **No pide datos**: emite `(buscar)` y recibe `[opciones]`. El panel usa CDK Overlay para no recortarse dentro de contenedores con `overflow` |
| `modal/` | `app-modal` | Diálogo base: cabecera, trampa de foco, cierre con `F2`/`Escape`, devolución del foco al disparador y bloqueo del scroll de fondo. Todos los modales de la app pasan por aquí |
| `catalogo-modal/` | `app-catalogo-modal` | Mantenimiento genérico de un catálogo maestro: filtros excluyentes, tabla navegable con teclado y alta con código sugerido. Se describe con un `CatalogoConfig` (qué se ve) y una `CatalogoDataSource` (de dónde salen los datos) |
| `coming-soon/` | `app-coming-soon` | Placeholder de submódulo sin vista todavía; lo cargan las rutas por defecto |
| `tabs/` | `app-tabs` | Cabecera de pestañas: roving tabindex y navegación con ← → Inicio Fin. Solo la cabecera; el panel lo pinta el consumidor |
| `columnas-visibles/` | `app-columnas-visibles` | Selector de columnas de una tabla, en panel del CDK Overlay. Guarda las **ocultas**, no las visibles: así al entrar están todas marcadas sin inicializar nada. No deja ocultar la última |
| `estado-chip/` | `app-estado-chip` | Distintivo activo/inactivo de las tablas. Recibe un booleano, no el `A`/`I` de la BD: la traducción se hace en el borde |
| `boton-accion/` | `app-boton-accion` | Botón cuadrado de icono para la columna de acciones; tonos neutro / peligro / éxito. La etiqueta es obligatoria y sirve de `aria-label` y tooltip |
| `clave-oculta/` | `app-clave-oculta` | Clave con interruptor de visibilidad y estado propio por fila; arranca siempre oculta |
| `filtro-columna/` | `app-filtro-columna` | Embudo de cabecera para filtrar una sola columna, en panel del CDK Overlay. Se marca cuando hay filtro puesto |
| `marquee/` | `app-marquee` | Ticker inferior. Los mensajes cruzan la pantalla una vez por vuelta, a 70 px/s para que se puedan leer de reojo; la duración sale del recorrido real (pantalla + ancho del texto). Los colores llegan por `input` porque los elige el usuario |

Archivos de apoyo: `autocomplete.models.ts` (opción normalizada),
`catalogo-modal.models.ts` (`CatalogoFila`, `CatalogoConfig`) y
`catalogo-modal.datasource.ts` (interfaz `CatalogoDataSource`, que desacopla el
modal de la API).

## `app/layout/` — armazón

| Archivo | Qué hace |
|---|---|
| `shell/shell.component.*` | Estructura de la app autenticada: topbar, sidebar, `router-outlet` y marquee |
| `shell/nav-items.ts` | **Árbol del menú**, y de rebote el de rutas: `app.routes.ts` se genera a partir de aquí. Añadir un submódulo empieza en este archivo |
| `sidebar/sidebar.component.*` | Menú lateral con módulos y submódulos |
| `topbar/topbar.component.*` | Barra superior **fija al hacer scroll**: botón de menú, título de la vista (centrado, desde `data.titulo` de la ruta), tema, notificaciones, usuario y cierre de sesión. Es el único sitio donde se pinta el título: las vistas no ponen el suyo |

---

## `app/features/` — módulos de negocio

Cada feature tiene la misma forma: `data-access/` (datos y estado) y `ui/`
(pantalla). Las vistas se registran en `feature-<nombre>.routes.ts`.

### `features/auth/`

| Archivo | Qué hace |
|---|---|
| `feature-auth.routes.ts` | Ruta `/login`, fuera del shell |
| `data-access/tienda-api.service.ts` | `GET /api/tiendas`: tiendas activas para el selector del login |
| `ui/login.component.*` | Pantalla de acceso: usuario, clave y tienda, con navegación por Enter |

### `features/home/`

| Archivo | Qué hace |
|---|---|
| `ui/home.component.*` | Portada tras iniciar sesión |

### `features/sistema/`

Administración de accesos: Usuarios / Roles, Perfiles y Permisos.

| Archivo | Qué hace |
|---|---|
| `feature-sistema.routes.ts` | Registra `sistema/usuarios-rol`; el resto de submódulos de Sistema cae en `coming-soon` |

#### `sistema/data-access/`

| Archivo | Qué hace |
|---|---|
| `seguridad.models.ts` | `Usuario`, `Rol` y la `Cobertura` de permisos de un rol (completo / parcial / ninguno) |
| `seguridad.filtros.ts` | Filtrado de usuarios y roles y conteo por cobertura. Funciones puras; la búsqueda ignora tildes y mayúsculas |

| `seguridad.datos-demo.ts` | Datos de muestra: 12 usuarios y 9 roles, con casos límite (sin permisos, inactivos, sin último acceso) |
| `usuarios-filtro.store.ts` | Filtros, paginación (10 por página) y listado de usuarios. Cambiar un filtro vuelve a la página 1; `paginaActual` se recorta sola si el filtro deja menos páginas |
| `perfiles.models.ts` / `perfiles.datos-demo.ts` | Perfil de vendedor o cajero y sus datos de muestra |
| `perfiles.store.ts` | Un solo store para las dos pestañas: `tipo` decide el conjunto, y cambiarlo limpia los filtros porque nombran al tipo anterior |
| `permisos.models.ts` / `permisos.datos-demo.ts` | Clave de autorización y clave QR por rol, con sus datos de muestra |
| `permisos.store.ts` | Carga claves y QR en paralelo y mantiene ambos listados |
| `conductores.models.ts` / `conductores.datos-demo.ts` | Conductor y vehículo de reparto, con sus datos de muestra |
| `conductores.store.ts` | Los dos listados con un buscador común: el texto filtra conductores por nombre, documento y licencia, y vehículos por placa y modelo |
| `clientes.models.ts` / `clientes.datos-demo.ts` | Cliente del padrón, con los campos que vienen de SUNAT (condición, estado, ubigeo, última validación) |
| `clientes.store.ts` | Filtros de la barra superior **y** de cada columna, combinados, más paginación de 12 |
| `notificaciones.models.ts` / `notificaciones.store.ts` | Avisos enviados a los terminales, del más reciente al más antiguo |
| `auditoria.models.ts` / `auditoria.datos-demo.ts` | Movimiento de la bitácora, con el color por tipo de acción y qué campos son sensibles |
| `auditoria.store.ts` | Bitácora con filtros **en dos tiempos**: `borrador` es lo escrito y solo pasa a la tabla al pulsar Aplicar; `sinAplicar` avisa de la diferencia |
| `sistema-api.service.ts` | Antes `seguridad-api.service.ts`; se renombró al cubrir también clientes y conductores |
| `roles-filtro.store.ts` | Ídem para roles, más las columnas ocultas de la tabla y las opciones del selector de rol |

#### `sistema/ui/usuarios-rol/`

| Archivo | Qué hace |
|---|---|
| `usuarios-rol.component.*` | Contenedor: cabecera, pestañas y el panel activo. Provee los dos stores |
| `usuarios/usuarios-tab.component.*` | Bloque de filtros y bloque de tabla, separados: avatar con iniciales, clave con interruptor de visibilidad, acciones de editar y activar/desactivar, y paginación |
| `usuarios/paleta.ts` | Iniciales y color pastel estable por texto, para avatares y etiquetas de rol |
| `roles/roles-tab.component.*` | Filtros de rol (buscador, cobertura de permisos, columnas, limpiar, agregar) y su tabla |
| `roles/roles.columnas.ts` | Qué columnas de la tabla de roles se pueden ocultar |

#### `sistema/ui/perfiles/` — submódulo "Perfiles" (`/sistema/vendedor-caja`)

| Archivo | Qué hace |
|---|---|
| `perfiles.component.*` | Vendedores y cajeros en una sola pantalla: la pestaña solo cambia el tipo activo del store, no duplica filtros ni tabla |

#### `sistema/ui/permisos/` — submódulo "Permisos"

| Archivo | Qué hace |
|---|---|
| `permisos.component.*` | Contenedor con las pestañas Permisos y Claves QR |
| `claves/claves-tab.component.*` | Claves de autorización: contraseña con interruptor de visibilidad, usuario, estado y acciones (editar, activar/desactivar, imprimir) |
| `qr/claves-qr-tab.component.*` | Una clave QR por rol, con estado e impresión |

#### `sistema/ui/mensajes/` — submódulo "Mensajes"

| Archivo | Qué hace |
|---|---|
| `mensajes.component.*` | Alta, edición en línea y baja de los mensajes del pie, más los colores del ticker. Escribe en `MensajesFooterService`, así que el pie se actualiza al momento |

#### `sistema/ui/conductores/` — submódulo "Conductor y Vehículos"

| Archivo | Qué hace |
|---|---|
| `conductores.component.*` | Dos listados en una pantalla —conductores y vehículos— con un buscador común y bajas confirmadas |

#### `sistema/ui/clientes/` — submódulo "Clientes"

| Archivo | Qué hace |
|---|---|
| `clientes.component.*` | Padrón con 10 columnas: filtros arriba, un embudo por columna en la cabecera y paginación |

#### `sistema/ui/notificaciones/` — submódulo "Notificaciones"

| Archivo | Qué hace |
|---|---|
| `notificaciones.component.*` | Redacción y envío de avisos, con el registro de lo enviado |

#### `sistema/ui/auditoria/` — submódulo "Auditoría"

| Archivo | Qué hace |
|---|---|
| `auditoria.component.*` | Bitácora con filtros de usuario, módulo, acción y rango de fechas. Los valores de campos sensibles salen tapados y se destapan uno a uno con `app-clave-oculta` |

### `features/almacenes/`

El feature más desarrollado; hoy contiene el mantenimiento de Productos.

| Archivo | Qué hace |
|---|---|
| `feature-almacenes.routes.ts` | Declara qué submódulos tienen vista real; el resto cae en `coming-soon` |

#### `almacenes/data-access/` — datos y estado

| Archivo | Qué hace |
|---|---|
| `productos.models.ts` | Contratos con la API: `ProductoDetalle`, `PrecioProducto`, `GuardarProducto`, `CodigoBarra`, `CambioPrecio`… Espejo de lo que devuelven los SPs |
| `productos-api.service.ts` | Las llamadas HTTP de productos: buscar, validar, precios, códigos de barra, alta y actualización. Solo transporte, sin estado |
| `productos-busqueda.store.ts` | Estado del buscador: término y filtro de estado como Signals; relanza la consulta al cambiar y expone `resultados` / `buscando` / `error` |
| `producto-ficha.store.ts` | Estado de la ficha abierta: carga (detalle + precios + barras en paralelo), alta y actualización, con sus banderas y mensajes de error. **Devuelve el `Observable` sin suscribirse**: suscribirse aquí y en el componente lanzaría la petición dos veces |
| `producto-formulario.ts` | Creación del `FormGroup` y los mapeos: ficha→pantalla, pantalla→DTO, fechas y códigos de barra. Funciones puras, se prueban sin `TestBed` |
| `producto-catalogos.ts` | Qué campo trae el id y cuál el texto de cada catálogo, las seis fuentes de datos y la lectura de una fila elegida |
| `producto-mensajes.ts` | Campos obligatorios y traducción del error HTTP a texto para el usuario (404, 409 duplicado, 400 validación) |
| `catalogos.models.ts` | `CatalogoId`: los seis catálogos. El id coincide a propósito con el nombre del control del formulario |
| `catalogos.endpoints.ts` | Dónde vive cada catálogo en la API y por qué campos filtra |
| `catalogo-api.datasource.ts` | Implementación de `CatalogoDataSource` contra la API, común a los seis |
| `almacen.models.ts` / `tienda.models.ts` | Almacén, y tienda con su canal y empresa |
| `almacenes.datos-demo.ts` | Datos de muestra de almacenes, tiendas, canales y empresas |
| `almacenes-api.service.ts` | Origen de esos mantenimientos. TODO(backend): `GET /api/tiendas` existe pero solo devuelve id, código y dirección |
| `almacen.store.ts` | Filtros de código y descripción del mantenimiento de almacenes |
| `tienda.store.ts` | Tiendas con sus filtros, más los canales y empresas que alimentan selectores y modales |
| `grupo.models.ts` / `grupos.datos-demo.ts` | Grupo de productos por canal, y el producto visto desde ese mantenimiento |
| `grupos.store.ts` | Una sola carga sirve a las dos pestañas; cada una tiene sus filtros, y la selección de productos se recorta a lo visible |

#### `almacenes/ui/productos/` — pantalla

| Archivo | Qué hace |
|---|---|
| `productos.component.*` | Orquesta la pantalla: búsqueda, formulario, catálogos, imagen y precios. No habla con HTTP: delega en los stores |
| `catalogos.config.ts` | Cómo se ve cada catálogo en el modal (columnas, filtros, campos de alta) y las etiquetas de clasificación de la ficha. **Añadir un catálogo es añadir una entrada aquí**, no un componente |
| `imagen/imagen-producto.component.*` | Carga y previsualización de la imagen. *TODO(backend): falta el endpoint de subida; hoy solo previsualiza* |
| `precios/precios-producto.component.*` | Lista de precios del producto por canal. *TODO(backend): las ediciones se quedan en memoria* |
| `precios/precios.calculos.ts` | Aritmética de precios (IGV, descuentos en cascada, márgenes). Funciones puras, sin Angular |
| `modals/codigo-barra/` | Alta y listado de códigos de barra del producto |
| `modals/precio-detalle/` | Edición del precio de un canal, con sus rangos por cantidad |
| `modals/historial-precios/` | Historial de cambios de un precio, del más reciente al más antiguo |

#### `almacenes/ui/almacen/` y `almacenes/ui/tienda/`

| Archivo | Qué hace |
|---|---|
| `almacen/almacen.component.*` | Mantenimiento de almacenes: filtros de código y descripción, tabla y bajas confirmadas |
| `tienda/tienda.component.*` | Mantenimiento de tiendas: cuatro filtros, tabla de 13 columnas y los dos modales |
| `tienda/modals/tienda-form-modal.component.*` | Alta de tienda con pestañas Datos Generales y Configuración; si faltan obligatorios devuelve a la primera |
| `tienda/modals/canales-modal.component.*` | Canales de venta, con alta y edición en línea sobre la propia tabla |

#### `almacenes/ui/grupo-producto/` — submódulo "Grupo Producto"

| Archivo | Qué hace |
|---|---|
| `grupo-producto.component.*` | Contenedor con las pestañas Grupo Producto y Grupos |
| `productos/grupo-productos-tab.component.*` | Búsqueda de productos, selección múltiple y envío a un grupo |
| `grupos/grupos-tab.component.*` | Mantenimiento de grupos, con "solo con productos" y bajas que avisan de cuántos quedarán sueltos |
| `modals/asignar-grupo-modal.component.*` | Elige el grupo destino de los productos marcados |
| `modals/productos-grupo-modal.component.*` | Consulta de qué productos tiene un grupo |

---

## Tests

27 archivos `.spec.ts`, **245 tests**, junto al código que prueban (`npm test`).

Lo cubierto hoy: `productos.component` (34 tests de la pantalla completa),
`catalogo-modal`, `autocomplete`, los tres modales de Productos,
`precios.calculos`, `productos-busqueda.store`, `catalogo-api.datasource`,
`scroll-block.service`, `auth.service` y las rutas.

Los specs de pantalla prueban **comportamiento público** —qué peticiones salen,
qué queda en el formulario, qué diálogo aparece—, no interioridades. Por eso
sirven de red para refactorizar: si pasan sin tocarlos, el comportamiento no
cambió.

---

## Recetas: dónde tocar para…

**Añadir un submódulo al menú**
1. Entrada en `layout/shell/nav-items.ts` (la ruta se genera sola).
2. Sin vista todavía: nada más — sale `coming-soon`.
3. Con vista: crear el componente en `features/<feature>/ui/` y registrarlo en
   `feature-<feature>.routes.ts`.

**Añadir un catálogo maestro (séptimo)**
1. Su id en `data-access/catalogos.models.ts`.
2. Su ruta y campos de filtro en `data-access/catalogos.endpoints.ts`.
3. Su presentación en `ui/productos/catalogos.config.ts`.
4. Sus campos de id y texto en `data-access/producto-catalogos.ts`.

No se crea ningún componente: `app-catalogo-modal` lo resuelve.

**Añadir una llamada a la API**
1. El contrato en `<feature>/data-access/*.models.ts`.
2. El método en el `*-api.service.ts` del feature.
3. Si trae estado (carga, error, resultado), va a un store del feature; si es un
   dato puntual, lo consume la pantalla.

**Crear un componente**
Revisar antes `shared/ui/`. Si va a usarse en dos features, va ahí
parametrizado. Del CDK se toma solo comportamiento; el aspecto es Tailwind
propio con los tokens de `styles.css`.

---

## Deuda conocida

- **Archivos por encima del umbral de tamaño** (250 revisa / 350 tope, ver skill
  `pos-frontend`): `catalogo-modal.component.ts` (374),
  `precio-detalle-modal.component.html` (343), `productos.component.ts` (313),
  `precio-detalle-modal.component.ts` (299), `productos.component.html` (278).
- **Endpoints pendientes**: subida de imagen, guardado de precios y búsqueda de
  grupo de producto. Marcados como `TODO(backend)` en el código.
- **Estáticos huérfanos**: `src/app/imgs/cap_detalle_precio.png` es una captura de referencia
  dentro del código fuente, y `public/images/4810d4bd-….jpg` no se referencia en
  `src/`. Revisar si se mueven a `public/` o se borran.
- **Átomos de formulario sin unificar**: las clases Tailwind de input y botón se
  repiten literalmente en los templates (una cadena aparece 9 veces). Candidato a
  utilidades `@utility` en `styles.css`.
