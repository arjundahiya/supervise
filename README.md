# Supervise

A modern web application for managing academic supervisions at Cambridge University. Built with Next.js, Drizzle ORM, and Better Auth.

## Overview

Supervise is a supervision scheduling platform that allows administrators to create and manage academic supervision sessions, while students can view their schedules, manage their availability, and sync sessions to their personal calendars.

## Features

### For Administrators
- **Create Supervisions**: Schedule one-time or recurring weekly supervision sessions
- **Student Assignment**: Assign multiple students to each supervision
- **Conflict Detection**: Visual warnings when scheduling conflicts with student availability
- **Session Management**: Edit or delete existing supervisions
- **Dashboard Overview**: View all upcoming and past sessions with statistics

### For Students
- **Personal Dashboard**: View all assigned supervisions organized by date
- **Availability Management**: Block out times when unavailable for supervisions
- **Calendar Sync**: Generate iCal feeds for Apple Calendar, Google Calendar, and Outlook
- **Session Details**: See supervision partners, location, time, and description

### Authentication
- Cambridge Raven OAuth2 integration via Better Auth
- Role-based access control (Admin/Student)
- Secure session management

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: Sonner (toast notifications)

### Backend
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with OAuth2
- **Calendar Generation**: ics (iCal format)

### Deployment
- **Platform**: Vercel
- **Analytics**: Vercel Speed Insights

## Project Structure

```
src/
├── app/
│   ├── actions/              # Server actions
│   │   ├── availability.ts   # Availability CRUD operations
│   │   └── supervisions.ts   # Supervision CRUD operations
│   ├── admin/                # Admin dashboard
│   │   ├── components/
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── create-supervision-button.tsx
│   │   │   └── manage-supervision-dialog.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/[...all]/    # Better Auth API routes
│   │   └── calendar/[userId]/# iCal feed generation
│   ├── dashboard/            # Student dashboard
│   │   ├── components/
│   │   │   ├── student-dashboard.tsx
│   │   │   ├── availability-manager.tsx
│   │   │   └── calendar-sync-button.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── navbar.tsx        # Main navigation
│   ├── layout.tsx
│   ├── page.tsx              # Landing/login page
│   └── globals.css
├── components/ui/            # Reusable UI components
├── lib/
│   ├── db/
│   │   └── schema.ts         # Database schema (Drizzle)
│   ├── auth.ts               # Better Auth configuration
│   ├── auth-client.ts        # Client-side auth utilities
│   ├── db.ts                 # Database connection
│   └── utils.ts              # Utility functions
└── drizzle.config.ts         # Drizzle Kit configuration
```

## Database Schema

### Core Tables

#### `users`
- Stores user information (students and admins)
- Fields: id, full_name, email_address, role, image, timestamps
- Role enum: `STUDENT` | `ADMIN`

#### `supervisions`
- Represents supervision sessions
- Fields: id, title, description, location, startsAt, endsAt, timestamps

#### `users_to_supervisions` (Junction Table)
- Many-to-many relationship between users and supervisions
- Allows multiple students per supervision

#### `availability`
- Tracks when users are unavailable
- Types: `PERSONAL` (user-specific) | `GLOBAL` (holidays/breaks)
- Fields: id, type, userId, startsAt, endsAt, createdAt

#### `swap_request` (Planned Feature)
- For students to request supervision swaps
- Status: `PENDING` | `ACCEPTED` | `REJECTED` | `CANCELLED`

### Auth Tables
- `session`: User sessions
- `account`: OAuth account linkage
- `verification`: Email verification tokens

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (Neon recommended)
- Cambridge Raven OAuth2 credentials

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Raven OAuth2
RAVEN_ID="your-raven-client-id"
RAVEN_SECRET="your-raven-client-secret"
RAVEN_OAUTH2_URL="https://your-raven-oauth-url/.well-known/openid-configuration"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supervise
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**
   ```bash
   # Generate migration files
   pnpm drizzle-kit generate
   
   # Apply migrations to database
   pnpm drizzle-kit migrate
   
   # (Optional) Open Drizzle Studio to inspect database
   pnpm drizzle-kit studio
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Key Features Explained

### Recurring Supervisions

When creating a supervision, administrators can enable "Repeat Weekly" to automatically generate multiple sessions:

- Select a start date and an end date
- The system creates sessions every week between those dates
- Maximum 52 sessions per creation (one academic year)
- All sessions are linked to the same students

**Implementation**: See `createSupervision()` in `src/app/actions/supervisions.ts`

### Availability Conflict Detection

The system warns when scheduling conflicts exist:

- Students can block out unavailable times
- Admin sees red highlights when assigning students with conflicts
- Two conflict types:
  - `PERSONAL`: Student is busy
  - `GLOBAL`: University-wide holiday/break

**Implementation**: See `checkConflict()` in `src/app/admin/components/create-supervision-button.tsx`

### Calendar Sync

Students can sync their schedule to external calendars:

- **Auto-sync**: Click "Open in Calendar App" (Apple/Outlook)
- **Manual**: Copy URL for Google Calendar

The feed is dynamically generated and includes:
- All supervisions from the past month onwards
- Session details (title, location, description, time)
- Marked as "BUSY" to block calendar

**Implementation**: See `src/app/api/calendar/[userId]/route.ts`

### iCal Feed URL Structure
```
https://your-domain.com/api/calendar/[userId]
```

## Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm drizzle-kit generate      # Generate Drizzle migrations
pnpm drizzle-kit migrate       # Apply migrations
pnpm drizzle-kit studio        # Open Drizzle Studio
pnpm drizzle-kit push          # Push schema changes (dev only)

# Linting
pnpm lint             # Run ESLint
```

## API Routes

### `/api/auth/[...all]`
Better Auth endpoints for OAuth and session management

### `/api/calendar/[userId]`
- **Method**: GET
- **Returns**: iCal format (.ics) file
- **Purpose**: Calendar feed for external apps
- **Query Logic**: Fetches supervisions where user is assigned, from 1 month ago onwards

## Server Actions

### Availability Actions (`src/app/actions/availability.ts`)

```typescript
getAvailabilityForDate(date: Date)
// Returns all availability slots for a specific date

getUserAvailability(userId: string)
// Returns all future availability for a user

addBusySlot(userId: string, startsAt: Date, endsAt: Date)
// Creates a new personal availability block

deleteAvailability(slotId: string)
// Removes an availability slot
```

### Supervision Actions (`src/app/actions/supervisions.ts`)

```typescript
getStudentsForSelection()
// Returns all users with STUDENT or ADMIN role

createSupervision(formData)
// Creates supervision(s) with optional weekly recurrence

updateSupervision(id: string, data)
// Updates an existing supervision

deleteSupervision(id: string)
// Deletes a supervision (cascades to student assignments)
```

## Authentication Flow

1. User clicks "Sign in with Raven"
2. Redirected to Cambridge Raven OAuth2 provider
3. After authorization, Better Auth creates/updates user record
4. User is assigned default role (`STUDENT`)
5. Session created and stored in database
6. Redirected to appropriate dashboard

**Admin Assignment**: Manually update user role in database to `ADMIN`

## Styling System

The project uses a custom Tailwind CSS configuration with:

- **Color System**: OKLCH color space for better perceptual uniformity
- **Dark Mode**: Automatic based on system preferences
- **Custom Radii**: Configurable border radius tokens
- **Typography**: IBM Plex Sans font family

### Design Tokens

```css
--radius: 0.625rem        /* Base border radius */
--radius-sm: 0.25rem      /* Small elements */
--radius-lg: 0.625rem     /* Large elements */
```

## Component Library

All UI components are in `src/components/ui/` and follow Radix UI patterns:

- Fully accessible (ARIA compliant)
- Keyboard navigation support
- Customizable via className
- Type-safe with TypeScript

### Key Components

- **Dialog**: Modal windows (create/edit supervisions)
- **Calendar**: Date picker with custom styling
- **Select**: Dropdown menus
- **Popover**: Floating content containers
- **Alert Dialog**: Confirmation modals
- **Sheet**: Side panels (mobile navigation)

## Common Development Tasks

### Adding a New User Role

1. Update enum in `src/lib/db/schema.ts`:
   ```typescript
   export const roleEnum = pgEnum("role", ["STUDENT", "ADMIN", "NEW_ROLE"]);
   ```

2. Generate and apply migration:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

3. Update role checks in components and middleware

### Creating a New Server Action

1. Create function in appropriate action file
2. Add `"use server"` directive at top of file
3. Use Drizzle ORM for database queries
4. Call `revalidatePath()` to update UI
5. Return success/error object

Example:
```typescript
"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function myAction(data) {
  try {
    await db.insert(table).values(data);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed" };
  }
}
```

### Adding a New UI Component

1. Create component in `src/components/ui/`
2. Follow Radix UI pattern if using a primitive
3. Add data-slot attributes for styling hooks
4. Export from component file
5. Import and use in pages

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Ensure database accepts connections from your IP
- Check SSL mode is set to `require`

### OAuth Errors
- Confirm `RAVEN_ID` and `RAVEN_SECRET` are correct
- Verify redirect URI is registered with OAuth provider
- Check `BETTER_AUTH_URL` matches your deployment URL

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `pnpm build`

## Future Enhancements

Planned features for future development:

- [ ] Supervision swap system (database schema exists)
- [ ] Email notifications for new/updated supervisions
- [ ] File attachments for supervisions (reading materials)
- [ ] Student notes on supervisions
- [ ] Attendance tracking
- [ ] Export schedule to PDF
- [ ] Admin analytics dashboard
- [ ] Bulk import/export from/to spreadsheet

## Contributing

When contributing to this project:

1. Follow existing code style and patterns
2. Use TypeScript for type safety
3. Add server actions for data mutations
4. Use Drizzle ORM for all database queries
5. Test on both light and dark themes
6. Ensure mobile responsiveness

## License

GNU AFFERO GENERAL PUBLIC LICENSE Version 3
See LICENSE file.

## Support

For issues or questions, please create an issue in the repository.