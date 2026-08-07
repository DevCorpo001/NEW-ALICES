# ALICES Frontend — Guía de UI/UX y convenciones

Documento de referencia obligatoria para todo desarrollo en `corp-frontend`.
Cualquier vista, componente o pantalla **debe** respetar estas reglas.

## Fuente de verdad de arquitectura y diseño

El skill del proyecto define stack, carpetas, diseño y prohibiciones:

**→ skill `pos-frontend`** — `.opencode/skills/pos-frontend/SKILL.md`

Este `FRONTEND.md` **complementa** el skill con reglas de UX de ALICES (sobre todo navegación por Enter). Si hay conflicto de arquitectura/estilos, manda el skill; si es flujo de teclado/foco, manda este archivo.

Stack: **Angular** (standalone) + Tailwind (+ Spartan/ng según skill).

---

## 0. Principios generales

- Sin lógica de dominio del backend en el front (solo presentación y orquestación HTTP).
- HTTP vía `provideHttpClient()` + proxy dev (`proxy.conf.json` → API).
- Servicios Angular por feature; DTOs alineados a los Response de la API.
- Componentes standalone; rutas en `app.routes.ts`.

---

## 1. Navegación por teclado con Enter (obligatorio en toda vista)

Toda pantalla con filtros, formularios o flujos de captura debe ser usable **sin ratón**, avanzando con **Enter**.

### 1.1 Comportamiento requerido

| Momento | Comportamiento |
|---|---|
| Carga de la vista | El **primer** control interactivo habilitado y visible queda **autofocus** |
| Enter en un input/select | Salta al **siguiente** control focusable del mismo contenedor |
| Enter en el **último** control | Activa el **botón primario** (submit / buscar / guardar) |
| Enter en `textarea` | Inserta nueva línea (no avanza). Opcional: `Ctrl+Enter` avanza o envía |

### 1.2 Orden de foco

1. Orden DOM natural dentro del contenedor marcado.
2. Respetar `tabindex` ≥ 0 si se usa de forma explícita.
3. **Excluir** del flujo:
   - `disabled`
   - `type="hidden"`
   - `tabindex="-1"` (salvo foco programático puntual)
   - elementos no visibles (`display: none`, `hidden`, `aria-hidden="true"`)

### 1.3 Botón primario

Prioridad para decidir qué se activa al final del flujo Enter:

1. Elemento con atributo/directiva de primario (p. ej. `appEnterPrimary`)
2. Si no hay: `button[type="submit"]` del contenedor
3. Si no hay: último `button` habilitado del contenedor

### 1.4 Aplicación técnica (directiva reutilizable)

Usar la directiva de contenedor (cuando exista en `core/directives`):

```html
<form appEnterNavigate (ngSubmit)="buscar()">
  <input name="codigo" />
  <input name="nombre" />
  <select name="estado">...</select>
  <button type="submit" appEnterPrimary>Buscar</button>
</form>
```

Reglas:
- Marcar el **contenedor** de la vista/sección (`form`, toolbar de filtros, card de captura).
- Marcar el botón de acción principal con el marcador de primario.
- No depender de que el usuario use solo Tab: **Enter debe bastar** para completar el flujo típico.
- No hacer submit a mitad de camino: Enter en un campo intermedio solo mueve el foco.

### 1.5 Checklist por vista nueva

- [ ] Contenedor con navegación Enter aplicada
- [ ] Primer control recibe foco al entrar a la ruta/vista
- [ ] Enter recorre todos los filtros/campos en orden lógico
- [ ] Enter al final dispara buscar/guardar (botón primario)
- [ ] Textareas no rompen el UX (Enter = salto de línea)
- [ ] Controles deshabilitados/ocultos no quedan en el flujo
- [ ] Tras errores de validación, foco razonable (primer campo inválido, si aplica)

---

## 2. Formularios y filtros

- Agrupar filtros de cabecera en un único contenedor navegable.
- Botón primario con label claro: Buscar, Guardar, Continuar, etc.
- Evitar múltiples `type="submit"` en el mismo contenedor; si hay más de uno, marcar explícitamente el primario.
- Validación visible sin bloquear el avance por Enter entre campos (validar al submit o al blur según el caso).

---

## 3. Accesibilidad mínima

- Labels asociados a inputs (`label[for]` o wrapping).
- Contraste legible; no depender solo del color para errores.
- Botones y links con texto o `aria-label`.
- No atrapar el foco de forma que impida salir de la vista con teclado.

---

## 4. Estructura de carpetas

Seguir el skill `pos-frontend`:

```
src/app/
  core/                      # auth, interceptors, guards
  shared/                    # UI/pipes/directivas reutilizables (enter-navigate, etc.)
  features/<feature>/
    data-access/             # HTTP, stores, modelos
    ui/                      # presentación (preferir @Input sobre inyectar data-access)
    feature-*.routes.ts
  layout/                    # shell, sidebar, topbar
  app.routes.ts
  app.config.ts
```

---

## 5. HTTP y entornos

- Base API en dev: rutas relativas `/api/...` (proxy a backend).
- `environment.ts` para flags y `apiBaseUrl`.
- Manejo de error HTTP en servicios o interceptor (cuando exista); mensajes claros en UI.

---

## 6. Recordatorio operativo para el agente

Al implementar **cualquier** vista o formulario en `corp-frontend`:

1. Cargar el skill `pos-frontend` (Skill tool).
2. Leer este archivo para UX Enter/foco.
3. Respetar estructura `features/.../{data-access,ui}` y Tailwind/Spartan del skill.
4. Aplicar navegación Enter + autofocus del primer campo.
5. Enter final → acción primaria (buscar/submit).
6. No entregar pantallas solo usables con ratón/Tab si el flujo es de captura o filtros.
7. Reutilizar directivas en `shared`/`core`; no copiar lógica de foco en cada componente.
