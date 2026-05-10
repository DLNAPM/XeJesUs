import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, Check } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
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
            className="relative w-full max-w-xl bg-bg-primary rounded-[2.5rem] shadow-2xl border border-ui-border overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-ui-border bg-ui-card/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-text-primary italic font-bold">Privacy Covenant</h2>
                  <p className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] mt-0.5">Trust in your journey</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-ui-border text-sm text-text-secondary font-serif leading-relaxed italic">
              <section>
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-widest mb-3 not-italic">Our Commitment</h3>
                <p>
                  Your spiritual seeking is deeply personal. We are committed to protecting your privacy and the sanctity of your study experiences within XeJesUs.
                </p>
              </section>

              <section>
                <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-widest mb-3 not-italic">Information Gathering</h3>
                <p>
                  We only gather data necessary to facilitate your journey: your name and email through Google Authentication, and the inquiries you choose to save and share.
                </p>
              </section>

              <section>
                <h3 className="text-[10px] font-sans font-bold text-accent uppercase tracking-widest mb-3 not-italic">Sanctuary of Data</h3>
                <p>
                  Your saved interpretations are stored securely. We do not sell or trade your personal data. Your shared inquiries are only visible to the individuals or groups you explicitly choose.
                </p>
              </section>

              <section>
                <h3 className="text-[10px] font-sans font-bold text-accent uppercase tracking-widest mb-3 not-italic">AI Interactions</h3>
                <p>
                  Your search queries are processed via secure AI models to provide interpretations. These queries are used solely for the purpose of generating your personal study context.
                </p>
              </section>
              
              <div className="p-6 bg-ui-sidebar/30 rounded-2xl border border-ui-border text-xs opacity-70">
                By using "XeJesUs", you agree to the terms outlined in this Privacy Policy. We may update this covenant as the sanctuary grows.
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-ui-card border-t border-ui-border flex justify-center">
              <button 
                onClick={onClose}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-accent text-bg-primary rounded-xl font-sans font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg"
              >
                <Check className="w-4 h-4" />
                Accept & Return
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
