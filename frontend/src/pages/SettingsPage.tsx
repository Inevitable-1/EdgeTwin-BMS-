import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDemoStore } from '../stores/demoStore';
import {
  Settings,
  User,
  Bell,
  Monitor,
  Globe,
  Shield,
  Database,
  Info,
  Save,
} from 'lucide-react';

type Tab = 'profile' | 'appearance' | 'notifications' | 'demo' | 'system' | 'about';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'demo', label: 'Demo Mode', icon: <Globe className="w-4 h-4" /> },
  { id: 'system', label: 'System', icon: <Database className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && <p className="text-dark-400 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-dark-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { enabled: demoEnabled, toggle: toggleDemo, speed, setSpeed } = useDemoStore();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  const [darkMode, setDarkMode] = useState(true);
  const [themeColor, setThemeColor] = useState('blue');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactMode, setCompactMode] = useState(false);

  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const [saved, setSaved] = useState(false);

  const getInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeColors = [
    { id: 'blue', color: 'bg-blue-500' },
    { id: 'green', color: 'bg-green-500' },
    { id: 'purple', color: 'bg-purple-500' },
    { id: 'red', color: 'bg-red-500' },
    { id: 'yellow', color: 'bg-yellow-500' },
    { id: 'cyan', color: 'bg-cyan-500' },
  ];

  const systemStatuses = [
    { label: 'Backend Status', status: 'running', online: true },
    { label: 'Database (PostgreSQL)', status: 'connected', online: true },
    { label: 'MQTT Broker', status: 'connected', online: true },
    { label: 'Redis Cache', status: 'connected', online: true },
  ];

  const features = [
    'Real-time Battery Telemetry Monitoring',
    'AI-Powered Predictive Analytics',
    'Digital Twin Simulation',
    'Battery Passport (EU Regulation Compliant)',
    'Explainable AI (XAI) for Decision Transparency',
    'Multi-Battery Fleet Management',
    'Edge Computing Integration',
    'RESTful API & MQTT Support',
  ];

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar Tabs */}
      <div className="w-56 flex-shrink-0 bg-dark-900 border border-dark-700 rounded-xl p-2">
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2 text-dark-400">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Settings</span>
          </div>
        </div>
        <nav className="space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-6 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white">Profile Settings</h2>
            <p className="text-dark-400 text-sm">Manage your personal information.</p>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-400">{getInitials()}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.full_name || 'User'}</p>
                <p className="text-dark-400 text-sm">{user?.email || 'user@example.com'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
                <div className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-full text-sm font-medium capitalize">
                  {user?.role || 'viewer'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white">Appearance</h2>
            <p className="text-dark-400 text-sm">Customize the look and feel of the application.</p>

            <Toggle
              enabled={darkMode}
              onChange={setDarkMode}
              label="Dark Mode"
              description="Always enabled in demo mode"
            />

            <div>
              <p className="text-white text-sm font-medium mb-3">Theme Color</p>
              <div className="flex gap-3">
                {themeColors.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setThemeColor(tc.id)}
                    className={`w-8 h-8 rounded-full ${tc.color} ${
                      themeColor === tc.id ? 'ring-2 ring-offset-2 ring-offset-dark-900 ring-white' : ''
                    } transition-all`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-white text-sm font-medium mb-3">Font Size</p>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fontSize === size
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-dark-800 text-dark-300 border border-dark-600 hover:bg-dark-700'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              enabled={compactMode}
              onChange={setCompactMode}
              label="Compact Mode"
              description="Reduce spacing and padding throughout the UI"
            />
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <p className="text-dark-400 text-sm">Configure how you receive alerts and updates.</p>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 divide-y divide-dark-700">
              <Toggle
                enabled={criticalAlerts}
                onChange={setCriticalAlerts}
                label="Critical Alerts"
                description="Immediate notification for critical battery issues"
              />
              <Toggle
                enabled={warningAlerts}
                onChange={setWarningAlerts}
                label="Warning Alerts"
                description="Notifications for potential issues"
              />
              <Toggle
                enabled={dailySummary}
                onChange={setDailySummary}
                label="Daily Summary"
                description="Receive a daily fleet status report"
              />
              <Toggle
                enabled={emailNotifications}
                onChange={setEmailNotifications}
                label="Email Notifications"
                description="Send alerts to your email address"
              />
              <Toggle
                enabled={soundAlerts}
                onChange={setSoundAlerts}
                label="Sound Alerts"
                description="Play a sound for critical notifications"
              />
            </div>
          </div>
        )}

        {/* Demo Mode Tab */}
        {activeTab === 'demo' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white">Demo Mode</h2>
            <p className="text-dark-400 text-sm">Control the simulated data generation.</p>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
              <Toggle
                enabled={demoEnabled}
                onChange={toggleDemo}
                label="Demo Mode"
                description="Generate simulated battery telemetry data in real-time"
              />
            </div>

            <div>
              <p className="text-white text-sm font-medium mb-3">Simulation Speed</p>
              <div className="flex gap-2">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      speed === s
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-dark-800 text-dark-300 border border-dark-600 hover:bg-dark-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
              <p className="text-dark-300 text-sm leading-relaxed">
                Demo mode generates realistic battery telemetry data including voltage, current,
                temperature, state of charge, and state of health. It simulates multiple batteries
                across different conditions to showcase the platform's monitoring, alerting, and AI
                prediction capabilities without requiring physical hardware.
              </p>
            </div>

            <button
              onClick={() => {}}
              className="px-5 py-2.5 bg-dark-800 border border-dark-600 text-dark-300 hover:bg-dark-700 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset Demo Data
            </button>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white">System Status</h2>
            <p className="text-dark-400 text-sm">Overview of backend services and infrastructure.</p>

            <div className="bg-dark-800 border border-dark-700 rounded-xl divide-y divide-dark-700">
              {systemStatuses.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.online ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-white text-sm">{item.label}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      item.online ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-white text-sm">AI Models</span>
                </div>
                <span className="text-green-400 text-sm font-medium">5 / 5 loaded</span>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-white text-sm">Version</span>
                <span className="text-dark-400 text-sm font-mono">v1.0.0</span>
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">EdgeTwin-BMS+</h2>
                <p className="text-dark-400 text-sm">Version 1.0.0</p>
              </div>
            </div>

            <p className="text-dark-300 leading-relaxed">
              AI-Powered Edge Digital Twin &amp; Battery Passport Platform for Electric Vehicles
            </p>

            <div>
              <h3 className="text-white font-semibold mb-3">Key Features</h3>
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-dark-300 text-sm">
                    <span className="text-primary-400 mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Team</h3>
              <p className="text-dark-400 text-sm">
                Developed for the Tata Hackathon 2026 by the EdgeTwin team.
              </p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">Documentation</h3>
              <div className="flex gap-4">
                <a href="#" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                  API Reference
                </a>
                <a href="#" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                  User Guide
                </a>
                <a href="#" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                  Architecture
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
