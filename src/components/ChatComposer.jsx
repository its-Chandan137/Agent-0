import { useEffect, useRef, useState } from 'react';

function ChatComposer({ disabled, onSend }) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [draft]);

  async function sendDraft() {
    if (!draft.trim() || disabled) {
      return;
    }

    const nextMessage = draft.trimEnd();
    setDraft('');
    await onSend(nextMessage);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendDraft();
  }

  async function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendDraft();
    }
  }

  return (
    <div className="composer-shell">
      <form className="composer" onSubmit={handleSubmit}>
        <button type="button" className="composer-addon" aria-label="Add context">
          +
        </button>
        <textarea
          ref={textareaRef}
          rows="1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          disabled={disabled}
        />
        <button type="submit" className="composer-send" disabled={disabled || !draft.trim()}>
          {disabled ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatComposer;
