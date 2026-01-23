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
    sm: { container: 'icon-container-sm', icon: 'icon-sm' },
    md: { container: 'icon-container-md', icon: 'icon-md' },
    lg: { container: 'icon-container-lg', icon: 'icon-lg' },
    xl: { container: 'icon-container-xl', icon: 'icon-xl' }
  };
  return (
    <div className="relative w-full">
      <button
        onClick={onToggle}
        className="card-header-btn"
      >
        <div className={`card-header-icon ${sizeClasses[iconSize].container} bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
          <span className={`material-symbols-rounded ${sizeClasses[iconSize].icon} leading-none`}>{icon}</span>
        </div>
        <div className="card-header-text">
          <h2 className="card-header-title">{title}</h2>
          <div className="card-header-subtitle">{subtitle}</div>
        </div>
      </button>

      <span
        className={`material-symbols-rounded expand-arrow expand-arrow-left leading-none ${
          isExpanded ? 'expanded' : ''
        }`}
      >
        expand_more
      </span>

      <span
        className={`material-symbols-rounded expand-arrow expand-arrow-right leading-none ${
          isExpanded ? 'expanded' : ''
        }`}
      >
        expand_more
      </span>
    </div>
  );
};
