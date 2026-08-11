import { motion } from 'motion/react';
import { FileText, ArrowLeft, BookOpen, GraduationCap, Scale, ShieldAlert, Users, Radio, Mail, CheckCircle } from 'lucide-react';

interface TermsOfUsePageProps {
  onBack?: () => void;
}

export default function TermsOfUsePage({ onBack }: TermsOfUsePageProps) {
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
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-mono font-bold uppercase tracking-widest">
                Sanctuary Covenant
              </span>
              <span className="text-xs text-text-secondary font-mono">Last Updated: August 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-text-primary italic font-bold tracking-tight">
              Terms of Use
            </h1>
            <p className="text-sm text-text-secondary font-serif italic mt-2 leading-relaxed max-w-2xl">
              The rules, conduct standards, and covenants governing your pilgrimage and study within the XeJesUs application.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            <span>1. Acceptance & Purpose</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">The Divine Synthesis Covenant</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            By entering the XeJesUs Sanctuary, creating an account, or utilizing our AI Exegesis services, you agree to abide by these Terms of Use. XeJesUs is designed to facilitate deep Biblical study, spiritual reflection, and scholarship to discover Jesus' true intentions for Us today.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <GraduationCap className="w-4 h-4" />
            <span>2. Biblical Exegesis & AI Commentary Notice</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Educational & Spiritual Nature</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            Exegetical commentaries, Hebrew/Greek word analyses, and Sanctuary Scholar responses generated within XeJesUs are intended for personal devotional and academic enrichment. While grounded in canonical Scripture, historical commentaries, and original languages, AI insights should be weighed alongside pastoral guidance and prayerful discernment.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Users className="w-4 h-4" />
            <span>3. Pilgrim Conduct in Study Groups</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Reverent Fellowship</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            Pilgrims participating in shared Study Groups or public exegesis discussions agree to maintain a spirit of grace, respect, and constructive dialogue. Hateful speech, harassment, blasphemous profanity, or deliberate spam within public study groups will result in account suspension or restriction.
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Radio className="w-4 h-4" />
            <span>4. Scholar AI Voice & Media Usage</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Speech Synthesis & Media Export</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            The Scholar Voice text-to-speech engine utilizes AI voice models for narration of exegesis commentary. Exported PDF reports, audio recordings, and literary works generated by Pilgrims may be used for personal, non-commercial ministry, teaching, and devotional purposes.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            <span>5. Limitation of Liability & Service Availability</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Sanctuary Continuity</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            XeJesUs strives to maintain 24/7 sanctuary availability. However, we are not liable for transient network disruptions, third-party API downtime, or data loss stemming from external service outages. We recommend periodically exporting or saving key exegesis studies to PDF.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-accent font-sans font-bold text-xs uppercase tracking-widest">
            <Scale className="w-4 h-4" />
            <span>6. Amendments to the Covenant</span>
          </div>
          <h2 className="text-xl font-serif text-text-primary italic font-bold">Evolving Sanctuary Terms</h2>
          <p className="text-sm text-text-secondary font-serif leading-relaxed italic">
            We reserve the right to update these Terms of Use as the XeJesUs applet evolves. Continued use of the platform following updates constitutes acceptance of the revised covenant.
          </p>
        </section>

        {/* Footer Action */}
        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-bold text-text-primary">Questions About Our Terms?</h3>
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
