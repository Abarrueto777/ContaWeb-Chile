import { z } from 'zod';

// RUT chileno — algoritmo módulo 11
function validarRut(rut: string): boolean {
  const limpio = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]!) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resultado = 11 - (suma % 11);
  const dvEsperado = resultado === 11 ? '0' : resultado === 10 ? 'K' : resultado.toString();

  return dv === dvEsperado;
}

export const rutSchema = z
  .string()
  .min(7, 'RUT demasiado corto')
  .max(12, 'RUT demasiado largo')
  .refine(validarRut, 'RUT chileno inválido');

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre demasiado corto'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMIN', 'CONTADOR', 'VISOR']).optional().default('CONTADOR'),
});

export const empresaSchema = z.object({
  rut: rutSchema,
  razonSocial: z.string().min(3, 'Razón social requerida'),
  giro: z.string().min(3, 'Giro requerido'),
  actividadEconomica: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

export const clienteSchema = z.object({
  rut: rutSchema,
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export const lineaDocumentoSchema = z.object({
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  precioUnitario: z.number().positive('Precio debe ser positivo'),
  descuento: z.number().min(0).max(100).default(0),
});

export const documentoSchema = z.object({
  clienteId: z.string().optional(),
  tipo: z.enum(['BOLETA_ELECTRONICA', 'FACTURA_ELECTRONICA', 'NOTA_CREDITO', 'NOTA_DEBITO']),
  fecha: z.coerce.date(),
  glosa: z.string().optional(),
  lineas: z.array(lineaDocumentoSchema).min(1, 'Al menos una línea requerida'),
});

export const lineaAsientoSchema = z.object({
  cuentaId: z.string().min(1, 'Cuenta requerida'),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
  glosa: z.string().optional(),
});

export const asientoSchema = z
  .object({
    fecha: z.coerce.date(),
    glosa: z.string().min(3, 'Glosa mínimo 3 caracteres'),
    lineas: z.array(lineaAsientoSchema).min(2, 'Mínimo 2 líneas'),
  })
  .refine(
    (data) => {
      const totalDebe = data.lineas.reduce((sum, l) => sum + l.debe, 0);
      const totalHaber = data.lineas.reduce((sum, l) => sum + l.haber, 0);
      return Math.abs(totalDebe - totalHaber) < 0.0001;
    },
    { message: 'La suma del Debe debe ser igual a la suma del Haber' }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type EmpresaInput = z.infer<typeof empresaSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type DocumentoInput = z.infer<typeof documentoSchema>;
export type AsientoInput = z.infer<typeof asientoSchema>;
