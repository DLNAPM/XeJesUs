/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  getAuthService, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  FirebaseUser,
  testConnection,
  getDbService,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  signInAnonymously,
  updateDoc
} from './lib/firebase';
import { 
  Home, 
  Search, 
  Users, 
  LogOut, 
  ChevronRight, 
  BookOpen, 
  Map, 
  Video, 
  MessageSquare, 
  Share2, 
  HelpCircle, 
  Moon, 
  Sun, 
  Settings, 
  UserX, 
  UserSearch, 
  Play, 
  X,
  FileText,
  User as UserIcon,
  GraduationCap,
  Shield,
  Settings as SettingsIcon,
  Menu,
  Globe,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages - We'll define them as components for now to keep it single file or small
import { UserProfile } from './types';
import Dashboard from './components/Dashboard';
import InquiryTool from './components/InquiryTool';
import GroupsList from './components/GroupsList';
import InquiryDetails from './components/InquiryDetails';
import HelpModal from './components/HelpModal';
import PrivacyModal from './components/PrivacyModal';
import Reports from './components/Reports';
import ProfileSettings from './components/ProfileSettings';
import Glossary from './components/Glossary';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/Settings';
import ScriptureBanner from './components/ScriptureBanner';
import PremiumOverlay from './components/PremiumOverlay';
import Chatbot from './components/Chatbot';
import SavedChatSessions from './components/SavedChatSessions';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfUsePage from './components/TermsOfUsePage';

const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {}
  }
};

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
};

type Page = 'dashboard' | 'inquiry' | 'groups' | 'details' | 'reports' | 'settings' | 'glossary' | 'admin' | 'saved-chats' | 'privacy' | 'terms';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [hasWatchedHowTo, setHasWatchedHowTo] = useState(() => {
    return safeSessionStorage.getItem('hasWatchedHowTo') === 'true';
  });
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [hasInquiries, setHasInquiries] = useState<boolean | null>(null);
  const [openChatbotSignal, setOpenChatbotSignal] = useState<{ open: boolean; view: 'chat' | 'sessions'; id: number }>({ open: false, view: 'chat', id: 0 });

  const openSavedChatSessions = () => {
    setCurrentPage('saved-chats');
    setOpenChatbotSignal({ open: true, view: 'sessions', id: Date.now() });
    setShowMobileMenu(false);
  };


  useEffect(() => {
    const checkInquiries = async () => {
      if (!user) {
        setHasInquiries(null);
        return;
      }
      try {
        const db = getDbService();
        if (!db) {
          setHasInquiries(null);
          return;
        }
        const q = query(
          collection(db, 'inquiries'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        setHasInquiries(!snapshot.empty);
      } catch (e) {
        console.error("Error checking inquiries", e);
      }
    };
    checkInquiries().catch(err => console.error("Error in checkInquiries:", err));
  }, [user, currentPage]); // Re-check when landing on dashboard or elsewhere

  const [premiumModal, setPremiumModal] = useState<{ isOpen: boolean, feature: string }>({ isOpen: false, feature: '' });
  const [showHelpPointer, setShowHelpPointer] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);
  const [theme, setTheme] = useState<'modern' | 'midnight' | 'parchment'>(() => {
    const saved = safeLocalStorage.getItem('xejesus-theme');
    return (saved as 'modern' | 'midnight' | 'parchment') || 'modern';
  });

  const isAdmin = userProfile?.role === 'admin' || 
    user?.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com' || 
    user?.email?.toLowerCase() === 'dlaniger.napm.cosulting@gmail.com';

  const isPremium = userProfile?.tier === 'premium' || isAdmin;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user && !isPremium && !showHelp && hasInquiries === false) {
      timer = setTimeout(() => {
        setShowHelpPointer(true);
      }, 30000); // 30 seconds
    } else {
      setShowHelpPointer(false);
    }
    return () => clearTimeout(timer);
  }, [user, isPremium, showHelp, hasInquiries]);

  useEffect(() => {
    safeLocalStorage.setItem('xejesus-theme', theme);
    document.documentElement.setAttribute('data-theme', theme === 'modern' ? '' : theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'modern') return 'midnight';
      if (prev === 'midnight') return 'parchment';
      return 'modern';
    });
  };

  useEffect(() => {
    testConnection();
    const auth = getAuthService();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const db = getDbService();
          if (!db) {
            setUser(u);
            setLoading(false);
            return;
          }
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          const isTargetAdmin = u.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com' || u.email?.toLowerCase() === 'dlaniger.napm.cosulting@gmail.com';

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            
            // Ensure admin status and dashboard access
            if (isTargetAdmin) {
              try {
                // Ensure admins collection doc exists for isAdmin() check in rules
                const adminRef = doc(db, 'admins', u.uid);
                const adminSnap = await getDoc(adminRef);
                if (!adminSnap.exists()) {
                  await setDoc(adminRef, { email: u.email });
                }

                if (data.role !== 'admin' || data.tier !== 'premium' || data.isFrozen) {
                  const updatedProfile = { 
                    ...data, 
                    role: 'admin' as const, 
                    tier: 'premium' as const,
                    isFrozen: false,
                    lastLoginAt: serverTimestamp()
                  };
                  await setDoc(doc(db, 'users', u.uid), updatedProfile);
                  setUserProfile(updatedProfile);
                } else {
                  // Profile is correct, just update last login
                  await updateDoc(doc(db, 'users', u.uid), { lastLoginAt: serverTimestamp() });
                  setUserProfile({ ...data, lastLoginAt: new Date() });
                }
              } catch (err) {
                console.error("Admin check/update failed", err);
                setUserProfile(data);
              }
            } else {
              // Standard last login update
              try {
                const userRef = doc(db, 'users', u.uid);
                await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
                setUserProfile({ ...data, lastLoginAt: new Date() }); // Optimistic update
              } catch (updateErr) {
                console.error("Failed to update last login", updateErr);
                setUserProfile(data);
              }
            }

            if (data.theme) {
              setTheme(data.theme);
            }
          } else {
            try {
              const newProfile: UserProfile = {
                uid: u.uid,
                email: u.isAnonymous ? 'guest@xejesus.app' : (u.email || ''),
                displayName: u.isAnonymous ? 'Test Pilgrim' : (u.displayName || 'Pilgrim'),
                photoURL: u.isAnonymous ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest' : (u.photoURL || ''),
                role: isTargetAdmin ? 'admin' : 'user',
                tier: isTargetAdmin ? 'premium' : 'basic',
                isFrozen: false,
                lastLoginAt: serverTimestamp()
              };
              await setDoc(doc(db, 'users', u.uid), newProfile);
              if (isTargetAdmin) {
                await setDoc(doc(db, 'admins', u.uid), { email: u.email });
              }
              // Log first-time login for admin monitoring
              await addDoc(collection(db, 'system_logs'), {
                type: 'first_login',
                userId: u.uid,
                userEmail: newProfile.email,
                timestamp: serverTimestamp(),
                isGuest: u.isAnonymous
              });
              setUserProfile(newProfile);
            } catch (createErr) {
              console.error("User profile creation failed", createErr);
            }
          }
        } catch (e) {
          console.error("Critical error in auth handler", e);
        }
      } else {
        setUserProfile(null);
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const auth = getAuthService();
    if (!auth) {
      alert("Firebase is not configured. Please set environment variables in the Settings menu.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/auth-domain-config-required') {
        alert("Firebase Auth Domain is not configured correctly.");
      } else if (error.code === 'auth/operation-not-supported-in-this-environment' || 
                 error.message?.includes('missing initial state') ||
                 error.message?.includes('storage-partitioned') ||
                 error.message?.includes('sessionStorage is inaccessible')) {
        setShowLoginErrorModal(true);
      } else {
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleGuestLogin = async () => {
    const auth = getAuthService();
    if (!auth) {
      alert("Firebase is not configured.");
      return;
    }
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Guest login failed", error);
      if (error.code === 'auth/admin-restricted-operation') {
        alert("Anonymous sign-in is not enabled in the Firebase Console. Please enable it in the Auth settings.");
      } else {
        alert("Guest login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleLogout = async () => {
    const auth = getAuthService();
    if (auth) {
      await signOut(auth);
    }
    setCurrentPage('dashboard');
  };

  const navigateToPage = (page: Page, label: string) => {
    if ((page === 'reports' || page === 'glossary') && !isPremium) {
      setPremiumModal({ isOpen: true, feature: label });
      return;
    }
    setCurrentPage(page);
    setShowMobileMenu(false);
  };

  const navigateToDetails = (id: string) => {
    setSelectedInquiryId(id);
    setCurrentPage('details');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-accent font-serif text-3xl italic font-bold"
        >
          XeJesUs
        </motion.div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'privacy') {
      return (
        <div className="min-h-screen bg-bg-primary p-6 md:p-12 relative overflow-y-auto">
          <PrivacyPolicyPage onBack={() => setCurrentPage('dashboard')} />
        </div>
      );
    }

    if (currentPage === 'terms') {
      return (
        <div className="min-h-screen bg-bg-primary p-6 md:p-12 relative overflow-y-auto">
          <TermsOfUsePage onBack={() => setCurrentPage('dashboard')} />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=2071')] bg-cover bg-center opacity-5"></div>
        
        {/* Help Trigger - Landing */}
        <motion.button 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          onClick={() => setShowHelp(true)}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-ui-card shadow-xl border border-ui-border flex items-center justify-center text-accent hover:scale-110 transition-all z-50 group"
          title="Understanding XeJesUs"
        >
          <span className="font-serif italic font-bold text-xl group-hover:not-italic group-hover:scale-125 transition-all">?</span>
        </motion.button>

        {/* Theme Toggle - Landing */}
        <button 
          onClick={toggleTheme}
          className="absolute top-8 right-24 w-12 h-12 rounded-full bg-ui-card shadow-xl border border-ui-border flex items-center justify-center text-text-secondary hover:scale-110 transition-all z-50 group"
        >
          {theme === 'modern' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-accent" />}
        </button>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-center max-w-2xl px-4 flex flex-col items-center"
        >
          <div className="mb-6">
             <div className="w-32 h-32 bg-gradient-to-t from-accent to-accent-soft rounded-full relative overflow-hidden flex items-center justify-center border-2 border-accent shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                <div className="absolute bottom-0 w-full h-1/2 bg-white/10 blur-md"></div>
                <div className="w-12 h-16 bg-text-primary rounded-full mt-4 flex flex-col items-center opacity-20">
                  <div className="w-10 h-10 bg-white/80 rounded-full -mt-6 border-2 border-accent"></div>
                </div>
             </div>
          </div>
          <h1 className="text-6xl md:text-8xl text-text-primary font-serif mb-2 tracking-tight">
            XeJesUs
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary font-serif italic mb-12 opacity-80 uppercase tracking-widest text-xs leading-tight">
            The divine synthesis of Exegesis and the name of Our Savior, Jesus Christ
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <button 
              onClick={handleLogin}
              className="w-full px-8 py-4 bg-text-primary text-bg-primary font-sans font-bold rounded-xl text-lg shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              Enter the Sanctuary
              <ChevronRight className="w-5 h-5 text-accent" />
            </button>

            <button 
              onClick={handleGuestLogin}
              className="w-full px-8 py-4 bg-ui-card border border-ui-border text-text-primary font-sans font-bold rounded-xl text-lg shadow-xl hover:bg-accent hover:text-bg-primary transition-all flex items-center justify-center gap-3 group"
            >
              <UserSearch className="w-5 h-5 text-accent group-hover:text-bg-primary transition-colors" />
              Test Drive as Guest
            </button>

            <motion.div 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-full px-6 py-4 bg-accent/5 border border-accent/10 rounded-xl text-center"
            >
              <p className="text-[10px] sm:text-xs font-sans font-bold text-accent uppercase tracking-[0.2em] leading-relaxed">
                Log into the "Test Drive as Guest" above and Click on the "Play How To" Video once inside
              </p>
            </motion.div>
          </div>

          {!getAuthService() && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-sans flex items-center gap-3 animate-pulse">
              <LogOut className="w-5 h-5 rotate-180" />
              <span>Firebase is unconfigured. Please add variables to <strong>Settings</strong>.</span>
            </div>
          )}
          
          <div className="mt-12 text-natural-text/60 text-xs font-sans max-w-md mx-auto leading-relaxed uppercase tracking-widest">
            Our purpose is to travel through the text to discover Jesus' true intentions for Us today.
          </div>
        </motion.div>

        {/* Privacy Policy & Terms Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-10 px-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 text-xs font-sans font-bold text-text-secondary/70 uppercase tracking-[0.2em]">
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-accent hover:underline underline-offset-4 transition-colors">
              Privacy Policy
            </button>
            <span className="opacity-30">•</span>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-accent hover:underline underline-offset-4 transition-colors">
              Terms of Use
            </button>
          </div>
          <p className="text-[10px] font-sans text-text-secondary/50 uppercase tracking-widest">
            By using XeJesUs, you agree to our Sanctuary Covenants & Terms.
          </p>
        </div>

        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

        {/* Login Error Modal for Restrictive Browser Environments */}
        <AnimatePresence>
          {showLoginErrorModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLoginErrorModal(false)}
                className="absolute inset-0 bg-text-primary/20 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-bg-primary p-8 rounded-[3rem] shadow-2xl border border-ui-border max-w-lg w-full overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-accent opacity-20"></div>
                
                <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center text-accent mx-auto mb-8">
                  <Globe className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-serif font-bold text-text-primary text-center italic mb-4">Login Boundary Detected</h3>
                
                <div className="space-y-4 mb-8">
                  <p className="text-text-secondary font-serif italic text-center leading-relaxed">
                    This browser view (common on tablets and mobile) restricts the secure verification process required for the Sanctuary.
                  </p>
                  
                  <div className="bg-ui-sidebar/50 p-6 rounded-2xl border border-ui-border">
                    <p className="text-xs font-sans font-black uppercase tracking-widest text-accent mb-4 text-center">To continue your journey:</p>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-6 h-6 rounded-full bg-text-primary text-bg-primary flex flex-shrink-0 items-center justify-center text-[10px] font-bold">1</div>
                      <p className="text-sm text-text-primary font-medium leading-tight">Tap the <span className="text-accent underline font-bold uppercase tracking-tighter">"Open in New Tab"</span> icon in your browser's toolbar.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-text-primary text-bg-primary flex flex-shrink-0 items-center justify-center text-[10px] font-bold">2</div>
                      <p className="text-sm text-text-primary font-medium leading-tight">Complete the login in the new window to bypass storage restrictions.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setShowLoginErrorModal(false)}
                    className="w-full py-4 bg-text-primary text-bg-primary rounded-2xl font-sans font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    I Understand
                  </button>
                  <p className="text-[10px] text-text-secondary text-center font-sans tracking-widest opacity-60 uppercase">Error: Missing Initial State (Restricted Browser)</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (userProfile?.isFrozen) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8 text-center bg-[url('https://images.unsplash.com/photo-1548625361-91e84fc11993?auto=format&fit=crop&q=80&w=2071')] bg-cover bg-center">
        <div className="absolute inset-0 bg-bg-primary/90 backdrop-blur-md"></div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 max-w-md bg-ui-card p-12 rounded-[3rem] border border-ui-border shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <UserX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-serif text-text-primary mb-4 italic font-bold">Account Frozen</h1>
          <p className="text-text-secondary italic mb-8">Your journey has been temporarily paused. Please contact Sanctuary Support for guidance on your path forward.</p>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-text-primary text-bg-primary rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
          >
            Depart Sanctuary
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col md:flex-row text-text-primary transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-ui-sidebar border-b border-ui-border sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-t from-accent to-accent-soft rounded-full flex items-center justify-center text-bg-primary shadow-sm border border-accent/20">
             <span className="text-[10px] font-serif font-black italic">XJ</span>
          </div>
          <span className="font-serif italic font-bold text-lg tracking-tight">XeJesUs</span>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setCurrentPage('groups')} 
             className={cn("p-2 transition-colors", currentPage === 'groups' ? "text-accent" : "text-text-primary/60")}
             title="Groups"
           >
             <Users className="w-5 h-5" />
           </button>
           <button 
             onClick={openSavedChatSessions} 
             className="p-2 transition-colors text-text-primary/60 hover:text-accent"
             title="Saved Chat Sessions"
           >
             <History className="w-5 h-5" />
           </button>
           <button 
             onClick={() => navigateToPage('reports', 'Reports Menu')} 
             className={cn("p-2 transition-colors", currentPage === 'reports' ? "text-accent" : "text-text-primary/60")}
             title="Reports"
           >
             <FileText className="w-5 h-5" />
           </button>
           <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
           {hasInquiries === false && (
             <motion.button
               animate={user?.isAnonymous && !hasWatchedHowTo ? { opacity: [1, 0.5, 1], scale: [1, 1.05, 1] } : {}}
               transition={{ repeat: Infinity, duration: 2 }}
               onClick={() => {
                 setShowHowTo(true);
                 setHasWatchedHowTo(true);
                 safeSessionStorage.setItem('hasWatchedHowTo', 'true');
               }}
               className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-sans text-[10px] font-bold uppercase tracking-wider",
                 "bg-accent text-bg-primary shadow-sm active:scale-95"
               )}
             >
               <Play className="w-3 h-3 fill-current" />
               <span>Play How To</span>
             </motion.button>
           )}
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-72 bg-ui-sidebar p-8 border-r border-ui-border relative">
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-ui-card flex items-center justify-center text-text-secondary hover:bg-ui-card/80 transition-all shadow-sm"
          >
            {theme === 'modern' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-accent" />}
          </button>
          <div className="relative">
            <motion.button 
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              onClick={() => {
                setShowHelp(true);
                setShowHelpPointer(false);
              }}
              className="w-8 h-8 rounded-full bg-ui-card flex items-center justify-center text-accent hover:bg-ui-card/80 transition-all shadow-sm group"
              title="Understanding XeJesUs"
            >
              <span className="font-serif italic font-bold group-hover:not-italic">?</span>
            </motion.button>

            {showHelpPointer && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap flex items-center gap-3 z-50"
              >
                <motion.div 
                  animate={{ x: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-4xl filter drop-shadow-lg"
                >
                  👈
                </motion.div>
                <div className="bg-accent text-bg-primary px-4 py-2 rounded-lg font-sans text-[10px] font-bold uppercase tracking-wider shadow-xl border border-accent">
                  Read "How to Use"
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mb-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-t from-accent to-accent-soft rounded-full relative overflow-hidden flex items-center justify-center border border-accent/20 shadow-sm transition-all">
            <div className="absolute bottom-0 w-full h-1/2 bg-white/10 blur-sm"></div>
          </div>
          <h2 className="text-2xl font-serif text-text-primary tracking-tight italic font-bold">XeJesUs</h2>
          <p className="text-xs text-text-secondary uppercase tracking-widest leading-tight">Faith through Understanding</p>
        </div>
        
        <div className="flex-1 space-y-1">
          {[
            { id: 'dashboard', label: 'Exegesis Library', icon: BookOpen },
            { id: 'inquiry', label: 'Seek the Word', icon: Search },
            { id: 'groups', label: 'My Study Groups', icon: Users },
            { id: 'saved-chats', label: 'Saved Chat Sessions', icon: History, onClick: openSavedChatSessions },
            { id: 'reports', label: 'Reports Menu', icon: FileText },
            { id: 'glossary', label: 'Lexicon Glossary', icon: GraduationCap },
            { id: 'settings', label: 'Sanctuary Settings', icon: SettingsIcon },
            ...(isAdmin ? [{ id: 'admin', label: 'Admin Cabinet', icon: Shield }] : []),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => item.onClick ? item.onClick() : navigateToPage(item.id as Page, item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans text-sm font-semibold",
                currentPage === item.id 
                  ? "bg-accent text-bg-primary shadow-sm" 
                  : "hover:bg-accent/10 text-text-secondary hover:text-text-primary"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="tracking-wide text-left">{item.label}</span>
            </button>
          ))}

          {hasInquiries === false && (
            <motion.button
              animate={user?.isAnonymous && !hasWatchedHowTo ? { opacity: [1, 0.5, 1], x: [0, 2, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={() => {
                setShowHowTo(true);
                setHasWatchedHowTo(true);
                safeSessionStorage.setItem('hasWatchedHowTo', 'true');
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans text-sm font-bold",
                "bg-accent/5 text-accent border border-accent/10 hover:bg-accent/10"
              )}
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="tracking-wide text-left">Play How To</span>
            </motion.button>
          )}
        </div>
        
        <div className="pt-6 border-t border-ui-border font-sans">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="relative">
              <img src={user?.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-ui-border shadow-sm" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-ui-sidebar flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-bg-primary rounded-full"></div>
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-text-primary">{user?.displayName}</p>
              <p className="text-xs text-text-secondary truncate uppercase tracking-tighter">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 pb-1 text-[10px] font-sans font-bold text-text-secondary/70 uppercase tracking-wider">
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-accent transition-colors">Privacy Policy</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-accent transition-colors">Terms of Use</button>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-accent transition-colors text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Depart</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
        <ScriptureBanner />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-12 pb-24 md:pb-12"
          >
            {currentPage === 'dashboard' && <Dashboard onSelectInquiry={navigateToDetails} onNewInquiry={() => setCurrentPage('inquiry')} />}
            {currentPage === 'inquiry' && <InquiryTool onComplete={(id) => navigateToDetails(id)} isPremium={isPremium} />}
            {currentPage === 'groups' && <GroupsList onSelectInquiry={navigateToDetails} />}
            {currentPage === 'reports' && <Reports />}
            {currentPage === 'saved-chats' && <SavedChatSessions userProfile={userProfile} onSelectSession={() => setOpenChatbotSignal({ open: true, view: 'chat', id: Date.now() })} />}
            {currentPage === 'glossary' && <Glossary />}
            {currentPage === 'settings' && <SettingsPage onNavigatePage={(page) => setCurrentPage(page)} />}
            {currentPage === 'privacy' && <PrivacyPolicyPage onBack={() => setCurrentPage('dashboard')} />}
            {currentPage === 'terms' && <TermsOfUsePage onBack={() => setCurrentPage('dashboard')} />}
            {currentPage === 'admin' && <AdminDashboard />}
            {currentPage === 'details' && selectedInquiryId && <InquiryDetails inquiryId={selectedInquiryId} onBack={() => setCurrentPage('dashboard')} isPremium={isPremium} />}
          </motion.div>
        </AnimatePresence>

        {/* Global Modals */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        
        {/* How To Video Modal */}
        <AnimatePresence>
          {showHowTo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHowTo(false)}
                className="absolute inset-0 bg-bg-primary/95 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl bg-ui-card rounded-3xl overflow-hidden shadow-2xl border border-ui-border"
              >
                <div className="p-4 border-b border-ui-border flex items-center justify-between bg-ui-sidebar/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-text-primary">XeJesUs App Tour</h3>
                      <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Guided Sanctuary Orientation</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowHowTo(false)}
                    className="w-10 h-10 rounded-full hover:bg-accent/10 flex items-center justify-center text-text-secondary hover:text-accent transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="aspect-video bg-black relative">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/B2auVBhpcjU?autoplay=1" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <div className="p-4 bg-ui-sidebar/30 text-center">
                  <p className="text-xs text-text-secondary font-serif italic">Discover how to travel through the text to discover Jesus' true intentions.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <PremiumOverlay 
          isOpen={premiumModal.isOpen} 
          onClose={() => setPremiumModal({ ...premiumModal, isOpen: false })} 
          featureName={premiumModal.feature} 
        />
        <Chatbot userProfile={userProfile} openSignal={openChatbotSignal} />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-ui-sidebar/80 backdrop-blur-xl text-text-primary flex items-center justify-center gap-8 px-8 py-3 rounded-2xl border border-ui-border z-50 shadow-2xl">
        <button onClick={() => setCurrentPage('dashboard')} className={cn("p-2 transition-colors", currentPage === 'dashboard' ? "text-accent" : "text-text-secondary")}>
          <Home className="w-7 h-7" />
        </button>
        <button onClick={() => setCurrentPage('inquiry')} className={cn("p-2 transition-colors", currentPage === 'inquiry' ? "text-accent" : "text-text-secondary")}>
          <Search className="w-7 h-7" />
        </button>
        <button 
          onClick={() => setShowMobileMenu(true)} 
          className={cn("p-2 transition-colors relative", showMobileMenu ? "text-accent" : "text-text-secondary")}
        >
          <Menu className="w-7 h-7" />
          {showHelpPointer && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full animate-ping" />}
        </button>
      </div>

      {/* Mobile Full Menu Modal */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-bg-primary/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-ui-sidebar rounded-t-[3rem] border-t border-ui-border shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <img src={user?.photoURL || ''} alt="" className="w-12 h-12 rounded-full border border-ui-border" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-serif font-bold text-text-primary italic">{user?.displayName}</p>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest">{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-full bg-ui-card flex items-center justify-center text-text-secondary">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={openSavedChatSessions}
                    className="flex flex-col items-center justify-center p-6 bg-accent/5 rounded-2xl border border-accent/20 gap-3 text-accent hover:bg-accent/10 transition-all col-span-2"
                  >
                    <History className="w-6 h-6 text-accent" />
                    <span className="text-xs font-sans font-bold uppercase tracking-widest text-text-primary">Saved Chat Sessions</span>
                  </button>
                  <button 
                    onClick={() => navigateToPage('glossary', 'Lexicon Glossary')}
                    className="flex flex-col items-center justify-center p-6 bg-ui-card rounded-2xl border border-ui-border gap-3 text-text-secondary hover:text-accent transition-all"
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Glossary</span>
                  </button>
                  <button 
                    onClick={() => navigateToPage('settings', 'Sanctuary Settings')}
                    className="flex flex-col items-center justify-center p-6 bg-ui-card rounded-2xl border border-ui-border gap-3 text-text-secondary hover:text-accent transition-all"
                  >
                    <SettingsIcon className="w-6 h-6" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Settings</span>
                  </button>
                  <button 
                    onClick={() => {
                      toggleTheme();
                      setShowMobileMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-ui-card rounded-2xl border border-ui-border gap-3 text-text-secondary hover:text-accent transition-all"
                  >
                    {theme === 'modern' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Theme</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowHelp(true);
                      setShowHelpPointer(false);
                      setShowMobileMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-ui-card rounded-2xl border border-ui-border gap-3 text-accent transition-all shadow-sm"
                  >
                    <HelpCircle className="w-6 h-6" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest">How to Use</span>
                    {showHelpPointer && (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute top-2 right-2 w-3 h-3 bg-accent rounded-full" 
                      />
                    )}
                  </button>
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => navigateToPage('admin', 'Admin Cabinet')}
                    className="w-full flex items-center justify-center gap-3 p-5 bg-accent/5 text-accent border border-accent/10 rounded-2xl mb-4 transition-all"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-sans font-bold uppercase tracking-[0.2em]">Admin Cabinet</span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-3 py-2 mb-4 text-xs font-sans font-bold text-text-secondary/70 uppercase tracking-widest border-t border-ui-border/50 pt-4">
                  <button onClick={() => navigateToPage('privacy', 'Privacy Policy')} className="hover:text-accent transition-colors">Privacy Policy</button>
                  <span className="opacity-30">•</span>
                  <button onClick={() => navigateToPage('terms', 'Terms of Use')} className="hover:text-accent transition-colors">Terms of Use</button>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-sans font-bold uppercase tracking-[0.2em]">Depart Sanctuary</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
