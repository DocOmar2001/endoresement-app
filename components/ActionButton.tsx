import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, isActive, onClick, disabled = false }) => {
  const baseClasses = "flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800";
  const activeClasses = "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 scale-105";
  const inactiveClasses = "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200";
  const disabledClasses = "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50";

  const getButtonClasses = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isActive) return `${baseClasses} ${activeClasses}`;
    return `${baseClasses} ${inactiveClasses}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
      aria-pressed={isActive}
      aria-label={label}
    >
      <div className={isActive ? 'text-blue-600 dark:text-blue-400' : ''}>
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-semibold">{label}</span>
    </button>
  );
};

export default ActionButton;
