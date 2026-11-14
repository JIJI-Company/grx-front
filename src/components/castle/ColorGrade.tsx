// 층별 색감: 톤 매핑 뒤에 lift·gain·채도를 건다 (castle/floors.ts의 grade).
// postprocessing은 @react-three/postprocessing이 쓰는 같은 패키지다 (새 의존성 아님).
import { useEffect, useMemo } from 'react';
import { Effect } from 'postprocessing';
import { Uniform, Vector3 } from 'three';
import type { FloorGrade } from '../../castle/floors';

const FRAGMENT = /* glsl */ `
uniform vec3 lift;
uniform vec3 gain;
uniform float saturation;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, saturation);
  outputColor = vec4(c * gain + lift * (1.0 - c), inputColor.a);
}`;

class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', FRAGMENT, {
      uniforms: new Map<string, Uniform>([
        ['lift', new Uniform(new Vector3())],
        ['gain', new Uniform(new Vector3(1, 1, 1))],
        ['saturation', new Uniform(1)],
      ]),
    });
  }
}

export default function ColorGrade({ grade }: { grade: FloorGrade }) {
  const effect = useMemo(() => new GradeEffect(), []);
  useEffect(() => {
    effect.uniforms.get('lift')!.value.set(...grade.lift);
    effect.uniforms.get('gain')!.value.set(...grade.gain);
    effect.uniforms.get('saturation')!.value = grade.saturation;
  }, [effect, grade]);
  useEffect(() => () => effect.dispose(), [effect]);
  // dispose={null}을 주면 R3F가 effect.dispose를 null로 덮어써서 위 정리가 터진다 (primitive는 어차피 자동 정리 대상이 아니다)
  return <primitive object={effect} />;
}
