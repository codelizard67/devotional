import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, LogIn, Key, Loader2, Heart, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const { user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, registerWithCode, authError, syncProfile, logout } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogle = async () => {
    setError('');
    setIsSubmitting(true);
    await signInWithGoogle();
    setIsSubmitting(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await signInWithEmail(email, password);
    setIsSubmitting(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await signUpWithEmail(email, password);
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const success = await registerWithCode(code);
    if (!success) {
      setError('Invalid access code. Please check your invitation.');
    }
    setIsSubmitting(false);
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

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-stone-50 p-2 border border-stone-100">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'signin' ? 'bg-white text-hunter shadow-sm' : 'text-stone-400'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white text-hunter shadow-sm' : 'text-stone-400'}`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!user ? (
              mode === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">SIGN IN TO YOUR ACCOUNT</p>

                  {authError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                      <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Auth Notice
                      </p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">{authError}</p>
                    </div>
                  )}

                  <form onSubmit={handleEmailSignIn} className="space-y-3 text-left">
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-stone-50 border-2 border-stone-100 focus:border-hunter focus:ring-0 rounded-2xl py-4 pl-11 pr-4 text-sm transition-all"
                        required
                      />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-stone-50 border-2 border-stone-100 focus:border-hunter focus:ring-0 rounded-2xl py-4 px-4 text-sm transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 bg-hunter text-white py-5 rounded-2xl font-bold hover:bg-hunter/90 transition-all shadow-lg shadow-hunter/20 group"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                      SIGN IN
                      <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
                    <div className="relative text-xs uppercase tracking-widest text-stone-400 bg-white px-3 inline-block">Or continue with</div>
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-olive text-white py-5 rounded-2xl font-bold hover:bg-olive/90 transition-all shadow-lg shadow-olive/20"
                  >
                    <LogIn size={20} />
                    GOOGLE
                  </button>

                  <p className="text-[10px] text-stone-400 leading-relaxed px-2">
                    Use email/password to sign in, or Google if that is the account you created.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">CREATE A NEW ACCOUNT</p>

                  {authError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                      <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Auth Notice
                      </p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">{authError}</p>
                    </div>
                  )}

                  <form onSubmit={handleEmailSignUp} className="space-y-3 text-left">
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-stone-50 border-2 border-stone-100 focus:border-hunter focus:ring-0 rounded-2xl py-4 pl-11 pr-4 text-sm transition-all"
                        required
                      />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full bg-stone-50 border-2 border-stone-100 focus:border-hunter focus:ring-0 rounded-2xl py-4 px-4 text-sm transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 bg-hunter text-white py-5 rounded-2xl font-bold hover:bg-hunter/90 transition-all shadow-lg shadow-hunter/20 group"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                      SIGN UP
                      <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
                    <div className="relative text-xs uppercase tracking-widest text-stone-400 bg-white px-3 inline-block">Or use Google</div>
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-olive text-white py-5 rounded-2xl font-bold hover:bg-olive/90 transition-all shadow-lg shadow-olive/20"
                  >
                    <LogIn size={20} />
                    SIGN UP WITH GOOGLE
                  </button>

                  <p className="text-[10px] text-stone-400 leading-relaxed px-2">
                    After signup, you’ll enter your invitation code to activate the account.
                  </p>
                </motion.div>
              )
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

                  <p className="text-[10px] text-stone-400 leading-relaxed px-2">
                    This is the final signup step. Once the code is accepted, your profile is created and you go into the devotional.
                  </p>

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
