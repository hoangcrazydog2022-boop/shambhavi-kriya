import { useState, useEffect } from 'react';
import { getSessionStats } from '../lib/db';

function StatsScreen({ userId, onNavigateHistory, onBack }) {
  const [stats, setStats] = useState({ totalSessions: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getSessionStats(userId);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [userId]);

  return (
    <div className="stats-screen fade-in">
      <div className="screen-header">
        <button className="btn-icon btn-back" onClick={onBack}>←</button>
        <h1 className="screen-title">Thống kê</h1>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-value">{stats.totalSessions}</div>
              <div className="stat-label">Tổng lần tập</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-value">{stats.thisWeek}</div>
              <div className="stat-label">Tuần này</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-value">{stats.thisMonth}</div>
              <div className="stat-label">Tháng này</div>
            </div>
          </div>

          <button className="btn-secondary btn-full" onClick={onNavigateHistory}>
            📋 Xem lịch sử chi tiết
          </button>
        </>
      )}
    </div>
  );
}

export default StatsScreen;
