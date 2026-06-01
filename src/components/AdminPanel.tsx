import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Calendar, 
  Mail, 
  User as UserIcon, 
  ChevronLeft,
  ArrowUpDown,
  Download,
  Filter
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  invitationCode: string;
  createdAt: Timestamp;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof UserProfile>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const ADMIN_EMAILS = [
    'joshua@digitalarkitects.com',
    'liona.stansell@gmail.com',
    'itsallieboyd@gmail.com'
  ];

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        // Filter out admins from the dashboard list
        if (!ADMIN_EMAILS.includes(data.email?.toLowerCase())) {
          usersData.push(data);
        }
      });
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSort = (field: keyof UserProfile) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredUsers = users
    .filter(user => 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.invitationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'createdAt') {
        comparison = (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      } else {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Code', 'Signup Date'];
    const rows = filteredUsers.map(user => [
      user.displayName,
      user.email,
      user.invitationCode,
      user.createdAt?.toDate().toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `obm_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-stone-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-stone-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-stone-600" />
          </button>
          <div className="flex items-center gap-2">
            <Users size={24} className="text-hunter" />
            <h1 className="text-lg font-bold text-stone-900">Admin Dashboard</h1>
          </div>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-hunter text-white rounded-lg text-sm font-medium hover:bg-hunter-dark transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-hunter/10 rounded-xl text-hunter">
                <Users size={24} />
              </div>
              <h3 className="text-sm font-medium text-stone-500">Total Members</h3>
            </div>
            <p className="text-3xl font-bold text-stone-900">{users.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Calendar size={24} />
              </div>
              <h3 className="text-sm font-medium text-stone-500">Last 7 Days</h3>
            </div>
            <p className="text-3xl font-bold text-stone-900">
              {users.filter(u => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return u.createdAt?.toMillis() > sevenDaysAgo.getTime();
              }).length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Filter size={24} />
              </div>
              <h3 className="text-sm font-medium text-stone-500">Universal Code Users</h3>
            </div>
            <p className="text-3xl font-bold text-stone-900">
              {users.filter(u => ['OBM-UNIVERSAL-2026', 'OBM-K8X2-P9R4'].includes(u.invitationCode)).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-hunter focus:ring-1 focus:ring-hunter outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th 
                    className="px-6 py-4 text-sm font-bold text-stone-600 cursor-pointer hover:text-hunter transition-colors"
                    onClick={() => handleSort('displayName')}
                  >
                    <div className="flex items-center gap-2">
                      Member
                      <ArrowUpDown size={14} className="opacity-50" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-sm font-bold text-stone-600 cursor-pointer hover:text-hunter transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <ArrowUpDown size={14} className="opacity-50" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-sm font-bold text-stone-600 cursor-pointer hover:text-hunter transition-colors"
                    onClick={() => handleSort('invitationCode')}
                  >
                    <div className="flex items-center gap-2">
                      Access Code
                      <ArrowUpDown size={14} className="opacity-50" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-sm font-bold text-stone-600 cursor-pointer hover:text-hunter transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Joined Date
                      <ArrowUpDown size={14} className="opacity-50" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8 h-12 bg-white"></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500 font-sans italic">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((member) => (
                    <tr key={member.uid} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-hunter">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{member.displayName}</p>
                            <p className="text-xs text-stone-400 font-mono uppercase tracking-tighter">ID: {member.uid.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Mail size={16} className="opacity-40" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-tight ${
                          ['OBM-UNIVERSAL-2026', 'OBM-K8X2-P9R4'].includes(member.invitationCode)
                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {member.invitationCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-500">
                          <Calendar size={16} className="opacity-40" />
                          <span className="text-sm">
                            {member.createdAt?.toDate().toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <p className="mt-6 text-center text-stone-400 text-xs font-sans tracking-wide">
          Confidential Admin Access - Original Book of Months © {new Date().getFullYear()}
        </p>
      </div>
    </motion.div>
  );
}
