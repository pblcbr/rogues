# Supabase SMTP Configuration Guide

This guide explains how to configure Gmail SMTP for Supabase email authentication in the Rogues platform.

## Prerequisites

- Supabase project created
- Gmail Professional account (Google Workspace) or personal Gmail
- Two-factor authentication enabled on your Google account

## Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (must be enabled)
3. Scroll down to **App passwords**
4. Click **Select app** → Choose "Mail"
5. Click **Select device** → Choose "Other" and enter "Supabase SMTP"
6. Click **Generate**
7. Save the 16-character password (format: `xxxx xxxx xxxx xxxx`)

> **Note**: If using Google Workspace, your admin must enable "Less secure app access" in the Admin Console.

## Step 2: Configure SMTP in Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to: **Authentication** → **Settings** → **SMTP Settings**
3. Toggle **Enable Custom SMTP** to ON
4. Fill in the following details:

```
Sender email:     your-email@yourdomain.com
Sender name:      Rogues

SMTP Configuration:
Host:             smtp.gmail.com
Port:             587 (or 465 for SSL)
Username:         your-email@yourdomain.com
Password:         [Your 16-character App Password]

Rate Limiting:
Minimum interval between emails sent: 60 (seconds)
```

5. Click **Save** at the bottom of the page

## Step 3: Test Email Configuration

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Invite user** and enter a test email
3. Check if the invitation email is sent successfully

## Step 4: Configure Email Templates (Optional)

You can customize the email templates in:
**Authentication** → **Email Templates**

Available templates:

- Confirm signup
- Invite user
- Magic link
- Change email address
- Reset password

## Alternative: Using Port 465 (SSL)

If port 587 doesn't work, try:

```
Host:     smtp.gmail.com
Port:     465
```

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Verify you're using the App Password, not your regular password
   - Ensure 2FA is enabled on your Google account
   - Check if the email and username match exactly

2. **"Connection timeout"**
   - Try port 465 instead of 587
   - Check if your firewall allows SMTP connections
   - Verify your network allows outbound SMTP traffic

3. **"Daily sending quota exceeded"**
   - Gmail has limits: 500 emails/day (personal), 2000/day (Workspace)
   - Implement rate limiting in your application
   - Consider using a dedicated email service for production

4. **Emails going to spam**
   - Configure SPF, DKIM, and DMARC records for your domain
   - Use a professional email address matching your domain
   - Warm up your sending reputation gradually

## Production Recommendations

For production environments, consider:

1. **Use a dedicated email service**:
   - SendGrid
   - AWS SES
   - Postmark
   - Mailgun

2. **Configure proper DNS records**:
   - SPF record
   - DKIM signature
   - DMARC policy

3. **Monitor email deliverability**:
   - Track bounce rates
   - Monitor spam complaints
   - Set up alerts for failed deliveries

## Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Notes

- Never commit your App Password to version control
- Rotate App Passwords periodically
- Use environment variables for sensitive data
- Monitor for suspicious login attempts
- Enable security alerts in Google Account

## Next Steps

After configuring SMTP:

1. Test user registration flow
2. Test password reset functionality
3. Customize email templates to match your brand
4. Set up monitoring for email delivery
5. Configure rate limiting to prevent abuse

## References

- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
