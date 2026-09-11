import { Conductor, Vehiculo } from './conductores.models';

// TODO(backend): datos de muestra hasta que existan los SPs de conductores y vehículos.
export const CONDUCTORES_DEMO: readonly Conductor[] = [
  { idConductor: 1, nombre: 'NAYO JOEL', tipoDocumento: 'DNI', numeroDocumento: '09805670', licencia: 'Q09805670' },
  { idConductor: 2, nombre: 'WNCESLAO', tipoDocumento: 'DNI', numeroDocumento: '00851305', licencia: 'Q00851305' },
  { idConductor: 3, nombre: 'ANTONIO GUILLERMO', tipoDocumento: 'DNI', numeroDocumento: '43445635', licencia: 'LN43445635' },
  { idConductor: 4, nombre: 'MARCOS TELLO', tipoDocumento: 'DNI', numeroDocumento: '41220987', licencia: 'Q41220987' },
  { idConductor: 5, nombre: 'JHON RIVERA', tipoDocumento: 'CE', numeroDocumento: '002451118', licencia: 'E002451118' },
];

export const VEHICULOS_DEMO: readonly Vehiculo[] = [
  { idVehiculo: 1, placa: 'BYM161', nombre: 'CHANGAN' },
  { idVehiculo: 2, placa: '9781XC', nombre: 'BAJAJ 9781-XC' },
  { idVehiculo: 3, placa: 'BLK933', nombre: 'PEUGEOT- PARTNER' },
  { idVehiculo: 4, placa: 'ATC742', nombre: 'HYUNDAI H100' },
  { idVehiculo: 5, placa: 'C3M887', nombre: 'MOTOFURGON HONDA' },
];
