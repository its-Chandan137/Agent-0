import { useEffect, useState } from 'react';
import { formatMessageTime } from '../lib/format';

function ChatMessage({ message }) {
  const [visibleContent, setVisibleContent] = useState(message.content || '');
  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    if (message.role !== 'assistant') {
      setVisibleContent(message.content || '');
      return;
    }

    if (!message.isStreaming) {
      setVisibleContent(message.content || '');
      return;
    }

    const targetContent = message.content || '';

    if (targetContent.length <= visibleContent.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const remaining = targetContent.length - visibleContent.length;
      const nextStep = Math.min(Math.max(1, Math.ceil(remaining / 14)), 4);
      setVisibleContent(targetContent.slice(0, visibleContent.length + nextStep));
    }, 14);

    return () => window.clearTimeout(timeoutId);
  }, [message.content, message.isStreaming, message.role, visibleContent.length]);

  useEffect(() => {
    if (message.role !== 'assistant' || !message.isStreaming || message.content) {
      setShowThinking(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowThinking(true);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [message.content, message.isStreaming, message.role]);

  const content = message.role === 'assistant' ? visibleContent : message.content;
  const isThinking = message.role === 'assistant' && message.isStreaming && !content && showThinking;

  return (
    <article className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}`}>
      <div className="message-card">
        <div className="message-content">
          {message.role === 'assistant' ? (
            <div className="assistant-message-shell">
              <div className="assistant-avatar">AI</div>
              <div className="assistant-message-body">
                <div className="message-meta">
                  <span>Budget Assistant</span>
                  <span>{formatMessageTime(message.timestamp)}</span>
                </div>
                {isThinking ? (
                  <div className="thinking-line">
                    <span>Thinking...</span>
                    <span className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                ) : (
                  <div>
                    {content}
                    {message.isStreaming && content ? <span className="stream-cursor" /> : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="message-meta">
                <span>You</span>
                <span>{formatMessageTime(message.timestamp)}</span>
              </div>
              <div>{message.content}</div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default ChatMessage;
