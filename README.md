# Sicerdas - Sistem Manajemen Cuti Terpadu

Sicerdas is a modern, web-based Leave Management System designed to streamline employee leave requests and approvals. Built specifically with strict civil servant (PNS) leave quota rules in mind, it perfectly calculates, tracks, and refunds leave days across multiple academic/fiscal years.

## Features

- **Advanced Quota System**: Tracks annual leave balances with precise carry-over limits (Year N, N-1, and N-2 buckets).
- **Automated PDF Generation**: Instantly renders official Leave Request documents directly in the browser using `pdf-lib`, complete with dynamically injected metadata (recipient, exact length of employment, and coordinate tuning).
- **Admin Dashboard**: A comprehensive Command Center to review requests, manage employee profiles, and link new Google Auth accounts to official directories.
- **Robust Integrity**: Real-time validation ensures users cannot submit duplicate pending requests or exceed their allowed quota. Refunds are executed automatically via an exact deduction ledger.
- **Modern UI**: Built with Next.js, Tailwind CSS, and `shadcn/ui` for a highly polished, responsive, and minimalist user experience.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database & Auth**: Supabase (PostgreSQL)
- **PDF Generation**: pdf-lib
- **Dates**: date-fns

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env.local` file and add your Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

The core database architecture includes 5 tables:
- `profiles`
- `employees`
- `cuti`
- `leave_quota`
- `leave_quota_breakdown`

Run the provided `setup.sql` in your Supabase SQL Editor to instantly provision the required schema and relational constraints.

---

*Developed for the Magelang Utara District workflow.*
