import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, Eye, EyeOff, Zap, Shield, Users, Wrench, Eye as GuestEye } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { mockApi } from '../services/mockApi';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@edgetwin.ai', password: 'admin123', desc: 'Full Access', icon: Shield, color: 'from-red-600/20 to-red-600/5 border-red-500/30' },
  { label: 'Fleet Manager', email: 'fleetmanager@edgetwin.ai', password: 'fleet123', desc: 'Fleet Operations', icon: Users, color: 'from-blue-600/20 to-blue-600/5 border-blue-500/30' },
  { label: 'Maintenance', email: 'maintenance@edgetwin.ai', password: 'maint123', desc: 'Technical', icon: Wrench, color: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30' },
  { label: 'Guest', email: 'guest@edgetwin.ai', password: 'guest123', desc: 'Read Only', icon: GuestEye, color: 'from-green-600/20 to-green-600/5 border-green-500/30' },
];

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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 via-transparent to-primary-900/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Battery className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">EdgeTwin BMS+</h1>
          <p className="text-dark-400 mt-2">AI-Powered Battery Management Platform</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Demo Mode Active</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-dark-900/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded bg-dark-800 border-dark-600 text-primary-500 focus:ring-primary-500" />
                <span className="text-dark-400 text-sm">Remember me</span>
              </label>
              <a href="#" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">Forgot password?</a>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm animate-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Access */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-dark-400 text-sm text-center mb-4 font-medium">Demo Access — Click to enter</p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => quickLogin(acc.email, acc.password)}
                  className={`bg-gradient-to-br ${acc.color} bg-dark-800 hover:bg-dark-700 border text-white rounded-xl py-3 px-3 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <acc.icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-dark-400 text-xs">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-6">
          EdgeTwin-BMS+ v2.0 — AI-Powered Edge Battery Intelligence Platform
        </p>
      </div>
    </div>
  );
}
