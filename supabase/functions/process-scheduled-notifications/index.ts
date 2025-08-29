import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log('Processing scheduled notifications...');

    // Get notifications that are due to be sent
    const { data: dueNotifications, error: fetchError } = await supabaseClient
      .from('scheduled_notifications')
      .select('*')
      .eq('processed', false)
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', 3); // Don't retry more than 3 times

    if (fetchError) {
      console.error('Error fetching due notifications:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueNotifications?.length || 0} notifications to process`);

    if (!dueNotifications || dueNotifications.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No notifications to process',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const notification of dueNotifications) {
      try {
        // Create in-app notification
        const { error: insertError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: notification.user_id,
            entity_id: notification.entity_id,
            type: notification.notification_type,
            notification_type: 'in_app',
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            read: false,
            email_sent: false,
            retry_count: 0,
            metadata: notification.metadata || {}
          });

        if (insertError) {
          console.error(`Error creating notification for user ${notification.user_id}:`, insertError);
          
          // Update retry count
          await supabaseClient
            .from('scheduled_notifications')
            .update({ 
              retry_count: notification.retry_count + 1,
              error_message: insertError.message 
            })
            .eq('id', notification.id);
          
          errorCount++;
          continue;
        }

        // Mark as processed
        const { error: updateError } = await supabaseClient
          .from('scheduled_notifications')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Error marking notification as processed:`, updateError);
        }

        processedCount++;
        console.log(`Processed notification: ${notification.title} for user ${notification.user_id}`);
        
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        errorCount++;
        
        // Update retry count
        await supabaseClient
          .from('scheduled_notifications')
          .update({ 
            retry_count: notification.retry_count + 1,
            error_message: error.message 
          })
          .eq('id', notification.id);
      }
    }

    console.log(`Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount,
      errors: errorCount,
      message: `Processed ${processedCount} notifications${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in process-scheduled-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});