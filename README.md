# Ticket System

A modern, full-featured support ticket management system built for professional IT teams. This self-hosted web application provides a complete solution for managing support tickets with advanced filtering, user management, and customizable workflows.

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

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: TailwindCSS + ShadCN/UI Components
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access
- **UI Components**: Radix UI + Headless UI + Lucide Icons
- **Fonts**: Google Font "Space Grotesk"
- **File Handling**: Native browser APIs with drag & drop
- **State Management**: React Server Components + Client Components

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL database
- External email-to-ticket bridge (for receiving tickets)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd ticket-system
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

## Environment Variables

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

## Email-to-Ticket Integration

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

## Deployment

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

## Development

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

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes with proper TypeScript types
4. **Test** your changes thoroughly
5. **Run** linting (`npm run lint`)
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### 📝 Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for all new code
- Test responsive design on multiple screen sizes
- Ensure database schema changes include migrations
- Update documentation for new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support & Issues

- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Open an issue with the "enhancement" label
- **Questions**: Check existing issues or open a new discussion
- **Security Issues**: Please report privately via email

## 🚀 Roadmap

### Planned Features
- [ ] Custom Status & Priority Management
- [ ] Advanced Email Templates
- [ ] Webhook Integrations
- [ ] API Documentation & REST Endpoints
- [ ] Advanced Analytics Dashboard
- [ ] Bulk Actions for Tickets
- [ ] Custom Fields Support
- [ ] Multi-language Support

---

**Built with ❤️ for IT Support Teams**
