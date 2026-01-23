import React from 'react';
import { Message, Device } from '@/lib/types';
import { CardHeader } from './CardHeader';
import { StatCard } from './StatCard';
import { InputField } from './InputField';

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
  onUpdatePhone: (newPhone: string) => void;
  onMessageClick: (senderPhone: string) => void;
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
  onUpdatePhone,
  onMessageClick,
}: DashboardCardProps) => {
  const [phoneInput, setPhoneInput] = React.useState(myPhone);

  const handlePhoneChange = (value: string) => {
    setPhoneInput(value);
    if (value.trim() && value !== myPhone) {
      onUpdatePhone(value.trim());
    }
  };

  React.useEffect(() => {
    setPhoneInput(myPhone);
  }, [myPhone]);
  return (
    <div className="card-container bg-emerald-50/80 dark:bg-emerald-950/20 shadow-emerald-500/5">
      <CardHeader
        icon="dashboard"
        title="Dashboard"
        subtitle={`${connectedCount} peers • ${messages.length} messages`}
        gradientFrom="from-emerald-500"
        gradientTo="to-teal-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          {/* All Fields - Unified Grid */}
          <div className="card-grid card-grid-4">
            <InputField
              icon="phone"
              label="Phone Number"
              value={phoneInput}
              onChange={handlePhoneChange}
              placeholder="+1234567890"
              type="tel"
              colorScheme="amber"
            />

            <StatCard
              label="Network"
              value={connectedCount > 0 ? 'Active' : 'Idle'}
              icon="lan"
              colorScheme="emerald"
            />
            <StatCard
              label="Peers"
              value={connectedCount}
              icon="group"
              colorScheme="blue"
            />
            <StatCard
              label="Messages"
              value={messages.length}
              icon="chat"
              colorScheme="purple"
            />
          </div>

          {/* Content Grid */}
          <div className="card-section">
            <div className="section-header">
              <h3 className="section-heading">Recent Messages</h3>
              <button onClick={onViewAllChats} className="text-link">
                View all
              </button>
            </div>
            <div className="card-grid card-grid-3">
              {recentMessages.length === 0 ? (
                <div className="empty-state">
                  <span className="material-symbols-rounded icon-2xl text-gray-300 dark:text-gray-700 leading-none">inbox</span>
                  <p className="text-caption">No messages</p>
                </div>
              ) : (
                recentMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => onMessageClick(msg.srcId === myPhone ? msg.destId : msg.srcId)}
                    className="field-box w-full field-box-clickable"
                  >
                    <div className="avatar">
                      {msg.srcId === myPhone ? getContactName(msg.destId)[0] : getContactName(msg.srcId)[0]}
                    </div>
                    <div className="label-text">
                      {msg.srcId === myPhone ? getContactName(msg.destId) : getContactName(msg.srcId)}
                    </div>
                    <p className="text-body line-clamp-2 leading-tight">{msg.content}</p>
                    <span className="text-micro">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
