import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const { user } = useAuthStore();
  const [commanderName, setCommanderName] = useState(user?.commander_name || '');
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // In a real app, this would call the API
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateToken = () => {
    // Generate a random token (in real app, this would come from the backend)
    const token = btoa(`${user?.id}:${Date.now()}:${Math.random().toString(36).substring(7)}`);
    setApiToken(token);
    setShowToken(true);
  };

  const copyTokenToClipboard = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken);
      setMessage({ type: 'success', text: 'Token copied to clipboard!' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-eurostile text-elite-orange">Settings</h1>

      {message && (
        <div
          className={`p-4 rounded ${
            message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Profile</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-elite-muted mb-2">Email</label>
            <input
              type="email"
              className="input w-full max-w-md bg-elite-dark/50"
              value={user?.email || ''}
              readOnly
            />
          </div>
          <div>
            <label className="block text-elite-muted mb-2">Commander Name</label>
            <input
              type="text"
              className="input w-full max-w-md"
              placeholder="Enter your commander name..."
              value={commanderName}
              onChange={(e) => setCommanderName(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">API Token</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-elite-muted">
            Generate an API token to connect the desktop agent. This token allows the agent to sync
            your Elite Dangerous journal files with this web app.
          </p>

          {!apiToken ? (
            <button className="btn btn-secondary" onClick={handleGenerateToken}>
              Generate API Token
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  className="input flex-1 max-w-md font-mono text-sm"
                  value={apiToken}
                  readOnly
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
                <button className="btn btn-primary" onClick={copyTokenToClipboard}>
                  Copy
                </button>
              </div>
              <p className="text-elite-muted text-sm">
                Copy this token and paste it into the desktop agent settings.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Journal Sync</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-elite-muted">
            Download the desktop agent to automatically sync your Elite Dangerous journal files.
            The agent watches your journal directory and sends events to this app in real-time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="panel p-4">
              <div className="font-medium text-elite-orange mb-2">Windows</div>
              <code className="text-elite-muted text-sm">
                %USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous
              </code>
            </div>
          </div>
          <button className="btn btn-secondary">Download Desktop Agent</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Integrations</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">EDSM</div>
              <div className="text-elite-muted text-sm">Sync flight logs with EDSM</div>
            </div>
            <button className="btn btn-secondary">Connect</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Inara</div>
              <div className="text-elite-muted text-sm">Sync commander data with Inara</div>
            </div>
            <button className="btn btn-secondary">Connect</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Theme</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <button className="btn btn-primary">Dark</button>
            <button className="btn btn-secondary">Light</button>
          </div>
        </div>
      </div>
    </div>
  );
}