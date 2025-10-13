import { supabase } from '@/integrations/supabase/client';

export type ExternalCallType = 'audio' | 'video';
export type ExternalCallerType = 'customer' | 'admin';

export interface CreatedCallSession {
  id: string;
  start_time: string;
}

export async function createExternalCallSession(
  calleeId: string,
  callType: ExternalCallType,
  callerType: ExternalCallerType
): Promise<CreatedCallSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('call_sessions')
    .insert({
      caller_id: user.id,
      callee_id: calleeId,
      call_type: callType,
      caller_type: callerType,
      status: 'pending', // Start as pending to trigger notification
      start_time: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to create call session');
  return { id: data.id, start_time: data.start_time };
}

export async function acceptExternalCall(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('call_sessions')
    .update({ status: 'active' })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function declineExternalCall(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('call_sessions')
    .update({ status: 'declined', end_time: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function endExternalCallSession(sessionId: string): Promise<void> {
  // Fetch the session to compute duration and participants
  const { data: session } = await supabase
    .from('call_sessions')
    .select('id, caller_id, callee_id, call_type, start_time')
    .eq('id', sessionId)
    .single();

  const endTime = new Date();
  const startMs = session?.start_time ? new Date(session.start_time).getTime() : Date.now();
  const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - startMs) / 1000));

  await supabase
    .from('call_sessions')
    .update({ status: 'ended', end_time: endTime.toISOString() })
    .eq('id', sessionId);

  if (session) {
    await supabase.from('call_logs').insert({
      call_session_id: session.id,
      caller_id: session.caller_id,
      callee_id: session.callee_id,
      call_type: session.call_type,
      duration_seconds: durationSeconds,
    });
  }
}


