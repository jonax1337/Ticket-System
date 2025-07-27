# Ticket Automation Service

This document describes the ticket automation service that automatically closes inactive tickets after a specified period.

## Features

- **Automatic Ticket Closure**: Closes tickets after 14 days (configurable) of customer inactivity
- **Warning Notifications**: Sends warning emails to customers 7 days (configurable) before auto-closure
- **Email Notifications**: Professional email notifications to customers
- **Internal Notifications**: Notifications to assigned support staff
- **Activity Detection**: Distinguishes between customer and internal team activity
- **System Comments**: Adds system comments when tickets are auto-closed
- **Configurable Settings**: All timing and behavior can be configured via environment variables

## How It Works

### Activity Detection
The service considers a ticket "inactive" when:
- No external comments (customer replies) have been added recently
- The ticket hasn't been updated by customer email
- Only internal team comments are present

### Processing Flow
1. **Scanning**: Every hour (configurable), the service scans for inactive tickets
2. **Warning Phase**: Tickets inactive for 7 days receive warning notifications
3. **Auto-Close Phase**: Tickets inactive for 14 days are automatically closed
4. **Notifications**: Both customers and assigned staff are notified at each step

### Email Notifications
- **Warning Email**: Sent to customers 7 days before auto-closure
- **Auto-Close Email**: Sent to customers when ticket is closed
- **Internal Notifications**: Sent to assigned support staff via the notification system

## Configuration

Configure the automation service using environment variables:

```bash
# Enable/disable the automation service
TICKET_AUTOMATION_ENABLED=true

# Days before sending warning notification
TICKET_AUTOMATION_WARNING_DAYS=7

# Days before auto-closing ticket
TICKET_AUTOMATION_CLOSE_DAYS=14

# Check interval in minutes
TICKET_AUTOMATION_CHECK_INTERVAL=60
```

## API Endpoints

### Manual Trigger
Manually trigger automation processing:
```
GET/POST /api/cron/automation
```

Optional authentication with `Authorization: Bearer YOUR_CRON_SECRET` header.

### Status Check
Check automation service status:
```
GET /api/admin/automation/status
```

Returns:
```json
{
  "success": true,
  "automation": {
    "isRunning": true,
    "config": {
      "enabled": true,
      "daysUntilWarning": 7,
      "daysUntilAutoClose": 14,
      "checkIntervalMinutes": 60
    },
    "hasInterval": true
  },
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

## Customer Email Templates

### Warning Email Template
```
Dear [Customer Name],

This is an automated notification regarding your support ticket.

Ticket: [Ticket Number]
Subject: [Ticket Subject]

Your ticket will be automatically closed in [X] days due to inactivity. 

If you still need assistance with this issue, please reply to this email or log into the support portal to add a comment to your ticket.

If your issue has been resolved, no action is needed and the ticket will be closed automatically.

Thank you for using our support system.

Best regards,
Support Team
```

### Auto-Close Email Template
```
Dear [Customer Name],

This is an automated notification regarding your support ticket.

Ticket: [Ticket Number]
Subject: [Ticket Subject]

Your ticket has been automatically closed due to [X] days of inactivity from your side.

If you still need assistance with this issue, please create a new support ticket or reply to this email.

Thank you for using our support system.

Best regards,
Support Team
```

## Internal Notifications

Support staff receive internal notifications when:
- A ticket is scheduled for auto-closure (warning phase)
- A ticket has been auto-closed

## Safety Features

- **Error Handling**: Comprehensive error handling to prevent service crashes
- **Conservative Approach**: When in doubt, the service errs on the side of not closing tickets
- **Activity Verification**: Double-checks for recent customer activity before taking action
- **Duplicate Prevention**: Prevents sending duplicate warning notifications
- **Graceful Failures**: Individual ticket processing failures don't stop the entire process

## Startup and Integration

The automation service:
- Starts automatically when the application loads
- Integrates with the existing email service for notifications
- Uses the existing notification system for internal alerts
- Follows the same patterns as the email cron service

## Monitoring and Logs

The service logs important events:
- Startup and configuration loading
- Ticket processing results
- Warning and auto-close actions
- Errors and failures

Check your application logs for messages prefixed with automation-related keywords.

## Production Deployment

1. **Environment Setup**: Configure environment variables
2. **Email Configuration**: Ensure at least one active email configuration for sending notifications
3. **Testing**: Use the manual trigger endpoint to test functionality
4. **Monitoring**: Monitor logs for proper operation
5. **External Cron**: Optionally set up external cron jobs to call the trigger endpoint

## Security

- Optional authentication for cron endpoints using `CRON_SECRET`
- No sensitive data exposed in API responses
- Safe error handling without exposing internal details

## Troubleshooting

### Service Not Running
- Check environment variable `TICKET_AUTOMATION_ENABLED`
- Verify application startup logs
- Use status endpoint to check service state

### Emails Not Sending
- Verify active email configuration exists
- Check email service logs
- Test email functionality separately

### Tickets Not Being Processed
- Check logs for processing errors
- Verify ticket activity detection logic
- Use manual trigger to test processing

### Performance Issues
- Adjust `TICKET_AUTOMATION_CHECK_INTERVAL` for less frequent checks
- Monitor database query performance
- Consider adding indexes for ticket queries if needed