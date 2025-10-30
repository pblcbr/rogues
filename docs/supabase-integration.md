# Supabase Integration Guide

This guide will help you integrate Supabase authentication into the tacmind platform.

## Installation

First, install the required Supabase packages:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## Environment Variables

1. Copy the example environment file:

```bash
cp env.example .env.local
```

2. Add your Supabase credentials to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Where to find these values:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Project Structure

The Supabase integration includes:

```
lib/
├── supabase/
│   ├── client.ts       # Client-side Supabase client
│   ├── server.ts       # Server-side Supabase client
│   └── middleware.ts   # Middleware for session management
├── auth/
│   └── actions.ts      # Server actions for authentication
```

## Usage Examples

### 1. Sign Up (Client Component)

```typescript
"use client";

import { signUp } from "@/lib/auth/actions";
import { useState } from "react";

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
    });

    if (result.error) {
      setError(result.error);
    } else {
      // Show success message
      alert("Check your email to confirm your account!");
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Sign In (Client Component)

```typescript
"use client";

import { signIn } from "@/lib/auth/actions";
import { useState } from "react";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, user will be redirected
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Get Current User (Server Component)

```typescript
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  );
}
```

### 4. Sign Out (Client Component)

```typescript
"use client";

import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      onClick={async () => {
        await signOut();
      }}
    >
      Sign Out
    </Button>
  );
}
```

## Middleware Setup

Create or update `middleware.ts` in your project root:

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## Authentication Flow

### Email Confirmation

By default, Supabase requires email confirmation. Configure this in:
**Authentication** → **Settings** → **Email Auth**

Options:

- Enable email confirmations
- Enable email change confirmations
- Secure email change (recommended)

### Callback Route

Create a callback route to handle email confirmations:

```typescript
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard after confirmation
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
```

## Protected Routes

Protect routes by checking authentication in Server Components:

```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Protected content
  return <div>Dashboard</div>;
}
```

## Database Schema

Create a profiles table to store additional user data:

```sql
-- Run this in Supabase SQL Editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically create a profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Testing

Test your authentication flow:

1. **Sign Up**: Visit `/register` and create an account
2. **Email Verification**: Check your email and click the confirmation link
3. **Sign In**: Visit `/login` and sign in with your credentials
4. **Protected Routes**: Try accessing `/dashboard` without signing in
5. **Sign Out**: Test the sign-out functionality

## Troubleshooting

### Common Issues:

1. **"Invalid JWT token"**
   - Clear cookies and try again
   - Check if your environment variables are correct

2. **Emails not sending**
   - See [SMTP Configuration Guide](./supabase-smtp-setup.md)
   - Check Supabase logs in Dashboard → Logs → Auth

3. **"Failed to fetch"**
   - Check if NEXT_PUBLIC_SUPABASE_URL is correct
   - Verify network connection

4. **Session not persisting**
   - Check middleware configuration
   - Verify cookies are enabled in browser

## Security Best Practices

1. **Never expose service role key** to the client
2. **Enable Row Level Security (RLS)** on all tables
3. **Use secure cookies** in production
4. **Implement rate limiting** for auth endpoints
5. **Enable email verification** before allowing access
6. **Use HTTPS** in production
7. **Rotate API keys** regularly

## Next Steps

- [ ] Configure SMTP for email delivery
- [ ] Set up user profiles table
- [ ] Implement password reset flow
- [ ] Add OAuth providers (Google, GitHub, etc.)
- [ ] Configure Row Level Security policies
- [ ] Set up email templates
- [ ] Implement multi-factor authentication
- [ ] Add audit logging

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
