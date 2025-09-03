import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (type === 'signup' && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });

          if (error) {
            setStatus('error');
            setMessage(error.message);
          } else {
            setStatus('success');
            setMessage('Your email has been confirmed successfully!');
            // Redirect to main app after 3 seconds
            setTimeout(() => navigate('/'), 3000);
          }
        } catch (error) {
          setStatus('error');
          setMessage('An unexpected error occurred.');
        }
      } else {
        setStatus('error');
        setMessage('Invalid confirmation link.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            Email Confirmation
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Confirming your email address...'}
            {status === 'success' && 'Email confirmed successfully!'}
            {status === 'error' && 'Email confirmation failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              You will be redirected to the main page in a few seconds...
            </p>
          )}
          
          {(status === 'error' || status === 'success') && (
            <Button onClick={handleReturnHome} className="w-full">
              Return to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;