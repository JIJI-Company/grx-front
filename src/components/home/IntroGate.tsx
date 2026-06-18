interface IntroGateProps {
  onEnter: () => void;
}

export default function IntroGate({ onEnter }: IntroGateProps) {
  return (
    <div className="intro-gate" id="intro-gate">
      <div className="gate gate-left" />
      <div className="gate gate-right" />
      <div className="gate-seam" />
      <div className="intro-content">
        <span className="sub-title">UPPER MOON PROJECT</span>
        <h1>GGU-CASTLE</h1>
        <div className="intro-eyebrow">
          <div className="intro-eyebrow-line" />
          <span className="intro-eyebrow-text">INFINITE CASTLE · SEASON 2026</span>
          <div className="intro-eyebrow-line" />
        </div>
        <button id="enter-btn" onClick={onEnter}>ENTER THE INFINITE</button>
      </div>
    </div>
  );
}
