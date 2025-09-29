
import React, { useMemo } from 'react';
import type { View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, UsersIcon, CameraIcon, ChartBarIcon, SchoolIcon } from '../icons/Icons';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['Admin', 'Teacher', 'Student'] },
    { id: 'students', label: 'Students', icon: UsersIcon, roles: ['Admin', 'Teacher'] },
    { id: 'attendance', label: 'Take Attendance', icon: CameraIcon, roles: ['Admin', 'Teacher'] },
    { id: 'reports', label: 'Reports', icon: ChartBarIcon, roles: ['Admin', 'Teacher', 'Student'] },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();

  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center space-x-2">
            <SchoolIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-800">IntelliAttend</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id as View);
                }}
                className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200
                  ${
                    currentView === item.id
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
       <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">© 2024 IntelliAttend</p>
      </div>
    </aside>
  );
};

export default Sidebar;