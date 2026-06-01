import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

const DevotionalBook = lazy(() => import('./components/DevotionalBook'));

function Main() {
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      import('./components/DevotionalBook');
    }
  }, [profile]);

  // If we have a profile (optimistic from cache or verified from server), show book instantly
  if (profile) {
    return (
      <Suspense fallback={<div className="h-screen w-full bg-[#FDFCF8]" />}>
        <DevotionalBook />
      </Suspense>
    );
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="bg-[#FDFCF8]">
        <Main />
      </div>
    </AuthProvider>
  );
}
