import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Menu, 
  Share2, 
  Settings, 
  MessageSquare, 
  BookOpen, 
  Quote, 
  Heart, 
  Pencil, 
  HandHeart,
  Leaf,
  Download,
  Loader2,
  LogOut,
  Book,
  ExternalLink,
  ChevronDown,
  Highlighter,
  Trash2,
  Users,
  ShieldAlert
} from 'lucide-react';
import { devotions, Devotion } from '../data/devotions';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandlers';
import BibleViewer from './BibleViewer';
import AdminPanel from './AdminPanel';

// Utility to format scripture text: "Verse text" (Reference)
const formatScriptureText = (text: string) => {
  if (!text) return '';
  // Try to find reference in parentheses at the end, possibly with a period
  // e.g. "Text (Gen. 1:1)." or "Text (Gen. 1:1)"
  const refMatch = text.match(/\s*\(([^)]+)\)\.?\s*$/);
  if (refMatch) {
    const fullRefMatch = refMatch[0];
    const refContent = refMatch[1];
    let versePart = text.substring(0, text.lastIndexOf(fullRefMatch)).trim();
    
    // Clean up versePart: remove outer quotes if they exist, and trailing periods
    if (versePart.startsWith('"') || versePart.startsWith('\"')) {
      versePart = versePart.substring(1);
    }
    if (versePart.endsWith('"') || versePart.endsWith('\"')) {
      versePart = versePart.substring(0, versePart.length - 1);
    }
    if (versePart.endsWith('.')) {
      versePart = versePart.substring(0, versePart.length - 1);
    }
    
    return `"${versePart}" (${refContent})`;
  }
  
  // Fallback: original logic
  return text.startsWith('"') ? text : `"${text}"`;
};

const HIGHLIGHT_COLORS = [
  { id: 'yellow', name: 'Pastel Yellow', bg: 'bg-[#FEF08A]', class: 'bg-[#FEF08A]/60' },
  { id: 'blue', name: 'Pastel Blue', bg: 'bg-[#BFDBFE]', class: 'bg-[#BFDBFE]/60' },
  { id: 'green', name: 'Pastel Green', bg: 'bg-[#BBF7D0]', class: 'bg-[#BBF7D0]/60' },
  { id: 'purple', name: 'Pastel Purple', bg: 'bg-[#E9D5FF]', class: 'bg-[#E9D5FF]/60' },
  { id: 'pink', name: 'Pastel Pink', bg: 'bg-[#FBCFE8]', class: 'bg-[#FBCFE8]/60' },
  { id: 'brown', name: 'Pastel Brown', bg: 'bg-[#E5D3C3]', class: 'bg-[#E5D3C3]/60' }
];

export default function DevotionalBook() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [userNotes, setUserNotes] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('obm_notes_cache');
    return cached ? JSON.parse(cached) : {};
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const cached = localStorage.getItem('obm_bookmarks_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [showContents, setShowContents] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [showBible, setShowBible] = useState(false);
  const [bibleQuery, setBibleQuery] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [highlights, setHighlights] = useState<Record<string, Array<{ text: string, id: string, paraIndex: number, color?: string }>>>(() => {
    const cached = localStorage.getItem('obm_highlights_cache');
    return cached ? JSON.parse(cached) : {};
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const totalPages = devotions.length;

  const ADMIN_EMAILS = [
    'joshua@digitalarkitects.com',
    'liona.stansell@gmail.com',
    'itsallieboyd@gmail.com'
  ];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const handleOpenBible = (ref?: string) => {
    setBibleQuery(ref);
    setShowBible(true);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let yPos = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Title Page
      doc.setFont('serif', 'bold');
      doc.setFontSize(24);
      doc.text('OLIVE BRANCH MINISTRIES', pageWidth / 2, 100, { align: 'center' });
      doc.setFontSize(16);
      doc.text('DAILY DEVOTIONAL SERIES', pageWidth / 2, 115, { align: 'center' });
      doc.setFontSize(10);
      doc.text('WHEN GOD WRITES YOUR STORY', pageWidth / 2, 130, { align: 'center' });
      
      doc.addPage();

      // Simple generation for the entire set
      // Note: Full 365 generation might be heavy, but we'll try a streamlined version
      devotions.forEach((dev, index) => {
        if (index > 0) doc.addPage();
        yPos = 20;

        // Header
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${dev.month || ''} ${dev.day > 0 ? dev.day : ''}`, margin, yPos);
        yPos += 10;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(45, 76, 49); // Hunter Green
        doc.text(dev.title || 'Introduction', margin, yPos);
        yPos += 15;

        // Scripture
        if (dev.scriptureRef) {
          doc.setFontSize(10);
          doc.setTextColor(0);
          doc.text(dev.scriptureRef, margin, yPos);
          yPos += 7;
          
          doc.setFontSize(10);
          doc.setFont('serif', 'italic');
          const scriptText = doc.splitTextToSize(
            formatScriptureText(dev.scriptureText), 
            pageWidth - (margin * 2)
          );
          doc.text(scriptText, margin, yPos);
          yPos += (scriptText.length * 5) + 10;
        }

        // Body
        doc.setFont('serif', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(40);
        
        if (dev.body) {
          dev.body.forEach(para => {
            const lines = doc.splitTextToSize(para, pageWidth - (margin * 2));
            if (yPos + (lines.length * 6) > pageHeight - 40) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(lines, margin, yPos);
            yPos += (lines.length * 6) + 5;
          });
        }

        // Prayer
        if (dev.prayer) {
          yPos += 5;
          doc.setFont('serif', 'bold italic');
          doc.text('PRAYER:', margin, yPos);
          yPos += 7;
          doc.setFont('serif', 'italic');
          dev.prayer.forEach(p => {
             const plines = doc.splitTextToSize(p, pageWidth - (margin * 2));
             if (yPos + (plines.length * 5) > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(plines, margin, yPos);
             yPos += (plines.length * 5) + 3;
          });
        }
      });

      doc.save('Olive_Branch_Devotional.pdf');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const currentDevotion = devotions[currentPage];
  const activeColorCfg = HIGHLIGHT_COLORS.find(c => c.id === selectedColor) || HIGHLIGHT_COLORS[0];

  // Sync state with Firestore
  useEffect(() => {
    if (!user) return;

    // Listen to bookmarks
    const bookmarksQuery = query(collection(db, 'users', user.uid, 'bookmarks'));
    const unsubscribeBookmarks = onSnapshot(bookmarksQuery, (snapshot) => {
      const bMarks: string[] = [];
      snapshot.forEach((doc) => bMarks.push(doc.data().devotionId));
      setBookmarks(bMarks);
      localStorage.setItem('obm_bookmarks_cache', JSON.stringify(bMarks));
    }, (error) => handleFirestoreError(error, 'list', `users/${user.uid}/bookmarks`));

    // Listen to notes
    const notesQuery = query(collection(db, 'users', user.uid, 'notes'));
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notes: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        notes[data.devotionId] = data.content;
      });
      setUserNotes(notes);
      localStorage.setItem('obm_notes_cache', JSON.stringify(notes));
    }, (error) => handleFirestoreError(error, 'list', `users/${user.uid}/notes`));

    // Listen to highlights
    const highlightsQuery = query(collection(db, 'users', user.uid, 'highlights'));
    const unsubscribeHighlights = onSnapshot(highlightsQuery, (snapshot) => {
      const h: Record<string, Array<{ text: string, id: string, paraIndex: number, color?: string, isOptimistic?: boolean }>> = {};
      snapshot.forEach((docs) => {
        const data = docs.data();
        if (!h[data.devotionId]) h[data.devotionId] = [];
        h[data.devotionId].push({ 
          text: data.text, 
          id: docs.id, 
          paraIndex: data.paragraphIndex ?? -1,
          color: data.color || 'yellow'
        });
      });
      
      setHighlights(prev => {
        const merged = { ...h };
        // Carry over any optimistic items that haven't appeared in the snapshot yet
        Object.keys(prev).forEach(devId => {
          const optimisticOnly = prev[devId].filter(item => item.isOptimistic);
          if (optimisticOnly.length > 0) {
            if (!merged[devId]) merged[devId] = [];
            const existingIds = new Set(merged[devId].map(item => item.id));
            optimisticOnly.forEach(opt => {
              if (!existingIds.has(opt.id)) {
                merged[devId].push(opt);
              }
            });
          }
        });
        localStorage.setItem('obm_highlights_cache', JSON.stringify(merged));
        return merged;
      });
    }, (error) => handleFirestoreError(error, 'list', `users/${user.uid}/highlights`));

    return () => {
      unsubscribeBookmarks();
      unsubscribeNotes();
      unsubscribeHighlights();
    };
  }, [user]);

  const toggleBookmark = async (id: string) => {
    if (!user) return;
    
    try {
      if (bookmarks.includes(id)) {
        await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', id));
      } else {
        await setDoc(doc(db, 'users', user.uid, 'bookmarks', id), {
          userId: user.uid,
          devotionId: id,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, bookmarks.includes(id) ? 'delete' : 'create', `users/${user.uid}/bookmarks/${id}`);
    }
  };

  const handleNoteChange = async (id: string, note: string) => {
    if (!user) return;
    
    // Immediate UI update (optimistic)
    setUserNotes(prev => ({ ...prev, [id]: note }));
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'notes', id), {
        userId: user.uid,
        devotionId: id,
        content: note,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'write', `users/${user.uid}/notes/${id}`);
    }
  };

  const handleAddHighlight = async (devotionId: string, text: string, paraIndex: number) => {
    if (!user || !text.trim()) return;
    
    const highlightId = `${devotionId}-${Date.now()}`;
    
    // OPTIMISTIC UPDATE: Instant feedback
    setHighlights(prev => {
        const devotionH = prev[devotionId] || [];
        // Avoid duplicates in optimistic state
        if (devotionH.some(h => h.text === text && h.paraIndex === paraIndex)) return prev;
        return {
            ...prev,
            [devotionId]: [...devotionH, { 
              text, 
              id: highlightId, 
              paraIndex, 
              color: selectedColor,
              isOptimistic: true // Marker for UI
            }]
        };
    });

    try {
      await setDoc(doc(db, 'users', user.uid, 'highlights', highlightId), {
        userId: user.uid,
        devotionId,
        text,
        paragraphIndex: paraIndex,
        color: selectedColor,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      // Revert optimistic update on failure
      setHighlights(prev => {
          const devotionH = prev[devotionId] || [];
          return {
              ...prev,
              [devotionId]: devotionH.filter(h => h.id !== highlightId)
          };
      });
      handleFirestoreError(error, 'create', `users/${user.uid}/highlights/${highlightId}`);
    }
  };

  const handleRemoveHighlight = async (highlightId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'highlights', highlightId));
    } catch (error) {
      handleFirestoreError(error, 'delete', `users/${user.uid}/highlights/${highlightId}`);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    const nextIdx = currentPage + newDirection;
    if (nextIdx >= 0 && nextIdx < totalPages) {
      setPage([nextIdx, newDirection]);
      setCurrentPage(nextIdx);
    }
  };

  // Bolder months and collapsed state management
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month) 
        : [...prev, month]
    );
  };

  const progress = ((currentPage + 1) / totalPages) * 100;

  // Stable collection of 31 unique verified Unsplash IDs for each day of the month
  const dailyImageIds = [
    'photo-1470071459604-3b5ec3a7fe05', // 1: Nature mist
    'photo-1441974231531-c6227db76b6e', // 2: Forest sunlight
    'photo-1501854140801-50d01698950b', // 3: River
    'photo-1472214103451-9374bd1c798e', // 4: Sunset valley
    'photo-1464822759023-fed622ff2c3b', // 5: Mountains
    'photo-1506744038136-46273834b3fb', // 6: Lake reflection
    'photo-1469474968028-56623f02e42e', // 7: Mountain path (Verified)
    'photo-1470770841072-f978cf4d019e', // 8: Meadow
    'photo-1447752875215-b2761acb3c5d', // 9: Park path
    'photo-1502126324834-38f8e02d7160', // 10: Night mountains (Verified)
    'photo-1511497584788-87678b396186', // 11: Forest
    'photo-1426604966848-d7adac402bff', // 12: Mountain peak
    'photo-1501785888041-af3ef285b470', // 13: Mountain lake (Verified)
    'photo-1500627844004-7335d7d03909', // 14: Coastal cliffs (Verified)
    'photo-1490730141103-6cac27aaab94', // 15: Golden sunset (Verified)
    'photo-1518495973542-4542c06a5843', // 16: Sun rays
    'photo-1547036967-23d11aacaee0', // 17: Snowy peaks
    'photo-1465189662980-d3ef9964b411', // 18: Lavender field (Verified)
    'photo-1510784722466-f2aa9c52fe6f', // 19: Beach waves
    'photo-1473448912268-2022ce9509d8', // 20: Field
    'photo-1509114397022-ed747cca3f65', // 21: Mist
    'photo-1439853949127-fa647821eba0', // 22: Mountains fog
    'photo-1441113948229-e9a16f58872b', // 23: Snow path
    'photo-1493246507139-91e8bef99c4a', // 24: High mountains (Verified)
    'photo-1451187580459-43490279c0fa', // 25: Earth
    'photo-1470252646218-fa6b27d49079', // 26: Sunrise (Verified)
    'photo-1502082553048-f009c37129b9', // 27: Forest light
    'photo-1513147122760-ad1d5bf68c6a', // 28: Lake sunset (Verified)
    'photo-1513836279014-a89f7a76ae86', // 29: Nature path
    'photo-1433086966358-54859d0ee716', // 30: Waterfall
    'photo-1444090542259-0af8fa9b557e'  // 31: Rolling hills (Verified)
  ];

  const getImageUrl = (day: number | undefined) => {
    const validDay = day || 1;
    const index = (Math.max(1, validDay) - 1) % dailyImageIds.length;
    const photoId = dailyImageIds[index];
    // Optimized for speed: reduced width and quality for faster background rendering
    return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=50&w=800`;
  };

  return (
    <div className="h-screen w-full bg-[#F5F6F1] font-sans flex flex-col overflow-hidden text-[#1A1A1A]">
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white border-b border-[#DDE2D9] shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-hunter">
             <Leaf size={24} />
          </div>
          <button 
            onClick={() => setCurrentPage(0)}
            className="text-base md:text-lg font-bold tracking-tight text-hunter hover:opacity-80 transition-opacity text-left truncate max-w-[120px] sm:max-w-none"
          >
            OLIVE BRANCH MINISTRIES
          </button>
          <div className="h-4 w-[1px] bg-[#DDE2D9] mx-2 hidden lg:block"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-olive opacity-80 hidden lg:block">DAILY DEVOTIONAL</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            <button 
              onClick={() => {
                setShowBookmarks(false);
                setShowContents(true);
              }}
              className="bg-stone-50 px-3 py-1.5 rounded border border-stone-100 hover:border-olive/30 hover:bg-stone-100 transition-all text-hunter font-bold uppercase tracking-widest text-[10px]"
            >
              CONTENTS
            </button>
          </div>
          <button 
            onClick={() => {
              setShowContents(true);
              setShowBookmarks(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold hover:text-olive transition-colors uppercase tracking-widest ${showContents && !showBookmarks ? 'text-olive opacity-100' : 'opacity-70 hover:opacity-100'}`}
          >
            <Menu size={18} />
            <span className="hidden md:inline">CONTENTS</span>
          </button>
          <button 
            onClick={() => {
              setShowBookmarks(true);
              setShowContents(true);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold hover:text-olive transition-colors uppercase tracking-widest ${showBookmarks ? 'text-olive opacity-100' : 'opacity-70 hover:opacity-100'}`}
          >
            <Bookmark size={18} fill={bookmarks.includes(currentDevotion.id) ? "currentColor" : "none"} />
            <span className="hidden md:inline">BOOKMARKS</span>
          </button>
          <button 
            onClick={() => setIsHighlightMode(!isHighlightMode)}
            className={`flex items-center gap-1.5 text-xs font-bold hover:text-olive transition-colors uppercase tracking-widest ${isHighlightMode ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            title="Toggle Highlighter Tool"
          >
            <div className={`w-3 h-3 rounded-full ${activeColorCfg.bg} border border-black/10 shadow-sm ${isHighlightMode ? 'ring-1 ring-hunter ring-offset-1' : ''}`}></div>
            <span className="text-[10px] md:text-xs">{isHighlightMode ? 'HL ON' : 'HL'}</span>
          </button>
          
          {/* Color Picker for Highlighter */}
          <AnimatePresence>
            {isHighlightMode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="hidden lg:flex items-center gap-1.5 bg-stone-50 p-1.5 rounded-full border border-stone-200"
              >
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-5 h-5 rounded-full transition-all ring-offset-1 ${color.bg} ${selectedColor === color.id ? 'ring-2 ring-hunter scale-110 shadow-sm' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    title={color.name}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setShowBible(true)}
            className={`flex items-center gap-1.5 text-xs font-bold hover:text-olive transition-colors uppercase tracking-widest ${showBible ? 'text-olive opacity-100' : 'opacity-70 hover:opacity-100'}`}
          >
            <Book size={18} />
            <span className="hidden md:inline">BIBLE</span>
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 text-xs font-bold hover:text-hunter transition-colors uppercase tracking-widest opacity-70 hover:opacity-100 ${isDownloading ? 'cursor-wait' : ''}`}
            title="Download Entire Devotional (PDF)"
          >
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span className="hidden md:inline">{isDownloading ? 'GENERATING...' : 'DOWNLOAD'}</span>
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-hunter hover:text-hunter-dark transition-colors uppercase tracking-[0.2em] opacity-80 hover:opacity-100"
              title="Admin Dashboard"
            >
              <ShieldAlert size={18} />
              <span className="hidden md:inline">ADMIN</span>
            </button>
          )}

          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 group transition-all"
            title="Sign Out"
          >
            <div className="h-8 w-8 rounded-full bg-hunter text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-md group-hover:ring-2 ring-hunter/20 transition-all">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.displayName?.split(' ').map(n => n[0]).join('') || 'JD'
              )}
            </div>
            <LogOut size={14} className="text-stone-300 group-hover:text-red-400 transition-colors hidden sm:block" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isHighlightMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden flex items-center justify-center gap-4 bg-white border-b border-[#DDE2D9] py-2 px-4 shadow-sm z-40 overflow-x-auto custom-scrollbar shrink-0"
          >
             <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest shrink-0">Color</span>
             <div className="flex items-center gap-3">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`shrink-0 w-6 h-6 rounded-full transition-all ring-offset-2 ${color.bg} ${selectedColor === color.id ? 'ring-2 ring-hunter scale-110 shadow-md' : 'opacity-60'}`}
                  />
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </AnimatePresence>

      {/* Contents Overlay */}
      <AnimatePresence>
        {showContents && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContents(false)}
              className="absolute inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full xs:max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[#DDE2D9] flex items-center justify-between bg-stone-50">
                <h2 className="text-xl font-serif font-bold tracking-tight">
                  {showBookmarks ? 'Your Bookmarks' : 'Table of Contents'}
                </h2>
                <button 
                  onClick={() => setShowContents(false)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                {showBookmarks ? (
                  <div className="space-y-4">
                    {bookmarks.length === 0 ? (
                      <p className="text-center text-stone-400 font-serif italic py-10">No bookmarks yet</p>
                    ) : (
                      bookmarks.map(id => {
                        const devIdx = devotions.findIndex(d => d.id === id);
                        const dev = devotions[devIdx];
                        if (!dev) return null;
                        return (
                          <div
                            key={id}
                            className="w-full relative group"
                          >
                            <button
                              onClick={() => {
                                setCurrentPage(devIdx);
                                setShowContents(false);
                              }}
                              className="w-full text-left p-4 pr-12 rounded-xl border border-[#DDE2D9] hover:border-hunter hover:bg-stone-50 transition-all"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-hunter uppercase tracking-widest">{dev.month} {dev.day > 0 ? dev.day : ''}</span>
                              </div>
                              <h3 className="font-serif text-lg text-[#1A1A1A]">{dev.title || 'Introduction'}</h3>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(id);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-red-500 transition-colors"
                              title="Remove Bookmark"
                            >
                              <Bookmark size={18} fill="currentColor" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  // Group devotions by month
                  Object.entries(devotions.reduce((acc, dev, idx) => {
                    const month = dev.month || 'Other';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push({ ...dev, index: idx });
                    return acc;
                  }, {} as Record<string, any[]>)).map(([month, items]) => {
                    const isExpanded = expandedMonths.includes(month);
                    return (
                      <div key={month} className="mb-6">
                        <button 
                          onClick={() => toggleMonth(month)}
                          className={`w-full flex items-center justify-between group py-4 transition-all text-left px-4 rounded-xl mb-1 ${isExpanded ? 'bg-olive text-white' : 'bg-stone-50 hover:bg-stone-100 text-hunter'}`}
                        >
                          <h3 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-widest">
                            {month}
                          </h3>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={24} className={isExpanded ? 'text-white' : 'text-olive'} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-4 pb-8 px-1">
                                {items.map((dev) => (
                                  <button
                                    key={dev.id}
                                    onClick={() => {
                                      setCurrentPage(dev.index);
                                      setShowContents(false);
                                    }}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all border ${
                                      currentPage === dev.index 
                                      ? 'bg-olive text-white border-olive shadow-md' 
                                      : 'bg-white hover:border-olive/50 hover:bg-stone-50 text-hunter border-stone-200'
                                    }`}
                                  >
                                    <span className="text-xs font-bold font-sans">
                                      {dev.day > 0 ? dev.day : 'Intro'}
                                    </span>
                                    {bookmarks.includes(dev.id) && (
                                      <Bookmark size={8} fill="currentColor" className="mt-1" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 bg-stone-50 border-t border-[#DDE2D9] space-y-3">
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setShowAdmin(true);
                      setShowContents(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-hunter/30 text-hunter rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-hunter hover:text-white transition-all shadow-sm"
                  >
                    <ShieldAlert size={18} />
                    Admin Dashboard
                  </button>
                )}
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-hunter text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-hunter-dark transition-all shadow-md"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Reader View */}
      <main className="flex-1 relative flex items-center justify-center px-0 md:px-12 py-2 md:py-4 bg-[#F5F6F1] overflow-hidden">
        {/* Left Arrow Navigation - Hidden on mobile, using bottom dots or separate buttons */}
        <button 
          onClick={() => paginate(-1)}
          disabled={currentPage === 0}
          className={`absolute left-4 md:left-8 z-30 w-12 h-12 hidden md:flex items-center justify-center rounded-full transition-all duration-300 border border-[#DDE2D9] shadow-sm ${
            currentPage === 0 
            ? 'opacity-0 pointer-events-none' 
            : 'bg-white/80 text-[#2C3E50] hover:bg-white'
          }`}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Book card Container */}
        <div className="w-full max-w-6xl h-full flex items-center justify-center py-0 md:py-2 px-2 md:px-0">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPage}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1]
              }}
              className={`w-full rounded-none md:rounded-xl shadow-none md:shadow-2xl flex flex-col h-full md:max-h-[820px] overflow-hidden ${['cover', 'intro'].includes(currentDevotion.type) ? 'border-none shadow-none bg-transparent' : 'bg-white border-x md:border border-[#DDE2D9]'}`}
            >
              <div className="flex flex-col h-full md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#DDE2D9] overflow-y-auto md:overflow-hidden">
                
                {/* Main Content Area (Left/Center) */}
                <div className="flex-1 p-6 md:p-12 md:overflow-y-auto custom-scrollbar relative">
                   <button 
                    onClick={() => toggleBookmark(currentDevotion.id)}
                    className={`absolute top-8 right-8 md:top-6 md:right-12 z-20 transition-all p-3 rounded-full shadow-lg border border-white/50 backdrop-blur-md ${bookmarks.includes(currentDevotion.id) ? 'bg-olive text-white border-olive' : 'bg-white/80 text-stone-500 hover:text-olive'}`}
                    title={bookmarks.includes(currentDevotion.id) ? "Remove Bookmark" : "Bookmark Page"}
                   >
                     <Bookmark size={20} fill={bookmarks.includes(currentDevotion.id) ? "currentColor" : "none"} />
                   </button>
                   {renderPage(
                     currentDevotion, 
                     userNotes[currentDevotion.id] || '', 
                     (val) => handleNoteChange(currentDevotion.id, val), 
                     getImageUrl,
                     handleOpenBible,
                     highlights[currentDevotion.id] || [],
                     handleAddHighlight,
                     handleRemoveHighlight,
                     isHighlightMode,
                     selectedColor
                   )}

                   {/* Mobile Navigation Arrows (Inner card) */}
                   <div className="flex md:hidden items-center justify-between mt-12 pb-8">
                      <button 
                        onClick={() => paginate(-1)}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 text-xs font-bold text-hunter disabled:opacity-30"
                      >
                        <ChevronLeft size={20} /> PREV
                      </button>
                      <span className="text-[10px] font-bold text-stone-300 tracking-widest">{currentPage + 1} / {totalPages}</span>
                      <button 
                        onClick={() => paginate(1)}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center gap-2 text-xs font-bold text-hunter disabled:opacity-30"
                      >
                        NEXT <ChevronRight size={20} />
                      </button>
                   </div>
                </div>

                {/* Right Sidebar Area (Theme Aesthetic) */}
                <div className={`shrink-0 hidden md:flex md:w-[320px] bg-sage-darker p-8 pb-16 flex-col gap-10 overflow-y-auto custom-scrollbar ${['cover', 'intro', 'monthly_prayer'].includes(currentDevotion.type) ? '!hidden' : ''}`}>
                  
                  {/* Context Info */}
                  {currentDevotion.type === 'daily' && (
                    <div className="space-y-12">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                           <BookOpen size={18} className="text-hunter" />
                           <p className="text-[11px] font-bold text-hunter uppercase tracking-widest leading-none">SCRIPTURE FOCUS</p>
                        </div>
                        <div className="flex flex-col gap-3 mb-3">
                          <p className="text-base font-sans font-bold text-[#1A1A1A]">{currentDevotion.scriptureRef}</p>
                          <button 
                            onClick={() => handleOpenBible(currentDevotion.scriptureRef)}
                            className="w-fit flex items-center gap-2 text-[10px] font-bold text-hunter uppercase tracking-widest hover:opacity-70 transition-all bg-hunter/5 px-3 py-2 rounded-lg border border-hunter/10"
                          >
                            Go to full passage
                            <ExternalLink size={10} />
                          </button>
                        </div>
                        <p className="text-base font-serif italic text-[#2C3E2F] line-clamp-4 leading-relaxed">
                          {formatScriptureText(currentDevotion.scriptureText)}
                        </p>
                      </div>

                    </div>
                  )}

                  {/* Journal/Note Preview in sidebar if needed or just logo */}
                  <div className="mt-auto pt-8 flex flex-col items-center justify-center opacity-30 gap-2">
                     <div className="w-12 h-12 border-2 border-hunter rounded-full flex items-center justify-center">
                        <Leaf size={24} className="text-hunter" />
                     </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow Navigation - Hidden on mobile */}
        <button 
          onClick={() => paginate(1)}
          disabled={currentPage === totalPages - 1}
          className={`absolute right-4 md:right-8 z-30 w-12 h-12 hidden md:flex items-center justify-center rounded-full transition-all duration-300 text-white shadow-xl ${
            currentPage === totalPages - 1 
            ? 'opacity-0 pointer-events-none' 
            : 'bg-olive hover:bg-olive/90 hover:scale-110 active:scale-95 shadow-olive/20'
          }`}
        >
          <ChevronRight size={24} />
        </button>
      </main>

      <AnimatePresence>
        {showBible && (
          <BibleViewer 
            onClose={() => {
              setShowBible(false);
              setBibleQuery(undefined);
            }} 
            initialQuery={bibleQuery}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function renderPage(
  devotion: Devotion, 
  note: string, 
  onNoteChange: (val: string) => void, 
  getImageUrl: (day: number | undefined) => string,
  onOpenBible: (ref?: string) => void,
  highlights: Array<{ text: string, id: string, paraIndex: number, color?: string }>,
  onAddHighlight: (devId: string, text: string, idx: number) => void,
  onRemoveHighlight: (id: string) => void,
  isHighlightMode: boolean,
  selectedColor: string
) {
  const imageUrl = getImageUrl(devotion.day);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Immediate fallback to a highly reliable nature photo if a specific one fails
    e.currentTarget.src = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200';
    e.currentTarget.onerror = null; // Prevent infinite loops
  };

  return (
    <div className="flex flex-col min-h-full relative overflow-hidden">
      {/* Background Texture/Image for all pages */}
      <img 
        src={imageUrl}
        alt=""
        loading="eager"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          (devotion.type === 'cover' || devotion.type === 'intro') ? 'opacity-30 blur-[2px]' : 'opacity-[0.02] blur-[1px]'
        }`}
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
      
      <div className="relative z-10 flex-1 flex flex-col">
        {(() => {
          switch (devotion.type) {
            case 'cover':
              return (
                <div className="flex flex-col items-center justify-center min-h-full text-center py-12 relative overflow-hidden">
                  <div className="p-12 relative z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-10"
                    >
                      <span className="font-serif italic text-5xl text-hunter/70">When</span>
                    </motion.div>
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-serif text-4xl sm:text-6xl md:text-9xl font-light text-[#1A1A1A] leading-tight mb-8"
                    >
                      GOD WRITES
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <span className="font-serif italic text-xl sm:text-2xl text-stone-400 mb-2 uppercase tracking-widest leading-none">your</span>
                      <span className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[0.3em] sm:tracking-[0.5em] text-hunter font-light">STORY</span>
                    </motion.div>
                    <div className="mt-20 w-32 h-[2px] bg-hunter/40 mx-auto"></div>
                    <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.6em] text-hunter">Olive Branch Ministries</p>
                  </div>
                </div>
              );
            case 'intro':
              return (
                <div className="flex flex-col items-center justify-center min-h-full max-w-lg mx-auto text-center px-6">
                   <div className="relative z-10">
                      <div className="mb-14 text-hunter/40 flex justify-center">
                          <Leaf size={80} strokeWidth={1} />
                      </div>
                      <div className="font-serif italic text-3xl md:text-5xl leading-relaxed text-[#1A1A1A] mb-10 relative">
                        <Quote className="absolute -top-8 -left-16 text-stone-200/50" size={100} />
                        <HighlightableText 
                          text={formatScriptureText(devotion.scriptureText || '')}
                          highlights={highlights}
                          onRemove={onRemoveHighlight}
                          isHighlightMode={isHighlightMode}
                          onAdd={onAddHighlight}
                          paraIndex={0}
                          devotionId={devotion.id}
                          selectedColor={selectedColor}
                        />
                      </div>
                      <div className="h-[2px] w-20 bg-hunter/30 mb-8 mx-auto"></div>
                       <div className="flex flex-col items-center gap-4">
                          <p className="font-sans text-[12px] font-bold uppercase tracking-[0.5em] text-hunter italic">
                            — {devotion.scriptureRef}
                          </p>
                       </div>
                   </div>
                </div>
              );
            case 'monthly_prayer':
              return (
                <div className="flex flex-col min-h-full max-w-3xl mx-auto py-6 overflow-y-auto">
                  <div className="mb-16 relative">
                    <span className="text-[160px] font-serif font-bold text-stone-200/50 absolute -top-24 -left-16 -z-10 select-none">{devotion.month?.charAt(0)}</span>
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.5em] mb-4">{devotion.month}</p>
                    <h1 className="text-4xl md:text-7xl font-serif font-light text-[#1A1A1A] leading-tight tracking-tight">{devotion.title}</h1>
                    <div className="mt-10 h-1.5 w-16 bg-hunter shadow-sm"></div>
                  </div>
                  <div className="space-y-12 leading-relaxed text-[#1A1A1A] font-serif pr-6 mb-20">
                    {devotion.body?.map((p, i) => {
                      return (
                        <p key={i} className={`text-2xl italic opacity-100 font-medium ${i === 0 ? 'first-letter:text-7xl first-letter:text-hunter first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:leading-none' : ''}`}>
                          <HighlightableText 
                            text={p}
                            highlights={highlights}
                            onRemove={onRemoveHighlight}
                            isHighlightMode={isHighlightMode}
                            onAdd={onAddHighlight}
                            paraIndex={i}
                            devotionId={devotion.id}
                            selectedColor={selectedColor}
                          />
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            case 'daily':
              return (
                <div className="flex flex-col min-h-full">
                  <div className="relative h-[220px] md:h-[400px] w-full rounded-2xl overflow-hidden mb-16 shadow-lg border border-white/20 bg-stone-100">
                     <img 
                       src={imageUrl}
                       alt=""
                       className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-10000 ease-linear"
                       referrerPolicy="no-referrer"
                       onError={handleImageError}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-8 h-[2px] bg-hunter shadow-sm"></div>
                           <p className="text-[11px] font-bold text-white/90 uppercase tracking-[0.5em] leading-none">{devotion.month} {devotion.day}</p>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-serif text-white leading-tight font-light drop-shadow-md">{devotion.title}</h1>
                     </div>
                  </div>

                  <div className="max-w-3xl mx-auto w-full space-y-20 pb-24 px-4 sm:px-0">
                    <section className="relative">
                      {/* Desktop only scripture display */}
                      <div className="hidden md:block">
                        <div className="flex flex-col mb-8">
                          <div className="flex items-center gap-4 mb-2">
                            <BookOpen size={24} className="text-hunter" />
                            <h3 className="text-[11px] font-bold text-hunter uppercase tracking-[0.4em]">{devotion.month} {devotion.day}</h3>
                          </div>
                          <h3 className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.4em] ml-10">TODAY'S SCRIPTURE</h3>
                        </div>
                        <div className="pl-8 border-l-4 border-hunter/20 py-2">
                          <p className="text-xl font-sans font-bold text-[#1A1A1A] mb-4">{devotion.scriptureRef}</p>
                          <p className="font-serif italic text-2xl text-[#1A1A1A] leading-[1.6] font-medium">
                          <HighlightableText 
                            text={formatScriptureText(devotion.scriptureText || '')}
                            highlights={highlights}
                            onRemove={onRemoveHighlight}
                            isHighlightMode={isHighlightMode}
                            onAdd={onAddHighlight}
                            paraIndex={100} // Unique index for scripture focus
                            devotionId={devotion.id}
                            selectedColor={selectedColor}
                          />
                          </p>
                        </div>
                      </div>

                      {/* Mobile-only Scripture Focus (Green Section) */}
                      <div className="mt-12 md:hidden bg-sage-darker/40 -mx-4 sm:-mx-0 px-6 py-12 rounded-[2rem] border border-hunter/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                           <BookOpen size={18} className="text-hunter" />
                           <p className="text-[11px] font-bold text-hunter uppercase tracking-widest leading-none">SCRIPTURE FOCUS</p>
                        </div>
                        <div className="flex flex-col gap-4 mb-6">
                          <p className="text-3xl font-serif font-bold text-[#1A1A1A]">{devotion.scriptureRef}</p>
                          <button 
                            onClick={() => onOpenBible(devotion.scriptureRef)}
                            className="w-fit flex items-center gap-2 text-[11px] font-bold text-hunter uppercase tracking-widest hover:bg-hunter hover:text-white transition-all bg-white/60 px-5 py-3 rounded-xl border border-hunter/10 shadow-sm"
                          >
                            Go to full passage
                            <ExternalLink size={12} />
                          </button>
                        </div>
                        <p className="text-2xl font-serif italic text-[#2C3E2F] leading-relaxed">
                          <HighlightableText 
                            text={formatScriptureText(devotion.scriptureText || '')}
                            highlights={highlights}
                            onRemove={onRemoveHighlight}
                            isHighlightMode={isHighlightMode}
                            onAdd={onAddHighlight}
                            paraIndex={100} // Match desktop index
                            devotionId={devotion.id}
                            selectedColor={selectedColor}
                          />
                        </p>
                        <div className="mt-12 flex flex-col items-center justify-center opacity-30 gap-2">
                           <Leaf size={44} className="text-hunter" />
                        </div>
                      </div>
                    </section>

            {/* Devotional Thought */}
            <section>
              <div className="flex items-center gap-4 mb-10">
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.4em]">DEVOTIONAL THOUGHT</h3>
              </div>
              <div className="space-y-10 font-serif text-[1.4rem] leading-[1.8] text-[#1A1A1A] tracking-wide font-medium">
                {devotion.body?.map((p, i) => {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      <HighlightableText 
                        text={p}
                        highlights={highlights}
                        onRemove={onRemoveHighlight}
                        isHighlightMode={isHighlightMode}
                        onAdd={onAddHighlight}
                        paraIndex={i}
                        devotionId={devotion.id}
                        selectedColor={selectedColor}
                      />
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Prayer */}
            <section className="bg-sage/10 p-10 rounded-[2rem] border border-hunter/10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <HandHeart size={24} className="text-hunter" />
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.4em]">PRAYER</h3>
              </div>
              <div className="font-serif italic text-2xl md:text-3xl text-[#1A2E1C] space-y-6 leading-relaxed font-medium">
                 {devotion.prayer?.map((p, i) => (
                   <p key={i}>
                     — <HighlightableText 
                        text={p}
                        highlights={highlights}
                        onRemove={onRemoveHighlight}
                        isHighlightMode={isHighlightMode}
                        onAdd={onAddHighlight}
                        paraIndex={100 + i} // Using 100+ for prayer paragraphs
                        devotionId={devotion.id}
                        selectedColor={selectedColor}
                      />
                   </p>
                 ))}
              </div>
            </section>

            {/* Reflection Area - JOURNAL SECTION */}
            <section className="pt-12 border-t border-stone-100">
               <div className="flex items-center gap-4 mb-12">
                  <Pencil size={24} className="text-hunter" />
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.4em]">TODAY'S REFLECTION</h3>
               </div>
               <div className="bg-[#FAFBF8] border border-hunter/20 rounded-2xl p-10 shadow-inner-sm">
                  <div className="mb-10">
                    <p className="font-serif italic text-2xl text-[#1A1A1A] mb-2 font-bold leading-relaxed">
                      {devotion.question || "What truth from today's devotion that you want to remember?"}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      placeholder="Type your thoughts here..."
                      className="w-full min-h-[220px] bg-transparent border-none focus:ring-0 font-serif text-xl text-olive/80 leading-[32px] italic placeholder:text-stone-300 resize-none p-0 z-10 relative"
                    />
                    {/* Visual Lines */}
                    <div className="absolute inset-0 pointer-events-none -z-0">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-8 border-b border-olive/10"></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 flex items-center justify-end gap-3 text-[10px] font-bold text-hunter uppercase tracking-[0.2em] opacity-50">
                     <div className="flex items-center gap-1">
                        <motion.span 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-hunter mr-1"
                        ></motion.span>
                        AUTOSAVE ACTIVE
                     </div>
                  </div>
               </div>
            </section>

            {/* Daily Quote */}
            {devotion.quote && (
              <section className="pt-16 mt-16 border-t border-stone-100 text-center pb-12">
                 <div className="flex justify-center mb-8">
                   <Quote size={40} className="text-hunter/20 mx-auto mb-8" />
                 </div>
                 <p className="font-serif italic text-3xl text-[#1A1A1A] leading-relaxed mb-6 font-bold max-w-2xl mx-auto px-4">
                   "{devotion.quote}"
                 </p>
                 <p className="text-[11px] font-bold text-hunter uppercase tracking-[0.4em]">
                   — {devotion.quoteAuthor}
                 </p>
              </section>
            )}
          </div>
        </div>
                );
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
}

function HighlightableText({ 
  text, 
  highlights, 
  onRemove, 
  isHighlightMode, 
  onAdd, 
  paraIndex, 
  devotionId,
  selectedColor
}: { 
  text: string, 
  highlights: Array<{text: string, id: string, paraIndex: number, color?: string}>, 
  onRemove: (id: string) => void,
  isHighlightMode: boolean,
  onAdd: (devId: string, text: string, idx: number) => void,
  paraIndex: number,
  devotionId: string,
  selectedColor: string
}) {
  const handleSelection = (e: React.SyntheticEvent) => {
    if (!isHighlightMode) return;
    
    const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length >= 2) {
        // Robust matching for mobile
        const clean = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const cleanedPara = clean(text);
        const cleanedSelection = clean(selectedText);
        
        const normIndex = cleanedPara.indexOf(cleanedSelection);
        if (normIndex !== -1) {
          const lowerText = text.toLowerCase();
          const lowerSelect = selectedText.toLowerCase();
          const actualIndex = lowerText.indexOf(lowerSelect);
          
          if (actualIndex !== -1) {
            const actualTextFromPara = text.substring(actualIndex, actualIndex + selectedText.length);
            onAdd(devotionId, actualTextFromPara, paraIndex);
            
            // NEVER clear selection on mobile as it conflicts with native UI and results in 'vanishing'
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (!isMobile) {
              try { selection.removeAllRanges(); } catch(err) {}
            }
          }
        }
      }
    };

    // Immediate check + multiple delayed checks for mobile settling
    checkSelection();
    setTimeout(checkSelection, 100);
    setTimeout(checkSelection, 300);
    setTimeout(checkSelection, 800);
  };

  // Logic to split by BOTH user highlights AND the existing quote pattern
  const paraHighlights = highlights.filter(h => h.paraIndex === paraIndex || h.paraIndex === -1);
  
  const quoteMarkers = text.match(/"[^"]*"/g) || [];
  const userMarkers = paraHighlights.map(h => h.text);
  
  const allMarkers = [...new Set([...quoteMarkers, ...userMarkers])].sort((a, b) => b.length - a.length);

  const SELECTION_CLASSES: Record<string, string> = {
    yellow: 'selection:bg-[#FDE047]/80',
    blue: 'selection:bg-[#93C5FD]/80',
    green: 'selection:bg-[#86EFAC]/80',
    purple: 'selection:bg-[#D8B4FE]/80',
    pink: 'selection:bg-[#F9A8D4]/80',
    brown: 'selection:bg-[#D2B48C]/80'
  };
  
  const selectionClass = SELECTION_CLASSES[selectedColor] || SELECTION_CLASSES.yellow;
  
  if (allMarkers.length === 0) {
    return (
      <span 
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className={`${selectionClass} relative`}
        style={{ 
          userSelect: 'text', 
          WebkitUserSelect: 'text',
          WebkitTapHighlightColor: 'rgba(0,0,0,0)',
          display: 'inline'
        }}
      >
        {text}
      </span>
    );
  }

  const escaped = allMarkers.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span 
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
      className={`${selectionClass} relative`}
      style={{ 
        userSelect: 'text', 
        WebkitUserSelect: 'text',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        display: 'inline'
      }}
    >
      {parts.map((part, i) => {
        // 1. Check for USER HIGHLIGHT first (Precedence)
        const matchingHighlight = paraHighlights.find(h => h.text.toLowerCase() === part.toLowerCase());
        if (matchingHighlight) {
          const colorCfg = HIGHLIGHT_COLORS.find(c => c.id === matchingHighlight.color) || HIGHLIGHT_COLORS[0];
          return (
            <mark 
              key={`${matchingHighlight.id}-${i}`} 
              className={`${colorCfg.class} rounded px-0.5 cursor-pointer transition-colors relative group`}
              onClick={(e) => {
                if (isHighlightMode) {
                  e.stopPropagation();
                  onRemove(matchingHighlight.id);
                }
              }}
            >
              {part}
              {isHighlightMode && (
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none uppercase font-bold whitespace-nowrap">
                  Remove Highlight
                </span>
              )}
            </mark>
          );
        }

        // 2. Check for decorative quote pattern
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={i} className="text-hunter font-bold italic">{part}</span>;
        }
        
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
