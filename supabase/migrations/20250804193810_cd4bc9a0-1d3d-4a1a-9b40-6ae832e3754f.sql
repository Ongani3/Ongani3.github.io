-- Create store_settings table for configurable store details
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_name TEXT NOT NULL DEFAULT 'Fresh Grocery Store',
  store_tagline TEXT NOT NULL DEFAULT 'Your neighborhood grocery destination',
  store_address TEXT NOT NULL DEFAULT '123 Main Street',
  store_city TEXT NOT NULL DEFAULT 'City',
  store_state TEXT NOT NULL DEFAULT 'State',
  store_zip TEXT NOT NULL DEFAULT '12345',
  contact_email TEXT NOT NULL DEFAULT 'contact@store.com',
  from_email TEXT NOT NULL DEFAULT 'promotions@resend.dev',
  website_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own store settings" 
ON public.store_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store settings" 
ON public.store_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store settings" 
ON public.store_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store settings" 
ON public.store_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();