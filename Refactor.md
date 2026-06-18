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
