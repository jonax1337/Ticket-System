# Ticket System

[![Version](https://img.shields.io/badge/version-0.1.0-2563eb?style=for-the-badge&logo=semantic-release&logoColor=white)](https://github.com/jonax1337/Ticket-System/releases)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.12.0-2d3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479a1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24.11-7c3aed?style=for-the-badge&logo=next.js&logoColor=white)](https://next-auth.js.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://github.com/jonax1337/Ticket-System/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jonax1337/Ticket-System/pulls)

A comprehensive, enterprise-grade support ticket management system built for professional IT teams and customer service operations. This self-hosted web application provides a complete solution for managing support tickets with advanced email integration, automated workflows, customizable themes, and powerful analytics.

> 🔗 **Quick Links:** [Demo](https://github.com/jonax1337/Ticket-System#-screenshots) • [Installation](#-quick-start) • [Documentation](#-table-of-contents) • [Issues](https://github.com/jonax1337/Ticket-System/issues) • [Releases](https://github.com/jonax1337/Ticket-System/releases)

## 📚 Table of Contents

- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚡ Quick Start](#-quick-start)
- [📸 Screenshots](#-screenshots)
- [🔧 Configuration](#-configuration)
- [🗄️ Database Schema](#️-database-schema)
- [📧 Email Integration](#-email-integration)
- [👥 User Roles](#-user-roles--permissions)
- [🚀 Deployment](#-deployment)
- [💻 Development](#-development)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🆘 Support](#-support--issues)

## 🚀 Features

### 🎯 Core Functionality
- **📧 Advanced Email Integration**: Multi-account IMAP sync with smart reply detection and participant management
- **🎫 Enterprise Ticket Management**: Custom workflows, queue-based routing, and comprehensive audit trails
- **👥 Role-Based Access Control**: Admin/Supporter roles with granular permissions and user queue assignments
- **💬 Unified Communication**: Internal/external comments with full email thread preservation
- **🔍 Intelligent Search**: Multi-criteria filtering, advanced search, and saved filter presets
- **🔔 Real-Time Notifications**: In-app notifications with email template integration and read status tracking

### 🎨 User Experience & Interface
- **🚀 Modern Architecture**: Next.js 15 App Router, React 19, TypeScript 5.8, and cutting-edge frameworks
- **🌈 Advanced Theme System**: 10+ predefined themes, custom color picker, and dynamic brand customization
- **📱 Mobile-First Design**: Fully responsive with touch-optimized interactions and PWA capabilities
- **⚡ Performance Optimized**: Server components, lazy loading, and optimistic UI updates
- **🎭 Smooth Animations**: Framer Motion integration with subtle micro-interactions

### 🔧 Enterprise Features
- **🏷️ Flexible Ticket Numbering**: Sequential/random generation with customizable prefixes and formats
- **📎 Comprehensive File Handling**: Multi-file uploads, drag-and-drop, MIME type validation, and UUID-based storage
- **👥 Advanced Participant System**: CC/BCC tracking, external user management, and notification preferences
- **📊 Queue Management**: Departmental routing, workload balancing, and assignment automation
- **⚙️ Deep Customization**: Logo uploads, color theming, email templates, and automation rules
- **🔐 Enterprise Security**: bcrypt password hashing, JWT sessions, input validation, and audit logging
- **📧 Template Engine**: Variable substitution, conditional content, and multi-language support preparation
- **⏰ Workflow Automation**: Due date tracking, SLA monitoring, escalation rules, and auto-close functionality

### 🚀 Technical Excellence
- **🏗️ Scalable Architecture**: Microservice-ready design with clean separation of concerns
- **🗄️ Advanced Database**: MySQL 8.0+ with strategic indexing and optimized queries
- **🔄 Background Processing**: Cron services, email sync, notification dispatch, and cleanup tasks
- **📈 Performance Monitoring**: Built-in analytics, error tracking, and health monitoring
- **🔧 Developer Experience**: TypeScript strict mode, comprehensive error handling, and extensive documentation

## 🛠️ Tech Stack

[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38b2ac?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.12.0-2d3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479a1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24.11-7c3aed?style=flat-square&logo=next.js&logoColor=white)](https://next-auth.js.org/)
[![ShadCN/UI](https://img.shields.io/badge/ShadCN%2FUI-Latest-000000?style=flat-square&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-8b5cf6?style=flat-square&logo=radixui&logoColor=white)](https://www.radix-ui.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.23.12-0055ff?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![ImapFlow](https://img.shields.io/badge/ImapFlow-1.0.191-ff4757?style=flat-square&logo=mail&logoColor=white)](https://www.npmjs.com/package/imapflow)

### 🏗️ Core Architecture
- **Framework**: Next.js 15.4.1 (App Router) with React Server Components
- **Language**: TypeScript 5.8.3 with strict mode and comprehensive type safety
- **UI Framework**: React 19.1.0 with modern concurrent features
- **Database**: MySQL 8.0+ with Prisma ORM 6.12.0 and optimized indexing
- **Authentication**: NextAuth.js 4.24.11 with JWT and role-based access control

### 🎨 Frontend Stack
- **Styling**: TailwindCSS 3.4.1 with custom CSS variables and theme system
- **Components**: ShadCN/UI + Radix UI primitives for accessibility
- **Icons**: Lucide React with 1000+ icons and custom icon system
- **Animations**: Framer Motion 12.23.12 for smooth micro-interactions
- **State Management**: React Server Components + optimistic client updates

### 📧 Email & Communication
- **IMAP Processing**: ImapFlow 1.0.191 for robust email server connections
- **Email Parsing**: MailParser 3.7.4 for advanced email content extraction
- **SMTP Sending**: Nodemailer with template engine and variable substitution
- **Template System**: Custom HTML/text templates with conditional rendering

### 🔧 Backend & Services
- **File Handling**: Multer 2.0.2 with UUID-based storage and MIME validation
- **Date Processing**: date-fns 4.1.0 for comprehensive date manipulation
- **Search**: Fuse.js 7.1.0 for fuzzy search and advanced filtering
- **Cron Jobs**: Custom cron manager with individual email account intervals
- **Performance**: Built-in caching, lazy loading, and optimized queries

## ⚡ Quick Start

### Prerequisites

**System Requirements:**
- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: 9.x+ (included with Node.js) or yarn/pnpm
- **MySQL**: 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Email Server**: IMAP/SMTP access for email integration (optional but recommended)

**Recommended Specifications:**
- **RAM**: 4GB+ available for optimal performance
- **Storage**: 2GB+ free space (more for file attachments)
- **OS**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+ with WSL2
- **Database**: Dedicated MySQL instance with proper indexing
- **Network**: Stable internet connection for email sync and external integrations

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/jonax1337/Ticket-System.git
   cd Ticket-System
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - `DATABASE_URL`: Your MySQL connection string
   - `NEXTAUTH_SECRET`: Strong random string for session security
   - `NEXTAUTH_URL`: Your application URL

3. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Initial Setup**: 
   Visit `http://localhost:3000` and complete the setup wizard to create your first admin account.

## 📸 Screenshots

### Dashboard Overview
- Clean, modern interface with sortable ticket lists
- Advanced filtering by status, priority, and assignee
- Real-time search with multi-word support

### My Tickets View  
- Personal dashboard showing only assigned tickets
- Same powerful filtering without assignee selector
- Click-to-open ticket details

### Admin Panel
- Complete user management with role assignment
- System configuration (app name, logos, themes)
- Custom color picker with live preview

### Theme Customization
- 4 beautiful preset themes (Default, Blue, Green, Purple)
- Custom color picker for unlimited possibilities
- Logo upload support with preview
- Customizable slogans and branding

## 🔧 Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Session encryption key | `your-secret-key-here` |
| `SKIP_SETUP` | Skip initial setup (optional) | `false` |

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

### Core Entities
- **Users**: Admin/Supporter roles with bcrypt password hashing and avatar support
- **Tickets**: Support requests with custom status/priority, attachments, and participant tracking
- **Comments**: Internal/external communication with email integration and attachments
- **TicketParticipants**: Modular participant system for multi-user tickets

### Configuration & Customization
- **CustomStatus**: User-defined ticket statuses with icons and colors
- **CustomPriority**: Configurable priority levels with visual indicators
- **SystemSettings**: App branding, themes, automation settings, and ticket numbering
- **EmailConfiguration**: IMAP settings for multiple email accounts
- **EmailTemplate**: Customizable notification templates with variable support

### Communication & Notifications
- **Notifications**: Real-time system notifications with read status tracking
- **TicketAttachment/CommentAttachment**: File upload support for tickets and comments

### Key Features:
- **CUID-based IDs**: Collision-resistant unique identifiers for all entities
- **Automatic Timestamps**: Built-in createdAt/updatedAt tracking
- **Foreign Key Constraints**: Proper relational integrity with cascade deletes
- **Extensible Design**: Easy to add custom fields and relationships
- **MySQL Optimized**: Designed for MySQL 8.0+ with proper indexing

## 📧 Advanced Email Integration

The system features a sophisticated IMAP-based email-to-ticket conversion engine with enterprise-level capabilities:

### 🚀 Email Processing Engine
- **Multi-Account Architecture**: Configure unlimited email accounts with independent sync intervals
- **Smart Reply Detection**: Advanced regex patterns automatically detect ticket replies and route them correctly
- **Intelligent Duplicate Prevention**: Content-based and timing-based algorithms prevent duplicate ticket creation
- **Participant Management**: Automatic extraction and tracking of all email participants (FROM, TO, CC, BCC)
- **Attachment Processing**: Seamless file upload integration with automatic attachment linking

### ⚙️ Configuration & Setup
Email accounts are managed through the admin panel with comprehensive options:
- **IMAP/SMTP Settings**: Host, port, SSL/TLS, authentication credentials
- **Sync Configuration**: Individual intervals (default: 300 seconds), folder monitoring, unread-only processing
- **Advanced Filtering**: Subject/sender regex filters for selective email processing
- **Post-Processing Actions**: Mark as read, delete, or move to specified folders
- **Default Ticket Settings**: Configurable priority, status, queue, and assignee for new tickets

### 📨 Email Template System
Powerful template engine with variable substitution and conditional content:
- **Ticket Lifecycle Templates**: Creation notifications, status changes, assignment updates
- **Communication Templates**: Comment additions, participant notifications, escalation alerts
- **Customizable Variables**: `{{ticketNumber}}`, `{{customerName}}`, `{{ticketSubject}}`, `{{commentContent}}`, and 20+ more
- **Multi-Format Support**: HTML and text versions with automatic fallback
- **Brand Integration**: Logo embedding, custom headers/footers, and theme-aware styling

### 🔄 Background Processing
- **Automated Sync**: Server-side cron manager with configuration change detection
- **External Cron Support**: REST API endpoints for external scheduling systems
- **Error Recovery**: Graceful error handling with automatic retry mechanisms
- **Performance Monitoring**: Email sync status tracking and health monitoring

## 👥 User Roles & Permissions

### Admin
- ✅ Full system access and configuration
- ✅ User management (create, edit, delete users)
- ✅ System settings (themes, logos, app name)
- ✅ All ticket management capabilities
- ✅ Access to admin panel and analytics

### Supporter  
- ✅ View and manage all tickets
- ✅ Create internal comments and notes
- ✅ Assign tickets to themselves or others
- ✅ Update ticket status and priority
- ✅ Access to "My Tickets" personal dashboard
- ❌ No access to user management or system settings

## 🚀 Deployment

### Using Docker

1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t support-dashboard .
   docker run -p 3000:3000 --env-file .env support-dashboard
   ```

### Using Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## 💻 Development

### 📋 Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build optimized production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint code quality checks
- `npm run typecheck`: Run TypeScript type checking

### 🗃️ Database Management

- `npx prisma generate`: Generate Prisma client after schema changes
- `npx prisma db push`: Push schema changes to database
- `npx prisma migrate dev`: Create and apply migration (recommended)
- `npx prisma studio`: Open visual database browser
- `npx prisma db seed`: Run database seeder (if configured)

### 🔧 Development Tips

1. **Hot Reload**: Changes to components refresh automatically
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Database Sync**: Always run `prisma generate` after schema changes
4. **Custom Themes**: Test custom colors in admin panel
5. **Mobile First**: Design is responsive by default

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository on GitHub
2. **Clone** your fork locally (`git clone https://github.com/YOUR_USERNAME/Ticket-System.git`)
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Make** your changes with proper TypeScript types
5. **Test** your changes thoroughly locally
6. **Run** linting (`npm run lint`) and fix any issues
7. **Commit** your changes (`git commit -m 'Add amazing feature'`)
8. **Push** to your branch (`git push origin feature/amazing-feature`)
9. **Open** a Pull Request with a clear description

### 📝 Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for all new code
- Test responsive design on multiple screen sizes
- Ensure database schema changes include proper migrations
- Update documentation for new features
- Write clear commit messages

### 🐛 Reporting Issues
- Use [GitHub Issues](https://github.com/jonax1337/Ticket-System/issues) with detailed reproduction steps
- Include system information and error messages
- Use issue templates when available

## 📄 License

This project is open source and available under the [MIT License](https://github.com/jonax1337/Ticket-System/blob/main/LICENSE).

## 🆘 Support & Issues

- **🐛 Bug Reports**: [Create an issue](https://github.com/jonax1337/Ticket-System/issues/new) with detailed reproduction steps
- **💡 Feature Requests**: [Open an issue](https://github.com/jonax1337/Ticket-System/issues/new) with the "enhancement" label  
- **❓ Questions**: Check [existing issues](https://github.com/jonax1337/Ticket-System/issues) or start a [discussion](https://github.com/jonax1337/Ticket-System/discussions)
- **🔒 Security Issues**: Please report privately via [GitHub Security](https://github.com/jonax1337/Ticket-System/security)

### 📊 Project Stats
![GitHub stars](https://img.shields.io/github/stars/jonax1337/Ticket-System?style=social)
![GitHub forks](https://img.shields.io/github/forks/jonax1337/Ticket-System?style=social)
![GitHub issues](https://img.shields.io/github/issues/jonax1337/Ticket-System)
![GitHub pull requests](https://img.shields.io/github/issues-pr/jonax1337/Ticket-System)

## 🗺️ Roadmap

### 🎯 Planned Features
- [ ] **Webhook Integrations** - Connect with Slack, Teams, Discord, and custom endpoints
- [ ] **RESTful API Documentation** - Complete OpenAPI 3.0 specification with Swagger UI
- [ ] **Advanced Analytics Dashboard** - Time-to-resolution metrics, agent performance, and trend analysis
- [ ] **Bulk Operations** - Mass ticket updates, batch assignments, and multi-select actions
- [ ] **Custom Fields Engine** - Dynamic ticket metadata with validation rules and conditional logic
- [ ] **Multi-language Support** - Full i18n with RTL support and locale-specific formatting
- [ ] **SLA Management** - Service Level Agreement tracking with escalation rules and breach notifications
- [ ] **Knowledge Base Integration** - Built-in documentation system with search and article suggestions
- [ ] **Mobile Applications** - Native iOS and Android apps with offline capability
- [ ] **Advanced Reporting** - Custom report builder with scheduled exports and dashboard widgets

### 🚀 Recent Major Updates
- ✅ **Enterprise Email System** - Multi-account IMAP sync with smart reply detection and participant management
- ✅ **Advanced Template Engine** - Variable substitution, conditional content, and brand integration
- ✅ **Queue Management System** - Departmental routing, workload balancing, and user assignments
- ✅ **Real-Time Notification Center** - In-app notifications with email integration and read status tracking
- ✅ **Workflow Automation** - Due date tracking, auto-close functionality, and escalation rules
- ✅ **Modern Architecture** - Next.js 15 App Router, React 19, TypeScript 5.8, and performance optimizations
- ✅ **Advanced Theme System** - 10+ predefined themes, custom color picker, and dynamic brand customization
- ✅ **Comprehensive File Handling** - Multi-file uploads, drag-and-drop, MIME validation, and UUID storage
- ✅ **Background Service Management** - Cron services, health monitoring, and automatic configuration reload
- ✅ **Security Enhancements** - Input validation, audit logging, session management, and role-based access control

> 💡 Have a feature request? [Open an issue](https://github.com/jonax1337/Ticket-System/issues/new) to discuss it!

---

**Built with ❤️ for IT Support Teams and Customer Service Excellence**

---

## 📊 System Highlights

- 🎯 **Enterprise-Ready**: Production-tested architecture with comprehensive security
- 🚀 **Modern Tech Stack**: Next.js 15, React 19, TypeScript 5.8, and cutting-edge frameworks
- 📧 **Advanced Email Integration**: Multi-account IMAP sync with intelligent processing
- 🎨 **Customizable Interface**: 10+ themes, brand customization, and responsive design
- 🔧 **Flexible Workflow**: Queue-based routing, automation rules, and custom fields
- 📈 **Performance Optimized**: Server components, caching, and optimized database queries
- 🔒 **Security First**: Role-based access, input validation, and comprehensive audit trails
- 🌐 **Integration Ready**: RESTful APIs, webhook support, and extensible architecture
