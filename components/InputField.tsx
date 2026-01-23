interface InputFieldProps {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email';
  colorScheme?: 'amber' | 'emerald' | 'blue' | 'purple' | 'gray';
}

const colorClasses = {
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-zinc-800',
    icon: 'text-gray-600 dark:text-gray-400',
  },
};

export const InputField = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  colorScheme = 'gray',
}: InputFieldProps) => {
  const colors = colorClasses[colorScheme];

  return (
    <div className="field-box">
      <span className={`material-symbols-rounded text-3xl leading-none ${colors.icon}`}>
        {icon}
      </span>
      <p className="label-text">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-value placeholder:text-gray-400 text-center"
      />
    </div>
  );
};
