// Transporte de email: Brevo (API transaccional v3) vía fetch nativo (Node 18+).
// En dev (sin BREVO_API_KEY) no envía: loguea el link en consola para poder probar el flujo.
const FROM_EMAIL = process.env['EMAIL_FROM'] ?? 'noreply@contaclweb.cl';
const FROM_NAME = process.env['EMAIL_FROM_NAME'] ?? 'ContaCLWEB';

// Los valores que vienen del usuario (nombre, email) se escapan antes de
// interpolarse en el HTML: un nombre como "<a href=...>" no debe inyectar markup.
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendEmail(to: string, subject: string, html: string, devLogLabel: string, devUrl: string): Promise<void> {
  const apiKey = process.env['BREVO_API_KEY'];
  if (!apiKey) {
    console.log(`\n[${devLogLabel}] BREVO_API_KEY vacío — no se envía email.\n[${devLogLabel}] Link para ${to}:\n${devUrl}\n`);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`Brevo respondió ${res.status}: ${detalle}`);
  }
}

/**
 * Avisa al admin (EMAIL_FROM) que un usuario solicitó activar un plan.
 * El usuario ya transfirió (o va a transferir): activar desde /admin/usuarios.
 */
export async function sendSolicitudPlanEmail(nombre: string, email: string, plan: string): Promise<void> {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">Solicitud de plan ${plan}</h2>
      <p><strong>${esc(nombre)}</strong> (${esc(email)}) solicitó activar el plan <strong>${plan}</strong> de ContaCLWEB.</p>
      <p>Verifica la transferencia y activa su suscripción desde el panel de administración (/admin/usuarios).</p>
    </div>
  `;
  await sendEmail(FROM_EMAIL, `Solicitud de plan ${plan} — ${email}`, html, 'solicitud-plan', `${nombre} <${email}> pidió plan ${plan}`);
}

/**
 * Confirma al cliente que su plan quedó activo (lo dispara el admin al activar).
 * Con `correccion: true` el correo reconoce el error anterior y aclara el plan correcto
 * (para cuando el admin activó mal, quitó la suscripción y volvió a activar).
 */
export async function sendPlanActivadoEmail(to: string, nombre: string, plan: string, hasta: Date, correccion = false): Promise<void> {
  const fecha = hasta.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const cuerpo = correccion
    ? `
      <p>Hola ${esc(nombre)}, te escribimos para corregir un error: el correo anterior sobre tu plan no era el correcto. Disculpa la confusión.</p>
      <p>Tu plan contratado es el <strong>${plan}</strong>, y ya quedó activo correctamente.</p>`
    : `
      <p>Hola ${esc(nombre)}, confirmamos tu pago y activamos tu plan <strong>${plan}</strong> de ContaCLWEB.</p>`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">${correccion ? `Corrección: tu plan es el ${plan}` : `¡Tu plan ${plan} está activo!`}</h2>
      ${cuerpo}
      <p>Tu suscripción está vigente hasta el <strong>${fecha}</strong>.</p>
      <p>Ya puedes seguir trabajando normalmente. ¡Gracias por confiar en ContaCLWEB!</p>
      <p style="font-size: 13px; color: #64748b;">Si tienes alguna duda, responde este correo.</p>
    </div>
  `;
  const asunto = correccion ? `Corrección: tu plan ${plan} está activo — ContaCLWEB` : `Tu plan ${plan} está activo — ContaCLWEB`;
  await sendEmail(to, asunto, html, 'plan-activado', `plan ${plan}${correccion ? ' (corrección)' : ''} hasta ${fecha} para ${to}`);
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">Confirma tu email</h2>
      <p>¡Bienvenido a ContaCLWEB! Confirma tu dirección de correo para activar tu cuenta.</p>
      <p style="margin: 28px 0;">
        <a href="${verifyUrl}" style="background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Confirmar email
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Si no creaste esta cuenta, ignora este correo.</p>
    </div>
  `;
  await sendEmail(to, 'Confirma tu email — ContaCLWEB', html, 'verify-email', verifyUrl);
}

/**
 * Envía el correo de recuperación de contraseña.
 * En dev (sin BREVO_API_KEY) no envía: loguea el link en consola para poder probar el flujo.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">Recupera tu contraseña</h2>
      <p>Recibimos un pedido para restablecer la contraseña de tu cuenta en ContaCLWEB.</p>
      <p>Haz clic en el botón para elegir una nueva contraseña. El enlace vence en 1 hora.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Si no pediste esto, ignora este correo: tu contraseña sigue igual.</p>
    </div>
  `;
  await sendEmail(to, 'Recupera tu contraseña — ContaCLWEB', html, 'password-reset', resetUrl);
}
