---
name: pos-frontend
description: Convenciones de arquitectura, diseño y estilo para el frontend Angular + Tailwind del sistema POS - paleta, tipografía, densidad, radios, estructura de carpetas, inventario de shared/ui, atajos de teclado y accesibilidad. Usar siempre que se cree, edite o revise un componente, servicio, store o pantalla del frontend de este proyecto.
license: MIT
---

# Frontend POS — Angular + Tailwind

Este skill define cómo se construye el frontend de este POS para que cualquier
sesión de IA (o desarrollador nuevo) mantenga consistencia, sin tener que
redescubrir las reglas cada vez.

## Stack

- Angular (standalone components, sin NgModules salvo justificación explícita)
- Tailwind CSS como único sistema de estilos (no CSS custom salvo casos muy puntuales)
- `@angular/cdk` como **única** librería de primitivas de interacción. Para
  comportamiento con accesibilidad compleja se usa el CDK directamente:
  `ListKeyManager` (navegación por flechas), `Overlay` (paneles que no deben
  recortarse), `FocusTrap`, `A11yModule`. No se usa Spartan/ng ni Angular
  Material ni Flowbite: el sistema visual es Tailwind propio y el CDK aporta
  solo el comportamiento.
- Signals nativos de Angular para estado local de componente.
- Estado compartido: servicio con Signals en el `data-access` del feature
  (sufijo `.store.ts`). **No NgRx** salvo que aparezca coordinación entre
  muchos features que lo justifique.

## Estructura de carpetas (Clean Architecture aplicada al frontend)

```
src/app/
├── core/                  # Transversal, sin conocimiento de ningún feature
│   ├── auth/              # AuthService, authGuard, modelos de sesión
│   ├── http/              # interceptores
│   ├── routing/           # guards de navegación y registro de vistas por submódulo
│   └── services/          # singletons transversales (tema, etc.)
├── shared/                # Reutilizable y sin lógica de negocio
│   ├── directives/
│   ├── services/
│   └── ui/                # componentes compartidos (ver inventario abajo)
├── features/
│   ├── almacenes/
│   │   ├── data-access/   # servicios HTTP, stores y modelos del feature
│   │   ├── ui/            # componentes de presentación
│   │   └── feature-almacenes.routes.ts
│   └── <otro>/            # misma estructura
└── layout/                # Shell, sidebar, topbar del back-office
```

Regla: un componente en `ui/` no debe inyectar servicios de `data-access/`
directamente si puede recibir datos por `input()` — mantiene los componentes
de presentación testeables y reutilizables. La pantalla contenedora del feature
sí puede inyectar su store.

## Inventario de `shared/ui` — revisar ANTES de crear un componente

| Componente | Selector | Para qué |
|---|---|---|
| Autocomplete | `app-autocomplete` | Buscador con panel de sugerencias: debounce, flechas ↑↓/Inicio/Fin, Enter, `F2`/`Escape`, estados cargando/error/vacío y ARIA de combobox. Implementa `ControlValueAccessor`, así que se usa con `[formControl]`. El consumidor solo escucha `(buscar)` y devuelve `[opciones]`. |
| Modal | `app-modal` | Diálogo con cabecera, trampa de foco, cierre con `F2`/`Escape`, devolución del foco al disparador y bloqueo del scroll de fondo. |
| Catálogo | `app-catalogo-modal` | Mantenimiento de un catálogo maestro: filtros autocompletados y excluyentes entre sí, tabla de resultados navegable con ↑ ↓ Inicio Fin y Enter, y alta con código sugerido. Se describe con un `CatalogoConfig` (columnas y campos) y una `CatalogoDataSource` (de dónde salen los datos). Añadir un catálogo es añadir esas dos piezas, **no** un componente. |
| Coming soon | `app-coming-soon` | Placeholder de submódulo sin vista todavía. |
| Marquee | `app-marquee` | Ticker inferior. |
| Tabs | `app-tabs` | Cabecera de pestañas con roving tabindex y navegación con ← → Inicio Fin. Solo la cabecera: el panel lo pinta el consumidor con `@if`. |
| Columnas visibles | `app-columnas-visibles` | Selector de columnas de una tabla en panel del CDK Overlay. Guarda las **ocultas**, no las visibles, así el estado inicial es "todas marcadas" sin inicialización. No deja ocultar la última. |
| Estado chip | `app-estado-chip` | Distintivo activo/inactivo de las tablas. Recibe un booleano, no un `'A'`/`'I'`: el código de la BD legacy se traduce en el borde, no dentro del componente. |
| Botón de acción | `app-boton-accion` | Botón cuadrado de icono para la columna de acciones. Tonos `neutro` / `peligro` / `exito`. La `etiqueta` es obligatoria: sirve de `aria-label` y de tooltip. |
| Clave oculta | `app-clave-oculta` | Clave en claro con interruptor de visibilidad y su propio estado por fila. Arranca siempre oculta. |
| Filtro de columna | `app-filtro-columna` | Embudo en la cabecera de una columna: abre un panel del CDK Overlay para acotar solo esa columna. Marca el embudo cuando hay filtro puesto; `Enter`/`Escape`/`F2` cierran sin borrar. |

Antes de escribir un componente nuevo en un feature, comprobar si encaja en uno
de estos. Si algo va a usarse en dos features, va a `shared/ui`, no duplicado.

## Tamaño de archivo — cuándo hay que partir

Un archivo grande no es un problema de estética: es la señal de que hay varias
responsabilidades juntas, y eso es lo que hace cara cada pantalla nueva.

- **250 líneas: revisar.** Preguntarse qué está haciendo el archivo de más.
- **350 líneas: no se mergea sin partirlo**, salvo acuerdo explícito del equipo.
- Cuenta lógica, no `import`s ni el decorador `@Component`.

Un componente que se pasa casi siempre está haciendo trabajo que no le toca.
Adónde va cada cosa:

| Lo que sobra en el componente | Adónde va |
|---|---|
| Estado async, HTTP, flags de carga/guardado | Store en `data-access/`, provisto por el componente (no en `root`) |
| Mapeo API↔formulario, cálculos, validación | Funciones **puras** en `data-access/` — se testean sin `TestBed` |
| Textos de error y de aviso | Módulo de mensajes en `data-access/` |
| Tablas de configuración (`Record<Id, …>`) | Su propio archivo de config |
| Un bloque de UI con estado propio | Subcomponente en `ui/` |

Referencia: `productos.component.ts` pasó de 557 a 313 líneas repartiéndose en
`producto-ficha.store.ts` (estado async), `producto-formulario.ts` (creación del
formulario y mapeos), `producto-mensajes.ts` y `producto-catalogos.ts`, sin tocar
el template ni los 34 tests de la pantalla.

Dos apoyos para que partir salga barato:

- **Extraer antes funciones puras que clases.** No necesitan inyección ni
  `TestBed`, y son las que más rápido se vuelven reutilizables.
- **El estado async va al store; el formulario y el DOM se quedan en el
  componente.** El store no conoce el `FormGroup`. Si el store devuelve un
  `Observable`, se suscribe solo el componente: suscribirse en ambos lanza la
  petición dos veces.

## Sistema de diseño

### Paleta
- Base neutra: escala `slate` de Tailwind (fondo, texto, bordes)
- Acento único para acciones primarias: rojo corporativo `#ED1B24`, expuesto
  como token `primary` (con `primary-hover` `#D40000` y `primary-light`).
  Usar siempre la clase de token (`bg-primary`, `text-primary`,
  `focus:outline-primary`), nunca el hex a mano.
- Estados: éxito `success` (`#10B981`), error `error` (`#DC2626`), advertencia
  `amber-500` — usar solo para estado real (no decoración)
- Los tokens viven en `@theme` dentro de `src/styles.css`. Añadir un color
  nuevo es añadirlo ahí, no inventarlo en el componente.
- Evitar gradientes y más de un color de acento por pantalla

### Tipografía
- Fuente: Inter (o IBM Plex Sans) para toda la interfaz
- Números (precios, totales, cantidades): `font-variant-numeric: tabular-nums`
  para que no varíen de ancho al cambiar
- Escala: definir tokens en `tailwind.config` (`text-xs` a `text-2xl`), no usar
  tamaños arbitrarios (`text-[13px]`) salvo excepción justificada

### Densidad — dos modos distintos
- **Pantalla de cobro/venta**: botones grandes (mínimo 44px de alto), poco texto,
  máxima velocidad de uso táctil/mouse
- **Back-office (compras, reportes, catálogo)**: más denso, tablas con filtros,
  prioriza mostrar información sobre espacio en blanco

### Bordes y radios
- Radio estándar para cards, inputs, botones, modales, tablas: `rounded-sm`
  (el token `--radius-sm` de `styles.css`, 8px). No usar `rounded-md` ni
  `rounded-lg` sueltos salvo un caso puntual y justificado (ej. avatar
  circular → `rounded-full`).
- Grosor de borde: `border` (1px) por defecto. Evitar `border-2` fuera de
  estados de foco/error, donde sí se permite para dar énfasis.
- Color de borde neutro: `border-slate-200` en modo claro / `border-slate-800`
  en modo oscuro, salvo estados (foco, error, éxito) que usan su color
  correspondiente de la paleta.
  
## Signals y `effect` — trampa que ya nos ha mordido dos veces

Un `effect` se suscribe a **todo** lo que lee, incluidas las señales que él
mismo escribe. Si lee y escribe la misma señal, se reejecuta en bucle y
deshace el cambio del usuario.

```ts
// MAL: al agregar una fila, el efecto se reejecuta y borra lo agregado
effect(() => {
  this.filas.set(this.parsear(this.valorInicial()));
  this.siguienteId = this.filas().reduce(...) + 1;   // ← lee lo que escribe
});

// BIEN: leer las entradas fuera, escribir dentro de untracked()
effect(() => {
  const inicial = this.valorInicial();
  untracked(() => {
    const filas = this.parsear(inicial);
    this.filas.set(filas);
    this.siguienteId = filas.reduce(...) + 1;
  });
});
```

Cuidado también con las llamadas indirectas: un método de terceros
(p. ej. `ListKeyManager.setActiveItem`) puede leer señales internas y crear la
misma dependencia sin que se vea en el código del efecto.

Regla: en un `effect` de reinicio, leer las señales de entrada al principio y
envolver toda la escritura en `untracked()`.

## Convenciones de nomenclatura

- Componentes: `kebab-case` en archivo, `PascalCase` en clase (`venta-carrito.component.ts` → `VentaCarritoComponent`)
- Servicios de acceso a datos: sufijo `.service.ts` o `.store.ts` si usan Signal Store
- Un componente = una responsabilidad. Si un componente supera ~200 líneas de
  template o lógica, evaluar dividirlo

## Comentarios — una línea, o ninguno

Al añadir un feature o arreglar un bug: si dejas un comentario, **máximo una
línea**. Conciso y preciso. Nada de bloques de tres o cuatro líneas explicando
lo que el código ya dice; saturan el archivo y envejecen mal.

```ts
// ✅
/** Campos obligatorios con su nombre visible, en orden de pantalla. */
// En campos de catálogo (solo lectura) el foco útil es el botón que abre el modal.

// ❌
/**
 * Nombre visible de cada campo obligatorio, para nombrarlo en el aviso cuando
 * está vacío. El orden es el de la pantalla: así el mensaje se lee en el mismo
 * orden en que el usuario recorre el formulario.
 */
```

Qué merece comentario y qué no:

- **Sí**: el *porqué* no evidente — una decisión contraintuitiva, un orden que
  importa, una limitación del backend, una trampa ya pisada.
- **No**: repetir el nombre del método (`/** Guarda el producto. */`), describir
  paso a paso lo que se lee debajo, o dejar historia del cambio (para eso está git).
- Si algo necesita de verdad más de una línea para explicarse, no va en el
  código: va en este skill o en `FRONTEND.md`, y el código lleva el enlace.

Excepción: los `TODO(backend):` y avisos de deuda técnica siguen igual, en una línea.

## Accesibilidad (no negociable)

- Todo elemento interactivo debe ser alcanzable por teclado
- Foco visible siempre (no quitar el outline sin reemplazo)
- Modales atrapan el foco y lo devuelven al elemento que los abrió (lo resuelve
  `app-modal` — no desactivarlo)
- Listas navegables por teclado: usar `ListKeyManager` del CDK, no un índice a
  mano. Ojo: su `onKeydown` se guía por el `keyCode` obsoleto; llamar a
  `setNextItemActive()` / `setPreviousItemActive()` y equivalentes.
- Un panel flotante dentro de un contenedor con `overflow` se recorta: usar CDK
  Overlay (`cdkConnectedOverlay`), no `position: absolute`.
- **Con una capa abierta, el fondo no scrollea.** Lo resuelve `app-modal` a través
  de `ScrollBlockService` (`shared/services/scroll-block.service.ts`), que envuelve
  la estrategia `block()` del CDK Overlay: conserva la posición y compensa el ancho
  de la barra, así la página no salta al abrir. Toda capa nueva a pantalla completa
  (drawer, visor, panel) usa ese servicio. El servicio cuenta capas, así que cerrar
  un modal anidado no libera el scroll del que sigue abierto, y libera en `onDestroy`:
  un modal destruido estando abierto dejaría la página congelada para siempre.

## Atajos de teclado reservados

Este POS está pensado para operarse mayormente con teclado en espacios de
trabajo reducidos (cajas, mostradores), así que hay teclas reservadas a nivel
de sistema que **no deben reasignarse ni interceptarse** en componentes nuevos:

| Tecla | Uso reservado                          |
|-------|------------------------------------------|
| `F2`  | Cerrar modal / búsqueda activa            |
| `F5`  | [DEFINIR — ej. refrescar grilla/listado]  |
| `F9`  | [DEFINIR]                                 |
| `F10` | [DEFINIR]                                 |
| ...   | completar según convención real del sistema |

Reglas:
- Antes de agregar un `(keydown)` o atajo custom en un componente, revisar
  esta tabla — si la tecla ya está reservada, no reutilizarla para otra acción
  aunque el contexto parezca no chocar (los modales/paneles pueden convivir
  en la misma vista).
- Los atajos reservados deben documentarse en el `modal-title` o header del
  componente cuando aplique (ej. `"Búsqueda [F2 Cerrar]"`, como ya se usa en
  los modales de Productos) para que el usuario sepa que existen sin tener
  que adivinar.
- Si un componente nuevo necesita un atajo de teclado, usar una combinación
  no reservada (ej. `Ctrl+Enter`, `Alt+N`) y documentarla del mismo modo en
  el header/tooltip correspondiente.
- Estos atajos son prioridad sobre comportamiento default del navegador
  cuando el foco está dentro del POS — verificar que no haya conflicto con
  atajos nativos del navegador (`F5` sí es nativo — refresh — así que si lo
  reservan para otra cosa, hay que `preventDefault()` explícitamente y
  dejarlo anotado).
  
## Qué NO hacer

- No mezclar Angular Material, Spartan/ng, Flowbite u otra librería de
  componentes con estilos propios "por encima" — genera inconsistencia visual.
  El comportamiento se toma del CDK; el aspecto es siempre Tailwind propio.
- No añadir una dependencia sin declararla en `package.json` (un `npm install`
  posterior la poda y rompe el build de todos)
- No hardcodear colores fuera de los tokens de `@theme` en `src/styles.css`
- No duplicar un componente de `shared/ui` dentro de un feature; si necesita una
  variante, parametrizarlo
- No dejar comentarios de más de una línea (ver "Comentarios — una línea, o ninguno")
- No interceptar ni reasignar teclas de la tabla de atajos reservados
  (ver sección "Atajos de teclado reservados") sin acordarlo con el equipo.
- No pintar el título de la vista dentro del componente. Lo muestra la **topbar**,
  centrado y fijo al hacer scroll, tomándolo de `data.titulo` de la ruta (que sale
  de `nav-items.ts`). Una pantalla que pone su propio `<h1>` acaba mostrando el
  mismo nombre dos veces, una encima de la otra.
- No tocar `document.body.style.overflow` ni `html { overflow: hidden }` a mano para
  congelar el fondo: para eso está `ScrollBlockService` (ver "Accesibilidad"). Hacerlo
  por componente pierde la posición de scroll y se pisa entre modales anidados.

## Pendiente de definir con el equipo

- [ ] Teclas reservadas `F5`, `F9`, `F10` (la tabla sigue incompleta)
- [ ] Convención de manejo de errores HTTP y mensajes al usuario

## Archivos por encima del umbral (deuda conocida)

Al 2026-08-30, pendientes de partir (ver "Tamaño de archivo"):

- [ ] `shared/ui/catalogo-modal/catalogo-modal.component.ts` — 374
- [ ] `…/modals/precio-detalle/precio-detalle-modal.component.html` — 343
- [ ] `features/almacenes/ui/productos/productos.component.ts` — 313 (ya bajó desde 557)
- [ ] `…/modals/precio-detalle/precio-detalle-modal.component.ts` — 299
- [ ] `features/almacenes/ui/productos/productos.component.html` — 278
