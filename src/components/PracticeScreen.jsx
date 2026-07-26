import { useState, useEffect, useRef } from 'react';
import { usePractice, PRACTICE_STATES } from '../hooks/usePractice';
import CircularTimer from './CircularTimer';
import StepProgress from './StepProgress';

function PracticeScreen({ settings, onComplete, onExit }) {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const hasStarted = useRef(false);

  const practice = usePractice({
    onComplete: onComplete,
  });

  // Start practice on mount
  useEffect(() => {
    if (settings) {
      practice.startPractice(settings);
    }
    return () => {
      practice.stopPractice();
    };
  }, []);

  const handlePauseResume = () => {
    if (isPausedState) {
      practice.resumePractice();
      setIsPausedState(false);
    } else {
      practice.pausePractice();
      setIsPausedState(true);
    }
  };

  const handleStop = () => {
    setShowStopConfirm(true);
  };

  const confirmStop = () => {
    practice.stopPractice();
    setShowStopConfirm(false);
    onExit();
  };

  const handleSkip = () => {
    practice.skipStep();
    setIsPausedState(false);
  };

  if (practice.practiceState === PRACTICE_STATES.COMPLETED) {
    return (
      <div className="practice-screen fade-in">
        <div className="completion-message">
          <div className="completion-icon">🧘</div>
          <h2>Hoàn thành!</h2>
          <p>Bạn đã hoàn thành buổi tập.</p>
        </div>
      </div>
    );
  }

  const getStateDisplay = () => {
    switch (practice.practiceState) {
      case PRACTICE_STATES.PLAYING_BELL:
        return { icon: '🔔', text: 'Chuông...' };
      case PRACTICE_STATES.PLAYING_INTRO:
        return { icon: '🔊', text: practice.currentStep?.name || '' };
      case PRACTICE_STATES.AUM_PLAYING:
        return { icon: '🕉️', text: 'AUM – Thở ra' };
      case PRACTICE_STATES.AUM_SILENCE:
        return { icon: '🌬️', text: 'Hít vào...' };
      case PRACTICE_STATES.COMPLETING:
        return { icon: '✨', text: 'Kết thúc...' };
      default:
        return null;
    }
  };

  const stateDisplay = getStateDisplay();
  const showTimer = practice.practiceState === PRACTICE_STATES.COUNTING;
  const showAumCounter = practice.practiceState === PRACTICE_STATES.AUM_PLAYING || 
                         practice.practiceState === PRACTICE_STATES.AUM_SILENCE;

  return (
    <div className="practice-screen">
      <div className="practice-header">
        <div className="practice-step-label">
          Bước {practice.currentStepIndex + 1}/{practice.totalSteps}
        </div>
        <h2 className="practice-step-name">
          {practice.currentStep?.name || ''}
        </h2>
      </div>

      <div className="practice-main">
        {showTimer && (
          <CircularTimer
            timeLeft={practice.timeLeft}
            totalTime={practice.totalTime}
            progress={practice.progress}
          />
        )}

        {showAumCounter && (
          <div className="aum-display fade-in">
            <div className="aum-icon">🕉️</div>
            <div className="aum-counter">
              Lần {practice.aumCount}/{practice.aumTotal}
            </div>
            <div className="aum-state">
              {practice.practiceState === PRACTICE_STATES.AUM_PLAYING ? 'Thở ra – AUM' : 'Hít vào...'}
            </div>
          </div>
        )}

        {stateDisplay && !showTimer && !showAumCounter && (
          <div className="state-display fade-in">
            <div className="state-icon">{stateDisplay.icon}</div>
            <div className="state-text">{stateDisplay.text}</div>
          </div>
        )}
      </div>

      <StepProgress
        currentIndex={practice.currentStepIndex}
        totalSteps={practice.totalSteps}
      />

      <div className="controls">
        <button
          className="btn-secondary btn-control"
          onClick={handleStop}
          title="Dừng"
        >
          ⏹ Dừng
        </button>
        <button
          className={`btn-primary btn-control btn-pause ${isPausedState ? 'paused' : ''}`}
          onClick={handlePauseResume}
        >
          {isPausedState ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
        </button>
        <button
          className="btn-secondary btn-control"
          onClick={handleSkip}
          title="Bỏ qua"
        >
          ⏭ Bỏ qua
        </button>
      </div>

      {showStopConfirm && (
        <div className="overlay" onClick={() => setShowStopConfirm(false)}>
          <div className="glass-card modal" onClick={(e) => e.stopPropagation()}>
            <h3>Dừng buổi tập?</h3>
            <p>Buổi tập sẽ không được lưu vào lịch sử.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowStopConfirm(false)}>
                Hủy
              </button>
              <button className="btn-danger" onClick={confirmStop}>
                Dừng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeScreen;
