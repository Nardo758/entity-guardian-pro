-- Create referral tracking and incentive system tables
CREATE TABLE public.referral_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  referrer_reward_type text NOT NULL CHECK (referrer_reward_type IN ('fee_discount', 'free_months', 'credits', 'cash')),
  referrer_reward_value numeric NOT NULL,
  referee_reward_type text CHECK (referee_reward_type IN ('fee_discount', 'free_months', 'credits', 'cash')),
  referee_reward_value numeric,
  min_referrals_for_tier integer DEFAULT 1,
  max_rewards_per_user integer,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user referrals tracking
CREATE TABLE public.user_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referee_id uuid,
  referral_code text NOT NULL UNIQUE,
  referral_type text NOT NULL CHECK (referral_type IN ('agent_invitation', 'entity_owner_referral', 'general_referral')),
  entity_id uuid,
  program_id uuid REFERENCES public.referral_programs(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded', 'expired')),
  invitation_sent_at timestamp with time zone DEFAULT now(),
  signed_up_at timestamp with time zone,
  converted_at timestamp with time zone,
  rewarded_at timestamp with time zone,
  reward_amount numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agent notifications table
CREATE TABLE public.agent_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  entity_owner_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('client_request', 'invitation_received', 'project_update')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  action_label text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create invitation analytics table
CREATE TABLE public.invitation_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id uuid,
  referral_id uuid REFERENCES public.user_referrals(id),
  event_type text NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'signed_up', 'converted')),
  user_agent text,
  ip_address inet,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agent directory profiles
CREATE TABLE public.agent_directory_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  is_featured boolean NOT NULL DEFAULT false,
  specializations text[] DEFAULT '{}',
  success_stories text,
  client_testimonials jsonb DEFAULT '[]'::jsonb,
  average_rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  response_time_hours integer,
  completion_rate numeric(5,2) DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  professional_summary text,
  certifications text[],
  languages_spoken text[] DEFAULT '{"English"}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Create agent reviews system
CREATE TABLE public.agent_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id),
  reviewer_id uuid NOT NULL,
  entity_id uuid REFERENCES public.entities(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  service_type text,
  is_verified boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  helpful_votes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create viral marketing content table
CREATE TABLE public.viral_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL CHECK (content_type IN ('email_template', 'social_share', 'pdf_report', 'compliance_calendar')),
  template_name text NOT NULL,
  subject_line text,
  content_html text,
  content_text text,
  variables jsonb DEFAULT '{}'::jsonb,
  branding_elements jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_directory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_programs
CREATE POLICY "Admins can manage referral programs" ON public.referral_programs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

CREATE POLICY "Users can view active referral programs" ON public.referral_programs
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Users can create referrals" ON public.user_referrals
  FOR INSERT WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Users can update their referrals" ON public.user_referrals
  FOR UPDATE USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Admins can manage all referrals" ON public.user_referrals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- RLS Policies for agent_notifications
CREATE POLICY "Agents can view their notifications" ON public.agent_notifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM agents a WHERE a.id = agent_notifications.agent_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Entity owners can create agent notifications" ON public.agent_notifications
  FOR INSERT WITH CHECK (entity_owner_id = auth.uid());

CREATE POLICY "Agents can update their notifications" ON public.agent_notifications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM agents a WHERE a.id = agent_notifications.agent_id AND a.user_id = auth.uid()
  ));

-- RLS Policies for invitation_analytics
CREATE POLICY "Admins can view invitation analytics" ON public.invitation_analytics
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- RLS Policies for agent_directory_profiles
CREATE POLICY "Public can view public agent profiles" ON public.agent_directory_profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Agents can manage their directory profile" ON public.agent_directory_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM agents a WHERE a.id = agent_directory_profiles.agent_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all agent profiles" ON public.agent_directory_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- RLS Policies for agent_reviews
CREATE POLICY "Public can view public reviews" ON public.agent_reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create reviews for agents they've worked with" ON public.agent_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update their own reviews" ON public.agent_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Agents can view reviews about them" ON public.agent_reviews
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM agents a WHERE a.id = agent_reviews.agent_id AND a.user_id = auth.uid()
  ));

-- RLS Policies for viral_content
CREATE POLICY "Admins can manage viral content" ON public.viral_content
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

CREATE POLICY "Users can view active viral content" ON public.viral_content
  FOR SELECT USING (is_active = true);

-- Create functions for referral system
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
  code := replace(code, '+', 'X');
  code := replace(code, '/', 'Y');
  code := replace(code, '=', 'Z');
  
  WHILE EXISTS (SELECT 1 FROM public.user_referrals WHERE referral_code = code) LOOP
    code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    code := replace(code, '+', 'X');
    code := replace(code, '/', 'Y');
    code := replace(code, '=', 'Z');
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to track invitation analytics
CREATE OR REPLACE FUNCTION public.track_invitation_event(
  referral_uuid uuid,
  event_type_param text,
  user_agent_param text DEFAULT NULL,
  ip_address_param inet DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  analytics_id uuid;
BEGIN
  INSERT INTO public.invitation_analytics (
    referral_id,
    event_type,
    user_agent,
    ip_address,
    metadata
  ) VALUES (
    referral_uuid,
    event_type_param,
    user_agent_param,
    ip_address_param,
    metadata_param
  )
  RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;

-- Function to update agent directory rating
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.agent_directory_profiles 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.agent_reviews 
      WHERE agent_id = NEW.agent_id AND is_public = true
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.agent_reviews 
      WHERE agent_id = NEW.agent_id AND is_public = true
    ),
    updated_at = now()
  WHERE agent_id = NEW.agent_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_agent_rating_trigger
  AFTER INSERT OR UPDATE ON public.agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_rating();

CREATE TRIGGER update_referral_programs_updated_at
  BEFORE UPDATE ON public.referral_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at
  BEFORE UPDATE ON public.user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_notifications_updated_at
  BEFORE UPDATE ON public.agent_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_directory_profiles_updated_at
  BEFORE UPDATE ON public.agent_directory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_reviews_updated_at
  BEFORE UPDATE ON public.agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viral_content_updated_at
  BEFORE UPDATE ON public.viral_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default referral programs
INSERT INTO public.referral_programs (name, description, referrer_reward_type, referrer_reward_value, referee_reward_type, referee_reward_value) VALUES
('Agent Referral Program', 'Registered agents get rewards for bringing new entity owners to the platform', 'fee_discount', 25, 'fee_discount', 15),
('Entity Owner Referral', 'Entity owners get credits for successful agent referrals', 'credits', 100, 'free_months', 1),
('Premium Referral Tier', 'Higher rewards for users with 5+ successful referrals', 'fee_discount', 40, 'credits', 150);

-- Insert default viral content templates
INSERT INTO public.viral_content (content_type, template_name, subject_line, content_html, variables) VALUES
('email_template', 'Agent Invitation Email', 'You''ve been invited to serve as Registered Agent for {{entity_name}}', 
'<h1>New Client Opportunity</h1><p>{{entity_owner_name}} has invited you to serve as the Registered Agent for {{entity_name}}, a {{entity_type}} in {{entity_state}}.</p><p><a href="{{invitation_link}}">Accept this opportunity</a></p><p>Powered by Entity Renewal Pro</p>',
'{"entity_name": "text", "entity_owner_name": "text", "entity_type": "text", "entity_state": "text", "invitation_link": "url"}'),

('email_template', 'Existing Agent Notification', 'New Client Request - {{entity_name}}', 
'<h1>You have a new client request!</h1><p>{{entity_owner_name}} would like you to serve as Registered Agent for {{entity_name}}.</p><p><a href="{{accept_link}}">Accept Client</a> | <a href="{{decline_link}}">Decline</a></p>',
'{"entity_name": "text", "entity_owner_name": "text", "accept_link": "url", "decline_link": "url"}'),

('social_share', 'Entity Formation Announcement', '', 
'🎉 Just formed {{entity_name}} with the help of Entity Renewal Pro! The process was seamless and professional. Highly recommend for anyone starting a business. #business #entrepreneurship #entityformation',
'{"entity_name": "text"}');