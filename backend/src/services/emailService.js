const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

/**
 * Envía credenciales iniciales al nuevo servidor público (HU-004)
 */
const sendWelcomeEmail = async ({ email, documentType, documentNumber, tempPassword }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SIGEP II" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Bienvenido al Sistema SIGEP II — Credenciales de Acceso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #003366; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">SIGEP II</h1>
            <p style="color: #a8c4e0; margin: 4px 0 0;">Sistema de Gestión de Empleo Público</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #003366;">Sus credenciales de acceso</h2>
            <p>Ha sido registrado en el sistema. A continuación sus datos de acceso:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; background: #f5f5f5; font-weight: bold; width: 40%;">Tipo de documento</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${documentType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Número de documento</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0;">${documentNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Contraseña temporal</td>
                <td style="padding: 10px; border: 1px solid #e0e0e0; font-family: monospace; font-size: 16px; color: #003366;"><strong>${tempPassword}</strong></td>
              </tr>
            </table>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
              <strong>⚠️ Importante:</strong> Por seguridad, debe cambiar su contraseña en el primer ingreso al sistema.
            </div>
            <p style="color: #666; font-size: 13px;">Si tiene dudas, comuníquese con el Jefe de Talento Humano de su entidad.</p>
          </div>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            Departamento Administrativo de la Función Pública — Colombia
          </div>
        </div>
      `,
    });
    logger.info(`Welcome email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send welcome email', { error: err.message, email });
  }
};

/**
 * Envía contraseña temporal para recuperación (HU-002)
 */
const sendPasswordRecoveryEmail = async ({ email, tempPassword }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SIGEP II" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'SIGEP II — Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #003366; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">SIGEP II</h1>
            <p style="color: #a8c4e0; margin: 4px 0 0;">Sistema de Gestión de Empleo Público</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #003366;">Recuperación de Contraseña</h2>
            <p>Se ha generado una contraseña temporal para su cuenta:</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="font-family: monospace; font-size: 24px; background: #f0f4ff; padding: 12px 24px; border-radius: 6px; color: #003366; letter-spacing: 2px;"><strong>${tempPassword}</strong></span>
            </div>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
              <strong>⚠️ Esta contraseña expira en 24 horas.</strong> Deberá cambiarla al ingresar al sistema.
            </div>
            <p style="color: #666; font-size: 13px;">Si usted no solicitó este cambio, comuníquese inmediatamente con el área de Talento Humano.</p>
          </div>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            Departamento Administrativo de la Función Pública — Colombia
          </div>
        </div>
      `,
    });
    logger.info(`Recovery email sent to ${email}`);
  } catch (err) {
    logger.error('Failed to send recovery email', { error: err.message, email });
  }
};

module.exports = { sendWelcomeEmail, sendPasswordRecoveryEmail };