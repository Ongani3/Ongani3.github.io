-- Create promotional_emails table
CREATE TABLE public.promotional_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'event', 'manual')),
  schedule TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  target_audience TEXT NOT NULL,
  last_sent TIMESTAMP WITH TIME ZONE,
  total_sent INTEGER NOT NULL DEFAULT 0,
  open_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.promotional_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for promotional_emails
CREATE POLICY "Users can view their own promotional emails" 
ON public.promotional_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own promotional emails" 
ON public.promotional_emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own promotional emails" 
ON public.promotional_emails 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own promotional emails" 
ON public.promotional_emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_promotional_emails_updated_at
BEFORE UPDATE ON public.promotional_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for promotional_emails table
ALTER TABLE public.promotional_emails REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.promotional_emails;