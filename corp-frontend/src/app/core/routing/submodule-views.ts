import { Type } from '@angular/core';

export type ComponentLoader = () => Promise<Type<unknown>>;

/** Vistas por submódulo (`'modulo/submodulo'`); las no declaradas caen en `coming-soon`. */
export type SubmoduleViews = Readonly<Record<string, ComponentLoader>>;
