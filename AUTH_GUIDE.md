# Authentication & Session Management Guide

This document explains how authentication and session management work in the Kaizen project using Supabase Auth with Google OAuth.

## Overview

The project uses **Supabase Auth** with **Google OAuth** for user authentication. Users can sign in with their Google accounts, and the system automatically creates user profiles in a `public.users` table.

## Architecture

### Components
- **Supabase Auth**: Handles OAuth flow, session management, and user authentication
- **Google OAuth**: Third-party authentication provider
- **Database**: `public.users` table stores user profile information
- **Next.js App**: Client-side session handling and UI components

### Flow
```
User → Google OAuth → Supabase Auth → Database → Next.js App
```

## Database Schema

### `public.users` Table
```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Key Features
- **Foreign Key**: `id` references `auth.users(id)` with cascade delete
- **Auto-population**: Trigger automatically creates user profiles when new auth users sign up
- **No RLS**: Row Level Security is intentionally not enabled (per project requirements)
- **Timestamps**: Automatic `created_at` and `updated_at` tracking

## Authentication Flow

### 1. Sign In Process
```
User clicks "Sign in" → Google OAuth → Supabase callback → /auth/callback → Dashboard
```

1. User clicks "Sign in" button in the topbar
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User is redirected to Google OAuth consent screen
4. After consent, Google redirects to Supabase callback URL
5. Supabase processes the OAuth response and redirects to `/auth/callback`
6. Callback page exchanges the auth code for a session
7. User is redirected to the main dashboard

### 2. Session Management
- **Session Storage**: Handled automatically by Supabase client
- **Session Persistence**: Sessions persist across browser refreshes
- **Session Validation**: Automatic validation on page load
- **Session Expiry**: Handled by Supabase (configurable in dashboard)

## File Structure

### Auth Pages
```
src/app/auth/
├── login/page.tsx          # Sign-in page with Google OAuth
└── callback/page.tsx       # OAuth callback handler
```

### Components
```
src/components/
├── UserMenu.tsx            # Topbar auth UI component
└── dashboard/
    └── DashboardHeader.tsx # Header with integrated UserMenu
```

### Database
```
supabase/migrations/
└── 20251005_add_users_table.sql  # Users table and triggers
```

## Key Components

### 1. UserMenu Component (`src/components/UserMenu.tsx`)

**Purpose**: Displays authentication status in the topbar

**Features**:
- Shows "Sign in" button when logged out
- Shows user avatar, name, and "Sign out" button when logged in
- Handles session state changes automatically
- Prevents hydration mismatches with `mounted` state

**State Management**:
```typescript
const [mounted, setMounted] = useState(false);
const [loading, setLoading] = useState(true);
const [user, setUser] = useState<SessionUser | null>(null);
```

### 2. Login Page (`src/app/auth/login/page.tsx`)

**Purpose**: Initiates Google OAuth flow

**Features**:
- Google OAuth button
- Session status display
- Redirect handling for already-signed-in users

### 3. Callback Page (`src/app/auth/callback/page.tsx`)

**Purpose**: Handles OAuth callback and session creation

**Features**:
- Exchanges auth code for session
- Handles missing code gracefully
- Redirects to dashboard on success
- Error handling and user feedback

## Session State Management

### Client-Side Session Handling
```typescript
// Get current session
const { data } = await supabase.auth.getSession();

// Listen for auth state changes
const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
  // Handle session changes
});

// Sign out
await supabase.auth.signOut();
```

### Session Data Structure
```typescript
interface SessionUser {
  email: string | null;
  userId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}
```

## Database Triggers

### Auto-User Creation
When a new user signs up via Google OAuth, a trigger automatically creates a corresponding record in `public.users`:

```sql
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### User Profile Updates
The trigger also handles profile updates:
- Extracts `full_name` and `avatar_url` from Google metadata
- Updates existing records on conflict
- Maintains data consistency between `auth.users` and `public.users`

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
```

### Supabase Dashboard Settings
1. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: `http://localhost:3000/auth/callback`

2. **Authentication → Providers**:
   - Enable Google provider
   - Add Google OAuth Client ID and Secret

3. **Google Cloud Console**:
   - Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

## Security Considerations

### Current Implementation
- **No RLS**: Row Level Security is intentionally disabled
- **Public Access**: `public.users` table is accessible without authentication
- **Session-Based**: Authentication state managed client-side

### Security Notes
- Sessions are managed by Supabase (secure by default)
- OAuth flow uses HTTPS and secure redirects
- User data is stored in Supabase's secure infrastructure
- No sensitive data is stored in localStorage or cookies

## Error Handling

### Common Issues
1. **Hydration Mismatch**: Fixed with `mounted` state in UserMenu
2. **Image Loading**: Fixed with Next.js image configuration
3. **Missing Auth Code**: Handled gracefully in callback page
4. **Session Expiry**: Automatic re-authentication prompts

### Error Recovery
- Failed OAuth flows redirect to login page
- Session errors trigger re-authentication
- Network errors show user-friendly messages
- Invalid sessions are cleared automatically

## Development Workflow

### Local Development
1. Set up environment variables
2. Configure Google OAuth credentials
3. Run migrations: `supabase db push`
4. Start development server: `npm run dev`
5. Test OAuth flow at `/auth/login`

### Testing Authentication
1. Visit `/auth/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify user appears in `public.users` table
5. Check topbar shows user profile
6. Test sign out functionality

## Troubleshooting

### Common Problems
1. **"Invalid request: both auth code and code verifier should be non-empty"**
   - Solution: Callback page now checks for auth code before exchange

2. **"hostname not configured" for Google images**
   - Solution: Added `lh3.googleusercontent.com` to Next.js image config

3. **Hydration mismatch errors**
   - Solution: Use `mounted` state to prevent server/client mismatches

4. **Session not persisting**
   - Check Supabase URL configuration
   - Verify redirect URLs match exactly
   - Check browser console for auth errors

### Debug Steps
1. Check browser network tab for OAuth redirects
2. Verify Supabase dashboard auth logs
3. Check database for user records
4. Test with different browsers/incognito mode
5. Verify environment variables are correct

## Future Enhancements

### Potential Improvements
1. **Route Protection**: Add middleware to protect authenticated routes
2. **Role-Based Access**: Implement user roles and permissions
3. **Session Refresh**: Add automatic session refresh
4. **Multi-Provider**: Support additional OAuth providers
5. **Profile Management**: Add user profile editing capabilities

### Scalability Considerations
- Current implementation supports unlimited users
- Database triggers handle user creation automatically
- Session management scales with Supabase infrastructure
- No additional server resources required for auth

## Conclusion

The authentication system provides a robust, secure, and user-friendly way to manage user sessions in the Kaizen application. The combination of Supabase Auth, Google OAuth, and Next.js creates a seamless authentication experience while maintaining security and scalability.
