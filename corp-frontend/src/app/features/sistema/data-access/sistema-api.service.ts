import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AUDITORIA_DEMO } from './auditoria.datos-demo';
import { RegistroAuditoria } from './auditoria.models';
import { CLIENTES_DEMO } from './clientes.datos-demo';
import { Cliente } from './clientes.models';
import { CONDUCTORES_DEMO, VEHICULOS_DEMO } from './conductores.datos-demo';
import { Conductor, Vehiculo } from './conductores.models';
import { PERFILES_DEMO } from './perfiles.datos-demo';
import { Perfil } from './perfiles.models';
import { CLAVES_DEMO, CLAVES_QR_DEMO } from './permisos.datos-demo';
import { ClaveAutorizacion, ClaveQr } from './permisos.models';
import { ROLES_DEMO, USUARIOS_DEMO } from './seguridad.datos-demo';
import { Rol, Usuario } from './seguridad.models';

/** Origen de seguridad. TODO(backend): faltan los SPs; hoy responde con datos de muestra. */
@Injectable({ providedIn: 'root' })
export class SistemaApiService {
  listarUsuarios(): Observable<readonly Usuario[]> {
    return of(USUARIOS_DEMO).pipe(delay(RETARDO_MS));
  }

  listarRoles(): Observable<readonly Rol[]> {
    return of(ROLES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarPerfiles(): Observable<readonly Perfil[]> {
    return of(PERFILES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarClaves(): Observable<readonly ClaveAutorizacion[]> {
    return of(CLAVES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarClavesQr(): Observable<readonly ClaveQr[]> {
    return of(CLAVES_QR_DEMO).pipe(delay(RETARDO_MS));
  }

  listarConductores(): Observable<readonly Conductor[]> {
    return of(CONDUCTORES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarVehiculos(): Observable<readonly Vehiculo[]> {
    return of(VEHICULOS_DEMO).pipe(delay(RETARDO_MS));
  }

  listarClientes(): Observable<readonly Cliente[]> {
    return of(CLIENTES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarAuditoria(): Observable<readonly RegistroAuditoria[]> {
    return of(AUDITORIA_DEMO).pipe(delay(RETARDO_MS));
  }
}

/** Se simula la latencia para que los estados de carga se vean como en producción. */
const RETARDO_MS = 250;
