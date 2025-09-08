-- Add admin role to user_roles table for existing users
INSERT INTO user_roles (user_id, role) 
SELECT user_id, 'admin'::app_role 
FROM profiles 
WHERE company = 'Entity Renewal Pro'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also add admin role for any user with first_name 'Admin'
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM profiles
WHERE first_name = 'Admin'
ON CONFLICT (user_id, role) DO NOTHING;