// Backup of original email base template
export const ORIGINAL_BASE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{headerTitle}}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
    }
    .header { 
      background-color: {{headerColor}}; 
      color: white; 
      padding: 20px; 
      text-align: center; 
    }
    .header .logo {
      margin-bottom: 15px;
    }
    .header .logo img {
      max-height: 80px;
      max-width: 300px;
      height: auto;
      width: auto;
    }
    .header h1 { 
      margin: 0 0 5px 0; 
      font-size: 24px; 
      font-weight: bold; 
    }
    .header p { 
      margin: 0; 
      font-size: 14px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 30px; 
    }
    .greeting { 
      font-size: 18px; 
      font-weight: 600; 
      margin-bottom: 15px; 
    }
    .intro-text { 
      margin-bottom: 25px; 
      font-size: 16px; 
    }
    .section { 
      margin: 20px 0; 
      padding: 15px; 
      border-left: 4px solid #e5e7eb; 
    }
    .section.info { 
      background-color: #f0f9ff; 
      border-left-color: #0891b2; 
    }
    .section.success { 
      background-color: #f0fdf4; 
      border-left-color: #059669; 
    }
    .section.warning { 
      background-color: #fef3c7; 
      border-left-color: #f59e0b; 
    }
    .section.error { 
      background-color: #fee2e2; 
      border-left-color: #dc2626; 
    }
    .section.default { 
      background-color: #f8fafc; 
      border-left-color: #2563eb; 
    }
    .section-title { 
      font-size: 16px; 
      font-weight: 600; 
      margin: 0 0 10px 0; 
      display: flex; 
      align-items: center; 
      gap: 8px; 
    }
    .section-content { 
      font-size: 14px; 
      margin: 0; 
    }
    .section-content p { 
      margin: 8px 0; 
    }
    .section-content ul { 
      margin: 8px 0; 
      padding-left: 20px; 
    }
    .action-button { 
      display: inline-block; 
      background-color: {{buttonColor}}; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 20px 0; 
      font-weight: 600; 
    }
    .footer { 
      background-color: #f8fafc; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
    .footer p { 
      margin: 5px 0; 
    }
    .divider { 
      height: 1px; 
      background-color: #e5e7eb; 
      margin: 20px 0; 
    }
    @media only screen and (max-width: 600px) {
      .container { 
        width: 100% !important; 
      }
      .content { 
        padding: 20px !important; 
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{emailLogo}}
      {{emailAppName}}
      {{emailSlogan}}
      <h1>{{headerTitle}}</h1>
      <p>{{headerSubtitle}}</p>
    </div>
    
    <div class="content">
      <div class="greeting">{{greeting}}</div>
      
      <div class="intro-text">{{introText}}</div>
      
      {{sections}}
      
      {{actionButton}}
      
      <div class="divider"></div>
      
      <p>{{footerText}}</p>
    </div>
    
    <div class="footer">
      <p>{{disclaimerText}}</p>
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>
`