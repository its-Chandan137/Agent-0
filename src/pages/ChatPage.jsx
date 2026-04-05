import { useEffect, useMemo, useRef, useState } from 'react';
import ChatComposer from '../components/ChatComposer';
import ChatMessage from '../components/ChatMessage';
import { useScrollActivity } from '../lib/useScrollActivity';

function ChatPage({ activeChat, isStreaming, onSendMessage }) {
  const hasMessages = Boolean(activeChat?.messages?.length);
  const threadRef = useRef(null);
  const messageRefs = useRef(new Map());
  const { isScrolling: isThreadScrolling, handleScroll: handleThreadScroll } = useScrollActivity();
  const [markers, setMarkers] = useState([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const lastMessage = activeChat?.messages?.[activeChat.messages.length - 1];
  const messages = activeChat?.messages || [];

  const hoveredMarker = useMemo(
    () => markers.find((marker) => marker.id === hoveredMarkerId) || null,
    [hoveredMarkerId, markers],
  );

  function getMessageId(message, index) {
    return message.clientId || `${message.role}-${message.timestamp}-${index}`;
  }

  function setMessageRef(messageId, node) {
    if (!node) {
      messageRefs.current.delete(messageId);
      return;
    }

    messageRefs.current.set(messageId, node);
  }

  function measureMarkers() {
    const thread = threadRef.current;

    if (!thread || !messages.length) {
      setMarkers([]);
      return;
    }

    const scrollHeight = thread.scrollHeight || 1;
    const nextMarkers = messages
      .map((message, index) => {
        const id = getMessageId(message, index);
        const node = messageRefs.current.get(id);

        if (!node) {
          return null;
        }

        const topPercent = (node.offsetTop / scrollHeight) * 100;
        const heightPercent = Math.max(
          (node.offsetHeight / scrollHeight) * 100,
          message.role === 'user' ? 2.2 : 1.1,
        );
        const centerPercent = topPercent + heightPercent / 2;

        return {
          id,
          role: message.role,
          topPercent: Math.min(Math.max(topPercent, 0), 100),
          heightPercent: Math.min(heightPercent, 16),
          centerPercent: Math.min(Math.max(centerPercent, 0), 100),
          preview: makePreview(message.content),
        };
      })
      .filter(Boolean);

    setMarkers(nextMarkers);
  }

  function handleMarkerClick(markerId) {
    const thread = threadRef.current;
    const node = messageRefs.current.get(markerId);

    if (!thread || !node) {
      return;
    }

    thread.scrollTo({
      top: Math.max(node.offsetTop - 28, 0),
      behavior: 'smooth',
    });
  }

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeChat?._id, activeChat?.messages?.length, lastMessage?.content, isStreaming]);

  useEffect(() => {
    measureMarkers();
  }, [activeChat?._id, messages.length, lastMessage?.content]);

  useEffect(() => {
    function handleResize() {
      measureMarkers();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeChat?._id, messages.length]);

  return (
    <section className="page chat-page">
      <div className="chat-topbar">
        <div className="chat-topbar-title">
          <span>Mantra</span>
          <span className="chat-topbar-caret">v</span>
        </div>
        <div className="chat-topbar-status">
          {hasMessages ? activeChat?.title || 'Budget chat' : 'Budget Assistant'}
        </div>
      </div>

      <div className="chat-body">
        <div
          ref={threadRef}
          onScroll={(event) => {
            handleThreadScroll(event);
            measureMarkers();
          }}
          className={`chat-thread-shell ${true ? 'is-scrolling' : ''}`}
        >
          <div className={`chat-thread-content ${hasMessages ? 'with-messages' : 'empty'}`}>
            {hasMessages ? (
              messages.map((message, index) => {
                const messageId = getMessageId(message, index);

                return (
                  <div
                    key={messageId}
                    ref={(node) => setMessageRef(messageId, node)}
                    className="chat-message-anchor"
                  >
                    <ChatMessage message={message} />
                  </div>
                );
              })
            ) : (
              <div className="chat-empty-hero">
                <h1>What's on your mind today?</h1>
                <p>
                  Ask anything about spending, saving, guilt, goals, or a purchase you are
                  considering.
                </p>
              </div>
            )}
          </div>
        </div>

        {hasMessages ? (
          <div className="chat-right-rail">
            <div className={`chat-message-map ${isThreadScrolling ? 'is-active' : ''}`}>
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  className={`chat-message-marker ${marker.role} ${
                    hoveredMarkerId === marker.id ? 'is-hovered' : ''
                  }`}
                  style={{
                    top: `${marker.topPercent}%`,
                    // height: `${marker.heightPercent}%`,
                  }}
                  onClick={() => handleMarkerClick(marker.id)}
                  onMouseEnter={() => setHoveredMarkerId(marker.id)}
                  onMouseLeave={() => setHoveredMarkerId((currentId) =>
                    currentId === marker.id ? null : currentId
                  )}
                />
              ))}
            </div>

            {hoveredMarker ? (
              <div className="chat-map-tooltip" style={{ top: `${hoveredMarker.centerPercent}%` }}>
                <span className="chat-map-tooltip-role">
                  {hoveredMarker.role === 'user' ? 'You' : 'Budget Assistant'}
                </span>
                <span className="chat-map-tooltip-text">{hoveredMarker.preview}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ChatComposer disabled={isStreaming} onSend={onSendMessage} />
    </section>
  );
}

function makePreview(content) {
  const normalized = String(content || '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'Streaming response...';
  }

  return normalized.length > 48 ? `${normalized.slice(0, 48)}...` : normalized;
}

export default ChatPage;
