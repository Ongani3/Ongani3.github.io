import { supabase } from '@/integrations/supabase/client';

export interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  status: 'pending' | 'ringing' | 'active' | 'ended' | 'declined' | 'missed';
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  caller_type: 'customer' | 'admin';
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'busy' | 'in_call' | 'away';
  user_type: 'customer' | 'admin';
  last_seen: string;
}

export class CallManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callSession: CallSession | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private signalingChannel: any = null;

  constructor() {
    this.setupSignalingChannel();
  }

  private setupSignalingChannel() {
    // Create a channel for WebRTC signaling
    this.signalingChannel = supabase
      .channel('webrtc-signaling')
      .on('broadcast', { event: 'offer' }, (payload) => {
        console.log('Received offer:', payload);
        this.handleOffer(payload.payload);
      })
      .on('broadcast', { event: 'answer' }, (payload) => {
        console.log('Received answer:', payload);
        this.handleAnswer(payload.payload);
      })
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        console.log('Received ICE candidate:', payload);
        this.handleIceCandidate(payload.payload);
      })
      .subscribe((status) => {
        console.log('Signaling channel status:', status);
      });
  }

  async initiateCall(calleeId: string, callType: 'audio' | 'video', callerType: 'customer' | 'admin'): Promise<CallSession> {
    try {
      // Create call session in database
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: (await supabase.auth.getUser()).data.user?.id,
          callee_id: calleeId,
          call_type: callType,
          caller_type: callerType,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      this.callSession = {
        ...session,
        call_type: session.call_type as 'audio' | 'video',
        status: session.status as CallSession['status'],
        caller_type: session.caller_type as 'customer' | 'admin'
      };

      // Get user media
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
        console.log('Got local media stream:', this.localStream);
      } catch (mediaError) {
        console.error('Failed to get user media:', mediaError);
        throw new Error('Could not access camera/microphone. Please check permissions.');
      }

      // Create peer connection
      await this.createPeerConnection();

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          console.log('Adding track to peer connection:', track);
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send offer through signaling
      await this.signalingChannel.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer: offer,
          sessionId: session.id,
          calleeId: calleeId,
          callType: callType
        }
      });

      // Update call status to ringing
      await this.updateCallStatus('ringing');

      return this.callSession;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  }

  async acceptCall(sessionId: string): Promise<void> {
    try {
      // Get call session
      const { data: session } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Call session not found');

      this.callSession = {
        ...session,
        call_type: session.call_type as 'audio' | 'video',
        status: session.status as CallSession['status'],
        caller_type: session.caller_type as 'customer' | 'admin'
      };

      // Get user media
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: session.call_type === 'video'
        });
        console.log('Got local media stream for accepting call:', this.localStream);
      } catch (mediaError) {
        console.error('Failed to get user media for accepting call:', mediaError);
        throw new Error('Could not access camera/microphone. Please check permissions.');
      }

      // Create peer connection
      await this.createPeerConnection();

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          console.log('Adding track to peer connection for accepting call:', track);
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Update call status to active
      await this.updateCallStatus('active');
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  async declineCall(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('call_sessions')
      .update({ status: 'declined', end_time: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;
  }

  async endCall(): Promise<void> {
    try {
      if (this.callSession) {
        const startTime = new Date(this.callSession.start_time || '').getTime();
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);

        await supabase
          .from('call_sessions')
          .update({
            status: 'ended',
            end_time: new Date().toISOString(),
            duration_seconds: duration
          })
          .eq('id', this.callSession.id);

        // Log the call
        await supabase
          .from('call_logs')
          .insert({
            call_session_id: this.callSession.id,
            caller_id: this.callSession.caller_id,
            callee_id: this.callSession.callee_id,
            call_type: this.callSession.call_type,
            duration_seconds: duration
          });
      }

      this.cleanup();
    } catch (error) {
      console.error('Failed to end call:', error);
      this.cleanup();
    }
  }

  private async createPeerConnection(): Promise<void> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingChannel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            sessionId: this.callSession?.id
          }
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };
  }

  private async handleOffer(payload: any): Promise<void> {
    try {
      // When receiving an offer, we need to set up our peer connection if we don't have one
      if (!this.peerConnection) {
        await this.createPeerConnection();
        
        // Get user media for the callee
        if (!this.localStream) {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: payload.callType === 'video'
          });
          
          // Add local stream to peer connection
          this.localStream.getTracks().forEach(track => {
            if (this.peerConnection && this.localStream) {
              this.peerConnection.addTrack(track, this.localStream);
            }
          });
        }
      }

      console.log('Setting remote description from offer');
      await this.peerConnection.setRemoteDescription(payload.offer);
      
      console.log('Creating answer');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('Sending answer');
      await this.signalingChannel.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer: answer,
          sessionId: payload.sessionId
        }
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(payload: any): Promise<void> {
    try {
      if (!this.peerConnection) return;
      console.log('Setting remote description from answer');
      await this.peerConnection.setRemoteDescription(payload.answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(payload: any): Promise<void> {
    try {
      if (!this.peerConnection) return;
      console.log('Adding ICE candidate');
      await this.peerConnection.addIceCandidate(payload.candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private async updateCallStatus(status: CallSession['status']): Promise<void> {
    if (!this.callSession) return;

    const { error } = await supabase
      .from('call_sessions')
      .update({ status })
      .eq('id', this.callSession.id);

    if (error) throw error;

    this.callSession.status = status;
  }

  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingChannel) {
      supabase.removeChannel(this.signalingChannel);
    }

    this.remoteStream = null;
    this.callSession = null;

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  // Getters and setters
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getCurrentSession(): CallSession | null {
    return this.callSession;
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  setOnCallEnd(callback: () => void): void {
    this.onCallEndCallback = callback;
  }

  // Media controls
  async toggleMute(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // Return true if muted
    }
    return false;
  }

  async toggleCamera(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // Return true if camera off
    }
    return false;
  }
}