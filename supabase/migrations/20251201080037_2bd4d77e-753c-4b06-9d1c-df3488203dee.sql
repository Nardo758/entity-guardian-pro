-- Unlock admin account sohailmd@dotlinkertech.com
UPDATE admin_accounts 
SET failed_attempts = 0, locked_until = NULL 
WHERE email = 'sohailmd@dotlinkertech.com';