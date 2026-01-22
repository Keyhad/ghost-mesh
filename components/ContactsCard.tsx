import { Contact } from '@/lib/types';

interface ContactsCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  contacts: Contact[];
  newContact: { name: string; phoneNumber: string };
  onNewContactChange: (contact: { name: string; phoneNumber: string }) => void;
  onAddContact: () => void;
  onSelectContact: (phoneNumber: string) => void;
}

export const ContactsCard = ({
  isExpanded,
  onToggle,
  contacts,
  newContact,
  onNewContactChange,
  onAddContact,
  onSelectContact,
}: ContactsCardProps) => {
  return (
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-rounded text-2xl leading-none">contacts</span>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Contacts</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{contacts.length} contacts saved</p>
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
            {/* Add Contact */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Add Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-700 px-3 py-2.5">
                  <span className="material-symbols-rounded text-gray-400 text-lg leading-none">person</span>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => onNewContactChange({ ...newContact, name: e.target.value })}
                    placeholder="Name"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-700 px-3 py-2.5">
                  <span className="material-symbols-rounded text-gray-400 text-lg leading-none">call</span>
                  <input
                    type="tel"
                    value={newContact.phoneNumber}
                    onChange={(e) => onNewContactChange({ ...newContact, phoneNumber: e.target.value })}
                    placeholder="+1234567890"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={onAddContact}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Add Contact
                </button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">All Contacts</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {contacts.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <span className="material-symbols-rounded text-3xl text-gray-300 dark:text-gray-700 leading-none">
                      contacts
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No contacts yet</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => onSelectContact(contact.phoneNumber)}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-700/50 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {contact.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.phoneNumber}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
