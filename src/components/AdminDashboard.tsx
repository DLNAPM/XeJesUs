import { useState, useEffect } from 'react';
import { 
  getDbService, 
  getAuthService, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  handleFirestoreError, 
  OperationType,
  query,
  orderBy,
  limit,
  Timestamp
} from '../lib/firebase';
import { UserProfile } from '../types';
import { 
  Shield, 
  UserX, 
  IceCream, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Users as UsersIcon,
  Crown,
  Settings,
  Bell,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SystemLog {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  timestamp: Timestamp;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);
  
  type SortField = 'pilgrim' | 'role' | 'tier' | 'status' | 'lastLogin';
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('pilgrim');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const auth = getAuthService();
  const db = getDbService();

  const isAdminEmail = auth?.currentUser?.email?.toLowerCase() === 'dlaniger.napm.consulting@gmail.com' || 
                      auth?.currentUser?.email?.toLowerCase() === 'dlaniger.napm.cosulting@gmail.com';

  const fetchUsers = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'users'), orderBy('email'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchLogs = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
      setLogs(logData);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchLogs()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdateRole = async (uid: string, role: 'user' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      if (role === 'admin') {
        await setDoc(doc(db, 'admins', uid), { email: users.find(u => u.uid === uid)?.email });
      } else {
        await deleteDoc(doc(db, 'admins', uid));
      }
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleUpdateTier = async (uid: string, tier: 'basic' | 'premium') => {
    try {
      await updateDoc(doc(db, 'users', uid), { tier });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, tier } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleFreeze = async (uid: string, isFrozen: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isFrozen: !isFrozen });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isFrozen: !isFrozen } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('EXTREME CAUTION: This will permanently delete the pilgrim profile. Proceed?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this activity log?')) return;
    try {
      await deleteDoc(doc(db, 'system_logs', logId));
      setLogs(prev => prev.filter(log => log.id !== logId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `system_logs/${logId}`);
    }
  };

  const bootstrapAdmin = async () => {
    if (!auth || !auth.currentUser || !db) return;
    setBootstrapping(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), { email: auth.currentUser.email });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        role: 'admin', 
        tier: 'premium' 
      });
      alert("Bootstrap Successful. You are now the Grand Architect.");
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Bootstrap failed. Ensure rules are deployed.");
    } finally {
      setBootstrapping(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    switch (sortField) {
      case 'pilgrim':
        valA = (a.displayName || a.email || '').toLowerCase();
        valB = (b.displayName || b.email || '').toLowerCase();
        break;
      case 'role':
        valA = (a.role || 'user').toLowerCase();
        valB = (b.role || 'user').toLowerCase();
        break;
      case 'tier':
        valA = (a.tier || 'basic').toLowerCase();
        valB = (b.tier || 'basic').toLowerCase();
        break;
      case 'status':
        valA = a.isFrozen ? 1 : 0;
        valB = b.isFrozen ? 1 : 0;
        break;
      case 'lastLogin':
        const getTime = (u: any) => {
          if (!u.lastLoginAt) return 0;
          if (u.lastLoginAt.toDate && typeof u.lastLoginAt.toDate === 'function') {
            return u.lastLoginAt.toDate().getTime();
          }
          return new Date(u.lastLoginAt).getTime() || 0;
        };
        valA = getTime(a);
        valB = getTime(b);
        break;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const stats = [
    { name: 'Basic', value: users.filter(u => u.tier !== 'premium').length },
    { name: 'Premium', value: users.filter(u => u.tier === 'premium').length },
  ];

  const COLORS = ['#94a3b8', '#3b82f6'];

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif text-text-primary mb-2">Sanctuary Overlook</h1>
          <p className="text-text-secondary italic">Manage the pilgrim body and monitor the divine repository.</p>
        </div>
        {isAdminEmail && (
          <button 
            onClick={bootstrapAdmin}
            disabled={bootstrapping}
            className="px-6 py-2 bg-accent text-bg-primary rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {bootstrapping ? "Confirming..." : "Assign Self Admin"}
          </button>
        )}
      </header>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 bg-ui-card rounded-[2rem] border border-ui-border p-6 shadow-sm">
          <h3 className="text-[10px] font-sans font-black text-accent uppercase tracking-[0.3em] mb-6">User Distribution</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--ui-card)', 
                    borderRadius: '1rem', 
                    border: '1px solid var(--ui-border)',
                    fontSize: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {stats.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-8 flex flex-col justify-between flex-1">
            <UsersIcon className="w-8 h-8 text-accent opacity-40" />
            <div>
              <p className="text-4xl font-serif italic text-text-primary">{users.length}</p>
              <p className="text-[10px] font-sans font-black text-text-secondary uppercase tracking-[0.2em]">Total Pilgrims</p>
            </div>
          </div>
          <div className="bg-ui-card rounded-[2rem] border border-ui-border p-8 flex flex-col justify-between flex-1">
            <Crown className="w-8 h-8 text-[#3b82f6] opacity-40" />
            <div>
              <p className="text-4xl font-serif italic text-text-primary">{users.filter(u => u.tier === 'premium').length}</p>
              <p className="text-[10px] font-sans font-black text-text-secondary uppercase tracking-[0.2em]">Premium Seekers</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-ui-card rounded-[2rem] border border-ui-border p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-sans font-black text-accent uppercase tracking-[0.3em]">Recent Activity Log</h3>
            <Bell className="w-4 h-4 text-accent animate-pulse" />
          </div>
          <div className="space-y-4 flex-1">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-secondary italic text-sm">
                No recent activity recorded.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-bg-primary/30 border border-ui-border/50 group hover:border-ui-border transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">First Login Attempt</p>
                    <p className="text-xs text-text-secondary truncate">{log.userEmail}</p>
                    <p className="text-[9px] text-accent/60 font-black uppercase tracking-widest mt-1">
                      {log.timestamp?.toDate().toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="bg-accent/10 px-2 py-1 rounded text-[8px] font-black uppercase text-accent tracking-tighter">
                      NEW USER
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-40 md:opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 text-[10px] font-bold"
                      title="Delete activity log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <section className="bg-ui-card rounded-[2rem] border border-ui-border overflow-hidden shadow-xl">
        <div className="p-8 border-b border-ui-border flex items-center justify-between bg-ui-sidebar/30">
          <h3 className="text-xs font-sans font-bold text-accent uppercase tracking-[0.4em]">Pilgrim Registry</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-primary/50 border border-ui-border rounded-lg pl-10 pr-4 py-2 text-xs font-sans focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-ui-sidebar/10 text-text-secondary uppercase tracking-widest font-bold border-b border-ui-border">
                <th 
                  className="px-8 py-4 cursor-pointer hover:bg-ui-sidebar/20 select-none group/th transition-all duration-200"
                  onClick={() => handleSort('pilgrim')}
                >
                  <div className="flex items-center gap-2">
                    <span>Pilgrim</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-all duration-200 ${sortField === 'pilgrim' ? 'opacity-100 text-accent scale-110' : 'opacity-20 group-hover/th:opacity-60'}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 cursor-pointer hover:bg-ui-sidebar/20 select-none group/th transition-all duration-200"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-2">
                    <span>Role</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-all duration-200 ${sortField === 'role' ? 'opacity-100 text-accent scale-110' : 'opacity-20 group-hover/th:opacity-60'}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 cursor-pointer hover:bg-ui-sidebar/20 select-none group/th transition-all duration-200"
                  onClick={() => handleSort('tier')}
                >
                  <div className="flex items-center gap-2">
                    <span>Tier</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-all duration-200 ${sortField === 'tier' ? 'opacity-100 text-accent scale-110' : 'opacity-20 group-hover/th:opacity-60'}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 cursor-pointer hover:bg-ui-sidebar/20 select-none group/th transition-all duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-all duration-200 ${sortField === 'status' ? 'opacity-100 text-accent scale-110' : 'opacity-20 group-hover/th:opacity-60'}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 cursor-pointer hover:bg-ui-sidebar/20 select-none group/th transition-all duration-200"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center gap-2">
                    <span>Last Login</span>
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-all duration-200 ${sortField === 'lastLogin' ? 'opacity-100 text-accent scale-110' : 'opacity-20 group-hover/th:opacity-60'}`} />
                  </div>
                </th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border">
              {sortedUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-ui-sidebar/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-ui-border" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-text-primary">{u.displayName}</p>
                        <p className="text-[10px] opacity-60">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={u.role || 'user'} 
                      onChange={(e) => handleUpdateRole(u.uid, e.target.value as any)}
                      className="bg-bg-primary border border-ui-border rounded px-2 py-1 focus:outline-none focus:border-accent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={u.tier || 'basic'} 
                      onChange={(e) => handleUpdateTier(u.uid, e.target.value as any)}
                      className="bg-bg-primary border border-ui-border rounded px-2 py-1 focus:outline-none focus:border-accent"
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    {u.isFrozen ? (
                      <span className="flex items-center gap-1 text-red-500 font-bold uppercase tracking-tighter">
                        <UserX className="w-3 h-3" />
                        Frozen
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-500 font-bold uppercase tracking-tighter">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary">
                        {u.lastLoginAt ? (u.lastLoginAt.toDate ? u.lastLoginAt.toDate().toLocaleDateString() : new Date(u.lastLoginAt).toLocaleDateString()) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-text-secondary opacity-60">
                        {u.lastLoginAt ? (u.lastLoginAt.toDate ? u.lastLoginAt.toDate().toLocaleTimeString() : new Date(u.lastLoginAt).toLocaleTimeString()) : '--:--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleFreeze(u.uid, !!u.isFrozen)}
                        className={`p-2 rounded-lg transition-all ${u.isFrozen ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                        title={u.isFrozen ? "Thaw Account" : "Freeze Account"}
                      >
                        <IceCream className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
