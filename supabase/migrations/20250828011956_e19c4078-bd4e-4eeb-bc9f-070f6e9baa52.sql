-- Create entities table to store business entity information
CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sole_proprietorship', 'partnership', 'llc', 'c_corp', 's_corp')),
  state TEXT NOT NULL,
  formation_date TEXT NOT NULL,
  registered_agent_name TEXT NOT NULL,
  registered_agent_email TEXT NOT NULL,
  registered_agent_phone TEXT NOT NULL,
  registered_agent_fee INTEGER NOT NULL,
  registered_agent_fee_due_date TEXT,
  independent_director_name TEXT,
  independent_director_email TEXT,
  independent_director_phone TEXT,
  independent_director_fee INTEGER,
  independent_director_fee_due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entities
CREATE POLICY "Users can view their own entities" 
ON public.entities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entities" 
ON public.entities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entities" 
ON public.entities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entities" 
ON public.entities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'scheduled')),
  payment_method TEXT,
  paid_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" 
ON public.payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" 
ON public.payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'bank_account')),
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  expiry_date TEXT,
  routing_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods" 
ON public.payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_due', 'renewal_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();