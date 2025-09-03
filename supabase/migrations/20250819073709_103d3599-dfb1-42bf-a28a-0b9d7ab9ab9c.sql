-- Create call sessions table
CREATE TABLE public.call_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ringing', 'active', 'ended', 'declined', 'missed')),
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  duration_seconds integer,
  caller_type text NOT NULL CHECK (caller_type IN ('customer', 'admin')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user presence table
CREATE TABLE public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'in_call', 'away')),
  user_type text NOT NULL CHECK (user_type IN ('customer', 'admin')),
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create call logs table
CREATE TABLE public.call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  call_type text NOT NULL,
  duration_seconds integer,
  call_quality_rating integer CHECK (call_quality_rating >= 1 AND call_quality_rating <= 5),
  caller_feedback text,
  callee_feedback text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create call settings table
CREATE TABLE public.call_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  accept_calls boolean DEFAULT true,
  call_notifications boolean DEFAULT true,
  auto_decline_when_busy boolean DEFAULT true,
  max_call_duration_minutes integer DEFAULT 60,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_sessions
CREATE POLICY "Users can view their own call sessions" 
ON public.call_sessions 
FOR SELECT 
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create call sessions as caller" 
ON public.call_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own call sessions" 
ON public.call_sessions 
FOR UPDATE 
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- RLS Policies for user_presence
CREATE POLICY "Users can view all presence data" 
ON public.user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own presence" 
ON public.user_presence 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for call_logs
CREATE POLICY "Users can view their own call logs" 
ON public.call_logs 
FOR SELECT 
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "System can create call logs" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for call_settings
CREATE POLICY "Users can manage their own call settings" 
ON public.call_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_call_sessions_updated_at
  BEFORE UPDATE ON public.call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_settings_updated_at
  BEFORE UPDATE ON public.call_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for presence tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;