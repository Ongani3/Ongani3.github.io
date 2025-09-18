
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'customer';

export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    console.log('getUserRole: Looking up role for user:', userId);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    console.log('getUserRole: Query result:', { data, error });
    
    if (error) {
      console.error('Error fetching user role:', error);
      
      // If no role found, check if user exists in customer_profiles
      console.log('getUserRole: No role found, checking customer_profiles...');
      const { data: customerData, error: customerError } = await supabase
        .from('customer_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();
      
      console.log('getUserRole: Customer profile check:', { customerData, customerError });
      
      if (customerData) {
        // User is a customer but missing role, create it
        console.log('Creating missing customer role for user:', userId);
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'customer'
          });
        
        console.log('getUserRole: Role creation result:', { roleError });
        return 'customer';
      }
      
      return null;
    }
    
    console.log('getUserRole: Found role:', data.role);
    return data.role as UserRole;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
};

export const handleSignOut = async (redirectTo: string = '/') => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out (fallback if it fails)
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('Global signout failed, continuing with local cleanup:', err);
    }
    
    // Force page reload for a clean state
    window.location.href = redirectTo;
  } catch (error) {
    console.error('Error during sign out:', error);
    // Force redirect even if signout fails
    window.location.href = redirectTo;
  }
};
