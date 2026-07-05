import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { mockApi } from '../services/mockApi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await mockApi.login(email, password);
      const u = result.user;
      login({ id: u.id, email: u.email, username: u.email, full_name: u.name, role: u.role, is_active: true }, result.access_token);
      navigate('/');
    } catch {
      setError('Invalid credentials. Try the demo accounts below.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setLoading(true);
    try {
      const result = await mockApi.login(e, p);
      const u = result.user;
      login({ id: u.id, email: u.email, username: u.email, full_name: u.name, role: u.role, is_active: true }, result.access_token);
      navigate('/');
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Battery className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EdgeTwin BMS+</h1>
          <p className="text-dark-400 mt-2">AI-Powered Battery Management Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-dark-400 text-sm text-center mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => quickLogin('admin@edgetwin.ai', 'admin123')}
                className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white rounded-lg py-2 px-3 text-sm transition-colors"
              >
                <div className="font-medium">Admin</div>
                <div className="text-dark-400 text-xs">Full Access</div>
              </button>
              <button
                onClick={() => quickLogin('engineer@edgetwin.ai', 'engineer123')}
                className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white rounded-lg py-2 px-3 text-sm transition-colors"
              >
                <div className="font-medium">Engineer</div>
                <div className="text-dark-400 text-xs">Operations</div>
              </button>
              <button
                onClick={() => quickLogin('viewer@edgetwin.ai', 'viewer123')}
                className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white rounded-lg py-2 px-3 text-sm transition-colors"
              >
                <div className="font-medium">Viewer</div>
                <div className="text-dark-400 text-xs">Read Only</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-6">
          EdgeTwin-BMS+ v1.0 — AI-Powered Edge Battery Management
        </p>
      </div>
    </div>
  );
}
