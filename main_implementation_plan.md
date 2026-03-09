# Leave Management System - Implementation Plan

## Goal Description
Build a Leave Management System (Sistem Cuti) using Next.js 16 (App Router, **pure JavaScript**) and Supabase. The system focuses purely on employee leave tracking (quota and history).

The application uses Supabase Authentication with **Google OAuth** to ensure secure access for users to their private dashboards.

**Leave Quota Logic:**
- Default annual leave quota is 12 days.
- Quotas reset at the start of every calendar year (January 1st).

## Proposed Stack
- **Framework:** Next.js 16 (App Router, JS/JSX)
- **Styling:** Tailwind CSS + shadcn/ui (for fast, accessible, and beautiful components)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **ORM/Query Builder:** Supabase JS Client (native)
- **Date Handling:** `date-fns`

## Database Schema (Supabase)

### `profiles` Table
Note: This table will link to Supabase's built-in `auth.users` for authentication.
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);
```

### `cuti` Table (Leave Requests)
```sql
CREATE TABLE cuti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  userid UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Tahunan', 'Sakit', 'Melahirkan', 'Penting')),
  dates DATE[] NOT NULL, -- Array of specific dates requested
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acc', 'ditolak')),
  note TEXT
);
```

## Proposed Changes

### Application Setup & Config
#### [NEW] `lib/supabase/client.js` & `lib/supabase/server.js`
Initialize Supabase clients for both browser and server components (using `@supabase/ssr`).
#### [NEW] `proxy.js`
Implement Next.js proxy (previously middleware) to protect routes based on authentication status and user role.

### Authentication Routes
#### [UPDATE] `app/login/page.jsx`
- Replace Magic Link email form with a "Sign in with Google" button calling `signInWithOAuth`.
#### [UPDATE] `app/auth/callback/route.js`
- Route handler to exchange the token for an active session (already largely implemented, verify behavior).

### Components (Shared UI)
#### [NEW] `components/ui/*`
Generate base components (Buttons, Inputs, Cards, Tables, Badges, Calendar) using shadcn/ui.
#### [NEW] `components/layout/Navbar.jsx`
Navigation bar with User profile/logout button.
#### [NEW] `components/ui/DateDetailsModal.jsx`
Reusable modal to display a list of dates and a calendar view for leave requests.

### Admin Routes (Protected - Admin Only)
#### [NEW] `app/admin/page.jsx`
- Admin dashboard showing summary statistics (e.g., pending leave requests).
- Navigation to other admin functions.
#### [NEW] `app/admin/users/page.jsx`
- Manage users (View existing users, roles).
- Note: New users might be invited via Supabase Auth admin APIs.
#### [NEW] `app/admin/requests/page.jsx`
- Table of all `pending` leave requests.
- Actions to approve (`acc`) or reject (`ditolak`).

### User Routes (Protected - Authenticated Users)
#### [NEW] `app/dashboard/page.jsx`
- Fetches the authenticated user's details.
- Calculates and displays remaining Annual Leave quota:
  - Base quota (12 days) minus the count of `acc` 'Tahunan' leaves within the current calendar year.
- Lists their leave request history.
- Button linking to `/dashboard/form`.
#### [NEW] `app/dashboard/form/page.jsx`
- Form to submit leave.
- Automatically associates the request with the currently authenticated user.
- Fields: Category, Dates (Multi-date picker), Note.
- **New Feature:** 
  - Automatic download of PDF template based on selected category.
  - Checkbox "I already have the file" to opt-out of automatic downloads.
  - Templates served from `/public/templates/`.
- **UI Improvement:**
  - Replace truncated dates in tables/lists with a clickable "View Dates" trigger.
  - Show a modal with the full date list and a highlighted calendar.

## Verification Plan

### Manual Verification
1. **Initialize Project & DB:** Setup Next.js locally and create tables in a Supabase project. Configure Supabase Auth with Google OAuth client credentials.
2. **Auth Flow:** Visit `/login`, click "Sign in with Google", and complete the Google consent screen.
3. **User Flow:** As a logged-in user, visit `/dashboard`. Verify the quota shows 12 days.
4. **Leave Request:** Navigate to `/dashboard/form`. Submit a 2-day leave request.
5. **Admin Flow:** Log in as an admin user. Visit `/admin/requests`. See the pending request. Approve it.
6. **Quota Verification:** Log back in as the user, visit `/dashboard`, and verify the quota decreased by 2 days (now 10 days) and history reflects the approval.
