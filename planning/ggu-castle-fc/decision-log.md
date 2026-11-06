# GGU-CASTLE FC — Feedback Log

### [요구사항] 2026-11-05

- 경기는 하루 중 지정된 시각에 열리고, 특정 시각까지 명단이 확정되도록 기획서에 반영.
- 화면은 디자인 시스템(Figma 꾸한성 게임 파일)과 꾸한성 사이트(https://xn--vv0bj54aswo.site/)에 어울리게 산출.

### [일정 규칙 결정] 2026-11-05

- 경기일: 매일. 킥오프 17:00 KST 고정.
- 라인업(명단) 확정: 킥오프 30분 전 = 16:30.
- 로스터 변경(입단·영입·방출·트레이드): 마감 없음.
- 승부예측 마감: 킥오프 10분 전 = 16:50.
- 결과 확인: 실시간 시뮬레이션 관전, 또는 경기 직후 즉시 리플레이.

### [산출] 2026-11-05

- 기획서 v1.1: `raw/gdd-v1.1.md` — 일정 규칙 반영, 매일 경기에 맞춘 컨디션 재튜닝 제안(열린 문제)
- Figma: 꾸한성 게임 파일 `GGU CASTLE FC` 페이지 — 게임 컴포넌트 7종, 데스크톱 5화면, 모바일 2화면 (`raw/figma-design.md`)
- 생략: Phase C 스택(기획서 8장에 이미 있음), Phase E 템플릿 반영(대상 레포 없음), project-figma 에이전트 대신 메인에서 직접 구축(같은 세션에서 만든 디자인 시스템 ID를 그대로 써야 해서)

### [컨디션 결정] 2026-11-05

- 매일 경기용 컨디션 제안값을 확정: 출전 ΔC = 12 + round((100−STA)/10), 일일 정산 회복 비출전 +15 · 출전 +5. 플레이테스트는 미세 조정만.

### [역할·이적 시장·스토어] 2026-11-05

- 요청: 로스터를 독립 화면(경매장 느낌)으로, 스토어에서 아이템 구매·거래, 스트리머(로스터·라인업)와 시청자(입단 신청) 화면 분리.
- 가정: 경매 입찰은 계약 조건(포인트 입찰 없음), 스토어는 꾸미기 전용·무상 성 포인트·유료 결제 없음, 거래소는 가드레일 + 법률 검토 후 오픈.
- 산출: raw/gdd-v1.2.md
- 추가 요청(작업 중): 로그인으로 시청자·스트리머를 구분. → 1.5 로그인과 역할 결정(SOOP/이메일, 비로그인 범위, 감독 = SOOP 로그인 + 방송국 확인 + 운영자 승인, 1계정 1역할), Login·Role Select 화면.
- Figma: AppHeader Role 변형, AuctionLotCard·ClubCard·StoreItemCard·RequestRow·TextField, Roster Market·Offer Sheet·Clubs·Store·Login(데스크톱/모바일)·Role Select.

### [이적 시장 방향 정정] 2026-11-05

- 사용자 정정: 주 방식은 선수가 클럽에 "나를 써 달라"고 오퍼하는 것. 클럽 → 선수 오퍼도 남겨 둔다.
- 기획서 5.3을 A(선수 → 구단, 모집 슬롯이 매물, 주) / B(구단 → 선수, 보조)로, 5.4를 두 방향 공통 규칙으로 재작성. 데이터 모델 club_applications → recruit_slots·player_offers.
- Figma: RecruitSlotCard 추가, ClubCard CTA "나를 오퍼하기", RequestRow Kind=PlayerOffer, Roster Market 상단 Open Slots, Clubs 문구, Clubs / Player Offer Sheet 추가.
