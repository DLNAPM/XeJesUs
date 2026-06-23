import { useState, useEffect, useRef } from 'react';
import { getDbService, getAuthService, collection, query, where, orderBy, getDocs, handleFirestoreError, OperationType, doc, getDoc } from '../lib/firebase';
import { Inquiry } from '../types';
import { FileText, Download, Printer, Loader2, ChevronRight, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';

export default function Reports() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettingsGuidance, setShowSettingsGuidance] = useState(false);
  const [bibleWebsite, setBibleWebsite] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const auth = getAuthService();
      const db = getDbService();
      if (!auth || !auth.currentUser || !db) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setBibleWebsite(userDoc.data().bibleWebsite || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserPreferences();
  }, []);

  const getBibleLink = (ref: string) => {
    if (!bibleWebsite) return null;
    const cleanRef = encodeURIComponent(ref.trim());
    if (bibleWebsite.toLowerCase().includes('biblegateway.com') && !bibleWebsite.includes('search=')) {
      return `https://www.biblegateway.com/passage/?search=${cleanRef}`;
    }
    if (bibleWebsite.toLowerCase().includes('blueletterbible.org') && !bibleWebsite.includes('Criteria=')) {
      return `https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${cleanRef}`;
    }
    if (bibleWebsite.endsWith('=') || bibleWebsite.endsWith('/')) {
      return `${bibleWebsite}${cleanRef}`;
    }
    return `${bibleWebsite}${bibleWebsite.includes('?') ? '&' : '?'}search=${cleanRef}`;
  };

  useEffect(() => {
    const fetchInquiries = async () => {
      const auth = getAuthService();
      const db = getDbService();
      if (!auth || !auth.currentUser || !db) {
        setLoading(false);
        return;
      }
      
      const inquiriesPath = 'inquiries';
      try {
        const q = query(
          collection(db, inquiriesPath),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
        setInquiries(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, inquiriesPath);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const generatePDF = async () => {
    if (!reportRef.current || !selectedInquiry) return;
    
    setIsGenerating(true);
    try {
      const container = reportRef.current;
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Manually add links for all <a> tags
      const links = container.querySelectorAll('a');
      const containerRect = container.getBoundingClientRect();

      links.forEach((link) => {
        const linkRect = link.getBoundingClientRect();
        const url = link.getAttribute('href');
        if (url) {
          // Calculate coordinates relative to the container
          const x = linkRect.left - containerRect.left;
          const y = linkRect.top - containerRect.top;
          const w = linkRect.width;
          const h = linkRect.height;
          
          pdf.link(x, y, w, h, { url });
        }
      });
      
      pdf.save(`XeJesUs-Report-${selectedInquiry.scripture.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-text-primary mb-2 italic font-bold">Scholar's Registry</h1>
        <p className="text-text-secondary italic">Transform your spiritual seekings into professional exegesis reports.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-ui-card border border-ui-border rounded-[2rem] p-6 shadow-sm overflow-hidden">
            <h2 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select a Seeking
            </h2>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-ui-sidebar animate-pulse rounded-xl" />
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-text-secondary/20 mx-auto mb-3" />
                <p className="text-xs text-text-secondary italic">No seekings found to report.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-ui-border">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="relative group/row">
                    <button
                      onClick={() => setSelectedInquiry(inq)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedInquiry?.id === inq.id 
                          ? 'bg-accent border-accent text-bg-primary shadow-md' 
                          : 'bg-ui-sidebar/30 border-ui-border text-text-primary hover:bg-ui-sidebar'
                      }`}
                    >
                      <div className="overflow-hidden pr-8">
                        <p className={`text-[11px] uppercase tracking-widest font-bold mb-0.5 ${selectedInquiry?.id === inq.id ? 'text-bg-primary/70' : 'text-accent'}`}>
                          {inq.scripture}
                        </p>
                        <p className={`font-serif text-sm truncate italic ${selectedInquiry?.id === inq.id ? 'text-bg-primary' : 'text-text-primary'}`}>
                          {inq.query}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedInquiry?.id === inq.id ? 'translate-x-1' : 'opacity-20 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                    </button>
                    
                    {selectedInquiry?.id !== inq.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInquiry(inq);
                          setTimeout(generatePDF, 100);
                        }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 p-2 text-accent opacity-0 group-hover/row:opacity-100 transition-opacity"
                        title="Quick Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedInquiry && (
            <div className="bg-text-primary text-bg-primary p-8 rounded-[2rem] shadow-xl border border-ui-border/10 space-y-4">
              <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-widest">Registry Actions</h3>
              <button 
                onClick={generatePDF}
                disabled={isGenerating}
                className="w-full bg-accent text-bg-primary py-4 rounded-xl font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Save as PDF
              </button>
              <button 
                onClick={handlePrint}
                className="w-full bg-bg-primary/10 border border-bg-primary/20 text-bg-primary py-4 rounded-xl font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-bg-primary/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Registry
              </button>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedInquiry ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-ui-border rounded-[2.5rem] bg-ui-card/20 text-text-secondary p-12 text-center"
              >
                <FileText className="w-16 h-16 opacity-10 mb-6" />
                <h3 className="text-2xl font-serif italic mb-2">No Document Selected</h3>
                <p className="max-w-xs font-serif opacity-60">Select an inquiry from your archives to generate a professional exegesis report.</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedInquiry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="print:shadow-none print:border-none"
              >
                {/* The element we capture for PDF */}
                <div 
                  ref={reportRef}
                  className="bg-white p-12 md:p-16 rounded-[2.5rem] shadow-2xl border border-ui-border text-[#0f172a] font-serif overflow-hidden relative"
                  style={{ minHeight: '1000px' }}
                >
                  {/* Watermark/Logo */}
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
                     <BookOpen className="w-64 h-64" />
                  </div>

                  {/* Header */}
                  <header 
                    className="pb-12 mb-12 flex justify-between items-start"
                    style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.2)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-4" style={{ color: '#3b82f6' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold italic" style={{ backgroundColor: '#3b82f6' }}>XJ</div>
                        <span className="font-sans font-black uppercase tracking-[0.3em] text-xs">XeJesUs Registry</span>
                      </div>
                      <h1 className="text-4xl font-black italic tracking-tight mb-2">Technical Exegesis Report</h1>
                      <p className="text-sm font-sans font-medium text-[#64748b] uppercase tracking-[0.2em]">Formal Scriptural Analysis & Academic Registry</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-sans font-bold uppercase tracking-widest mb-1" style={{ color: '#3b82f6' }}>Date Created</div>
                      <div className="text-sm font-sans font-bold text-[#0f172a]">
                        {new Date(selectedInquiry.createdAt?.toDate()).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-3 gap-12 mb-12">
                    <div className="col-span-2">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Subject Identification</h2>
                      <div className="bg-[#f8fafc] p-6 rounded-2xl border border-[#f1f5f9] shadow-inner">
                        <div className="text-xs uppercase font-bold tracking-widest mb-2" style={{ color: 'rgba(59, 130, 246, 0.6)' }}>Canonical Reference</div>
                        {getBibleLink(selectedInquiry.scripture) ? (
                          <a 
                            href={getBibleLink(selectedInquiry.scripture)!} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-2xl font-black italic mb-4 block hover:underline"
                            style={{ color: '#3b82f6' }}
                          >
                            {selectedInquiry.scripture}
                          </a>
                        ) : (
                          <button 
                            onClick={() => setShowSettingsGuidance(true)}
                            className="text-2xl font-black italic mb-4 block hover:opacity-70 transition-opacity text-left cursor-help"
                            style={{ color: '#3b82f6' }}
                          >
                            {selectedInquiry.scripture}
                          </button>
                        )}
                        <div className="text-xs uppercase font-bold tracking-widest mb-2" style={{ color: 'rgba(59, 130, 246, 0.6)' }}>Primary Inquiry</div>
                        <div className="text-xl italic leading-relaxed text-[#1e293b]">"{selectedInquiry.query}"</div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Classifications</h2>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[11px] text-[#94a3b8] uppercase font-bold mb-1">Literary Genre</div>
                          <div className="text-sm font-bold bg-[#f1f5f9] px-3 py-2 rounded-lg text-[#334155] italic">{selectedInquiry.literaryGenre}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#94a3b8] uppercase font-bold mb-1">Expository Tone</div>
                          <div className="text-sm font-bold bg-[#f1f5f9] px-3 py-2 rounded-lg text-[#334155] italic">Academic & Devotional</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="mb-12">
                    <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-3" style={{ color: '#3b82f6' }}>
                      <span className="w-8 h-[2px]" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></span>
                      Theological Intent
                    </h2>
                    <div className="p-10 bg-[#0f172a] text-white rounded-3xl italic text-2xl leading-relaxed shadow-lg relative">
                      <div className="absolute top-4 left-4 opacity-20 text-6xl font-serif" style={{ color: '#3b82f6' }}>“</div>
                      {selectedInquiry.godIntent}
                    </div>
                  </section>

                  <div className="space-y-12 mb-12">
                    <section>
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Analytical Interpretation</h2>
                      <div className="max-w-none text-[#334155] leading-loose font-serif text-lg space-y-6">
                        <Markdown>{selectedInquiry.interpretation}</Markdown>
                      </div>
                    </section>

                    <div className="grid grid-cols-2 gap-12">
                      <section>
                        <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Historical Context</h2>
                        <div className="text-[#475569] leading-relaxed italic border-l-4 border-[#f1f5f9] pl-6 text-base">
                          <Markdown>{selectedInquiry.historicalContext}</Markdown>
                        </div>
                      </section>
                      <section>
                        <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Grammatical Analysis</h2>
                        <div className="text-[#475569] leading-relaxed text-base bg-[#f8fafc] p-6 rounded-2xl border border-[#f1f5f9]">
                          <Markdown>{selectedInquiry.grammarAnalysis}</Markdown>
                        </div>
                      </section>
                    </div>
                  </div>

                  <section className="mb-12">
                    <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4" style={{ color: '#3b82f6' }}>Cross-Referenced Canons</h2>
                    <div className="flex flex-wrap gap-3">
                      {selectedInquiry.crossReferences.map((ref, i) => {
                        const link = getBibleLink(ref);
                        return link ? (
                          <a 
                            key={i} 
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#f1f5f9] rounded-full text-xs font-bold border border-[#e2e8f0] hover:bg-[#e2e8f0] transition-colors"
                            style={{ color: '#3b82f6' }}
                          >
                            {ref}
                          </a>
                        ) : (
                          <button 
                            key={i} 
                            onClick={() => setShowSettingsGuidance(true)}
                            className="px-4 py-2 bg-[#f1f5f9] rounded-full text-xs font-bold border border-[#e2e8f0] hover:opacity-70 transition-opacity cursor-help" 
                            style={{ color: '#3b82f6' }}
                          >
                            {ref}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Geography Section in Report */}
                  <div className="bg-[#f8fafc] rounded-3xl p-8 border border-[#e2e8f0] grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                      <h2 className="text-xs font-sans font-bold uppercase tracking-[0.4em] mb-2" style={{ color: '#3b82f6' }}>Location</h2>
                      <p className="text-lg font-black italic">{selectedInquiry.geography.location}</p>
                    </div>
                    <div className="col-span-3 grid grid-cols-2 gap-6">
                       <div>
                         <p className="text-[11px] text-[#94a3b8] uppercase font-bold mb-1">Historical Status</p>
                         <p className="text-xs text-[#475569] leading-relaxed italic">{selectedInquiry.geography.thenDesc}</p>
                       </div>
                       <div>
                         <p className="text-[11px] text-[#94a3b8] uppercase font-bold mb-1">Modern Status</p>
                         <p className="text-xs text-[#475569] leading-relaxed italic">{selectedInquiry.geography.nowDesc}</p>
                       </div>
                    </div>
                  </div>

                  {/* Footer Seal */}
                  <footer className="mt-20 pt-10 border-t border-[#f1f5f9] flex justify-between items-end">
                    <div className="text-[11px] text-[#cbd5e1] font-sans uppercase tracking-[0.5em] font-bold">
                       Official Registry of XeJesUs • Sanctuary Study Archives
                    </div>
                    <div className="opacity-10 grayscale brightness-0">
                       <span className="text-4xl font-serif italic text-[#0f172a]">Truth.</span>
                    </div>
                  </footer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      {/* Guidance Modal */}
      <AnimatePresence>
        {showSettingsGuidance && (
          <div className="fixed inset-0 z-[120] bg-text-primary/10 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg-primary p-8 rounded-[2.5rem] shadow-2xl border border-ui-border max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif italic font-bold text-text-primary mb-4">Registry Configuration</h3>
              <p className="text-sm font-serif italic text-text-secondary leading-relaxed mb-8">
                To activate these links, please navigate to your <span className="text-accent font-sans font-bold uppercase tracking-tight">Sanctuary Settings</span> and configure your <span className="text-accent font-sans font-bold uppercase tracking-tight">Preferred Bible Website Link</span> within the Bible Canonical Link section.
              </p>
              <button 
                onClick={() => setShowSettingsGuidance(false)}
                className="w-full py-4 bg-text-primary text-bg-primary rounded-xl font-sans font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Return to Registry
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
