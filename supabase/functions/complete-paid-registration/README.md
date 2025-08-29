# Complete Paid Registration Edge Function

This Supabase Edge Function handles the completion of paid user registrations by processing successful Stripe payments and creating/updating user accounts and subscriptions.

## Features

- ✅ **Payment Verification**: Validates Stripe payment intent status
- ✅ **User Management**: Creates new users or updates existing ones
- ✅ **Subscription Management**: Creates/updates subscription records
- ✅ **Rate Limiting**: Prevents abuse with IP-based rate limiting
- ✅ **Input Validation**: Comprehensive validation and sanitization
- ✅ **Error Handling**: Specific error types with user-friendly messages
- ✅ **Security**: Prevents user enumeration attacks
- ✅ **Transaction Safety**: Rollback compensation for failed operations
- ✅ **Structured Logging**: Enhanced logging with request tracking
- ✅ **TypeScript**: Full type safety with comprehensive interfaces

## API Specification

### Request

```typescript
POST /functions/v1/complete-paid-registration
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890abcdef"
}
```

### Response (Success)

```typescript
{
  "success": true,
  "userId": "uuid",
  "email": "user@example.com",
  "subscriptionTier": "pro",
  "signInUrl": "https://..."
}
```

### Response (Error)

```typescript
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* additional error details */ }
}
```

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `PAYMENT_NOT_FOUND`: Invalid payment intent ID
- `PAYMENT_NOT_COMPLETED`: Payment not successful
- `USER_CREATION_FAILED`: Failed to create user account
- `USER_UPDATE_FAILED`: Failed to update user account
- `SUBSCRIPTION_CREATION_FAILED`: Failed to create subscription
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unexpected error

## Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `STRIPE_SECRET_KEY`: Stripe secret key

## Required Stripe Metadata

The payment intent must include the following metadata:

- `email`: User's email address
- `registration`: Registration identifier
- `first_name`: User's first name
- `last_name`: User's last name
- `company`: Company name (optional)
- `company_size`: Company size (optional)
- `tier`: Subscription tier (basic, pro, enterprise)
- `billing`: Billing period (monthly, yearly)

## Database Schema

### subscribers table

```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  subscribed BOOLEAN DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  payment_intent_id TEXT UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features

1. **Rate Limiting**: 5 requests per minute per IP
2. **Input Validation**: All inputs validated and sanitized
3. **User Enumeration Protection**: Secure user lookup via RPC
4. **Duplicate Prevention**: Checks for duplicate payment processing
5. **Request Tracking**: UUID-based request tracking for debugging

## Rollback Safety

The function implements compensating transactions:
- If subscription creation fails after user creation, the user is deleted
- All operations are logged for audit trail
- Graceful error handling with appropriate HTTP status codes

## Testing

See `test.ts` for comprehensive test examples including:
- Valid payment processing
- Error handling scenarios
- Rate limiting tests
- Security validation