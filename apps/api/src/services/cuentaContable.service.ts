// Lógica de generación de códigos jerárquicos del Plan de Cuentas.
// El usuario nunca tipea el código: se deriva del padre para no romper el árbol.
//   Nivel 1: "1"        (sin padding)
//   Nivel 2: "1.1"      (sin padding)
//   Nivel 3+: "1.1.01"  (último segmento con 2 dígitos)

/**
 * Calcula el código del próximo hijo de una cuenta padre.
 * @param codigoPadre   código del padre, ej. "1.1"
 * @param nivelPadre    nivel del padre (el hijo será nivelPadre + 1)
 * @param codigosHijos  códigos de los hijos directos ya existentes
 */
export function calcularCodigoHijo(
  codigoPadre: string,
  nivelPadre: number,
  codigosHijos: string[],
): string {
  const nivelHijo = nivelPadre + 1;
  const prefijo = `${codigoPadre}.`;

  let max = 0;
  for (const codigo of codigosHijos) {
    if (!codigo.startsWith(prefijo)) continue;
    const ultimoSegmento = codigo.slice(prefijo.length).split('.')[0] ?? '';
    const n = parseInt(ultimoSegmento, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  const siguiente = max + 1;
  const segmento = nivelHijo <= 2 ? String(siguiente) : String(siguiente).padStart(2, '0');
  return `${codigoPadre}.${segmento}`;
}
