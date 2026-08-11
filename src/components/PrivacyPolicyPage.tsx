import { motion } from 'motion/react';
import { Shield, ArrowLeft, Lock, Database, Sparkles, Eye, UserCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export default function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-ui-card p-6 md:p-10 rounded-[2.5rem] border border-ui-border shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-0"></div>
        
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-ui-sidebar/80 hover:bg-ui-sidebar rounded-xl border border-ui-border text-text-secondary hover:text-text-primary text-xs font-sans font-bold uppercase tracking-wider transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return</span>
          </button>
        )}

        <div className="flex items-start gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-mono font-bold uppercase tracking-widest">
                Sanctuary Covenant
              </span>
              <span className="text-xs text-text-secondary font-mono">Last Updated: August 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-text-primary italic font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-text-secondary font-serif italic mt-2 leading-relaxed max-w-2xl">
              Protecting the sanctity and confidentiality of your spiritual pilgrimage and exegetical study within XeJesUs.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Lock className="w-4 h-4" />
            <span>1. Our Commitment to Your Sanctuary</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Sacred Confidentiality</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            Your spiritual queries, personal reflections, and exegetical study sessions are deeply personal. We treat all Pilgrim data with the utmost reverence and security. We promise never to sell, trade, or monetize your personal information or spiritual study archives to third parties.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Database className="w-4 h-4" />
            <span>2. Information We Collect</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Data Gathered for Your Journey</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-ui-sidebar/50 rounded-2xl border border-ui-border space-y-2">
              <h3 className="text-xs font-sans font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-accent" />
                Account Identification
              </h3>
              <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                When signing in via Google Authentication or Guest mode, we store your name, email address, profile avatar, and account tier settings securely.
              </p>
            </div>

            <div className="p-4 bg-ui-sidebar/50 rounded-2xl border border-ui-border space-y-2">
              <h3 className="text-xs font-sans font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Study & Chat Archives
              </h3>
              <p className="text-xs text-text-secondary font-serif italic leading-relaxed">
                Exegesis inquiries, saved chat dialogues with the Sanctuary Scholar, study group contributions, and custom scholar voice settings are stored for your access across devices.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>3. AI Interactions & Model Processing</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Generative Exegesis & Gemini AI</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            Your Biblical inquiries and chat messages are transmitted over encrypted TLS channels to Google Gemini AI API services strictly to generate context-aware commentary, Greek/Hebrew word analyses, and scholar voice narration. API keys and model parameters remain isolated on secure server routes.
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Eye className="w-4 h-4" />
            <span>4. Study Group & Public Sharing</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Controlled Visibility</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            By default, all your exegesis inquiries and saved chat sessions are strictly private to your account. Items are only shared with others when you explicitly publish them to a Study Group or export an exegesis report.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" />
            <span>5. Pilgrim Rights & Account Erasure</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Your Data Sovereignty</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            You retain full ownership of your data. You may modify your scholar voice preferences or delete saved inquiries at any time. If you wish to permanently purge your account profile and archives, contact Sanctuary Support at support@xejesus.app.
          </p>
        </section>

        {/* Section 6 - Contact */}
        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-bold text-text-primary">Questions Regarding Your Privacy?</h3>
              <p className="text-xs text-text-secondary font-serif italic">Contact our Sanctuary Stewards at dlaniger.napm.consulting@gmail.com</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-accent text-bg-primary rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shrink-0"
            >
              Return to Sanctuary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
