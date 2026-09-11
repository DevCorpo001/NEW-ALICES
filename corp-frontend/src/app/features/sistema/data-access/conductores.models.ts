export type TipoDocumento = 'DNI' | 'CE' | 'PAS';

export interface Conductor {
  idConductor: number;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  licencia: string;
}

export interface Vehiculo {
  idVehiculo: number;
  placa: string;
  nombre: string;
}
