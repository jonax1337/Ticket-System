# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with this ticket management system codebase.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Apply migrations to database
- `npx prisma studio` - Open database browser

**Note**: User prefers to run `npm run build` and `npm run dev` via PowerShell on their system. Claude should fix build errors but not execute builds.

## Database Migration Notes

When schema changes are made:
1. Always run `npx prisma migrate dev` in development to create and apply migrations
2. Use `npx prisma migrate deploy` to apply migrations without creating new ones
3. If database sync issues occur, check that all migrations are properly applied
4. For schema synchronization issues, see `DATABASE_FIX.md` for troubleshooting steps

## Email Template System - FULLY WORKING ✅

### Recent Major Fixes (August 2025)
The email template system was completely rebuilt and is now fully functional:

#### 🔧 Variable Replacement System Fixed
- **Problem**: Variables like `{{customerName}}`, `{{ticketNumber}}` weren't being replaced in customer emails
- **Root Cause**: Race condition where `replaceTemplateVariables()` removed ALL `{{...}}` placeholders before sections and action buttons could be processed
- **Solution**: Added `preservePlaceholders` parameter to `replaceTemplateVariables()` to protect `{{sections}}` and `{{actionButton}}`
- **Result**: All variables now properly replaced in both preview and actual emails

#### 🔧 Mock Data for Previews Enhanced  
- **Problem**: Preview showed generic/empty data
- **Solution**: Template-specific realistic mock data for each email type:
  - `ticket_created`: Complete ticket information with realistic details
  - `comment_added`: Full comment content with HTML formatting and author details
  - `status_changed`: Previous/new status with actor information and timestamps
  - `participant_added`: Participant details with type and context
  - `automation_warning`: Warning context with inactivity timeframes
  - `automation_closed`: Closure information with help options
- **Result**: Previews now show exactly how emails will look to customers

#### 🔧 Section Rendering Completely Fixed
- **Problem**: Email sections were empty in both preview and actual emails  
- **Solution**: 
  - Fixed variable replacement order in `renderSections()`
  - Added conditional content support (`{{#variable}}...{{/variable}}`)
  - Ensured sections are processed AFTER template variables but BEFORE cleanup
- **Result**: All ticket details, comments, and information properly displayed

#### 🔧 Action Buttons Removed (No Self-Service Portal)
- **Problem**: Emails showed broken `[{{ticketUrl}}]View Ticket` buttons
- **Solution**: 
  - `generateActionButton()` always returns `null`
  - Database action buttons ignored (`actionButton = null` in all code paths)
  - No self-service portal available, so no buttons needed
- **Result**: Clean emails without broken buttons

#### 🔧 Support Email Uses Real Outbound Address
- **Problem**: Footer showed "support@example.com" 
- **Solution**: `getSystemDefaults()` now queries email configuration and uses outbound account email
- **Result**: Footer shows real support email address

#### 🔧 Header Title Hiding Fixed
- **Problem**: "Support Dashboard" still appeared in header even when hidden
- **Solution**: 
  - Added `renderEmailHeaderTitle()` function
  - Changed base template from `<h1>{{headerTitle}}</h1>` to `{{emailHeaderTitle}}`
  - Header title now respects `emailHideAppName` setting
- **Result**: Header completely clean when hiding is enabled

### Email Template Architecture

#### Core Files
- `src/lib/email-template-service.ts` - Main template processing and variable replacement
- `src/lib/email-base-template.ts` - Base HTML template and section generation  
- `src/app/api/admin/email-templates/base/preview/route.ts` - Preview API with mock data

#### Template Processing Flow
1. **Load Configuration**: Get email type config from database or fallback to hardcoded
2. **Generate Content**: Create sections and process action buttons (disabled)
3. **System Settings**: Load logo, app name visibility, and outbound email settings
4. **Variable Processing**: 
   - First pass: Replace variables in template strings themselves
   - Second pass: Replace all template placeholders (preserving sections/actionButton)
   - Third pass: Process sections with full variable replacement
   - Fourth pass: Insert processed sections and buttons into template
5. **Final Output**: Clean HTML with all variables properly replaced

#### Variable Replacement System
```typescript
// NEW: Preserve specific placeholders during replacement
replaceTemplateVariables(html, variables, ['sections', 'actionButton'])

// Conditional content support
{{#statusChangeReason}}<p><strong>Reason:</strong> {{statusChangeReason}}</p>{{/statusChangeReason}}
```

#### Email Types & Sections
Each email type has specific sections with relevant information:
- **ticket_created**: Ticket details (number, subject, status, priority, created date)
- **comment_added**: Comment content + ticket details
- **status_changed**: Status change info + ticket details  
- **participant_added**: Participation details + ticket details
- **automation_warning**: Warning message + action instructions + ticket details
- **automation_closed**: Closure info + ticket summary + help options

### Settings Integration
- `emailHideAppName`: Hides both app name and header title in emails
- `emailShowLogo`: Controls logo display in email header
- `emailHideSlogan`: Controls slogan display  
- Outbound email configuration: Automatically used for support contact in footer

### Testing Email Templates
- Preview API: `/api/admin/email-templates/base/preview`
- All templates use unified system with realistic mock data
- Variables properly replaced in both preview and actual email sending
- No action buttons (self-service portal disabled)

## System Architecture Overview

This is a comprehensive Next.js 15 ticket management system designed for customer support operations.

### Core Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript 5.8.3
- **Database**: MySQL with Prisma ORM 6.12.0
- **Authentication**: NextAuth.js 4.24.11 with credentials provider
- **UI Framework**: TailwindCSS 3.4.1 + ShadCN UI components + Radix UI primitives
- **Theme System**: next-themes 0.4.6 with custom theme color support
- **Email Processing**: ImapFlow 1.0.191 + mailparser 3.7.4 + nodemailer
- **Rich Text**: Lexical 0.33.1 for comment editing
- **File Handling**: Multer 2.0.2 for uploads
- **Charts**: Recharts 2.15.4 for analytics
- **Animation**: Framer Motion 12.23.12 for UI animations

### Database Schema Deep Dive

The system uses a comprehensive relational database schema with the following key models:

#### Core Entities
- **User**: Role-based system (ADMIN/SUPPORTER) with bcrypt password hashing, avatar support
- **Ticket**: Central entity with dynamic status/priority, queue assignment, due dates, participants
- **Comment**: Internal/external comments with full email content preservation and attachments
- **TicketParticipant**: Modular participant system for CC/BCC email handling
- **TicketWatcher**: User subscription system for ticket notifications

#### Configuration & Customization
- **SystemSettings**: Global app configuration (branding, ticket numbering, automation settings)
- **CustomStatus/CustomPriority**: User-defined workflow states with icons and colors
- **Queue**: Ticket organization and routing system with user assignments
- **EmailConfiguration**: Multi-account IMAP/SMTP setup with individual sync intervals
- **EmailTemplate**: Templated notifications with variable substitution
- **EmailTypeConfig**: Per-template customization (headers, footers, styling)

#### Notifications & Analytics
- **Notification**: In-app notification system with actor tracking
- **TicketAttachment/CommentAttachment**: File management with UUID-based storage

### Email System Architecture

The email system is a sophisticated IMAP-based email-to-ticket conversion engine:

#### Email Sync Service (`src/lib/email-service.ts`)
- **Multi-Account Support**: Each email configuration has individual sync intervals
- **Smart Reply Detection**: Advanced regex patterns for ticket number extraction from subjects
- **Duplicate Prevention**: Content-based and timing-based duplicate detection
- **Attachment Processing**: Automatic file upload and attachment linking
- **Participant Management**: Automatic CC/BCC extraction and participant creation
- **Template Integration**: Automatic customer notifications using email templates

#### Email Cron Manager (`src/lib/email-cron.ts`)
- **Individual Intervals**: Each email account syncs on its own schedule (default: 300 seconds)
- **Auto-Configuration**: Dynamically adapts to email configuration changes
- **Singleton Pattern**: Single manager instance with automatic startup
- **Configuration Monitoring**: Detects changes and restarts intervals automatically

#### Email Processing Features
- **Reply Handling**: Converts email replies to ticket comments with content extraction
- **Closed Ticket Logic**: Creates new tickets instead of adding to closed tickets
- **Filtering Support**: Subject/sender regex filters for selective processing
- **Action Handling**: Mark read, delete, or move to folder after processing
- **External Cron Support**: REST endpoint for external scheduling systems

### API Architecture & Patterns

The API follows RESTful conventions with comprehensive error handling and authentication:

#### Authentication Middleware
- Session-based authentication using NextAuth.js
- Role-based access control (ADMIN/SUPPORTER)
- JWT token management with avatar URL support

#### API Route Patterns
- **Nested Resources**: `/api/tickets/[id]/comments` for related data
- **Bulk Operations**: Support for batch updates and operations
- **Validation**: Input sanitization and type validation
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Notification Integration**: Automatic in-app and email notifications

#### Key API Features
- **File Upload**: Multipart form handling with UUID-based storage
- **Template Rendering**: Dynamic email template processing
- **Pagination**: Cursor-based pagination for large datasets
- **Search & Filtering**: Advanced filtering with multiple criteria
- **Real-time Updates**: Optimistic updates with cache invalidation

### UI Component Architecture

The UI system is built on a modern component architecture with animations and theming:

#### Component Structure
- **Base Components** (`src/components/ui/`): ShadCN UI components with Radix UI primitives
- **Dashboard Components** (`src/components/dashboard/`): Business logic components
- **Animation Components** (`src/components/animate-ui/`): Custom animated UI elements
- **Provider Components** (`src/components/providers/`): Context providers for theming and data

#### Design System Features
- **Theme System**: Support for light/dark modes with custom color themes
- **Icon System**: Unified icon management with Lucide React and custom icons
- **Animation System**: Framer Motion integration for smooth transitions
- **Responsive Design**: Mobile-first design with responsive breakpoints
- **Accessibility**: ARIA compliance and keyboard navigation support

#### Key UI Components
- **Header**: Responsive navigation with mobile dropdown and theme toggle
- **Tickets List**: Sortable, filterable ticket display with pagination
- **Notification System**: Real-time notification popover with unread counts
- **Rich Text Editor**: Lexical-based comment editor with mention support
- **File Upload**: Drag-and-drop file upload with preview support

### Theme & Styling System

#### CSS Architecture
- **TailwindCSS**: Utility-first CSS framework with custom configuration
- **CSS Variables**: Dynamic theme color system with HSL values
- **Dark Mode**: Comprehensive dark mode support with automatic switching
- **Custom Themes**: Support for custom hex colors and predefined themes
- **Responsive Design**: Mobile-first approach with defined breakpoints

#### Theme Features
- **Dynamic Colors**: Runtime theme color changes via CSS custom properties
- **Brand Customization**: Logo upload, app name, and slogan customization
- **Color Palette**: Predefined themes (blue, green, purple, red, amber, etc.)
- **Animation Support**: Smooth transitions and hover effects
- **Accessibility**: Proper contrast ratios and focus indicators

### Security & Performance

#### Security Measures
- **Authentication**: Secure password hashing with bcryptjs
- **Session Management**: JWT-based sessions with proper expiration
- **Input Validation**: Comprehensive input sanitization and validation
- **File Upload Security**: MIME type validation and secure file storage
- **Email Security**: SMTP/IMAP authentication with encrypted credentials

#### Performance Optimizations
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Lazy Loading**: Dynamic imports and component lazy loading
- **Image Optimization**: Next.js image optimization (disabled for compatibility)
- **Caching**: Strategic caching of configuration data and user settings
- **Bundle Optimization**: Tree shaking and code splitting

### Configuration & Customization

#### System Configuration
- **Ticket Numbering**: Sequential or random ticket number generation
- **Automation**: Configurable auto-close timers and warning notifications
- **Email Templates**: Customizable HTML email templates with variables
- **Queue Management**: Flexible ticket routing and assignment system
- **User Management**: Role-based permissions and user queue assignments

#### Branding & Appearance
- **Logo Upload**: Custom logo with automatic fallback handling
- **Color Themes**: Dynamic theme color changes with real-time preview
- **Typography**: Custom font support and consistent typography scales
- **Layout Customization**: Configurable sidebar behavior and header options

### Development Patterns & Conventions

#### Code Organization
- **File Naming**: Kebab-case for files, PascalCase for components
- **Import Structure**: Absolute imports using `@/` path mapping
- **Type Safety**: Comprehensive TypeScript usage with Prisma-generated types
- **Error Handling**: Consistent error handling patterns across the application

#### Component Patterns
- **Server Components**: Use server components for data fetching where possible
- **Client Components**: Mark client components with 'use client' directive
- **Custom Hooks**: Reusable logic extraction into custom hooks
- **Context Providers**: Centralized state management for global data

#### Database Patterns
- **Transaction Usage**: Database transactions for complex operations
- **Relationship Loading**: Strategic use of Prisma includes and selects
- **Soft Deletes**: Cascade deletes for related entities
- **Audit Trail**: CreatedAt/UpdatedAt timestamps on all entities

### Automation & Background Services

#### Cron Services
- **Email Sync**: Automatic email processing with individual account intervals
- **Due Date Monitoring**: Automated due date notifications and reminders
- **Auto-Close**: Configurable ticket auto-close based on inactivity
- **Cleanup Tasks**: Background cleanup of expired sessions and notifications

#### Service Management
- **Startup Scripts**: Automatic service initialization on application start
- **Health Monitoring**: Service status monitoring and error reporting
- **Configuration Reload**: Dynamic configuration changes without restart
- **Error Recovery**: Graceful error handling and service recovery

### Integration & Extensibility

#### External Integrations
- **IMAP/SMTP**: Full email server integration with multiple account support
- **File Storage**: Local file storage with configurable upload directories
- **Webhook Support**: Extensible webhook system for external integrations
- **API Documentation**: RESTful APIs ready for external integration

#### Extensibility Features
- **Custom Fields**: Extensible ticket and user field system
- **Plugin Architecture**: Modular component system for custom features
- **Theme Extensions**: Custom theme development support
- **Automation Rules**: Configurable business logic and workflow automation

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.