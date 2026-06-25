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

// TMI text uses mixed separators in the source data: some members use `<br>`,
// others end sentences with `.`. Split on both into clean lines for display.
// ponytail: also splits decimals like "3.5" — no such data today; revisit if added.
export function getTmiLines(tmi: string | null | undefined): string[] {
  return (tmi ?? '')
    .split(/<br\s*\/?>|\./)
    .map((line) => line.trim())
    .filter(Boolean);
}
