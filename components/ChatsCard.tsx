import { Contact, Message } from '@/lib/types';

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
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
            <span className="material-symbols-rounded text-2xl leading-none">chat</span>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Chats</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedContact ? getContactName(selectedContact) : 'Select a contact'}
            </p>
          </div>
        </div>
        <span
          className={`material-symbols-rounded text-gray-400 transition-transform leading-none ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isExpanded && (
        <div className="p-6 pt-0">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* Contact Selector */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Conversations</h3>
              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-rounded text-3xl text-gray-300 dark:text-gray-700 leading-none">group</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add a contact to chat</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => onSelectContact(contact.phoneNumber)}
                      className={`w-full p-3 rounded-xl transition text-left ${
                        selectedContact === contact.phoneNumber
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'bg-white dark:bg-zinc-700/50 hover:bg-gray-100 dark:hover:bg-zinc-700'
                      }`}
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
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 flex flex-col h-[500px]">
              <div className="pb-3 border-b border-gray-200 dark:border-zinc-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedContact ? getContactName(selectedContact) : 'Select a contact'}
                </h3>
                {selectedContact && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-symbols-rounded text-3xl text-gray-300 dark:text-gray-700 leading-none">chat</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.srcId === myPhone ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          msg.srcId === myPhone
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white'
                        }`}
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
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => onMessageTextChange(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-700 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                  />
                  <button
                    onClick={onSendMessage}
                    disabled={!selectedContact || !messageText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
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
