-- Add RLS policy for admins to view all entities
CREATE POLICY "Admins can view all entities"
ON public.entities
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update any entity
CREATE POLICY "Admins can update all entities"
ON public.entities
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete any entity
CREATE POLICY "Admins can delete all entities"
ON public.entities
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));