// 플레이어 캐릭터 '꾸로' (assets/castle/kkuro.blend → public/castle/kkuro.glb).
// 속도에 따라 idle·walk·run을 섞고, 등롱을 바치면 bow를 한 번 재생한다. 뿔 색만 플레이어마다 다르다.
import { Suspense, useEffect, useMemo, useRef, type Ref } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FloorDef } from '../../castle/floors';
import { INTERP_DELAY_MS, smoothToward, type Sample } from '../../castle/interpolation';
import { RUN_SPEED, WALK_SPEED } from '../../castle/movement';
import type { RemotePeer } from '../../castle/store';
import { glowTexture } from './floors/sceneParts';

const KKURO_URL = '/castle/kkuro.glb';
const HORN_MATERIAL = 'kk_horn';
const FADE = 6; // 클립 가중치가 목표로 다가가는 속도 (1/s)

let shadowMat: THREE.MeshBasicMaterial | null = null;
/** 발밑 둥근 그림자: 가장자리로 흐려지는 검은 원 (그림자 맵 아님). 모두 같은 재질 한 벌 */
function blobShadowMaterial(): THREE.MeshBasicMaterial {
  shadowMat ??= new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#000', transparent: true, opacity: 0.75, depthWrite: false });
  return shadowMat;
}

interface OniProps {
  hornColor: string;
  nickname: string;
  getSpeed: () => number;
  /** 값이 바뀔 때마다 bow를 한 번 재생 (등롱 바치기) */
  getBowSeq?: () => number;
  isMe?: boolean;
  /** 발밑 그림자 (해치 낙하 중 숨기려고 내 캐릭터가 잡는다) */
  shadowRef?: Ref<THREE.Mesh>;
}

function Kkuro({ hornColor, getSpeed, getBowSeq }: Omit<OniProps, 'nickname' | 'isMe' | 'shadowRef'>) {
  const { scene, animations } = useGLTF(KKURO_URL);
  // 사람마다 독립된 사본: 노드(뼈)와 뿔 재질만 복제한다
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.name === HORN_MATERIAL) {
        const horn = mat.clone();
        horn.color.set(hornColor);
        horn.emissive.set(hornColor);
        horn.emissiveIntensity = 0.25;
        mesh.material = horn;
      }
    });
    return root;
  }, [scene, hornColor]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const clip = (name: string) => mixer.clipAction(THREE.AnimationClip.findByName(animations, name));
    const loop = { idle: clip('idle'), walk: clip('walk'), run: clip('run') };
    Object.values(loop).forEach((a) => a.setEffectiveWeight(0).play());
    loop.idle.setEffectiveWeight(1);
    const bow = clip('bow').setLoop(THREE.LoopOnce, 1);
    return { ...loop, bow };
  }, [mixer, animations]);
  useEffect(() => () => void mixer.stopAllAction(), [mixer]);

  const weights = useRef({ idle: 1, walk: 0, run: 0 });
  const lastBow = useRef(getBowSeq?.() ?? 0);

  useFrame((_, dt) => {
    const s = getSpeed();
    const seq = getBowSeq?.() ?? 0;
    if (seq !== lastBow.current) {
      lastBow.current = seq;
      actions.bow.reset().setEffectiveWeight(1).play();
    }
    // 걷기↔달리기는 속도로 섞는다. bow 중에는 이동 클립을 내린다
    const bowing = actions.bow.isRunning();
    const runK = THREE.MathUtils.clamp((s - WALK_SPEED) / (RUN_SPEED - WALK_SPEED), 0, 1);
    const moving = s > 0.15 ? 1 : 0;
    const target = bowing
      ? { idle: 0, walk: 0, run: 0 }
      : { idle: 1 - moving, walk: moving * (1 - runK), run: moving * runK };
    const k = 1 - Math.exp(-FADE * dt);
    for (const name of ['idle', 'walk', 'run'] as const) {
      weights.current[name] += (target[name] - weights.current[name]) * k;
      actions[name].setEffectiveWeight(weights.current[name]);
    }
    // 발이 미끄러지지 않게 재생 속도를 이동 속도에 맞춘다
    actions.walk.timeScale = moving ? THREE.MathUtils.clamp(s / WALK_SPEED, 0.5, 1.6) : 1;
    actions.run.timeScale = moving ? THREE.MathUtils.clamp(s / RUN_SPEED, 0.7, 1.4) : 1;
    mixer.update(dt);
  });

  return <primitive object={model} />;
}

export function Oni({ hornColor, nickname, getSpeed, getBowSeq, isMe = false, shadowRef }: OniProps) {
  return (
    <group>
      {/* 발밑 그림자 (지면 높이에 붙는다: 캐릭터 그룹이 heightAt 위에 있다) */}
      <mesh ref={shadowRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={blobShadowMaterial()} renderOrder={1}>
        <planeGeometry args={[1.9, 1.9]} />
      </mesh>
      <Suspense fallback={null}>
        <Kkuro hornColor={hornColor} getSpeed={getSpeed} getBowSeq={getBowSeq} />
      </Suspense>
      <Html position={[0, 1.7, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`text-[11px] font-semibold whitespace-nowrap [text-shadow:0_0_4px_#000] ${isMe ? 'text-gold-400' : 'text-ink-200'}`}>{nickname}</div>
      </Html>
    </group>
  );
}

useGLTF.preload(KKURO_URL);

/** 다른 사람: 100ms 과거 시점 보간 + 부드러운 보정 */
export function RemoteOni({ peer, floor }: { peer: RemotePeer; floor: FloorDef }) {
  const ref = useRef<THREE.Group>(null!);
  const shown = useRef<Sample>({ ...peer.buffer.latest, speed: 0 });
  useFrame((_, dt) => {
    const cur = shown.current;
    smoothToward(cur, peer.buffer.sampleAt(performance.now() - INTERP_DELAY_MS), dt);
    ref.current.position.set(cur.x, floor.heightAt(cur.x, cur.z), cur.z);
    ref.current.rotation.y = cur.rot;
  });
  return (
    <group ref={ref}>
      <Oni hornColor={peer.hornColor} nickname={peer.nickname} getSpeed={() => shown.current.speed} />
    </group>
  );
}
