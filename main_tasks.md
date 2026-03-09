# Leave Management System (Sistem Cuti)

## 1. Setup Phase
- [x] Create Next.js project with JS flags.
- [x] Install tailwind, shadcn/ui, `date-fns`, and `@supabase/ssr`.
- [x] Create `.env.local`

## 2. Supabase Setup
- [x] Define `profiles` and `cuti` tables in Supabase.
- [x] Create `lib/supabase/client.js` and `lib/supabase/server.js`.
- [x] Implement `proxy.js` for route protection.

## 3. Authentication
- [x] Build `/login` magic-link form page.
- [x] Refactor `/login` to use Google OAuth button.
- [x] Configure Google Cloud OAuth Client ID and Secret (User Manual Step).
- [x] Enable Google Provider in Supabase Dashboard (User Manual Step).
- [x] Create `/auth/callback` route handler.

## 4. Components & Layout
- [x] Add Navbar with auth state and navigation.
- [x] Install Shadcn components (Button, Input, Form, Calendar, Table, Badge).

## 5. User Dashboard
- [x] Build `/dashboard` to show quota and leave history.
- [x] Build `/dashboard/form` to submit new leave requests.
- [x] Implement automatic PDF template download on category selection.
- [x] Add "I already have the file" checkbox to toggle download behavior.
- [x] Create `public/templates` directory and placeholder instructions.

## 6. Admin Panel
- [x] Build `/admin` dashboard overview.
- [x] Build `/admin/requests` to approve/reject cuti.
- [ ] Build `/admin/users` to view profiles.

## 7. UI Improvements & Polish
- [x] Implement `DateDetailsModal` for viewing leave dates.
- [x] Update Admin Requests table with date modals.
- [x] Update User Dashboard history with date modals.
