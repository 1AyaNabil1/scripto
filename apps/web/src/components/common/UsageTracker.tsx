import React from 'react';

interface UsageTrackerProps {
  remainingUsage: number;
  userName: string;
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({ remainingUsage, userName }) => {
  const getUsageColor = (remaining: number) => {
    if (remaining === 0) return 'text-red-600 bg-red-50';
    if (remaining === 1) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getUsageMessage = (remaining: number) => {
    if (remaining === 0) return 'Daily limit reached';
    if (remaining === 1) return '1 story left today';
    return `${remaining} stories left today`;
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUsageColor(remainingUsage)}`}>
      <div className="flex items-center space-x-2">
        <span>Welcome, {userName}!</span>
        <span>•</span>
        <span>{getUsageMessage(remainingUsage)}</span>
      </div>
    </div>
  );
};
