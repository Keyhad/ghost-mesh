'use client';

import { useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { GhostMeshNetwork } from '@/lib/mesh-network';
import { Message, Device, Contact } from '@/lib/types';

type TabKey = 'dashboard' | 'contacts' | 'chats';

// Reusable Card Component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

// Icon Button Component
const IconButton = ({
  icon,
  onClick,
  className = ''
}: {
  icon: string;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${className}`}
  >
    <span className="material-symbols-rounded text-xl">{icon}</span>
  </button>
);

// Status Badge Component
const StatusBadge = ({ connected }: { connected: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {connected ? 'Online' : 'Offline'}
    </span>
  </div>
);

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

  const toggleSection = (section: TabKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  const [expandedSections, setExpandedSections] = useState<Set<TabKey>>(new Set(['dashboard']));

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
                {connectedCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                )}
              </div>
              <StatusBadge connected={connectedCount > 0} />
              <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{connectedCount} peers</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Accordion Cards */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-12 space-y-4">
        {activeTab === 'dashboard' && (
          <div className="grid gap-6 lg:grid-cols-3">
                {/* Stats Cards */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Network Status</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {connectedCount > 0 ? 'Connected' : 'Searching'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-2xl">lan</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Peers</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{connectedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-2xl">group</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{messages.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-2xl">chat</span>
                </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Recent Messages */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Messages</h3>
                  <button
                    onClick={() => toggleSection('chats')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all
                  </button>
              </div>
              <div className="space-y-3">
                {recentMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <span className="material-symbols-rounded text-gray-400">inbox</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
                  </div>
                ) : (
                  recentMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {msg.srcId === myPhone ? 'Y' : getContactName(msg.srcId)[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {msg.srcId === myPhone ? 'You' : getContactName(msg.srcId)}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                </div>
                </div>

                {/* Devices List */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Connected Devices</h3>
              <div className="space-y-3">
                {devices.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="material-symbols-rounded text-3xl text-gray-300 dark:text-gray-700">devices</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No devices</p>
                  </div>
                ) : (
                  devices.map((device) => (
                    <div key={device.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                          {device.id}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          device.connected
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-400'
                        }`}>
                          {device.connected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(device.lastSeen).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
                </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Contacts Card */}
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection('contacts')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center">
                <span className="material-symbols-rounded text-xl">contacts</span>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contacts</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{contacts.length} contacts</p>
              </div>
            </div>
            <span className={`material-symbols-rounded text-gray-400 transition-transform ${expandedSections.has('contacts') ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
          
          {expandedSections.has('contacts') && (
            <div className="p-6 pt-0">
              <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                {/* Add Contact Form */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Add Contact</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <div className="flex items-center gap-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 px-4 py-3">
                    <span className="material-symbols-rounded text-gray-400">person</span>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                  <div className="flex items-center gap-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 px-4 py-3">
                    <span className="material-symbols-rounded text-gray-400">call</span>
                    <input
                      type="tel"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                      placeholder="+1234567890"
                      className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <button
                  onClick={addContact}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                    Add Contact
                  </button>
                </div>
                </div>

                {/* Contacts List */}
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">All Contacts</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {contacts.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                      <span className="material-symbols-rounded text-2xl text-gray-400">contacts</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No contacts yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first contact to start chatting</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => {
                        setSelectedContact(contact.phoneNumber);
                        setActiveTab('chats');
                      }}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {contact.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.phoneNumber}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* Contact Selector */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Conversations</h2>
              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-rounded text-3xl text-gray-300 dark:text-gray-700">group</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Add a contact to start chatting</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => setSelectedContact(contact.phoneNumber)}
                      className={`w-full p-3 rounded-2xl transition text-left ${
                        selectedContact === contact.phoneNumber
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          selectedContact === contact.phoneNumber
                            ? 'bg-white/20 text-white'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        }`}>
                          {contact.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            selectedContact === contact.phoneNumber ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>
                            {contact.name}
                          </p>
                          <p className={`text-xs truncate ${
                            selectedContact === contact.phoneNumber ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="p-6 flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedContact ? getContactName(selectedContact) : 'Select a contact'}
                  </h2>
                  {selectedContact && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedContact}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <span className="material-symbols-rounded text-2xl text-gray-400">chat</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.srcId === myPhone ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-3 rounded-3xl ${
                        msg.srcId === myPhone
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.srcId === myPhone ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!selectedContact || !messageText.trim()}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-rounded text-xl">send</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
