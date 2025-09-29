import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../common/Spinner';
import { SchoolIcon } from '../icons/Icons';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
      // The App component will handle the redirect on successful login
    } catch (err) {
      setError('Invalid username or password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="flex items-center space-x-3 mb-8">
            <SchoolIcon className="h-12 w-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">IntelliAttend</h1>
        </div>
        <div className="max-w-sm w-full bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Welcome Back</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="e.g., admin"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="e.g., admin123"
                    />
                </div>
                
                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                        {isLoading ? <Spinner /> : 'Login'}
                    </button>
                </div>
            </form>
             <div className="mt-6 text-xs text-gray-500 text-center">
                <p className="font-bold">Demo Credentials:</p>
                <p>Admin: admin / admin123</p>
                <p>Teacher: teacher / teacher123</p>
                <p>Student: student / student123</p>
            </div>
        </div>
        <footer className="mt-8 text-center text-gray-500 text-sm">
            © 2024 IntelliAttend - For Demonstration Purposes
        </footer>
    </div>
  );
};

export default Login;