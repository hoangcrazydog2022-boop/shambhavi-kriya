import { useState, useEffect } from 'react';
import { getSessions } from '../lib/db';

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryScreen({ userId, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getSessions(userId);
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [userId]);

  return (
    <div className="history-screen fade-in">
      <div className="screen-header">
        <button className="btn-icon btn-back" onClick={onBack}>←</button>
        <h1 className="screen-title">Lịch sử tập</h1>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>Chưa có buổi tập nào.</p>
        </div>
      ) : (
        <div className="history-list">
          {sessions.map((session) => (
            <div key={session.id} className="glass-card history-item">
              <div className="history-date">{formatDate(session.started_at)}</div>
              <div className="history-details">
                <span className="history-detail">
                  ⏱ {formatDuration(session.total_duration)}
                </span>
                <span className="history-detail">
                  🕉️ AUM {session.aum_variant}s
                </span>
                <span className="history-detail">
                  🐱 {formatDuration(session.cat_stretch_duration)}
                </span>
                <span className="history-detail">
                  🔒 {formatDuration(session.bandha_duration)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryScreen;
