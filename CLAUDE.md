# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**syde** is a full-stack social community platform built with Next.js and Supabase. The platform includes features for social networking, including Clubs (group activities), Logs (personal posts/blogs), Meetups (event organization), and user profiles with rich text editing capabilities.

**Tech Stack:**
- Framework: Next.js 15+ (App Router) with Turbopack
- Language: TypeScript
- Backend: Supabase (Auth, Database, Storage)
- UI: Tailwind CSS, shadcn/ui (New York style), Radix UI
- State Management: TanStack Query (React Query) for server state
- Rich Text: Tiptap editor
- Deployment: Vercel

## Development Commands

```bash
# Start development server with Turbopack (runs on http://localhost:3000)
npm run dev

# Build production bundle
npm run build

# Start production server (requires build first)
npm run start

# Run ESLint
npm run lint

# Build with bundle analyzer (opens visualization in browser)
npm run analyze
```

## Architecture

### Directory Structure

- `app/` - Next.js App Router pages and routes
  - `[username]/` - Dynamic user profile pages
  - `auth/` - Authentication flows (login, confirm, error pages)
  - `club/` - Club features (create, view, manage clubs)
  - `log/` - Log (posts) features
  - `meetup/` - Event/meetup features
  - `profile/` - User profile management
  - `search/` - Search functionality
  - Server Actions are co-located with routes in `*-actions.ts` files

- `components/` - React components organized by feature
  - `auth/` - Authentication UI components
  - `club/` - Club-related components
  - `log/` - Log (post) components
  - `meetup/` - Meetup components
  - `ui/` - shadcn/ui base components
  - Feature-specific components are grouped in their respective folders

- `lib/` - Shared utilities and core logic
  - `supabase/` - Supabase client configuration
    - `client.ts` - Browser client (client components)
    - `server.ts` - Server client (server components, actions)
    - `middleware.ts` - Middleware for session management
  - `queries/` - Data fetching logic (e.g., `log-queries.ts`)
  - `cache/` - Server-side caching utilities (e.g., `log-cache.ts`)
  - `storage.ts` - File upload/storage helpers
  - `error-handler.ts` - Error handling utilities and wrappers
  - `utils.tsx` - General utility functions
  - `constants.ts` - Application constants

- `types/` - TypeScript type definitions
  - `database.types.ts` - Auto-generated Supabase database types

- `context/` - React Context providers (e.g., `LoginDialogContext.tsx`)

- `hooks/` - Custom React hooks

### Data Flow

1. **Server-Side Data Fetching**: Initial page loads use Server Components with data fetched via Supabase server client (`lib/supabase/server.ts`)

2. **Client-Side Data Management**: Client interactions use TanStack Query for caching and mutations, with data fetched via Supabase browser client (`lib/supabase/client.ts`)

3. **Server Actions**: Data mutations are handled via Next.js Server Actions (files ending in `-actions.ts`), which:
   - Are marked with `"use server"` directive
   - Use helper wrappers from `lib/error-handler.ts` (`withAuth`, `withAuthForm`)
   - Revalidate paths after mutations using `revalidatePath()`
   - Often redirect after successful operations

4. **Middleware**: Auth session management happens in middleware (`middleware.ts`) which calls `lib/supabase/middleware.ts`

### Supabase Client Usage

**CRITICAL**: Always use the correct Supabase client for the context:

- **Server Components & Server Actions**: Use `createClient()` from `lib/supabase/server.ts`
  ```typescript
  import { createClient } from "@/lib/supabase/server";
  const supabase = await createClient();
  ```

- **Client Components**: Use `createClient()` from `lib/supabase/client.ts`
  ```typescript
  import { createClient } from "@/lib/supabase/client";
  const supabase = createClient();
  ```

Both clients are typed with `Database` from `@/types/database.types`.

### Query Optimization Patterns

The codebase implements several optimization strategies for Supabase queries:

1. **Separate Queries for Counts**: Instead of complex subqueries, fetch counts separately and combine in-memory (see `lib/queries/log-queries.ts` and `lib/cache/log-cache.ts`)

2. **Batch Fetching**: Mentioned profiles and related data are fetched in batches to avoid N+1 queries

3. **Client vs Server Queries**: Similar query logic exists in both:
   - `lib/queries/log-queries.ts` - Client-side with browser Supabase client
   - `lib/cache/log-cache.ts` - Server-side with server Supabase client

4. **Set-Based Lookups**: Use `Set` for O(1) lookups when determining user interactions (likes, bookmarks)

### Styling

- **Tailwind**: Utility-first styling with custom theme defined in `tailwind.config.ts`
  - Primary brand color: `#002040` (sydenightblue)
  - Typography plugin configured for rich text content
  - Custom font size: `text-log-content` (15px)

- **shadcn/ui**: Components use "New York" style variant (see `components.json`)
  - Path aliases configured: `@/components`, `@/lib`, `@/hooks`, etc.
  - Icons from `lucide-react`

### Performance Optimizations

The `next.config.ts` includes several performance optimizations:

1. **Code Splitting**: Custom webpack config splits vendor chunks (Radix UI, Tiptap, React Query, Supabase)
2. **Package Import Optimization**: Optimizes imports for large libraries
3. **Image Optimization**:
   - Allowed domains: Supabase storage, Kakao CDN
   - Minimum cache TTL: 1 week
4. **Production**: Removes console.log statements automatically
5. **Server Actions**: Body size limit increased to 50MB (for image uploads - marked as FIXME)

### Error Handling

Server Actions should use wrappers from `lib/error-handler.ts`:

- `withAuth(handler)` - Requires authenticated user, provides `supabase` and `user`
- `withAuthForm(handler)` - Same as withAuth but for FormData submissions
- `validateRequired(value, fieldName)` - Validates required form fields

Example:
```typescript
export const createLog = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "내용");
    // ... logic
  }
);
```

### Environment Variables

Required variables (configured in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Development Notes

- The codebase has a Korean user base; many UI strings and error messages are in Korean
- Main branch for PRs: `main`
- Current feature branch: `feature/bugfix_SBS`
- Testing framework is not currently configured in package.json
- Bundle analysis available via `npm run analyze`
