-- First, let's add admin role to a user who exists
-- We'll use the first profile we found earlier
INSERT INTO user_roles (user_id, role, created_by)
SELECT 
  user_id,
  'admin'::app_role,
  user_id -- Self-assigned for bootstrap
FROM profiles 
WHERE company = 'Entity Renewal Pro'
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

-- Also add admin role for user with "Admin" in first name
INSERT INTO user_roles (user_id, role, created_by)
SELECT 
  user_id,
  'admin'::app_role,
  user_id
FROM profiles
WHERE first_name = 'Admin'
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;