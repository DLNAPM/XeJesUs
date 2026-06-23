import { useState, useEffect } from 'react';
import { getDbService, getAuthService, collection, query, orderBy, getDocs, addDoc, handleFirestoreError, OperationType, setDoc, doc, serverTimestamp } from '../lib/firebase';
import { BibleGroup, Discussion, Inquiry } from '../types';
import { Users, Plus, MessageSquare, ChevronRight, UserPlus, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GroupDetails from './GroupDetails';

interface GroupsListProps {
  onSelectInquiry: (id: string) => void;
}

export default function GroupsList({ onSelectInquiry }: GroupsListProps) {
  const [groups, setGroups] = useState<BibleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupEmails, setNewGroupEmails] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const db = getDbService();
      if (!db) {
        setLoading(false);
        return;
      }
      const groupsPath = 'groups';
      try {
        const q = query(collection(db, groupsPath), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleGroup)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, groupsPath);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuthService();
    const db = getDbService();
    if (!auth || !auth.currentUser || !db || !newGroupName) return;

    const groupsPath = 'groups';
    try {
      const groupRef = await addDoc(collection(db, groupsPath), {
        name: newGroupName,
        description: newGroupDesc,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Add owner as member
      await setDoc(doc(db, `groups/${groupRef.id}/members`, auth.currentUser.uid), {
        email: auth.currentUser.email,
        role: 'owner',
        joinedAt: serverTimestamp()
      });

      // Add other invited emails
      if (newGroupEmails) {
        const emails = newGroupEmails.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
        for (const email of emails) {
          // We add them as membership docs with email as reference. 
          // In a real app, you'd resolve these to UIDs if they exist, or trigger email invites.
          // For now, we store them in the members collection.
          await addDoc(collection(db, `groups/${groupRef.id}/members`), {
            email: email,
            role: 'member',
            joinedAt: serverTimestamp(),
            status: 'invited'
          });
        }
      }

      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupEmails('');
      setShowCreateModal(false);
      // Refresh list
      const q = query(collection(db, groupsPath), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleGroup)));
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, groupsPath);
    }
  };

  if (selectedGroupId) {
    return (
      <GroupDetails 
        groupId={selectedGroupId} 
        onBack={() => setSelectedGroupId(null)} 
        onSelectInquiry={onSelectInquiry}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-serif text-text-primary mb-2 italic">My Study Groups</h1>
          <p className="text-text-secondary italic font-serif">Communion with brothers and sisters in the Word.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-text-primary text-bg-primary px-6 py-3 rounded-xl font-sans font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 text-accent" />
          Form Group
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-64 bg-ui-sidebar/50 animate-pulse rounded-3xl" />
           ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-24 bg-ui-card/40 rounded-[2.5rem] border-2 border-dashed border-ui-border">
          <p className="text-text-secondary italic font-serif text-lg">No groups joined yet. Form a new communion or await an invitation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {groups.map((group) => (
            <motion.div
              layoutId={group.id}
              key={group.id}
              whileHover={{ y: -4 }}
              className="bg-ui-card rounded-[2rem] p-8 border border-ui-border shadow-sm group hover:shadow-xl transition-all relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                 <Users className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-ui-sidebar flex items-center justify-center text-text-primary font-bold font-sans">
                  {group.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-text-primary italic font-bold">{group.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-accent uppercase tracking-widest font-bold">
                    <span>Active Member</span>
                  </div>
                </div>
              </div>
              <p className="text-text-secondary mb-8 line-clamp-2 italic font-serif leading-relaxed">
                {group.description || "A gathering of believers seeking the truth."}
              </p>
              <div className="pt-6 border-t border-ui-border flex items-center justify-between">
                <span className="text-xs text-text-secondary uppercase tracking-[0.3em] font-sans font-bold">Small Group Fellowship</span>
                <button 
                  onClick={() => setSelectedGroupId(group.id!)}
                  className="text-text-primary font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:text-accent transition-all"
                >
                  Enter
                  <ChevronRight className="w-4 h-4 text-accent" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-primary w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative border border-ui-border"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-8 right-8 text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
              <h2 className="text-3xl font-serif text-text-primary mb-2 italic text-center font-bold">New Bible Study Group</h2>
              <p className="text-sm text-text-secondary mb-8 font-serif text-center italic">Create a space for deep study with fellow seekers.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent mb-3">Community Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-ui-card border border-ui-border rounded-xl px-4 py-3 font-serif text-text-primary focus:outline-none focus:border-accent transition-all"
                    placeholder="e.g., Friday Night Fellowship"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent mb-3">Vision & Purpose</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full bg-ui-card border border-ui-border rounded-xl px-4 py-3 font-serif text-text-primary focus:outline-none focus:border-accent transition-all min-h-[100px]"
                    placeholder="Describe your study focus..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold uppercase tracking-[0.2em] text-accent mb-3">Invite Members (Emails)</label>
                  <input
                    type="text"
                    value={newGroupEmails}
                    onChange={(e) => setNewGroupEmails(e.target.value)}
                    className="w-full bg-ui-card border border-ui-border rounded-xl px-4 py-3 font-serif text-text-primary focus:outline-none focus:border-accent transition-all"
                    placeholder="brother@gmail.com, sister@gmail.com"
                  />
                </div>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName}
                  className="w-full bg-text-primary text-bg-primary py-4 rounded-xl font-sans font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-all shadow-lg"
                >
                  Seal the Covenant
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
