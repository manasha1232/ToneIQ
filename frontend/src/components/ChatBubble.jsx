import React from 'react';

export default function ChatBubble({ role, text, score, aiLabel }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '80%',
        background:   isUser ? 'var(--accent)' : 'var(--surface)',
        border:       isUser ? 'none' : '1px solid var(--border)',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding:      '10px 14px',
        fontSize:     14,
        lineHeight:   1.5,
      }}>
        {!isUser && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            {aiLabel || 'AI PARTNER'}
          </div>
        )}
        <div>{text}</div>
        {isUser && score !== undefined && (
          <div style={{
            fontSize: 11, marginTop: 6,
            color: score >= 70 ? 'rgba(90,201,138,0.8)' : score >= 45 ? 'rgba(240,180,41,0.8)' : 'rgba(224,90,90,0.8)',
          }}>
            Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}
