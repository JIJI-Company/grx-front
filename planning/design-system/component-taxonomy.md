# Component Taxonomy

Status: extracted from code (grx-front `main` @ 6891966, 2026-11-05)

Figma: [꾸한성 게임](https://www.figma.com/design/zGfCShCi3wE7YK0ipJd4Fk/%EA%BE%B8%ED%95%9C%EC%84%B1-%EA%B2%8C%EC%9E%84) — `Foundations` 페이지(토큰·타이포·효과 명세), `Components` 페이지(컴포넌트 11종 + PageShell 쇼케이스). 변수 컬렉션 `Primitives` / `Color` / `Layout`.

Source of truth: `src/styles/tokens.css` (`@theme` + `:root` aliases), component classes in `src/styles/global.css` (`@layer components`), shared React components in `src/components/common/`.

## Token Families

| Token Family | Tokens | Source |
|---|---|---|
| color / surface | `castle-950 #050002`, `castle-900 #0a0002`, `castle-850 #0f0005` | tokens.css `@theme` |
| color / brand | `ruby-950 #7f1020`, `ruby-700 #be123c`, `ruby-600 #e11d48`, `ruby-500 #f43f5e` | tokens.css `@theme` |
| color / accent | `gold-400 #facc15`, `gold-300 #ffe600` | tokens.css `@theme` |
| color / text | `ink-50 #ffffff`, `ink-200 #cccccc`, `ink-300 #aaaaaa`, `ink-400 #888888`, `ink-500 #666666`, `ink-600 #555555` | tokens.css `@theme` |
| color / rank | `--silver #e2e8f0`, `--bronze #e67e22` | tokens.css `:root` |
| color / alpha | `--card-bg rgb(15 0 5 / .64)`, `--glass-border rgb(225 29 72 / .15)`, `--border-red rgb(225 29 72 / .4)` | tokens.css `:root` |
| color / semantic alias | `--main-ruby` → ruby-700, `--bright-rose` → ruby-600, `--rose-accent` → ruby-500, `--name-gold` → gold-400, `--text` → ink-50, `--text-subtle` → ink-300, `--text-muted` → ink-400, `--live` → ruby-600, `--live-dot` → ruby-500, `--live-dot-dim` → ruby-950, `--dark-bg` → castle-950 | tokens.css `:root` |
| typography / family | `font-display` Oswald (300/400/500/700), `font-body` Noto Sans KR (300/400/700/900), Noto Serif KR (500/700/900) for ornamental headings | tokens.css + global.css `@import` |
| typography / role | page-heading `clamp(2.25rem, 7vw, 4rem)` bold ls .08em · section-title `clamp(1.1rem, 2.5vw, 1.5rem)` ls .22em uppercase gold-400 · nav-link `.8rem` bold ls .2rem uppercase · page-subtitle `.875rem` ink-400 · tag `.65rem` ls .14em uppercase | global.css `@layer components` |
| spacing | Tailwind 4 scale (`--spacing(n)`), `spacing-nav 5rem` (= `--nav-h`) | tokens.css |
| layout / container | `container-content 75rem` (page-shell), `container-calendar 87.5rem` (calendar-shell) | tokens.css |
| breakpoint | `xs 30rem`, `nav 52rem`, `wide 90rem` + Tailwind `sm/md/lg/xl` defaults | tokens.css |
| radius | `radius-panel 0.5rem`, `rounded-full` for dots/avatars | tokens.css |
| shadow / glow | `shadow-ruby 0 0 30px rgb(225 29 72 / .3)`, gold hover `0 0 20px rgb(250 204 21 / .2)` | tokens.css + global.css |
| effect / surface | `glass-panel` = bg castle-850 @64% + border ruby-600 @15% + `blur(20px) saturate(180%)` | global.css `@utility` |
| motion | `ease-castle cubic-bezier(.22, 1, .36, 1)`, transitions 300–400ms, `status-pulse 2s infinite`, `spin .8s linear` | tokens.css + global.css |

## Primitive Components

| Component | Purpose | Variants | States | Frontend Mapping |
|---|---|---|---|---|
| Button | 주요 행동 | primary (`.premium-action` / `.premium-view-live-btn`, ruby 보더+호버 글로우), secondary (`.view-all-btn`, gold 보더) | default, hover, focus-visible (`focus-ring` ruby-500 outline) | `className="premium-action"` / `"view-all-btn"` |
| NavLink | 상단 내비 | desktop (`.nav-link`, underline grow), mobile (`.mobile-nav-link`, 보더 박스), dropdown (`.nav-dropdown-link`) | default, hover (can-hover만), active (`aria-current="page"`) | `<NavLink>` + 해당 클래스 |
| Surface / Card | 콘텐츠 컨테이너 | base (`.surface-card` = glass-panel + radius-panel) | default, hover (transition 300ms) | `className="surface-card"` |
| Tag | 분류 라벨 | `.card-tag` / `.times-tag` (ruby 보더 + ruby 텍스트, uppercase) | default | `className="times-tag"` |
| StatusIndicator | 온/오프 표시 | online (green-500 + pulse), offline (ink-600) | — | `className="status-indicator online"` |
| PulseRing | 라이브 점 | ruby-600 2 size + pulse | — | `className="pulse-ring"` |
| Heading | 페이지/섹션 제목 | page (`.page-heading`), section (`.section-title`), glow (`.glow-title` ink→gold→ruby 그라데이션 텍스트) | — | `<PageHeader />`, `className="section-title"` |
| Spinner | 로딩 | ruby 보더 링 40px | — | `<LoadingState />` |

## Composite Components

| Component | Children | Purpose | Responsive Behavior | Frontend Mapping |
|---|---|---|---|---|
| PageShell | Header, MainContent | 페이지 폭·안전영역 | max-w 75rem, padding 4 → sm 6 → lg 12 + `env(safe-area-inset-*)` | `page-shell` / `page-wrap` |
| PageHeader | Heading(glow), Subtitle | 페이지 타이틀 블록 | 중앙 정렬, subtitle margin prop | `common/PageHeader.tsx` (`title`, `subtitle`, `subtitleMarginBottom`) |
| ContentGrid | Card[] | 카드 목록 | 1열 → sm 2열 → xl 3열, gap 5 | `className="content-grid"` |
| ScheduleCard | Date, Title, MemberAvatars, Tag, LiveBadge | 일정 1건 | padding 5 → sm 6 | `common/ScheduleCard.tsx` (`memberLimit`, `showEndTime`, `showSummary`, `showCrewFallback`, `openExternalUrl`) |
| EmptyState | Icon, Message | 빈 목록 | 중앙 정렬, ink-600 | `common/AsyncState.tsx → EmptyState` (`icon`, `message`) |
| LoadingState | Spinner, Message | 로딩 | 중앙 정렬 | `common/AsyncState.tsx → LoadingState` (`message`) |
| CalendarShell | Calendar | 캘린더 전용 넓은 폭 | max-w 87.5rem, padding `clamp(1rem, 5vw, 4.375rem)` | `calendar-shell` |

## Figma 반영 메모

반영 완료 — `design/figma-structure-rules.md`의 네이밍·오토레이아웃·variant 규칙을 따랐다. 변수 컬렉션은 위 Token Families의 그룹 경계(`color/surface`, `color/brand`, `color/accent`, `color/text`, `typography/*`, `layout/*`, `effect/*`)를 모드 없이 1:1로 만들고, 컴포넌트는 Primitive → Composite 순으로 쌓는다. 하드코딩 색은 넣지 않는다.
