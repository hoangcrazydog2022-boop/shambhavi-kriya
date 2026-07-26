import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { saveSession } from '../lib/db';
import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import PracticeScreen from './PracticeScreen';
import StatsScreen from './StatsScreen';
import HistoryScreen from './HistoryScreen';

function App() {
  const { user, loading, signOut } = useAuth();
  const [screen, setScreen] = useState('home');
  const [practiceSettings, setPracticeSettings] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleStartPractice = useCallback((settings) => {
    setPracticeSettings(settings);
    setScreen('practice');
  }, []);

  const handlePracticeComplete = useCallback(async (sessionData) => {
    try {
      await saveSession({ ...sessionData, user_id: user.id });
      showToast('Đã lưu buổi tập thành công! 🧘');
    } catch (err) {
      console.error('Failed to save session:', err);
      showToast('Lỗi lưu buổi tập', 'error');
    }
    setScreen('home');
  }, [user, showToast]);

  const handlePracticeExit = useCallback(() => {
    setScreen('home');
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          user={user}
          onStartPractice={handleStartPractice}
          onNavigateStats={() => setScreen('stats')}
          onSignOut={signOut}
        />
      )}
      {screen === 'practice' && (
        <PracticeScreen
          settings={practiceSettings}
          onComplete={handlePracticeComplete}
          onExit={handlePracticeExit}
        />
      )}
      {screen === 'stats' && (
        <StatsScreen
          userId={user.id}
          onNavigateHistory={() => setScreen('history')}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          userId={user.id}
          onBack={() => setScreen('stats')}
        />
      )}
      {toast && (
        <div className={`toast toast-${toast.type} slide-up`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
