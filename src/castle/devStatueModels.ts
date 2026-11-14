// 개발 서버 전용: 서버가 아직 석상 모델 주소(modelUrl)를 주지 않으므로, 저장소에 있는 석상 GLB(Git LFS)를
// 멤버 이름으로 연결해 실제 서버 화면에서도 모델을 볼 수 있게 한다. 배포판에는 영향이 없다(import.meta.env.DEV).
//   켜기: VITE_STATUE_MODELS=on  (VITE_STATUE_VARIANT로 변형 선택, 기본 '_face_paint' = 채색본, '' = 돌 석상)
// 운영 반영은 석상 GLB를 R2에 올리고 서버가 modelUrl을 주는 방식으로 한다(planning/castle/statues-20261113.md).
import type { CastleStatueFloor } from '../api/types';

/** 멤버 이름 → public/castle/statues/의 파일 이름 (모델 파일 이름이 서버 slug와 다른 멤버가 있다) */
const FILE_BY_NAME: Record<string, string> = {
  꾸티뉴: 'gguu',
  난워니: 'nanana',
  다뮤: 'damu',
  김옥독: 'okdok',
  윤타미: 'yuntami',
  모야: 'moya',
  야무지: 'yamuza',
};

const ON = import.meta.env.DEV && import.meta.env.VITE_STATUE_MODELS === 'on';
const VARIANT: string = import.meta.env.VITE_STATUE_VARIANT ?? '_face_paint';

export function withDevStatueModels(floors: CastleStatueFloor[]): CastleStatueFloor[] {
  if (!ON) return floors;
  return floors.map((f) => ({
    ...f,
    statues: f.statues.map((s) => {
      const file = FILE_BY_NAME[s.stageName];
      return file && !s.modelUrl ? { ...s, modelUrl: `/castle/statues/${file}${VARIANT}.glb` } : s;
    }),
  }));
}
