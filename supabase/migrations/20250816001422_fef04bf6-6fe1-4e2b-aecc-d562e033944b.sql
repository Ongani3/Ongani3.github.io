-- Fix RLS policies for proper store isolation to prevent data leakage between stores

-- 1. Fix customers table - only store owners can see their own customers
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

-- Store owners can only see customers they created (their own store's customers)
CREATE POLICY "Store owners can view their own store customers" ON customers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Store owners can create customers for their store" ON customers  
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update their own store customers" ON customers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete their own store customers" ON customers
FOR DELETE USING (auth.uid() = user_id);

-- 2. Fix customer_profiles table - add store context verification
DROP POLICY IF EXISTS "Users can view their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON customer_profiles;

-- Customers can only see their own profile
CREATE POLICY "Customers can view their own profile" ON customer_profiles
FOR SELECT USING (auth.uid() = user_id);

-- Customers can create their own profile
CREATE POLICY "Customers can insert their own profile" ON customer_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customers can update their own profile  
CREATE POLICY "Customers can update their own profile" ON customer_profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Store owners can view customer profiles only for their store
CREATE POLICY "Store owners can view their store customer profiles" ON customer_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM store_settings 
    WHERE store_settings.user_id = auth.uid() 
    AND store_settings.id = customer_profiles.store_id
  )
);

-- 3. Fix quotes table - ensure store isolation
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

CREATE POLICY "Store owners can view their own store quotes" ON quotes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Store owners can create quotes for their store" ON quotes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update their own store quotes" ON quotes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete their own store quotes" ON quotes
FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix invoices table - ensure store isolation
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

CREATE POLICY "Store owners can view their own store invoices" ON invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Store owners can create invoices for their store" ON invoices
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update their own store invoices" ON invoices
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete their own store invoices" ON invoices
FOR DELETE USING (auth.uid() = user_id);

-- 5. Fix customer_documents table - add proper store verification
DROP POLICY IF EXISTS "Store owners can manage their store documents" ON customer_documents;
DROP POLICY IF EXISTS "Store owners can view their store documents" ON customer_documents;

CREATE POLICY "Store owners can manage documents for their store" ON customer_documents
FOR ALL USING (auth.uid() = store_user_id);

-- 6. Fix support_tickets table - add store context verification  
DROP POLICY IF EXISTS "Store owners can view their store tickets" ON support_tickets;
DROP POLICY IF EXISTS "Store owners can update their store tickets" ON support_tickets;

CREATE POLICY "Store owners can view their store support tickets" ON support_tickets
FOR SELECT USING (auth.uid() = store_user_id);

CREATE POLICY "Store owners can update their store support tickets" ON support_tickets
FOR UPDATE USING (auth.uid() = store_user_id);

-- 7. Fix support_messages table - ensure proper store isolation
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_messages;
DROP POLICY IF EXISTS "Users can create messages for their tickets" ON support_messages;

CREATE POLICY "Users can view messages for their own tickets" ON support_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_messages.ticket_id 
    AND (support_tickets.customer_user_id = auth.uid() OR support_tickets.store_user_id = auth.uid())
  )
);

CREATE POLICY "Users can create messages for their own tickets" ON support_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_messages.ticket_id 
    AND (support_tickets.customer_user_id = auth.uid() OR support_tickets.store_user_id = auth.uid())
  )
  AND auth.uid() = sender_id
);