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

A modern, full-featured support ticket management system built for professional IT teams. This self-hosted web application provides a complete solution for managing support tickets with advanced filtering, user management, and customizable workflows.

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

### Core Functionality
- **📧 Email-to-Ticket Integration**: IMAP-based automatic ticket creation with multiple email accounts
- **🎫 Advanced Ticket Management**: Custom status/priority systems, assignments, and searchable history
- **👥 User & Role Management**: Admin/Supporter roles with granular permissions
- **💬 Comments & Communication**: Internal notes and external email responses
- **🔍 Smart Search & Filtering**: Multi-word search, custom filters, assignee filtering
- **🔔 Notification System**: Real-time notifications for ticket updates and assignments

### User Experience
- **🎨 Modern UI**: Built with Next.js 15.4.1, React 19, TailwindCSS, and ShadCN/UI
- **🌓 Theme System**: Dark/Light mode with custom color themes and logo support
- **📱 Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Real-time Updates**: Instant UI updates with optimistic loading patterns
- **🗂️ Sortable Lists**: Click-to-sort by any column with visual indicators

### Advanced Features
- **🏷️ Smart Ticket Numbers**: Configurable auto-generated ticket numbers (sequential/random)
- **📂 File Attachments**: Drag & drop file upload support for tickets and comments
- **👥 Participant Management**: Multiple participants per ticket with role tracking
- **🎯 My Tickets View**: Personal dashboard for assigned tickets
- **⚙️ Admin Configuration**: Customizable app name, logos, themes, and automation settings
- **🔒 Secure Authentication**: NextAuth.js with bcrypt password hashing
- **📧 Email Templates**: Customizable email templates for all notification types
- **⏰ Automation**: Due date tracking and automatic ticket closing

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

- **Framework**: Next.js 15.4.1 (App Router) with TypeScript 5.8.3
- **UI Library**: React 19.1.0 with modern React features
- **Styling**: TailwindCSS 3.4.1 + ShadCN/UI Components
- **Database**: MySQL 8.0+ with Prisma ORM 6.12.0
- **Authentication**: NextAuth.js 4.24.11 with role-based access
- **UI Components**: Radix UI + Lucide Icons + ShadCN/UI
- **Email Processing**: ImapFlow for IMAP + MailParser for email parsing
- **File Handling**: Multer for uploads with drag & drop support
- **Date Handling**: date-fns for comprehensive date utilities
- **State Management**: React Server Components + Client Components
- **Development**: ESLint + TypeScript with strict mode

## ⚡ Quick Start

### Prerequisites

**System Requirements:**
- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Included with Node.js
- **MySQL**: 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **External email-to-ticket bridge**: For receiving tickets (optional)

**Recommended:**
- **RAM**: 2GB+ available
- **Storage**: 1GB+ free space
- **OS**: Linux, macOS, or Windows with WSL2

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

## 📧 Email Integration

The application includes built-in IMAP-based email-to-ticket conversion with advanced features:

### Email Processing Features
- **Multi-Account Support**: Configure multiple email accounts with individual sync intervals
- **Automatic Sync**: Background email processing with configurable intervals (default: 5 minutes)
- **Smart Filtering**: Subject and sender filters with regex support
- **Email Actions**: Mark as read, delete, or move to folder after processing
- **Participant Tracking**: Automatically tracks all email participants (sender, CC, etc.)

### Configuration
Email accounts are configured through the admin panel with the following options:
- **IMAP Settings**: Host, port, SSL/TLS, username, password
- **Sync Options**: Interval, folder monitoring, unread-only processing
- **Default Ticket Settings**: Priority, status, and assignee for new tickets
- **Email Actions**: Post-processing actions for processed emails

### Email Templates
Customize email notifications with variables:
- **Ticket Created**: Sent to participants when tickets are created
- **Status Changed**: Notifications for status updates
- **Comment Added**: Alerts for new comments
- **Participant Added**: Welcome emails for new participants

Template variables include: `{{ticket.subject}}`, `{{ticket.ticketNumber}}`, `{{user.name}}`, `{{comment.content}}`, and more.

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
- [ ] **Webhook Integrations** - Connect with external services and tools
- [ ] **API Documentation & REST Endpoints** - Full API access for integrations
- [ ] **Advanced Analytics Dashboard** - Detailed reporting and insights
- [ ] **Bulk Actions for Tickets** - Mass operations on multiple tickets
- [ ] **Custom Fields Support** - Flexible ticket metadata
- [ ] **Multi-language Support** - Internationalization (i18n)
- [ ] **SLA Management** - Service Level Agreement tracking
- [ ] **Knowledge Base Integration** - Built-in documentation system

### 🚀 Recent Updates
- ✅ **Custom Status & Priority Management** - User-defined ticket statuses and priorities
- ✅ **Advanced Email Templates** - Customizable notification templates
- ✅ **Email-to-Ticket Integration** - IMAP-based automatic ticket creation
- ✅ **Notification System** - Real-time notifications with mark as read
- ✅ **Ticket Automation** - Due date tracking and auto-close functionality
- ✅ **Participant Management** - Multiple participants per ticket
- ✅ **Modern UI/UX** - Next.js 15.4.1 with React 19 and TailwindCSS
- ✅ **Theme Customization** - Dark/light modes with custom colors and logos
- ✅ **File Attachments** - Drag & drop file support for tickets and comments

> 💡 Have a feature request? [Open an issue](https://github.com/jonax1337/Ticket-System/issues/new) to discuss it!

---

**Built with ❤️ for IT Support Teams**
