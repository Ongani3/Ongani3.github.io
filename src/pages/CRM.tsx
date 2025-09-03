import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { CRMSidebar } from '@/components/CRMSidebar';
import { CRMTopNav } from '@/components/CRMTopNav';
import ContactsTable from '@/components/ContactsTable';
import { EmailTracking } from '@/components/EmailTracking';
import { Sequences } from '@/components/Sequences';
import { QuotesInvoices } from '@/components/QuotesInvoices';
import { Reports } from '@/components/Reports';
import { PromotionalEmails } from '@/components/PromotionalEmails';
import { Promotions } from '@/components/Promotions';
import Sales from '@/components/Sales';
import Dashboard from '@/components/Dashboard';
import StoreSettings from '@/components/StoreSettings';
import { Calls } from '@/components/Calls';
import { handleSignOut, getUserRole } from '@/utils/authUtils';

const CRM: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('customers');
  const [activeSection, setActiveSection] = useState<string | null>('dashboard');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check URL parameters to override initial state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section === 'customers') {
      setActiveSection(null);
      setActiveWorkspace('customers');
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer role checking to prevent auth deadlock
        if (session?.user) {
          setTimeout(async () => {
            const role = await getUserRole(session.user.id);
            if (role === 'customer') {
              // Customer trying to access admin portal, redirect them
              window.location.href = '/customer';
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Defer role checking to prevent auth deadlock
      if (session?.user) {
        setTimeout(async () => {
          const role = await getUserRole(session.user.id);
          if (role === 'customer') {
            // Customer trying to access admin portal, redirect them
            window.location.href = '/customer';
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOutClick = async () => {
    await handleSignOut('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Onga's Simple CRM</h1>
          <p className="text-muted-foreground">Choose how you'd like to access the system</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/auth')} size="lg" className="flex-1 max-w-xs">
              Admin Dashboard
            </Button>
            <Button onClick={() => navigate('/customer/auth')} variant="outline" size="lg" className="flex-1 max-w-xs">
              Customer Portal
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Admin Dashboard:</strong> Manage customers, promotions, and business operations</p>
            <p><strong>Customer Portal:</strong> View promotions and submit complaints</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    if (activeSection) {
      switch (activeSection) {
        case 'dashboard':
          return <Dashboard onNavigateToSection={setActiveSection} />;
        case 'sales':
          return <Sales />;
        case 'email':
          return <EmailTracking />;
        case 'sequences':
          return <Sequences />;
        case 'quotes':
          return <QuotesInvoices />;
        case 'reports':
          return <Reports />;
        case 'promotions':
          return <PromotionalEmails />;
        case 'settings':
          return <StoreSettings />;
        case 'calls':
          return <Calls />;
        default:
          return <ContactsTable activeWorkspace={activeWorkspace} />;
      }
    }
    
    // Handle workspace-specific content
    switch (activeWorkspace) {
      case 'promotions':
        return <Promotions />;
      case 'complaints':
        // Import and use the dedicated Complaints component
        const Complaints = React.lazy(() => import('@/components/Complaints'));
        return <React.Suspense fallback={<div>Loading...</div>}><Complaints /></React.Suspense>;
      case 'analytics':
        // Analytics should go to Reports section
        return <Reports />;
      default:
        return <ContactsTable activeWorkspace={activeWorkspace} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <CRMSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={setActiveWorkspace}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <CRMTopNav onToggleSidebar={toggleSidebar} user={user} onSignOut={handleSignOutClick} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CRM;
