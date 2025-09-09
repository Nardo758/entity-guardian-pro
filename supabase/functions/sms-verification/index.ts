import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phone: string;
  action: 'send' | 'verify';
  code?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Authentication failed");
    }

    const { phone, action, code }: SMSRequest = await req.json();

    // Apply rate limiting for SMS verification
    if (action === 'send') {
      const rateLimitResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/rate-limiter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          endpoint: 'sms-verification',
          userId: user.id
        })
      });

      if (!rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        if (rateLimitResponse.status === 429) {
          return new Response(JSON.stringify({
            error: "Too many SMS verification attempts. Please try again later.",
            retryAfter: rateLimitData.retryAfter
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 429,
          });
        }
      }
    }

    if (action === 'send') {
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store in database with expiration
      const { error: insertError } = await supabaseClient
        .from('phone_verifications')
        .upsert({
          user_id: user.id,
          phone: phone,
          code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          verified: false
        });

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      // In production, integrate with SMS service like Twilio
      // For now, return the code for testing
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        // Send actual SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const formData = new URLSearchParams();
        formData.append('To', phone);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', `Your EntityRenewal Pro verification code is: ${verificationCode}`);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        if (!twilioResponse.ok) {
          console.error('Twilio API error:', await twilioResponse.text());
          throw new Error('Failed to send SMS');
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Verification code sent to your phone" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Development mode - log code securely, never return in response
        console.log(`SMS verification code for ${phone}: ${verificationCode}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "SMS service not configured. In production, this would send SMS. Check server logs for verification code."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

    } else if (action === 'verify') {
      if (!code) {
        throw new Error("Verification code required");
      }

      // Check verification code
      const { data: verification, error: selectError } = await supabaseClient
        .from('phone_verifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (selectError || !verification) {
        throw new Error("Invalid or expired verification code");
      }

      // Mark as verified
      const { error: updateError } = await supabaseClient
        .from('phone_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('id', verification.id);

      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`);
      }

      // Update user profile with verified phone
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ 
          phone_number: phone,
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Phone number verified successfully" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("SMS verification error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "SMS verification failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});