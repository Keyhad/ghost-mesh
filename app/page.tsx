'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { GhostMeshNetwork } from '@/lib/mesh-network';
import { Message, Device, Contact } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts' | 'devices'>('messages');

  useEffect(() => {
    const savedPhone = storage.getMyPhone();
    if (savedPhone) {
      setMyPhone(savedPhone);
      setIsSetup(true);
      initNetwork(savedPhone);
    }
    setContacts(storage.getContacts());
    setMessages(storage.getMessages());
  }, []);

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

  if (!isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">GhostMesh</h1>
          <p className="text-gray-300 mb-4 text-center">Enter your phone number to join the mesh network</p>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={setupPhone}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h1 className="text-2xl font-bold text-white">GhostMesh</h1>
            <p className="text-blue-100 mt-1">Your ID: {myPhone}</p>
            <p className="text-blue-100 text-sm">
              Connected Devices: {devices.filter(d => d.connected).length}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'messages'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'contacts'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'devices'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Devices
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Send Message</h3>
                  <select
                    value={selectedContact}
                    onChange={(e) => setSelectedContact(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Contact</option>
                    {contacts.map((c) => (
                      <option key={c.phoneNumber} value={c.phoneNumber}>
                        {c.name} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!selectedContact || !messageText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 rounded transition"
                  >
                    Send via Mesh
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="text-white font-medium mb-3">Message History</h3>
                  {messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No messages yet</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded ${
                            msg.srcId === myPhone ? 'bg-blue-600 ml-8' : 'bg-gray-600 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-white font-medium text-sm">
                              {msg.srcId === myPhone ? 'You' : getContactName(msg.srcId)}
                            </span>
                            <span className="text-gray-300 text-xs">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white">{msg.content}</p>
                          <p className="text-gray-300 text-xs mt-1">
                            Hops: {msg.hops.length} | TTL: {msg.ttl}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Add Contact</h3>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Contact Name"
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    value={newContact.phoneNumber}
                    onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                    placeholder="Phone Number"
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addContact}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition"
                  >
                    Add Contact
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Your Contacts</h3>
                  {contacts.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No contacts yet</p>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div
                          key={contact.phoneNumber}
                          className="bg-gray-600 p-3 rounded flex justify-between items-center"
                        >
                          <div>
                            <p className="text-white font-medium">{contact.name}</p>
                            <p className="text-gray-300 text-sm">{contact.phoneNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Nearby Devices</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Scanning for GhostMesh signals... (WebRTC peer-to-peer connections)
                </p>
                {devices.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No devices discovered</p>
                ) : (
                  <div className="space-y-2">
                    {devices.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 rounded flex justify-between items-center ${
                          device.connected ? 'bg-green-900' : 'bg-gray-600'
                        }`}
                      >
                        <div>
                          <p className="text-white font-medium">{device.id}</p>
                          <p className="text-gray-300 text-sm">
                            Last seen: {new Date(device.lastSeen).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-sm ${
                            device.connected
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-500 text-gray-300'
                          }`}
                        >
                          {device.connected ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
