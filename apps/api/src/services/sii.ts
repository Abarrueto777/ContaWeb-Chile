// Stub de integración con el SII (Servicio de Impuestos Internos de Chile)
// v1: no implementado — la estructura está lista para v2

export interface SiiEnvioPayload {
  rutEmisor: string;
  documentoId: string;
}

export interface SiiRespuesta {
  trackId?: string;
  estado: 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ERROR';
  glosa?: string;
}

export async function enviarDocumentoSii(_payload: SiiEnvioPayload): Promise<SiiRespuesta> {
  // TODO v2: implementar firma electrónica y envío al SII
  return { estado: 'ERROR', glosa: 'Integración SII no implementada en v1' };
}

export async function consultarEstadoSii(_trackId: string): Promise<SiiRespuesta> {
  // TODO v2: consultar estado del documento en el SII
  return { estado: 'ERROR', glosa: 'Integración SII no implementada en v1' };
}
