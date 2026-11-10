import { useState, useEffect } from 'react';
import { 
  subscribeToAppVersion, 
  updateAppVersionConfig, 
  DEFAULT_APP_VERSION_INFO,
  checkAppVersion
} from '../services/versionService';
import { AppVersionInfo, AppVersionStatus } from '../types';
import { CURRENT_APP_VERSION, CANONICAL_RENDER_URL } from '../config/version';
import { getAuthService } from '../lib/firebase';
import { 
  Sparkles, 
  ArrowUpCircle, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Radio, 
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  ShieldAlert,
  Info
} from 'lucide-react';

export default function AdminVersionStation() {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>(DEFAULT_APP_VERSION_INFO);
  const [versionStatus, setVersionStatus] = useState<AppVersionStatus | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const auth = getAuthService();
  const currentAdminEmail = auth?.currentUser?.email || 'admin@xejesus.app';

  useEffect(() => {
    const unsub = subscribeToAppVersion((live) => {
      setVersionInfo(live);
    });
    return () => unsub();
  }, []);

  const handleRunCheck = async () => {
    setChecking(true);
    try {
      const status = await checkAppVersion(CURRENT_APP_VERSION);
      setVersionStatus(status);
    } catch (e: any) {
      console.warn("Manual version check failed:", e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    handleRunCheck();
  }, []);

  const handleAddNote = () => {
    if (!customNote.trim()) return;
    const currentNotes = versionInfo.releaseNotes || [];
    setVersionInfo(prev => ({
      ...prev,
      releaseNotes: [...currentNotes, customNote.trim()]
    }));
    setCustomNote('');
  };

  const handleRemoveNote = (index: number) => {
    const currentNotes = versionInfo.releaseNotes || [];
    setVersionInfo(prev => ({
      ...prev,
      releaseNotes: currentNotes.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveBroadcast = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateAppVersionConfig(versionInfo, currentAdminEmail);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      handleRunCheck();
    } catch (err: any) {
      console.error("Failed to broadcast new version:", err);
      setSaveError(err.message || "Failed to update version configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-accent/15 via-ui-card to-ui-card border-2 border-accent/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent text-bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
            <ArrowUpCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-accent text-bg-primary text-[10px] font-sans font-black uppercase tracking-wider">
                Release & Upgrade Management
              </span>
              <span className="text-xs font-mono font-bold text-accent">
                Current Client Build: {CURRENT_APP_VERSION}
              </span>
            </div>
            <h2 className="text-2xl font-serif text-text-primary italic font-bold">
              Target Code Version: {versionInfo.version}
            </h2>
            <p className="text-sm font-serif italic text-text-secondary mt-1">
              Pilgrims logging into <span className="font-mono text-accent font-bold">{CANONICAL_RENDER_URL}</span> running an older version will receive a prompt comparing their current code with the new release, with an option to Upgrade Now or Later.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunCheck}
          disabled={checking}
          className="px-5 py-3 bg-ui-sidebar hover:bg-accent/10 border border-ui-border text-text-primary rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-accent ${checking ? 'animate-spin' : ''}`} />
          <span>Test Version Check</span>
        </button>
      </div>

      {/* Diagnostics / Status Card */}
      {versionStatus && (
        <div className="p-6 rounded-3xl bg-ui-card border border-ui-border space-y-4">
          <div className="flex items-center justify-between border-b border-ui-border pb-3">
            <h3 className="text-xs font-sans font-black uppercase tracking-widest text-accent flex items-center gap-2">
              <Radio className="w-4 h-4 text-accent animate-pulse" />
              Live Pilgrim Upgrade Detector Status
            </h3>
            <span className="text-[10px] font-mono text-text-secondary">
              Checked {new Date(versionStatus.lastCheckedAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-ui-sidebar rounded-2xl border border-ui-border">
              <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Detected Client Code</p>
              <p className="text-xl font-mono font-bold text-text-primary">{versionStatus.currentVersion}</p>
            </div>
            <div className="p-4 bg-ui-sidebar rounded-2xl border border-ui-border">
              <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Target Released Code</p>
              <p className="text-xl font-mono font-bold text-accent">{versionStatus.latestVersion}</p>
            </div>
            <div className="p-4 bg-ui-sidebar rounded-2xl border border-ui-border flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Upgrade Prompt Trigger</p>
                <p className={`text-base font-bold font-sans ${versionStatus.needsUpgrade ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {versionStatus.needsUpgrade ? 'Active (Pop-up will show)' : 'Current (No pop-up)'}
                </p>
              </div>
              {versionStatus.needsUpgrade ? (
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Configuration Form */}
      <div className="p-8 rounded-[2.5rem] bg-ui-card border border-ui-border space-y-6">
        <div className="flex items-center justify-between border-b border-ui-border pb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-text-primary italic">Publish New Code Version</h3>
            <p className="text-xs text-text-secondary font-serif italic">Broadcast the new version number and release notes to all pilgrim clients.</p>
          </div>
          {saveSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Published to Sanctuary Cloud
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-500 text-xs font-medium">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">
              New Code Version (e.g. v2.7.0, v2.8.0)
            </label>
            <input
              type="text"
              value={versionInfo.version}
              onChange={(e) => setVersionInfo({ ...versionInfo, version: e.target.value })}
              className="w-full bg-ui-sidebar border border-ui-border rounded-xl px-4 py-3 text-sm font-mono font-bold text-text-primary focus:outline-none focus:border-accent"
              placeholder="v2.7.0"
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">
              Release Date Label
            </label>
            <input
              type="text"
              value={versionInfo.releaseDate || ''}
              onChange={(e) => setVersionInfo({ ...versionInfo, releaseDate: e.target.value })}
              className="w-full bg-ui-sidebar border border-ui-border rounded-xl px-4 py-3 text-sm font-sans text-text-primary focus:outline-none focus:border-accent"
              placeholder="April 2026"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">
              Release Title / Theme
            </label>
            <input
              type="text"
              value={versionInfo.releaseTitle || ''}
              onChange={(e) => setVersionInfo({ ...versionInfo, releaseTitle: e.target.value })}
              className="w-full bg-ui-sidebar border border-ui-border rounded-xl px-4 py-3 text-sm font-serif italic text-text-primary focus:outline-none focus:border-accent"
              placeholder="The Scholar's Stability & Version Upgrades"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-2">
              Canonical App Source URL
            </label>
            <input
              type="text"
              value={versionInfo.sourceUrl || CANONICAL_RENDER_URL}
              onChange={(e) => setVersionInfo({ ...versionInfo, sourceUrl: e.target.value })}
              className="w-full bg-ui-sidebar border border-ui-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              placeholder="https://xejesus-app.onrender.com"
            />
          </div>
        </div>

        {/* Release Notes Manager */}
        <div className="space-y-3 pt-2">
          <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-accent">
            Release Notes & Key Features
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
              placeholder="Add release note item (e.g. Added real-time voice auditioning)..."
              className="flex-1 bg-ui-sidebar border border-ui-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleAddNote}
              className="px-4 py-2.5 bg-accent hover:opacity-90 text-bg-primary rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {(versionInfo.releaseNotes || []).map((note, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-ui-sidebar rounded-xl border border-ui-border">
                <span className="text-xs font-serif text-text-primary">{note}</span>
                <button
                  onClick={() => handleRemoveNote(idx)}
                  className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                  title="Remove note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save & Broadcast Button */}
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={handleSaveBroadcast}
            disabled={saving}
            className="px-8 py-4 bg-accent hover:opacity-95 text-bg-primary rounded-2xl font-sans font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Broadcasting...' : 'Save & Broadcast New Version'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
