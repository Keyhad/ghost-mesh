'use client';

import { useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { GhostMeshNetwork } from '@/lib/mesh-network';
import { Message, Device, Contact } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { DashboardCard } from '@/components/DashboardCard';
import { ContactsCard } from '@/components/ContactsCard';
import { ConversationCard } from '@/components/ConversationCard';
import { PerMonCard } from '@/components/PerMonCard';
import { DevicesCard } from '@/components/DevicesCard';
import { SignalHistogramCard } from '@/components/SignalHistogramCard';
import { WelcomePage } from '@/components/WelcomePage';

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
      </main>
    </div>
  );
}
