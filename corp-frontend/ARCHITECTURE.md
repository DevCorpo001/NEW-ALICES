# ALICES Frontend - Contrato de arquitectura

Documento obligatorio para todo desarrollo en `corp-frontend`. Define una
adaptacion de Clean Architecture para Angular: separa presentacion, acceso a
datos y servicios transversales sin duplicar la logica de negocio del backend.

`FRONTEND.md` conserva las reglas especificas de UX, especialmente foco y
navegacion con Enter. El skill `pos-frontend` define el sistema visual y sus
convenciones complementarias.

## 1. Stack y principios

- Angular standalone; no usar NgModules salvo justificacion explicita.
- Signals para estado local y servicios con Signals para estado transversal.
- Reactive Forms para formularios.
- Tailwind como sistema de estilos; `@angular/cdk` como unica libreria de
  primitivas de interaccion (`ListKeyManager`, `Overlay`, `FocusTrap`). No se
  usa Spartan/ng ni ninguna otra libreria de componentes: el CDK aporta
  comportamiento y accesibilidad, el aspecto es siempre Tailwind propio.
- `HttpClient` mediante `provideHttpClient()` y proxy en desarrollo.
- TypeScript estricto (`strict` y `strictTemplates` activos en `tsconfig.json`);
  no usar `any` para ocultar contratos incompletos.
- El frontend presenta y orquesta; no replica reglas de negocio del backend.

## 2. Capas y dependencias

```text
features/<feature>/ui
        |
features/<feature>/data-access
        |
core y shared
        |
HttpClient -> API
```

- `ui/` recibe datos por inputs y emite eventos; no conoce detalles HTTP.
- `data-access/` contiene DTOs, servicios HTTP y stores del feature.
- `core/` contiene autenticacion, interceptores, guards, configuracion y
  servicios singleton transversales. No depende de features.
- `shared/` contiene componentes, pipes y directivas reutilizables sin
  conocimiento de negocio.
- `layout/` contiene shell, sidebar y topbar; no contiene llamadas HTTP de un
  feature concreto.
- Los features no se importan entre si. La reutilizacion va en `shared` o
  `core`.

## 3. Estructura

```text
src/app/
  core/
    auth/                 # sesion, authGuard y contratos de auth
    http/                 # interceptores
    routing/              # guards de navegacion y tipo SubmoduleViews
    services/             # servicios transversales
  shared/
    directives/
    services/
    ui/                   # componentes compartidos (autocomplete, modal, ...)
  features/
    <feature>/
      data-access/        # organizado por subcarpetas de dominio (<dominio>/)
      ui/                 # componentes de presentacion organizados por dominio
      feature-<feature>.routes.ts
  layout/
  app.config.ts
  app.routes.ts
```

### Regla de organización en `data-access`
Dentro de cada feature, la carpeta `data-access` debe estar organizada por subcarpetas de dominio, igual que la carpeta `ui` del mismo feature. Nunca colocar archivos de distintos dominios sueltos directamente en `data-access`.
Al crear un archivo nuevo en `data-access`, identificar primero a qué dominio pertenece (por su prefijo o por el modelo que maneja) y colocarlo en su subcarpeta correspondiente (`almacen/`, `catalogo/`, `grupo/`, `producto/`, `tienda/`, etc.). Si el dominio no tiene subcarpeta todavía, crearla.

Los componentes compartidos viven en `shared/ui/<nombre>/`. Antes de crear uno
nuevo, revisar el inventario del skill `pos-frontend`: si algo va a usarse en
dos features, va aqui y no duplicado.

## 4. Estado

- Estado local: `signal`, `computed` y `effect` solo cuando sea necesario.
- Estado de feature: un servicio/store del feature con Signals.
- Sesion: `AuthService` en `core/auth`.
- No introducir NgRx por defecto. Solo evaluarlo si el estado requiere
  devtools, eventos complejos o coordinacion entre muchos features.
- Evitar duplicar el mismo estado en componentes hermanos y servicios.

## 5. HTTP y contratos

- Rutas relativas `/api/...` en el frontend; el proxy resuelve el backend en
  desarrollo.
- Cada feature define sus DTOs en `data-access`; no usa entidades de dominio
  del backend.
- Las respuestas deben reflejar los Response DTOs de la API.
- Las peticiones autenticadas usan cookies HttpOnly; Angular nunca lee ni
  almacena el JWT.
- Un interceptor puede reaccionar a 401, limpiar la sesion y redirigir a
  `/login`, pero no debe contener logica de negocio.
- Los errores de API se transforman en mensajes de UI en el borde del feature.

## 6. Autenticacion

- Login: `POST /api/autenticacion/login`.
- La API establece una cookie `access_token` con HttpOnly, SameSite y Secure.
- `GET /api/autenticacion/me` restaura el perfil al recargar la aplicacion.
- `POST /api/autenticacion/logout` elimina la cookie en el backend.
- `/login` es publica; las rutas internas usan `authGuard`.
- El perfil de sesion puede vivir en Signals y memoria; no guardar el token en
  `localStorage`, `sessionStorage` ni variables accesibles desde templates.

## 7. Routing

- Cada feature expone sus rutas en `feature-<feature>.routes.ts`.
- Las rutas se cargan lazy cuando el feature lo justifica.
- `app.routes.ts` solo compone rutas publicas, layout y features.
- Los modulos y submodulos del menu se generan desde `layout/shell/nav-items.ts`.
  Un submodulo con vista propia se declara en el `SubmoduleViews` de su feature
  (`'modulo/submodulo' -> loader`) y `app.routes.ts` compone esos registros; lo
  no declarado cae en `coming-soon`.
- Los guards controlan acceso, no reemplazan autorizacion del backend. `authGuard`
  vive en `core/auth`; los guards de navegacion en `core/routing`.

## 8. UX y accesibilidad

- Aplicar siempre `FRONTEND.md` y el skill `pos-frontend`.
- Toda vista de captura o filtros debe tener autofocus, flujo Enter y boton
  primario claramente marcado.
- Usar una directiva reutilizable para foco y Enter (`appEnterNavigate` y
  `appEnterPrimary` en `shared/directives`); no copiar handlers por pantalla.
- Navegacion por teclado en listas: `ListKeyManager` del CDK. Paneles flotantes:
  CDK Overlay, para que no los recorte un contenedor con `overflow`.
- Labels asociados, foco visible, mensajes de error accesibles y controles
  utilizables con teclado.

## 9. Convenciones

- Archivos en `kebab-case`; clases en `PascalCase`.
- Componentes con una responsabilidad; dividirlos cuando superen unas 200
  lineas de template o logica.
- Servicios terminan en `.service.ts`; stores en `.store.ts`.
- Modelos de API terminan en `.models.ts` o viven junto al servicio.
- Preferir `inject()` y componentes standalone siguiendo el estilo del repo.

## 10. Checklist de feature

- [ ] Crear carpeta `features/<feature>`.
- [ ] Definir DTOs y servicio HTTP en `data-access`.
- [ ] Crear store solo si el feature tiene estado compartido.
- [ ] Crear UI sin llamadas HTTP directas.
- [ ] Crear rutas propias y cargarlas desde `app.routes.ts`.
- [ ] Aplicar estados loading, empty, error y success.
- [ ] Aplicar foco, Enter y accesibilidad.
- [ ] Agregar pruebas de servicio y componente cuando exista comportamiento.
- [ ] Ejecutar `npm run build` y `npm test`.

## 11. Prohibido

- Guardar JWT en storage accesible por JavaScript.
- Llamar `HttpClient` desde componentes de presentacion.
- Importar un feature dentro de otro feature.
- Duplicar un componente de `shared/ui` dentro de un feature en lugar de
  parametrizarlo.
- Anadir una libreria de componentes UI (Spartan/ng, Material, Flowbite): el
  comportamiento se toma de `@angular/cdk`.
- Usar una dependencia sin declararla en `package.json`.
- Usar CSS global o colores fuera de los tokens definidos sin justificacion.
- Colocar reglas de permisos o negocio como unica defensa en el frontend.
