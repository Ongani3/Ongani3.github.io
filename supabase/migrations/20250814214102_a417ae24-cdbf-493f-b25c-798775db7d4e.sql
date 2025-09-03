-- Fix security warnings by adding missing RLS policies and updating function search paths

-- RLS Policies for tables that were missing them

-- support_messages
CREATE POLICY "Users can view messages for their tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id 
           AND (customer_user_id = auth.uid() OR store_user_id = auth.uid()))
  );
CREATE POLICY "Users can create messages for their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id 
           AND (customer_user_id = auth.uid() OR store_user_id = auth.uid()))
    AND auth.uid() = sender_id
  );

-- points_transactions  
CREATE POLICY "Users can view their own points transactions" ON points_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM loyalty_accounts WHERE id = points_transactions.loyalty_account_id 
           AND customer_user_id = auth.uid())
  );
CREATE POLICY "System can insert points transactions" ON points_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM loyalty_accounts WHERE id = points_transactions.loyalty_account_id 
           AND customer_user_id = auth.uid())
  );

-- rewards
CREATE POLICY "Users can view active rewards" ON rewards
  FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their rewards" ON rewards
  FOR ALL USING (auth.uid() = store_user_id);

-- services
CREATE POLICY "Users can view active services" ON services
  FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their services" ON services
  FOR ALL USING (auth.uid() = store_user_id);

-- appointments
CREATE POLICY "Customers can view their own appointments" ON appointments
  FOR SELECT USING (auth.uid() = customer_user_id);
CREATE POLICY "Store owners can view their store appointments" ON appointments
  FOR SELECT USING (auth.uid() = store_user_id);
CREATE POLICY "Customers can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = customer_user_id);
CREATE POLICY "Users can update relevant appointments" ON appointments
  FOR UPDATE USING (auth.uid() = customer_user_id OR auth.uid() = store_user_id);

-- customer_documents
CREATE POLICY "Customers can view their own documents" ON customer_documents
  FOR SELECT USING (auth.uid() = customer_user_id);
CREATE POLICY "Store owners can view their store documents" ON customer_documents
  FOR SELECT USING (auth.uid() = store_user_id);
CREATE POLICY "Store owners can manage their store documents" ON customer_documents
  FOR ALL USING (auth.uid() = store_user_id);

-- surveys
CREATE POLICY "Users can view active surveys" ON surveys
  FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their surveys" ON surveys
  FOR ALL USING (auth.uid() = store_user_id);

-- survey_responses
CREATE POLICY "Customers can view their own survey responses" ON survey_responses
  FOR SELECT USING (auth.uid() = customer_user_id);
CREATE POLICY "Store owners can view responses to their surveys" ON survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_responses.survey_id 
           AND store_user_id = auth.uid())
  );
CREATE POLICY "Customers can create survey responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = customer_user_id);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;