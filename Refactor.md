# Refactor Log

`grx` 프론트엔드의 구조 변경 이력을 버전별로 관리한다.

## Versioning

- 형식: `vMAJOR.MINOR.PATCH`
- MAJOR: 디렉터리 구조, 라우팅, 데이터 흐름처럼 광범위한 변경
- MINOR: 페이지 또는 기능 단위 컴포넌트 재구성
- PATCH: import 정리, 타입 보완, 작은 중복 제거
- 최신 버전을 문서 상단에 추가한다.
- 각 버전에는 변경 범위, 파일 구조, 동작 영향, 검증 결과, 미검증 항목을 기록한다.

---

## v2.3.0 - 2026-06-25

### 목표

- 인트로 진행 중 페이지를 고정하고, 라이브 상태·멤버 이미지 로딩 비용을 줄인다.

### 변경 사항

- 단일 Lenis 인스턴스 핸들을 `src/utils/lenisInstance.ts`로 분리해 Layout과 IntroGate가 부드러운 스크롤을 일시정지·재개하도록 했다(자식 effect 선실행 순서를 stopped 플래그로 보정).
- IntroGate 표시 중 스크롤을 멈추고, 인트로 종료 시 메인을 최상단에서 시작한다. HomeHero 정리.
- 라이브 상태를 마운트 시 1회만 페칭하도록 `useLive`를 조정하고, 멤버 이미지를 lazy-load로 전환했다.

### 변경 파일

- `src/utils/lenisInstance.ts` (신규)
- `src/components/Layout.tsx`
- `src/components/home/IntroGate.tsx`
- `src/components/home/HomeHero.tsx`
- `src/components/home/MemberSlider.tsx`
- `src/components/members/MemberCard.tsx`
- `src/components/members/MemberModal.tsx`
- `src/components/common/ScheduleCard.tsx`
- `src/hooks/useLive.ts`
- `src/styles/global.css`

### Verification

- 빌드·런타임 미실행 (구조 동기화 루프가 커밋 `03fc4bf`, `4d3b54c` 기준으로 자동 기록)

### 미검증 항목

- 인트로 freeze 동작, 멤버 이미지 lazy-load 체감, 라이브 마운트 1회 페칭의 실제 동작은 미검증

## v2.2.0 - 2026-06-23

### 목표

- History 메달 카드의 참가 멤버 텍스트를 오래 호버하면 참가 스트리머의 프로필을 시각적으로 확인할 수 있게 한다.

### 변경 사항

- History의 멤버 이름을 Member 응답의 `personalColor`, Notice 응답의 `streamer.avatar`와 결합하는 순수 표현 로직을 추가했다.
- `.medal-card`에 약 0.5초간 호버하면 원형 아바타와 멤버 색상 이름표를 포털 툴팁으로 표시한다.
- `.medal-card-detail`을 제거하고 참가자 정보는 카드 호버 툴팁에서만 제공한다.
- 메달 숫자 UI를 `public/img/icons/gold.png`, `silver.png`, `bronze.png` 이미지로 교체했다.
- 메달 이미지를 확대하고 카드 제목 크기를 줄였다.
- 스트리머 툴팁은 카드 중앙이 아니라 호버 중인 마우스 위치를 기준으로 표시한다.
- Notion History 데이터베이스의 `image` 속성을 History API 계약에 추가했다.
- 이미지가 있는 메달 카드는 클릭 또는 Enter/Space 입력 시 Y축 flip 애니메이션으로 전환된다.
- 카드 뒷면은 해당 경기의 팬아트 이미지를 전체 영역에 표시한다.
- 가로 슬라이더 overflow에 툴팁이 잘리지 않도록 화면 좌표 기반으로 배치한다.
- 키보드 포커스에서는 지연 없이 툴팁을 표시하고, 데이터가 매칭되지 않으면 기존 멤버 텍스트만 유지한다.

### 변경 파일

- `src/pages/HistoryPage.tsx`
- `src/components/history/AchievementCard.tsx`
- `src/components/history/CardSlider.tsx`
- `src/components/history/historyPresentation.ts`
- `src/styles/global.css`
- `src/api/types.ts`
- `src/api/mockDb.ts`
- `../backend/src/modules/history/history.service.ts`

### Verification

- 사용자 요청에 따라 실행하지 않음

### 미검증 항목

- 빌드, 운영 데이터 기반 멤버 이름 매칭, 실제 호버 지연과 팝오버 위치는 미검증

## v2.1.1 - 2026-06-23

### 목표

- Notice 페이지의 `전체 보기`에서 스트리머별 그룹 순서가 아니라 전체 공지를 최신순으로 확인할 수 있게 한다.

### 변경 사항

- 전체 스트리머의 공지를 하나의 목록으로 펼치고 `date` 내림차순으로 정렬하는 순수 함수를 추가했다.
- `전체 보기` 탭은 정렬된 통합 공지 목록을 렌더링한다.
- 통합 목록에서는 각 카드에 스트리머 이름을 표시해 공지 출처를 유지한다.
- 공지 카드의 `.notice-flag` 앞에 스트리머 원형 아바타를 표시한다.
- 개별 스트리머 탭의 기존 그룹 UI와 공지 순서는 변경하지 않았다.

### 변경 파일

- `src/pages/NoticePage.tsx`
- `src/components/notice/NoticeCard.tsx`
- `src/components/notice/noticePresentation.ts`

### Verification

```bash
npm run build
```

- Result: PASS
- TypeScript project build: PASS
- Vite production build: PASS

```bash
git diff --check
```

- Result: PASS

- 인앱 브라우저 `/notice` 검증:
  - `전체 보기` 활성 상태와 통합 공지 grid 표시: PASS
  - 첫 20개 공지 날짜 내림차순(`06.18` → `06.17`): PASS
  - 통합 카드의 스트리머 이름 표시: PASS
  - 개별 스트리머 탭의 단일 그룹 렌더링: PASS
  - 브라우저 콘솔 오류 없음: PASS

### 미검증 항목

- Mock 데이터로 브라우저 동작을 검증했으며, 운영 백엔드 실데이터 연결 상태는 별도 통합 검증이 필요하다.

## v2.1.0 - 2026-06-19

### 목표

- 운영 legacy Members 화면(`꾸한성.site/members`)과 현재 React `/members`를 동일 viewport에서 비교한다.
- Tailwind 전환 과정에서 달라진 Members 전용 레이아웃과 카드·모달 표현을 legacy 디자인에 맞춘다.
- 현재 API 모델에 없는 정보를 임의로 만들지 않고, 제공되는 멤버 데이터 범위에서 시각적 구조를 복원한다.

### 변경 사항

- Members 페이지 전용 최대 폭을 legacy와 동일한 `1500px`, 좌우 여백을 `6%`로 복원했다.
- 고정 헤더 아래 페이지 시작 위치를 legacy의 전체 `140px` 간격과 맞췄다.
- Members 경로에서 과도한 vignette를 제거하고 legacy의 붉은 radial/grid 배경을 표시한다.
- 계급 제목의 불필요한 하단 구분선을 제거하고 Oswald 700 굵기를 적용했다.
- 카드 외부 컨테이너에 `320 × 420px` 크기 계약을 복원했다.
- 인물 이미지에 별도 portrait 영역과 멤버 색상 기반 하단 그라데이션을 추가했다.
- 카드 계급 라벨을 `MASTER`, `상현 N`, `LOWER N`, `NEW` 형식으로 표시한다.
- 카드 이름과 혈귀술 색상을 멤버 personal color에 연결했다.
- 카드에 키보드 Enter/Space 동작과 접근성 라벨을 추가했다.
- 상세 모달을 legacy의 최대 `850px` 양분 레이아웃으로 재구성했다.
- 모달에 큰 인물 이미지, 계급·이름·키워드·혈귀술·설명·TMI·SOOP CTA 구조를 복원했다.
- legacy에만 있고 현재 API 타입에는 없는 생일과 MBTI 배지는 추가하지 않았다.

### 변경 파일

- `src/pages/MembersPage.tsx`
- `src/components/members/MemberCard.tsx`
- `src/components/members/MemberModal.tsx`
- `src/components/members/memberPresentation.ts`
- `src/styles/global.css`

### Verification

```bash
npm run build
```

- Result: PASS
- TypeScript project build: PASS
- Tailwind/Vite production build: PASS

```bash
git diff --check
```

- Result: PASS

- Chrome desktop visual check:
  - 운영 legacy `꾸한성.site/members`: 확인
  - 로컬 `http://localhost:5173/members`: 확인
  - 페이지 상단 간격, 배경, 제목, 마스터 카드 비율: PASS
  - 카드 클릭과 legacy형 상세 모달 표시: PASS
  - 카드 계급 라벨 및 키보드 접근성 트리: PASS

### 미검증 항목

- 인앱 Browser 연결은 현재 세션에서 제공되지 않아 Browser 플러그인 대신 로컬 Chrome 화면으로 검증했다.
- 모바일 실기기 touch flip 동작은 별도 검증하지 않았다.
- 운영 API에 생일·MBTI 필드가 없으므로 legacy 모달의 해당 배지는 의도적으로 제외했다.

## v2.0.0 - 2026-06-19

### 목표

- 기존 전역 CSS를 Tailwind CSS 4.3 기반의 CSS-first 디자인 시스템으로 전환한다.
- 데스크톱 스타일을 축소하는 방식이 아니라 모바일 전용 내비게이션과 안전한 스크롤 구조를 제공한다.
- 정적 인라인 스타일은 Tailwind utility로 이동하고, 데이터 기반 색상·캘린더 배치처럼 런타임 값만 인라인에 남긴다.
- 기존 dark red/black castle 시각 언어와 live-card 상태 표현을 유지한다.

### Tailwind 구조

- `@tailwindcss/vite`를 Vite 플러그인으로 연결했다.
- `src/styles/tokens.css`의 `@theme`에서 color, font, breakpoint, container, spacing, radius, shadow token을 정의했다.
- `src/styles/global.css`에서 다음 Tailwind 확장 기능을 사용한다.
  - `@utility`: `page-shell`, `calendar-shell`, `glass-panel`, `no-scrollbar`, `focus-ring`
  - `@custom-variant`: `nav-active`, `can-hover`
  - `@variant`: 반응형 page padding과 hover-capable device 상태
  - `@apply`: 공통 card, button, page, modal, grid 패턴
  - `--alpha()`: theme color 투명도 조합
  - `--spacing()`: safe-area padding과 slider scroll padding 계산

### 반응형 변경

- 832px 미만에서는 데스크톱 내비게이션을 숨기고 2열 모바일 메뉴를 제공한다.
- Live, Schedule, History grid는 모바일 1열, 태블릿 2열, 데스크톱 3열로 전환한다.
- Members grid는 모바일 2열부터 시작해 화면 너비에 따라 최대 5열까지 확장한다.
- Weekly Calendar와 전체 Calendar는 7열 내용을 억지로 축소하지 않고 내부 수평 스크롤 컨테이너로 분리해 child clipping을 방지한다.
- modal, CTA, page padding은 safe area와 작은 화면 높이를 고려하도록 변경했다.
- `prefers-reduced-motion`에서는 반복 animation과 transition을 최소화한다.

### 접근성 및 상호작용

- 모바일 메뉴에 `aria-expanded`, `aria-controls`, route change 자동 닫기를 추가했다.
- 클릭 가능한 Live, Schedule, History, Times card에 keyboard focus와 Enter 동작을 추가했다.
- calendar modal에 dialog role, label, close button label을 추가했다.
- focus-visible 공통 ring utility를 적용했다.

### 의존성

- Added: `tailwindcss@4.3.1`, `@tailwindcss/vite@4.3.1`
- Removed: 소스에서 사용되지 않던 `swiper@11.2.10`
- `swiper` 제거 후 production dependency audit는 취약점 0건이다.

### Verification

```bash
npm run build
```

- Result: PASS
- TypeScript project build: PASS
- Tailwind/Vite production build: PASS

```bash
npm audit --omit=dev
```

- Result: PASS
- Production vulnerabilities: 0

```bash
npm audit
```

- Result: FAIL
- Remaining: Vite 5 개발 서버 경로의 `esbuild` advisory 2건 (moderate 1, high 1)
- 자동 수정은 Vite 8 major upgrade를 요구하므로 이번 Tailwind 리팩터링 범위에서는 강제 적용하지 않았다.

```bash
curl http://127.0.0.1:5173/<route>
```

- `/`: 200
- `/live`: 200
- `/members`: 200
- `/history`: 200
- `/times`: 200
- `/schedule`: 200
- `/calendar`: 200
- `/lika`: 200
- `/maintenance`: 200

### 미검증 항목

- 인앱 브라우저가 제공되지 않았고 로컬 앱 제어 권한도 없어 screenshot 기반 desktop/mobile visual regression은 수행하지 못했다.
- 백엔드 실데이터가 연결된 상태의 긴 제목, 많은 일정, 이미지 오류 상태는 별도 통합 검증이 필요하다.

## v1.0.0 - 2026-06-19

### 목표

- 페이지 파일에서 대형 JSX 블록과 내부 컴포넌트를 분리한다.
- 특정 페이지에서만 사용하는 컴포넌트는 `components/<page>/`에 모은다.
- 둘 이상의 페이지에서 반복되는 UI는 `components/common/`에서 관리한다.
- 전역 레이아웃은 페이지 컴포넌트와 분리한다.
- 기존 라우트, API hook, CSS class 계약과 사용자 동작은 유지한다.

### 새 컴포넌트 구조

```text
src/components/
├── calendar/
│   ├── CalendarControls.tsx
│   ├── CalendarModals.tsx
│   ├── CalendarViews.tsx
│   └── calendarUtils.ts
├── common/
│   ├── AsyncState.tsx
│   ├── PageHeader.tsx
│   └── ScheduleCard.tsx
├── history/
│   └── HistoryCard.tsx
├── home/
│   ├── CurrentMissionSection.tsx
│   ├── HomeHero.tsx
│   ├── IntroGate.tsx
│   ├── LiveStatusPanel.tsx
│   ├── MemberSlider.tsx
│   ├── NewsSection.tsx
│   ├── SchedulePreview.tsx
│   ├── WeeklyCalendar.tsx
│   └── YoutubeFeed.tsx
├── layout/
│   ├── SiteBackground.tsx
│   ├── SiteFooter.tsx
│   └── SiteHeader.tsx
├── lika/
│   ├── LikaCharacterInfo.tsx
│   ├── LikaDiary.tsx
│   ├── LikaGallery.tsx
│   └── LikaHero.tsx
├── live/
│   ├── LiveCard.tsx
│   ├── LiveGrid.tsx
│   └── LiveScheduleSection.tsx
├── members/
│   ├── MemberCard.tsx
│   ├── MemberModal.tsx
│   └── MemberRankSection.tsx
└── times/
    └── TimesItem.tsx
```

### 공용 컴포넌트

| 컴포넌트 | 사용 페이지 | 역할 |
| --- | --- | --- |
| `PageHeader` | Live, History, Times, Schedule | 반복되는 페이지 제목과 설명 스타일 통합 |
| `LoadingState` | Members, Lika, History, Times, Schedule | spinner와 선택적 로딩 문구 통합 |
| `EmptyState` | History, Times, Schedule | 빈 데이터 안내 UI 통합 |
| `ScheduleCard` | Live, Schedule | 멤버, 제목, 일정 시간, 설명 렌더링 통합 |

`ScheduleCard`는 페이지별 요구 차이를 props로 처리한다.

- Live: 최대 3명, 간단한 날짜, 읽기 전용
- Schedule: 최대 4명, 종료 시간·설명·외부 링크·CREW fallback 표시

### 페이지별 변경

#### Home

- 인트로 게이트, 히어로, 현재 방송, 일정 미리보기, 주간 캘린더, 뉴스, YouTube, 멤버 슬라이더를 각각 분리했다.
- `HomePage`는 API hook 호출, GSAP 초기화, 섹션 조합만 담당한다.

#### Calendar

- 날짜 변환, 일정 map 생성, 멤버 색상, 이벤트 배치 알고리즘을 `calendarUtils.ts`로 이동했다.
- 월간/주간 뷰, 이벤트/일자 모달, 헤더/필터 컨트롤을 분리했다.
- `CalendarPage`는 조회 상태와 선택 상태, 월/주 전환만 관리한다.
- 직접 사용하던 React Query 호출을 기존 `useCalendar` hook으로 통일했다.

#### Live

- 라이브 카드, 스켈레톤, 라이브 목록, 스케줄 섹션을 분리했다.
- 스케줄 카드는 `common/ScheduleCard`를 재사용한다.

#### Members

- 플립 카드, 상세 모달, 등급별 섹션을 분리했다.
- master/upper/lower/new 반복 JSX를 `MemberRankSection`으로 통합했다.

#### History / Times

- 반복 목록 항목을 `HistoryCard`, `TimesItem`으로 분리했다.
- 공용 페이지 헤더, 로딩, 빈 상태 컴포넌트를 사용한다.

#### Schedule

- 페이지 내부 스케줄 카드 구현을 제거하고 `common/ScheduleCard`를 사용한다.

#### Lika

- 히어로, 캐릭터 정보, 갤러리, 다이어리를 분리했다.
- 다이어리 공개 상태와 애니메이션 책임을 `LikaDiary` 내부로 이동했다.

#### Layout

- 배경, 헤더 내비게이션, 푸터를 각각 분리했다.
- `Layout`은 Lenis 수명주기, 라우트 변경 스크롤 초기화, Outlet 조합만 담당한다.

### 정리 결과

- 페이지 파일 총 라인 수: 1,609줄 → 406줄
- 기존 URL과 router 설정 변경 없음
- 기존 API client와 hook 시그니처 변경 없음
- 기존 전역 CSS class 이름 변경 없음
- 기존 레거시 삭제/마이그레이션 작업은 수정하지 않음

### 타입 보완

- `src/vite-env.d.ts`를 추가해 `import.meta.env`의 Vite 타입을 등록했다.
- 리팩토링 전 기준선 빌드에서 발생하던 `TS2339: Property 'env' does not exist on type 'ImportMeta'` 오류를 제거했다.

### Verification

```bash
npm run build
```

- Result: PASS
- TypeScript project build: PASS
- Vite production build: PASS

```bash
curl http://127.0.0.1:5173/<route>
```

- `/`: 200
- `/live`: 200
- `/members`: 200
- `/history`: 200
- `/times`: 200
- `/schedule`: 200
- `/calendar`: 200
- `/lika`: 200
- `/maintenance`: 200

```bash
python3 scripts/quick_validate.py
```

- Result: FAIL
- Reason: 저장소 루트에 기존 `.claude` 경로가 있어 `forbidden path exists: .claude`가 발생했다.
- Action: 이번 프론트엔드 리팩토링 범위 밖의 기존 사용자 경로이므로 삭제하거나 수정하지 않았다.

### 미검증 항목

- 현재 세션에서 인앱 브라우저를 사용할 수 없어 실제 화면의 시각적 회귀와 클릭 상호작용은 자동 검증하지 못했다.
- 백엔드 API가 연결된 상태의 실데이터 렌더링은 별도 통합 검증이 필요하다.
