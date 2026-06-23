import { useState, useEffect } from 'react';
import { getDbService, getAuthService, doc, getDoc, setDoc, handleFirestoreError, OperationType } from '../lib/firebase';
import { Shield, Globe, Save, Loader2, Check, Palette, Sun, Moon, BookOpen, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bibleWebsite, setBibleWebsite] = useState('');
  const [theme, setTheme] = useState('modern');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const auth = getAuthService();
      if (!auth || !auth.currentUser) return;

      const db = getDbService();
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setBibleWebsite(data.bibleWebsite || '');
          setTheme(data.theme || 'modern');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile().catch(err => console.error("Error in fetchProfile:", err));
  }, []);

  const handleSave = async () => {
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        bibleWebsite: bibleWebsite,
        theme: theme
      }, { merge: true });
      
      // Update theme in real-time
      document.documentElement.setAttribute('data-theme', theme === 'modern' ? '' : theme);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-text-primary mb-2 italic font-bold">Pilgrim's Profile</h1>
        <p className="text-text-secondary italic">Customize your spiritual study environment.</p>
      </header>

      <div className="bg-ui-card border border-ui-border rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <Globe className="w-48 h-48 text-accent" />
        </div>

        <div className="relative z-10 space-y-12">
          {/* User Info Section */}
          {profile && (
            <section className="flex flex-col md:flex-row items-center gap-8 pb-12 border-b border-ui-border">
              <img 
                src={profile.photoURL} 
                alt="" 
                className="w-24 h-24 rounded-[2rem] border-2 border-accent shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-serif text-text-primary italic font-bold mb-1">{profile.displayName}</h2>
                <p className="text-sm text-text-secondary font-sans tracking-wide mb-4">{profile.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-[0.1em] border ${profile.tier === 'premium' ? 'bg-accent/10 border-accent text-accent' : 'bg-ui-sidebar border-ui-border text-text-secondary'}`}>
                    {profile.tier === 'premium' && <Crown className="w-3 h-3" />}
                    {profile.tier === 'premium' ? 'Premium Pilgrim' : 'Basic Pilgrim'}
                  </span>
                  {profile.role === 'admin' && (
                    <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-[0.1em] bg-text-primary text-bg-primary">
                      <Shield className="w-3 h-3 text-accent" />
                      Sanctuary Admin
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Theme Support */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-serif text-text-primary italic font-bold">Sanctuary Atmosphere</h2>
            </div>
            
            <p className="text-sm text-text-secondary mb-8 leading-relaxed font-serif italic">
              Choose the visual environment that best supports your focus and spiritual reflection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'modern', name: 'Modern Sanctuary', icon: Sun, desc: 'Clean & Technical' },
                { id: 'midnight', name: 'Midnight Exegesis', icon: Moon, desc: 'Dark & Serene' },
                { id: 'parchment', name: 'Traditional Parchment', icon: BookOpen, desc: 'Enhanced Classics' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group ${
                    theme === t.id 
                      ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' 
                      : 'border-ui-border bg-ui-card hover:border-accent/50 hover:bg-bg-primary/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    theme === t.id ? 'bg-accent text-bg-primary' : 'bg-ui-sidebar text-text-secondary group-hover:bg-accent/20 group-hover:text-accent'
                  }`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">{t.name}</h3>
                    <p className="text-xs text-text-secondary opacity-60 italic">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-serif text-text-primary italic font-bold">Bible Canonical Link</h2>
            </div>
            
            <p className="text-sm text-text-secondary mb-6 leading-relaxed font-serif italic">
              Specify your preferred online Bible website. Scriptures in your interpretations will link directly to this resource for deeper study.
            </p>

            <div className="space-y-4">
              <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent">Website URL</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="e.g., https://www.biblegateway.com"
                  className="w-full bg-bg-primary/50 border border-ui-border rounded-xl px-6 py-4 font-serif text-lg focus:outline-none focus:border-accent focus:bg-ui-card transition-all shadow-inner text-text-primary"
                  value={bibleWebsite}
                  onChange={(e) => setBibleWebsite(e.target.value)}
                />
                {bibleWebsite && !bibleWebsite.startsWith('http') && (
                  <p className="mt-2 text-xs text-red-500 font-sans font-bold tracking-widest uppercase">Please include http:// or https://</p>
                )}
              </div>
              <div className="p-4 bg-ui-sidebar/50 rounded-xl border border-ui-border">
                <p className="text-xs text-text-secondary/60 uppercase tracking-widest font-bold mb-2">Example Formatting</p>
                <div className="space-y-1 font-mono text-xs text-text-secondary">
                  <p>• https://www.biblegateway.com/passage/?search=</p>
                  <p>• https://www.blueletterbible.org/search/preSearch.cfm?Criteria=</p>
                  <p>• https://biblehub.com/text/</p>
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-8 border-t border-ui-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-text-primary text-bg-primary py-5 rounded-2xl font-sans font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <span className="italic">Sealing preference...</span>
                </>
              ) : success ? (
                <>
                  <Check className="w-6 h-6 text-green-500" />
                  <span>Covenant Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-accent" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      <div className="mt-12 p-8 bg-accent/5 rounded-3xl border border-accent/10 flex items-start gap-4">
        <Shield className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-widest mb-1">Sanctuary Security</h3>
          <p className="text-sm text-text-secondary italic font-serif leading-relaxed">
            Your preferences are only used to enhance your personal study experience. We do not track your browsing history on external Bible sites.
          </p>
        </div>
      </div>
    </div>
  );
}
