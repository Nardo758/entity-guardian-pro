import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'admin_salt_v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password)
  return computedHash === hash
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

function getClientIP(req: Request): string {
  return req.headers.get('x-real-ip') || 
         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         '0.0.0.0'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Check if setup is required
    if (action === 'check-setup') {
      const { data, error } = await supabase.rpc('admin_setup_required')
      
      if (error) {
        console.error('Error checking setup:', error)
        throw new Error('Failed to check setup status')
      }

      return new Response(
        JSON.stringify({ setupRequired: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Setup first admin account
    if (action === 'setup') {
      // Verify no admins exist
      const { data: setupRequired } = await supabase.rpc('admin_setup_required')
      
      if (!setupRequired) {
        return new Response(
          JSON.stringify({ error: 'Admin already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { email, password, displayName } = await req.json()

      if (!email || !password || !displayName) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and display name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Password strength validation
      if (password.length < 12) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 12 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const passwordHash = await hashPassword(password)

      const { data: admin, error: createError } = await supabase
        .from('admin_accounts')
        .insert({
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          password_hash: passwordHash,
          permissions: ['all'],
          ip_whitelist: [clientIP]
        })
        .select('id, email, display_name')
        .single()

      if (createError) {
        console.error('Error creating admin:', createError)
        if (createError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Email already exists' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw createError
      }

      console.log(`First admin account created: ${email}`)

      return new Response(
        JSON.stringify({ success: true, admin: { id: admin.id, email: admin.email, displayName: admin.display_name } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Login
    if (action === 'login') {
      const { email, password } = await req.json()

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get admin account
      const { data: admin, error: adminError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (adminError || !admin) {
        // Record failure even for non-existent accounts (timing attack prevention)
        await supabase.rpc('record_admin_login_failure', { 
          p_email: email.toLowerCase().trim(), 
          p_ip: clientIP 
        })
        
        console.log(`Admin login failed - account not found: ${email}`)
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if account is locked
      if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        console.log(`Admin login blocked - account locked: ${email}`)
        return new Response(
          JSON.stringify({ 
            error: 'Account temporarily locked', 
            lockedUntil: admin.locked_until 
          }),
          { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if account is active
      if (!admin.is_active) {
        console.log(`Admin login failed - account disabled: ${email}`)
        return new Response(
          JSON.stringify({ error: 'Account is disabled' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify password
      const passwordValid = await verifyPassword(password, admin.password_hash)
      
      if (!passwordValid) {
        const { data: lockResult } = await supabase.rpc('record_admin_login_failure', { 
          p_email: email.toLowerCase().trim(), 
          p_ip: clientIP 
        })
        
        console.log(`Admin login failed - invalid password: ${email}`)
        
        if (lockResult?.[0]?.is_locked) {
          return new Response(
            JSON.stringify({ 
              error: 'Account temporarily locked due to too many failed attempts', 
              lockedUntil: lockResult[0].locked_until 
            }),
            { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check IP whitelist (if configured)
      if (admin.ip_whitelist && admin.ip_whitelist.length > 0) {
        const ipAllowed = admin.ip_whitelist.some((ip: string) => ip === clientIP)
        if (!ipAllowed) {
          console.log(`Admin login blocked - IP not whitelisted: ${email} from ${clientIP}`)
          
          // Log security event
          await supabase.rpc('log_admin_panel_action', {
            p_admin_id: admin.id,
            p_action_type: 'login_blocked_ip',
            p_action_category: 'authentication',
            p_description: `Login blocked from non-whitelisted IP: ${clientIP}`,
            p_severity: 'warning',
            p_metadata: { ip: clientIP, user_agent: userAgent }
          })
          
          return new Response(
            JSON.stringify({ error: 'Access denied from this IP address' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Create session
      const sessionToken = generateSessionToken()
      
      const { data: sessionId, error: sessionError } = await supabase.rpc('create_admin_session', {
        p_admin_id: admin.id,
        p_token: sessionToken,
        p_ip: clientIP,
        p_user_agent: userAgent
      })

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        throw sessionError
      }

      // Log successful login
      await supabase.rpc('log_admin_panel_action', {
        p_admin_id: admin.id,
        p_action_type: 'login_success',
        p_action_category: 'authentication',
        p_description: `Admin logged in from ${clientIP}`,
        p_severity: 'info',
        p_metadata: { ip: clientIP, user_agent: userAgent }
      })

      console.log(`Admin login successful: ${email}`)

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionToken,
          admin: {
            id: admin.id,
            email: admin.email,
            displayName: admin.display_name,
            permissions: admin.permissions,
            mfaEnabled: admin.mfa_enabled,
            isSiteOwner: admin.is_site_owner || false
          },
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify session
    if (action === 'verify-session') {
      const authHeader = req.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No token provided' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: sessionData, error: sessionError } = await supabase
        .rpc('validate_admin_session', { p_token: token })

      if (sessionError) {
        console.error('Error validating session:', sessionError)
        throw sessionError
      }

      const session = sessionData?.[0]
      
      if (!session?.is_valid) {
        return new Response(
          JSON.stringify({ valid: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get is_site_owner from admin_accounts
      const { data: adminData } = await supabase
        .from('admin_accounts')
        .select('is_site_owner')
        .eq('id', session.admin_id)
        .single()

      return new Response(
        JSON.stringify({
          valid: true,
          admin: {
            id: session.admin_id,
            email: session.email,
            displayName: session.display_name,
            permissions: session.permissions,
            isSiteOwner: adminData?.is_site_owner || false
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Logout
    if (action === 'logout') {
      const authHeader = req.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (token) {
        await supabase.rpc('invalidate_admin_session', { p_token: token })
        console.log('Admin session invalidated')
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
