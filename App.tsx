
import React, { useState, useCallback, useMemo } from 'react';
import type { View, Role } from './types';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Dashboard from './components/dashboard/Dashboard';
import StudentManagement from './components/students/StudentManagement';
import AttendanceTaker from './components/attendance/AttendanceTaker';
import AttendanceReport from './components/reports/AttendanceReport';
import Login from './components/auth/Login';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');

  const handleNavigate = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const permittedViews: Record<Role, View[]> = useMemo(() => ({
    'Admin': ['dashboard', 'students', 'attendance', 'reports'],
    'Teacher': ['dashboard', 'students', 'attendance', 'reports'],
    'Student': ['dashboard', 'reports'],
  }), []);

  // Effect to reset view if current view is not permitted for the user's role
  React.useEffect(() => {
    if (user && !permittedViews[user.role].includes(view)) {
      setView('dashboard'); // Default to dashboard if current view is not allowed
    }
  }, [user, view, permittedViews]);
  
  const renderView = () => {
    if (!user || !permittedViews[user.role].includes(view)) {
        return <Dashboard />; // Or an access denied component
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'attendance':
        return <AttendanceTaker />;
      case 'reports':
        return <AttendanceReport />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
     switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'students':
        return 'Student Management';
      case 'attendance':
        return 'Take Attendance';
      case 'reports':
        return 'Attendance Reports';
      default:
        return 'Dashboard';
    }
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar currentView={view} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;