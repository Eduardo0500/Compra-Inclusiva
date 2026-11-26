import { describe, expect, it } from 'vitest';
import { calcularNivel } from '../../services/identity';

describe('calcularNivel', () => {
  it('devuelve leve para puntuación 0–3', () => {
    expect(calcularNivel([0, 0, 0, 0, 0]).level).toBe('leve');
    expect(calcularNivel([0, 1, 0, 0, 0]).level).toBe('leve');
    expect(calcularNivel([1, 1, 1, 0, 0]).level).toBe('leve');
  });

  it('devuelve moderado para puntuación 4–8', () => {
    expect(calcularNivel([1, 1, 1, 1, 0]).level).toBe('moderado');
    expect(calcularNivel([2, 2, 2, 2, 0]).level).toBe('moderado');
    expect(calcularNivel([2, 2, 2, 2, 0]).score).toBe(8);
  });

  it('devuelve alto para puntuación 9–15', () => {
    expect(calcularNivel([2, 2, 2, 2, 1]).level).toBe('alto');
    expect(calcularNivel([3, 3, 3, 3, 3]).level).toBe('alto');
    expect(calcularNivel([3, 3, 3, 3, 3]).score).toBe(15);
  });

  it('calcula el score correctamente', () => {
    expect(calcularNivel([1, 2, 3, 0, 1]).score).toBe(7);
  });

  it('conserva los answers originales', () => {
    const input = [1, 2, 3, 0, 1];
    expect(calcularNivel(input).answers).toEqual(input);
  });

  it('clampea valores fuera de rango 0–3', () => {
    expect(calcularNivel([-1, 5, 2, 1, 1]).score).toBe(calcularNivel([0, 3, 2, 1, 1]).score);
  });
});
