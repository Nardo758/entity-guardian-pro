# Security Report Email Setup Guide

## Overview
Automated security reports that email IP reputation data and security violations to admin users on a daily or weekly schedule.

## Prerequisites
✅ RESEND_API_KEY has been configured
✅ Edge function `send-security-report` has been created
✅ Admin users must be assigned the 'admin' role in the `user_roles` table

## Important: Resend Setup
Before setting up cron jobs, you MUST:

1. **Sign up for Resend** at https://resend.com
2. **Verify your domain** at https://resend.com/domains
   - Without domain verification, emails will only work in test mode
3. **Create an API key** at https://resend.com/api-keys
4. **Update the email sender** in `supabase/functions/send-security-report/index.ts`:
   - Change `from: "Security Reports <onboarding@resend.dev>"` to use your verified domain
   - Example: `from: "Security Reports <security@yourdomain.com>"`

## Setting Up Cron Jobs

### Step 1: Enable Required Extensions
Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### Step 2: Choose Your Schedule

#### Option A: Daily Report (Every day at 8 AM UTC)
```sql
SELECT cron.schedule(
  'daily-security-report',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-security-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o"}'::jsonb,
      body:='{"reportType": "daily"}'::jsonb
    ) as request_id;
  $$
);
```

#### Option B: Weekly Report (Every Monday at 8 AM UTC)
```sql
SELECT cron.schedule(
  'weekly-security-report',
  '0 8 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-security-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o"}'::jsonb,
      body:='{"reportType": "weekly"}'::jsonb
    ) as request_id;
  $$
);
```

#### Option C: Both Daily and Weekly
Run both SQL statements above to enable both schedules.

### Step 3: Verify Cron Jobs
Check your scheduled jobs:

```sql
SELECT * FROM cron.job;
```

### Step 4: View Cron Job Logs
Monitor execution:

```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## Manual Testing

You can manually trigger a report to test the setup:

```typescript
// From your browser console or API client
fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-security-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    reportType: 'daily',
    manualTrigger: true
  })
})
```

## Report Contents

Each security report includes:

### Email Summary
- Total IP addresses tracked
- Critical risk IPs count
- High risk IPs count
- Currently blocked IPs
- Total security violations
- Detected violation types

### CSV Attachments
1. **IP Reputation Data** - Contains:
   - IP addresses
   - Reputation scores
   - Risk levels
   - Request counts
   - Violation details
   - Block status

2. **Security Violations Log** - Contains:
   - Timestamps
   - User IDs
   - Violation types
   - Metadata
   - Metric values

## Customization

### Change Report Time
Modify the cron schedule (format: `minute hour day month weekday`):
- `0 8 * * *` = 8 AM UTC daily
- `0 20 * * *` = 8 PM UTC daily
- `0 9 * * 1` = 9 AM UTC every Monday
- `0 8 * * 1,4` = 8 AM UTC Monday and Thursday

### Change Recipients
Reports are automatically sent to all users with the 'admin' role. To manage recipients:
- Add/remove admin roles in the `user_roles` table
- Admins must have valid email addresses in `auth.users`

### Customize Email Content
Edit `supabase/functions/send-security-report/index.ts`:
- Modify the `generateEmailHtml()` function for layout changes
- Update the subject line
- Adjust the statistics displayed

## Troubleshooting

### No Emails Received
1. Check Resend domain verification
2. Verify admin users exist with valid emails
3. Check edge function logs
4. Review cron job execution logs

### Emails in Spam
1. Ensure domain is verified in Resend
2. Add SPF and DKIM records to your domain
3. Use a professional "from" address

### Cron Job Not Running
1. Verify extensions are enabled
2. Check cron.job_run_details for errors
3. Ensure Supabase project has network access
4. Verify the edge function URL and anon key

## Removing Cron Jobs

To delete a scheduled job:

```sql
SELECT cron.unschedule('daily-security-report');
-- or
SELECT cron.unschedule('weekly-security-report');
```

## Cost Considerations

- Resend free tier: 3,000 emails/month
- Edge function executions: Included in Supabase plan
- Cron jobs: No additional cost

Monitor your usage at:
- Resend: https://resend.com/settings
- Supabase: Project Dashboard → Usage
