export interface FanArt {
  id: string;
  title: string;
  authorName: string;
  memberNames: string[];
  imageUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface FanArtMember {
  name: string;
  avatar: string | null;
  color: string;
}

export const FANART_MEMBERS: FanArtMember[] = [
  { name: '꾸티뉴', avatar: '/img/ggutinho.png', color: '#A30000' },
  { name: '야무지', avatar: '/img/yamuzi.png', color: '#7E57C2' },
  { name: '엔쥬', avatar: '/img/enju.png', color: '#7FB3FF' },
  { name: '리카', avatar: '/img/lika.png', color: '#FFD166' },
  { name: '난워니', avatar: '/img/nanana.png', color: '#F4A6C0' },
  { name: '다뮤', avatar: '/img/damu.jpeg', color: '#FF7A45' },
  { name: '딴딴2당', avatar: '/img/ttanttan.jpeg', color: '#A0D8B3' },
  { name: '바먀', avatar: '/img/baamya.png', color: '#C8B6FF' },
  { name: '서라0', avatar: '/img/서라0.jpg', color: '#B0E0FF' },
  { name: '임민트', avatar: '/img/mint.png', color: '#88E0B5' },
  { name: '김옥독', avatar: '/img/okdok.png', color: '#9C6CFF' },
  { name: '냥쏘', avatar: '/img/nangsso.png', color: '#FF9ECF' },
  { name: '윤타미', avatar: '/img/tami.png', color: '#FFD27A' },
  { name: '모야', avatar: '/img/moya.png', color: '#B8C9FF' },
  { name: '란다', avatar: '/img/randa.jpg', color: '#FFB347' },
  { name: '소심해', avatar: '/img/sosim.jpeg', color: '#A8D8EA' },
];

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6a00 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
];

const memberNames = [
  '꾸티뉴', '야무지', '엔쥬', '리카', '냥쏘', '서라0',
  '다뮤', '임민트', '모야', '윤타미', '란다', '김옥독',
];

const titles = [
  '꾸티뉴 검은 갑옷',
  '야무지 달빛 초상화',
  '엔쥬 빙결 일러스트',
  '리카 항아리 술사',
  '냥쏘 핑크빛 전사',
  '서라0 눈꽃 혈귀',
  '다뮤 워터밤 팬아트',
  '임민트 양치의 호흡',
  '모야 신입 혈귀',
  '윤타미 일러스트',
  '란다 스케치',
  '김옥독 순간이동',
];

const authors = [
  '별빛화가', '달빛일러', '꾸한성팬', '그림쟁이',
  '아트마스터', '펜슬드로잉', '디지털아트', '수채화러버',
];

const dims: [number, number][] = [
  [400, 550], [400, 300], [400, 500], [400, 350],
  [400, 600], [400, 400], [400, 450], [400, 320],
  [400, 520], [400, 380], [400, 480], [400, 340],
];

export const MOCK_FANARTS: FanArt[] = Array.from({ length: 12 }, (_, i) => ({
  id: `fanart-${i + 1}`,
  title: titles[i],
  authorName: authors[i % authors.length],
  memberNames: [memberNames[i]],
  imageUrl: gradients[i],
  thumbUrl: gradients[i],
  width: dims[i][0],
  height: dims[i][1],
  createdAt: new Date(2026, 6, 20 + Math.floor(i / 3), 10 + i).toISOString(),
}));
