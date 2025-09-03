-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for quotes
CREATE POLICY "Users can view their own quotes" 
ON public.quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
ON public.quotes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
ON public.quotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for timestamps
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample data
INSERT INTO public.quotes (user_id, quote_number, customer_name, amount, status, created_date, expiry_date, items_count, notes) VALUES
(auth.uid(), 'Q-2024-001', 'Green Valley Restaurant', 12250.00, 'pending', now() - interval '5 days', now() + interval '25 days', 15, 'Wholesale produce order'),
(auth.uid(), 'Q-2024-002', 'Sunshine Café', 4452.50, 'accepted', now() - interval '8 days', now() + interval '22 days', 8, 'Monthly coffee and pastry supplies'),
(auth.uid(), 'Q-2024-003', 'Corner Deli', 8253.75, 'expired', now() - interval '45 days', now() - interval '15 days', 12, 'Bulk grocery items');

INSERT INTO public.invoices (user_id, invoice_number, customer_name, amount, status, issue_date, due_date, paid_date) VALUES
(auth.uid(), 'INV-2024-001', 'Sunshine Café', 4452.50, 'paid', now() - interval '7 days', now() + interval '23 days', now() - interval '5 days'),
(auth.uid(), 'INV-2024-002', 'Fresh Market Co.', 16000.00, 'pending', now() - interval '3 days', now() + interval '27 days', null),
(auth.uid(), 'INV-2024-003', 'Downtown Bistro', 7251.25, 'overdue', now() - interval '35 days', now() - interval '5 days', null);