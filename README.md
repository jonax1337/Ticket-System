# Support Dashboard

A modern, self-hosted web application for IT support teams. This application serves as an internal support dashboard where all tickets are managed via email-to-ticket integration.

## Features

- **Email-to-Ticket Integration**: All tickets come via email (external bridge required)
- **Modern UI**: Built with Next.js, TailwindCSS, and ShadCN UI
- **Dark/Light Mode**: Full theme support with system preference detection
- **User Management**: Role-based access (Admin/Supporter)
- **Ticket Management**: Status tracking, priority setting, and assignment
- **Comments System**: Internal team communication on tickets

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: TailwindCSS + ShadCN UI
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Fonts**: Google Font "Space Grotesk"

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

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Session encryption key | `your-secret-key-here` |
| `SKIP_SETUP` | Skip initial setup (optional) | `false` |

## Database Schema

The application uses the following main entities:

- **Users**: Supporters and admins with role-based access
- **Tickets**: Support requests with status, priority, and assignment
- **Comments**: Internal team communication
- **SetupStatus**: Application initialization tracking

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

## User Roles

- **Admin**: Full access including user management
- **Supporter**: Can manage tickets and add comments

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

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npx prisma studio`: Open database browser

### Database Management

- `npx prisma generate`: Generate Prisma client
- `npx prisma db push`: Push schema changes
- `npx prisma migrate dev`: Create and apply migration
- `npx prisma studio`: Open database browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions, please use the GitHub issues page.
