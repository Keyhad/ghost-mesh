import React from 'react';
import { CardHeader } from './CardHeader';

interface SOSLog {
  id: string;
  timestamp: number;
  direction: 'sent' | 'receive';
  fromNumber?: string;
  gpsLocation: string;
  sentTimestamp: string;
  messageId?: string;
  payload?: string;
}

interface SOSLogCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  logs: SOSLog[];
}

export const SOSLogCard = ({
  isExpanded,
  onToggle,
  logs,
}: SOSLogCardProps) => {
  return (
    <div className="card-container bg-red-50/80 dark:bg-red-950/20 shadow-red-500/5">
      <CardHeader
        icon="sos"
        title="SOS Emergency Log"
        subtitle={`${logs.length} emergency broadcasts sent`}
        gradientFrom="from-red-500"
        gradientTo="to-orange-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          <div className="card-section">
            <h3 className="section-heading mb-3">Emergency Broadcasts</h3>
            {logs.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded icon-2xl text-gray-300 dark:text-gray-700 leading-none">
                  verified_user
                </span>
                <p className="text-caption">No emergency broadcasts sent</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.slice().reverse().map((log, index) => {
                  const date = new Date(log.timestamp);
                  const yy = String(date.getFullYear()).slice(-2);
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  const hh = String(date.getHours()).padStart(2, '0');
                  const min = String(date.getMinutes()).padStart(2, '0');
                  const dateTime = `${yy}-${mm}-${dd}, ${hh}:${min}`;

                  const direction = log.direction === 'sent' ? 'Transmit' : 'Receive';
                  const from = log.fromNumber ? log.fromNumber : '';
                  const geotag = log.gpsLocation || '';
                  const timestamp = log.sentTimestamp || '';

                  // Parse coordinates for map link
                  const coordMatch = geotag.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
                  const hasValidCoords = coordMatch && parseFloat(coordMatch[1]) !== 0 && parseFloat(coordMatch[2]) !== 0;
                  const mapUrl = hasValidCoords
                    ? `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`
                    : null;

                  const isLatest = index === 0;

                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                      <p className={`text-sm ${isLatest ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-gray-100`}>
                        {dateTime} ... {direction} ... {from && `${from} ... `}
                        {mapUrl ? (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {geotag}
                          </a>
                        ) : (
                          geotag
                        )}
                        {timestamp && ` ... ${timestamp}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
