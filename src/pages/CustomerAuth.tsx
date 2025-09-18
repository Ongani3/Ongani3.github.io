
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cleanupAuthState, getUserRole } from "@/utils/authUtils";
// DatabaseTest import removed after debugging

const CustomerAuth: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    document.title = "Customer Login | CRM Portal";
    
    // Load available stores
    loadStores();
    
    // Clean up any existing auth state first
    cleanupAuthState();
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Check user role and redirect accordingly
        setTimeout(async () => {
          const role = await getUserRole(session.user.id);
          if (role === 'admin') {
            // Admin trying to access customer portal, redirect them
            window.location.href = '/auth';
          } else {
            window.location.href = '/customer';
          }
        }, 0);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer role checking to prevent auth deadlock
        setTimeout(async () => {
          const role = await getUserRole(session.user.id);
          if (role === 'admin') {
            // Admin trying to access customer portal, redirect them
            window.location.href = '/auth';
          } else {
            // Customer user, proceed to customer portal
            window.location.href = '/customer';
          }
        }, 0);
      }
    });
    
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('id, store_name, store_tagline, store_address, store_city')
        .order('store_name');

      if (error) throw error;
      setStores(data || []);
      
      // Auto-select first store if available
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== CUSTOMER LOGIN START ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Step 1: Cleaning up existing auth state...');
      // Clean up existing state
      cleanupAuthState();
      
      console.log('Step 2: Attempting global sign out...');
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('Global sign out successful');
      } catch (err) {
        console.log('Global sign out failed (continuing):', err);
        // Continue even if this fails
      }
      
      console.log('Step 3: Attempting sign in with password...');
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('Sign in result:', { data, error });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('Step 4: User signed in successfully:', data.user.id);
        console.log('User email:', data.user.email);
        console.log('User metadata:', data.user.user_metadata);
        
        // Check user role after successful login
        setTimeout(async () => {
          try {
            console.log('Step 5: Checking user role...');
            const role = await getUserRole(data.user.id);
            console.log('User role after login:', role);
            
            if (role === 'admin') {
              // Admin trying to access customer portal, redirect them
              console.log('Admin user detected, redirecting to admin auth');
              window.location.href = '/auth';
            } else if (role === 'customer') {
              // Customer user, proceed to customer portal
              console.log('Customer user detected, redirecting to customer portal');
              window.location.href = '/customer';
            } else {
              // No role found, this might be a new user
              console.log('No role found for user, checking if they should be a customer');
              // Check if they have a customer profile
              const { data: customerData, error: customerError } = await supabase
                .from('customer_profiles')
                .select('user_id')
                .eq('user_id', data.user.id)
                .single();
              
              console.log('Customer profile check:', { customerData, customerError });
              
              if (customerData) {
                // They have a customer profile, create role and redirect
                console.log('Customer profile found, creating role...');
                const { error: roleError } = await supabase
                  .from('user_roles')
                  .upsert({
                    user_id: data.user.id,
                    role: 'customer'
                  });
                
                console.log('Role creation result:', { roleError });
                window.location.href = '/customer';
              } else {
                // No customer profile, redirect to signup
                console.log('No customer profile found, redirecting to signup');
                window.location.href = '/customer/auth';
              }
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            // Fallback: redirect to customer portal
            console.log('Fallback: redirecting to customer portal');
            window.location.href = '/customer';
          }
        }, 1000); // Increased timeout to see logs
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedStore) {
        setError('Please select a store');
        return;
      }

      // Clean up existing state
      cleanupAuthState();
      
      const redirectUrl = `${window.location.origin}/customer`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            display_name: displayName,
            role: 'customer', // Default role for customer portal signup
            store_id: selectedStore // Store the selected store
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Create customer profile with store association
      if (data.user) {
        // Create customer profile
        await supabase
          .from('customer_profiles')
          .upsert({
            user_id: data.user.id,
            first_name: displayName.split(' ')[0] || '',
            last_name: displayName.split(' ').slice(1).join(' ') || '',
            store_id: selectedStore
          });

        // Create user role for customer
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: 'customer'
          });
      }
      
      toast({ title: "Check your email", description: "Confirm your email to finish signup." });
      navigate("/customer");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
      toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/customer-auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link.",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      toast({
        title: "Reset failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Customer Portal</CardTitle>
          <CardDescription>Access your promotions and submit complaints</CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetForm ? (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                <div className="mt-4 text-center space-y-2">
                  <Button 
                    variant="link" 
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-muted-foreground"
                  >
                    Forgot your password?
                  </Button>
                  <div>
                    <Button 
                      variant="link" 
                      onClick={() => window.location.href = '/auth'}
                      className="text-sm"
                    >
                      Admin? Sign in here
                    </Button>
                  </div>
                </div>
              </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store">Select Store</Label>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose which store you'll shop at" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{store.store_name}</span>
                            <span className="text-sm text-muted-foreground">{store.store_city}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={() => window.location.href = '/auth'}
                  className="text-sm"
                >
                  Admin? Sign up here
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Reset Password</h3>
              <p className="text-sm text-muted-foreground">
                Enter your email to receive a password reset link
              </p>
            </div>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input 
                  id="resetEmail" 
                  type="email" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  required 
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setShowResetForm(false);
                    setResetEmail("");
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          </div>
        )}
        </CardContent>
      </Card>
      
      {/* Debugging helper removed */}
    </main>
  );
};

export default CustomerAuth;
