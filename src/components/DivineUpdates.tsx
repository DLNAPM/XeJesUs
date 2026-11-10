
import { Sparkles, Palette, Trash2, Download, FileText, GraduationCap, Globe, Clock } from 'lucide-react';

export const UPDATES = [
  {
    version: "v2.7",
    date: "April 2026",
    title: "Sacred Scholar Upgrade & Dynamic Version Tracking",
    changes: [
      { 
        icon: Sparkles, 
        name: "Code Version Detector & Pop-up Upgrade", 
        desc: "Detects if your running client is out of date after login with a seamless pop-up comparing current and latest versions with Upgrade Now and Later choices." 
      },
      { 
        icon: FileText, 
        name: "Enhanced PDF Exegesis Engine", 
        desc: "Upgraded the Exegesis Export engine with a legacy color parser, ensuring reports generate correctly across all pilgrimage devices." 
      }
    ]
  },
  {
    version: "v2.6",
    date: "April 2031",
    title: "The Scholar's Stability",
    changes: [
      { 
        icon: Sparkles, 
        name: "Enhanced PDF Compatibility", 
        desc: "Upgraded the Exegesis Export engine with a legacy color parser, ensuring reports generate correctly across all pilgrimage devices." 
      }
    ]
  },
  {
    version: "v2.5",
    date: "April 2030",
    title: "Pilgrim Tools & Stability",
    changes: [
      { 
        icon: Sparkles, 
        name: "Legacy PDF Compatibility", 
        desc: "Enhanced the Registry export engine to support all modern browser environments, ensuring consistent report generation." 
      },
      { 
        icon: Palette, 
        name: "Atmospheric Persistence", 
        desc: "Themes now persist across your devices, automatically loading your preferred sanctuary environment upon entry." 
      }
    ]
  },
  {
    version: "v2.4",
    date: "April 2029",
    title: "Library Management & Registry",
    changes: [
      { 
        icon: Trash2, 
        name: "Seeking Removal", 
        desc: "You can now delete any previous seeking from your Exegesis Library to keep your archives focused." 
      },
      { 
        icon: Download, 
        name: "PDF Exegesis Export", 
        desc: "Download high-quality Adobe Acrobat PDF reports of your findings directly from the Scholar's Registry." 
      }
    ]
  },
  {
    version: "v2.3",
    date: "April 2028",
    title: "Sanctuary Environments",
    changes: [
      { 
        icon: Palette, 
        name: "Multi-Theme Support", 
        desc: "Switch between Modern Sanctuary, Midnight Exegesis, and Traditional Parchment in your Pilgrim Profile for a customized study atmosphere." 
      }
    ]
  },
  {
    version: "v2.2",
    date: "April 2026",
    title: "The Lexicon & The Registry",
    changes: [
      { 
        icon: FileText, 
        name: "Scholar's Registry", 
        desc: "New Reports Menu! Export any seeking as a professional exegesis PDF for your personal physical archives." 
      },
      { 
        icon: GraduationCap, 
        name: "Lexicon of Truth", 
        desc: "Glossary feature added. Highlight any term in an interpretation to define it and save it to your personal study lexicon." 
      },
      { 
        icon: Globe, 
        name: "Pilgrim's Profile", 
        desc: "Connect your preferred Bible website (BibleGateway, etc.) to link all scriptures directly to your favorite study tool." 
      }
    ]
  }
];

export default function DivineUpdates() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-sm">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-serif text-text-primary italic font-bold">Divine Updates</h2>
          <p className="text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] mt-1">Version History & Revelations</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {UPDATES.map((update, idx) => (
          <div key={idx} className="space-y-4 bg-ui-card p-8 rounded-[2.5rem] border border-ui-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-ui-border pb-6 mb-4">
               <div>
                  <span className="text-xs font-black font-sans text-accent uppercase tracking-widest block mb-1">{update.version}</span>
                  <h3 className="text-xl font-serif text-text-primary italic font-bold leading-tight">{update.title}</h3>
               </div>
               <div className="text-right">
                  <span className="text-[10px] text-text-secondary opacity-60 uppercase font-bold tracking-tighter bg-ui-sidebar px-3 py-1 rounded-full">{update.date}</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {update.changes.map((change, cIdx) => (
                <div key={cIdx} className="flex items-start gap-4 p-4 rounded-2xl bg-bg-primary/50 border border-ui-border/50">
                   <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 animate-pulse-slow">
                     <change.icon className="w-5 h-5" />
                   </div>
                   <div className="min-w-0">
                     <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wider mb-1">{change.name}</h4>
                     <p className="text-xs text-text-secondary leading-relaxed italic font-serif opacity-80">{change.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
