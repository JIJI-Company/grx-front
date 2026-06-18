// Mock data layer — reads CSVs from /public/mock/ at runtime.
// Activated when VITE_MOCK=true (npm run dev:mock).
// Production builds with VITE_MOCK unset tree-shake this file entirely.

import type {
  MembersGrouped,
  Member,
  ContentList,
  ContentItem,
  LiveStatus,
  YoutubeVideo,
  CalendarEvent,
} from './types';

// ─── CSV parser ───────────────────────────────────────────────────────────────

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const headers = splitLine(lines[0]);
  return lines
    .slice(1)
    .filter(l => l.trim())
    .map(l => {
      const vals = splitLine(l);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    })
    .filter(r => Object.values(r).some(v => v.trim()));
}

async function fetchCsv(name: string): Promise<Record<string, string>[]> {
  const r = await fetch(`/mock/grx - ${name}.csv`);
  if (!r.ok) throw new Error(`Mock CSV not found: grx - ${name}.csv`);
  return parseCsv(await r.text());
}

function imgUrl(s: string): string | null {
  if (!s) return null;
  return s.startsWith('http') ? s : `/${s}`;
}

// ─── Date parser ──────────────────────────────────────────────────────────────

function parseDate(s: string): string | null {
  if (!s) return null;
  const m1 = s.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);             // "2026.05.06"
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}T00:00:00.000Z`;
  const m2 = s.match(/^(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);    // "06.17 15:47"
  if (m2) return `2026-${m2[1]}-${m2[2]}T${m2[3]}:${m2[4]}:00.000Z`;
  const m3 = s.match(/^(\d{4})\.(\d{1,2})$/);                     // "2026.5"
  if (m3) return `${m3[1]}-${m3[2].padStart(2, '0')}-01T00:00:00.000Z`;
  return null;
}

// ─── Static member roster (mirrors backend/prisma/seed.ts) ───────────────────

const R = {
  master: { rankId: 'r1', name: '마스터',  slug: 'master',     displayOrder: 1 },
  upper:  { rankId: 'r2', name: '상현',    slug: 'upper-rank', displayOrder: 2 },
  lower:  { rankId: 'r3', name: '하현',    slug: 'lower-rank', displayOrder: 3 },
  new:    { rankId: 'r4', name: '신입',    slug: 'new',        displayOrder: 4 },
} as const;

function mkMember(
  id: string, name: string, rank: keyof typeof R, order: number,
  art: string, desc: string, tmi: string, kw: string,
  img: string, soopId: string,
): Member {
  return {
    memberId: `m-${id}`,
    stageName: name,
    slug: id,
    title: art || null,
    description: [desc, tmi, kw].filter(Boolean).join('\n') || null,
    isActive: true,
    displayOrder: order,
    rank: R[rank],
    profileAsset: { assetId: `a-${id}`, storageProvider: 'EXTERNAL', publicUrl: `/${img}`, altText: name },
    platformAccounts: [{
      accountId: `acc-${id}`,
      externalUserId: soopId,
      displayName: name,
      channelUrl: `https://www.sooplive.com/station/${soopId}`,
      isPrimary: true,
      platform: { code: 'SOOP', name: 'SOOP', baseUrl: 'https://www.sooplive.com' },
    }],
  };
}

const ALL_MEMBERS: Member[] = [
  mkMember('gguu','꾸티뉴','master',1,'무한 연산','지-캐슬의 마스터.','무한성을 총괄하며 모든 혈귀들을 관리합니다.','#지마스터 #무한성주인','img/ggutinho.png','aksen7833'),
  mkMember('yamuza','야무지','upper',1,'달의 호흡','상현 1위의 검사.','OTT, 잠, 맛있는 음식 좋아함 (콩 싫어함)','#수면괴물 #1등딸래미','img/yamuzi.png','land4968'),
  mkMember('enju','엔쥬','upper',2,'빙결 혈귀술','빙결의 수호자.','베이킹 고수, 연유라떼 러버,(염소 아님)','#북극여우 #GOAT','img/enju.png','northpole'),
  mkMember('lika','리카','upper',5,'항아리 소환','항아리 술사.','연프&애니 광팬, 야채와 벌레 혐오','#아프리카딸 #크앙단','img/lika.png','lika07'),
  mkMember('nanana','난워니','lower',2,'하현 2','하현의 2위.','면 요리 킬러, 배그&마크 좋아함','#기린 #워냥이','img/nanana.png','whiteone325'),
  mkMember('damu','다뮤','lower',4,'하현 4','하현의 4위.','롤 비틱질과 멤버 놀리기가 주특기','#워터밤 #삼샴뮤','img/damu.jpeg','not15987'),
  mkMember('ttanttan','딴딴2당','lower',5,'명사수','으에','칭찬에 약하고 도움이 되고 싶은 에겐','#오독이 #말랑이','img/ttanttan.jpeg','dbsk0708'),
  mkMember('baamya','바먀','lower',6,'바먀','.','미스테리&분탕 취미, 공겜 쥐약','#씨앗아가씨 #바밤바','img/baamya.png','wooyah21'),
  mkMember('seora0','서라0','lower',7,'눈꽃의 호흡','훈병서라공이라 불리는 신입 혈귀.','방송과 별풍선, 바다를 좋아하는 처녀자리 울보공','#훈병서라공 #울보공 #공단이','img/서라0.jpg','o0opha'),
  mkMember('mint','임민트','new',1,'양치의 호흡','반올림하면 2m인 배그 요정.','키 2m를 주장하는 장신, 주력은 배그와 라디오','#엄디 #임팔라 #임맹슈','img/mint.png','mint616'),
  mkMember('okdok','김옥독','new',2,'순간이동술','옥독해옥독해','해산물과 소주를 즐기며 연애프로그램을 싫어함','#옥독해 #표오독 #옥살이','img/okdok.png','niniru'),
  mkMember('nyangsso','냥쏘','new',3,'분홍 혈귀술','해산물과 매운맛에 진심인 핑크빛 게임 고수.','방송-씻기-잠의 무한 굴레에 빠진 스트리밍 중독자, 미나리와 공겜을 극도로 혐오함.','#냥빵 #ENFJ #모몽가 #게임광인','img/nangsso.png','leesoi34'),
  mkMember('yuntami','윤타미','new',4,'윤타미의 호흡','지-캐슬의 신입 혈귀.','상세 정보 업데이트 예정입니다.','#윤타미 #타미 #신입','img/tami.png','dbsthdus111'),
  mkMember('bomsai','봄세이','new',5,'봉인의 호흡','신입 혈귀 봄셍;입니다.','안경 위의 자물쇠에 대한 비밀은 아직 밝혀지지 않았습니다.','#봄세이 #안경 #자물쇠','img/BOMSAI.png','bomsai'),
  mkMember('moya','모야','new',6,'모야의 호흡','신입 혈귀.','상세 정보 업데이트 예정입니다.','#모야 #신입','img/moya.png','neul0908'),
];

const BY_SLUG = Object.fromEntries(ALL_MEMBERS.map(m => [m.slug, m]));
const BY_NAME = Object.fromEntries(ALL_MEMBERS.map(m => [m.stageName, m]));
const BY_SOOP = Object.fromEntries(
  ALL_MEMBERS.flatMap(m => m.platformAccounts.map(a => [a.externalUserId, m]))
);

// ─── Members ──────────────────────────────────────────────────────────────────

export const mockGetMembers = async (): Promise<MembersGrouped> => ({
  master: ALL_MEMBERS.filter(m => m.rank?.slug === 'master'),
  upper:  ALL_MEMBERS.filter(m => m.rank?.slug === 'upper-rank'),
  lower:  ALL_MEMBERS.filter(m => m.rank?.slug === 'lower-rank'),
  new:    ALL_MEMBERS.filter(m => m.rank?.slug === 'new'),
});

export const mockGetMember = async (slug: string): Promise<Member> => {
  const found = BY_SLUG[slug];
  if (!found) throw new Error(`[mock] member not found: ${slug}`);
  return found;
};

// ─── Times CSV → ContentList ──────────────────────────────────────────────────

let _timesCache: ContentItem[] | null = null;

async function getTimesItems(): Promise<ContentItem[]> {
  if (_timesCache) return _timesCache;
  const rows = await fetchCsv('Times');
  _timesCache = rows.map((r, i) => ({
    contentId: `times-${i}`,
    contentType: 'NEWS' as const,
    status: 'PUBLISHED' as const,
    title: r.title,
    summary: r.desc || null,
    body: null,
    externalUrl: r.link || null,
    publishedAt: parseDate(r.date),
    eventStartAt: null,
    eventEndAt: null,
    displayOrder: i + 1,
    category: r.tag ? { name: r.tag, slug: r.tag.toLowerCase().replace(/\s+/g, '-') } : null,
    thumbnailAsset: null,
    contentMembers: [],
  }));
  return _timesCache;
}

export const mockGetContent = async (params?: {
  type?: string; limit?: number; offset?: number;
}): Promise<ContentList> => {
  const all = await getTimesItems();
  // Times CSV only has NEWS; return empty for other types
  const filtered = !params?.type || params.type === 'NEWS' ? all : [];
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  return { total: filtered.length, items: filtered.slice(offset, offset + limit) };
};

// ─── Schedule CSV → ContentItem[] ────────────────────────────────────────────

export const mockGetSchedule = async (): Promise<ContentItem[]> => {
  const rows = await fetchCsv('Schedule');
  return rows.slice(0, 120).map((r, i) => {
    const member = BY_NAME[r.Member] ?? null;
    return {
      contentId: `sch-${i}`,
      contentType: 'SCHEDULE' as const,
      status: 'PUBLISHED' as const,
      title: r.Title || '방송공지',
      summary: r.Description || null,
      body: null,
      externalUrl: r.Link || null,
      publishedAt: parseDate(r.Time),
      eventStartAt: null,
      eventEndAt: null,
      displayOrder: i + 1,
      category: null,
      thumbnailAsset: r.Thumbnail
        ? { assetId: `th-s-${i}`, storageProvider: 'EXTERNAL' as const, publicUrl: imgUrl(r.Thumbnail), altText: r.Title }
        : null,
      contentMembers: member ? [{ member }] : [],
    };
  });
};

// ─── History CSV → ContentItem[] ─────────────────────────────────────────────

export const mockGetHistory = async (): Promise<ContentItem[]> => {
  const rows = await fetchCsv('History');
  return rows.map((r, i) => ({
    contentId: `hist-${i}`,
    contentType: 'GAME_EVENT' as const,
    status: 'PUBLISHED' as const,
    title: `[${(r.medal ?? '').toUpperCase()}] ${r.achievement}`,
    summary: `${r.team} · ${r.type}`,
    body: null,
    externalUrl: null,
    publishedAt: parseDate(r.date),
    eventStartAt: null,
    eventEndAt: null,
    displayOrder: i + 1,
    category: r.type ? { name: r.type, slug: r.category } : null,
    thumbnailAsset: null,
    contentMembers: [],
  }));
};

// ─── Live CSV → LiveStatus[] ──────────────────────────────────────────────────

export const mockGetLiveStatus = async (): Promise<LiveStatus[]> => {
  const rows = await fetchCsv('Live');
  return rows
    .filter(r => r.id)
    .map(r => {
      const member = BY_SOOP[r.id] ?? null;
      return {
        accountId: `acc-${r.id}`,
        memberId: member?.memberId ?? `unk-${r.id}`,
        memberName: r.name || null,
        memberSlug: member?.slug ?? null,
        profileImageUrl: imgUrl(r.profileImg),
        rankSlug: member?.rank?.slug ?? null,
        channelUrl: r.link || null,
        platform: 'SOOP',
        isLive: r.status === 'on-air',
        viewerCount: null,
        liveTitle: r.streamTitle || null,
        streamUrl: r.status === 'on-air' ? (r.link || null) : null,
        streamStatus: r.status === 'on-air' ? 'LIVE' : 'OFFLINE',
        checkedAt: new Date().toISOString(),
      };
    });
};

// ─── YouTube (no CSV → static empty) ─────────────────────────────────────────

export const mockGetYoutubeLatest = async (): Promise<{ items: YoutubeVideo[] }> =>
  ({ items: [] });

// ─── Calendar (Notion schema mock) ───────────────────────────────────────────
// Schedule CSV has no endDate/tags/memo; convert rows to CalendarEvent format
// and pad with static multi-day samples so the calendar UI is exercisable.

export const mockGetCalendar = async (): Promise<CalendarEvent[]> => {
  const rows = await fetchCsv('Schedule');

  const fromCsv: CalendarEvent[] = rows
    .filter(r => r.Title && r.Time)
    .slice(0, 80)
    .map((r, i) => {
      const member = BY_NAME[r.Member] ?? null;
      // Convert "06.17 15:47" → "2026-06-17T15:47:00.000Z"
      let date = parseDate(r.Time) ?? new Date().toISOString();
      return {
        id: `mock-sch-${i}`,
        title: r.Title || '방송공지',
        date,
        endDate: '',
        tags: r.Description?.includes('콘텐츠') ? ['콘텐츠'] : [],
        members: member ? [member.stageName] : (r.Member ? [r.Member] : []),
        platform: 'SOOP',
        url: r.Link || '',
        memo: r.Description || '',
      };
    });

  // Static multi-day samples to demonstrate span rendering
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const d = (offset: number) => { const x = new Date(today); x.setDate(today.getDate() + offset); return x; };

  const samples: CalendarEvent[] = [
    {
      id: 'mock-multi-1',
      title: '지캐슬 콜라보 주간',
      date: fmt(d(-1)) + 'T12:00:00.000Z',
      endDate: fmt(d(2)),
      tags: ['콘텐츠'],
      members: ['꾸티뉴', '야무지'],
      platform: 'SOOP',
      url: '',
      memo: '상현 멤버 콜라보 특집',
    },
    {
      id: 'mock-multi-2',
      title: '엔쥬 휴방',
      date: fmt(d(1)),
      endDate: fmt(d(3)),
      tags: ['휴방'],
      members: ['엔쥬'],
      platform: '',
      url: '',
      memo: '',
    },
    {
      id: 'mock-single-1',
      title: '꾸티뉴 새벽 라디오',
      date: fmt(today) + 'T01:30:00.000Z',
      endDate: '',
      tags: [],
      members: ['꾸티뉴'],
      platform: 'SOOP',
      url: 'https://www.sooplive.com/station/aksen7833',
      memo: '심야 라디오 방송',
    },
    {
      id: 'mock-single-2',
      title: '임민트 배그 솔랭',
      date: fmt(today) + 'T20:00:00.000Z',
      endDate: '',
      tags: [],
      members: ['임민트'],
      platform: 'SOOP',
      url: 'https://www.sooplive.com/station/mint616',
      memo: '',
    },
  ];

  return [...samples, ...fromCsv];
};
