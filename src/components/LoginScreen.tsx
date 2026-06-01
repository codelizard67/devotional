import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, LogIn, Key, Loader2, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { user, profile, loading, signIn, registerWithCode, authError, syncProfile, logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const success = await registerWithCode(code);
    if (!success) {
      setError('Invalid access code. Please check your invitation.');
      setIsSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    setError('');
    setIsSubmitting(true);
    await syncProfile();
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#F5F6F1] flex items-center justify-center">
        <Loader2 className="text-hunter animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F5F6F1] font-sans flex items-center justify-center overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-hunter rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-olive rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-stone-100"
      >
        <div className="p-10 text-center">
          <div className="mb-8 flex justify-center">
             <div className="w-20 h-20 rounded-full bg-sage/20 flex items-center justify-center text-hunter">
                <Leaf size={40} />
             </div>
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-4">Olive Branch Ministries</h1>
          <p className="text-stone-500 font-serif italic text-lg mb-10 leading-relaxed">
            "When God writes your story through daily devotion and reflection."
          </p>

          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">CONTINUE TO YOUR DEVOTIONAL</p>
                  
                  {authError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                      <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Auth Notice
                      </p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">
                        {authError}
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => signIn()}
                    className="w-full flex items-center justify-center gap-3 bg-hunter text-white py-5 rounded-2xl font-bold hover:bg-hunter/90 transition-all shadow-lg shadow-hunter/20 group"
                  >
                    <LogIn size={20} />
                    SIGN IN WITH GOOGLE
                    <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] hover:text-hunter transition-colors"
                  >
                    {showTroubleshooting ? 'Hide Helper' : 'Login Issues? Click here'}
                  </button>
                </div>

                <AnimatePresence>
                  {showTroubleshooting && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-stone-50 rounded-2xl border border-stone-100 p-4 text-left space-y-3"
                    >
                      <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                        If you are using <span className="font-bold">olivebranchministry.us</span>, ensure you enabled "Popups" and "Third-party cookies" in your browser. 
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                        ⚠️ PORTAL TIP: If you opened this link from another app (like iMessage or Facebook), please open it in Safari or Chrome instead for a stable login.
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-50"
                        >
                          Refresh Page
                        </button>
                        <button 
                          onClick={logout}
                          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50"
                        >
                          Hard Reset (Logout)
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : !profile ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-6"
              >
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={14} className="text-hunter" />
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">ACCESS CODE REQUIRED</label>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE (OBM-XXXX-XXXX)"
                      required
                      className="w-full bg-stone-50 border-2 border-stone-100 focus:border-hunter focus:ring-0 rounded-2xl py-4 px-6 font-mono text-center tracking-widest text-hunter transition-all uppercase placeholder:text-stone-300"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 bg-olive text-white py-5 rounded-2xl font-bold hover:bg-olive/90 transition-all shadow-lg shadow-olive/20"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                    CLAIM ACCESS
                  </button>
                  
                  <div className="flex justify-between px-2">
                    <button 
                      type="button"
                      onClick={handleManualSync}
                      className="text-[10px] font-bold text-stone-400 hover:text-hunter transition-colors uppercase tracking-widest"
                    >
                      Sync Profile
                    </button>
                    <button 
                      type="button"
                      onClick={logout}
                      className="text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
                
                <p className="text-[10px] text-stone-400 font-medium italic">
                  Signed in as {user.email}. Check your invitation for your unique code.
                </p>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="bg-sage/10 p-6 text-center border-t border-stone-50">
           <div className="flex items-center justify-center gap-2 text-hunter">
              <Heart size={14} fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Restoring Your Inner Peace</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
