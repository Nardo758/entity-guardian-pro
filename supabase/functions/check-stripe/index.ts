// File: supabase/functions/check-stripe/index.ts
type CheckResult = {
  ok: boolean
  issues?: string[]
  details?: {
    hasPublishableKey: boolean
    hasSecretKey: boolean
    hasAuthHeader: boolean
    authTokenDecoded?: { header?: unknown; payload?: unknown }
  }
}

console.info('check-stripe function started')

function decodeJwt(token: string) {
  try {
    const [headerB64, payloadB64] = token.split('.')
    if (!headerB64 || !payloadB64) return null
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')))
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    return { header, payload }
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  const issues: string[] = []

  // Check Authorization header presence
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  const hasAuthHeader = !!authHeader
  if (!hasAuthHeader) {
    issues.push('Missing authorization header')
  }

  // Basic JWT check if present (don't enforce validation beyond shape)
  let authTokenDecoded: { header?: unknown; payload?: unknown } | undefined
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length)
    const decoded = decodeJwt(token)
    if (!decoded) {
      issues.push('Authorization token is not a valid JWT format')
    } else {
      authTokenDecoded = decoded
    }
  }

  // Check environment variables
  const pk = Deno.env.get('STRIPE_PUBLISHABLE_KEY')
  const sk = Deno.env.get('STRIPE_SECRET_KEY')

  const hasPublishableKey = !!pk
  const hasSecretKey = !!sk

  if (!hasPublishableKey) issues.push('Stripe publishable key not configured')
  if (!hasSecretKey) issues.push('Stripe secret key not configured')

  const result: CheckResult = {
    ok: issues.length === 0,
    issues: issues.length ? issues : undefined,
    details: {
      hasPublishableKey,
      hasSecretKey,
      hasAuthHeader,
      authTokenDecoded,
    },
  }

  const status = result.ok ? 200 : 401
  return new Response(JSON.stringify(result, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  })
})
