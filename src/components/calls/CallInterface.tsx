import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { CallManager, CallSession } from '@/utils/CallManager';

interface CallInterfaceProps {
  callManager: CallManager;
  session: CallSession;
  onEndCall: () => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  callManager,
  session,
  onEndCall
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Set up local video stream
    const localStream = callManager.getLocalStream();
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    // Set up remote video stream callback
    callManager.setOnRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    });

    // Set up call end callback
    callManager.setOnCallEnd(() => {
      onEndCall();
    });

    // Start call timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [callManager, onEndCall]);

  const handleToggleMute = async () => {
    const muted = await callManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleCamera = async () => {
    const cameraOff = await callManager.toggleCamera();
    setIsCameraOff(cameraOff);
  };

  const handleEndCall = () => {
    callManager.endCall();
    onEndCall();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

        {/* Video Area */}
        <div className="flex-1 relative bg-muted/30">
          {session.call_type === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture-in-Picture) */}
              <Card className="absolute top-4 right-4 w-48 h-36 overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </Card>
            </>
          ) : (
            /* Audio Call UI */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mb-6">
                <Phone className="w-16 h-16 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Audio Call</h3>
              <p className="text-muted-foreground">
                {session.caller_type === 'customer' ? 'Connected to Store' : 'Connected to Customer'}
              </p>
            </div>
          )}
        </div>

        {/* Hidden audio element for remote stream (audio-only and video calls) */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Controls */}
        <div className="p-6 border-t bg-background/95">
          <div className="flex justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={handleToggleMute}
              className="w-14 h-14 rounded-full"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {session.call_type === 'video' && (
              <Button
                variant={isCameraOff ? "destructive" : "outline"}
                size="lg"
                onClick={handleToggleCamera}
                className="w-14 h-14 rounded-full"
              >
                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </Button>
            )}

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