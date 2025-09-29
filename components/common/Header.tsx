
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogoutIcon } from '../icons/Icons';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {user && (
          <div className="flex items-center space-x-4">
              <div>
                  <div className="font-semibold text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.role}</div>
              </div>
              <button onClick={logout} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Logout">
                  <LogoutIcon className="h-6 w-6" />
              </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;