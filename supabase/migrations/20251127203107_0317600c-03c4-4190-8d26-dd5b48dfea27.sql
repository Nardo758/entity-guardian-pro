-- Add RLS policy for admins to view all subscribers
CREATE POLICY "Admins can view all subscribers"
ON public.subscribers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update subscribers
CREATE POLICY "Admins can update all subscribers"
ON public.subscribers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));