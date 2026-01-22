import { Message, Device } from '@/lib/types';

interface DashboardCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  connectedCount: number;
  messages: Message[];
  recentMessages: Message[];
  devices: Device[];
  myPhone: string;
  getContactName: (phoneNumber: string) => string;
  onViewAllChats: () => void;
}

export const DashboardCard = ({
  isExpanded,
  onToggle,
  connectedCount,
  messages,
  recentMessages,
  devices,
  myPhone,
  getContactName,
  onViewAllChats,
}: DashboardCardProps) => {
  return (
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
            <span className="material-symbols-rounded text-2xl leading-none">dashboard</span>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Dashboard</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {connectedCount} peers • {messages.length} messages
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
        <div className="px-6 pb-6 space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Network</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {connectedCount > 0 ? 'Active' : 'Idle'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">lan</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Peers</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{connectedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">group</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{messages.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">chat</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Messages</h3>
              <button onClick={onViewAllChats} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-2">
              {recentMessages.length === 0 ? (
                <div className="text-center py-6">
                  <span className="material-symbols-rounded text-2xl text-gray-300 dark:text-gray-700 leading-none">inbox</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No messages</p>
                </div>
              ) : (
                recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-700/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.srcId === myPhone ? 'Y' : getContactName(msg.srcId)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {msg.srcId === myPhone ? 'You' : getContactName(msg.srcId)}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
