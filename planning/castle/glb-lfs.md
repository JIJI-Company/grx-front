# 석상 GLB는 Git LFS로 관리한다 (2026-11-14)

## 무엇을, 왜

- 대상: `public/castle/statues/*.glb`만 (`.gitattributes`). 기존 `public/castle/kkuro.glb`·`lantern.glb`·`trophies.glb` 등은 지금처럼 일반 파일로 둔다.
- 이유: 석상 GLB는 한 명 7~10MB이고 모델을 자주 다시 만든다. 일반 커밋이면 고칠 때마다 전체가 기록에 쌓여 클론이 계속 무거워진다. LFS는 저장소에 수백 바이트짜리 안내 파일만 커밋하고 실제 파일은 GitHub LFS 저장소에 둔다.
- 커밋하는 파일: mock 설정으로 쓰는 것만
  - 돌 석상 `{slug}.glb` 7개 (gguu·nanana·damu·okdok·yuntami·moya·yamuza)
  - B안 채색 `{slug}_face_paint.glb` 7개
  - 조각 시험 `yuntami_sculpt.glb`
  - 꾸티뉴 비교용 중간 결과(`gguu_color`·`gguu_paint`·`gguu_hd_paint`)는 `.gitignore`로 뺀다
- 원본·생성 도구는 저장소 밖 `gguhansung/assets/castle/statues/` (statues-20261113.md).

## 받는 사람

```bash
sudo apt install git-lfs     # 또는 https://git-lfs.com
git lfs install              # 컴퓨터마다 한 번 (git hook 설정)
git pull                     # 이후로는 pull·checkout 때 GLB가 자동으로 받아진다
```

- 이미 LFS 없이 받았다면: `git lfs install && git lfs pull`
- LFS 없이 받으면 GLB 자리에 안내 파일(텍스트)만 있다. 그래도 화면은 깨지지 않는다 — 모델을 못 불러오면 `Statue.tsx`가 임시 도형으로 돌아간다(콘솔 경고 1줄).
- 확인: `git lfs ls-files` 에 석상 파일이 나오면 정상.

## 올리는 사람

```bash
# 새 GLB를 public/castle/statues/ 에 둔 뒤 — .gitattributes가 있어 평소처럼 add하면 LFS로 간다
git add public/castle/statues/<slug>_face_paint.glb
git lfs status               # "LFS" 로 표시되는지 확인
git commit && git push
```

- 새 파일 패턴(예: 다른 변형 이름)을 `.gitignore`에서 빼야 할 수 있다.
- 시험용 변형을 마구 올리지 말 것: 지운 파일도 LFS 저장 용량을 계속 차지한다.

## 한도와 배포

- GitHub LFS 무료 한도는 저장 1GB·월 다운로드 1GB (조직 저장소는 조직 요금제를 따른다). 석상 15개 ≈ 67MB라 저장은 여유, 여러 사람이 자주 받으면 다운로드 한도를 본다.
- 배포(Netlify·Vercel): 운영에서는 서버 `modelUrl`이 `null`이라 이 GLB를 읽지 않는다. Vercel은 프로젝트 설정에서 Git LFS를 켜야 실제 파일이 받아지고, 꺼져 있으면 안내 파일만 배포된다 — 지금은 쓰지 않으니 문제없지만, 운영에서 이 경로를 쓰게 되면 켜야 한다. 운영 반영은 원래 계획대로 R2 등에 올려 `modelUrl`로 주는 쪽을 권한다(statues-20261113.md 남은 일 4).
