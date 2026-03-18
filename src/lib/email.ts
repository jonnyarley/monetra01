// Email Service usando Resend
import { Resend } from "resend"

// Inicializar Resend apenas se a chave estiver disponível
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ 
  to, 
  subject, 
  html,
  from 
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // Se não tiver Resend configurado, simular envio
  if (!resend) {
    console.log("=".repeat(60))
    console.log("EMAIL SERVICE (Dev Mode - Resend not configured)")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("HTML:", html.substring(0, 200) + "...")
    console.log("=".repeat(60))
    
    return { success: true }
  }

  try {
    const sender = from || process.env.EMAIL_FROM || "Monex <noreply@monex.app.br>"
    
    const { data, error } = await resend.emails.send({
      from: sender,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log("Email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

// Template de email para redefinição de senha
export function getPasswordResetEmailTemplate(
  resetUrl: string,
  userName?: string | null
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Monex</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #ca8a04); padding: 40px 40px 30px; text-align: center;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin-bottom: 20px;">
                <img src="https://monex.app.br/logo-small.svg" alt="Monex" style="width: 50px; height: 50px; margin: 5px;" />
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Redefinir Senha</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá${userName ? ` ${userName}` : ''},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Recebemos uma solicitação para redefinir sua senha do Monex. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ca8a04); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                Este link expira em <strong>1 hora</strong>. Se você não solicitou esta alteração, pode ignorar este email.
              </p>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #e5e7eb; margin: 30px 0;"></div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="color: #f59e0b; font-size: 14px; word-break: break-all; margin: 10px 0 0;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Monex - Gestão Financeira Inteligente
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0;">
                Este é um email automático, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Template de email de boas-vindas
export function getWelcomeEmailTemplate(
  userName: string,
  loginUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Monex!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #ca8a04); padding: 40px 40px 30px; text-align: center;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin-bottom: 20px;">
                <img src="https://monex.app.br/logo-small.svg" alt="Monex" style="width: 50px; height: 50px; margin: 5px;" />
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Bem-vindo ao Monex!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá ${userName}! 👋
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Parabéns por dar o primeiro passo rumo a uma vida financeira mais organizada! Sua conta foi criada com sucesso.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Você tem <strong style="color: #f59e0b;">14 dias grátis</strong> para experimentar todos os recursos do Monex!
              </p>
              
              <!-- Features -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #374151; font-size: 16px; margin: 0 0 15px;">O que você pode fazer agora:</h3>
                <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Registrar suas transações e gastos</li>
                  <li>Criar metas financeiras</li>
                  <li>Configurar orçamentos mensais</li>
                  <li>Conversar com a Tera IA para insights</li>
                  <li>Ver seu Mone Score</li>
                </ul>
              </div>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ca8a04); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Começar Agora
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Monex - Gestão Financeira Inteligente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
