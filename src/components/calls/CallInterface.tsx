import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { CallSession } from '@/utils/CallManager';
import { endExternalCallSession } from '@/utils/ExternalCall';

interface CallInterfaceProps {
  session: CallSession;
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  session,
  onEndCall
}) => {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleEndCall = async () => {
    await endExternalCallSession(session.id);
    onEndCall();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const roomID = session.id; // Use session ID as room ID for the external service

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">
                {session.caller_type === 'customer' ? 'Store Call' : 'Customer Call'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDuration(callDuration)} • {session.call_type}
              </p>
            </div>
          </div>
          <div className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
            Connected
          </div>
        </div>

        {/* Video Area - now an iframe */}
        <div className="flex-1 relative bg-muted/30">
          <iframe
            src={`/WEB_UIKITS.html?roomID=${roomID}`}
            title="Video Call"
            allow="camera; microphone; display-capture"
            className="w-full h-full border-0"
          ></iframe>
        </div>

        {/* Controls */}
        <div className="p-6 border-t bg-background/95">
          <div className="flex justify-center gap-4">
            {/* Mute/Camera buttons are now handled by the external service within the iframe */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};