const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

// ─── Plantilla base HTML ──────────────────────────────────────────────────────
const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>SIGEP II</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,51,102,0.10);">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#003366 0%,#005599 100%);padding:32px 40px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <span style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:3px;">SIGEP</span><span style="font-size:24px;font-weight:900;color:#C8A84B;background:rgba(200,168,75,0.15);border-radius:5px;padding:2px 8px;margin-left:3px;">II</span>
      </td></tr>
      <tr><td align="center" style="padding-top:8px;">
        <span style="color:rgba(255,255,255,0.55);font-size:12px;letter-spacing:0.5px;">Sistema de Gestión del Empleo Público · República de Colombia</span>
      </td></tr></table>
    </td>
  </tr>

  <!-- CONTENIDO -->
  <tr><td style="padding:36px 40px;">${content}</td></tr>

  <!-- DIVIDER -->
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #E8EFF8;margin:0;"/></td></tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#F8FAFD;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#8A9BBE;">
        Departamento Administrativo de la Función Pública · Bogotá, Colombia
      </p>
      <p style="margin:0 0 4px;font-size:12px;color:#8A9BBE;">
        <a href="mailto:soportesigep2@funcionpublica.gov.co" style="color:#0057A8;text-decoration:none;">soportesigep2@funcionpublica.gov.co</a>
        &nbsp;·&nbsp; 601 7395656 Opción 2
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#B8C8DF;">
        Este correo es generado automáticamente. Por favor no responda este mensaje.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

// ─── Botón de acción reutilizable ─────────────────────────────────────────────
const actionButton = (href, label, color = '#003366') => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr><td align="center">
    <a href="${href}" style="display:inline-block;padding:14px 36px;background:${color};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.3px;">${label}</a>
  </td></tr>
</table>`;

// ─── HU-004: Bienvenida — credenciales iniciales ──────────────────────────────
const sendWelcomeEmail = async ({ email, documentType, documentNumber, tempPassword }) => {
    const loginUrl = `${FRONTEND_URL}/login`;

    const content = `
      <h2 style="color:#003366;font-size:22px;font-weight:800;margin:0 0 6px;">Bienvenido al SIGEP II</h2>
      <p style="color:#5A6A85;font-size:14px;margin:0 0 24px;line-height:1.6;">
        Ha sido registrado en el Sistema de Gestión del Empleo Público. A continuación encontrará sus credenciales de acceso al sistema.
      </p>

      <!-- Tabla de credenciales -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:20px;border:1px solid #E0E8F4;">
        <tr style="background:#003366;">
          <td style="padding:10px 18px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.8px;width:40%;">Campo</td>
          <td style="padding:10px 18px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.8px;">Valor</td>
        </tr>
        <tr style="background:#ffffff;">
          <td style="padding:13px 18px;font-size:13px;color:#5A6A85;font-weight:600;border-bottom:1px solid #F0F4FA;">Tipo de documento</td>
          <td style="padding:13px 18px;font-size:13px;color:#1A2B4A;font-weight:500;border-bottom:1px solid #F0F4FA;">${documentType}</td>
        </tr>
        <tr style="background:#F8FAFD;">
          <td style="padding:13px 18px;font-size:13px;color:#5A6A85;font-weight:600;border-bottom:1px solid #F0F4FA;">Número de documento</td>
          <td style="padding:13px 18px;font-size:13px;color:#1A2B4A;font-weight:500;border-bottom:1px solid #F0F4FA;">${documentNumber}</td>
        </tr>
        <tr style="background:#ffffff;">
          <td style="padding:13px 18px;font-size:13px;color:#5A6A85;font-weight:600;">Contraseña temporal</td>
          <td style="padding:13px 18px;">
            <span style="font-family:Courier New,monospace;font-size:20px;font-weight:900;color:#003366;background:#EBF2FF;padding:5px 14px;border-radius:6px;letter-spacing:2px;display:inline-block;">${tempPassword}</span>
          </td>
        </tr>
      </table>

      <!-- Advertencia -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="background:#FFF8E1;border-left:4px solid #C8A84B;border-radius:0 8px 8px 0;padding:13px 16px;">
            <p style="margin:0;font-size:13px;color:#5D4037;font-weight:700;">⚠️ Acción requerida al primer ingreso</p>
            <p style="margin:6px 0 0;font-size:13px;color:#6D4C41;line-height:1.5;">
              Por seguridad, el sistema le solicitará cambiar esta contraseña temporal en su primer ingreso.
              La contraseña debe tener mínimo 6 caracteres, incluir letras, números y un carácter especial.
            </p>
          </td>
        </tr>
      </table>

      ${actionButton(loginUrl, '🔐 Ingresar al SIGEP II')}

      <p style="margin:12px 0 0;font-size:12px;color:#A0B0C8;text-align:center;">
        O copie este enlace en su navegador: <a href="${loginUrl}" style="color:#0057A8;">${loginUrl}</a>
      </p>`;

    await createTransporter().sendMail({
      from:    `"SIGEP II — Función Pública" <${process.env.EMAIL_FROM}>`,
      to:      email,
      subject: 'SIGEP II — Sus credenciales de acceso al sistema',
      html:    baseHtml(content),
    });
    logger.info(`Welcome email sent to ${email}`);
};

// ─── HU-002: Recuperación de contraseña — DOBLE MECANISMO ────────────────────
const sendPasswordRecoveryEmail = async ({ email, tempPassword, resetToken, documentType, documentNumber }) => {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const loginUrl = `${FRONTEND_URL}/login`;

    const content = `
      <h2 style="color:#003366;font-size:22px;font-weight:800;margin:0 0 6px;">Recuperación de contraseña</h2>
      <p style="color:#5A6A85;font-size:14px;margin:0 0 24px;line-height:1.6;">
        Recibimos una solicitud para restablecer su contraseña de acceso al SIGEP II.
        Le ofrecemos <strong>dos opciones</strong> para completar el proceso.
      </p>

      <!-- OPCIÓN A: Botón de enlace -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:20px;border:1px solid #DCEEFF;">
        <tr style="background:#0057A8;">
          <td style="padding:12px 20px;">
            <span style="font-size:13px;font-weight:700;color:#ffffff;">✅ OPCIÓN A — Cambio directo (recomendado)</span>
          </td>
        </tr>
        <tr><td style="padding:20px;">
          <p style="margin:0 0 16px;font-size:14px;color:#1A2B4A;line-height:1.6;">
            Haga clic en el botón para ir directamente a la página de cambio de contraseña. El enlace es válido por <strong>1 hora</strong>.
          </p>
          ${actionButton(resetUrl, '🔑 Cambiar mi contraseña ahora', '#0057A8')}
          <p style="margin:8px 0 0;font-size:11px;color:#A0B0C8;text-align:center;">
            Enlace: <a href="${resetUrl}" style="color:#0057A8;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>
      </table>

      <!-- OPCIÓN B: Contraseña temporal -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:20px;border:1px solid #E8D5A3;">
        <tr style="background:#C8A84B;">
          <td style="padding:12px 20px;">
            <span style="font-size:13px;font-weight:700;color:#fff;">🔐 OPCIÓN B — Contraseña temporal (plan alternativo)</span>
          </td>
        </tr>
        <tr><td style="padding:20px;">
          <p style="margin:0 0 12px;font-size:14px;color:#1A2B4A;line-height:1.6;">
            Si el enlace no funciona, use esta contraseña temporal en la pantalla de inicio de sesión.
            El sistema le pedirá cambiarla al ingresar.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFD;border-radius:8px;border:1px solid #E0E8F4;margin-bottom:12px;">
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#5A6A85;font-weight:600;width:50%;border-bottom:1px solid #F0F4FA;">Tipo de documento</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A2B4A;border-bottom:1px solid #F0F4FA;">${documentType || 'El registrado en su cuenta'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#5A6A85;font-weight:600;border-bottom:1px solid #F0F4FA;">Número de documento</td>
              <td style="padding:12px 16px;font-size:13px;color:#1A2B4A;border-bottom:1px solid #F0F4FA;">${documentNumber || 'El registrado en su cuenta'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:13px;color:#5A6A85;font-weight:600;">Contraseña temporal</td>
              <td style="padding:12px 16px;">
                <span style="font-family:Courier New,monospace;font-size:20px;font-weight:900;color:#003366;background:#EBF2FF;padding:5px 14px;border-radius:6px;letter-spacing:2px;display:inline-block;">${tempPassword}</span>
              </td>
            </tr>
          </table>

          ${actionButton(loginUrl, 'Ir al inicio de sesión', '#003366')}
        </td></tr>
      </table>

      <!-- Aviso de seguridad -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#FFF3F3;border-left:4px solid #E53935;border-radius:0 8px 8px 0;padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#B71C1C;font-weight:700;">🔒 Aviso de seguridad</p>
            <p style="margin:5px 0 0;font-size:13px;color:#C62828;line-height:1.5;">
              Si usted <strong>no solicitó</strong> este cambio de contraseña, contacte inmediatamente al área de Talento Humano de su entidad
              o escríbanos a <a href="mailto:soportesigep2@funcionpublica.gov.co" style="color:#C62828;">soportesigep2@funcionpublica.gov.co</a>.
            </p>
          </td>
        </tr>
      </table>`;

    await createTransporter().sendMail({
      from:    `"SIGEP II — Función Pública" <${process.env.EMAIL_FROM}>`,
      to:      email,
      subject: 'SIGEP II — Recuperación de contraseña',
      html:    baseHtml(content),
    });
    logger.info(`Recovery email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send recovery email', { error: err.message, email });
  }
};

module.exports = { sendWelcomeEmail, sendPasswordRecoveryEmail };