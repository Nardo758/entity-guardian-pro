-- Fix search path for the functions to address security warnings
ALTER FUNCTION public.schedule_renewal_reminders() SET search_path = public;
ALTER FUNCTION public.schedule_payment_reminders() SET search_path = public;