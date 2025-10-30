# Welcome Email Setup Guide

This guide explains how to configure the welcome email in Supabase to be sent automatically after user registration.

## Overview

There are **two separate emails** in your system:

1. **Email Verification Email** (`emails/verify-email.html`)
   - Sent when the user needs to verify their email address
   - Uses Supabase's built-in "Confirm signup" template
   - Currently disabled in MVP mode

2. **Welcome Email** (`emails/welcome.html`)
   - Sent after successful registration to welcome new users
   - Not a built-in Supabase template - needs custom implementation
   - Can be sent via Edge Function, Database Trigger, or from your application

This guide focuses on setting up both templates correctly.

## Step 1: Copy the Template HTML

1. Open the file `emails/welcome.html` in your project
2. Copy the entire HTML content

## Step 2: Configure Email Templates in Supabase Dashboard

### A. Email Verification Template (Confirm Signup - OTP Token)

1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **Email Templates**
3. Find the **"Confirm signup"** template
4. Click **"Edit"** on the template
5. Copy and paste the HTML content from `emails/verify-email.html`
6. Click **"Save"**

**Important:** This template uses OTP (One-Time Password) authentication. The template uses the `{{ .Token }}` variable which Supabase automatically populates with a 6-digit verification code.

**Template Variables:**

- `{{ .Token }}` - The 6-digit OTP code (automatically provided by Supabase)
- `{{ .SiteURL }}` - Your application URL (set in Supabase Settings)
- `{{ .Email }}` - User's email address

**Note:** This template is used when email verification is enabled. Currently disabled in MVP mode, but ready to use when you re-enable verification.

### B. Welcome Email Template

Supabase doesn't have a built-in "Welcome" email template. You need to implement this separately using one of Ó.

**Option 1: Send from Signup API Endpoint** (Recommended for MVP)

- Modify `app/api/auth/signup/route.ts` to send welcome email after successful registration
- Use Supabase Admin API or a service like Resend to send the email
- Use the template from `emails/welcome.html`

**Option 2: Database Trigger + Edge Function**

- Create a database trigger on `auth.users` table
- Trigger a Supabase Edge Function that sends the welcome email
- More complex but fully automated

## Step 3: Configure Email Settings

1. In Supabase Dashboard, go to: **Authentication** → **Settings** → **Auth**
2. Scroll down to **"Email Auth"** section
3. Make sure **"Enable Email Signup"** is enabled
4. Make sure **"Confirm email"** is **DISABLED** (as per your MVP setup)

## Step 4: Enable Welcome Email Sending

Since email verification is disabled, you have two options:

### Option A: Using Database Trigger (Recommended)

Create a database trigger that sends the welcome email when a user is created. This requires using Supabase Edge Functions or a webhook.

### Option B: Manual Send from Signup API

Modify the signup endpoint to manually send the welcome email after successful registration.

## Template Variables

The email template uses Supabase's template variables:

- `{{ .SiteURL }}` - Your application URL (set in Supabase Settings)
- `{{ .User.Email }}` - User's email address
- `{{ .User.FirstName }}` - User's first name (if available in user metadata)

## Customization

You can customize the welcome email by editing `emails/welcome.html`:

- Change the greeting message
- Add or remove features list items
- Update support email address
- Modify styling and colors

## Testing

To test the welcome email:

1. Register a new user through your application
2. Check the email inbox of the registered email address
3. Verify that the email looks correct and all links work

## Notes

- Make sure SMTP is configured in Supabase (see `docs/supabase-smtp-setup.md`)
- The email will only be sent if email verification is enabled OR if you manually trigger it
- If email verification is disabled, you may need to send the email manually via your signup API endpoint

## Troubleshooting

### Email not sending

1. Check SMTP configuration in Supabase Dashboard
2. Verify that email templates are saved correctly
3. Check Supabase logs for email delivery errors
4. Ensure rate limits are not being exceeded

### Template variables not working

- Make sure you're using the correct variable syntax: `{{ .VariableName }}`
- Verify that the variables are available in the context when the email is sent

### Email going to spam

- Configure SPF, DKIM, and DMARC records for your domain
- Use a professional email address matching your domain
- Warm up your sending reputation gradually
