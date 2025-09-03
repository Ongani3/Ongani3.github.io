-- Create refunds table for proper audit trail
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_user_id UUID NOT NULL,
  original_sale_id UUID NOT NULL,
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  refund_reason TEXT NOT NULL,
  refund_method TEXT NOT NULL DEFAULT 'cash',
  processed_by UUID NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'approved',
  approved_by UUID,
  approval_date TIMESTAMP WITH TIME ZONE,
  refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Store owners can manage their refunds" 
ON public.refunds 
FOR ALL 
USING (auth.uid() = store_user_id);

-- Create function to update refund updated_at
CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update daily_sales_summary function to account for refunds
CREATE OR REPLACE FUNCTION public.update_daily_sales_summary_with_refunds()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle refund processing
  IF TG_TABLE_NAME = 'refunds' THEN
    -- Subtract refund from daily summary
    UPDATE public.daily_sales_summary
    SET 
      total_amount = total_amount - NEW.refund_amount,
      registered_customer_sales = CASE 
        WHEN EXISTS (SELECT 1 FROM sales WHERE id = NEW.original_sale_id AND is_registered_customer = true)
        THEN registered_customer_sales - NEW.refund_amount
        ELSE registered_customer_sales
      END,
      unregistered_customer_sales = CASE 
        WHEN EXISTS (SELECT 1 FROM sales WHERE id = NEW.original_sale_id AND is_registered_customer = false)
        THEN unregistered_customer_sales - NEW.refund_amount
        ELSE unregistered_customer_sales
      END
    WHERE store_user_id = NEW.store_user_id 
      AND sale_date = NEW.refund_date;
      
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for refunds
CREATE TRIGGER handle_refund_summary_update
AFTER INSERT ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_sales_summary_with_refunds();

-- Add refund tracking columns to sales table
ALTER TABLE public.sales 
ADD COLUMN is_refunded BOOLEAN DEFAULT false,
ADD COLUMN refunded_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN refunded_amount NUMERIC DEFAULT 0;