import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    console.log('Starting notification processing...');

    // Get all unprocessed notifications that are due
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('processed', false)
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', supabase.raw('max_retries'));

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${scheduledNotifications?.length || 0} notifications to process`);

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to process', processed: 0 }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each notification
    for (const notification of scheduledNotifications) {
      try {
        console.log(`Processing notification ${notification.id}`);

        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', notification.user_id)
          .single();

        if (profileError) {
          throw new Error(`Failed to get user profile: ${profileError.message}`);
        }

        // Get user auth info for email
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(notification.user_id);
        
        if (authError || !user?.email) {
          throw new Error(`Failed to get user email: ${authError?.message || 'No email found'}`);
        }

        // Get user notification preferences
        const { data: preferences, error: prefError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', notification.user_id)
          .single();

        // Use defaults if no preferences found
        const userPrefs = preferences || {
          email_notifications: true,
          notification_types: ['renewal_reminder', 'payment_due', 'compliance_check']
        };

        // Create in-app notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: notification.user_id,
            entity_id: notification.entity_id,
            type: notification.notification_type,
            notification_type: userPrefs.email_notifications ? 'both' : 'in_app',
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            read: false,
            email_sent: false,
            retry_count: 0,
            metadata: notification.metadata
          });

        if (notificationError) {
          throw new Error(`Failed to create notification: ${notificationError.message}`);
        }

        // Send email if user has email notifications enabled
        if (userPrefs.email_notifications && userPrefs.notification_types.includes(notification.notification_type)) {
          try {
            const emailPayload = {
              notification_id: notification.id,
              user_email: user.email,
              title: notification.title,
              message: notification.message,
              notification_type: notification.notification_type,
              entity_name: notification.metadata?.entity_name,
              due_date: notification.metadata?.due_date,
              amount: notification.metadata?.amount
            };

            const emailResponse = await supabase.functions.invoke('send-email-notification', {
              body: emailPayload
            });

            if (emailResponse.error) {
              throw new Error(`Email sending failed: ${emailResponse.error.message}`);
            }

            console.log(`Email sent for notification ${notification.id}`);
          } catch (emailError) {
            console.error(`Email error for notification ${notification.id}:`, emailError);
            // Don't fail the entire process for email errors
          }
        }

        // Mark scheduled notification as processed
        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        if (updateError) {
          throw new Error(`Failed to update scheduled notification: ${updateError.message}`);
        }

        processedCount++;
        console.log(`Successfully processed notification ${notification.id}`);

      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        errorCount++;

        // Update retry count and error message
        await supabase
          .from('scheduled_notifications')
          .update({
            retry_count: notification.retry_count + 1,
            error_message: error.message
          })
          .eq('id', notification.id);
      }
    }

    console.log(`Processing complete: ${processedCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: 'Notification processing complete',
        processed: processedCount,
        errors: errorCount,
        total: scheduledNotifications.length
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
    console.error("Error in process-notifications function:", error);
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