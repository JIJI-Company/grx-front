// 서버가 아직 석상 모델 주소(modelUrl)를 주지 않으므로, 저장소의 GLB를 멤버 이름으로 연결한다.
// 운영에서는 검증된 난워니 모델만 연결하고, 개발 서버에서는 나머지 시험 모델도 사용할 수 있다.
//   켜기: VITE_STATUE_MODELS=on  (파일은 멤버당 {파일}_face_paint.glb 하나: 3면도 → Pixal3D 채색 모델.
//   VITE_STATUE_VARIANT로 다른 접미사를 고를 수 있지만 지금 저장소에는 '_face_paint'만 있다)
import type { CastleStatueFloor } from '../api/types';

const PRODUCTION_MODEL_BY_NAME: Record<string, string> = {
  난워니: '/castle/statues/nanana_1119_face_paint.glb?v=56cebb9',
};

/** 멤버 이름 → public/castle/statues/의 파일 이름 (모델 파일 이름이 서버 slug와 다른 멤버가 있다) */
const FILE_BY_NAME: Record<string, string> = {
  꾸티뉴: 'gguu',
  난워니: 'nanana',
  다뮤: 'damu',
  김옥독: 'okdok',
  윤타미: 'yuntami',
  모야: 'moya',
  야무지: 'yamuza',
  만조: 'manjo',
  야뿌: 'yappu',
  하루노츠키: 'tsuki',
};

const ON = import.meta.env.DEV && import.meta.env.VITE_STATUE_MODELS === 'on';
// 임시 비교용: aa9f4e4 직전(11-19)의 _face_paint 모델({파일}_1119_face_paint.glb). 되돌리려면 '_face_paint'
const VARIANT: string = import.meta.env.VITE_STATUE_VARIANT ?? '_1119_face_paint';
/** 멤버별 예외: 윤타미는 11-19 모델 턱 밑 조각 문제로 11-20 모델에 3면도 얼굴을 입힌 파일을 쓴다 */
const VARIANT_BY_NAME: Record<string, string> = { 윤타미: '_1120_face_paint' };

export function withStatueModels(floors: CastleStatueFloor[]): CastleStatueFloor[] {
  return floors.map((f) => ({
    ...f,
    statues: f.statues.map((s) => {
      if (s.modelUrl) return s;
      const productionModel = PRODUCTION_MODEL_BY_NAME[s.stageName];
      if (productionModel) return { ...s, modelUrl: productionModel };
      if (!ON) return s;
      const file = FILE_BY_NAME[s.stageName];
      return file ? { ...s, modelUrl: `/castle/statues/${file}${VARIANT_BY_NAME[s.stageName] ?? VARIANT}.glb` } : s;
    }),
  }));
}
