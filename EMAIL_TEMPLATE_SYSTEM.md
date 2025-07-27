# Email Template System Documentation

## Overview

The Email Template System provides a comprehensive solution for sending customizable, professional HTML emails for different ticket actions. It replaces simple text emails with rich, branded templates that can be fully customized by administrators.

## Features

### Template Types
The system supports four main template types:

1. **Ticket Created** (`ticket_created`)
   - Sent when a new ticket is created from an email
   - Confirms receipt and provides ticket details
   
2. **Status Changed** (`status_changed`)
   - Sent when a ticket status is updated
   - Shows previous and new status with change details
   
3. **Comment Added** (`comment_added`)
   - Sent when a new comment is added to a ticket
   - Includes the comment content and author information
   
4. **Participant Added** (`participant_added`)
   - Sent when someone is added as a participant to a ticket
   - Provides context about the ticket and participation details

### Template Variables

The system includes 25+ variables that can be used in templates:

#### Ticket Information
- `{{ticketNumber}}` - Unique ticket identifier (e.g., T-123456)
- `{{ticketSubject}}` - Subject/title of the ticket
- `{{ticketDescription}}` - Original ticket description/content
- `{{ticketStatus}}` - Current status of the ticket
- `{{ticketPriority}}` - Priority level of the ticket
- `{{ticketCreatedAt}}` - When the ticket was created
- `{{ticketUpdatedAt}}` - When the ticket was last updated
- `{{ticketUrl}}` - Direct link to view the ticket

#### User/Customer Information
- `{{customerName}}` - Name of the ticket creator/customer
- `{{customerEmail}}` - Email of the ticket creator/customer
- `{{assignedToName}}` - Name of the assigned support agent
- `{{assignedToEmail}}` - Email of the assigned support agent
- `{{actorName}}` - Name of the person who performed the action
- `{{actorEmail}}` - Email of the person who performed the action

#### Status Change Specific
- `{{previousStatus}}` - Previous status before the change
- `{{newStatus}}` - New status after the change
- `{{statusChangeReason}}` - Optional reason for status change

#### Comment Specific
- `{{commentContent}}` - Content of the new comment
- `{{commentAuthor}}` - Name of the comment author
- `{{commentCreatedAt}}` - When the comment was posted

#### Participant Specific
- `{{participantName}}` - Name of the participant being added
- `{{participantEmail}}` - Email of the participant being added
- `{{participantType}}` - Type of participant (creator, cc, added_manually)

#### System Information
- `{{systemName}}` - Name of the support system
- `{{supportEmail}}` - Main support email address
- `{{supportUrl}}` - URL to the support system
- `{{unsubscribeUrl}}` - URL to unsubscribe from notifications

#### Additional Context
- `{{additionalNotes}}` - Any additional notes or context
- `{{currentDate}}` - Current date when email is sent
- `{{currentTime}}` - Current time when email is sent

## Database Schema

### EmailTemplate Model
```sql
model EmailTemplate {
  id          String   @id @default(cuid())
  type        String   // Template type identifier
  name        String   // Display name for the template
  subject     String   // Email subject with variables
  htmlContent String   // HTML email content with variables
  textContent String?  // Plain text fallback (optional)
  isDefault   Boolean  // Mark as default system template
  isActive    Boolean  // Enable/disable template
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([type, isDefault]) // Only one default template per type
}
```

## API Endpoints

### Template Management
- `GET /api/admin/email-templates` - List all templates
- `POST /api/admin/email-templates` - Create new template
- `GET /api/admin/email-templates/[id]` - Get specific template
- `PUT /api/admin/email-templates/[id]` - Update template
- `DELETE /api/admin/email-templates/[id]` - Delete template
- `POST /api/admin/email-templates/[id]/preview` - Preview template with sample data
- `POST /api/admin/email-templates/init` - Initialize default templates

## Admin Interface

### Template Management UI
Located in Admin → Templates tab:

1. **Template List**: Shows all templates grouped by type
2. **Template Editor**: Rich editor with:
   - HTML content editor
   - Plain text editor
   - Variable insertion helper
   - Live preview functionality
3. **Template Actions**:
   - Create new templates
   - Edit existing templates
   - Duplicate templates
   - Preview with sample data
   - Delete custom templates

### Template Editor Features
- Syntax highlighting for HTML
- Variable insertion with descriptions
- Real-time preview with sample data
- Support for both HTML and plain text content
- Template activation/deactivation

## Integration Points

### Email Service Integration
The email service (`src/lib/email-service.ts`) has been updated to:

1. **Template Priority**: Try templated emails first, fallback to legacy
2. **Automatic Integration**: Templates are used automatically for:
   - Ticket creation notifications
   - Status change notifications
   - Comment notifications
   - Participant notifications

### Function: `sendTemplatedEmail()`
```typescript
interface SendTemplatedEmailOptions {
  templateType: EmailTemplateType
  to: string
  toName?: string
  ticketId: string
  variables?: Record<string, unknown>
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}
```

### Template Rendering
The template engine (`src/lib/email-template-service.ts`) provides:

1. **Variable Replacement**: Safe variable substitution with `{{variable}}` syntax
2. **Template Resolution**: Automatic fallback from custom to default templates
3. **System Variables**: Automatic injection of system-wide variables
4. **Error Handling**: Graceful fallback when templates are unavailable

## Default Templates

The system includes professional default templates with:

1. **Responsive Design**: Mobile-friendly email layouts
2. **Professional Styling**: Clean, modern appearance
3. **Brand Consistency**: Consistent styling across all template types
4. **Rich Content**: Comprehensive use of available variables

### Template Structure
Each default template includes:
- Responsive HTML layout
- Professional header with system branding
- Content sections with proper styling
- Footer with unsubscribe and contact information
- Plain text version for accessibility

## Security Features

1. **Admin Only Access**: Template management restricted to admin users
2. **Template Validation**: Input validation for template content
3. **XSS Prevention**: Safe variable replacement without code injection
4. **Default Protection**: Default templates cannot be edited or deleted

## Usage Examples

### Creating a Custom Template
1. Navigate to Admin → Templates
2. Click "Create Template"
3. Select template type
4. Enter name and subject
5. Design HTML content using variables
6. Preview with sample data
7. Save and activate

### Using Variables in Templates
```html
<h2>Hello {{customerName}},</h2>
<p>Your ticket {{ticketNumber}} has been updated.</p>
<p><strong>Status:</strong> {{ticketStatus}}</p>
<p><strong>Priority:</strong> {{ticketPriority}}</p>
```

### Customizing System Information
System variables are automatically populated from:
- System settings (app name, etc.)
- Email configurations (support email)
- Environment variables (URLs)

## Testing and Preview

### Template Preview
- Access preview functionality in template editor
- Uses realistic sample data
- Shows both HTML and plain text versions
- Displays rendered HTML in browser

### Sample Data for Testing
The preview system uses comprehensive sample data including:
- Realistic ticket information
- Sample user names and emails
- Current date/time information
- Sample comments and status changes

## Migration and Compatibility

### Backward Compatibility
- Legacy email sending remains functional
- Automatic fallback when templates unavailable
- Existing email configurations unchanged

### Default Template Initialization
- Default templates created automatically on startup
- Can be manually triggered via admin API
- Safe to run multiple times (no duplicates)

## Performance Considerations

1. **Template Caching**: Templates are fetched from database per request
2. **Variable Processing**: Efficient regex-based variable replacement
3. **Fallback Strategy**: Quick fallback to legacy email when needed
4. **Attachment Support**: Full support for email attachments

## Troubleshooting

### Common Issues
1. **Template Not Found**: Check if template is active and type matches
2. **Variables Not Replaced**: Verify variable syntax `{{variableName}}`
3. **Email Not Sent**: Check email configuration and template activation

### Debug Information
- Template rendering logs errors to console
- Email sending provides success/failure feedback
- Preview function helps validate template content

## Future Enhancements

Potential improvements for the system:
1. **Conditional Blocks**: Support for `{{#if}}` style conditions
2. **Template Inheritance**: Base templates with shared styling
3. **Multi-language Support**: Locale-specific templates
4. **Rich Editor**: WYSIWYG editor for non-technical users
5. **Template Analytics**: Track email open rates and engagement