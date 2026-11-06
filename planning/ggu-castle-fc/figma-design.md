# GGU-CASTLE FC — Figma 화면 디자인

- 파일: [꾸한성 게임](https://www.figma.com/design/zGfCShCi3wE7YK0ipJd4Fk/%EA%BE%B8%ED%95%9C%EC%84%B1-%EA%B2%8C%EC%9E%84) → 페이지 `GGU CASTLE FC`
- 기준: 같은 파일의 디자인 시스템(변수 `Primitives`/`Color`/`Layout`, 텍스트 스타일 8, 효과 스타일 4, `Components` 페이지 컴포넌트)과 꾸한성 사이트(https://xn--vv0bj54aswo.site/)
- 기획 근거: [gdd-v1.2.md](gdd-v1.2.md) — 매일 17:00 킥오프, 16:30 라인업 확정, 16:50 예측 마감, 로스터 이동 무제한, 실시간 관전·즉시 리플레이

## 사이트에서 가져온 톤

| 사이트 요소 | 게임 화면 적용 |
|---|---|
| 다크 castle 배경 + 루비 글래스 패널 | 모든 패널 = `color/surface/card`(64%) + `color/border/glass` + Glass/Backdrop Blur |
| 골드 Oswald 대문자 섹션 타이틀(CURRENT MISSION, WEEKLY SCHEDULE) | `Display/Section Title` + `color/accent/gold` — Today's Match, Training, Standings 등 |
| G-CASTLE 헤더 + 넓은 자간 내비, 활성 밑줄 | `AppHeader` = 로고 + `NavLink` Desktop, 활성 탭은 Active 변형 |
| 주간 캘린더의 색 칩(휴방 주황, 일정 루비) | League 주간 일정 — 경기 루비 칩, 휴식 주황 칩, 오늘 루비 테두리 |
| 흰→분홍 그라데이션 대형 타이틀 + 루비 글로우 | `PageHeader` 재사용(TRAINING, LEAGUE), 킥오프 시각 17:00에 Glow/Title |

## 게임 전용 컴포넌트 (페이지 상단 `Components` 섹션)

| 컴포넌트 | 변형 | 용도 | 재사용한 디자인 시스템 요소 |
|---|---|---|---|
| `AppHeader` | — | 상단 바, 우측 다음 마감 배지 | NavLink(Desktop), Glow/Title, border/strong |
| `PlayerCard` | — | 포지션·OVR·컨디션·능력치 5종 | Tag, StatBar, Glass 효과, radius/panel |
| `StatBar` | — | 라벨 + 0~100 막대 + 값 | Display/Status |
| `TimelineStep` | State=Done/Active/Upcoming | 경기일 타임라인 한 단계 | brand/default, accent/gold + Glow/Gold |
| `MinigameCard` | — | 미니게임 카드 | Tag, Button(Primary), spacing/5 |
| `LineupSlot` | State=Filled/Empty | 피치·후보 자리 | surface/raised, brand/default |
| `StandingsRow` | — | 순위표 1행 | border/glass, accent/gold |

막대(StatBar·컨디션)는 Track 한 장의 하드스톱 그라데이션이다. Figma가 인스턴스 안 자식 리사이즈를 무시해서, 값은 fill 오버라이드로 바꾼다. 그라데이션 색은 변수 바인딩이 안 돼 리터럴(ruby #e11d48, gold #facc15, green #22c55e)이다.

## 화면 (y=900 한 줄 배치)

| 프레임 | 주요 섹션 | 일정 규칙 반영 |
|---|---|---|
| `Home / Desktop` | PlayerCard · Today's Match · Today's Training(4장) · League Top 3 · Last Match | 17:00 킥오프, 16:30 확정 카운트다운, 5단계 타임라인(00:00 정산 → 16:30 확정 → 16:50 예측 마감 → 17:00 LIVE → 종료 직후 리플레이), 예측 16:30 오픈 버튼 |
| `Training / Desktop` | PageHeader · 일일 보상 현황(2/4판, 능력치별 24 XP 상한) · 미니게임 6종 | 헤더 마감 배지 |
| `Lineup / Desktop` | 확정 배너 · 2-1-1 피치(선발 5) · 후보 0~3 · 전술 3종 · 로스터 8/8 | 16:30 카운트다운, 확정 후 수정 불가·미제출 자동 명단 안내, 로스터 "16:30 이후 이동은 다음 날부터" 안내 + `내일부터` 태그 선수, 부상 태그 |
| `Match Center / Desktop` | LIVE 스코어보드 · 12시퀀스 진행(하프타임 간격) · Unity 2D 재생 영역 · Live/처음부터 2x/득점 장면만 · 이벤트 피드 · 내 예측 | 실시간 관전과 리플레이 모드 전환, 16:30 고정 확률·16:50 마감, 시드 커밋(종료 후 원문 공개) |
| `League / Desktop` | PageHeader · 주간 일정 7일 · Standings 6팀 · Awards | 매일 17:00 경기 칩, 오늘 LIVE, 홀수 팀 휴식일, 시즌 28경기일 |
| `Home / Mobile` (390) | 상단바 · PlayerCard · 오늘의 경기(세로 타임라인) · 훈련 1장 · 탭바 | 데스크톱 홈과 같은 규칙 |
| `Lineup / Mobile` (390) | 확정 배너 · 피치 · 후보 · 전술 · 하단 고정 저장 | "라인업 저장 · 16:30 잠금" |

## 남은 것

- 멤버 아바타는 이니셜 원형 플레이스홀더다. 실제 멤버 일러스트를 쓰려면 이미지 자산이 필요하다.
- Unity 2D 재생 영역은 와이어 수준(점·공·라인)이다. 실제 경기 연출은 Unity 쪽 아트 작업.
- 미니게임 카드 아트는 텍스트 글리프(PK, GO, 10, ♪, ◆, 6×6)다.
- 화면 상태 변형(16:30 이후 잠금 상태 라인업, 경기 종료 후 리플레이 모드, 예측 열림 상태)은 아직 없다.

---

## v1.2 추가 — 역할별 화면·이적 시장·스토어·로그인 (2026-11-05)

기획 근거: [gdd-v1.2.md](gdd-v1.2.md) 1.4·1.5·5.3·5.4·7.2

### 역할별 헤더

`AppHeader`를 변형 세트로 바꿨다.

| 변형 | 내비 | 역할 배지 | 쓰는 화면 |
|---|---|---|---|
| `Role=Viewer` | Home · Training · Clubs · Match · League · Store | 선수 · Player (골드) | Home, Training, Clubs, Match Center, League, Store |
| `Role=Streamer` | Home · Roster · Lineup · Match · League · Store | 감독 · Manager (루비) | Lineup, Roster Market |

모바일 홈 탭바도 시청자 기준(Home · Training · Clubs · Match · Store)으로 바꿨다.

### 추가 컴포넌트

| 컴포넌트 | 변형 | 용도 |
|---|---|---|
| `AuctionLotCard` | Status=Open / EndingSoon / MyOffer | 이적 시장 매물. 로트 번호·남은 시간·OVR·오퍼 수·역할 분포. 마감 1시간 이내는 골드 테두리 + 루비 타이머 |
| `ClubCard` | State=Open / Applied / Full | 구단 목록. 스트리머·방송 상태·순위·팀 OVR·로스터·모집 슬롯(최대 4)·오퍼 수. Open=나를 오퍼하기 / Applied=내 오퍼 진행 중 |
| `StoreItemCard` | Mode=Shop / Market × Rarity=Common / Rare / Epic | 상점·거래소 상품. 성 포인트(◈) 가격, Market은 판매자·기준가 |
| `RecruitSlotCard` | Status=Open / EndingSoon | 구단 모집 슬롯(선수 → 구단 오퍼의 매물). 포지션·역할·남은 시간·경쟁 오퍼 수·OVR 범위·상위 3 오퍼·낙찰 |
| `RequestRow` | Kind=PlayerOffer / Offer | 받은 선수 오퍼(감독 쪽, 낙찰·거절) / 받은 구단 오퍼(선수 쪽, 수락·거절) |
| `TextField` | State=Default / Focus | 로그인 입력. Focus는 ruby-500 2px |

### 추가 화면 (y=2700 둘째 줄)

| 프레임 | 역할 | 주요 섹션 |
|---|---|---|
| `Roster Market / Desktop` | 스트리머 | 히어로(열린 슬롯 2·받은 선수 오퍼 17·구단 → 선수 오퍼 2/3·로스터 6/8), **Open Slots(주): 모집 슬롯 2 — 선수가 자신을 오퍼, 감독이 낙찰**, Free Agent Scout(보조): 자유계약 매물 3에 구단이 오퍼, 내 로스터(트레이드·방출, 슬롯 2/2), 받은 선수 오퍼 3(낙찰·거절) |
| `Roster Market / Offer Sheet` | 스트리머 | 구단 → 선수 오퍼 모달(보조) — 역할(선발 보장/로테이션/후보)·포지션·주장·등번호·메시지, 동시 3건·포인트 입찰 없음 |
| `Clubs / Player Offer Sheet` | 시청자 | 선수 → 구단 오퍼 모달(주) — 대상 슬롯·경쟁 수, 희망 역할·포지션·희망 등번호·어필 메시지, 내 카드 자동 첨부, 동시 3건·다른 선수 비공개·확정 시 자동 철회 |
| `Clubs / Desktop` | 시청자 | 내 상태 바(자유계약·보낸 오퍼 1/3·시장 등록 Lot 017·받은 구단 오퍼 5·시장 등록 해제), 슬롯 포지션·방송 중 필터, 구단 카드 6(나를 오퍼하기·오퍼 진행 중·정원 마감), Club Offers(보조, 신뢰도 표시), My Offers(경쟁 수·거절·만료) |
| `Store / Desktop` | 시청자 | CASTLE STORE 히어로 + 성 포인트 지갑(현금 구매·환전·송금 불가), Shop/Market/Inventory 탭, 시즌 한정 세트 배너, 상점 8, 거래소 3 + 판매 등록 가드레일 6줄, "정책 검토 후 오픈" 태그 |
| `Login / Desktop` | 공통 | 사이트 인트로 톤 히어로, SOOP 로그인(권장)·이메일 로그인, 비로그인 둘러보기와 허용 범위 |
| `Onboarding / Role Select` | 공통 | PLAYER(바로 시작) / MANAGER(SOOP 로그인·방송국 확인·운영자 승인 3단계, 승인 대기) |
| `Login / Mobile` | 공통 | 같은 구성 390폭 |

### 남은 것 (v1.2)

- 스트리머용 Home(구단 요약·받은 지원서)과 시청자용 Lineup 읽기 전용 화면은 아직 없다. 기존 Home은 시청자, Lineup은 스트리머 기준이다.
- 모바일 Roster Market·Clubs·Store는 없다.
- 거래소는 기획상 법률/정책 검토 전까지 닫혀 있다. 화면은 오픈 후 모습을 미리 그렸다.
