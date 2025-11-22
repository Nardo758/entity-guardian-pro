# Trial Reminder Email Setup

## Overview
The trial reminder system automatically sends emails to users 3 days and 1 day before their trial expires.

## Edge Function
Created: `supabase/functions/send-trial-reminders/index.ts`

This function:
- Checks for users whose trial expires in 3 days (and hasn't been sent the 3-day reminder)
- Checks for users whose trial expires in 1 day (and hasn't been sent the 1-day reminder)
- Sends reminder emails via Resend
- Tracks sent reminders in the database to prevent duplicates

## Database Changes
Added two tracking fields to the `subscribers` table:
- `trial_reminder_3_days_sent` (boolean) - tracks if 3-day reminder was sent
- `trial_reminder_1_day_sent` (boolean) - tracks if 1-day reminder was sent

## Setting Up the Cron Job

To run this function daily, you need to set up a cron job in Supabase.

### Option 1: Using Supabase SQL (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the function to run daily at 9:00 AM UTC
SELECT cron.schedule(
  'send-trial-reminders-daily',
  '0 9 * * *', -- Every day at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-trial-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2: Manual Testing

You can manually trigger the function to test it:

```bash
curl -X POST https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-trial-reminders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Email Templates

### 3-Day Reminder
- **Subject:** "Your trial ends in 3 days - Don't miss out!"
- **Content:** Friendly reminder with upgrade CTA
- **Tone:** Helpful and informative

### 1-Day Reminder
- **Subject:** "⚠️ Last chance - Your trial ends tomorrow!"
- **Content:** Urgent reminder emphasizing what they'll lose
- **Tone:** More urgent, action-oriented

## Monitoring

Check the edge function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Click on `send-trial-reminders`
3. View logs to see execution results

## Notes

- The function uses a 24-hour window to capture users (11 days ago for 3-day reminder, 13 days ago for 1-day reminder)
- Reminders are only sent once per user (tracked in database)
- Requires RESEND_API_KEY environment variable to be set
- Uses the same Resend configuration as other email notifications
