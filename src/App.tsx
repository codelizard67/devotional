import DevotionalBook from './components/DevotionalBook';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

function Main() {
  const { profile, isAuthReady } = useAuth();

  // If we have a profile (optimistic from cache or verified from server), show book instantly
  if (profile) {
    return <DevotionalBook />;
  }

  // While checking auth, show an empty parchment screen to avoid splash flicker
  if (!isAuthReady) {
    return <div className="h-screen w-full bg-[#FDFCF8]" />;
  }

  // Only show login if we are sure the user is unauthenticated
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
