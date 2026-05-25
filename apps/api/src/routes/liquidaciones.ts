import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { liquidacionInputSchema } from '@contaweb/validations';
import { calcularLiquidacion } from '../services/liquidacion.service';
import { createError } from '../middlewares/errorHandler';
import { generarLiquidacionPdf, type EmpresaDoc, type TrabajadorDoc } from '../services/htmlDocs.service';

const router = Router({ mergeParams: true });

router.get('/lre', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    if (!anio || !mes) return next(createError('Parámetros anio y mes requeridos', 400));

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return next(createError('Empresa no encontrada', 404));

    const liquidaciones = await prisma.liquidacion.findMany({
      where: { empresaId, anio: Number(anio), mes: Number(mes) },
      include: { trabajador: true },
      orderBy: { trabajador: { nombre: 'asc' } },
    });

    // Códigos AFP — Tabla N°9 del Manual LRE DT
    const AFP_COD: Record<string, string> = {
      PROVIDA: '6', PLANVITAL: '11', CUPRUM: '13', HABITAT: '14',
      UNO: '19', CAPITAL: '31', MODELO: '103',
    };
    // Códigos FONASA/ISAPRE — Tabla N°11 del Manual LRE DT
    const SALUD_COD: Record<string, string> = {
      CRUZ_BLANCA: '1', BANMEDICA: '3', COLMENA: '4', CONSALUD: '9',
      VIDA_TRES: '12', NUEVA_MASVIDA: '43', ESENCIAL: '44', FONASA: '102',
    };

    const HEADER = 'Rut trabajador(1101);Fecha inicio contrato(1102);Fecha término de contrato(1103);Causal término de contrato(1104);Región prestación de servicios(1105);Comuna prestación de servicios(1106);Tipo impuesto a la renta(1170);Técnico extranjero exención cot. previsionales(1146);Código tipo de jornada(1107);Persona con Discapacidad - Pensionado por Invalidez(1108);Pensionado por vejez(1109);AFP(1141);IPS (ExINP)(1142);FONASA - ISAPRE(1143);AFC(1151);CCAF(1110);Org. administrador ley 16.744(1152);Nro cargas familiares legales autorizadas(1111);Nro de cargas familiares maternales(1112);Nro de cargas familiares invalidez(1113);Tramo asignación familiar(1114);Rut org sindical 1(1171);Rut org sindical 2(1172);Rut org sindical 3(1173);Rut org sindical 4(1174);Rut org sindical 5(1175);Rut org sindical 6(1176);Rut org sindical 7(1177);Rut org sindical 8(1178);Rut org sindical 9(1179);Rut org sindical 10(1180);Nro días trabajados en el mes(1115);Nro días de licencia médica en el mes(1116);Nro días de vacaciones en el mes(1117);Subsidio trabajador joven(1118);Puesto Trabajo Pesado(1154);APVI(1155);APVC(1157);Indemnización a todo evento(1131);Tasa indemnización a todo evento(1132);Sueldo(2101);Sobresueldo(2102);Comisiones(2103);Semana corrida(2104);Participación(2105);Gratificación(2106);Recargo 30% día domingo(2107);Remun. variable pagada en vacaciones(2108);Remun. variable pagada en clausura(2109);Aguinaldo(2110);Bonos u otras remun. fijas mensuales(2111);Tratos(2112);Bonos u otras remun. variables mensuales o superiores a un mes(2113);Ejercicio opción no pactada en contrato(2114);Beneficios en especie constitutivos de remun(2115);Remuneraciones bimestrales(2116);Remuneraciones trimestrales(2117);Remuneraciones cuatrimestral(2118);Remuneraciones semestrales(2119);Remuneraciones anuales(2120);Participación anual(2121);Gratificación anual(2122);Otras remuneraciones superiores a un mes(2123);Pago por horas de trabajo sindical(2124);Sueldo empresarial (2161);Subsidio por incapacidad laboral por licencia médica(2201);Beca de estudio(2202);Gratificaciones de zona(2203);Otros ingresos no constitutivos de renta(2204);Colación(2301);Movilización(2302);Viáticos(2303);Asignación de pérdida de caja(2304);Asignación de desgaste herramienta(2305);Asignación familiar legal(2311);Gastos por causa del trabajo(2306);Gastos por cambio de residencia(2307);Sala cuna(2308);Asignación trabajo a distancia o teletrabajo(2309);Depósito convenido hasta UF 900(2347);Alojamiento por razones de trabajo(2310);Asignación de traslación(2312);Indemnización por feriado legal(2313);Indemnización años de servicio(2314);Indemnización sustitutiva del aviso previo(2315);Indemnización fuero maternal(2316);Pago indemnización a todo evento(2331);Indemnizaciones voluntarias tributables(2417);Indemnizaciones contractuales tributables(2418);Cotización obligatoria previsional (AFP o IPS)(3141);Cotización obligatoria salud 7%(3143);Cotización voluntaria para salud(3144);Cotización AFC - trabajador(3151);Cotizaciones técnico extranjero para seguridad social fuera de Chile(3146);Descuento depósito convenido hasta UF 900 anual(3147);Cotización APVi Mod A(3155);Cotización APVi Mod B hasta UF50(3156);Cotización APVc Mod A(3157);Cotización APVc Mod B hasta UF50(3158);Impuesto retenido por remuneraciones(3161);Impuesto retenido por indemnizaciones(3162);Mayor retención de impuestos solicitada por el trabajador(3163);Impuesto retenido por reliquidación remun. devengadas otros períodos(3164);Diferencia impuesto reliquidación remun. devengadas en este período(3165);Retención préstamo clase media 2020 (Ley 21.252) (3166);Rebaja zona extrema DL 889 (3167);Cuota sindical 1(3171);Cuota sindical 2(3172);Cuota sindical 3(3173);Cuota sindical 4(3174);Cuota sindical 5(3175);Cuota sindical 6(3176);Cuota sindical 7(3177);Cuota sindical 8(3178);Cuota sindical 9(3179);Cuota sindical 10(3180);Crédito social CCAF(3110);Cuota vivienda o educación(3181);Crédito cooperativas de ahorro(3182);Otros descuentos autorizados y solicitados por el trabajador(3183);Cotización adicional trabajo pesado - trabajador(3154);Donaciones culturales y de reconstrucción(3184);Otros descuentos(3185);Pensiones de alimentos(3186);Descuento mujer casada(3187);Descuentos por anticipos y préstamos(3188);AFC - Aporte empleador(4151);Aporte empleador seguro accidentes del trabajo y Ley SANNA(4152);Aporte empleador indemnización a todo evento(4131);Aporte adicional trabajo pesado - empleador(4154);Aporte empleador seguro invalidez y sobrevivencia(4155);APVC - Aporte Empleador(4157);Total haberes(5201);Total haberes imponibles y tributables(5210);Total haberes imponibles no tributables(5220);Total haberes no imponibles y no tributables(5230);Total haberes no imponibles y tributables(5240);Total descuentos(5301);Total descuentos impuestos a las remuneraciones(5361);Total descuentos impuestos por indemnizaciones(5362);Total descuentos por cotizaciones del trabajador(5341);Total otros descuentos(5302);Total aportes empleador(5410);Total líquido(5501);Total indemnizaciones(5502);Total indemnizaciones tributables(5564);Total indemnizaciones no tributables(5565)';

    const rows = liquidaciones.map((liq) => {
      const t = liq.trabajador;
      const imponible = Math.round(Number(liq.imponible));
      const noImponible = Math.round(Number(liq.movilizacion)) + Math.round(Number(liq.colacion));
      const cotizAfp = Math.round(Number(liq.cotizAfp));
      const cotizSalud = Math.round(Number(liq.cotizSalud));
      const cotizCes = Math.round(Number(liq.cotizCes));
      const cotizSis = Math.round(Number(liq.cotizSis)); // aporte empleador SIS
      const impuestoUnico = Math.round(Number(liq.impuestoUnico));
      const anticipo = Math.round(Number(liq.anticipo));

      // AFC empleador: 2.4% indefinido, 3.0% plazo fijo/obra
      const cesEmpleador = t.tieneCes
        ? Math.round(imponible * (t.tipoContrato === 'INDEFINIDO' ? 0.024 : 0.030))
        : 0;
      // Seguro accidentes del trabajo Ley 16.744 (OBLIGATORIO en LRE)
      const seguroAccidentes = Math.round(imponible * 0.0034);

      // Código AFC (1151): 0=no, 1=sí — Tabla N°12 del Manual LRE DT
      const afcCod = t.tieneCes ? '1' : '0';

      const totalCotizTrab = cotizAfp + cotizSalud + cotizCes;
      const totalDescuentos = totalCotizTrab + impuestoUnico + anticipo;
      const totalAportesEmp = cesEmpleador + cotizSis + seguroAccidentes;
      const totalHaberes = imponible + noImponible;

      const fi = new Date(t.fechaIngreso);
      const fechaIngreso = `${String(fi.getDate()).padStart(2,'0')}/${String(fi.getMonth()+1).padStart(2,'0')}/${fi.getFullYear()}`;

      return [
        /* 1101 */ t.rut,
        /* 1102 */ fechaIngreso,
        /* 1103 */ '',
        /* 1104 */ '',
        /* 1105 */ (t as typeof t & { region?: string | null }).region ?? '',
        /* 1106 */ (t as typeof t & { comuna?: string | null }).comuna ?? '',
        /* 1170 */ '2',
        /* 1146 */ '',
        /* 1107 */ Number(t.jornadaHoras) >= 30 ? '101' : '201',
        /* 1108 */ '0',
        /* 1109 */ '0',
        /* 1141 */ AFP_COD[t.afp] ?? '100',
        /* 1142 */ '0',
        /* 1143 */ SALUD_COD[t.salud] ?? '99',
        /* 1151 */ afcCod,
        /* 1110 */ '0',
        /* 1152 */ '0',
        /* 1111 */ '0',
        /* 1112 */ '0',
        /* 1113 */ '0',
        /* 1114 */ '',
        /* 1171-1180 sindicatos */ '', '', '', '', '', '', '', '', '', '',
        /* 1115 */ String(liq.diasTrabajados ?? 30),
        /* 1116 */ '0',
        /* 1117 */ '0',
        /* 1118 */ '0',
        /* 1154 */ '',
        /* 1155 */ '0',
        /* 1157 */ '0',
        /* 1131 */ '',
        /* 1132 */ '',
        /* 2101 */ Math.round(Number(liq.sueldoBase)),
        /* 2102 */ Math.round(Number(liq.horasExtra)),
        /* 2103 */ '0',
        /* 2104 */ '0',
        /* 2105 */ '0',
        /* 2106 */ Math.round(Number(liq.gratificacion)),
        /* 2107 */ '0',
        /* 2108 */ '0',
        /* 2109 */ '0',
        /* 2110 */ '0',
        /* 2111 */ Math.round(Number(liq.bono)),
        /* 2112 */ '0',
        /* 2113 */ '0',
        /* 2114 */ '0',
        /* 2115 */ '0',
        /* 2116 */ '0',
        /* 2117 */ '0',
        /* 2118 */ '0',
        /* 2119 */ '0',
        /* 2120 */ '0',
        /* 2121 */ '0',
        /* 2122 */ '0',
        /* 2123 */ '0',
        /* 2124 */ '0',
        /* 2161 */ '0',
        /* 2201 */ '0',
        /* 2202 */ '0',
        /* 2203 */ '0',
        /* 2204 */ '0',
        /* 2301 */ Math.round(Number(liq.colacion)),
        /* 2302 */ Math.round(Number(liq.movilizacion)),
        /* 2303 */ '0',
        /* 2304 */ '0',
        /* 2305 */ '0',
        /* 2311 */ '0',
        /* 2306 */ '0',
        /* 2307 */ '0',
        /* 2308 */ '0',
        /* 2309 */ '0',
        /* 2347 */ '0',
        /* 2310 */ '0',
        /* 2312 */ '0',
        /* 2313 */ '0',
        /* 2314 */ '0',
        /* 2315 */ '0',
        /* 2316 */ '0',
        /* 2331 */ '0',
        /* 2417 */ '0',
        /* 2418 */ '0',
        /* 3141 */ cotizAfp,
        /* 3143 */ cotizSalud,
        /* 3144 */ '0',
        /* 3151 */ cotizCes,
        /* 3146 */ '0',
        /* 3147 */ '0',
        /* 3155 */ '0',
        /* 3156 */ '0',
        /* 3157 */ '0',
        /* 3158 */ '0',
        /* 3161 */ impuestoUnico,
        /* 3162 */ '0',
        /* 3163 */ '0',
        /* 3164 */ '0',
        /* 3165 */ '0',
        /* 3166 */ '0',
        /* 3167 */ '0',
        /* 3171-3180 cuotas sindicales */ '0', '0', '0', '0', '0', '0', '0', '0', '0', '0',
        /* 3110 */ '0',
        /* 3181 */ '0',
        /* 3182 */ '0',
        /* 3183 */ '0',
        /* 3154 */ '0',
        /* 3184 */ '0',
        /* 3185 */ '0',
        /* 3186 */ '0',
        /* 3187 */ '0',
        /* 3188 */ anticipo,
        /* 4151 */ cesEmpleador,
        /* 4152 */ seguroAccidentes,
        /* 4131 */ '0',
        /* 4154 */ '0',
        /* 4155 */ cotizSis,
        /* 4157 */ '0',
        /* 5201 */ totalHaberes,
        /* 5210 */ imponible,
        /* 5220 */ '0',
        /* 5230 */ noImponible,
        /* 5240 */ '0',
        /* 5301 */ totalDescuentos,
        /* 5361 */ impuestoUnico,
        /* 5362 */ '0',
        /* 5341 */ totalCotizTrab,
        /* 5302 */ anticipo,
        /* 5410 */ totalAportesEmp,
        /* 5501 */ Math.round(Number(liq.liquido)),
        /* 5502 */ '0',
        /* 5564 */ '0',
        /* 5565 */ '0',
      ].join(';');
    });

    const mesPad = String(mes).padStart(2, '0');
    const csv = [HEADER, ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="LRE_${empresa.rut}_${anio}_${mesPad}.csv"`);
    res.send('﻿' + csv);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const where: Record<string, unknown> = { empresaId };
    if (anio) where['anio'] = Number(anio);
    if (mes) where['mes'] = Number(mes);
    const liquidaciones = await prisma.liquidacion.findMany({
      where,
      include: { trabajador: true },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    res.json({ data: liquidaciones });
  } catch {
    res.status(500).json({ error: 'Error al obtener liquidaciones' });
  }
});

router.post('/calcular', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const resultado = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    res.json({ data: resultado });
  } catch {
    res.status(500).json({ error: 'Error al calcular liquidación' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const calc = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    const liquidacion = await prisma.liquidacion.create({
      data: { empresaId, trabajadorId: parsed.data.trabajadorId, anio: parsed.data.anio, mes: parsed.data.mes, ...calc },
      include: { trabajador: true },
    });
    res.status(201).json({ data: liquidacion });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'P2002') {
      return void res.status(409).json({ error: 'Ya existe una liquidación para este trabajador en el período' });
    }
    res.status(500).json({ error: 'Error al guardar liquidación' });
  }
});

router.get('/:liquidacionId/pdf', async (req, res) => {
  try {
    const { empresaId, liquidacionId } = req.params as { empresaId: string; liquidacionId: string };
    const [liq, empresa] = await Promise.all([
      prisma.liquidacion.findFirst({ where: { id: liquidacionId, empresaId }, include: { trabajador: true } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);
    if (!liq || !empresa) return void res.status(404).json({ error: 'No encontrado' });

    const t = liq.trabajador;
    const empresaDoc: EmpresaDoc = {
      razonSocial: empresa.razonSocial,
      rut: empresa.rut,
      giro: empresa.giro,
      direccion: empresa.direccion,
      representanteLegal: (empresa as typeof empresa & { representanteLegal?: string | null }).representanteLegal,
      rutRepresentante: (empresa as typeof empresa & { rutRepresentante?: string | null }).rutRepresentante,
    };
    const trabDoc: TrabajadorDoc = {
      nombre: t.nombre,
      rut: t.rut,
      cargo: t.cargo,
      sueldoBase: Number(t.sueldoBase),
      fechaIngreso: t.fechaIngreso,
      jornadaHoras: t.jornadaHoras,
      tipoContrato: t.tipoContrato,
      afp: t.afp,
      salud: t.salud,
      pctSalud: Number(t.pctSalud),
      tipoGratificacion: t.tipoGratificacion,
      tieneCes: t.tieneCes,
      tieneMovilizacion: t.tieneMovilizacion,
      tieneColacion: t.tieneColacion,
    };
    const liqDoc = {
      anio: liq.anio,
      mes: liq.mes,
      sueldoBase: Number(liq.sueldoBase),
      horasExtra: Number(liq.horasExtra),
      bono: Number(liq.bono),
      gratificacion: Number(liq.gratificacion),
      imponible: Number(liq.imponible),
      cotizAfp: Number(liq.cotizAfp),
      cotizSis: Number(liq.cotizSis),
      cotizSalud: Number(liq.cotizSalud),
      cotizCes: Number(liq.cotizCes),
      impuestoUnico: Number(liq.impuestoUnico),
      movilizacion: Number(liq.movilizacion),
      colacion: Number(liq.colacion),
      anticipo: Number(liq.anticipo),
      liquido: Number(liq.liquido),
      costoEmpleador: Number(liq.costoEmpleador),
    };

    const html = generarLiquidacionPdf(empresaDoc, trabDoc, liqDoc);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

router.put('/:liquidacionId', async (req, res, next) => {
  try {
    const { empresaId, liquidacionId } = req.params as { empresaId: string; liquidacionId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return next(createError('Datos inválidos', 400));
    const liq = await prisma.liquidacion.findFirst({ where: { id: liquidacionId, empresaId } });
    if (!liq) return next(createError('Liquidación no encontrada', 404));
    const trabajador = await prisma.trabajador.findFirst({ where: { id: liq.trabajadorId, empresaId } });
    if (!trabajador) return next(createError('Trabajador no encontrado', 404));
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const calc = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    const updated = await prisma.liquidacion.update({
      where: { id: liquidacionId },
      data: { ...calc },
      include: { trabajador: true },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/:liquidacionId/pagar', async (req, res) => {
  try {
    const liq = await prisma.liquidacion.update({ where: { id: req.params['liquidacionId'] }, data: { pagada: true } });
    res.json({ data: liq });
  } catch {
    res.status(500).json({ error: 'Error al marcar pagada' });
  }
});

router.delete('/:liquidacionId', async (req, res) => {
  try {
    await prisma.liquidacion.delete({ where: { id: req.params['liquidacionId'] } });
    res.json({ message: 'Liquidación eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar liquidación' });
  }
});

export default router;
