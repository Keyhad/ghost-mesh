import React from 'react';
import { Message } from '@/lib/types';
import { CardHeader } from './CardHeader';

interface ConversationCardProps {
  contactPhone: string;
  contactName: string;
  messages: Message[];
  myPhone: string;
  isExpanded: boolean;
  onToggle: () => void;
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
}

export const ConversationCard = ({
  contactPhone,
  contactName,
  messages,
  myPhone,
  isExpanded,
  onToggle,
  messageText,
  onMessageTextChange,
  onSendMessage,
}: ConversationCardProps) => {
  const latestMessage = messages[messages.length - 1];
  const unreadCount = messages.filter(m => m.srcId !== myPhone).length;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const subtitle = messages.length > 0
    ? `${messages.length} messages • ${new Date(latestMessage.timestamp).toLocaleString()}`
    : 'No messages yet';

  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      // Small delay to ensure the card is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded]);

  return (
    <div className="card-container bg-violet-50/80 dark:bg-violet-950/20 shadow-violet-500/5">
      <CardHeader
        icon="chat"
        title={contactName}
        subtitle={subtitle}
        gradientFrom="from-violet-500"
        gradientTo="to-fuchsia-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
        iconSize="md"
      />

      {isExpanded && (
        <div className="card-content">
          {/* Chat Messages */}
          <div className="card-section chat-container">
            <div className="divider-border">
              <h3 className="section-heading">{contactName}</h3>
              <p className="contact-phone">{contactPhone}</p>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.srcId === myPhone ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={msg.srcId === myPhone ? 'message-bubble-out' : 'message-bubble-in'}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.srcId === myPhone ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input-bar">
              <div className="flex-row flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => onMessageTextChange(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field"
                  onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                  readOnly={false}
                  autoComplete="off"
                />
              </div>
              <div>
                <button
                  onClick={onSendMessage}
                  disabled={!messageText.trim()}
                  className="btn-secondary disabled-state icon-btn"
                >
                  <span className="material-symbols-rounded icon-md leading-none">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
