import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsageCheck {
  userId: string;
  entitiesUsed: number;
  entitiesLimit: number;
  storageUsed: number;
  storageLimit: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting usage limit check for all users...');

    // Get all active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from('subscribers')
      .select('user_id, entities_limit, subscription_tier')
      .eq('subscribed', true);

    if (subsError) {
      console.error('Error fetching subscribers:', subsError);
      throw subsError;
    }

    console.log(`Found ${subscribers?.length || 0} active subscribers to check`);

    const threshold = 90; // 90% threshold
    const alertsCreated = [];

    for (const subscriber of subscribers || []) {
      try {
        // Get entities count
        const { count: entitiesCount } = await supabase
          .from('entities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', subscriber.user_id);

        // Get documents count for storage estimate
        const { count: documentsCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', subscriber.user_id);

        const entitiesUsed = entitiesCount || 0;
        const entitiesLimit = subscriber.entities_limit || 10;
        const storageUsed = (documentsCount || 0) * 0.5;
        const storageLimit = getStorageLimit(subscriber.subscription_tier);

        // Check entities threshold
        const entitiesPercentage = (entitiesUsed / entitiesLimit) * 100;
        if (entitiesPercentage >= threshold) {
          await createAlert(
            supabase,
            subscriber.user_id,
            'entities',
            entitiesPercentage,
            entitiesUsed,
            entitiesLimit
          );
          alertsCreated.push({
            userId: subscriber.user_id,
            type: 'entities',
            percentage: entitiesPercentage,
          });
        }

        // Check storage threshold
        const storagePercentage = (storageUsed / storageLimit) * 100;
        if (storagePercentage >= threshold) {
          await createAlert(
            supabase,
            subscriber.user_id,
            'storage',
            storagePercentage,
            storageUsed,
            storageLimit,
            'GB'
          );
          alertsCreated.push({
            userId: subscriber.user_id,
            type: 'storage',
            percentage: storagePercentage,
          });
        }

        console.log(`Checked user ${subscriber.user_id}: Entities ${entitiesPercentage.toFixed(0)}%, Storage ${storagePercentage.toFixed(0)}%`);
      } catch (userError) {
        console.error(`Error checking user ${subscriber.user_id}:`, userError);
      }
    }

    console.log(`Created ${alertsCreated.length} usage alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        usersChecked: subscribers?.length || 0,
        alertsCreated: alertsCreated.length,
        alerts: alertsCreated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-usage-limits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function createAlert(
  supabase: any,
  userId: string,
  type: string,
  percentage: number,
  used: number,
  limit: number,
  unit: string = ''
) {
  // Check if alert already exists in last 24 hours
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'warning')
    .ilike('title', `%${type}%`)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Alert already exists for user ${userId} - ${type}`);
    return;
  }

  const usageText = unit 
    ? `${used.toFixed(1)} ${unit} of ${limit} ${unit}`
    : `${used} of ${limit}`;

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'warning',
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Limit Warning`,
      message: `You've used ${percentage.toFixed(0)}% of your ${type} limit (${usageText}). Consider upgrading your plan to avoid service interruption.`,
      read: false,
    });

  if (error) {
    console.error(`Error creating alert for user ${userId}:`, error);
    throw error;
  }

  console.log(`Created ${type} alert for user ${userId}`);
}

function getStorageLimit(tier: string): number {
  const limits: Record<string, number> = {
    free: 1,
    starter: 5,
    pro: 25,
    premium: 100,
  };
  return limits[tier] || 5;
}
