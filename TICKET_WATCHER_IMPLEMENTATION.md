# Ticket Watcher Feature Implementation

This document describes the ticket watcher feature implementation for the Ticket System.

## Database Migration Required

After deploying this code, run the following migration to create the new `ticket_watchers` table:

```sql
CREATE TABLE `ticket_watchers` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ticket_watchers_ticketId_userId_key`(`ticketId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `ticket_watchers` ADD CONSTRAINT `ticket_watchers_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ticket_watchers` ADD CONSTRAINT `ticket_watchers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

## Features Implemented

### 1. Database Schema
- Added `TicketWatcher` model to Prisma schema
- Proper foreign key relationships with cascading deletes
- Unique constraint to prevent duplicate watchers per ticket

### 2. API Endpoints
- `GET /api/tickets/[id]/watchers` - Get all watchers for a ticket
- `POST /api/tickets/[id]/watchers` - Add current user as watcher
- `DELETE /api/tickets/[id]/watchers/[userId]` - Remove a watcher

### 3. UI Components
- **Eye Icon**: Located in the "Ticket Details" card header
- **Counter Badge**: Shows number of watchers when > 0
- **Popover**: Displays on hover with watcher list
- **Removal Feature**: X button next to each watcher (for self-removal or admin removal)

### 4. Features
- **Permission Control**: Users can only remove themselves; admins can remove anyone
- **Notifications**: Watchers receive notifications when removed by others
- **Real-time Updates**: Watchers list refreshes every 30 seconds when popover is open
- **Responsive Design**: Works on all screen sizes

## Testing

To test the feature:

1. Apply the database migration
2. Navigate to any ticket details page
3. Look for the Eye icon in the "Ticket Details" sidebar card header
4. Click to watch/unwatch the ticket
5. Hover over the Eye icon to see the watchers popover
6. Test removal functionality (self-removal and admin removal)

## Architecture

The implementation follows the existing patterns in the codebase:
- Uses Prisma for database operations
- Follows NextAuth.js authentication patterns
- Uses ShadCN UI components for consistent styling
- Implements proper error handling and loading states
- Uses existing notification system for removal notifications

## Future Enhancements

- WebSocket integration for real-time updates instead of polling
- Email notifications for watcher-related events
- Bulk watcher management for admins
- Watch status indicators in ticket lists