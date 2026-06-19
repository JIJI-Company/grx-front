import type { Member } from '../../api/types';

export function getMemberRankLabel(member: Member): string {
  const rankSlug = member.rank?.slug;

  if (rankSlug === 'master') return 'MASTER';
  if (rankSlug === 'upper-rank') return `상현 ${member.displayOrder}`;

  if (rankSlug === 'lower-rank') {
    const lowerNumber = member.title?.match(/하현\s*(\d+)/)?.[1];
    return lowerNumber ? `LOWER ${lowerNumber}` : 'LOWER';
  }

  if (rankSlug === 'new') return 'NEW';
  return member.rank?.name ?? '';
}
