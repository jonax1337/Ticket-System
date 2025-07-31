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