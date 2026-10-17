import { useState } from 'react';
import { MaintenanceConfig } from '../types';
import { 
  Wrench, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceNoticeCardProps {
  config: MaintenanceConfig;
  variant?: 'landing' | 'in-app';
  isAdmin?: boolean;
  onOpenAdminMaintenance?: () => void;
}

export default function MaintenanceNoticeCard({
  config,
  variant = 'landing',
  isAdmin = false,
  onOpenAdminMaintenance
}: MaintenanceNoticeCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (!config.enabled) return null;

  const severityColor = () => {
    switch (config.severity) {
      case 'investigation':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          badgeBg: 'bg-rose-500',
          textColor: 'text-rose-500',
          pillBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          dot: 'bg-rose-500',
          dotPing: 'bg-rose-400'
        };
      case 'upgrade':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          badgeBg: 'bg-blue-500',
          textColor: 'text-blue-500',
          pillBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          dot: 'bg-blue-500',
          dotPing: 'bg-blue-400'
        };
      default:
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badgeBg: 'bg-amber-500',
          textColor: 'text-amber-500',
          pillBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
          dotPing: 'bg-amber-400'
        };
    }
  };

  const colors = severityColor();

  // In-app variant (slim top banner)
  if (variant === 'in-app') {
    return (
      <div className={`w-full ${colors.bg} border-b ${colors.border} px-4 py-2.5 transition-all shadow-sm`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dotPing}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`}></span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                {config.title || "Sanctuary Maintenance & Upgrades"}
              </span>
              <span className="opacity-40 hidden sm:inline">•</span>
              <span className="text-text-secondary line-clamp-1 italic text-[11px]">
                {config.message}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {config.estimatedCompletion && (
              <span className="text-[10px] font-sans font-bold text-text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent" />
                <span>ETA: {config.estimatedCompletion}</span>
              </span>
            )}

            {isAdmin && onOpenAdminMaintenance && (
              <button
                onClick={onOpenAdminMaintenance}
                className="px-3 py-1 bg-accent text-bg-primary rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
              >
                <Wrench className="w-3 h-3" />
                <span>Manage Maintenance</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Landing page variant (full prominent card)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full my-6 p-6 md:p-8 rounded-[2rem] border ${colors.border} ${colors.bg} backdrop-blur-md shadow-2xl relative overflow-hidden text-left`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${colors.badgeBg} text-white shadow-md`}>
            {config.severity === 'upgrade' ? <Sparkles className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dotPing}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`}></span>
              </span>
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.25em] text-text-primary">
                {config.severity === 'investigation' 
                  ? 'Sanctuary Diagnostic Alert' 
                  : config.severity === 'upgrade' 
                  ? 'Sanctuary Upgrades Underway' 
                  : 'Sanctuary Scheduled Maintenance'}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-serif font-bold text-text-primary mt-1 leading-snug">
              {config.title || "Sanctuary Maintenance Notice"}
            </h3>
          </div>
        </div>

        {config.estimatedCompletion && (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ui-card/80 border border-ui-border text-text-secondary text-xs font-sans font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>ETA: {config.estimatedCompletion}</span>
          </div>
        )}
      </div>

      {/* Admin Message */}
      <div className="space-y-3">
        <p className="text-sm font-sans text-text-primary/90 leading-relaxed whitespace-pre-line bg-ui-card/40 p-4 rounded-xl border border-ui-border/50">
          {config.message}
        </p>

        {/* Affected Services section */}
        {config.affectedServices && config.affectedServices.length > 0 && (
          <div className="pt-2">
            <p className="text-[10px] font-sans font-black uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>What's Down or Being Upgraded:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {config.affectedServices.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1 rounded-lg bg-ui-card/90 border border-ui-border text-xs font-sans font-medium text-text-primary shadow-xs flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  <span>{service}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-[11px] text-text-secondary font-sans border-t border-ui-border/30 mt-3">
          <span className="italic">
            Sanctuary services are monitored 24/7. Admins and Pilgrim testers may authenticate below.
          </span>
          {config.updatedAt && (
            <span className="text-[10px] opacity-70">
              Live status active
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
