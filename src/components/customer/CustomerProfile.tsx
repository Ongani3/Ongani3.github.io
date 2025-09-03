import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfileProps {
  user: User;
}

interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  profile_picture_url: string;
  two_fa_enabled: boolean;
  communication_preferences: any;
}

interface CustomerAddress {
  id: string;
  address_type: string;
  is_default: boolean;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data || {
        id: '',
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        profile_picture_url: '',
        two_fa_enabled: false,
        communication_preferences: { email: true, sms: false, push: true }
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          ...profile
        });

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const saveAddress = async (address: Partial<CustomerAddress>) => {
    try {
      // Ensure required fields are present
      if (!address.address_type || !address.street_address || !address.city || !address.state || !address.postal_code) {
        toast.error('Please fill in all required address fields');
        return;
      }

      const addressData = {
        user_id: user.id,
        address_type: address.address_type,
        street_address: address.street_address,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || 'US',
        is_default: address.is_default || false
      };

      if (address.id) {
        const { error } = await supabase
          .from('customer_addresses')
          .update(addressData)
          .eq('id', address.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_addresses')
          .insert(addressData);
        if (error) throw error;
      }

      toast.success('Address saved successfully');
      loadAddresses();
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your personal details and preferences</CardDescription>
            </div>
            <Button
              variant={editing ? "default" : "outline"}
              onClick={() => editing ? saveProfile() : setEditing(true)}
            >
              {editing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile?.first_name || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile?.last_name || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile?.phone || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={profile?.date_of_birth || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
                disabled={!editing}
              />
            </div>
          </div>

          <Separator />

          {/* Communication Preferences */}
          <div className="space-y-4">
            <h3 className="font-medium">Communication Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <Switch
                  id="email_notifications"
                  checked={profile?.communication_preferences?.email || false}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev, 
                      communication_preferences: {
                        ...prev.communication_preferences,
                        email: checked
                      }
                    } : null)
                  }
                  disabled={!editing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms_notifications">SMS Notifications</Label>
                <Switch
                  id="sms_notifications"
                  checked={profile?.communication_preferences?.sms || false}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev, 
                      communication_preferences: {
                        ...prev.communication_preferences,
                        sms: checked
                      }
                    } : null)
                  }
                  disabled={!editing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push_notifications">Push Notifications</Label>
                <Switch
                  id="push_notifications"
                  checked={profile?.communication_preferences?.push || false}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev, 
                      communication_preferences: {
                        ...prev.communication_preferences,
                        push: checked
                      }
                    } : null)
                  }
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>Manage your shipping and billing addresses</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setEditingAddress('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={address.is_default ? "default" : "secondary"}>
                        {address.address_type}
                      </Badge>
                      {address.is_default && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                    <p className="font-medium">{address.street_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAddress(address.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {addresses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No addresses saved. Add your first address to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};