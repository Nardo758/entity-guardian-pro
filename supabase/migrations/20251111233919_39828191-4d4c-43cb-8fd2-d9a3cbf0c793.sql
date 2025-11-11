-- Fix the business_owners table (note: table name has a space)
DROP POLICY IF EXISTS "all" ON "business _owners";

-- Add user_id column if it doesn't exist
ALTER TABLE "business _owners" ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create user-scoped policies
CREATE POLICY "users_view_own_business" ON "business _owners"
FOR SELECT USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "users_insert_own_business" ON "business _owners"
FOR INSERT WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "users_update_own_business" ON "business _owners"
FOR UPDATE USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "users_delete_own_business" ON "business _owners"
FOR DELETE USING (user_id IS NOT NULL AND auth.uid() = user_id);