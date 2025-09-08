-- Fix function security warning by properly setting search_path
CREATE OR REPLACE FUNCTION log_admin_user_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile changes made by admins
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    -- Check if the user making the change is an admin
    IF EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    ) THEN
      INSERT INTO admin_user_actions (
        admin_user_id,
        target_user_id,
        action_type,
        previous_value,
        new_value,
        reason
      ) VALUES (
        auth.uid(),
        NEW.user_id,
        CASE 
          WHEN OLD.account_status != NEW.account_status THEN 'status_change'
          WHEN OLD.user_type != NEW.user_type THEN 'role_change'
          ELSE 'profile_edit'
        END,
        to_jsonb(OLD),
        to_jsonb(NEW),
        COALESCE(NEW.suspension_reason, 'Admin profile update')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;