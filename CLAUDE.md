# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma studio` - Open database browser

## Architecture Overview

This is a Next.js 15 ticket management system with the following key architectural components:

### Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **UI**: TailwindCSS + ShadCN UI components
- **Theme**: next-themes for dark/light mode

### Database Schema
- **Users**: Role-based (ADMIN/SUPPORTER) with bcrypt password hashing
- **Tickets**: Status (OPEN/IN_PROGRESS/CLOSED), Priority (LOW/MEDIUM/HIGH/URGENT)
- **Comments**: Internal team communication on tickets
- **SetupStatus**: Tracks initial app setup completion

### App Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable UI components (dashboard, ui, providers)
- `src/lib/` - Utility functions (auth, prisma, setup, utils)
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

### Key Features
- **Email-to-Ticket Integration**: Expects external bridge to create tickets in database
- **Role-Based Access**: Admins manage users, Supporters handle tickets
- **Initial Setup**: First-run wizard creates admin user
- **Session Management**: JWT-based with NextAuth.js
- **Theme Support**: System/light/dark mode with persistence

### Authentication Flow
- Credentials-based login via NextAuth.js
- JWT tokens with role information
- Password hashing with bcryptjs
- Setup wizard for initial admin account creation

### Development Notes
- Uses `@prisma/client` types throughout for type safety
- ShadCN UI components in `src/components/ui/`
- Dashboard components handle ticket/user management
- API routes follow REST conventions under `src/app/api/`