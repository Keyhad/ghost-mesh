import { Contact } from '@/lib/types';
import { CardHeader } from './CardHeader';

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
    <div className="card-container bg-blue-50/80 dark:bg-blue-950/20 shadow-blue-500/5">
      <CardHeader
        icon="contacts"
        title="Contacts"
        subtitle={`${contacts.length} contacts saved`}
        gradientFrom="from-purple-500"
        gradientTo="to-pink-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          <div className="card-grid" style={{gridTemplateColumns: '1fr 2fr'}}>
            {/* Add Contact */}
            <div className="card-section">
              <h3 className="section-heading mb-4">Add Contact</h3>
              <div className="flex-col-gap">
                <div className="input-with-icon">
                  <span className="material-symbols-rounded">person</span>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => onNewContactChange({ ...newContact, name: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div className="input-with-icon">
                  <span className="material-symbols-rounded">call</span>
                  <input
                    type="tel"
                    value={newContact.phoneNumber}
                    onChange={(e) => onNewContactChange({ ...newContact, phoneNumber: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <button
                  onClick={onAddContact}
                  className="btn-gradient-violet"
                >
                  Add Contact
                </button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="card-section">
              <h3 className="section-heading mb-4">All Contacts</h3>

              {/* System Contacts */}
              <div className="mb-4">
                <p className="text-caption mb-2 text-gray-500 dark:text-gray-400">System</p>
                <div className="card-grid card-grid-2">
                  {contacts.filter(c => c.isSpecial).map((contact) => (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => onSelectContact(contact.phoneNumber)}
                      className="contact-item-btn bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200/50 dark:border-orange-800/50"
                    >
                      <div className="flex-row">
                        <div className="contact-avatar bg-gradient-to-br from-orange-500 to-red-600">
                          {contact.name[0]}
                        </div>
                        <div className="contact-info">
                          <p className="contact-name">{contact.name}</p>
                          <p className="contact-phone text-xs">{contact.phoneNumber}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Contacts */}
              <div>
                <p className="text-caption mb-2 text-gray-500 dark:text-gray-400">My Contacts</p>
                <div className="card-grid card-grid-2">
                  {contacts.filter(c => !c.isSpecial).length === 0 ? (
                    <div className="col-span-2 empty-state">
                      <span className="material-symbols-rounded icon-2xl text-gray-300 dark:text-gray-700 leading-none">
                        contacts
                      </span>
                      <p className="text-caption">No contacts yet</p>
                    </div>
                  ) : (
                    contacts.filter(c => !c.isSpecial).map((contact) => (
                      <button
                        key={contact.phoneNumber}
                        onClick={() => onSelectContact(contact.phoneNumber)}
                        className="contact-item-btn"
                      >
                        <div className="flex-row">
                          <div className="contact-avatar">
                            {contact.name[0].toUpperCase()}
                          </div>
                          <div className="contact-info">
                            <p className="contact-name">{contact.name}</p>
                            <p className="contact-phone">{contact.phoneNumber}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
