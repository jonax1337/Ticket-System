# Ticket System

[![Build Status](https://github.com/jonax1337/Ticket-System/workflows/NodeJS%20with%20Grunt/badge.svg)](https://github.com/jonax1337/Ticket-System/actions)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/jonax1337/Ticket-System/releases)
[![Node.js](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jonax1337/Ticket-System/pulls)

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
- **📧 Email-to-Ticket Integration**: Seamless ticket creation from emails (external bridge required)
- **🎫 Advanced Ticket Management**: Status tracking, priority levels, assignments, and searchable history
- **👥 User & Role Management**: Admin/Supporter roles with granular permissions
- **💬 Internal Comments System**: Team collaboration with internal notes
- **🔍 Smart Search & Filtering**: Multi-word search, status/priority filters, assignee filtering

### User Experience
- **🎨 Modern UI**: Built with Next.js 15, TailwindCSS, and ShadCN/UI components
- **🌓 Theme System**: Dark/Light mode with custom color themes and logo support
- **📱 Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Real-time Updates**: Instant UI updates with optimistic loading
- **🗂️ Sortable Lists**: Click-to-sort by any column with visual indicators

### Advanced Features
- **🏷️ Ticket Numbers**: Auto-generated ticket numbers (e.g., T202412-AB34)
- **📂 File Attachments**: Drag & drop file upload support for tickets
- **🎯 My Tickets View**: Personal dashboard for assigned tickets
- **⚙️ Admin Configuration**: Customizable app name, logos, themes, and slogans
- **🔒 Secure Authentication**: NextAuth.js with session management
- **🌐 Sticky Glass Header**: Modern glassmorphism header with scroll effects

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6.12-darkblue?logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?logo=mysql)

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: TailwindCSS + ShadCN/UI Components
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access
- **UI Components**: Radix UI + Headless UI + Lucide Icons
- **Fonts**: Google Font "Space Grotesk"
- **File Handling**: Native browser APIs with drag & drop
- **State Management**: React Server Components + Client Components

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

The application uses the following main entities:

- **Users**: Supporters and admins with role-based access control
- **Tickets**: Support requests with status, priority, assignment, and file attachments
- **Comments**: Internal team communication with type differentiation
- **SystemSettings**: App configuration (name, logo, theme, slogan)
- **SetupStatus**: Application initialization tracking

### Key Features:
- **Auto-generated IDs**: CUID-based unique identifiers
- **Timestamps**: Automatic createdAt/updatedAt tracking
- **Relationships**: Proper foreign key constraints
- **Flexible Schema**: Easy to extend with new fields

## 📧 Email Integration

This application expects tickets to be created via an external email-to-ticket bridge that writes directly to the database. The bridge should:

1. Parse incoming emails
2. Extract sender information, subject, and body
3. Create ticket records in the `tickets` table
4. Set appropriate status and priority

Example ticket creation:
```sql
INSERT INTO tickets (id, subject, description, fromEmail, fromName, status, priority, createdAt, updatedAt)
VALUES (
  'ticket_id', 
  'Email Subject', 
  'Email Body', 
  'user@company.com', 
  'User Name', 
  'OPEN', 
  'MEDIUM', 
  NOW(), 
  NOW()
);
```

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
- [ ] **Custom Status & Priority Management** - User-defined ticket statuses and priorities
- [ ] **Advanced Email Templates** - Customizable notification templates
- [ ] **Webhook Integrations** - Connect with external services and tools
- [ ] **API Documentation & REST Endpoints** - Full API access for integrations
- [ ] **Advanced Analytics Dashboard** - Detailed reporting and insights
- [ ] **Bulk Actions for Tickets** - Mass operations on multiple tickets
- [ ] **Custom Fields Support** - Flexible ticket metadata
- [ ] **Multi-language Support** - Internationalization (i18n)

### 🚀 Recent Updates
- ✅ **Email-to-Ticket Integration** - Automatic ticket creation from emails
- ✅ **Modern UI/UX** - Next.js 15 with TailwindCSS and ShadCN/UI
- ✅ **Theme Customization** - Dark/light modes with custom colors
- ✅ **File Attachments** - Drag & drop file support

> 💡 Have a feature request? [Open an issue](https://github.com/jonax1337/Ticket-System/issues/new) to discuss it!

---

**Built with ❤️ for IT Support Teams**
