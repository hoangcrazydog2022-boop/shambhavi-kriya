function StepProgress({ currentIndex, totalSteps }) {
  return (
    <div className="step-progress">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${
            i < currentIndex ? 'step-completed' :
            i === currentIndex ? 'step-active' :
            'step-pending'
          }`}
        />
      ))}
    </div>
  );
}

export default StepProgress;
