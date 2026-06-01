import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Book as BookIcon, 
  X, 
  Loader2, 
  ArrowLeft,
  ChevronDown,
  Info
} from 'lucide-react';

interface Translation {
  id: string;
  name: string;
  language: string;
}

interface Verse {
  number: number;
  content: string;
  type: string;
}

interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

interface BibleBook {
  id: string;
  name: string;
  chapters: number;
}

const BIBLE_BOOKS: BibleBook[] = [
  { id: 'GEN', name: 'Genesis', chapters: 50 }, { id: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', chapters: 27 }, { id: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34 }, { id: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 'JDG', name: 'Judges', chapters: 21 }, { id: 'RUT', name: 'Ruth', chapters: 4 },
  { id: '1SA', name: '1 Samuel', chapters: 31 }, { id: '2SA', name: '2 Samuel', chapters: 24 },
  { id: '1KI', name: '1 Kings', chapters: 22 }, { id: '2KI', name: '2 Kings', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', chapters: 29 }, { id: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 'EZR', name: 'Ezra', chapters: 10 }, { id: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 'EST', name: 'Esther', chapters: 10 }, { id: 'JOB', name: 'Job', chapters: 42 },
  { id: 'PSA', name: 'Psalms', chapters: 150 }, { id: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12 }, { id: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', chapters: 66 }, { id: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', chapters: 5 }, { id: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 'DAN', name: 'Daniel', chapters: 12 }, { id: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 'JOL', name: 'Joel', chapters: 3 }, { id: 'AMO', name: 'Amos', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', chapters: 1 }, { id: 'JON', name: 'Jonah', chapters: 4 },
  { id: 'MIC', name: 'Micah', chapters: 7 }, { id: 'NAM', name: 'Nahum', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', chapters: 3 }, { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 'HAG', name: 'Haggai', chapters: 2 }, { id: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 'MAL', name: 'Malachi', chapters: 4 }, { id: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 'MRK', name: 'Mark', chapters: 16 }, { id: 'LUK', name: 'Luke', chapters: 24 },
  { id: 'JHN', name: 'John', chapters: 21 }, { id: 'ACT', name: 'Acts', chapters: 28 },
  { id: 'ROM', name: 'Romans', chapters: 16 }, { id: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', chapters: 13 }, { id: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', chapters: 6 }, { id: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 'COL', name: 'Colossians', chapters: 4 }, { id: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', chapters: 3 }, { id: '1TI', name: '1 Timothy', chapters: 6 },
  { id: '2TI', name: '2 Timothy', chapters: 4 }, { id: 'TIT', name: 'Titus', chapters: 3 },
  { id: 'PHM', name: 'Philemon', chapters: 1 }, { id: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 'JAS', name: 'James', chapters: 5 }, { id: '1PE', name: '1 Peter', chapters: 5 },
  { id: '2PE', name: '2 Peter', chapters: 3 }, { id: '1JN', name: '1 John', chapters: 5 },
  { id: '2JN', name: '2 John', chapters: 1 }, { id: '3JN', name: '3 John', chapters: 1 },
  { id: 'JUD', name: 'Jude', chapters: 1 }, { id: 'REV', name: 'Revelation', chapters: 22 }
];

// Constants for API mapping and translation support
const BOLLS_TRANSLATIONS = [
  'NIV', 'NLT', 'ESV', 'NKJV', 'NASB', 'CSB', 'NRSV', 'RSV', 'AMP', 'MSG', 
  'KJV', 'GNV', 'DRB', 'WEB', 'BBE'
];

const BOLLS_ID_MAP: Record<string, string> = {
  'NRSV': 'NRSVCE',
  'RSV': 'RSVCE',
  'CSB': 'CSB'
};

const BIBLE_API_TRANSLATIONS = ['KJV', 'BBE', 'WEB', 'ALMEIDA', 'RCCV'];

const BOOK_MAP: Record<string, string> = {
  'gen': 'GEN', 'genesis': 'GEN', 'gn': 'GEN', 'ex': 'EXO', 'exod': 'EXO', 'exodus': 'EXO',
  'lev': 'LEV', 'levit': 'LEV', 'leviticus': 'LEV', 'lv': 'LEV', 'num': 'NUM', 'numb': 'NUM', 'numbers': 'NUM', 'nm': 'NUM',
  'deut': 'DEU', 'deu': 'DEU', 'deuteronomy': 'DEU', 'dt': 'DEU', 'josh': 'JOS', 'joshua': 'JOS',
  'judg': 'JDG', 'judges': 'JDG', 'ruth': 'RUT', '1sa': '1SA', '1 samuel': '1SA', '1sam': '1SA',
  '2sa': '2SA', '2 samuel': '2SA', '2sam': '2SA', '1ki': '1KI', '1 kings': '1KI', '1kings': '1KI', '2ki': '2KI', '2 kings': '2KI', '2kings': '2KI',
  '1ch': '1CH', '1 chronicles': '1CH', '1chron': '1CH', '2ch': '2CH', '2 chronicles': '2CH', '2chron': '2CH',
  'ezra': 'EZR', 'neh': 'NEH', 'nehemiah': 'NEH', 'esth': 'EST', 'esther': 'EST',
  'job': 'JOB', 'ps': 'PSA', 'psalm': 'PSA', 'psalms': 'PSA', 'prov': 'PRO', 'proverbs': 'PRO', 'pr': 'PRO',
  'eccl': 'ECC', 'ecclesiates': 'ECC', 'ecclesiastes': 'ECC', 'ecc': 'ECC', 'song': 'SNG', 'song of solomon': 'SNG', 'sng': 'SNG',
  'isa': 'ISA', 'isaiah': 'ISA', 'is': 'ISA', 'jer': 'JER', 'jeremiah': 'JER', 'jr': 'JER', 'lam': 'LAM', 'lamentations': 'LAM',
  'ezek': 'EZK', 'ezekiel': 'EZK', 'ez': 'EZK', 'dan': 'DAN', 'daniel': 'DAN', 'dn': 'DAN', 'hos': 'HOS', 'hosea': 'HOS',
  'joel': 'JOL', 'amos': 'AMO', 'obad': 'OBA', 'obadiah': 'OBA', 'jon': 'JON', 'jonah': 'JON',
  'mic': 'MIC', 'micah': 'MIC', 'nah': 'NAM', 'nahum': 'NAM', 'hab': 'HAB', 'habakkuk': 'HAB',
  'zeph': 'ZEP', 'zephaniah': 'ZEP', 'zp': 'ZEP', 'hag': 'HAG', 'haggai': 'HAG', 'zec': 'ZEC', 'zechariah': 'ZEC',
  'mal': 'MAL', 'malachi': 'MAL', 'matt': 'MAT', 'matthew': 'MAT', 'mt': 'MAT', 'mark': 'MRK', 'mk': 'MRK', 'luke': 'LUK', 'lk': 'LUK',
  'john': 'JHN', 'jn': 'JHN', 'acts': 'ACT', 'ac': 'ACT', 'rom': 'ROM', 'romans': 'ROM', 'ro': 'ROM', 'rm': 'ROM', 
  '1cor': '1CO', '1 corinthians': '1CO', '1 co': '1CO', '1corin': '1CO',
  '2cor': '2CO', '2 corinthians': '2CO', '2 co': '2CO', '2corin': '2CO', 'gal': 'GAL', 'galatians': 'GAL', 'ga': 'GAL', 'eph': 'EPH', 'ephesians': 'EPH',
  'phil': 'PHP', 'philippians': 'PHP', 'php': 'PHP', 'col': 'COL', 'colossians': 'COL', 'cl': 'COL',
  '1thess': '1TH', '1 thessalonians': '1TH', '1th': '1TH', '2thess': '2TH', '2 thessalonians': '2TH', '2th': '2TH',
  '1tim': '1TI', '1 timothy': '1TI', '1ti': '1TI', '2tim': '2TI', '2 timothy': '2TI', '2ti': '2TI',
  'tit': 'TIT', 'titus': 'TIT', 'philemon': 'PHM', 'phm': 'PHM', 'heb': 'HEB', 'hebrews': 'HEB', 'hb': 'HEB', 'jas': 'JAS', 'james': 'JAS',
  '1pet': '1PE', '1 peter': '1PE', '1pe': '1PE', '2pet': '2PE', '2 peter': '2PE', '2pe': '2PE', '1jn': '1JN', '1john': '1JN', '1 john': '1JN',
  '2jn': '2JN', '2john': '2JN', '2 john': '2JN', '3jn': '3JN', '3john': '3JN', '3 john': '3JN', 'jude': 'JUD',
  'rev': 'REV', 'revelation': 'REV', 'rv': 'REV'
};

// Helper to strip HTML tags and Strong's numbers from Bible text
const stripTags = (text: string) => {
  if (!text) return '';
  return text
    // Remove Strong's numbers (e.g., <S>7225</S>)
    .replace(/<S>\d+<\/S>/g, '')
    // Remove HTML line breaks and other tags
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>?/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

export default function BibleViewer({ onClose, initialQuery }: { onClose: () => void, initialQuery?: string }) {
  const [translations] = useState<Translation[]>([
    { id: 'NIV', name: 'New International Version', language: 'English' },
    { id: 'NLT', name: 'New Living Translation', language: 'English' },
    { id: 'ESV', name: 'English Standard Version', language: 'English' },
    { id: 'NKJV', name: 'New King James Version', language: 'English' },
    { id: 'NASB', name: 'New American Standard Bible', language: 'English' },
    { id: 'CSB', name: 'Christian Standard Bible (CSB)', language: 'English' },
    { id: 'MSG', name: 'The Message', language: 'English' },
    { id: 'AMP', name: 'Amplified Bible', language: 'English' },
    { id: 'NRSV', name: 'New Revised Standard Version (CE)', language: 'English' },
    { id: 'RSV', name: 'Revised Standard Version', language: 'English' },
    { id: 'KJV', name: 'King James Version (1769)', language: 'English' },
    { id: 'GNV', name: 'Geneva Bible (1560)', language: 'English' },
    { id: 'DRB', name: 'Douay-Rheims Bible (1582)', language: 'English' },
    { id: 'WEB', name: 'World English Bible', language: 'English' },
    { id: 'BBE', name: 'Bible in Basic English', language: 'English' }
  ]);
  const [selectedTranslation, setSelectedTranslation] = useState('NIV');

  const [books] = useState<BibleBook[]>(BIBLE_BOOKS);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'books' | 'chapters' | 'reading' | 'search'>(initialQuery ? 'search' : 'books');

  const resolveReference = (query: string) => {
    const q = query.trim().toLowerCase();
    // Improved regex to handle abbreviations, book numbers, and optional verse ranges
    // e.g. "John 3:16", "1 Cor 13:4-8", "Ps. 23:1", "Genesis 1", "Song of Solomon 2:1"
    const match = q.match(/^(([1-3])?\s?[A-Za-z]+(\s[A-Za-z]+)*)\.?\s*(\d+)(?::(\d+)(?:-(\d+))?)?/);
    if (!match) return null;

    const bookPart = match[1].replace(/\./g, '').trim();
    let bookId = BOOK_MAP[bookPart];
    
    if (!bookId) {
      // Fallback: search by name or start with
      const book = books.find(b => 
        b.name.toLowerCase() === bookPart || 
        b.id.toLowerCase() === bookPart ||
        b.name.toLowerCase().startsWith(bookPart)
      );
      if (book) bookId = book.id;
    }
    
    if (!bookId) return null;
    
    const chapter = parseInt(match[4]);
    const startVerse = match[5] ? parseInt(match[5]) : null;
    const endVerse = match[6] ? parseInt(match[6]) : startVerse;
    
    const targetBook = books.find(b => b.id === bookId);
    return { book: targetBook, chapter, startVerse, endVerse };
  };

  // Trigger search update when translation changes if in search view
  useEffect(() => {
    if (view === 'search' && searchQuery) {
      executeSearch(searchQuery);
    }
  }, [selectedTranslation, view]); // Removed searchQuery from deps to avoid double trigger during typing/enter

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setView('search');
    try {
      const resolved = resolveReference(query);
      
      if (resolved && resolved.book) {
        setSearchResults([{
          reference: query,
          text: "Searching the Scriptures...",
          loading: true
        }]);

        const book = resolved.book;
        const chapterNum = resolved.chapter;
        const bookIndex = books.indexOf(book) + 1;
        
        // Try bolls.life first
        try {
          const bollsId = BOLLS_ID_MAP[selectedTranslation] || selectedTranslation;
          const bollsRes = await fetch(`https://bolls.life/get-chapter/${bollsId}/${bookIndex}/${chapterNum}/`);
          if (bollsRes.ok) {
            const bollsData = await bollsRes.json();
            if (Array.isArray(bollsData) && bollsData.length > 0) {
              const startVerse = resolved.startVerse;
              const endVerse = resolved.endVerse || startVerse;
              
              const filteredData = startVerse 
                ? bollsData.filter((v: any) => v.verse >= startVerse && v.verse <= (endVerse || startVerse))
                : bollsData;

              if (filteredData.length > 0) {
                setSearchResults([{
                  reference: startVerse ? (endVerse && endVerse !== startVerse ? `${book.name} ${chapterNum}:${startVerse}-${endVerse}` : `${book.name} ${chapterNum}:${startVerse}`) : `${book.name} ${chapterNum}`,
                  text: filteredData.map((v: any) => stripTags(v.text)).join(' '),
                  verses: filteredData.map((v: any) => ({ verse: v.verse, text: stripTags(v.text) }))
                }]);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Bolls.life search fetch failed');
        }

        // Fallback to bible-api.com only for supported versions
        if (BIBLE_API_TRANSLATIONS.includes(selectedTranslation)) {
          const bibleApiRes = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=${selectedTranslation.toLowerCase()}`);
          if (bibleApiRes.ok) {
            const data = await bibleApiRes.json();
            if (data.verses) {
              setSearchResults([{
                reference: data.reference,
                text: data.text,
                verses: data.verses
              }]);
              return;
            }
          }
        }
        
        // If it's a specialty version and Bolls failed, show a helpful message
        setSearchResults([{
          info: true,
          text: `The ${selectedTranslation} version could not be loaded at this moment. Please try another translation or check your connection.`
        }]);
      } else {
        setSearchResults([{
            info: true,
            text: "Full-text search is coming soon. Please enter a reference (e.g., 'John 3:16')."
        }]);
      }
    } catch (error) {
       console.error('Search error:', error);
       setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      const resolved = resolveReference(initialQuery);
      if (resolved && resolved.book) {
        setSelectedBook(resolved.book);
        setSelectedChapter(resolved.chapter);
        if (resolved.startVerse) {
          const verses = [];
          for (let i = resolved.startVerse; i <= (resolved.endVerse || resolved.startVerse); i++) {
            verses.push(i);
          }
          setHighlightedVerses(verses);
        }
        setView('reading');
      } else {
        executeSearch(initialQuery);
      }
    }
  }, [initialQuery]);

  // Fetch chapter content via bolls.life or bible-api.com
  useEffect(() => {
    const fetchChapter = async () => {
      if (!selectedTranslation || !selectedBook || selectedChapter === null) return;
      setLoading(true);
      setChapterContent(null); // Clear old content immediately
      try {
        // Force bolls.life for requested versions if available
        const bookIndex = books.indexOf(selectedBook) + 1;
        const bollsId = BOLLS_ID_MAP[selectedTranslation] || selectedTranslation;
        const bollsUrl = `https://bolls.life/get-chapter/${bollsId}/${bookIndex}/${selectedChapter}/`;
        
        const bollsRes = await fetch(bollsUrl);
        if (bollsRes.ok) {
          const data = await bollsRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setChapterContent({
              book: selectedBook.name,
              chapter: selectedChapter,
              verses: data.map((v: any) => ({
                number: v.verse,
                content: stripTags(v.text),
                type: 'verse'
              }))
            });
            setLoading(false);
            return;
          }
        }
        
        // Fallback to bible-api.com if bolls fails AND it's a supported version
        if (BIBLE_API_TRANSLATIONS.includes(selectedTranslation)) {
          const fallbackRes = await fetch(`https://bible-api.com/${selectedBook.name}+${selectedChapter}?translation=${selectedTranslation.toLowerCase()}`);
          const fallbackData = await fallbackRes.json();
          
          if (fallbackData.verses) {
            setChapterContent({
              book: selectedBook.name,
              chapter: selectedChapter,
              verses: fallbackData.verses.map((v: any) => ({
                number: v.verse,
                content: v.text,
                type: 'verse'
              }))
            });
            setLoading(false);
            return;
          }
        }

        // If all fails
        setChapterContent({
          book: selectedBook.name,
          chapter: selectedChapter,
          verses: [{
            number: 1,
            content: `The ${selectedTranslation} version is currently unavailable for ${selectedBook.name} ${selectedChapter}. This may be because the version does not contain this book (common with historical or Greek manuscripts) or the server is temporarily unresponsive.`,
            type: 'verse'
          }]
        });
      } catch (error) {
        console.error('Error fetching chapter:', error);
      } finally {
        setLoading(false);
      }
    };
    if (view === 'reading' && selectedBook && selectedChapter) {
      fetchChapter();
    }
  }, [selectedTranslation, selectedBook, selectedChapter, view, books]);

  useEffect(() => {
    if (highlightedVerses.length > 0 && view === 'reading' && chapterContent) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const firstVerseEl = document.getElementById(`verse-${highlightedVerses[0]}`);
        if (firstVerseEl) {
          firstVerseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [highlightedVerses, view, chapterContent]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="font-serif italic">Opening the Word...</p>
        </div>
      );
    }

    switch (view) {
      case 'books':
        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <h2 className="text-2xl font-serif font-bold text-hunter mb-6">Books of the Bible</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {books.map(book => (
                <button
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book);
                    setView('chapters');
                    setHighlightedVerses([]);
                  }}
                  className="p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-olive hover:bg-stone-100 transition-all text-left group"
                >
                  <p className="font-serif font-bold text-[#1A1A1A] group-hover:text-hunter transition-colors">{book.name}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'chapters':
        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => setView('books')} className="p-2 hover:bg-stone-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-serif font-bold text-hunter">{selectedBook?.name}</h2>
            </div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Select Chapter</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: selectedBook?.chapters || 0 }, (_, i) => i + 1).map(chap => (
                <button
                  key={chap}
                  onClick={() => {
                    setSelectedChapter(chap);
                    setView('reading');
                    setHighlightedVerses([]);
                  }}
                  className="aspect-square flex items-center justify-center bg-stone-50 rounded-lg border border-stone-100 hover:border-olive hover:bg-white hover:shadow-sm transition-all font-bold text-stone-600"
                >
                  {chap}
                </button>
              ))}
            </div>
          </div>
        );
      case 'reading':
        return (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#FDFCF8] custom-scrollbar">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-12 border-b border-stone-100 pb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('chapters')} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-hunter">{selectedBook?.name} {selectedChapter}</h2>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {translations.find(t => t.id === selectedTranslation)?.name || selectedTranslation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    disabled={selectedChapter === 1}
                    onClick={() => {
                      setSelectedChapter(prev => {
                        setHighlightedVerses([]);
                        return prev! - 1;
                      });
                    }}
                    className="p-2 border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30"
                   >
                     <ChevronLeft size={20} />
                   </button>
                   <button 
                    disabled={selectedChapter === selectedBook?.chapters}
                    onClick={() => {
                      setSelectedChapter(prev => {
                        setHighlightedVerses([]);
                        return prev! + 1;
                      });
                    }}
                    className="p-2 border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30"
                   >
                     <ChevronRight size={20} />
                   </button>
                </div>
              </div>

              <div className="space-y-8 font-serif text-xl md:text-2xl font-medium leading-relaxed text-[#0A0A0A]">
                {chapterContent?.verses.map(verse => (
                  <p key={verse.number} id={`verse-${verse.number}`} className={`relative pl-12 group transition-colors duration-500 ${highlightedVerses.includes(verse.number) ? 'bg-olive/10 ring-4 ring-olive/5 rounded-lg -ml-4 pl-16' : ''}`}>
                    <span className={`absolute left-0 top-2 text-[11px] font-black group-hover:text-olive transition-colors ${highlightedVerses.includes(verse.number) ? 'text-olive left-4' : 'text-stone-400'}`}>{verse.number}</span>
                    <span className={verse.type === 'heading' ? 'block text-hunter font-bold text-2xl mt-8 mb-4 ml-[-3rem]' : ''}>
                      {verse.content}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-serif font-bold text-hunter">Search Results</h2>
               <button onClick={() => setView('books')} className="text-xs font-bold text-olive uppercase tracking-widest hover:underline">Back to Books</button>
            </div>
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Searching the Scriptures...</p>
              </div>
            ) : searchResults.length === 0 ? (
               <div className="text-center py-20">
                  <p className="font-serif italic text-stone-400">No results found for "{searchQuery}"</p>
               </div>
            ) : (
              <div className="space-y-6">
                 {searchResults.map((res, i) => (
                   res.info ? (
                     <div key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 flex gap-4">
                        <Info className="text-olive shrink-0" size={24} />
                        <p className="text-stone-600 font-serif leading-relaxed">{res.text}</p>
                     </div>
                   ) : (
                    <div key={i} className="p-6 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-serif font-bold text-hunter text-lg">{res.reference}</p>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                          {translations.find(t => t.id === selectedTranslation)?.name || selectedTranslation}
                        </span>
                      </div>
                      <p className="font-serif text-[#1A1A1A] leading-relaxed italic">{res.text}</p>
                    </div>
                   )
                 ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-10"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-6xl h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
      >
        {/* Viewer Header */}
        <div className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-stone-50 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-stone-200 rounded-full transition-colors text-hunter"
              title="Return to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-hunter/10 items-center justify-center text-hunter shrink-0">
              <BookIcon size={24} />
            </div>
            <div className="truncate">
              <h1 className="text-base md:text-xl font-serif font-bold text-[#1A1A1A] truncate">Holy Bible</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">Scripture Browser</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 lg:mx-8 hidden lg:block">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-hunter transition-colors" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reference (e.g. Genesis 1:1)..."
                className="w-full bg-white border border-stone-200 rounded-2xl py-2 pl-12 pr-4 outline-none focus:border-hunter focus:ring-4 ring-hunter/5 transition-all font-serif italic text-sm"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative group flex items-center gap-1 md:gap-2">
               <span className="hidden sm:inline text-[8px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ver:</span>
               <select 
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-hunter outline-none cursor-pointer hover:border-olive transition-all max-w-[80px] sm:max-w-[200px] shadow-sm appearance-none md:appearance-auto"
               >
                 {translations.map(t => (
                   <option key={t.id} value={t.id}>
                     {t.id} {t.id.length < 5 ? `- ${t.name.split(' ')[0]}` : ''}
                   </option>
                 ))}
               </select>
               <ChevronDown size={12} className="md:hidden text-hunter -ml-6 pointer-events-none" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400"
              title="Close Bible"
            >
              <X size={20} md:size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="p-4 border-b border-stone-100 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference..."
              className="w-full bg-stone-50 rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
            />
          </form>
        </div>

        {/* Main Content Area */}
        {renderContent()}

        {/* Footer / Info */}
        <div className="h-10 px-8 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] shrink-0">
          <p></p>
          {view === 'reading' && <p>{selectedBook?.name} Chapter {selectedChapter}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
