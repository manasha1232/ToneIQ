import React, { useState, useRef, useEffect } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import FeedbackCard  from '../components/FeedbackCard';
import ChatBubble    from '../components/ChatBubble';

const API = import.meta.env.VITE_API_URL || '';

export default function Session({ scenario, user, onComplete, onBack }) {
  const [sessionId,  setSessionId]  = useState(null);
  const [turns,      setTurns]      = useState([]);
  const [feedback,   setFeedback]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [phase,      setPhase]      = useState('idle'); // idle | processing | feedback
  const turnIndex = useRef(0);
  const bottomRef = useRef(null);

  // Start session on mount
  useEffect(() => {
    async function init() {
      try {
        const res  = await fetch(`${API}/api/session/start`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({
            scenarioId:   scenario.id,
            scenarioText: scenario.text,
          }),
        });
        if (!res.ok) throw new Error('Failed to start session');
        const data = await res.json();
        setSessionId(data.sessionId);
      } catch (e) {
        setError('Could not start session. Is the backend running?');
      }
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, feedback]);

  // Called by VoiceRecorder with the transcribed text string
  async function handleRecorded(transcript) {
    setPhase('processing');
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API}/api/session/turn`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({
          sessionId,
          transcript,                   // plain text — no audio upload
          turnIndex: turnIndex.current,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();

      setTurns(prev => [...prev, {
        user:  data.transcript,
        ai:    data.aiReply,
        score: data.feedback?.toneScore,
      }]);

      setFeedback(data.feedback);
      turnIndex.current += 1;
      setPhase('feedback');

      // Browser TTS — speaks AI reply aloud (free, works deployed)
      if (data.aiReply && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // cancel any previous utterance
        const utt = new SpeechSynthesisUtterance(data.aiReply);
        utt.rate  = 0.95;
        utt.lang  = 'en-US';
        window.speechSynthesis.speak(utt);
      }

      if (data.isComplete) {
        setTimeout(() => onComplete(sessionId), 1800);
      }
    } catch (err) {
      console.error('[session] turn error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    setFeedback(null);
    setPhase('idle');
  }

  return (
    <div style={{
      maxWidth:680, margin:'0 auto', padding:'24px 20px',
      minHeight:'100vh', display:'flex', flexDirection:'column',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding:'8px 14px' }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>{scenario.cat}</div>
          <div style={{ fontWeight:600 }}>{scenario.title}</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:13, color:'var(--muted)' }}>
          Turn {turnIndex.current} / 6
        </div>
      </div>

      {/* Scenario prompt */}
      <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--accent)' }}>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>SCENARIO</div>
        <p style={{ fontSize:15 }}>{scenario.text}</p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background:'rgba(224,90,90,0.1)', border:'1px solid rgba(224,90,90,0.3)',
          borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)',
          marginBottom:14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Conversation */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {turns.map((t, i) => (
          <div key={i}>
            <ChatBubble role="user" text={t.user} score={t.score} />
            <ChatBubble role="ai"   text={t.ai}   aiLabel={scenario.aiLabel} />
          </div>
        ))}
        {loading && (
          <div style={{ textAlign:'center', color:'var(--muted)', fontSize:14, padding:16 }}>
            ⏳ Analysing response…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Feedback card */}
      {feedback && phase === 'feedback' && (
        <FeedbackCard feedback={feedback} onNext={handleNext} />
      )}

      {/* Voice recorder — shown when idle and session is ready */}
      {phase === 'idle' && sessionId && (
        <VoiceRecorder onRecorded={handleRecorded} disabled={loading} />
      )}

      {/* Session initialising */}
      {!sessionId && !error && (
        <div style={{ textAlign:'center', color:'var(--muted)', fontSize:13, padding:24 }}>
          Starting session…
        </div>
      )}
    </div>
  );
}
