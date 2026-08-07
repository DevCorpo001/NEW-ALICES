---
name: pos-frontend
description: Convenciones de arquitectura, diseño y estilo para el frontend Angular + Tailwind (corp-frontend / POS). OBLIGATORIO cargar este skill siempre que se cree, edite o revise un componente, servicio, store, ruta, directiva o pantalla en corp-frontend. También al revisar PRs o proponer UI del front.
license: MIT
---

# Frontend POS — Angular + Tailwind

Este skill define cómo se construye el frontend de este proyecto para que cualquier
sesión de IA (o desarrollador nuevo) mantenga consistencia, sin tener que
redescubrir las reglas cada vez.

**Complemento UX del repo:** `corp-frontend/FRONTEND.md` (navegación por Enter,
autofocus, botón primario). Cargar este skill y respetar también ese MD.

## Stack

- Angular (standalone components, sin NgModules salvo justificación explícita)
- Tailwind CSS como único sistema de estilos (no CSS custom salvo casos muy puntuales)
- Componentes headless de Spartan/ng para elementos con lógica de accesibilidad
  compleja (dropdown, modal, combobox, datepicker, tabs, tooltip). No reconstruir
  estos a mano.
- Signals nativos de Angular para estado local de componente.
- [DEFINIR] gestor de estado global si aplica (NgRx / Signal Store / servicio simple)

## Estructura de carpetas (Clean Architecture aplicada al frontend)

```
src/app/
├── core/                  # Servicios transversales: auth, http interceptors, guards
├── shared/                # Componentes/pipes/directivas reutilizables sin lógica de negocio
├── features/
│   ├── ventas/
│   │   ├── data-access/   # Servicios HTTP, stores, modelos del feature
│   │   ├── ui/            # Componentes de presentación puros (sin lógica de negocio)
│   │   └── feature-ventas.routes.ts
│   ├── compras/
│   │   └── ... (misma estructura)
│   └── catalogo/
│       └── ... (misma estructura)
└── layout/                # Shell, sidebar, topbar del back-office
```

Regla: un componente en `ui/` no debe inyectar servicios de `data-access/`
directamente si puede recibir datos por `@Input()` — mantiene los componentes
de presentación testeables y reutilizables.

## Sistema de diseño

### Paleta
- Base neutra: escala `slate` de Tailwind (fondo, texto, bordes)
- Acento único para acciones primarias (cobrar, confirmar): [DEFINIR hex, ej. `#2563EB` azul corporativo]
- Estados: éxito `green-600`, advertencia `amber-500`, error `red-600` — usar solo
  para estado real (no decoración)
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

## Convenciones de nomenclatura

- Componentes: `kebab-case` en archivo, `PascalCase` en clase (`venta-carrito.component.ts` → `VentaCarritoComponent`)
- Servicios de acceso a datos: sufijo `.service.ts` o `.store.ts` si usan Signal Store
- Un componente = una responsabilidad. Si un componente supera ~200 líneas de
  template o lógica, evaluar dividirlo

## Accesibilidad (no negociable)

- Todo elemento interactivo debe ser alcanzable por teclado
- Foco visible siempre (no quitar el outline sin reemplazo)
- Modales y dropdowns deben atrapar el foco (esto ya lo resuelve Spartan/ng —
  no desactivarlo)

## Qué NO hacer

- No mezclar Angular Material u otra librería de componentes con estilos
  propios "por encima" — genera inconsistencia visual
- No hardcodear colores fuera de la paleta definida en `tailwind.config`
- No crear un componente custom para algo que Spartan/ng ya resuelve
  (dropdown, modal, tooltip, etc.)

## Pendiente de definir con el equipo

- [ ] Color de acento definitivo (hex)
- [ ] Gestor de estado global (NgRx / Signal Store / servicios)
- [ ] Convención de manejo de errores HTTP y mensajes al usuario
- [ ] Formato de moneda y localización (soles/dólares, separadores)