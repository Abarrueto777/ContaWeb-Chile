const FROM = 'ContaCLWEB <noreply@contaclweb.cl>';

async function sendEmail(to: string, subject: string, html: string, devLogLabel: string, devUrl: string): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    console.log(`\n[${devLogLabel}] RESEND_API_KEY vacío — no se envía email.\n[${devLogLabel}] Link para ${to}:\n${devUrl}\n`);
    return;
  }
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  await resend.emails.send({ from: FROM, to, subject, html });
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
 * En dev (sin RESEND_API_KEY) no envía: loguea el link en consola para poder probar el flujo.
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
