import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, BookOpen, Search, Users, Sparkles, AlertTriangle, Play, Video } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-text-primary/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-bg-primary rounded-[2.5rem] shadow-2xl border border-ui-border overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-ui-border bg-ui-card/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-text-primary flex items-center justify-center text-bg-primary shadow-lg">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif text-text-primary italic leading-tight font-bold">Sanctuary Guidance</h2>
                  <p className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] mt-1">Understanding XeJesUs</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-text-secondary hover:text-text-primary hover:bg-ui-sidebar/50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 scrollbar-thin scrollbar-thumb-ui-border">
              {/* Meaning */}
              <section className="space-y-4">
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-4">The Name</h3>
                <div className="p-8 bg-text-primary text-bg-primary rounded-3xl shadow-xl border border-ui-border/10 italic font-serif text-xl leading-relaxed">
                  <span className="text-accent font-bold">XeJesUs</span> is the divine synthesis of <span className="underline decoration-accent/40 underline-offset-4">Eisegesis</span> (leading out meaning) and the name of <span className="text-accent">Our Savior, Jesus Christ</span>.
                  <p className="mt-4 text-base opacity-80 not-italic font-sans tracking-wide">Our purpose is to travel through the text to discover Jesus' true intentions for <span className="text-accent italic">Us</span> today.</p>
                </div>
              </section>

              {/* Orientation */}
              <section className="space-y-4">
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-4">App Orientation</h3>
                <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-bg-primary shadow-lg flex-shrink-0">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-tight mb-1">New to the Sanctuary?</h4>
                    <p className="text-sm font-serif italic text-text-secondary leading-relaxed">
                      Click the <span className="font-sans font-bold text-accent inline-flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded-lg"><Play className="w-3 h-3 fill-current" /> Play How To</span> button in the "Test Drive as Guest" section to watch a guided tour of the app's powerful study features.
                    </p>
                  </div>
                </div>
              </section>

              {/* Steps */}
              <section className="space-y-6">
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-6">Steps of Seeking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Search, title: "Search", desc: "Enter a specific scripture verse or a question currently heavy on your heart." },
                    { icon: BookOpen, title: "Analyze", desc: "Review historical context, grammar, and literary genre for a solid foundation." },
                    { icon: Sparkles, title: "Reflect", desc: "Understand God's Intent and how the Word applies to your personal journey." },
                    { icon: Users, title: "Connect", desc: "Share your findings with your Study Group to foster communal growth." }
                  ].map((step, idx) => (
                    <div key={idx} className="p-6 bg-ui-card border border-ui-border rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-full bg-ui-sidebar flex items-center justify-center text-accent flex-shrink-0">
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary font-sans text-sm mb-1 uppercase tracking-tighter">{step.title}</h4>
                        <p className="text-xs text-text-secondary opacity-70 leading-relaxed font-serif italic">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Audience */}
              <section className="space-y-4">
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em] mb-4">Intended Audience</h3>
                <p className="font-serif text-lg text-text-secondary leading-relaxed italic opacity-80">
                  Designed for believers seeking deep scriptural depth, theology students, small groups, and anyone who desires to hear the heartbeat of the Gospels more clearly.
                </p>
              </section>

              {/* Disclaimer */}
              <section className="p-8 bg-accent/10 rounded-3xl border border-accent/20">
                <div className="flex items-center gap-3 text-accent mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-xs font-sans font-bold uppercase tracking-widest">Important Disclaimer</h3>
                </div>
                <div className="text-sm text-text-secondary/80 font-serif leading-relaxed space-y-4 italic">
                  <p>
                    XeJesUs utilizes advanced AI to assist in scriptural analysis. While we strive for theological accuracy, these results should be used for educational and spiritual exploration.
                  </p>
                  <p className="font-bold text-text-primary">
                    This search is NOT a replacement for personal prayer, pastoral guidance, or the direct leading of the Holy Spirit.
                  </p>
                  <p>
                    Always compare findings with the Holy Bible and approach every search with a spirit of discernment and humility.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 bg-ui-sidebar/30 text-center">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-text-primary text-bg-primary rounded-xl font-sans font-bold text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-lg"
              >
                I Understand & Seek Further
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
