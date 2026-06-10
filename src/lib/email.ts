import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY is not defined in your environment variables. Emails will be logged to the console instead of being sent.')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendInviteEmail(email: string, inviteLink: string) {
  const subject = "You've been invited to join AI SEO Tracker"
  const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/1999/xhtml">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>You've been invited to join AI SEO Tracker</title>
  <style type="text/css">
    body {
      width: 100% !important;
      height: 100%;
      margin: 0;
      line-height: 1.6;
      background-color: #f8f7fa;
      color: #333333;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    a {
      color: #8b5cf6;
      text-decoration: none;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8f7fa;
      padding-bottom: 40px;
    }
    .content {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 40px;
      border: 1px solid #e9e8ef;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #0b0813 0%, #1a142c 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .logo-brand {
      color: #a78bfa;
      font-weight: 800;
    }
    .body {
      padding: 40px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1a1523;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    .text {
      font-size: 15px;
      color: #555060;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .button-container {
      margin-top: 32px;
      margin-bottom: 32px;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #8b5cf6;
      background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      font-weight: 600;
      font-size: 15px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
    }
    .footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #8f8b9a;
      line-height: 1.5;
    }
    .divider {
      border: 0;
      border-top: 1px solid #eae8f0;
      margin: 32px 0;
    }
    .note {
      font-size: 13px;
      color: #8f8b9a;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      <!-- Header Banner matching the App UI Theme -->
      <div class="header">
        <span class="logo-text"><span class="logo-brand">AI SEO</span> Tracker</span>
      </div>
      
      <!-- Email Body -->
      <div class="body">
        <h1 class="title">You've been invited!</h1>
        <p class="text">Hello,</p>
        <p class="text">
          You've been invited to join the <strong>AI SEO Tracker</strong> dashboard to help monitor and track brand visibility in AI-generated search results.
        </p>
        <p class="text">
          Click the button below to accept the invitation and set up your account credentials:
        </p>
        
        <div class="button-container">
          <a href="${inviteLink}" class="button" target="_blank">Accept Invitation</a>
        </div>
        
        <p class="text note">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
        
        <hr class="divider" />
        
        <p class="text" style="margin-bottom: 0; font-size: 13px; color: #8f8b9a;">
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Powered by <strong>AI SEO Tracker</strong></p>
      <p style="margin: 0;">This email was sent to ${email}</p>
    </div>
  </div>
</body>
</html>
`

  if (!resend) {
    console.log('\n--- MOCK EMAIL DELIVERED (Resend disabled) ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Invite Link: ${inviteLink}`)
    console.log('----------------------------------------------\n')
    return { success: true, mock: true }
  }

  try {
    const fromAddress = process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev'
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Failed to send email:', err)
    return { error: err.message || 'Unknown error' }
  }
}
