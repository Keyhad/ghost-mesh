'use client';

import { useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { GhostMeshNetwork } from '@/lib/mesh-network';
import { Message, Device, Contact } from '@/lib/types';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { DashboardCard } from '@/components/DashboardCard';
import { ContactsCard } from '@/components/ContactsCard';
import { ChatsCard } from '@/components/ChatsCard';

type TabKey = 'dashboard' | 'contacts' | 'chats';

export default function Home() {
  const [myPhone, setMyPhone] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSetup, setIsSetup] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '' });
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [network, setNetwork] = useState<GhostMeshNetwork | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<TabKey>>(new Set(['dashboard']));
  const [meshActive, setMeshActive] = useState(false);

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
    setNetwork(meshNetwork);
    setDevices(meshNetwork.getAllDevices());
  };

  const setupPhone = () => {
    if (!phoneInput.trim()) return;
    storage.setMyPhone(phoneInput);
    setMyPhone(phoneInput);
    setIsSetup(true);
    initNetwork(phoneInput);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phoneNumber) return;
    const updated = [...contacts, newContact];
    setContacts(updated);
    storage.setContacts(updated);
    setNewContact({ name: '', phoneNumber: '' });
  };

  const sendMessage = () => {
    if (!selectedContact || !messageText.trim() || !network) return;
    network.sendMessage(selectedContact, messageText);
    setMessageText('');
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

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 grid place-items-center p-6">
        <Card className="w-full max-w-md p-10">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="material-symbols-rounded text-4xl">hub</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GhostMesh</h1>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Enter the decentralized mesh network</p>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-rounded text-gray-400 text-4xl">call</span>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Phone Number</label>
              <div className="flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800 px-5 py-3.5 w-72">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-center"
                  onKeyPress={(e) => e.key === 'Enter' && setupPhone()}
                />
              </div>
            </div>
            <button
              onClick={setupPhone}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Continue
            </button>
          </div>
        </Card>
      </div>
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
                <span className="material-symbols-rounded text-xl">hub</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">GhostMesh</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{myPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Bluetooth Beacon */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-xl">bluetooth</span>
                </div>
                {meshActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                )}
              </div>
              <StatusBadge connected={meshActive} />
              <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{connectedCount} peers</span>
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
        />

        <ContactsCard
          isExpanded={expandedSections.has('contacts')}
          onToggle={() => toggleSection('contacts')}
          contacts={contacts}
          newContact={newContact}
          onNewContactChange={setNewContact}
          onAddContact={addContact}
          onSelectContact={(phoneNumber) => {
            setSelectedContact(phoneNumber);
            toggleSection('chats');
          }}
        />

        <ChatsCard
          isExpanded={expandedSections.has('chats')}
          onToggle={() => toggleSection('chats')}
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          messages={messages}
          messageText={messageText}
          onMessageTextChange={setMessageText}
          onSendMessage={sendMessage}
          myPhone={myPhone}
          getContactName={getContactName}
        />
      </main>
    </div>
  );
}
