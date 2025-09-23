# Email Confirmation Setup Guide

## সমস্যা সমাধান (Problem Resolution)

আপনার প্রজেক্টে email confirmation এর সমস্যা সমাধান করা হয়েছে। এখানে যা করা হয়েছে:

### ✅ **সমাধান করা সমস্যাগুলি:**

1. **Database Trigger যোগ করা হয়েছে**: `supabase/migrations/20250110000000_setup_auth_hooks.sql`
2. **Environment Variable ঠিক করা হয়েছে**: `RESEND_API_KEY` ব্যবহার করা হচ্ছে
3. **Email Function ঠিক করা হয়েছে**: `to` field যোগ করা হয়েছে

### 🔧 **Environment Variables সেটাপ:**

আপনাকে এই environment variables গুলি সেট করতে হবে:

#### Supabase Dashboard এ:
1. আপনার Supabase project এ যান
2. **Settings** > **API** এ যান
3. **Project API keys** সেকশনে `service_role` key কপি করুন

#### Environment Variables:
```bash
# Resend API Key (সবচেয়ে গুরুত্বপূর্ণ)
RESEND_API_KEY=your_resend_api_key_here

# Supabase Service Role Key (database trigger এর জন্য)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 📧 **Resend API Key পাওয়ার জন্য:**

1. [Resend.com](https://resend.com) এ যান
2. Account তৈরি করুন বা login করুন
3. **API Keys** সেকশনে যান
4. নতুন API key তৈরি করুন
5. API key টি copy করুন

### 🚀 **Deployment Steps:**

#### Local Development:
```bash
# 1. Environment variables সেট করুন
export RESEND_API_KEY="your_resend_api_key_here"

# 2. Supabase migration run করুন
supabase db reset

# 3. Edge functions deploy করুন
supabase functions deploy send-auth-email
```

#### Production (Supabase Dashboard):
1. **Edge Functions** সেকশনে যান
2. `send-auth-email` function এ যান
3. **Settings** > **Environment Variables** এ যান
4. `RESEND_API_KEY` add করুন

### 🧪 **Testing:**

1. নতুন user account তৈরি করুন
2. Email confirmation email আসবে
3. Email এ click করুন
4. Account confirm হবে

### 🔍 **Debugging:**

যদি এখনও email না আসে:

1. **Supabase Logs** চেক করুন:
   - Dashboard > Logs > Edge Functions
   - `send-auth-email` function এর logs দেখুন

2. **Resend Dashboard** চেক করুন:
   - Sent emails দেখুন
   - Error logs দেখুন

3. **Browser Console** চেক করুন:
   - Network tab এ API calls দেখুন
   - Console এ error messages দেখুন

### 📝 **Important Notes:**

- Email confirmation এখন automatically কাজ করবে
- User signup এর পর email আসবে
- Email confirmation এর পর user login করতে পারবে
- Development environment এ email confirmation disable করা যাবে

### 🆘 **Support:**

যদি এখনও সমস্যা থাকে:
1. Supabase logs check করুন
2. Resend dashboard check করুন  
3. Browser network tab check করুন
4. Error messages screenshot নিয়ে রাখুন
