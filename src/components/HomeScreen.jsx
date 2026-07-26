import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile } from '../lib/db';
import { DEFAULT_SETTINGS } from '../lib/steps';

function HomeScreen({ user, onStartPractice, onNavigateStats, onSignOut }) {
  const [aumVariant, setAumVariant] = useState(DEFAULT_SETTINGS.aumVariant);
  const [catStretchMin, setCatStretchMin] = useState(4);
  const [catStretchSec, setCatStretchSec] = useState(30);
  const [bandhaMin, setBandhaMin] = useState(2);
  const [bandhaSec, setBandhaSec] = useState(30);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile(user.id);
        if (profile) {
          setAumVariant(profile.aum_variant || DEFAULT_SETTINGS.aumVariant);
          const catSec = profile.cat_stretch_duration || DEFAULT_SETTINGS.catStretchDuration;
          setCatStretchMin(Math.floor(catSec / 60));
          setCatStretchSec(catSec % 60);
          const banSec = profile.bandha_duration || DEFAULT_SETTINGS.bandhaDuration;
          setBandhaMin(Math.floor(banSec / 60));
          setBandhaSec(banSec % 60);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [user.id]);

  const saveSettings = useCallback(async (newSettings) => {
    try {
      await updateProfile(user.id, newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [user.id]);

  const handleAumChange = (e) => {
    const val = Number(e.target.value);
    setAumVariant(val);
    saveSettings({ aum_variant: val });
  };

  const handleCatStretchChange = (min, sec) => {
    setCatStretchMin(min);
    setCatStretchSec(sec);
    const totalSec = min * 60 + sec;
    saveSettings({ cat_stretch_duration: totalSec });
  };

  const handleBandhaChange = (min, sec) => {
    setBandhaMin(min);
    setBandhaSec(sec);
    const totalSec = min * 60 + sec;
    saveSettings({ bandha_duration: totalSec });
  };

  const handleStart = () => {
    onStartPractice({
      aumVariant,
      catStretchDuration: catStretchMin * 60 + catStretchSec,
      bandhaDuration: bandhaMin * 60 + bandhaSec,
    });
  };

  if (loadingProfile) {
    return (
      <div className="home-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <div className="home-header">
        <button className="btn-icon btn-signout" onClick={onSignOut} title="Đăng xuất">
          ⏻
        </button>
      </div>

      <div className="home-branding">
        <div className="home-icon">🪷</div>
        <h1 className="home-title">Shambhavi Mahamudra</h1>
        <p className="home-subtitle">Kriya</p>
      </div>

      <div className="glass-card settings-card">
        <div className="setting-item">
          <div className="setting-label">
            <label htmlFor="aum-select">Phát âm AUM</label>
          </div>
          <div className="setting-control">
            <select
              id="aum-select"
              className="select-dropdown"
              value={aumVariant}
              onChange={handleAumChange}
            >
              <option value={5}>5 giây</option>
              <option value={6}>6 giây</option>
              <option value={7}>7 giây</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>Mèo duỗi</span>
          </div>
          <div className="time-input-container">
            <input
              type="number"
              className="time-input"
              min="0"
              max="30"
              value={catStretchMin}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                handleCatStretchChange(val, catStretchSec);
              }}
            />
            <span className="time-separator">:</span>
            <input
              type="number"
              className="time-input"
              min="0"
              max="59"
              value={catStretchSec}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                handleCatStretchChange(catStretchMin, val);
              }}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>Khóa Bandhas</span>
          </div>
          <div className="time-input-container">
            <input
              type="number"
              className="time-input"
              min="0"
              max="30"
              value={bandhaMin}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                handleBandhaChange(val, bandhaSec);
              }}
            />
            <span className="time-separator">:</span>
            <input
              type="number"
              className="time-input"
              min="0"
              max="59"
              value={bandhaSec}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                handleBandhaChange(bandhaMin, val);
              }}
            />
          </div>
        </div>
      </div>

      <button className="btn-primary btn-start" onClick={handleStart}>
        <span className="btn-start-icon">▶</span>
        <span>Bắt đầu tập</span>
      </button>

      <button className="btn-secondary btn-stats" onClick={onNavigateStats}>
        📊 Thống kê
      </button>
    </div>
  );
}

export default HomeScreen;
