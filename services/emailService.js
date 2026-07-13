const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// manda o link de confirmacao - quem chama decide o que fazer se der erro
// (o cadastro nao pode travar so porque o resend falhou)
async function enviarEmailVerificacao(email, token) {
  const link = `${FRONTEND_URL}/verificar?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Confirme seu e-mail - PesoMax",
    html: `
      <p>Falta pouco para ativar sua conta no PesoMax.</p>
      <p><a href="${link}">${link}</a></p>
      <p>Esse link expira em 24 horas. Se você não pediu esse cadastro, ignore este e-mail.</p>
    `,
  });
}

module.exports = { enviarEmailVerificacao };
