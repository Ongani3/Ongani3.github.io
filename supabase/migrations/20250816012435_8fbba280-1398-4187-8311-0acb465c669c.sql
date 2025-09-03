-- Create sales table for individual transactions
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_user_id UUID NOT NULL,
  customer_user_id UUID NULL,
  customer_name TEXT NULL,
  customer_phone TEXT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  transaction_type TEXT NOT NULL DEFAULT 'individual_sale',
  is_registered_customer BOOLEAN NOT NULL DEFAULT false,
  description TEXT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily sales summary table
CREATE TABLE public.daily_sales_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_user_id UUID NOT NULL,
  sale_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  registered_customer_sales NUMERIC NOT NULL DEFAULT 0,
  unregistered_customer_sales NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_user_id, sale_date)
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_summary ENABLE ROW LEVEL SECURITY;

-- Sales table policies
CREATE POLICY "Store owners can manage their sales" 
ON public.sales 
FOR ALL 
USING (auth.uid() = store_user_id);

-- Daily sales summary policies  
CREATE POLICY "Store owners can manage their daily summaries"
ON public.daily_sales_summary
FOR ALL
USING (auth.uid() = store_user_id);

-- Add updated_at trigger for sales
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update daily sales summary when sales are added
CREATE OR REPLACE FUNCTION public.update_daily_sales_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update daily summary
  INSERT INTO public.daily_sales_summary (
    store_user_id, 
    sale_date, 
    total_amount, 
    registered_customer_sales, 
    unregistered_customer_sales, 
    transaction_count
  )
  VALUES (
    NEW.store_user_id,
    NEW.sale_date,
    NEW.amount,
    CASE WHEN NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    CASE WHEN NOT NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    1
  )
  ON CONFLICT (store_user_id, sale_date)
  DO UPDATE SET
    total_amount = daily_sales_summary.total_amount + NEW.amount,
    registered_customer_sales = daily_sales_summary.registered_customer_sales + 
      CASE WHEN NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    unregistered_customer_sales = daily_sales_summary.unregistered_customer_sales + 
      CASE WHEN NOT NEW.is_registered_customer THEN NEW.amount ELSE 0 END,
    transaction_count = daily_sales_summary.transaction_count + 1;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update daily summaries
CREATE TRIGGER update_daily_sales_summary_trigger
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_sales_summary();