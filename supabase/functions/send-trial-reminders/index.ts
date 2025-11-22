import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting trial reminder check...');

    const now = new Date();
    
    // Find users whose trial expires in exactly 3 days (haven't been sent 3-day reminder)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysStart = new Date(threeDaysFromNow.setHours(0, 0, 0, 0));
    const threeDaysEnd = new Date(threeDaysFromNow.setHours(23, 59, 59, 999));

    const { data: threeDayUsers, error: threeDayError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('is_trial_active', true)
      .eq('trial_reminder_3_days_sent', false)
      .gte('trial_start', new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString()) // trial_start was 11 days ago
      .lte('trial_start', new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()); // trial_start was 11 days ago (24hr window)

    if (threeDayError) {
      console.error('Error fetching 3-day trial users:', threeDayError);
      throw threeDayError;
    }

    // Find users whose trial expires in exactly 1 day (haven't been sent 1-day reminder)
    const { data: oneDayUsers, error: oneDayError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('is_trial_active', true)
      .eq('trial_reminder_1_day_sent', false)
      .gte('trial_start', new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString()) // trial_start was 13 days ago
      .lte('trial_start', new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString()); // 24hr window

    if (oneDayError) {
      console.error('Error fetching 1-day trial users:', oneDayError);
      throw oneDayError;
    }

    console.log(`Found ${threeDayUsers?.length || 0} users for 3-day reminders`);
    console.log(`Found ${oneDayUsers?.length || 0} users for 1-day reminders`);

    const results = {
      threeDayReminders: 0,
      oneDayReminders: 0,
      errors: [] as string[]
    };

    // Send 3-day reminders
    if (threeDayUsers && threeDayUsers.length > 0) {
      for (const user of threeDayUsers) {
        try {
          const trialEndDate = new Date(new Date(user.trial_start).getTime() + 14 * 24 * 60 * 60 * 1000);
          
          await resend.emails.send({
            from: "Entity Renewal Pro <notifications@resend.dev>",
            to: [user.email],
            subject: "Your trial ends in 3 days - Don't miss out!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                  <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
                </div>
                <div style="padding: 30px 20px;">
                  <h2 style="color: #333; margin-bottom: 20px;">⏰ Your Free Trial Ends Soon</h2>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    Hi there! We wanted to remind you that your 14-day free trial will end in <strong>3 days</strong> on ${trialEndDate.toLocaleDateString()}.
                  </p>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    Don't lose access to all the great features you've been enjoying:
                  </p>
                  <ul style="color: #666; line-height: 1.8; font-size: 16px;">
                    <li>Unlimited entity management</li>
                    <li>Automated compliance tracking</li>
                    <li>Renewal reminders</li>
                    <li>Document storage</li>
                  </ul>
                  <div style="margin: 30px 0; text-align: center;">
                    <a href="https://wcuxqopfcgivypbiynjp.supabase.co/billing" 
                       style="background-color: #1976d2; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                      Upgrade Now
                    </a>
                  </div>
                  <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Questions? We're here to help! Just reply to this email.
                  </p>
                </div>
              </div>
            `,
          });

          // Mark as sent
          await supabase
            .from('subscribers')
            .update({ trial_reminder_3_days_sent: true })
            .eq('id', user.id);

          results.threeDayReminders++;
          console.log(`Sent 3-day reminder to ${user.email}`);
        } catch (error) {
          console.error(`Error sending 3-day reminder to ${user.email}:`, error);
          results.errors.push(`3-day reminder to ${user.email}: ${error.message}`);
        }
      }
    }

    // Send 1-day reminders
    if (oneDayUsers && oneDayUsers.length > 0) {
      for (const user of oneDayUsers) {
        try {
          const trialEndDate = new Date(new Date(user.trial_start).getTime() + 14 * 24 * 60 * 60 * 1000);
          
          await resend.emails.send({
            from: "Entity Renewal Pro <notifications@resend.dev>",
            to: [user.email],
            subject: "⚠️ Last chance - Your trial ends tomorrow!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #fff3e0; padding: 20px; text-align: center; border-left: 4px solid #f57c00;">
                  <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
                </div>
                <div style="padding: 30px 20px;">
                  <h2 style="color: #f57c00; margin-bottom: 20px;">🚨 Your Trial Ends Tomorrow!</h2>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    This is your final reminder - your 14-day free trial will end <strong>tomorrow</strong> on ${trialEndDate.toLocaleDateString()}.
                  </p>
                  <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    After your trial ends, you won't be able to:
                  </p>
                  <ul style="color: #666; line-height: 1.8; font-size: 16px;">
                    <li>Add new entities</li>
                    <li>Access compliance tracking</li>
                    <li>View your documents</li>
                    <li>Receive renewal reminders</li>
                  </ul>
                  <p style="color: #666; line-height: 1.6; font-size: 16px; font-weight: bold;">
                    Upgrade now to keep everything you've built!
                  </p>
                  <div style="margin: 30px 0; text-align: center;">
                    <a href="https://wcuxqopfcgivypbiynjp.supabase.co/billing" 
                       style="background-color: #f57c00; color: white; padding: 14px 28px; 
                              text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                      Upgrade Now - Don't Lose Access
                    </a>
                  </div>
                  <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Need help deciding? Reply to this email and we'll answer any questions!
                  </p>
                </div>
              </div>
            `,
          });

          // Mark as sent
          await supabase
            .from('subscribers')
            .update({ trial_reminder_1_day_sent: true })
            .eq('id', user.id);

          results.oneDayReminders++;
          console.log(`Sent 1-day reminder to ${user.email}`);
        } catch (error) {
          console.error(`Error sending 1-day reminder to ${user.email}:`, error);
          results.errors.push(`1-day reminder to ${user.email}: ${error.message}`);
        }
      }
    }

    console.log('Trial reminder check complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-trial-reminders function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
};

serve(handler);
