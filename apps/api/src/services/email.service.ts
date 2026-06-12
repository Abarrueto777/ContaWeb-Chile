// Transporte de email: Brevo (API transaccional v3) vía fetch nativo (Node 18+).
// En dev (sin BREVO_API_KEY) no envía: loguea el link en consola para poder probar el flujo.
const FROM_EMAIL = process.env['EMAIL_FROM'] ?? 'noreply@contaclweb.cl';
const FROM_NAME = process.env['EMAIL_FROM_NAME'] ?? 'ContaCLWEB';

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
      <p><strong>${nombre}</strong> (${email}) solicitó activar el plan <strong>${plan}</strong> de ContaCLWEB.</p>
      <p>Verificá la transferencia y activá su suscripción desde el panel de administración (/admin/usuarios).</p>
    </div>
  `;
  await sendEmail(FROM_EMAIL, `Solicitud de plan ${plan} — ${email}`, html, 'solicitud-plan', `${nombre} <${email}> pidió plan ${plan}`);
}

/**
 * Confirma al cliente que su plan quedó activo (lo dispara el admin al activar).
 */
export async function sendPlanActivadoEmail(to: string, nombre: string, plan: string, hasta: Date): Promise<void> {
  const fecha = hasta.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">¡Tu plan ${plan} está activo!</h2>
      <p>Hola ${nombre}, confirmamos tu pago y activamos tu plan <strong>${plan}</strong> de ContaCLWEB.</p>
      <p>Tu suscripción está vigente hasta el <strong>${fecha}</strong>.</p>
      <p>Ya podés seguir trabajando normalmente. ¡Gracias por confiar en ContaCLWEB!</p>
      <p style="font-size: 13px; color: #64748b;">Si tenés alguna duda, respondé este correo.</p>
    </div>
  `;
  await sendEmail(to, `Tu plan ${plan} está activo — ContaCLWEB`, html, 'plan-activado', `plan ${plan} hasta ${fecha} para ${to}`);
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">Confirmá tu email</h2>
      <p>¡Bienvenido a ContaCLWEB! Confirmá tu dirección de correo para activar tu cuenta.</p>
      <p style="margin: 28px 0;">
        <a href="${verifyUrl}" style="background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Confirmar email
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Si no creaste esta cuenta, ignorá este correo.</p>
    </div>
  `;
  await sendEmail(to, 'Confirmá tu email — ContaCLWEB', html, 'verify-email', verifyUrl);
}

/**
 * Envía el correo de recuperación de contraseña.
 * En dev (sin BREVO_API_KEY) no envía: loguea el link en consola para poder probar el flujo.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #059669;">Recuperá tu contraseña</h2>
      <p>Recibimos un pedido para restablecer la contraseña de tu cuenta en ContaCLWEB.</p>
      <p>Hacé clic en el botón para elegir una nueva contraseña. El enlace vence en 1 hora.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background: #059669; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Si no pediste esto, ignorá este correo: tu contraseña sigue igual.</p>
    </div>
  `;
  await sendEmail(to, 'Recuperá tu contraseña — ContaCLWEB', html, 'password-reset', resetUrl);
}
