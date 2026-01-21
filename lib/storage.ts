'use client';

import { Message, Device } from './types';

const STORAGE_KEYS = {
  MY_PHONE: 'ghostmesh_my_phone',
  CONTACTS: 'ghostmesh_contacts',
  MESSAGES: 'ghostmesh_messages',
  DEVICES: 'ghostmesh_devices',
};

export const storage = {
  getMyPhone: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.MY_PHONE);
  },
  
  setMyPhone: (phone: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MY_PHONE, phone);
  },
  
  getContacts: (): any[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    return data ? JSON.parse(data) : [];
  },
  
  setContacts: (contacts: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },
  
  getMessages: (): Message[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  },
  
  addMessage: (message: Message) => {
    if (typeof window === 'undefined') return;
    const messages = storage.getMessages();
    messages.push(message);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  },
  
  getDevices: (): Device[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DEVICES);
    return data ? JSON.parse(data) : [];
  },
  
  updateDevices: (devices: Device[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  },
};
