import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { ScrollBlockService } from './scroll-block.service';

/** El bloqueo real es del CDK y necesita un documento que desborde; aquí solo se verifica el conteo de capas. */
class EstrategiaEspia {
  enables = 0;
  disables = 0;
  enable = () => this.enables++;
  disable = () => this.disables++;
}

class ScrollStrategyOptionsEspia {
  readonly estrategia = new EstrategiaEspia();
  block = () => this.estrategia;
}

describe('ScrollBlockService', () => {
  let service: ScrollBlockService;
  let estrategia: EstrategiaEspia;

  beforeEach(() => {
    const opciones = new ScrollStrategyOptionsEspia();
    TestBed.configureTestingModule({
      providers: [{ provide: ScrollStrategyOptions, useValue: opciones }],
    });
    service = TestBed.inject(ScrollBlockService);
    estrategia = opciones.estrategia;
  });

  it('bloquea al abrir la primera capa y libera al cerrarla', () => {
    service.bloquear();
    expect(estrategia.enables).toBe(1);
    expect(estrategia.disables).toBe(0);

    service.liberar();
    expect(estrategia.disables).toBe(1);
  });

  it('mantiene el bloqueo hasta que se cierra la última capa anidada', () => {
    service.bloquear();
    service.bloquear();
    expect(estrategia.enables).toBe(1);

    service.liberar();
    expect(estrategia.disables).toBe(0);

    service.liberar();
    expect(estrategia.disables).toBe(1);
  });

  it('ignora liberaciones de más, para no desbalancear el contador', () => {
    service.liberar();
    service.bloquear();
    service.liberar();
    service.liberar();

    expect(estrategia.enables).toBe(1);
    expect(estrategia.disables).toBe(1);
  });
});
