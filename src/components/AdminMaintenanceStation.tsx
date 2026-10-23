import { useState, useEffect } from 'react';
import { 
  subscribeToMaintenance, 
  updateMaintenanceConfig, 
  DEFAULT_MAINTENANCE_CONFIG,
  COMMON_SANCTUARY_SERVICES,
  MAINTENANCE_PRESETS 
} from '../services/maintenanceService';
import { MaintenanceConfig } from '../types';
import { getAuthService } from '../lib/firebase';
import { 
  Power, 
  Wrench, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Eye, 
  RotateCcw, 
  Save, 
  Layers, 
  Radio, 
  ShieldCheck, 
  Plus, 
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminMaintenanceStation() {
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const auth = getAuthService();
  const currentAdminEmail = auth?.currentUser?.email || 'admin@xejesus.app';

  useEffect(() => {
    const unsub = subscribeToMaintenance((liveConfig) => {
      setConfig(liveConfig);
    });
    return () => unsub();
  }, []);

  const handleToggleMode = async (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !config.enabled;
    setSaving(true);
    setSaveError(null);
    try {
      await updateMaintenanceConfig(
        { 
          ...config, 
          enabled: nextState 
        }, 
        currentAdminEmail
      );
      setConfig(prev => ({ ...prev, enabled: nextState }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to toggle maintenance mode:", err);
      setSaveError(err.message || "Failed to update maintenance setting.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateMaintenanceConfig(config, currentAdminEmail);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save maintenance config:", err);
      setSaveError(err.message || "Failed to save maintenance settings.");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof MAINTENANCE_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      ...preset.config,
      enabled: true // Applying a preset naturally activates maintenance mode
    }));
    setIsEditing(true);
  };

  const toggleServiceTag = (service: string) => {
    const current = config.affectedServices || [];
    if (current.includes(service)) {
      setConfig(prev => ({
        ...prev,
        affectedServices: (prev.affectedServices || []).filter(s => s !== service)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        affectedServices: [...(prev.affectedServices || []), service]
      }));
    }
    setIsEditing(true);
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    const trimmed = customTag.trim();
    if (!config.affectedServices?.includes(trimmed)) {
      setConfig(prev => ({
        ...prev,
        affectedServices: [...(prev.affectedServices || []), trimmed]
      }));
      setIsEditing(true);
    }
    setCustomTag('');
  };

  const removeServiceTag = (service: string) => {
    setConfig(prev => ({
      ...prev,
      affectedServices: (prev.affectedServices || []).filter(s => s !== service)
    }));
    setIsEditing(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Control: Master Status & Quick Switch */}
      <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 shadow-xl relative overflow-hidden ${
        config.enabled
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-ui-card border-ui-border'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              config.enabled
                ? 'bg-amber-500 text-bg-primary shadow-amber-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}>
              {config.enabled ? <Wrench className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-sans font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full ${
                  config.enabled 
                    ? 'bg-amber-500 text-bg-primary shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {config.enabled ? '● MAINTENANCE MODE ACTIVE' : '● ALL SYSTEMS OPERATIONAL'}
                </span>

                {config.enabled && (
                  <span className="text-[10px] font-sans text-amber-500/80 font-bold flex items-center gap-1.5">
                    <Radio className="w-3 h-3 animate-ping" />
                    Broadcasting Live on Landing Page
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-serif font-bold text-text-primary mt-2">
                Sanctuary Maintenance & Landing Broadcast
              </h2>
              <p className="text-xs text-text-secondary font-sans mt-0.5 max-w-xl">
                When active, visitors to the Landing Page will see a clear notification explaining what services are down, what is being upgraded, and estimated return times.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-4 self-end lg:self-center shrink-0">
            <button
              onClick={() => handleToggleMode()}
              disabled={saving}
              className={`px-8 py-4 rounded-2xl font-sans font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 ${
                config.enabled
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-bg-primary shadow-amber-500/20'
              }`}
            >
              <Power className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{config.enabled ? 'Turn OFF Maintenance' : 'Turn ON Maintenance'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-sans font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sanctuary maintenance broadcast settings successfully synced to the live Landing Page!</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-sans font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Form on Left, Live Landing Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Presets Section */}
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em]">
                  Quick Fill Presets
                </h3>
              </div>
              <span className="text-[10px] text-text-secondary font-sans italic">One-click standard messages</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAINTENANCE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="p-3.5 rounded-xl bg-ui-sidebar/50 hover:bg-accent/10 border border-ui-border hover:border-accent/40 text-left transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[9px] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 italic">
                    {p.config.message}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Settings Box */}
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-ui-border pb-4">
              <div>
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em]">
                  Announcement Message Configuration
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Craft the exact message displayed to users on the Landing Page.
                </p>
              </div>

              {isEditing && (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-bold tracking-wider uppercase animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>

            {/* Announcement Title */}
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-primary mb-2">
                Announcement Headline / Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, title: e.target.value }));
                  setIsEditing(true);
                }}
                placeholder="e.g., Scheduled Sanctuary Maintenance & AI Upgrades"
                className="w-full bg-bg-primary border border-ui-border rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-accent text-text-primary transition-all"
                maxLength={200}
              />
            </div>

            {/* What's Down or Being Upgraded Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-sans font-bold uppercase tracking-wider text-text-primary">
                  Landing Page Message (What's Down or Being Upgraded)
                </label>
                <span className="text-[10px] text-text-secondary">
                  {config.message.length} / 2,000 characters
                </span>
              </div>
              <textarea
                value={config.message}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, message: e.target.value }));
                  setIsEditing(true);
                }}
                rows={4}
                placeholder="Explain clearly to pilgrims what services are temporarily paused or what is currently being upgraded..."
                className="w-full bg-bg-primary border border-ui-border rounded-xl p-4 text-sm font-sans focus:outline-none focus:border-accent text-text-primary transition-all leading-relaxed"
                maxLength={2000}
              />
              <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Be specific so pilgrims know whether scripture reading, AI exegesis, or audio playback is affected.</span>
              </p>
            </div>

            {/* Severity and Expected Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-primary mb-2">
                  Notice Type / Severity
                </label>
                <select
                  value={config.severity || 'upgrade'}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, severity: e.target.value as any }));
                    setIsEditing(true);
                  }}
                  className="w-full bg-bg-primary border border-ui-border rounded-xl px-4 py-3 text-xs font-sans focus:outline-none focus:border-accent text-text-primary"
                >
                  <option value="upgrade">🚀 Upgrade & Enhancements (Blue)</option>
                  <option value="maintenance">⚠️ Scheduled Maintenance (Amber)</option>
                  <option value="investigation">🔍 System Investigation (Rose)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-primary mb-2">
                  Estimated Completion / Window
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                  <input
                    type="text"
                    value={config.estimatedCompletion || ''}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, estimatedCompletion: e.target.value }));
                      setIsEditing(true);
                    }}
                    placeholder="e.g., 30-45 minutes or 4:00 PM EST"
                    className="w-full bg-bg-primary border border-ui-border rounded-xl pl-10 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-accent text-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Affected Services Tags */}
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-text-primary mb-2">
                Affected Services (Click to Toggle)
              </label>

              {/* Predefined Pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_SANCTUARY_SERVICES.map((srv) => {
                  const isSelected = config.affectedServices?.includes(srv);
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => toggleServiceTag(srv)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-accent text-bg-primary shadow-sm scale-105'
                          : 'bg-ui-sidebar/60 border border-ui-border text-text-secondary hover:text-text-primary hover:border-accent/40'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5 opacity-60" />}
                      <span>{srv}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <form onSubmit={handleAddCustomTag} className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom affected service / component..."
                  className="flex-1 bg-bg-primary border border-ui-border rounded-xl px-4 py-2 text-xs font-sans focus:outline-none focus:border-accent text-text-primary"
                />
                <button
                  type="submit"
                  disabled={!customTag.trim()}
                  className="px-4 py-2 bg-ui-sidebar hover:bg-accent hover:text-bg-primary border border-ui-border rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Selected List */}
              {config.affectedServices && config.affectedServices.length > 0 && (
                <div className="mt-3 p-3 bg-ui-sidebar/30 rounded-xl border border-ui-border">
                  <span className="text-[10px] font-sans font-black uppercase tracking-wider text-text-secondary block mb-2">
                    Active Affected Services in Notice:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {config.affectedServices.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-primary border border-ui-border text-xs text-text-primary font-mono"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeServiceTag(tag)}
                          className="text-text-secondary hover:text-red-500 p-0.5 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-ui-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-text-secondary font-sans flex items-center gap-1.5">
                <span className="font-bold">Updated By:</span> {config.updatedBy || currentAdminEmail}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(DEFAULT_MAINTENANCE_CONFIG);
                    setIsEditing(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-ui-border text-text-secondary hover:text-text-primary text-xs font-sans font-bold uppercase tracking-wider hover:bg-ui-sidebar transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-6 py-2.5 bg-accent hover:opacity-90 text-bg-primary rounded-xl text-xs font-sans font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving...' : 'Save & Broadcast'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Landing Page Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em]">
                  Landing Page Live Preview
                </h3>
              </div>
              <span className={`text-[10px] font-sans font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                config.enabled
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse'
                  : 'bg-ui-sidebar text-text-secondary border border-ui-border'
              }`}>
                {config.enabled ? 'Live to Visitors' : 'Draft Preview (Inactive)'}
              </span>
            </div>

            {/* Mock Landing Container */}
            <div className="bg-bg-primary rounded-[2.5rem] border border-ui-border p-6 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-t from-accent to-accent-soft rounded-full mx-auto mb-2 opacity-80 flex items-center justify-center">
                  <span className="text-xs font-serif font-black italic text-bg-primary">XJ</span>
                </div>
                <h4 className="text-2xl font-serif font-bold text-text-primary tracking-tight">XeJesUs</h4>
                <p className="text-[9px] font-serif italic text-text-secondary uppercase tracking-widest">
                  The Sanctuary of Exegesis & Truth
                </p>
              </div>

              {/* The Actual Banner Preview */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                config.severity === 'investigation'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : config.severity === 'upgrade'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        config.severity === 'investigation' ? 'bg-rose-400' : config.severity === 'upgrade' ? 'bg-blue-400' : 'bg-amber-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        config.severity === 'investigation' ? 'bg-rose-500' : config.severity === 'upgrade' ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></span>
                    </span>
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-text-primary">
                      {config.severity === 'investigation' ? 'Sanctuary Diagnostic' : config.severity === 'upgrade' ? 'Sanctuary Upgrades Underway' : 'Scheduled Maintenance'}
                    </span>
                  </div>

                  {config.estimatedCompletion && (
                    <span className="text-[9px] font-sans font-bold text-text-secondary bg-ui-card/60 px-2 py-0.5 rounded-full border border-ui-border">
                      ⏱ {config.estimatedCompletion}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h5 className="text-base font-serif font-bold text-text-primary mb-2 leading-snug">
                  {config.title || "Sanctuary Maintenance Notice"}
                </h5>

                {/* Custom Message */}
                <p className="text-xs font-sans text-text-primary leading-relaxed mb-4 whitespace-pre-line font-medium">
                  {config.message || "We are currently conducting scheduled upgrades. Check back shortly."}
                </p>

                {/* Affected Services Pills */}
                {config.affectedServices && config.affectedServices.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-ui-border/50">
                    <p className="text-[9px] font-sans font-black uppercase tracking-wider text-text-primary">
                      What's Down / Being Upgraded:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {config.affectedServices.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-ui-card/80 border border-ui-border text-[10px] font-sans font-medium text-text-primary"
                        >
                          • {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mock Buttons underneath */}
              <div className="mt-6 space-y-2 opacity-50 pointer-events-none">
                <div className="w-full py-3 bg-text-primary text-bg-primary rounded-xl text-center text-xs font-bold font-sans">
                  Enter the Sanctuary
                </div>
                <div className="w-full py-3 bg-ui-card border border-ui-border text-text-primary rounded-xl text-center text-xs font-bold font-sans">
                  Test Drive as Guest
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[10px] font-sans text-text-primary font-bold uppercase tracking-widest">
                  Preview mirrors exact pilgrim viewport
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
