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
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={mandatory ? undefined : onUpgradeLater}
        className="absolute inset-0 bg-bg-primary/90 backdrop-blur-xl"
      />

      {/* Modal Dialog Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className="relative bg-ui-card w-full max-w-xl rounded-[2.5rem] border-2 border-accent/40 shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-accent via-amber-400 to-accent animate-gradient" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 shadow-inner shrink-0">
                <ArrowUpCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent text-bg-primary text-[10px] font-sans font-black uppercase tracking-wider">
                    {mandatory ? 'Mandatory Upgrade' : 'App Upgrade Available'}
                  </span>
                  {releaseDate && (
                    <span className="text-[10px] font-mono font-bold text-text-secondary opacity-75">
                      {releaseDate}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-serif font-bold text-text-primary italic mt-1 leading-snug">
                  Sanctuary Code Upgrade
                </h3>
              </div>
            </div>

            {!mandatory && (
              <button 
                onClick={onUpgradeLater}
                className="w-9 h-9 rounded-full bg-ui-sidebar hover:bg-accent/10 flex items-center justify-center text-text-secondary hover:text-accent transition-all cursor-pointer"
                title="Remind me later"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Version Comparison Badge Card */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-ui-sidebar/80 rounded-2xl border border-ui-border text-center">
            <div className="p-3 bg-ui-card/60 rounded-xl border border-ui-border/60">
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-secondary mb-1">
                Your Current Version
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-500/10 border border-stone-500/20 text-text-primary font-mono font-bold text-sm">
                <span>{currentVersion}</span>
              </div>
              <p className="text-[10px] text-amber-500 font-serif italic mt-1">Outdated Code</p>
            </div>

            <div className="p-3 bg-accent/10 rounded-xl border border-accent/30">
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-accent mb-1">
                New Version of Code
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-bg-primary font-mono font-black text-sm shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{latestVersion}</span>
              </div>
              <p className="text-[10px] text-accent font-serif italic mt-1 font-semibold">Latest Release</p>
            </div>
          </div>

          {/* Explanation message */}
          <div className="space-y-2">
            <p className="text-sm font-serif italic text-text-primary leading-relaxed">
              A newer, more capable version of the <span className="font-bold text-accent not-italic">XeJesUs Sanctuary</span> code is now available on <span className="font-mono text-xs font-bold text-accent">xejesus-app.onrender.com</span>. 
              Upgrading brings the newest theological exegesis models, enhanced PDF compatibility, and real-time scholar enhancements to your study.
            </p>
            {releaseTitle && (
              <p className="text-xs font-sans font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 pt-1">
                <Zap className="w-3.5 h-3.5" />
                <span>What's New in {latestVersion}: {releaseTitle}</span>
              </p>
            )}
          </div>

          {/* Release Notes Accordion */}
          {releaseNotes && releaseNotes.length > 0 && (
            <div className="bg-ui-sidebar/50 border border-ui-border/80 rounded-2xl p-4 max-h-44 overflow-y-auto space-y-2 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-ui-border/40">
                <span className="text-[10px] font-sans font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  Key Upgrades & Sacred Enhancements
                </span>
                <span className="text-[10px] font-mono text-accent font-bold">{releaseNotes.length} updates</span>
              </div>
              <ul className="space-y-2 pt-1">
                {releaseNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-serif text-text-primary leading-snug">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons: Upgrade Now or Later */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onUpgradeNow}
              disabled={isUpgrading}
              className="w-full py-4 px-6 bg-accent hover:opacity-95 text-bg-primary rounded-2xl font-sans font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isUpgrading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Upgrading App to {latestVersion}...</span>
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
                className="w-full py-3 px-4 bg-ui-sidebar hover:bg-ui-card text-text-secondary hover:text-text-primary border border-ui-border rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Upgrade Later (Continue with {currentVersion})
              </button>
            )}

            {mandatory && (
              <p className="text-[10px] text-amber-500 font-sans uppercase font-bold tracking-widest text-center flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                This code release is required to maintain sanctuary synchronicity.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
