import React from 'react';
import { Message, Device, Contact } from '@/lib/types';
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
  systemContacts?: Contact[];
  onSelectContact?: (phoneNumber: string) => void;
  onSendSOS?: () => void;
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
  systemContacts = [],
  onSelectContact,
  onSendSOS,
}: DashboardCardProps) => {
  const [phoneInput, setPhoneInput] = React.useState(myPhone);
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [pressingButton, setPressingButton] = React.useState<string | null>(null);

  const handleLongPressStart = (phoneNumber: string) => {
    setPressingButton(phoneNumber);
    const timer = setTimeout(() => {
      if (phoneNumber === 'SOS' && onSendSOS) {
        onSendSOS();
      } else if (onSelectContact) {
        onSelectContact(phoneNumber);
      }
      setPressingButton(null);
    }, 2000);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setPressingButton(null);
  };

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
            {/* Quick Action Buttons */}
            {systemContacts.length > 0 && onSelectContact && (
              <>
                {systemContacts.find(c => c.phoneNumber === 'BROADCAST') && (
                  <button
                    onMouseDown={() => handleLongPressStart('BROADCAST')}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart('BROADCAST')}
                    onTouchEnd={handleLongPressEnd}
                    className={`field-box cursor-pointer transition-all !border-0 hover:shadow-md active:scale-95 relative overflow-hidden ${
                      pressingButton === 'BROADCAST' ? 'ring-1 ring-red-400 shadow-lg' : ''
                    }`}
                  >
                    {pressingButton === 'BROADCAST' && (
                      <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                    )}
                    <span className="material-symbols-rounded icon-xl text-blue-500 relative z-10">cell_tower</span>
                    <div className="label-text relative z-10">Broadcast</div>
                  </button>
                )}
                {systemContacts.find(c => c.phoneNumber === 'SOS') && (
                  <button
                    onMouseDown={() => handleLongPressStart('SOS')}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart('SOS')}
                    onTouchEnd={handleLongPressEnd}
                    className={`field-box cursor-pointer transition-all !border-0 hover:shadow-md active:scale-95 relative overflow-visible m-1 ${
                      pressingButton === 'SOS' ? 'ring-1 ring-red-400 shadow-lg' : ''
                    }`}
                  >
                    {pressingButton === 'SOS' && (
                      <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                    )}
                    <span className="material-symbols-rounded icon-xl text-red-500 relative z-10">sos</span>
                    <div className="label-text relative z-10">Emergency</div>
                  </button>
                )}
              </>
            )}

            <br/>
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
        </div>
      )}
    </div>
  );
};
