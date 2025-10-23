# Supabase Database Setup

## Step 1: Run the SQL Schema

Go to your Supabase dashboard:

1. Navigate to: https://supabase.com/dashboard/project/vojsbczzgwjgymiaadlh
2. Go to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** to execute

This will create:

- `profiles` table (user profiles)
- `workspaces` table (company workspaces)
- `monitoring_prompts` table (AI-generated prompts)
- All necessary indexes
- Row Level Security (RLS) policies
- Triggers for auto-creation and timestamps

## Step 2: Verify Setup

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'workspaces', 'monitoring_prompts');
```

You should see all three tables listed.

## Step 3: Test RLS Policies

RLS policies are enabled automatically. Test by querying:

```sql
-- This should work (returns empty set if no users yet)
SELECT * FROM profiles;

-- This should work
SELECT * FROM workspaces;

-- This should work
SELECT * FROM monitoring_prompts;
```

## Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vojsbczzgwjgymiaadlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

After setting up the database:

1. Test user registration flow
2. Verify email verification works
3. Check that profiles are auto-created on signup
4. Test workspace creation
5. Test prompt generation and storage
