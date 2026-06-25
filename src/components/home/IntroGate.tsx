import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './IntroGate.module.css';

const INTRO_SESSION_KEY = 'infiniteCastleIntroV6';
const READY_THRESHOLD = 0.58;

type IntroStyle = CSSProperties & Record<`--${string}`, string | number>;

const INTRO_CROWS = Array.from({ length: 8 }, (_, index) => {
  const width = 42 + (index % 4) * 18;

  return {
    id: `crow-${index}`,
    x: `${8 + ((index * 17) % 84)}%`,
    y: `${12 + ((index * 23) % 72)}%`,
    z: `${-220 - index * 170}px`,
    width: `${width}px`,
    height: `${Math.round(width * 0.48)}px`,
    delay: `${index * -0.31}s`,
    drift: index % 2 === 0 ? 1 : -1,
  };
});

const ROOM_LAYERS = Array.from({ length: 12 }, (_, index) => ({
  id: `room-${index}`,
  z: `${index * -320}px`,
  rotate: `${(index % 2 === 0 ? 1 : -1) * (2 + (index % 4) * 2)}deg`,
  x: `${((index % 3) - 1) * 4}vw`,
  y: `${((index % 4) - 1.5) * 2.8}vh`,
  glow: 0.28 + (index % 5) * 0.1,
}));

const DROP_LINES = Array.from({ length: 24 }, (_, index) => ({
  id: `drop-line-${index}`,
  left: `${4 + ((index * 9) % 92)}%`,
  height: `${90 + ((index * 23) % 210)}px`,
}));

export default function IntroGate() {
  const gateRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const gate = gateRef.current;
    if (!gate) return undefined;

    const showMainApp = () => {
      document.body.classList.add('show-main');
      setIsActive(false);
    };

    if (sessionStorage.getItem(INTRO_SESSION_KEY)) {
      showMainApp();
      return undefined;
    }

    document.body.classList.remove('show-main');

    const enterButton = gate.querySelector<HTMLButtonElement>('[data-intro-enter]');
    let dropTimeline: gsap.core.Timeline | undefined;
    const cleanupScroll = setupIntroScroll(gate, enterButton);

    const onEnter = () => {
      if (!enterButton || enterButton.disabled) return;

      enterButton.disabled = true;
      cleanupScroll();

      gsap.to(gate, {
        '--approach': 1,
        duration: 0.42,
        ease: 'power2.out',
        onComplete: () => {
          dropTimeline = playIntroDrop(gate, () => {
            sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
            showMainApp();
          });
        },
      });
    };

    enterButton?.addEventListener('click', onEnter);

    return () => {
      enterButton?.removeEventListener('click', onEnter);
      cleanupScroll();
      dropTimeline?.kill();
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className={styles.gate} id="intro-gate" ref={gateRef}>
      <InfiniteCastleScene />
      <div className={styles.content} data-intro-content>
        <span className={styles.subTitle}>INFINITE CASTLE DESCENT</span>
        <h1>GGU-CASTLE</h1>
        <div className={styles.eyebrow}>
          <div className={styles.eyebrowLine} />
          <span className={styles.eyebrowText}>SCROLL TO FALL · SEASON 2026</span>
          <div className={styles.eyebrowLine} />
        </div>
        <button className={styles.enterButton} data-intro-enter type="button">
          ENTER THE INFINITE
        </button>
      </div>
    </div>
  );
}

function InfiniteCastleScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.castleBg} data-intro-bg />
      <div className={styles.viewport}>
        <div className={styles.world} data-intro-world>
          {ROOM_LAYERS.map((room) => (
            <div
              className={styles.roomLayer}
              data-intro-room
              key={room.id}
              style={{
                '--room-z': room.z,
                '--room-rotate': room.rotate,
                '--room-x': room.x,
                '--room-y': room.y,
                '--room-glow': room.glow,
              } as IntroStyle}
            >
              <span className={`${styles.roomWall} ${styles.roomWallTop}`} />
              <span className={`${styles.roomWall} ${styles.roomWallRight}`} />
              <span className={`${styles.roomWall} ${styles.roomWallBottom}`} />
              <span className={`${styles.roomWall} ${styles.roomWallLeft}`} />
              <span className={`${styles.roomBridge} ${styles.roomBridgeA}`} />
              <span className={`${styles.roomBridge} ${styles.roomBridgeB}`} />
              <span className={`${styles.roomWindow} ${styles.roomWindowA}`} />
              <span className={`${styles.roomWindow} ${styles.roomWindowB}`} />
            </div>
          ))}
        </div>
      </div>
      <span className={styles.leadCrow} data-intro-lead-crow>
        <i className={styles.leadCrowBody} />
      </span>
      <div className={styles.vignette} />
      <div className={styles.horizon} data-intro-horizon />
      <div className={styles.crows}>
        {INTRO_CROWS.map((crow) => (
          <span
            className={styles.crow}
            data-intro-crow
            key={crow.id}
            style={{
              left: crow.x,
              top: crow.y,
              width: crow.width,
              height: crow.height,
              '--crow-z': crow.z,
              '--crow-delay': crow.delay,
              '--crow-drift': crow.drift,
            } as IntroStyle}
          />
        ))}
      </div>
      <div className={styles.dropLines}>
        {DROP_LINES.map((line) => (
          <span
            className={styles.dropLine}
            data-intro-line
            key={line.id}
            style={{ left: line.left, height: line.height }}
          />
        ))}
      </div>
      <div className={styles.scrollCopy}>
        <span>SCROLL DOWN</span>
        <b>스크롤 내리세요</b>
      </div>
      <div className={styles.flash} data-intro-flash />
    </div>
  );
}

function setupIntroScroll(gate: HTMLDivElement, enterButton: HTMLButtonElement | null) {
  let approach = 0;
  let startY: number | null = null;

  if (enterButton) enterButton.disabled = true;

  const worldDrift = gsap.to(gate, {
    '--drift-z': '4deg',
    '--drift-x': '-7deg',
    duration: 6.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  const setApproach = (next: number) => {
    approach = gsap.utils.clamp(0, 1, next);
    const isReady = approach > READY_THRESHOLD;

    gate.classList.toggle(styles.ready, isReady);
    if (enterButton) enterButton.disabled = !isReady;

    gsap.to(gate, {
      '--approach': approach,
      duration: 0.55,
      ease: 'power2.out',
    });
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    setApproach(approach + event.deltaY * 0.0014);
  };

  const onTouchStart = (event: TouchEvent) => {
    startY = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (startY === null) return;
    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = startY - currentY;
    startY = currentY;
    setApproach(approach + delta * 0.004);
  };

  gate.addEventListener('wheel', onWheel, { passive: false });
  gate.addEventListener('touchstart', onTouchStart, { passive: true });
  gate.addEventListener('touchmove', onTouchMove, { passive: true });

  gsap.from(gate.querySelectorAll('[data-intro-room]'), {
    autoAlpha: 0,
    stagger: 0.025,
    duration: 1.1,
    ease: 'power3.out',
  });

  gsap.from(gate.querySelectorAll('[data-intro-crow]'), {
    autoAlpha: 0,
    stagger: 0.04,
    duration: 0.9,
    ease: 'power3.out',
  });

  return () => {
    worldDrift.kill();
    gate.removeEventListener('wheel', onWheel);
    gate.removeEventListener('touchstart', onTouchStart);
    gate.removeEventListener('touchmove', onTouchMove);
  };
}

function playIntroDrop(gate: HTMLDivElement, onComplete: () => void) {
  const content = gate.querySelector('[data-intro-content]');
  const leadCrow = gate.querySelector('[data-intro-lead-crow]');
  const flash = gate.querySelector('[data-intro-flash]');
  const rooms = gate.querySelectorAll('[data-intro-room]');
  const crows = gate.querySelectorAll('[data-intro-crow]');
  const speedLines = gate.querySelectorAll('[data-intro-line]');

  gate.classList.add(styles.falling);
  document.body.classList.add('show-main');

  gsap.set(speedLines, {
    autoAlpha: 0,
    scaleY: 0.2,
    yPercent: -80,
    transformOrigin: '50% 50%',
  });

  return gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete })
    .to(content, { autoAlpha: 0, y: -76, scale: 0.76, duration: 0.55 }, 0)
    .to(gate, { '--fall': 1, '--approach': 1, duration: 2.85, ease: 'power3.in' }, 0)
    .to(rooms, {
      autoAlpha: 1,
      filter: 'brightness(1.12) blur(0.25px)',
      duration: 2.55,
      stagger: 0.035,
      ease: 'power3.in',
    }, 0.15)
    .to(leadCrow, { autoAlpha: 0, duration: 1.95, ease: 'power3.in' }, 0.18)
    .to(crows, { autoAlpha: 0, duration: 1.8, stagger: 0.045, ease: 'power3.in' }, 0.28)
    .to(speedLines, {
      autoAlpha: 0.92,
      scaleY: 4.2,
      yPercent: 460,
      duration: 1.15,
      stagger: 0.014,
      ease: 'power3.in',
    }, 0.32)
    .to(flash, { autoAlpha: 0.18, duration: 0.18, ease: 'power2.out' }, 2.28)
    .to(flash, { autoAlpha: 0, duration: 0.46, ease: 'power2.out' }, 2.46)
    .to(gate, { autoAlpha: 0, duration: 0.46, ease: 'power2.out' }, 2.55);
}
