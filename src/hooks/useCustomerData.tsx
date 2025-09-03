
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: string;
  total_spent: number;
  points: number;
  last_visit: string | null;
  join_date: string;
}

export const useCustomerData = (customerUserId: string | null) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!customerUserId) {
      setLoading(false);
      return;
    }

    fetchCustomerData();

    // Set up real-time subscription for customer data changes
    const customerChannel = supabase
      .channel(`customer-${customerUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers',
        filter: `customer_user_id=eq.${customerUserId}`
      }, (payload) => {
        console.log('Customer data updated:', payload);
        if (payload.eventType === 'UPDATE' && payload.new) {
          setCustomerData(payload.new as CustomerData);
        } else if (payload.eventType === 'DELETE') {
          setCustomerData(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(customerChannel);
    };
  }, [customerUserId]);

  const fetchCustomerData = async () => {
    if (!customerUserId) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_user_id', customerUserId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          throw error;
        }
        setCustomerData(null);
      } else {
        setCustomerData(data);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { customerData, loading, refetch: fetchCustomerData };
};
