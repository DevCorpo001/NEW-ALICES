---
name: pos-frontend
description: Convenciones de arquitectura, diseño accesible y estilo para el frontend Angular + Tailwind del sistema POS Alice's. Paleta con acento único (#ED1B24), accesibilidad para operarios adultos, inventario de shared/ui, signals y atajos de teclado. Usar siempre que se cree, edite o revise un componente, servicio, store o pantalla.
license: MIT
---

# Frontend POS — Angular + Tailwind (Alice's)

Guía técnica y de diseño para mantener consistencia absoluta en el POS. Diseñado para ser consumido tanto por desarrolladores como por asistentes de IA (Claude Code, Antigravity, Gemini).

---

## 1. Stack Técnico

- **Angular**: Standalone components exclusivamente (sin `NgModule`).
- **Control de Flujo**: Sintaxis nativa moderna (`@if`, `@for`, `@switch`).
- **Estado Local**: Angular Signals (`signal()`, `computed()`).
- **Estado de Feature**: Servicios SignalStore en `data-access/` con sufijo `.store.ts`. Sin NgRx.
- **Estilos**: Tailwind CSS puro mediante tokens semánticos en `@theme`. Prohibido CSS custom o clases arbitrarias (`text-[13px]`).
- **Primitivas de Interacción**: Únicamente `@angular/cdk` (`ListKeyManager`, `Overlay`, `FocusTrap`, `A11yModule`). Prohibido Angular Material, Spartan, Flowbite o librerías externas de UI.

---

## 2. Principios de Diseño UI/UX (Operarios Adultos / No Nativos Digitales)

El sistema está optimizado para personas mayores o con poca afinidad tecnológica:

1. **Jerarquía del Color de Marca (`#ED1B24`)**:
   - Mapeado como token `primary` (`bg-primary`, `text-primary`, `border-primary`).
   - **Regla estricta**: **Un único botón primario rojo por pantalla o modal** (la acción de cierre: *Cobrar*, *Agregar*, *Ingresar*).
   - Acciones secundarias o destructivas usan escala `slate` o contornos neutros. Prohibido el efecto arcoíris (evitar mezclar botones verdes, amarillos, azules y rojos en el mismo bloque).
2. **Targets Táctiles y de Clic Amplios**:
   - Altura mínima en inputs, selects y botones de acción rápida: **48px a 56px** (`h-12` a `h-14`).
   - Botones numéricos, contadores `+`/`-` y selectores de escala: mínimo 44x44px.
3. **Legibilidad Inmediata**:
   - Fuente base: `Inter` con alto contraste (`text-slate-800` sobre fondos blancos o `slate-50`).
   - Importes, precios y cantidades críticas en tamaño extra grande (`text-3xl` a `text-5xl`) con `tabular-nums` (`font-mono` o `tabular-nums`).
4. **Micro-copy Directo**:
   - Textos de una sola palabra o frases de 2 palabras (*Cobrar*, *Buscar*, *Limpiar*, *Cerrar turno*). Cero jerga técnica.
5. **Prevención de Errores Activa**:
   - Detección visible de tecla `Bloq Mayús` (*Caps Lock*) en login y campos sensibles.
   - Atajos de teclado documentados visualmente en la interfaz con pastillas sutiles (ej. `[Enter]`, `[F2]`).

---

## 3. Tokens de Diseño y Reglas Tailwind

Todos los componentes deben ceñirse a los tokens globales definidos en `src/styles.css`:

```css
@theme {
  --color-primary: #ED1B24;        /* rgb(237, 27, 36) - Corporativo Alice's */
  --color-primary-hover: #C81018;  /* Estado hover */
  --color-primary-light: #FFF1F2;  /* Fondos de acento sutil */
  --color-success: #16A34A;        /* Confirmaciones y stock suficiente */
  --color-warning: #D97706;        /* Alertas de stock bajo / advertencias */
  --color-error: #DC2626;          /* Validación fallida y stock agotado */
  --radius-sm: 8px;                /* Radio estándar del sistema */
}
```

- **Radios**: Usar siempre `rounded-sm` (8px). No usar `rounded-lg`, `rounded-xl` o radios arbitrarios (salvo píldoras o `rounded-full` para avatares/chips).
- **Bordes**: `border` (1px) en `border-slate-200` (modo claro) o `border-slate-800` (modo oscuro). `border-2` reservado únicamente para estados de foco (`focus:border-primary`) o error.

---

## 4. Estructura de Carpetas (Clean Architecture)

```
src/app/
├── core/                  # Transversal sin conocimiento de negocio
│   ├── auth/              # AuthService, authGuard, modelos de sesión
│   ├── http/              # Interceptores HTTP
│   └── services/          # Singletons globales
├── shared/                # Reutilizable, agnóstico al negocio
│   ├── directives/        # Directivas CDK o accesibilidad
│   ├── services/          # ScrollBlockService, etc.
│   └── ui/                # Inventario de componentes visuales compartidos
├── features/
│   ├── ventas/            # Módulo de Caja / POS
│   │   ├── data-access/   # venta.store.ts, venta.service.ts, calculos.ts
│   │   ├── ui/            # venta-carrito, venta-totales, venta-pago-modal
│   │   └── ventas.routes.ts
│   └── almacenes/         # Misma estructura de subcarpetas
└── layout/                # Shell, topbar con título global y marquee
```

**Regla de Oro**: Un componente dentro de `ui/` nunca inyecta stores ni servicios HTTP. Recibe datos por `input()` y emite eventos por `output()`. La pantalla contenedora del feature es la única encargada de inyectar el store.

---

## 5. Inventario de `shared/ui` (Revisar ANTES de programar)

| Componente | Selector | Propósito |
|---|---|---|
| Autocomplete | `app-autocomplete` | Buscador con debounce, flechas ↑/↓, Enter, `F2`/`Escape` y ARIA combobox. Implementa `ControlValueAccessor`. |
| Modal | `app-modal` | Diálogo con trampa de foco, bloqueo de scroll (`ScrollBlockService`), cierre con `F2`/`Escape` y retorno de foco. |
| Catálogo Modal | `app-catalogo-modal` | Búsqueda y selección rápida en tablas con `CatalogoConfig` y `CatalogoDataSource`. |
| Tabs | `app-tabs` | Cabecera accesible de pestañas con roving tabindex y navegación con flechas. |
| Botón Acción | `app-boton-accion` | Botón cuadrado de icono para tablas (`neutro` / `peligro` / `exito`). Requiere atributo `etiqueta` para accesibilidad. |
| Estado Chip | `app-estado-chip` | Badge booleano para estados activo/inactivo con borde y color semántico. |
| Clave Oculta | `app-clave-oculta` | Input de clave con botón toggle ver/ocultar integrado. |

---

## 6. Convenciones de Lógica y Signals

### Manejo de `effect()`
Nunca leer y escribir la misma señal en un efecto sin protección. Siempre aislar la mutación:

```typescript
// Correcto:
effect(() => {
  const criterio = this.busqueda();
  untracked(() => {
    this.aplicarFiltro(criterio);
    this.paginaActual.set(1);
  });
});
```

### Límites de Tamaño por Archivo
- **250 líneas**: Umbral para advertencia y revisión.
- **350 líneas**: Prohibido mergear. Debe modularizarse:
  - Lógica asíncrona y HTTP ➔ `*.store.ts`
  - Validaciones, cálculos de totales y mapeos ➔ Funciones puras en `*.utils.ts`
  - Bloques de interfaz reutilizables ➔ Subcomponentes en `ui/`

---

## 7. Atajos de Teclado Reservados

| Tecla | Acción Reservada |
|---|---|
| `F2` / `Escape` | Cerrar modal, búsqueda emergente o cancelar operación |
| `F1` | Búsqueda rápida de productos |
| `F4` | Abrir panel de cobro / finalizar venta |
| `F5` | Recargar catálogo o grilla activa |
| `Enter` | Confirmar acción primaria en foco o selector |

*Nota*: Documentar siempre el atajo reservado en el encabezado del modal o tooltip (ejemplo: `"Cobrar [F4]"` o `"Buscar Producto [F2 Cerrar]"`).

---

## 8. Lo que NUNCA se debe hacer

1. **Nunca** pintar el título de la vista dentro del template del componente. La `topbar` del layout lo muestra automáticamente desde `data.titulo` en la ruta.
2. **Nunca** tocar `document.body.style.overflow = 'hidden'` directamente; usar siempre `ScrollBlockService`.
3. **Nunca** crear botones con fondos de múltiples colores llamativos (verde, azul, naranja, negro juntos) en la misma barra de acciones.
4. **Nunca** usar comentarios de más de una línea en el código. Si requiere explicación extensa, pertenece a este archivo de arquitectura.