import React, { useState, useRef, useEffect } from 'react';

/**
 * VoiceRecorder — uses Web Speech API (SpeechRecognition) to transcribe in the browser.
 * Sends the TEXT string to onRecorded(text). No audio is ever uploaded.
 *
 * Supported: Chrome, Edge, Safari 15+ (basically every modern browser when deployed).
 * Firefox: falls back to a textarea for manual text input.
 */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function VoiceRecorder({ onRecorded, disabled }) {
  const [phase,       setPhase]       = useState('idle'); // idle | listening | done | fallback
  const [transcript,  setTranscript]  = useState('');
  const [interim,     setInterim]     = useState('');
  const [secs,        setSecs]        = useState(0);
  const [error,       setError]       = useState('');
  const [manualText,  setManualText]  = useState('');

  const recogRef  = useRef(null);
  const timerRef  = useRef(null);
  const finalRef  = useRef(''); // accumulate across recognition events

  // If browser doesn't support SpeechRecognition, show text fallback
  if (!SpeechRecognition) {
    return <TextFallback onRecorded={onRecorded} disabled={disabled} />;
  }

  function startListening() {
    setError('');
    setTranscript('');
    setInterim('');
    finalRef.current = '';
    setSecs(0);

    const recog = new SpeechRecognition();
    recog.continuous      = true;   // keep listening until stopped
    recog.interimResults  = true;   // show live partial results
    recog.lang            = 'en-US';
    recog.maxAlternatives = 1;

    recog.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalRef.current += t + ' ';
        } else {
          interimText += t;
        }
      }
      setTranscript(finalRef.current);
      setInterim(interimText);
    };

    recog.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore — user just paused
      if (e.error === 'aborted')   return; // user cancelled
      setError(`Microphone error: ${e.error}. Try again or type below.`);
      setPhase('idle');
      clearInterval(timerRef.current);
    };

    recog.onend = () => {
      // Only fires if recognition stops naturally (e.g. silence timeout)
      // We handle explicit stop in stopListening(), so don't duplicate
    };

    recog.start();
    recogRef.current = recog;
    setPhase('listening');

    timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
  }

  function stopListening() {
    clearInterval(timerRef.current);
    recogRef.current?.stop();
    setPhase('done');
    setInterim('');
  }

  function cancelListening() {
    clearInterval(timerRef.current);
    recogRef.current?.abort();
    setPhase('idle');
    setTranscript('');
    setInterim('');
    finalRef.current = '';
  }

  function sendTranscript() {
    const text = (finalRef.current || transcript).trim();
    if (!text) { setError('Nothing was transcribed. Please try again.'); return; }
    onRecorded(text);
    setPhase('idle');
    setTranscript('');
    finalRef.current = '';
  }

  function reRecord() {
    setPhase('idle');
    setTranscript('');
    setInterim('');
    finalRef.current = '';
    setError('');
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={wrapStyle}>
        {error && <div style={errorStyle}>⚠️ {error}</div>}
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14, textAlign:'center' }}>
          Tap to speak your response
        </p>
        <button
          onClick={startListening}
          disabled={disabled}
          style={{
            width:72, height:72, borderRadius:'50%', fontSize:28, padding:0,
            background:'var(--accent)', border:'none', cursor:'pointer',
            color:'#fff', display:'block', margin:'0 auto',
            opacity: disabled ? 0.5 : 1,
          }}
          aria-label="Start recording"
        >
          🎤
        </button>
      </div>
    );
  }

  // ── Listening ─────────────────────────────────────────────────────────────
  if (phase === 'listening') {
    return (
      <div style={wrapStyle}>
        {/* Pulsing mic */}
        <div style={{
          width:72, height:72, borderRadius:'50%',
          background:'rgba(224,90,90,0.12)', border:'2px solid var(--danger)',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 12px', animation:'tiq-pulse 1s ease-in-out infinite',
        }}>
          <span style={{ fontSize:28 }}>🎙️</span>
        </div>

        <div style={{ fontSize:13, color:'var(--danger)', textAlign:'center', marginBottom:10 }}>
          Listening… {secs}s
        </div>

        {/* Live transcript preview */}
        <div style={{
          minHeight:48, background:'var(--bg)', border:'1px solid var(--border)',
          borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text)',
          marginBottom:14, lineHeight:1.5,
        }}>
          {transcript}
          <span style={{ color:'var(--muted)' }}>{interim}</span>
          {!transcript && !interim && (
            <span style={{ color:'var(--muted)' }}>Speak now…</span>
          )}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={stopListening} className="btn-primary" style={{ padding:'10px 22px' }}>
            ⏹ Stop
          </button>
          <button onClick={cancelListening} className="btn-secondary"
            style={{ padding:'10px 22px', color:'var(--muted)' }}>
            ✕ Cancel
          </button>
        </div>

        <style>{`@keyframes tiq-pulse{
          0%,100%{box-shadow:0 0 0 0 rgba(224,90,90,0.4)}
          50%{box-shadow:0 0 0 12px rgba(224,90,90,0)}
        }`}</style>
      </div>
    );
  }

  // ── Done — review before sending ──────────────────────────────────────────
  if (phase === 'done') {
    const finalText = (finalRef.current || transcript).trim();
    return (
      <div style={wrapStyle}>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>
          ✅ Transcribed — review before sending:
        </div>
        <div style={{
          background:'var(--bg)', border:'1px solid var(--accent)',
          borderRadius:8, padding:'12px 14px', fontSize:14,
          color:'var(--text)', marginBottom:16, lineHeight:1.6,
          minHeight:48,
        }}>
          {finalText || <span style={{ color:'var(--muted)' }}>Nothing captured. Try again.</span>}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={sendTranscript} className="btn-primary"
            disabled={!finalText} style={{ padding:'10px 24px', opacity: finalText ? 1 : 0.5 }}>
            Send →
          </button>
          <button onClick={reRecord} className="btn-secondary" style={{ padding:'10px 20px' }}>
            🔄 Re-record
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Text fallback for Firefox / unsupported browsers ─────────────────────────
function TextFallback({ onRecorded, disabled }) {
  const [text, setText] = useState('');
  return (
    <div style={wrapStyle}>
      <div style={{ fontSize:13, color:'var(--warn)', marginBottom:10, textAlign:'center' }}>
        ⚠️ Voice not supported in this browser — type your response below.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your response here…"
        rows={3}
        style={{
          width:'100%', padding:'11px 14px', background:'var(--bg)',
          border:'1px solid var(--border)', borderRadius:8,
          color:'var(--text)', fontSize:14, resize:'vertical',
          fontFamily:'var(--font)', marginBottom:12,
        }}
      />
      <button
        onClick={() => { if (text.trim()) { onRecorded(text.trim()); setText(''); }}}
        className="btn-primary"
        disabled={disabled || !text.trim()}
        style={{ width:'100%', padding:'12px', opacity: text.trim() ? 1 : 0.5 }}
      >
        Send →
      </button>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const wrapStyle = { padding:'20px 0' };
const errorStyle = {
  background:'rgba(224,90,90,0.1)', border:'1px solid rgba(224,90,90,0.3)',
  borderRadius:8, padding:'8px 12px', fontSize:13, color:'var(--danger)',
  marginBottom:12, textAlign:'center',
};
