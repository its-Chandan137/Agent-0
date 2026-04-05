import ChatComposer from '../components/ChatComposer';
import ChatMessage from '../components/ChatMessage';

function ChatPage({ activeChat, isBootstrapping, isStreaming, onSendMessage }) {
  const hasMessages = Boolean(activeChat?.messages?.length);

  return (
    <section className="page chat-page">
      <div className="chat-topbar">
        <div className="chat-topbar-title">
          <span>ChatGPT</span>
          <span className="chat-topbar-caret">v</span>
        </div>
        <div className="chat-topbar-status">
          {hasMessages ? activeChat?.title || 'Budget chat' : 'Budget Assistant'}
        </div>
      </div>

      <div className={`chat-thread ${hasMessages ? 'with-messages' : 'empty'}`}>
        {isBootstrapping ? (
          <div className="empty-state chat-empty-state">
            <h3>Loading your workspace...</h3>
            <p>Pulling your budget profile, wishlist, and saved chat history.</p>
          </div>
        ) : hasMessages ? (
          activeChat.messages.map((message, index) => (
            <ChatMessage
              key={message.clientId || `${message.role}-${message.timestamp}-${index}`}
              message={message}
            />
          ))
        ) : (
          <div className="chat-empty-hero">
            <h1>What's on your mind today?</h1>
            <p>Ask anything about spending, saving, guilt, goals, or a purchase you are considering.</p>
          </div>
        )}
      </div>

      <ChatComposer disabled={isStreaming} onSend={onSendMessage} />
    </section>
  );
}

export default ChatPage;
