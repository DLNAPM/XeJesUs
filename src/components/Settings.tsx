
import { useState } from 'react';
import { User, Clock, ChevronRight } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import DivineUpdates from './DivineUpdates';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'profile' | 'updates';

interface SettingsProps {
  onNavigatePage?: (page: 'privacy' | 'terms') => void;
}

export default function Settings({ onNavigatePage }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile', label: "Pilgrim's Profile", icon: User, desc: 'Your personal settings' },
    { id: 'updates', label: 'Divine Updates', icon: Clock, desc: 'Version history & revelations' }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-text-primary mb-2 italic font-bold">Sanctuary Settings</h1>
        <p className="text-text-secondary italic">Adjust your pilgrimage parameters and view sacred updates.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-72 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all border group",
                activeTab === tab.id
                  ? "bg-text-primary border-text-primary text-bg-primary shadow-lg scale-[1.02]"
                  : "bg-ui-card border-ui-border text-text-secondary hover:border-accent/50 hover:bg-accent/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  activeTab === tab.id ? "bg-bg-primary/20 text-accent" : "bg-ui-sidebar text-accent group-hover:bg-accent/20"
                )}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider">{tab.label}</p>
                  <p className={cn(
                    "text-[10px] italic font-serif opacity-60",
                    activeTab === tab.id ? "text-bg-primary" : "text-text-secondary"
                  )}>{tab.desc}</p>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                activeTab === tab.id ? "translate-x-1" : "opacity-0 group-hover:opacity-40"
              )} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && <ProfileSettings onNavigatePage={onNavigatePage} />}
              {activeTab === 'updates' && <DivineUpdates />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
