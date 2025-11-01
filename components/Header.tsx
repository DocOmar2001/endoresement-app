import React from 'react';
import { StethoscopeIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-blue-600 dark:text-blue-400">
            <StethoscopeIcon />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          MedEndorse AI
        </h1>
      </div>
    </header>
  );
};

export default Header;
