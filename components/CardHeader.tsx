interface CardHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  isExpanded: boolean;
  onToggle: () => void;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CardHeader = ({
  icon,
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  isExpanded,
  onToggle,
  iconSize = 'xl',
}: CardHeaderProps) => {
  const sizeClasses = {
    sm: { container: 'w-10 h-10', icon: 'text-xl' },
    md: { container: 'w-12 h-12', icon: 'text-2xl' },
    lg: { container: 'w-14 h-14', icon: 'text-3xl' },
    xl: { container: 'w-16 h-16', icon: 'text-4xl' }
  };
  return (
    <button
      onClick={onToggle}
      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
    >
      <div className={`${sizeClasses[iconSize].container} rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-rounded ${sizeClasses[iconSize].icon} leading-none`}>{icon}</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col justify-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{subtitle}</div>
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
  );
};
