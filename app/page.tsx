'use client';

import { useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { GhostMeshNetwork } from '@/lib/mesh-network';
import { Message, Device, Contact, SOSLog } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { DashboardCard } from '@/components/DashboardCard';
import { ContactsCard } from '@/components/ContactsCard';
import { ConversationCard } from '@/components/ConversationCard';
import { PerMonCard } from '@/components/PerMonCard';
import { DevicesCard } from '@/components/DevicesCard';
import { SignalHistogramCard } from '@/components/SignalHistogramCard';
import { SOSLogCard } from '@/components/SOSLogCard';
import { WelcomePage } from '@/components/WelcomePage';

// Protocol constants
const SOS_MSG_ID = 0xFFF0; // MSG ID that identifies SOS emergency messages

type TabKey = 'dashboard' | 'contacts' | 'chats' | 'permon' | 'devices' | 'signal' | string;

export default function Home() {
  const [myPhone, setMyPhone] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSetup, setIsSetup] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '' });
  const [messageText, setMessageText] = useState<{ [key: string]: string }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [network, setNetwork] = useState<GhostMeshNetwork | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<TabKey>>(new Set(['dashboard']));
  const [meshActive, setMeshActive] = useState(false);
  const [performanceData, setPerformanceData] = useState<Array<{ timestamp: number; bleDeviceCount: number }>>([]);
  const [sosLogs, setSosLogs] = useState<SOSLog[]>([]);

  const toggleSection = (section: TabKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  useEffect(() => {
    // Check for reset URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      // Clear storage and reset state
      localStorage.clear();
      setIsSetup(false);
      setMyPhone('');
      setPhoneInput('');
      // Remove the reset parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const savedPhone = storage.getMyPhone();
    if (savedPhone) {
      setMyPhone(savedPhone);
      setIsSetup(true);
      initNetwork(savedPhone);
    }
    setContacts(storage.getContacts());
    setMessages(storage.getMessages());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initNetwork = (phone: string) => {
    const meshNetwork = new GhostMeshNetwork(phone);
    meshNetwork.setOnDeviceUpdate((updatedDevices) => {
      setDevices(updatedDevices);
    });
    meshNetwork.setOnMessageReceived((message) => {
      setMessages(prev => [...prev, message]);

      // Check if this is a received SOS message by MSG ID (not from ourselves)
      if (message.msgId === SOS_MSG_ID && message.srcId !== phone) {
        console.log('SOS received from:', message.srcId, 'my phone:', phone);
        console.log('Raw SOS Message Object:', message);

        // Convert payload to hex string
        const payloadHex = Array.from(message.content)
          .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('');

        console.log('SOS Received - Payload (hex):', payloadHex);

        // TODO: Parse binary payload when implemented
        // For now, extract from placeholder or use defaults
        const newLog: SOSLog = {
          id: `sos-received-${Date.now()}`,
          timestamp: Date.now(),
          direction: 'receive',
          fromNumber: message.srcId,
          gpsLocation: '[GPS from binary]', // Will parse from binary data
          sentTimestamp: new Date(message.timestamp).toLocaleTimeString(),
          messageId: message.id,
          payload: payloadHex
        };
        setSosLogs(prev => [...prev, newLog]);
      } else if (message.msgId === SOS_MSG_ID) {
        console.log('SOS from self, ignoring. srcId:', message.srcId, 'phone:', phone);
      }
    });
    meshNetwork.setOnStatusChange((active) => {
      setMeshActive(active);
    });
    meshNetwork.setOnPerformanceUpdate((data) => {
      setPerformanceData([...data]);
    });
    setNetwork(meshNetwork);
    setDevices(meshNetwork.getAllDevices());
    setPerformanceData(meshNetwork.getPerformanceData());
  };

  const setupPhone = () => {
    if (!phoneInput.trim()) return;
    storage.setMyPhone(phoneInput);
    setMyPhone(phoneInput);
    setIsSetup(true);
    initNetwork(phoneInput);
  };

  const updatePhone = (newPhone: string) => {
    if (!newPhone.trim() || newPhone === myPhone) return;

    // Disconnect existing network
    if (network) {
      network.disconnect();
    }

    // Update phone and reinitialize
    storage.setMyPhone(newPhone);
    setMyPhone(newPhone);
    initNetwork(newPhone);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phoneNumber) return;
    const updated = [...contacts, newContact];
    setContacts(updated);
    storage.setContacts(updated);
    setNewContact({ name: '', phoneNumber: '' });
  };

  const sendMessage = (contactPhone: string) => {
    const text = messageText[contactPhone];
    if (!text?.trim() || !network) return;
    network.sendMessage(contactPhone, text);
    setMessageText(prev => ({ ...prev, [contactPhone]: '' }));
    setMessages(storage.getMessages());
  };

  const sendSOS = () => {
    if (!network) return;

    const now = Date.now();

    // Get GPS location from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          console.log(`GPS Location: ${lat}, ${lon} (accuracy: ${accuracy}m)`);

          // TODO: Implement actual binary encoding per protocol:
          // - 4 bytes: GPS Latitude (float32)
          // - 4 bytes: GPS Longitude (float32)
          // - 2 bytes: GPS Accuracy (uint16)
          // - 8 bytes: Unix timestamp milliseconds (uint64)
          const binaryPlaceholder = `[GPS:${lat},${lon},${accuracy}m,${now}]`;

          // Send to BROADCAST with MSG ID 0xFFF0 (identifies SOS)
          network.sendMessage('BROADCAST', binaryPlaceholder, SOS_MSG_ID);

          // Get the message ID from messages
          const allMessages = storage.getMessages();
          const lastMessage = allMessages[allMessages.length - 1];

          console.log('Raw SOS Message Object (sent):', lastMessage);

          // Convert payload to hex string for logging
          const payloadHex = Array.from(binaryPlaceholder)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');

          console.log('SOS Sent - Payload (hex):', payloadHex);

          // Add to SOS log
          const newLog: SOSLog = {
            id: `sos-${now}`,
            timestamp: now,
            direction: 'sent',
            gpsLocation: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            sentTimestamp: new Date(now).toLocaleTimeString(),
            messageId: lastMessage?.id,
            payload: payloadHex
          };

          setSosLogs(prev => {
            const updated = prev.map(log => log.payload ? log : { ...log, payload: '' });
            return [...updated, newLog];
          });
        },
        (error) => {
          console.error('GPS Error:', error.message);

          // Fallback: Send without GPS (use 0.0, 0.0 with max accuracy = no GPS)
          const binaryPlaceholder = `[GPS:0.0,0.0,65535m,${now}]`;
          network.sendMessage('BROADCAST', binaryPlaceholder, SOS_MSG_ID);

          const allMessages = storage.getMessages();
          const lastMessage = allMessages[allMessages.length - 1];

          console.log('Raw SOS Message Object (sent, no GPS):', lastMessage);

          const payloadHex = Array.from(binaryPlaceholder)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');

          console.log('SOS Sent (no GPS) - Payload (hex):', payloadHex);

          const newLog: SOSLog = {
            id: `sos-${now}`,
            timestamp: now,
            direction: 'sent',
            gpsLocation: '[No GPS]',
            sentTimestamp: new Date(now).toLocaleTimeString(),
            messageId: lastMessage?.id,
            payload: payloadHex
          };

          setSosLogs(prev => {
            const updated = prev.map(log => log.payload ? log : { ...log, payload: '' });
            return [...updated, newLog];
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error('Geolocation not supported');
      alert('GPS not available in this browser');
    }
  };

  const getContactName = (phoneNumber: string) => {
    const contact = contacts.find(c => c.phoneNumber === phoneNumber);
    return contact ? contact.name : phoneNumber;
  };

  const connectedCount = useMemo(
    () => devices.filter(d => d.connected).length,
    [devices]
  );

  const recentMessages = useMemo(
    () => messages.slice(-5).reverse(),
    [messages]
  );

  // Group messages by conversation (unique sender/receiver pairs)
  const conversations = useMemo(() => {
    const convMap = new Map<string, Message[]>();

    messages.forEach(msg => {
      // Determine the other party (not myPhone)
      const otherParty = msg.srcId === myPhone ? msg.destId : msg.srcId;

      if (!convMap.has(otherParty)) {
        convMap.set(otherParty, []);
      }
      convMap.get(otherParty)!.push(msg);
    });

    // Convert to array and sort by latest message timestamp
    return Array.from(convMap.entries())
      .map(([phone, msgs]) => ({
        phone,
        messages: msgs.sort((a, b) => a.timestamp - b.timestamp),
        latestTimestamp: Math.max(...msgs.map(m => m.timestamp))
      }))
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [messages, myPhone]);

  if (!isSetup) {
    return (
      <WelcomePage
        phoneInput={phoneInput}
        onPhoneInputChange={setPhoneInput}
        onContinue={setupPhone}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-rounded text-xl leading-none">hub</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">GhostMesh</h1>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {myPhone}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Bluetooth Beacon */}
              <div className="relative">
                {meshActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                )}
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-xl leading-none">bluetooth</span>
                </div>
              </div>
              <StatusBadge connected={meshActive} />
              <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-none">{connectedCount} peers</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Collapsible Cards */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-12 space-y-4">
        <DashboardCard
          isExpanded={expandedSections.has('dashboard')}
          onToggle={() => toggleSection('dashboard')}
          connectedCount={connectedCount}
          messages={messages}
          recentMessages={recentMessages}
          devices={devices}
          myPhone={myPhone}
          getContactName={getContactName}
          onViewAllChats={() => toggleSection('chats')}
          onUpdatePhone={updatePhone}
          onMessageClick={(senderPhone) => {
            const chatKey = `chat-${senderPhone}`;
            const newExpanded = new Set(expandedSections);
            newExpanded.add(chatKey);
            setExpandedSections(newExpanded);
          }}
          systemContacts={contacts.filter(c => c.isSpecial)}
          onSelectContact={(phoneNumber) => {
            const chatKey = `chat-${phoneNumber}`;
            const newExpanded = new Set(expandedSections);
            newExpanded.add(chatKey);
            setExpandedSections(newExpanded);
          }}
          onSendSOS={sendSOS}
        />

        <SOSLogCard
          isExpanded={expandedSections.has('sos-log')}
          onToggle={() => toggleSection('sos-log')}
          logs={sosLogs}
        />

        <PerMonCard
          isExpanded={expandedSections.has('permon')}
          onToggle={() => toggleSection('permon')}
          performanceData={performanceData}
        />

        <SignalHistogramCard
          isExpanded={expandedSections.has('signal')}
          onToggle={() => toggleSection('signal')}
          devices={devices}
        />

        <DevicesCard
          isExpanded={expandedSections.has('devices')}
          onToggle={() => toggleSection('devices')}
          devices={devices}
        />

        <ContactsCard
          isExpanded={expandedSections.has('contacts')}
          onToggle={() => toggleSection('contacts')}
          contacts={contacts}
          newContact={newContact}
          onNewContactChange={setNewContact}
          onAddContact={addContact}
          onSelectContact={(phoneNumber) => {
            const chatKey = `chat-${phoneNumber}`;
            const newExpanded = new Set(expandedSections);
            newExpanded.add(chatKey);
            setExpandedSections(newExpanded);
          }}
        />

        {/* Individual Conversation Cards - Sorted by latest message */}
        {conversations.map(({ phone, messages: convMessages }) => (
          <ConversationCard
            key={phone}
            contactPhone={phone}
            contactName={getContactName(phone)}
            messages={convMessages}
            myPhone={myPhone}
            isExpanded={expandedSections.has(`chat-${phone}`)}
            onToggle={() => toggleSection(`chat-${phone}`)}
            messageText={messageText[phone] || ''}
            onMessageTextChange={(text) => setMessageText(prev => ({ ...prev, [phone]: text }))}
            onSendMessage={() => sendMessage(phone)}
          />
        ))}

        {/* Empty conversation cards for expanded chats without messages */}
        {Array.from(expandedSections)
          .filter(section => section.startsWith('chat-'))
          .map(section => section.replace('chat-', ''))
          .filter(phone => !conversations.some(conv => conv.phone === phone))
          .map(phone => (
            <ConversationCard
              key={phone}
              contactPhone={phone}
              contactName={getContactName(phone)}
              messages={[]}
              myPhone={myPhone}
              isExpanded={true}
              onToggle={() => toggleSection(`chat-${phone}`)}
              messageText={messageText[phone] || ''}
              onMessageTextChange={(text) => setMessageText(prev => ({ ...prev, [phone]: text }))}
              onSendMessage={() => sendMessage(phone)}
            />
          ))}
      </main>
    </div>
  );
}
