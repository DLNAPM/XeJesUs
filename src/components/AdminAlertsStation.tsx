import { useState, useEffect } from 'react';
import { 
  getDbService, 
  getAuthService, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp 
} from '../lib/firebase';
import { SystemAlert, AlertCategory, AlertSeverity, AlertStatus } from '../types';
import { 
  ADMIN_ALERT_EMAIL, 
  acknowledgeAlert, 
  resolveAlert, 
  deleteAlert, 
  simulateAlert,
  getGmailComposeUrl,
  getMailtoUrl,
  formatAlertEmailBody 
} from '../services/incidentService';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  ShieldAlert, 
  RefreshCw, 
  Server, 
  CreditCard, 
  Key, 
  Radio, 
  CheckCheck,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminAlertsStation() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const auth = getAuthService();
  const db = getDbService();

  // Listen to Firestore `system_alerts` in real-time
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'system_alerts'), 
        orderBy('createdAt', 'desc'), 
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedAlerts: SystemAlert[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as SystemAlert));

        setAlerts(loadedAlerts);
        setLoading(false);
      }, (error) => {
        console.error("Failed to subscribe to system alerts:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up alert listener:", err);
      setLoading(false);
    }
  }, [db]);

  // Listen for browser custom event for instant local preview
  useEffect(() => {
    const handleCustomAlert = (event: any) => {
      const newAlert = event.detail as SystemAlert;
      if (newAlert) {
        setAlerts(prev => {
          if (newAlert.id && prev.some(a => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });
      }
    };

    window.addEventListener('sanctuary_incident_alert', handleCustomAlert);
    return () => window.removeEventListener('sanctuary_incident_alert', handleCustomAlert);
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    const adminEmail = auth?.currentUser?.email || ADMIN_ALERT_EMAIL;
    setActionInProgress(alertId);
    try {
      await acknowledgeAlert(alertId, adminEmail);
      // Optimistic update
      setAlerts(prev => prev.map(a => a.id === alertId ? {
        ...a,
        status: 'acknowledged',
        acknowledgedBy: adminEmail,
        acknowledgedAt: new Date()
      } : a));
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      alert("Failed to acknowledge alert in database.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    const adminEmail = auth?.currentUser?.email || ADMIN_ALERT_EMAIL;
    setActionInProgress(alertId);
    try {
      await resolveAlert(alertId, adminEmail);
      setAlerts(prev => prev.map(a => a.id === alertId ? {
        ...a,
        status: 'resolved',
        resolvedBy: adminEmail,
        resolvedAt: new Date()
      } : a));
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      alert("Failed to resolve alert in database.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Are you sure you wish to delete this incident record permanently?")) return;
    setActionInProgress(alertId);
    try {
      await deleteAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error("Failed to delete alert:", err);
      alert("Failed to delete alert from database.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCopyReport = (alert: SystemAlert) => {
    const formatted = formatAlertEmailBody({
      title: alert.title,
      category: alert.category,
      severity: alert.severity,
      message: alert.message,
      service: alert.service,
      endpoint: alert.endpoint,
      details: alert.details,
      userEmail: alert.userEmail,
      timestamp: alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleString() : new Date().toLocaleString()
    });

    navigator.clipboard.writeText(formatted);
    if (alert.id) {
      setCopiedAlertId(alert.id);
      setTimeout(() => setCopiedAlertId(null), 2500);
    }
  };

  const triggerSimulation = async (type: 'billing_429' | 'api_restriction_403' | 'network_outage_500' | 'firestore_permission') => {
    setSimulating(type);
    try {
      await simulateAlert(type);
      setShowSimulateMenu(false);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(null);
    }
  };

  // Metrics
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const billingCount = alerts.filter(a => a.category === 'billing').length;
  const restrictionCount = alerts.filter(a => a.category === 'api_restriction').length;

  // Filtered List
  const filteredAlerts = alerts.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchMsg = (a.message || '').toLowerCase().includes(q);
      const matchService = (a.service || '').toLowerCase().includes(q);
      const matchUser = (a.userEmail || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchService && !matchUser) return false;
    }
    return true;
  });

  const formatTimestamp = (ts: any): string => {
    if (!ts) return 'Just now';
    try {
      if (ts.toDate && typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString();
      }
      if (ts.seconds !== undefined) {
        return new Date(ts.seconds * 1000).toLocaleString();
      }
      return new Date(ts).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-8" id="admin-alerts-monitoring-station">
      {/* Top Incident Status Banner */}
      <div 
        id="incident-summary-banner"
        className={`p-6 rounded-[2rem] border transition-all duration-300 shadow-sm ${
          activeCount > 0 
            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              activeCount > 0 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-emerald-500/20 text-emerald-500'
            }`}>
              {activeCount > 0 ? <AlertOctagon className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  {activeCount > 0 ? `${activeCount} Operational Incident(s) Require Attention` : 'All Application Systems Operational'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeCount > 0 ? 'bg-red-500 text-white animate-bounce' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {activeCount > 0 ? 'ALARM ACTIVE' : 'HEALTHY'}
                </span>
              </div>
              <p className="text-xs opacity-80 mt-1">
                {activeCount > 0 
                  ? `Automated diagnostic alarm dispatches sent to primary admin ${ADMIN_ALERT_EMAIL}. Please acknowledge below.`
                  : `Real-time listener active. Automatic alarm logs and email dispatches will trigger if API restrictions or billing limits occur.`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Simulation Menu */}
            <div className="relative">
              <button
                id="btn-simulate-alerts"
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                className="px-4 py-2 bg-ui-card hover:bg-ui-sidebar border border-ui-border rounded-xl text-xs font-bold text-text-primary flex items-center gap-2 shadow-sm transition-all"
              >
                <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span>Simulate Alert Test</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <AnimatePresence>
                {showSimulateMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-ui-card border border-ui-border rounded-2xl shadow-2xl p-2 z-50 text-left font-sans"
                  >
                    <div className="px-3 py-2 border-b border-ui-border/50 text-[10px] font-black uppercase text-accent tracking-wider">
                      Trigger Test Incidents
                    </div>
                    <button
                      onClick={() => triggerSimulation('billing_429')}
                      disabled={!!simulating}
                      className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Billing / Quota 429 Error</p>
                        <p className="text-[10px] text-text-secondary">Simulate API quota exhaustion</p>
                      </div>
                    </button>
                    <button
                      onClick={() => triggerSimulation('api_restriction_403')}
                      disabled={!!simulating}
                      className="w-full text-left px-3 py-2.5 hover:bg-amber-500/10 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <Key className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold">API Restriction 403 Error</p>
                        <p className="text-[10px] text-text-secondary">Simulate key or IP restriction block</p>
                      </div>
                    </button>
                    <button
                      onClick={() => triggerSimulation('network_outage_500')}
                      disabled={!!simulating}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-500/10 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <Server className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Service Outage 503</p>
                        <p className="text-[10px] text-text-secondary">Simulate speech synthesizer disruption</p>
                      </div>
                    </button>
                    <button
                      onClick={() => triggerSimulation('firestore_permission')}
                      disabled={!!simulating}
                      className="w-full text-left px-3 py-2.5 hover:bg-purple-500/10 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2.5 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Firestore Rule Denied</p>
                        <p className="text-[10px] text-text-secondary">Simulate database write rejection</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="incident-metric-cards">
        <div className="bg-ui-card rounded-[1.8rem] border border-ui-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Active Alarms</span>
            <Flame className={`w-5 h-5 ${activeCount > 0 ? 'text-red-500 animate-pulse' : 'text-text-secondary opacity-40'}`} />
          </div>
          <div className="mt-4">
            <p className={`text-3xl font-serif font-bold ${activeCount > 0 ? 'text-red-500' : 'text-text-primary'}`}>
              {activeCount}
            </p>
            <p className="text-[10px] text-text-secondary mt-1">Pending admin acknowledgment</p>
          </div>
        </div>

        <div className="bg-ui-card rounded-[1.8rem] border border-ui-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Acknowledged</span>
            <CheckCheck className="w-5 h-5 text-blue-500 opacity-60" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-serif font-bold text-text-primary">
              {acknowledgedCount}
            </p>
            <p className="text-[10px] text-text-secondary mt-1">Reviewed by Sanctuary Admin</p>
          </div>
        </div>

        <div className="bg-ui-card rounded-[1.8rem] border border-ui-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Billing / Quotas</span>
            <CreditCard className="w-5 h-5 text-amber-500 opacity-60" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-serif font-bold text-text-primary">
              {billingCount}
            </p>
            <p className="text-[10px] text-text-secondary mt-1">Rate limits & 429 responses</p>
          </div>
        </div>

        <div className="bg-ui-card rounded-[1.8rem] border border-ui-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Admin Recipient</span>
            <Mail className="w-5 h-5 text-accent opacity-60" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-accent truncate" title={ADMIN_ALERT_EMAIL}>
              {ADMIN_ALERT_EMAIL}
            </p>
            <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              Direct Alert Channel Active
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-ui-card rounded-[1.8rem] border border-ui-border p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filterStatus === status 
                  ? 'bg-accent text-bg-primary shadow-sm' 
                  : 'bg-bg-primary/50 text-text-secondary hover:text-text-primary border border-ui-border/50'
              }`}
            >
              {status === 'all' ? `All Alerts (${alerts.length})` : 
               status === 'active' ? `Active (${activeCount})` : 
               status === 'acknowledged' ? `Acknowledged (${acknowledgedCount})` : 
               `Resolved (${resolvedCount})`}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-bg-primary/50 border border-ui-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Categories</option>
            <option value="billing">Billing / Quota (429)</option>
            <option value="api_restriction">API Restriction (403)</option>
            <option value="rate_limit">Rate Limit Throttling</option>
            <option value="service_outage">Service Outage (503)</option>
            <option value="permission_denied">Firestore Permissions</option>
            <option value="other">Other Issues</option>
          </select>

          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/50" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-primary/50 border border-ui-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Incidents List Container */}
      <div className="bg-ui-card rounded-[2rem] border border-ui-border shadow-xl overflow-hidden" id="incident-records-list">
        <div className="p-6 border-b border-ui-border flex items-center justify-between bg-ui-sidebar/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em]">
                Incident Log & Alarm Feed
              </h3>
              <p className="text-[11px] text-text-secondary">
                Displaying {filteredAlerts.length} record(s) matching filter
              </p>
            </div>
          </div>
          
          <div className="text-[10px] text-text-secondary flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block"></span>
            Live Stream
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-accent mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Connecting to Incident Stream...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-16 text-center text-text-secondary flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-base font-serif italic text-text-primary mb-1">
              No Operational Incidents Found
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                ? "No incidents matched your current search filters."
                : "The sanctuary is functioning harmoniously. Any API restrictions or quota errors will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ui-border">
            {filteredAlerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const isCopied = copiedAlertId === alert.id;
              const isBusy = actionInProgress === alert.id;
              const gmailLink = getGmailComposeUrl(alert);
              const mailtoLink = getMailtoUrl(alert);

              return (
                <div 
                  key={alert.id || Math.random().toString()} 
                  className={`p-6 transition-colors duration-200 ${
                    alert.status === 'active' 
                      ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]' 
                      : 'hover:bg-ui-sidebar/20'
                  }`}
                  id={`alert-card-${alert.id}`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left: Indicator & Main Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Severity Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/20 text-red-500'
                          : alert.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {alert.severity === 'critical' ? (
                          <Flame className="w-5 h-5 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            alert.status === 'active'
                              ? 'bg-red-500 text-white animate-pulse'
                              : alert.status === 'acknowledged'
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-green-500/20 text-green-500'
                          }`}>
                            {alert.status === 'active' ? 'Action Required' : alert.status}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            alert.category === 'billing' 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : alert.category === 'api_restriction'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          }`}>
                            {alert.category.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] text-text-secondary flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 opacity-60" />
                            {formatTimestamp(alert.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary truncate">
                          {alert.title}
                        </h4>

                        <p className="text-xs text-text-secondary line-clamp-2 mt-1 font-sans">
                          {alert.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-text-secondary">
                          <span className="font-semibold text-accent/80">
                            Service: <span className="text-text-primary">{alert.service}</span>
                          </span>
                          {alert.endpoint && (
                            <span className="font-semibold text-accent/80">
                              Feature: <span className="text-text-primary font-mono text-[10px]">{alert.endpoint}</span>
                            </span>
                          )}
                          <span className="text-[10px] opacity-70">
                            User: {alert.userEmail || 'Anonymous'}
                          </span>
                        </div>

                        {/* Acknowledgment Stamp */}
                        {alert.status === 'acknowledged' && alert.acknowledgedBy && (
                          <div className="mt-2 text-[10px] text-blue-500 flex items-center gap-1.5 font-bold">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>
                              Acknowledged by {alert.acknowledgedBy} {alert.acknowledgedAt ? `on ${formatTimestamp(alert.acknowledgedAt)}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end flex-shrink-0">
                      {/* Acknowledge Button */}
                      {alert.status === 'active' && alert.id && (
                        <button
                          id={`btn-ack-${alert.id}`}
                          onClick={() => handleAcknowledge(alert.id!)}
                          disabled={isBusy}
                          className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-primary rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBusy ? 'Saving...' : 'Acknowledge Alert'}</span>
                        </button>
                      )}

                      {alert.status === 'acknowledged' && alert.id && (
                        <button
                          onClick={() => handleResolve(alert.id!)}
                          disabled={isBusy}
                          className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-600 dark:text-green-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {/* Open in Gmail Button */}
                      <a
                        href={gmailLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-ui-card hover:bg-ui-sidebar border border-ui-border rounded-xl text-xs font-semibold text-text-primary flex items-center gap-1.5 shadow-sm transition-all"
                        title={`Open pre-filled incident email to ${ADMIN_ALERT_EMAIL} in Gmail`}
                      >
                        <Mail className="w-3.5 h-3.5 text-accent" />
                        <span className="hidden sm:inline">Gmail Admin</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      {/* Copy Incident Report Button */}
                      <button
                        onClick={() => handleCopyReport(alert)}
                        className="p-2 rounded-xl bg-ui-card hover:bg-ui-sidebar border border-ui-border text-text-secondary hover:text-text-primary transition-all shadow-sm"
                        title="Copy full technical email report to clipboard"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {/* Expand / Collapse Details Button */}
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : (alert.id || ''))}
                        className="p-2 rounded-xl bg-ui-card hover:bg-ui-sidebar border border-ui-border text-text-secondary hover:text-text-primary transition-all shadow-sm"
                        title="Toggle full diagnostic payload & stack trace"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Delete Alert Button */}
                      {alert.id && (
                        <button
                          onClick={() => handleDelete(alert.id!)}
                          disabled={isBusy}
                          className="p-2 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-60 hover:opacity-100"
                          title="Delete incident record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email Dispatched Confirmation Notice */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    <span>
                      Alert notification logged and queued for <strong className="text-text-primary">{ADMIN_ALERT_EMAIL}</strong>
                    </span>
                    <a 
                      href={mailtoLink} 
                      className="text-accent underline font-semibold hover:opacity-80 ml-1"
                    >
                      (send via mail app)
                    </a>
                  </div>

                  {/* Expanded Technical Details Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-ui-border/60 overflow-hidden font-mono text-xs"
                      >
                        <div className="bg-bg-primary/80 p-4 rounded-2xl border border-ui-border text-text-secondary space-y-3">
                          <div>
                            <span className="text-[10px] font-black uppercase text-accent tracking-wider block font-sans mb-1">
                              Diagnostic Payload & Context
                            </span>
                            <pre className="whitespace-pre-wrap font-mono text-[11px] text-text-primary bg-bg-primary p-3 rounded-xl border border-ui-border/50 max-h-48 overflow-y-auto">
                              {alert.details || 'No extended stack trace provided.'}
                            </pre>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ui-border/40 font-sans text-[11px]">
                            <span>
                              Incident Identifier: <span className="font-mono text-text-primary">{alert.id || 'N/A'}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyReport(alert)}
                                className="text-accent font-bold hover:underline flex items-center gap-1"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{isCopied ? 'Copied Full Report' : 'Copy Full Diagnostic'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
