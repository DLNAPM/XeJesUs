import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppVersionStatus } from '../types';
import { 
  Sparkles, 
  ArrowUpCircle, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  ShieldAlert, 
  X, 
  RefreshCw,
  Layers,
  Zap
} from 'lucide-react';

interface VersionUpgradeModalProps {
  versionStatus: AppVersionStatus | null;
  isOpen: boolean;
  onUpgradeNow: () => void;
  onUpgradeLater: () => void;
  isUpgrading?: boolean;
}

export default function VersionUpgradeModal({
  versionStatus,
  isOpen,
  onUpgradeNow,
  onUpgradeLater,
  isUpgrading = false
}: VersionUpgradeModalProps) {
  const [showNotes, setShowNotes] = useState(true);

  if (!isOpen || !versionStatus || !versionStatus.needsUpgrade) {
    return null;
  }

  const {
    currentVersion,
    latestVersion,
    releaseTitle,
    releaseNotes,
    releaseDate,
    mandatory
  } = versionStatus;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={mandatory ? undefined : onUpgradeLater}
        className="absolute inset-0 bg-bg-primary/90 backdrop-blur-xl"
      />

      {/* Modal Dialog Card - Compact & Mobile Sized */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.12 }}
        className="relative bg-ui-card w-full max-w-md max-h-[85vh] sm:max-h-[90vh] rounded-3xl sm:rounded-[2rem] border-2 border-accent/40 shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent via-amber-400 to-accent animate-gradient shrink-0" />

        {/* Modal Header - Fixed Top */}
        <div className="shrink-0 p-3.5 sm:p-5 pb-2.5 sm:pb-3 border-b border-ui-border/40 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 shadow-inner shrink-0">
              <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-accent text-bg-primary text-[9px] sm:text-[10px] font-sans font-black uppercase tracking-wider">
                  {mandatory ? 'Mandatory Upgrade' : 'App Upgrade Available'}
                </span>
                {releaseDate && (
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-text-secondary opacity-75">
                    {releaseDate}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-text-primary italic mt-0.5 leading-snug">
                Sanctuary Code Upgrade
              </h3>
            </div>
          </div>

          {!mandatory && (
            <button 
              onClick={onUpgradeLater}
              className="w-8 h-8 rounded-full bg-ui-sidebar hover:bg-accent/10 flex items-center justify-center text-text-secondary hover:text-accent transition-all cursor-pointer shrink-0"
              title="Remind me later"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          {/* Version Comparison Badge Card */}
          <div className="grid grid-cols-2 gap-2 p-2.5 sm:p-3 bg-ui-sidebar/80 rounded-xl sm:rounded-2xl border border-ui-border text-center">
            <div className="p-2 sm:p-2.5 bg-ui-card/60 rounded-lg sm:rounded-xl border border-ui-border/60">
              <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-text-secondary mb-1">
                Your Version
              </p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-500/10 border border-stone-500/20 text-text-primary font-mono font-bold text-xs">
                <span>{currentVersion}</span>
              </div>
              <p className="text-[9px] text-amber-500 font-serif italic mt-0.5">Outdated Code</p>
            </div>

            <div className="p-2 sm:p-2.5 bg-accent/10 rounded-lg sm:rounded-xl border border-accent/30">
              <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-accent mb-1">
                New Version
              </p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-bg-primary font-mono font-black text-xs shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>{latestVersion}</span>
              </div>
              <p className="text-[9px] text-accent font-serif italic mt-0.5 font-semibold">Latest Release</p>
            </div>
          </div>

          {/* Explanation message */}
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-serif italic text-text-primary leading-snug">
              A newer, more capable version of the <span className="font-bold text-accent not-italic">XeJesUs Sanctuary</span> code is available on <span className="font-mono text-[11px] font-bold text-accent">xejesus-app.onrender.com</span>. Upgrading updates models, voice sync, and exegesis scrolls.
            </p>
            {releaseTitle && (
              <p className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 pt-0.5">
                <Zap className="w-3 h-3 text-accent shrink-0" />
                <span className="truncate">New: {releaseTitle}</span>
              </p>
            )}
          </div>

          {/* Release Notes */}
          {releaseNotes && releaseNotes.length > 0 && (
            <div className="bg-ui-sidebar/50 border border-ui-border/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 max-h-32 sm:max-h-36 overflow-y-auto space-y-1.5 text-left">
              <div className="flex items-center justify-between pb-1.5 border-b border-ui-border/40">
                <span className="text-[9px] font-sans font-black uppercase tracking-wider text-text-secondary flex items-center gap-1">
                  <Layers className="w-3 h-3 text-accent" />
                  Key Upgrades
                </span>
                <span className="text-[9px] font-mono text-accent font-bold">{releaseNotes.length} updates</span>
              </div>
              <ul className="space-y-1.5 pt-0.5">
                {releaseNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] sm:text-xs font-serif text-text-primary leading-tight">
                    <CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Action Footer - Always visible and accessible on mobile */}
        <div className="shrink-0 p-3 sm:p-4 bg-ui-card border-t border-ui-border/60 space-y-2">
          <button
            onClick={onUpgradeNow}
            disabled={isUpgrading}
            className="w-full py-3 sm:py-3.5 px-4 bg-accent hover:opacity-95 text-bg-primary rounded-xl sm:rounded-2xl font-sans font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isUpgrading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Upgrading to {latestVersion}...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Upgrade Now to {latestVersion}</span>
              </>
            )}
          </button>

          {!mandatory && (
            <button
              onClick={onUpgradeLater}
              disabled={isUpgrading}
              className="w-full py-2 sm:py-2.5 px-3 bg-ui-sidebar hover:bg-ui-card text-text-secondary hover:text-text-primary border border-ui-border rounded-lg sm:rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Upgrade Later (Stay on {currentVersion})
            </button>
          )}

          {mandatory && (
            <p className="text-[9px] text-amber-500 font-sans uppercase font-bold tracking-wider text-center flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Required to maintain sanctuary synchronicity.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
