# Due Date Feature Documentation

## Overview
The ticket system now supports due dates for tickets with integrated notification functionality.

## Features Added

### 1. Due Date Field
- Optional due date field in ticket creation dialog
- Datetime picker with validation (cannot set due date in the past)
- Due date display and editing in ticket details page
- Due date column in ticket lists with visual indicators

### 2. Visual Indicators
- **Green**: Normal due date (more than 24 hours away)
- **Amber/Yellow**: Due soon (within 24 hours)
- **Red**: Overdue (past due date)
- Badges showing "Due Soon" or "Overdue" status

### 3. Notification System
- **ticket_due_soon**: Sent when a ticket is due within 24 hours
- **ticket_overdue**: Sent when a ticket is past its due date
- Notifications are sent only to assigned users
- Automatic daily checks for due date notifications

### 4. API Endpoints
- `POST /api/tickets` - Create ticket with optional due date
- `PATCH /api/tickets/[id]` - Update ticket due date
- `GET/POST /api/cron/due-date-check` - Manual trigger for due date checks

## Database Changes
- Added `dueDate` field to `Ticket` model (optional DateTime)
- Backward compatible - existing tickets without due dates continue to work

## Background Process
- Automatic hourly checks for due and overdue tickets
- Creates notifications for assigned users
- Prevents duplicate notifications (once per 24 hours per ticket)

## Configuration
- Due date checks run automatically when the application starts
- Check interval: 1 hour
- Due soon threshold: 24 hours before due date
- Can be triggered manually via cron endpoint with `CRON_SECRET`

## Usage

### Creating Tickets with Due Dates
1. Click "New Ticket" in the dashboard
2. Fill in required fields (Subject, Description)
3. Optionally set a due date using the datetime picker
4. Submit the ticket

### Managing Due Dates
1. Open any ticket details page
2. Click the calendar icon next to "Due Date"
3. Set or modify the due date
4. Click the checkmark to save or X to cancel

### Monitoring Due Dates
- View due dates in the main tickets list
- Visual indicators show status at a glance
- Receive notifications for assigned tickets approaching or past due dates

## Technical Notes
- Due dates are stored in UTC and displayed in local timezone
- Notifications respect the 24-hour threshold for "due soon" status
- Background service starts automatically with the application
- All changes are backward compatible with existing data