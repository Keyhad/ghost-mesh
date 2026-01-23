interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorScheme: 'emerald' | 'blue' | 'purple' | 'violet' | 'red';
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
  },
};

export const StatCard = ({ label, value, icon, colorScheme }: StatCardProps) => {
  const colors = colorClasses[colorScheme];

  return (
    <div className="field-box">
      <span className={`material-symbols-rounded text-3xl leading-none ${colors.text}`}>
        {icon}
      </span>
      <p className="label-text">{label}</p>
      <p className="text-value">{value}</p>
    </div>
  );
};
