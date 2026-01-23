import { Contact, Message } from '@/lib/types';
import { CardHeader } from './CardHeader';

interface ChatsCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  contacts: Contact[];
  selectedContact: string;
  onSelectContact: (phoneNumber: string) => void;
  messages: Message[];
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
  myPhone: string;
  getContactName: (phoneNumber: string) => string;
}

export const ChatsCard = ({
  isExpanded,
  onToggle,
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  messageText,
  onMessageTextChange,
  onSendMessage,
  myPhone,
  getContactName,
}: ChatsCardProps) => {
  return (
    <div className="card-container bg-purple-50/80 dark:bg-purple-950/20 shadow-purple-500/5">
      <CardHeader
        icon="chat"
        title="Chats"
        subtitle={selectedContact ? getContactName(selectedContact) : `${contacts.length} contacts available`}
        gradientFrom="from-blue-500"
        gradientTo="to-indigo-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          <div className="card-grid" style={{gridTemplateColumns: '1fr 2fr'}}>
            {/* Contact Selector */}
            <div className="card-section">
              <h3 className="section-heading mb-4">Conversations</h3>
              <div className="flex-col-gap">
                {contacts.length === 0 ? (
                  <div className="empty-state">
                    <span className="material-symbols-rounded empty-state-icon">group</span>
                    <p className="empty-state-subtext">Add a contact to chat</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => onSelectContact(contact.phoneNumber)}
                      className={selectedContact === contact.phoneNumber ? 'contact-btn-active' : 'contact-btn'}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            selectedContact === contact.phoneNumber
                              ? 'bg-white/20 text-white'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          }`}
                        >
                          {contact.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              selectedContact === contact.phoneNumber ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {contact.name}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              selectedContact === contact.phoneNumber
                                ? 'text-white/70'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="card-section chat-container" style={{height: '500px'}}>
              <div className="pb-3 divider-border">
                <h3 className="section-heading">
                  {selectedContact ? getContactName(selectedContact) : 'Select a contact'}
                </h3>
                {selectedContact && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact}</p>
                )}
              </div>

              <div className="chat-messages py-4 flex-col-gap">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="empty-state">
                      <span className="material-symbols-rounded empty-state-icon">chat</span>
                      <p className="empty-state-subtext">No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={msg.srcId === myPhone ? 'message-row-end' : 'message-row-start'}>
                      <div
                        className={msg.srcId === myPhone ? 'message-bubble-out' : 'message-bubble-in'}
                      >
                        <p className="message-text">{msg.content}</p>
                        <p className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input-bar">
                <div className="flex-row">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => onMessageTextChange(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field"
                    onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                  />
                  <button
                    onClick={onSendMessage}
                    disabled={!selectedContact || !messageText.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="material-symbols-rounded text-lg leading-none">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
